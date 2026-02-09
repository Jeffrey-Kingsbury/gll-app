"use server";
import mysql from 'mysql2/promise';

const getMySQLConnection = () => {
    const connection = mysql.createPool({
        host: process.env.NEXT_PUBLIC_MYSQL_HOST,
        user: process.env.NEXT_PUBLIC_MYSQL_USER,
        password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD,
        database: process.env.NEXT_PUBLIC_MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    return connection;
}

export async function queryMySQL(query) {
    const connection = getMySQLConnection();
    try {
        const [rows, fields] = await connection.query(query);
        return rows;
    } catch (error) {
        console.error("MySQL Query Error:", error);
        throw error;
    } finally {
        await connection.end();
    }
}

export async function mysql_addUser(name, email, googleId, role = 'user') {
    const connection = getMySQLConnection();
    try {
        const query = "INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)";
        const [result] = await connection.execute(query, [name, email, googleId, role]);
        return result.insertId; // Return the ID of the newly inserted user
    } catch (error) {
        console.error("MySQL Insert Error:", error);
        throw error;
    } finally {
        await connection.end();
    }
}

export async function mysql_getUserByGoogleId(googleId) {
    const connection = getMySQLConnection();
    try {
        const query = "SELECT * FROM users WHERE google_id = ?";
        const [rows] = await connection.execute(query, [googleId]);
        return rows.length > 0 ? rows[0] : null; // Return the user object or null if not found
    } catch (error) {
        console.error("MySQL Select Error:", error);
        throw error;
    } finally {
        await connection.end();
    }
}

export async function mysql_getCustomers() {
    const connection = getMySQLConnection();
    try {
        // Fetching internalid and name as requested
        // Using ORDER BY internalid DESC to show newest first, or name ASC for alphabetical
        const query = "SELECT internalid, name FROM customers ORDER BY internalid ASC";
        const [rows] = await connection.execute(query);
        return rows;
    } catch (error) {
        console.error("MySQL Customer Fetch Error:", error);
        return []; // Return empty array on error so UI doesn't crash
    } finally {
        await connection.end();
    }
}

export async function mysql_createCustomer(name) {
    const connection = getMySQLConnection();
    try {
        const query = "INSERT INTO customers (name) VALUES (?)";
        const [result] = await connection.execute(query, [name]);
        return result.insertId;
    } catch (error) {
        console.error("MySQL Create Customer Error:", error);
        throw error;
    } finally {
        await connection.end();
    }
}

// GET a single customer by ID
export async function mysql_getCustomerById(internalid) {
    const connection = getMySQLConnection();
    try {
        const query = "SELECT * FROM customers WHERE internalid = ?";
        const [rows] = await connection.execute(query, [internalid]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("MySQL Get By ID Error:", error);
        return null;
    } finally {
        await connection.end();
    }
}

// UPDATE a customer record
export async function mysql_updateCustomer(internalid, name) {
    const connection = getMySQLConnection();
    try {
        const query = "UPDATE customers SET name = ? WHERE internalid = ?";
        const [result] = await connection.execute(query, [name, internalid]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("MySQL Update Error:", error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Add this if you missed it previously
export async function mysql_addFileRecord(name, url, type, folderId = null) {
    const connection = getMySQLConnection();
    try {
        const query = "INSERT INTO documents (name, url, type, folder_id) VALUES (?, ?, ?, ?)";
        const [result] = await connection.execute(query, [name, url, type, folderId]);
        return result.insertId;
    } finally {
        await connection.end();
    }
}

export async function mysql_createFolder(name, parentId = null) {
    const connection = getMySQLConnection();
    try {
        const query = "INSERT INTO folders (name, parent_id) VALUES (?, ?)";
        // If parentId is an empty string, convert to null for SQL
        const pId = parentId === "" ? null : parentId;
        
        const [result] = await connection.execute(query, [name, pId]);
        return result.insertId;
    } catch (error) {
        console.error("MySQL Create Folder Error:", error);
        throw error;
    } finally {
        await connection.end();
    }
}

export async function mysql_getAllImages() {
    const connection = getMySQLConnection();
    try {
        // We filter for mime types starting with 'image/'
        const query = "SELECT * FROM documents WHERE type LIKE 'image/%' ORDER BY created_at DESC";
        const [rows] = await connection.execute(query);
        return rows;
    } catch (error) {
        console.error("MySQL Get Images Error:", error);
        return [];
    } finally {
        await connection.end();
    }
}

export async function mysql_getAllFolders() {
    const connection = getMySQLConnection();
    try {
        const query = "SELECT * FROM folders ORDER BY name ASC";
        const [rows] = await connection.execute(query);
        return rows;
    } finally {
        await connection.end();
    }
}

// Get ALL files (flat list)
export async function mysql_getAllFiles() {
    const connection = getMySQLConnection();
    try {
        const query = "SELECT * FROM documents ORDER BY created_at DESC";
        const [rows] = await connection.execute(query);
        return rows;
    } finally {
        await connection.end();
    }
}

export async function mysql_getFileById(internalid) {
    const connection = getMySQLConnection();
    try {
        const query = "SELECT * FROM documents WHERE internalid = ?";
        const [rows] = await connection.execute(query, [internalid]);
        return rows[0];
    } finally {
        await connection.end();
    }
}

export async function mysql_deleteFile(internalid) {
    const connection = getMySQLConnection();
    try {
        const query = "DELETE FROM documents WHERE internalid = ?";
        await connection.execute(query, [internalid]);
    } finally {
        await connection.end();
    }
}

export async function mysql_deleteFolder(internalid) {
    const connection = getMySQLConnection();
    try {
        // Note: Files inside this folder will move to Root (NULL) 
        // because of the ON DELETE SET NULL foreign key we set up.
        const query = "DELETE FROM folders WHERE internalid = ?";
        await connection.execute(query, [internalid]);
    } finally {
        await connection.end();
    }
}