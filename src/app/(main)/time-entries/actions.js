"use server";

import { revalidatePath } from "next/cache";
import { mysql_query } from "@/context/mysqlConnection";
import { getCurrentEmployeeAction } from "@/app/login/actions";
import fs from "fs/promises";
import path from "path";

// --- FETCH TIME ENTRIES ---
export async function getTimeEntriesAction({
    page = 1,
    limit = 50,
    employeeIdFilter = null,
    projectIdFilter = null,
    startDate = null,     // <--- New
    endDate = null,       // <--- New
    sortCol = 'date',     // <--- New
    sortDir = 'desc'      // <--- New
} = {}) {
    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const offsetInt = (pageInt - 1) * limitInt;

    if (isNaN(limitInt) || isNaN(offsetInt)) {
        throw new Error(`Invalid pagination parameters: limit=${limit}, page=${page}`);
    }

    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser) return { data: [], totalCount: 0 };

    const params = [];
    let whereClause = "WHERE 1=1";

    // 1. Security & Employee Filter
    if (currentUser.accessLevel === 3) {
        whereClause += " AND t.employee_id = ?";
        params.push(currentUser.employeeId);
    } else if (employeeIdFilter) {
        whereClause += " AND t.employee_id = ?";
        params.push(employeeIdFilter);
    }

    // 2. Project Filter
    if (projectIdFilter) {
        whereClause += " AND t.project_id = ?";
        params.push(projectIdFilter);
    }

    // 3. Date Range Filter
    if (startDate) {
        whereClause += " AND t.date >= ?";
        params.push(startDate);
    }
    if (endDate) {
        whereClause += " AND t.date <= ?";
        params.push(endDate);
    }

    // 4. Sorting
    // Map friendly names to actual DB columns to prevent SQL injection
    const sortMap = {
        'date': 't.date',
        'employee': 'e.last_name',
        'project': 'p.name',
        'hours': 't.hours',
        'status': 't.status'
    };

    const dbCol = sortMap[sortCol] || 't.date';
    const dbDir = sortDir === 'asc' ? 'ASC' : 'DESC';

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
    ORDER BY ${dbCol} ${dbDir}, t.created_at DESC
    LIMIT ${limitInt} OFFSET ${offsetInt}
  `;

    try {
        const rows = await mysql_query(query, params);

        // Count query needs the same WHERE params
        const countResult = await mysql_query(`
      SELECT COUNT(*) as total 
      FROM time_entries t 
      JOIN projects p ON t.project_id = p.internalid
      JOIN employees e ON t.employee_id = e.internalid
      ${whereClause}
    `, params);

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

// --- HELPER: SAVE IMAGE LOCALLY ---
async function saveTimeEntryImage(file) {
    if (!file || file.size === 0) return null;

    // 1. Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type. Only JPG, PNG, WEBP, and GIF allowed.");
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error("File too large. Max 10MB.");
    }

    // 2. Prepare Path
    const uploadDir = path.join(process.cwd(), "public/system/img/time_entry_img");
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    // 3. Generate Unique Filename
    const ext = file.name.split('.').pop();
    const fileName = `time-${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // 4. Write File
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return the public URL path
    return `/system/img/time_entry_img/${fileName}`;
}

// --- UPDATE: SAVE TIME ENTRY ---
export async function saveTimeEntryAction(formData) {
    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser) return { success: false, error: "Unauthorized" };

    try {
        const internalid = formData.get("internalid");
        const project_id = formData.get("project_id");
        const date = formData.get("date");
        const hours = formData.get("hours");
        const task_name = formData.get("task_name");
        const memo = formData.get("memo");

        // Handle File Upload
        const file = formData.get("image_file"); // <--- New field name
        let image_url = formData.get("existing_image_url"); // Keep old URL if no new file

        if (file && file.size > 0) {
            image_url = await saveTimeEntryImage(file);
        }

        if (internalid) {
            // Check existing permissions...
            const [existing] = await mysql_query("SELECT status, employee_id FROM time_entries WHERE internalid = ?", [internalid]);
            if (!existing) return { success: false, error: "Entry not found" };
            if (currentUser.accessLevel === 3 && existing.status === 'Approved') return { success: false, error: "Locked." };
            if (currentUser.accessLevel === 3 && existing.employee_id !== currentUser.employeeId) return { success: false, error: "Unauthorized." };

            await mysql_query(`
        UPDATE time_entries 
        SET project_id=?, date=?, hours=?, task_name=?, memo=?, image_url=? 
        WHERE internalid=?
      `, [project_id, date, hours, task_name, memo, image_url, internalid]);

        } else {
            await mysql_query(`
        INSERT INTO time_entries (employee_id, project_id, date, hours, task_name, memo, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [currentUser.employeeId, project_id, date, hours, task_name, memo, image_url]);
        }

        revalidatePath("/time-entries");
        return { success: true };
    } catch (error) {
        console.error("Save Error:", error);
        return { success: false, error: error.message };
    }
}

// --- TOGGLE APPROVAL (Admin Only) ---
export async function toggleApprovalAction(id, newStatus) {
    const currentUser = await getCurrentEmployeeAction();
    if (currentUser.accessLevel > 2) return { success: false, error: "Unauthorized" };
    await mysql_query("UPDATE time_entries SET status = ? WHERE internalid = ?", [newStatus, id]);
    revalidatePath("/time-entries");
    return { success: true };
}