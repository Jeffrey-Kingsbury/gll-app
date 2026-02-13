"use server";

import { revalidatePath } from "next/cache";
import { 
  mysql_createEmployee, 
  mysql_deleteEmployee, 
  mysql_updateEmployee 
} from "../../../../context/mysqlConnection";

/**
 * Handle Employee Creation
 */
export async function createEmployeeAction(formData) {
    const data = Object.fromEntries(formData.entries());
    try {
        const newId = await mysql_createEmployee(data);
        
        // Refresh the list view
        revalidatePath("/company/employees");
        return { success: true, newId };
    } catch (error) {
        console.error("Action Error (Create):", error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle Employee Update
 */
export async function updateEmployeeAction(formData) {
    const internalid = formData.get("internalid");
    
    // Convert formData to a clean object
    const data = Object.fromEntries(formData.entries());
    
    try {
        // mysql_updateEmployee expects (internalid, dataObject)
        const success = await mysql_updateEmployee(internalid, data);
        
        if (success) {
            // Revalidate both the list and the specific profile page
            revalidatePath("/company/employees");
            revalidatePath(`/company/employees/${internalid}`);
            return { success: true };
        }
        
        return { success: false, error: "No changes were saved." };
    } catch (error) {
        console.error("Action Error (Update):", error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle Employee Deletion
 */
export async function deleteEmployeeAction(internalid) {
  try {
    const success = await mysql_deleteEmployee(internalid);
    
    if (success) {
      revalidatePath("/company/employees");
      return { success: true };
    }
    
    return { success: false, error: "Record not found or already deleted." };
  } catch (error) {
    console.error("Action Error (Delete):", error);
    return { success: false, error: "Database error during deletion." };
  }
}