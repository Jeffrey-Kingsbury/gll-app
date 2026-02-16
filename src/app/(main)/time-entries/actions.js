"use server";

import { revalidatePath } from "next/cache";
import { mysql_query } from "@/context/mysqlConnection";
import { getCurrentEmployeeAction } from "@/app/login/actions";

// --- FETCH TIME ENTRIES ---
export async function getTimeEntriesAction({ page = 1, limit = 50, employeeIdFilter = null, projectIdFilter = null } = {}) {
    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser) return { data: [], totalCount: 0 };

    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = "WHERE 1=1";

    // SECURITY: If user is "Time Entry Only" (Level 3), FORCE filter to their ID
    if (currentUser.accessLevel === 3) {
        whereClause += " AND t.employee_id = ?";
        params.push(currentUser.employeeId);
    } else if (employeeIdFilter) {
        // Admin filtering by specific employee
        whereClause += " AND t.employee_id = ?";
        params.push(employeeIdFilter);
    }

    if (projectIdFilter) {
        whereClause += " AND t.project_id = ?";
        params.push(projectIdFilter);
    }

    const query = `
    SELECT 
      t.*,
      p.name as project_name,
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.avatar_url
    FROM time_entries t
    JOIN projects p ON t.project_id = p.internalid
    JOIN employees e ON t.employee_id = e.internalid
    ${whereClause}
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `;

    // Add limit/offset to params
    params.push(limit, offset);

    try {
        const rows = await mysql_query(query, params);

        // Get total count for pagination
        // Note: We need to replicate the params for the count query (minus limit/offset)
        const countParams = params.slice(0, -2);
        const countResult = await mysql_query(`SELECT COUNT(*) as total FROM time_entries t ${whereClause}`, countParams);

        return {
            data: JSON.parse(JSON.stringify(rows)),
            totalCount: countResult[0].total,
            currentUserLevel: currentUser.accessLevel
        };
    } catch (error) {
        console.error("Error fetching time entries:", error);
        return { data: [], totalCount: 0 };
    }
}

// --- GET TASKS (From Estimates) ---
export async function getProjectTasksAction(projectId) {
    // Fetches items from the most recent estimate linked to this project
    // You might want to adjust this logic if you have multiple active estimates
    const query = `
    SELECT DISTINCT item.subcategory as task_name
    FROM estimate_items item
    JOIN estimates est ON item.estimate_id = est.internalid
    WHERE est.project_id = ?
    ORDER BY item.subcategory ASC
  `;
    const rows = await mysql_query(query, [projectId]);
    return JSON.parse(JSON.stringify(rows));
}

// --- SAVE / UPDATE ENTRY ---
export async function saveTimeEntryAction(formData) {
    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser) return { success: false, error: "Unauthorized" };

    const internalid = formData.get("internalid");
    const project_id = formData.get("project_id");
    const date = formData.get("date");
    const hours = formData.get("hours");
    const task_name = formData.get("task_name");
    const memo = formData.get("memo");
    const image_url = formData.get("image_url"); // Assume upload happens on client first

    // If Editing: Check Security
    if (internalid) {
        const [existing] = await mysql_query("SELECT status, employee_id FROM time_entries WHERE internalid = ?", [internalid]);

        if (!existing) return { success: false, error: "Entry not found" };

        // Rule: Level 3 cannot edit if Approved
        if (currentUser.accessLevel === 3 && existing.status === 'Approved') {
            return { success: false, error: "This entry is Approved and cannot be edited." };
        }

        // Rule: Users can only edit their own (unless Admin)
        if (currentUser.accessLevel === 3 && existing.employee_id !== currentUser.employeeId) {
            return { success: false, error: "You can only edit your own entries." };
        }

        await mysql_query(`
      UPDATE time_entries 
      SET project_id=?, date=?, hours=?, task_name=?, memo=?, image_url=?
      WHERE internalid=?
    `, [project_id, date, hours, task_name, memo, image_url, internalid]);

    } else {
        // Creating New
        await mysql_query(`
      INSERT INTO time_entries (employee_id, project_id, date, hours, task_name, memo, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [currentUser.employeeId, project_id, date, hours, task_name, memo, image_url]);
    }

    revalidatePath("/time-entries");
    return { success: true };
}

// --- TOGGLE APPROVAL (Admin Only) ---
export async function toggleApprovalAction(id, newStatus) {
    const currentUser = await getCurrentEmployeeAction();
    if (currentUser.accessLevel > 2) return { success: false, error: "Unauthorized" };

    await mysql_query("UPDATE time_entries SET status = ? WHERE internalid = ?", [newStatus, id]);
    revalidatePath("/time-entries");
    return { success: true };
}