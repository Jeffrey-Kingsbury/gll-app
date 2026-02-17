"use server";

import { revalidatePath } from "next/cache";
import { mysql_query } from "@/context/mysqlConnection";

// --- FETCH PROJECTS ---
export async function getProjectsAction({ page = 1, limit = 50, query = "" } = {}) {
    try {
        // FIXED: Explicitly convert input strings to Integers
        const limitInt = parseInt(limit, 10);
        const pageInt = parseInt(page, 10);
        const offsetInt = (pageInt - 1) * limitInt;

        const searchTerm = `%${query}%`;

        // Ensure we don't pass NaN
        if (isNaN(limitInt) || isNaN(offsetInt)) {
            throw new Error(`Invalid pagination parameters: limit=${limit}, page=${page}`);
        }

        const rows = await mysql_query(`
            SELECT 
                p.*,
                c.name as company_name, 
                (SELECT COUNT(*) FROM estimates e WHERE e.project_id = p.internalid) as estimate_count
            FROM projects p
            LEFT JOIN customers c ON p.customer_id = c.internalid
            WHERE p.name LIKE ? OR c.name LIKE ?
            ORDER BY p.created_at DESC
            LIMIT ${limitInt} OFFSET ${offsetInt}
        `, [searchTerm, searchTerm]);

        // Get Total Count
        const countResult = await mysql_query(`
            SELECT COUNT(*) as total 
            FROM projects p
            LEFT JOIN customers c ON p.customer_id = c.internalid
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

// --- GET PROJECT BY ID ---
export async function getProjectByIdAction(id) {
    try {
        // 1. Fetch Project & Customer Details
        const projectRows = await mysql_query(`
            SELECT 
                p.*,
                c.name as company_name,
                c.email as client_email,
                c.phone as client_phone
            FROM projects p
            LEFT JOIN customers c ON p.customer_id = c.internalid
            WHERE p.internalid = ?
        `, [id]);

        if (projectRows.length === 0) return null;
        const project = projectRows[0];

        // 2. Fetch Linked Estimates
        const estimates = await mysql_query(`
            SELECT internalid, created_at, grand_total, status, project_name
            FROM estimates
            WHERE project_id = ?
            ORDER BY created_at DESC
        `, [id]);

        // 3. Fetch Linked Time Entries
        const timeEntries = await mysql_query(`
            SELECT 
                t.*, 
                CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                e.avatar_url
            FROM time_entries t
            LEFT JOIN employees e ON t.employee_id = e.internalid
            WHERE t.project_id = ?
            ORDER BY t.date DESC
        `, [id]);

        return {
            project: JSON.parse(JSON.stringify(project)),
            estimates: JSON.parse(JSON.stringify(estimates)),
            timeEntries: JSON.parse(JSON.stringify(timeEntries))
        };
    } catch (error) {
        console.error("Get Project Error:", error);
        return null;
    }
}
// --- CREATE PROJECT ---
export async function createProjectAction(formData) {
    const name = formData.get("name");
    const customer_id = formData.get("customer_id");
    const status = formData.get("status") || "Active";

    // SAFETY: Handle empty budget string
    const rawBudget = formData.get("budget");
    const budget = rawBudget ? parseFloat(rawBudget) : 0;

    // SAFETY: Convert empty strings to NULL for dates
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
        await mysql_query("DELETE FROM projects WHERE internalid = ?", [id]);
        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// --- HELPER: GET CUSTOMERS FOR DROPDOWN ---
export async function getCustomersForDropdownAction() {
    const rows = await mysql_query(`
        SELECT internalid, name as company_name
        FROM customers 
        ORDER BY name ASC
    `);
    return JSON.parse(JSON.stringify(rows));
}

export async function updateProjectAction(formData) {
    const internalid = formData.get("internalid");
    const name = formData.get("name");
    const status = formData.get("status");
    const budget = parseFloat(formData.get("budget")) || 0;
    const description = formData.get("description");

    // Handle empty dates (convert "" to null)
    const start_date = formData.get("start_date") || null;
    const deadline = formData.get("deadline") || null;

    if (!internalid || !name) {
        return { success: false, error: "Project Name is required." };
    }

    try {
        await mysql_query(`
            UPDATE projects 
            SET name=?, status=?, budget=?, description=?, start_date=?, deadline=?
            WHERE internalid=?
        `, [name, status, budget, description, start_date, deadline, internalid]);

        revalidatePath(`/projects/${internalid}`);
        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error("Update Project Error:", error);
        return { success: false, error: error.message };
    }
}