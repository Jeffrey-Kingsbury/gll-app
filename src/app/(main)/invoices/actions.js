"use server";

import { mysql_query } from "@/context/mysqlConnection";
import { revalidatePath } from "next/cache";
import { getCurrentEmployeeAction } from "@/app/login/actions";

// --- 1. GET ALL INVOICES (For List Page) ---
export async function getInvoicesAction({ page = 1, limit = 50, query = "" } = {}) {
    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser) return { data: [], totalCount: 0 };

    try {
        const limitInt = Math.max(1, parseInt(limit, 10) || 50);
        const pageInt = Math.max(1, parseInt(page, 10) || 1);
        const offsetInt = (pageInt - 1) * limitInt;
        const searchTerm = `%${query}%`;

        const rows = await mysql_query(`
            SELECT 
                i.*, 
                p.name as project_name, 
                c.name as company_name 
            FROM invoices i
            LEFT JOIN projects p ON i.project_id = p.internalid
            LEFT JOIN customers c ON i.customer_id = c.internalid
            WHERE i.invoice_number LIKE ? OR p.name LIKE ? OR c.name LIKE ?
            ORDER BY i.created_at DESC
            LIMIT ${limitInt} OFFSET ${offsetInt}
        `, [searchTerm, searchTerm, searchTerm]);

        const countResult = await mysql_query(`
            SELECT COUNT(*) as total 
            FROM invoices i
            LEFT JOIN projects p ON i.project_id = p.internalid
            LEFT JOIN customers c ON i.customer_id = c.internalid
            WHERE i.invoice_number LIKE ? OR p.name LIKE ? OR c.name LIKE ?
        `, [searchTerm, searchTerm, searchTerm]);

        return {
            data: JSON.parse(JSON.stringify(rows)),
            totalCount: countResult[0].total
        };
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return { data: [], totalCount: 0 };
    }
}

// --- 2. GET SINGLE INVOICE DETAILS ---
export async function getInvoiceByIdAction(id) {
    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser) return null;

    try {
        const [invoiceRows] = await mysql_query(`
            SELECT 
                i.*, 
                p.name as project_name, 
                c.name as company_name,
                c.email as client_email,
                c.phone as client_phone
            FROM invoices i
            LEFT JOIN projects p ON i.project_id = p.internalid
            LEFT JOIN customers c ON i.customer_id = c.internalid
            WHERE i.internalid = ?
        `, [id]);

        if (invoiceRows.length === 0) return null;

        const lines = await mysql_query(`
            SELECT * FROM invoice_lines WHERE invoice_id = ?
        `, [id]);

        return {
            invoice: JSON.parse(JSON.stringify(invoiceRows[0])),
            lines: JSON.parse(JSON.stringify(lines))
        };
    } catch (error) {
        console.error("Get Invoice Error:", error);
        return null;
    }
}

// --- 3. UPDATE INVOICE STATUS ---
export async function updateInvoiceStatusAction(id, status) {
    const currentUser = await getCurrentEmployeeAction();
    if (!currentUser || currentUser.accessLevel > 2) return { success: false, error: "Unauthorized" };

    try {
        await mysql_query("UPDATE invoices SET status = ? WHERE internalid = ?", [status, id]);
        revalidatePath(`/invoices/${id}`);
        revalidatePath("/invoices");
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}