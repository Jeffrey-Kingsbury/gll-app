"use server";

import { revalidatePath } from "next/cache";
import { 
    mysql_updateCustomer, 
    mysql_createCustomer, 
    mysql_deleteCustomer 
} from "../../../context/mysqlConnection";
import fs from "fs/promises";
import path from "path";

// --- HELPERS ---

async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * Moves a file from temp to permanent storage and returns the new public URL
 */
async function moveLogoToPermanent(tempUrl) {
    if (!tempUrl || !tempUrl.includes("/system/tmp/img/")) return tempUrl;

    try {
        const filename = path.basename(tempUrl);
        const tempPath = path.join(process.cwd(), "public", "system", "tmp", "img", filename);
        const permDir = path.join(process.cwd(), "public", "system", "img");
        const permPath = path.join(permDir, filename);

        await ensureDir(permDir);
        await fs.copyFile(tempPath, permPath);
        await fs.unlink(tempPath);

        return `/system/img/${filename}`;
    } catch (error) {
        console.error("❌ Failed to move logo:", error);
        return null;
    }
}

// --- ACTIONS ---

export async function uploadTempLogoAction(formData) {
    const file = formData.get("file");
    if (!file) return { success: false };

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const tempDir = path.join(process.cwd(), "public", "system", "tmp", "img");
        
        await ensureDir(tempDir);
        const filePath = path.join(tempDir, safeName);
        await fs.writeFile(filePath, buffer);

        return { success: true, url: `/system/tmp/img/${safeName}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteTempLogoAction(tempUrl) {
    if (!tempUrl || !tempUrl.includes("/system/tmp/img/")) return;
    try {
        const filename = path.basename(tempUrl);
        const filePath = path.join(process.cwd(), "public", "system", "tmp", "img", filename);
        await fs.unlink(filePath);
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateCustomerAction(formData) {
    const internalid = formData.get("internalid");
    const updateData = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        website: formData.get("website"),
        address: formData.get("address"),
        status: formData.get("status"),
        notes: formData.get("notes"),
    };

    let logoUrl = formData.get("logo_url");
    
    // Handle logo move if necessary
    if (logoUrl) {
        updateData.logo_url = await moveLogoToPermanent(logoUrl);
    }

    try {
        const success = await mysql_updateCustomer(internalid, updateData);
        
        if (success) {
            revalidatePath("/customers");
            revalidatePath(`/customers/${internalid}`);
            return { success: true };
        }
        return { success: false, error: "No changes detected." };
    } catch (error) {
        console.error("Update Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createCustomerAction(formData) {
    const newCustomerData = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        website: formData.get("website"),
        address: formData.get("address"),
        status: formData.get("status"),
        notes: formData.get("notes"),
    };

    let logoUrl = formData.get("logo_url");
    if (logoUrl) {
        newCustomerData.logo_url = await moveLogoToPermanent(logoUrl);
    }

    try {
        const newId = await mysql_createCustomer(newCustomerData);
        revalidatePath("/customers");
        return { success: true, newId: newId };
    } catch (error) {
        console.error("Create Error:", error);
        return { success: false, error: "Failed to create customer" };
    }
}

export async function deleteCustomerAction(internalid) {
    try {
        const result = await mysql_deleteCustomer(internalid);
        revalidatePath("/customers");
        return result;
    } catch (error) {
        return { success: false, error: "Failed to delete customer" };
    }
}