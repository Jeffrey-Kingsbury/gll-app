"use server";

import { mysql_executeQueryReadOnly, mysql_getDatabaseSchema } from "../../../../context/mysqlConnection";

export async function executeQueryAction(query) {
    try {
        const results = await mysql_executeQueryReadOnly(query);
        // Serialize dates/buffers if necessary
        const safeResults = JSON.parse(JSON.stringify(results));
        return { success: true, data: safeResults };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getSchemaAction() {
    try {
        const schema = await mysql_getDatabaseSchema();
        return { success: true, data: schema };
    } catch (error) {
        return { success: false, error: "Failed to fetch schema" };
    }
}