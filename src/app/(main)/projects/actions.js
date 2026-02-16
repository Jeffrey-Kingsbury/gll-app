"use server";

import { revalidatePath } from "next/cache";
import { mysql_query, mysql_transaction } from "@/context/mysqlConnection";

// --- FETCH PROJECTS ---
export async function getProjectsAction({ page = 1, limit = 50, query = "" } = {}) {
    try {
        const offset = (page - 1) * limit;
        const searchTerm = `%${query}%`;

        // JOIN to get Customer Name
        const rows = await mysql_query(`
      SELECT 
        p.*,
        c.name,
        c.first_name,
        c.last_name,
        (SELECT COUNT(*) FROM estimates e WHERE e.project_id = p.internalid) as estimate_count
      FROM projects p
      JOIN customers c ON p.customer_id = c.internalid
      WHERE p.name LIKE ? OR c.name LIKE ? OR c.last_name LIKE ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, searchTerm, limit, offset]);

        // Get Total Count
        const countResult = await mysql_query(`
      SELECT COUNT(*) as total 
      FROM projects p
      JOIN customers c ON p.customer_id = c.internalid
      WHERE p.name LIKE ? OR c.name LIKE ?
    `, [searchTerm, searchTerm]);

        return {
            data: JSON.parse(JSON.stringify(rows)),
            totalCount: countResult[0].total
        };
    } catch (error) {
        console.error("Error fetching projects:", error);
        return { data: [], totalCount: 0 };
    }
}

// --- CREATE PROJECT ---
export async function createProjectAction(formData) {
    const name = formData.get("name");
    const customer_id = formData.get("customer_id"); // Required FK
    const status = formData.get("status") || "Active";
    const budget = parseFloat(formData.get("budget")) || 0;
    const start_date = formData.get("start_date") || null;
    const deadline = formData.get("deadline") || null;

    if (!name || !customer_id) {
        return { success: false, error: "Project Name and Customer are required." };
    }

    try {
        const result = await mysql_query(`
      INSERT INTO projects (name, customer_id, status, budget, start_date, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, customer_id, status, budget, start_date, deadline]);

        revalidatePath("/projects");
        return { success: true, newId: result.insertId };
    } catch (error) {
        console.error("Create Project Error:", error);
        return { success: false, error: error.message };
    }
}

// --- DELETE PROJECT ---
export async function deleteProjectAction(id) {
    try {
        // Optional: Check for estimates first if you want to warn user
        await mysql_query("DELETE FROM projects WHERE internalid = ?", [id]);
        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message }; // Will fail if DB constraints prevent it
    }
}

// --- HELPER: GET CUSTOMERS FOR DROPDOWN ---
export async function getCustomersForDropdownAction() {
    const rows = await mysql_query(`
    SELECT internalid, name
    FROM customers 
    ORDER BY name ASC
  `);
    return JSON.parse(JSON.stringify(rows));
}