// src/app/login/actions.js
"use server";

import { auth } from "@/lib/auth"; // Your BetterAuth config
import { headers } from "next/headers";
import mysql from "mysql2/promise";

// Create a quick pool for this lookup (or import your existing connection)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

export async function getCurrentEmployeeAction() {
    try {
        // 1. Get Session from BetterAuth
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return null;
        }

        const userEmail = session.user.email;

        // 2. Find Employee by Email
        // We select strictly what we need to avoid leaking sensitive data
        const [rows] = await pool.execute(`
            SELECT 
                internalid, 
                first_name, 
                last_name, 
                job_title, 
                department, 
                level_access, 
                avatar_url 
            FROM employees 
            WHERE email = ? 
            LIMIT 1
        `, [userEmail]);

        if (rows.length === 0) {
            // User is logged in (Google) but NOT an employee in the system
            return {
                isGuest: true,
                ...session.user
            };
        }

        // 3. Return Combined Profile
        return {
            ...session.user,      // Google info (image, name)
            employeeId: rows[0].internalid,
            jobTitle: rows[0].job_title,
            department: rows[0].department,
            accessLevel: rows[0].level_access, // 1=Admin, 2=Manager, 3=User
            isGuest: false
        };

    } catch (error) {
        console.error("Employee Fetch Error:", error);
        return null;
    }
}