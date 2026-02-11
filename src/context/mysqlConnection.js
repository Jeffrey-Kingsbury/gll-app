// context/mysqlConnection.js
"use server";
import mysql from 'mysql2/promise';

// 1. Create a Global Pool (Singleton)
// We create this ONCE and reuse it, rather than opening/closing per request.
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',      // <--- Inside Docker, this will be "db"
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper to get a connection if needed explicitly, though pool.execute handles it automatically.
export async function getMySQLConnection() {
    return pool;
}

// --- OPTIMIZED FUNCTIONS ---
// Note: We removed "await connection.end()" from all functions 
// because we want to keep the pool open for the next user!

export async function queryMySQL(query) {
    try {
        const [rows] = await pool.query(query);
        return rows;
    } catch (error) {
        console.error("MySQL Query Error:", error);
        throw error;
    }
}

export async function mysql_addUser(name, email, googleId, role = 'user') {
    try {
        const query = "INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)";
        const [result] = await pool.execute(query, [name, email, googleId, role]);
        return result.insertId;
    } catch (error) {
        console.error("MySQL Insert Error:", error);
        throw error;
    }
}

export async function mysql_getUserByGoogleId(googleId) {
    try {
        const query = "SELECT * FROM users WHERE google_id = ?";
        const [rows] = await pool.execute(query, [googleId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("MySQL Select Error:", error);
        throw error;
    }
}
export async function mysql_getCustomers() {
    try {
        const query = "SELECT internalid, name FROM customers ORDER BY internalid ASC";
        const [rows] = await pool.execute(query);
        console.log("MySQL Customers Fetched:", rows); // Debug log to verify data fetching
        return rows;
    } catch (error) {
        console.error("MySQL Customer Fetch Error:", error);
        return [];
    }
}

export async function mysql_createCustomer(name) {
    try {
        console.log("📝 Creating Customer:", name);
        const query = "INSERT INTO customers (name) VALUES (?)";
        const [result] = await pool.execute(query, [name]);
        console.log("✅ Customer Created, ID:", result.insertId);
        return result.insertId;
    } catch (error) {
        console.error("❌ MySQL Create Customer Error:", error);
        throw error;
    }
}

export async function mysql_getCustomerById(internalid) {
    try {
        const query = "SELECT * FROM customers WHERE internalid = ?";
        const [rows] = await pool.execute(query, [internalid]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("MySQL Get By ID Error:", error);
        return null;
    }
}

export async function mysql_updateCustomer(internalid, name) {
    try {
        const query = "UPDATE customers SET name = ? WHERE internalid = ?";
        const [result] = await pool.execute(query, [name, internalid]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("MySQL Update Error:", error);
        throw error;
    }
}

export async function mysql_addFileRecord(name, url, type, folderId = null, size = 0) {
    try {
        const query = "INSERT INTO documents (name, url, type, folder_id, size) VALUES (?, ?, ?, ?, ?)";
        const fId = folderId === "" ? null : folderId;
        
        const [result] = await pool.execute(query, [name, url, type, fId, size]);
        return result.insertId;
    } catch (error) {
        console.error("MySQL Add File Error:", error);
        throw error;
    }
}

export async function mysql_getStorageUsage() {
    try {
        const query = "SELECT SUM(size) as totalBytes FROM documents";
        const [rows] = await pool.execute(query);
        return rows[0].totalBytes || 0;
    } catch (error) {
        console.error("Storage Check Error:", error);
        return 0;
    }
}

export async function mysql_createFolder(name, parentId = null) {
    try {
        const query = "INSERT INTO folders (name, parent_id) VALUES (?, ?)";
        const pId = parentId === "" ? null : parentId;
        
        const [result] = await pool.execute(query, [name, pId]);
        return result.insertId;
    } catch (error) {
        console.error("MySQL Create Folder Error:", error);
        throw error;
    }
}

export async function mysql_getAllImages() {
    try {
        const query = "SELECT * FROM documents WHERE type LIKE 'image/%' ORDER BY created_at DESC";
        const [rows] = await pool.execute(query);
        return rows;
    } catch (error) {
        console.error("MySQL Get Images Error:", error);
        return [];
    }
}

export async function mysql_getAllFolders() {
    try {
        const query = "SELECT * FROM folders ORDER BY name ASC";
        const [rows] = await pool.execute(query);
        return rows;
    } catch (error) {
        console.error("MySQL Get Folders Error:", error);
        return [];
    }
}

export async function mysql_getAllFiles() {
    try {
        const query = "SELECT * FROM documents ORDER BY created_at DESC";
        const [rows] = await pool.execute(query);
        return rows;
    } catch (error) {
        console.error("MySQL Get Files Error:", error);
        return [];
    }
}

export async function mysql_getFileById(internalid) {
    try {
        const query = "SELECT * FROM documents WHERE internalid = ?";
        const [rows] = await pool.execute(query, [internalid]);
        return rows[0];
    } catch (error) {
        console.error("MySQL Get File Error:", error);
        return null;
    }
}

export async function mysql_deleteFile(internalid) {
    try {
        const query = "DELETE FROM documents WHERE internalid = ?";
        await pool.execute(query, [internalid]);
    } catch (error) {
        console.error("MySQL Delete File Error:", error);
        throw error;
    }
}

export async function mysql_deleteFolder(internalid) {
    try {
        const query = "DELETE FROM folders WHERE internalid = ?";
        await pool.execute(query, [internalid]);
    } catch (error) {
        console.error("MySQL Delete Folder Error:", error);
        throw error;
    }
}