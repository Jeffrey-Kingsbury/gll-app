"use server";
import { revalidatePath } from "next/cache";
import {
  mysql_executeQueryReadOnly,
  mysql_getProjects,
  mysql_transaction,
  mysql_query
} from "../../../context/mysqlConnection";


// --- ACTIONS ---

export async function getProjectsAction() {
  try {
    const projects = await mysql_getProjects();
    // Normalize data if needed, but returning rows directly is usually fine
    return JSON.parse(JSON.stringify(projects));
  } catch (e) {
    console.error("Error fetching projects", e);
    return [];
  }
}

export async function approveEstimateAction(estimateId) {
  try {
    // We use a transaction to ensure all steps succeed, or everything rolls back
    return await mysql_transaction(async (connection) => {

      // 1. Fetch the estimate details
      const [estRows] = await connection.execute(
        "SELECT * FROM estimates WHERE internalid = ?",
        [estimateId]
      );

      if (estRows.length === 0) throw new Error("Estimate not found.");
      const estimate = estRows[0];

      if (estimate.status === 'Approved') {
        throw new Error("Estimate is already approved.");
      }
      if (!estimate.project_id) {
        throw new Error("Cannot approve an estimate that is not linked to a Project.");
      }

      // 2. Update the Estimate Status
      await connection.execute(
        "UPDATE estimates SET status = 'Approved' WHERE internalid = ?",
        [estimateId]
      );

      // 3. Create the Expense Report (Budget Header)
      const reportName = `Budget: ${estimate.project_name || 'Estimate ' + estimateId}`;
      const [reportResult] = await connection.execute(
        `INSERT INTO expense_reports (project_id, estimate_id, name, status) 
                 VALUES (?, ?, ?, 'Active')`,
        [estimate.project_id, estimateId, reportName]
      );
      const expenseReportId = reportResult.insertId;

      // 4. Fetch Estimate Items
      const [items] = await connection.execute(
        "SELECT * FROM estimate_items WHERE estimate_id = ?",
        [estimateId]
      );

      // 5. Create Expense Report Lines (Budget Lines)
      if (items.length > 0) {
        const lineQuery = `
                    INSERT INTO expense_report_lines 
                    (expense_report_id, task_name, estimated_labor_cost, estimated_material_cost) 
                    VALUES ?
                `;

        // Map items to bulk insert format
        // We use 'subcategory' as the task name, fallback to 'category'
        const lineValues = items.map(item => [
          expenseReportId,
          item.subcategory || item.category || 'Unnamed Task',
          item.labor_cost || 0,
          item.material_cost || 0
        ]);

        // connection.query (not execute) is required for bulk inserting arrays in mysql2
        await connection.query(lineQuery, [lineValues]);
      }

      return { success: true, expenseReportId };
    });
  } catch (error) {
    console.error("Approve Estimate Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getEstimateByIdAction(id) {
  try {
    const [estimate] = await mysql_executeQueryReadOnly(
      "SELECT * FROM estimates WHERE internalid = ?",
      [id]
    );

    if (!estimate) return null;

    const items = await mysql_executeQueryReadOnly(
      "SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY internalid ASC",
      [id]
    );

    return { ...estimate, items };
  } catch (error) {
    console.error("Get Estimate Error:", error);
    return null;
  }
}

// --- UPDATE ESTIMATE ---
export async function updateEstimateAction(internalid, data) {
  try {
    return await mysql_transaction(async (connection) => {
      // 1. Update Main Record
      const updateQuery = `
        UPDATE estimates SET 
          project_name = ?, project_id = ?, client_name = ?,
          labor_total = ?, material_total = ?, 
          admin_fee_percent = ?, admin_fee_amount = ?, 
          subtotal = ?, grand_total = ?, status = ?
        WHERE internalid = ?
      `;

      const values = [
        data.projectName,
        data.selectedProjectId || null,
        data.clientName || 'Unknown Client', // Ensure this is passed
        data.totals.laborTotal,
        data.totals.materialTotal,
        data.adminFee,
        data.totals.adminAmt,
        data.totals.subtotal,
        data.totals.grandTotal,
        data.status || 'Draft',
        internalid
      ];

      await connection.execute(updateQuery, values);

      // 2. Delete Old Items (Simplest way to handle re-ordering/deletions)
      await connection.execute("DELETE FROM estimate_items WHERE estimate_id = ?", [internalid]);

      // 3. Insert New Items
      if (data.items && data.items.length > 0) {
        const itemQuery = `
          INSERT INTO estimate_items (
              estimate_id, code, category, subcategory, details, labor_cost, material_cost
          ) VALUES ?
        `;

        const itemValues = data.items.map(item => [
          internalid,
          item.code,
          item.category || 'Uncategorized',
          item.subcategory,
          item.details,
          item.labor || 0,
          item.material || 0
        ]);

        await connection.query(itemQuery, [itemValues]);
      }

      return { success: true };
    });
  } catch (error) {
    console.error("Update Estimate Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getTemplatesAction() {
  return [
    { id: "default", name: "Standard Renovation" },
    { id: "kitchen", name: "Kitchen Remodel" },
    { id: "bathroom", name: "Bathroom Refresh" },
    { id: "deck", name: "Deck & Patio" },
  ];
}

export async function getTemplateItemsAction(templateId) {
  const baseItems = [
    { code: "100", category: "Demolition", subcategory: "Site Prep", details: "Remove existing fixtures", labor: 0, material: 0 },
    { code: "200", category: "Framing", subcategory: "Lumber", details: "2x4 and 2x6 material", labor: 0, material: 0 },
    { code: "300", category: "Electrical", subcategory: "Rough-in", details: "Wiring and boxes", labor: 0, material: 0 },
  ];

  if (templateId === 'kitchen') {
    return [
      ...baseItems,
      { code: "400", category: "Cabinetry", subcategory: "Install", details: "Base and upper cabinets", labor: 0, material: 0 },
      { code: "401", category: "Cabinetry", subcategory: "Hardware", details: "Handles and pulls", labor: 0, material: 0 },
    ];
  }

  return baseItems;
}

export async function getEstimatesAction({
  sortCol = 'internalid',
  sortDir = 'desc',
  page = 1,
  limit = 50,
  projectId = null
} = {}) {

  const validCols = ['internalid', 'project_name', 'client_name', 'date', 'grand_total', 'status'];

  // Mapping for frontend sort keys to DB columns
  const colMap = {
    'project': 'project_name',
    'client': 'client_name',
    'total': 'grand_total',
    'id': 'internalid'
  };

  const column = colMap[sortCol] || (validCols.includes(sortCol) ? sortCol : 'internalid');
  const direction = sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  try {
    const limitVal = parseInt(limit) || 50;
    const offsetVal = parseInt(offset) || 0;

    let whereClause = "";
    const params = [];

    if (projectId) {
      whereClause = "WHERE project_id = ?";
      params.push(projectId);
    }

    // Add limit/offset to params
    params.push(limitVal, offsetVal);

    const dataQuery = `
      SELECT * FROM estimates 
      ${whereClause}
      ORDER BY ${column} ${direction} 
      LIMIT ? OFFSET ?
    `;
    const data = await mysql_executeQueryReadOnly(dataQuery, params);

    // Count query needs same WHERE
    const countQuery = `SELECT COUNT(*) as total FROM estimates ${whereClause}`;
    const countResult = await mysql_executeQueryReadOnly(countQuery, projectId ? [projectId] : []);
    const totalCount = countResult[0].total;

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    console.error("Fetch Estimates Error:", error);
    // Return empty structure if tables don't exist or other error
    return { data: [], totalCount: 0, totalPages: 0 };
  }
}


export async function saveEstimateAction(data) {
  try {

    return await mysql_transaction(async (connection) => {
      // 1. Prepare Estimate Data
      const projectName = data.projectMode === 'new' ? data.projectName : 'Existing Project'; // Logic to fetch name if existing could be added
      // If existing project, ideally we fetch the name. For now let's prioritize the ID.

      let clientName = data.clientName || 'Unknown Client';

      // Helper: if projectMode is existing, we should probably fetch the project name/client from DB
      // But since we are in a transaction, we can do it here. 
      if (data.projectMode === 'existing' && data.selectedProjectId) {
        const [projs] = await connection.execute("SELECT name FROM projects WHERE internalid = ?", [data.selectedProjectId]);
        if (projs.length > 0) {
          // override with actual data
          clientName = projs[0].name;
        }
      }

      const estimateQuery = `
              INSERT INTO estimates (
                  project_name, project_id, client_name, 
                  labor_total, material_total, 
                  admin_fee_percent, admin_fee_amount, 
                  subtotal, grand_total, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

      const estimateValues = [
        data.projectName || 'Project', // Fallback
        data.selectedProjectId || null,
        clientName,
        data.totals.laborTotal,
        data.totals.materialTotal,
        data.adminFee,
        data.totals.adminAmt,
        data.totals.subtotal,
        data.totals.grandTotal,
        'Draft'
      ];

      const [estResult] = await connection.execute(estimateQuery, estimateValues);
      const newEstimateId = estResult.insertId;

      // 2. Insert Items
      if (data.items && data.items.length > 0) {
        const itemQuery = `
                  INSERT INTO estimate_items (
                      estimate_id, code, category, subcategory, details, labor_cost, material_cost
                  ) VALUES ?
              `;

        const itemValues = data.items.map(item => [
          newEstimateId,
          item.code,
          item.category || 'Uncategorized',
          item.subcategory,
          item.details,
          item.labor || 0,
          item.material || 0
        ]);

        await connection.query(itemQuery, [itemValues]);
      }

      return { success: true, newId: newEstimateId };
    });

  } catch (error) {
    console.error("Save Estimate Error:", error);
    return { success: false, error: error.message };
  }
}