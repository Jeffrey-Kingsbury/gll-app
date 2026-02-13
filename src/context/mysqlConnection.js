"use server";
import mysql from 'mysql2/promise';

// --- 1. CONNECTION POOLS (SINGLETONS) ---

// Primary Read/Write Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Restricted Read-Only Pool
const readOnlyPool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_READONLY_USER || 'gll_readonly',
    password: process.env.DB_READONLY_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

// --- 2. UTILITY & GENERIC FUNCTIONS ---

export async function mysql_executeQueryReadOnly(query, params = []) {
    const lowerQ = query.toLowerCase().trim();
    if (!lowerQ.startsWith("select") && !lowerQ.startsWith("show") && !lowerQ.startsWith("describe")) {
        throw new Error("Security Violation: Only SELECT, SHOW, or DESCRIBE allowed in Read-Only mode.");
    }
    try {
        const [rows] = await readOnlyPool.execute(query, params);
        return rows;
    } catch (error) {
        console.error("Read-Only Query Error:", error);
        throw error;
    }
}

export async function mysql_updateRecord(tableName, internalid, params) {
    if (!params || Object.keys(params).length === 0) return false;
    
    // Safety: Ensure internalid is never overwritten
    const safeParams = { ...params };
    delete safeParams.internalid;

    try {
        const keys = Object.keys(safeParams);
        const setClause = keys.map(key => `${key} = ?`).join(", ");
        const values = [...Object.values(safeParams), internalid];
        const query = `UPDATE ${tableName} SET ${setClause} WHERE internalid = ?`;

        const [result] = await pool.execute(query, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`Update Error (${tableName}):`, error);
        throw error;
    }
}

export async function mysql_getDatabaseSchema() {
    try {
        const query = `
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `;
        const [rows] = await readOnlyPool.execute(query, [process.env.DB_NAME]);
        const schema = {};
        rows.forEach(row => {
            if (!schema[row.TABLE_NAME]) schema[row.TABLE_NAME] = [];
            schema[row.TABLE_NAME].push({ name: row.COLUMN_NAME, type: row.DATA_TYPE });
        });
        return schema;
    } catch (error) {
        console.error("Schema Fetch Error:", error);
        return {};
    }
}

// --- 3. CUSTOMER FUNCTIONS ---

export async function mysql_getCustomers() {
    try {
        const [rows] = await pool.execute("SELECT internalid, name FROM customers ORDER BY internalid ASC");
        return rows;
    } catch (error) {
        console.error("Fetch Customers Error:", error);
        return [];
    }
}

export async function mysql_getCustomerById(internalid) {
    try {
        const [rows] = await pool.execute("SELECT * FROM customers WHERE internalid = ?", [internalid]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        return null;
    }
}

export async function mysql_createCustomer(params) {
    try {
        const query = `INSERT INTO customers (name, email, phone, website, address, status, notes, logo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [params.name, params.email || null, params.phone || null, params.website || null, params.address || null, params.status || 'Active', params.notes || null, params.logo_url || null];
        const [result] = await pool.execute(query, values);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function mysql_deleteCustomer(id) {
    try {
        await pool.execute("DELETE FROM customers WHERE internalid = ?", [id]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function mysql_updateCustomer(internalid, params) {
    // Delegates to the generic updateRecord utility we built
    return await mysql_updateRecord('customers', internalid, params);
}

// --- 4. EMPLOYEE FUNCTIONS ---

export async function mysql_getEmployeeById(internalid) {
    try {
        const [rows] = await pool.execute("SELECT * FROM employees WHERE internalid = ?", [internalid]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        return null;
    }
}

export async function mysql_createEmployee(params) {
    try {
        const query = `INSERT INTO employees (first_name, last_name, email, phone, job_title, department, hire_date, level_access, status, salary_basis, base_pay, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [params.first_name, params.last_name, params.email, params.phone || null, params.job_title || null, params.department || null, params.hire_date || null, params.level_access || 1, params.status || 'active', params.salary_basis || 'salary', params.base_pay || 0, params.notes || null];
        const [result] = await pool.execute(query, values);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function mysql_updateEmployee(internalid, params) {
    // We delegate the work to our generic update utility
    return await mysql_updateRecord('employees', internalid, params);
}

export async function mysql_deleteEmployee(internalid) {
    try {
        const [result] = await pool.execute("DELETE FROM employees WHERE internalid = ?", [internalid]);
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
}

// --- 5. DOCUMENT & FOLDER FUNCTIONS ---

export async function mysql_addFileRecord(name, url, type, folderId = null, size = 0) {
    try {
        const query = "INSERT INTO documents (name, url, type, folder_id, size) VALUES (?, ?, ?, ?, ?)";
        const [result] = await pool.execute(query, [name, url, type, folderId || null, size]);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function mysql_getAllImages() {
    try {
        const [rows] = await pool.execute("SELECT * FROM documents WHERE type LIKE 'image/%' ORDER BY created_at DESC");
        return rows;
    } catch (error) {
        return [];
    }
}

export async function mysql_deleteFile(internalid) {
    try {
        await pool.execute("DELETE FROM documents WHERE internalid = ?", [internalid]);
    } catch (error) {
        throw error;
    }
}

// --- 6. USER & AUTH FUNCTIONS ---

export async function mysql_getUserByGoogleId(googleId) {
    try {
        const [rows] = await pool.execute("SELECT * FROM users WHERE google_id = ?", [googleId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw error;
    }
}

export async function mysql_addUser(name, email, googleId, role = 'user') {
    try {
        const query = "INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)";
        const [result] = await pool.execute(query, [name, email, googleId, role]);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}