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
export async function mysql_getUserByGoogleId(googleId) {
    try {
        // Query the 'users' table (or 'employees' if you use that for auth)
        // Adjust 'google_id' to match your actual column name if different
        const [rows] = await pool.execute("SELECT * FROM users WHERE google_id = ?", [googleId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Fetch User Error:", error);
        return null;
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
        // We use the readOnlyPool for safety
        const [rows] = await readOnlyPool.query(query, [process.env.DB_NAME]);

        // Transform into a nested object: { tableName: [ {name, type}, ... ] }
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

/**
 * Execute a read-only query using .query() to handle dynamic LIMIT/OFFSET params correctly.
 */
export async function mysql_executeQueryReadOnly(query, params = []) {
    const lowerQ = query.toLowerCase().trim();
    if (!lowerQ.startsWith("select") && !lowerQ.startsWith("show") && !lowerQ.startsWith("describe")) {
        throw new Error("Security Violation: Only SELECT, SHOW, or DESCRIBE allowed in Read-Only mode.");
    }
    try {
        const [rows] = await readOnlyPool.query(query, params);
        return rows;
    } catch (error) {
        console.error("Read-Only Query Error:", error);
        throw error;
    }
}

/**
 * Update any record by ID.
 * Automatically strips 'internalid' from params to prevent primary key overwrites.
 */
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

export async function mysql_transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// --- 3. DOCUMENT & FOLDER FUNCTIONS (The Missing Pieces) ---

export async function mysql_addFileRecord(name, url, type, folderId = null, size = 0) {
    try {
        const query = "INSERT INTO documents (name, url, type, folder_id, size) VALUES (?, ?, ?, ?, ?)";
        const [result] = await pool.execute(query, [name, url, type, folderId || null, size]);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function mysql_createFolder(name, parentId = null) {
    try {
        await pool.execute("INSERT INTO folders (name, parent_id) VALUES (?, ?)", [name, parentId]);
    } catch (error) {
        throw error;
    }
}

export async function mysql_getFolders(parentId = null) {
    try {
        const query = parentId
            ? "SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC"
            : "SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC";
        const params = parentId ? [parentId] : [];
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        return [];
    }
}

export async function mysql_getFiles(folderId = null) {
    try {
        const query = folderId
            ? "SELECT * FROM documents WHERE folder_id = ? ORDER BY created_at DESC"
            : "SELECT * FROM documents WHERE folder_id IS NULL ORDER BY created_at DESC";
        const params = folderId ? [folderId] : [];
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        return [];
    }
}

export async function mysql_getFolderDetails(folderId) {
    try {
        const [rows] = await pool.execute("SELECT * FROM folders WHERE internalid = ?", [folderId]);
        return rows[0] || null;
    } catch (error) {
        return null;
    }
}

export async function mysql_getStorageUsage() {
    try {
        const [rows] = await pool.execute("SELECT SUM(size) as total_bytes FROM documents");
        return rows[0].total_bytes || 0;
    } catch (error) {
        return 0;
    }
}

export async function mysql_getFileById(internalid) {
    try {
        const [rows] = await pool.execute("SELECT * FROM documents WHERE internalid = ?", [internalid]);
        return rows[0];
    } catch (error) {
        return null;
    }
}

export async function mysql_deleteFile(internalid) {
    try {
        await pool.execute("DELETE FROM documents WHERE internalid = ?", [internalid]);
    } catch (error) {
        throw error;
    }
}

export async function mysql_deleteFolder(internalid) {
    // Note: This only deletes the folder record. In production, you might want recursive deletion.
    await pool.execute("DELETE FROM folders WHERE internalid = ?", [internalid]);
}

export async function mysql_getAllImages(relatedId) {
    try {
        // 1. Check if we have an ID to filter by
        if (!relatedId) return [];

        // 2. Query the documents table for images linked to this customer
        // Adjust 'related_id' to 'customer_id' if that is your column name
        const [rows] = await pool.execute(`
      SELECT * FROM documents 
      WHERE related_id = ? 
      AND (mime_type LIKE 'image/%' OR file_extension IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
      ORDER BY created_at DESC
    `, [relatedId]);

        return rows;
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

// --- 4. CUSTOMER FUNCTIONS ---

export async function mysql_getCustomers() {
    try {
        const [rows] = await pool.execute("SELECT internalid, name FROM customers ORDER BY name ASC");
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

export async function mysql_updateCustomer(internalid, params) {
    return await mysql_updateRecord('customers', internalid, params);
}

export async function mysql_deleteCustomer(id) {
    try {
        await pool.execute("DELETE FROM customers WHERE internalid = ?", [id]);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// --- 5. PROJECT FUNCTIONS ---

export async function mysql_getProjects() {
    try {
        const [rows] = await pool.execute("SELECT internalid, name, client_name FROM projects ORDER BY name ASC");
        return rows;
    } catch (error) {
        return [];
    }
}

// --- 6. TEMPLATE FUNCTIONS ---

export async function mysql_getTemplates() {
    // Returning hardcoded templates as per your previous setup logic
    // You can move this to DB later
    return [
        { id: "default", name: "Standard Renovation" },
        { id: "kitchen", name: "Kitchen Remodel" },
        { id: "bathroom", name: "Bathroom Refresh" },
        { id: "deck", name: "Deck & Patio" },
    ];
}

// --- 7. EMPLOYEE FUNCTIONS ---

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

export async function mysql_getEmployeeById(id) {
    try {
        const [rows] = await pool.execute(`
      SELECT 
        *
      FROM employees 
      WHERE internalid = ?
    `, [id]);

        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error fetching employee:", error);
        return null;
    }
}

// --- 8. ADDRESS BOOK FUNCTIONS ---

export async function mysql_getAddresses(recordId, recordType) {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM address_book WHERE record_id = ? AND record_type = ? ORDER BY is_default DESC, internalid ASC",
            [recordId, recordType]
        );
        return rows;
    } catch (error) {
        return [];
    }
}

export async function mysql_addAddress(params) {
    try {
        const query = `
            INSERT INTO address_book (record_id, record_type, addr_type, is_default, addr1, addr2, city, state, zip, country)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            params.record_id,
            params.record_type,
            params.addr_type || 'Main',
            params.is_default || false,
            params.addr1 || '',
            params.addr2 || '',
            params.city || '',
            params.state || 'QC',
            params.zip || '',
            params.country || 'Canada'
        ];
        const [result] = await pool.execute(query, values);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function mysql_deleteAddress(internalid) {
    try {
        await pool.execute("DELETE FROM address_book WHERE internalid = ?", [internalid]);
        return true;
    } catch (error) {
        return false;
    }
}

// --- 9. CONTACT FUNCTIONS ---

export async function mysql_getContacts(recordId, recordType) {
    try {
        const [rows] = await pool.execute(
            "SELECT * FROM contacts WHERE record_id = ? AND record_type = ? ORDER BY is_primary DESC, name ASC",
            [recordId, recordType]
        );
        return rows;
    } catch (error) {
        return [];
    }
}

export async function mysql_addContact(params) {
    try {
        const query = `
            INSERT INTO contacts (record_id, record_type, name, role, email, phone, mobile, notes, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            params.record_id,
            params.record_type,
            params.name,
            params.role || 'Contact',
            params.email || '',
            params.phone || '',
            params.mobile || '',
            params.notes || '',
            params.is_primary || false
        ];
        const [result] = await pool.execute(query, values);
        return result.insertId;
    } catch (error) {
        throw error;
    }
}

export async function mysql_deleteContact(internalid) {
    try {
        await pool.execute("DELETE FROM contacts WHERE internalid = ?", [internalid]);
        return true;
    } catch (error) {
        return false;
    }
}


/**
 * Generic query executor for both Reads and Writes using the primary pool.
 * Returns the result directly (Rows array for SELECT, ResultSetHeader for INSERT/UPDATE).
 */
export async function mysql_query(query, params = []) {
    try {
        const [result] = await pool.execute(query, params);
        return result;
    } catch (error) {
        console.error("MySQL Query Error:", error);
        throw error;
    }
}