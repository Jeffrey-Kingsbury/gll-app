"use server";

import { mysql_query } from "@/context/mysqlConnection";

// --- 1. KEY PERFORMANCE INDICATORS (KPIs) ---
export async function getDashboardStatsAction() {
    try {
        // A. Active Projects Count
        const [activeProjects] = await mysql_query(
            "SELECT COUNT(*) as count FROM projects WHERE status = 'Active'"
        );

        // B. Total Estimate Value (Approved/Sent)
        // Adjust status check based on your actual workflow (e.g., 'Approved', 'Sent')
        const [totalEstimates] = await mysql_query(
            "SELECT SUM(grand_total) as total FROM estimates WHERE status != 'Draft'"
        );

        // C. Hours Logged This Week
        // using YEARWEEK to filter for the current week
        const [hoursWeek] = await mysql_query(
            "SELECT SUM(hours) as total FROM time_entries WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)"
        );

        // D. Revenue (Month)
        // Assuming 'Accepted' or similar status for revenue. Using 'Approved' for now.
        const [revenueMonth] = await mysql_query(`
      SELECT SUM(grand_total) as total 
      FROM estimates 
      WHERE status = 'Approved' 
      AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);

        // E. Recent Activity (Projects)
        const recentProjects = await mysql_query(`
      SELECT p.internalid, p.name, p.status, p.budget, c.name as client_name 
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.internalid
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

        return {
            activeProjects: activeProjects.count || 0,
            totalEstimates: totalEstimates.total || 0,
            hoursWeek: hoursWeek.total || 0,
            revenueMonth: revenueMonth.total || 0,
            recentProjects: JSON.parse(JSON.stringify(recentProjects))
        };
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return {
            activeProjects: 0,
            totalEstimates: 0,
            hoursWeek: 0,
            revenueMonth: 0,
            recentProjects: []
        };
    }
}

// --- 2. CUSTOM CHART DATA GENERATOR ---
export async function getCustomChartDataAction({ metric, groupBy, startDate, endDate }) {
    try {
        let query = "";
        let params = [];
        let groupByClause = "";
        let selectClause = "";
        let joinClause = "";
        let whereClause = "WHERE 1=1";

        // 1. Validate Date Range
        if (startDate) {
            whereClause += " AND date >= ?";
            params.push(startDate);
        }
        if (endDate) {
            whereClause += " AND date <= ?";
            params.push(endDate);
        }

        // 2. Define Grouping Logic (X-Axis)
        switch (groupBy) {
            case "day":
                selectClause = "DATE_FORMAT(date, '%Y-%m-%d') as name";
                groupByClause = "GROUP BY DATE_FORMAT(date, '%Y-%m-%d')";
                break;
            case "week":
                selectClause = "DATE_FORMAT(date, '%Y-W%u') as name";
                groupByClause = "GROUP BY DATE_FORMAT(date, '%Y-W%u')";
                break;
            case "month":
                selectClause = "DATE_FORMAT(date, '%Y-%m') as name";
                groupByClause = "GROUP BY DATE_FORMAT(date, '%Y-%m')";
                break;
            case "project":
                selectClause = "p.name as name";
                groupByClause = "GROUP BY p.name";
                // Joins will be handled in the metric switch
                break;
            case "employee":
                selectClause = "CONCAT(e.first_name, ' ', e.last_name) as name";
                groupByClause = "GROUP BY e.internalid";
                break;
            default:
                return [];
        }

        // 3. Define Metric Logic (Y-Axis)
        switch (metric) {
            case "hours":
                // Query Time Entries
                joinClause = "LEFT JOIN projects p ON t.project_id = p.internalid LEFT JOIN employees e ON t.employee_id = e.internalid";
                query = `SELECT ${selectClause}, SUM(t.hours) as value FROM time_entries t ${joinClause} ${whereClause.replace('date', 't.date')} ${groupByClause} ORDER BY name ASC`;
                break;

            case "revenue":
                // Query Estimates
                joinClause = "LEFT JOIN projects p ON est.project_id = p.internalid";
                // Note: Estimates table doesn't have employee_id directly usually, so employee grouping might not work well here without more joins.
                // We will fallback to project grouping if employee is selected for revenue, or just return empty.
                if (groupBy === 'employee') return [];

                query = `SELECT ${selectClause}, SUM(est.grand_total) as value FROM estimates est ${joinClause} ${whereClause.replace('date', 'est.created_at')} ${groupByClause} ORDER BY name ASC`;
                break;

            case "projects":
                // Query Projects Count
                // Use created_at for date filtering
                if (groupBy === 'project') return []; // Can't group projects by project in this context usually
                joinClause = "LEFT JOIN customers c ON p.customer_id = c.internalid";
                if (groupBy === 'employee') return []; // Projects don't have single employees usually

                query = `SELECT ${selectClause}, COUNT(*) as value FROM projects p ${joinClause} ${whereClause.replace('date', 'p.created_at')} ${groupByClause} ORDER BY name ASC`;
                break;

            default:
                return [];
        }

        // 4. Execute
        const rows = await mysql_query(query, params);
        return JSON.parse(JSON.stringify(rows));

    } catch (error) {
        console.error("Custom Chart Error:", error);
        return [];
    }
}