"use server";

import { revalidatePath } from "next/cache";
import { mysql_query, mysql_transaction } from "@/context/mysqlConnection";

// --- 1. GET FULL EXPENSE REPORT (Budget vs Actuals) ---
export async function getExpenseReportAction(reportId) {
    try {
        // Fetch Header
        const [reportRows] = await mysql_query(`
            SELECT er.*, p.name as project_name 
            FROM expense_reports er
            JOIN projects p ON er.project_id = p.internalid
            WHERE er.internalid = ?
        `, [reportId]);

        if (!reportRows) return null;

        // Fetch Lines with Aggregated Actuals (from Time Entries)
        const lines = await mysql_query(`
            SELECT 
                erl.*,
                COALESCE(SUM(t.hours), 0) as actual_hours,
                COUNT(t.internalid) as assigned_entries_count
            FROM expense_report_lines erl
            LEFT JOIN time_entries t ON t.expense_report_line_id = erl.internalid
            WHERE erl.expense_report_id = ?
            GROUP BY erl.internalid
            ORDER BY erl.created_at ASC
        `, [reportId]);

        return {
            report: JSON.parse(JSON.stringify(reportRows)),
            lines: JSON.parse(JSON.stringify(lines))
        };
    } catch (error) {
        console.error("Error fetching expense report:", error);
        return null;
    }
}

// --- 2. GET UNALLOCATED TIME ENTRIES FOR PROJECT ---
export async function getPendingTimeEntriesAction(projectId) {
    try {
        const entries = await mysql_query(`
            SELECT t.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
            FROM time_entries t
            JOIN employees e ON t.employee_id = e.internalid
            WHERE t.project_id = ? 
              AND t.expense_report_line_id IS NULL
              AND t.status = 'Pending'
            ORDER BY t.date ASC
        `, [projectId]);

        return JSON.parse(JSON.stringify(entries));
    } catch (error) {
        return [];
    }
}

// --- 3. ASSIGN TIME ENTRY TO BUDGET LINE ---
export async function assignTimeEntryAction(timeEntryId, expenseLineId) {
    try {
        await mysql_query(`
            UPDATE time_entries 
            SET expense_report_line_id = ?, status = 'Approved' 
            WHERE internalid = ?
        `, [expenseLineId, timeEntryId]);

        revalidatePath("/expense-reports/[id]", "page");
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Inside src/app/expense-reports/actions.js




// --- 4. GENERATE INVOICE FROM EXPENSE REPORT ---
export async function generateInvoiceAction(payload) {
    const { projectId, expenseReportId, customerId, items, subtotal } = payload;

    // Simple tax calculation for demo (e.g., 14.975% for Quebec)
    const taxRate = 0.14975;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Generate a simple Invoice Number (In production, query the latest and increment)
    const invoiceNum = `INV-${Math.floor(Date.now() / 1000)}`;

    try {
        return await mysql_transaction(async (connection) => {
            // 1. Create Invoice Header
            const [invResult] = await connection.execute(`
                INSERT INTO invoices 
                (project_id, expense_report_id, customer_id, invoice_number, issue_date, due_date, subtotal, tax_amount, total_amount, status)
                VALUES (?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, ?, ?, 'Draft')
            `, [projectId, expenseReportId, customerId, invoiceNum, subtotal, taxAmount, totalAmount]);

            const invoiceId = invResult.insertId;

            // 2. Insert Invoice Lines
            if (items.length > 0) {
                const lineQuery = `
                    INSERT INTO invoice_lines 
                    (invoice_id, expense_report_line_id, description, billed_hours, billed_labor_amount) 
                    VALUES ?
                `;

                const lineValues = items.map(item => [
                    invoiceId,
                    item.expense_report_line_id,
                    item.description,
                    item.billed_hours || 0,
                    item.billed_labor_amount || 0
                ]);

                await connection.query(lineQuery, [lineValues]);
            }

            return { success: true, invoiceId };
        });
    } catch (error) {
        console.error("Invoice Generation Error:", error);
        return { success: false, error: error.message };
    }
}