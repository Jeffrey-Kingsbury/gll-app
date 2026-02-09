"use server";
import path from "node:path";
import { saveFileToDisk, deleteFileFromDisk } from "../../../lib/upload";
import { mysql_addFileRecord, 
    mysql_createFolder, 
    mysql_getFileById, 
    mysql_deleteFile, 
    mysql_deleteFolder } from "../../../context/mysqlConnection";
import { revalidatePath } from "next/cache";

// --- Folder Action ---
export async function createFolderAction(formData) {
    const name = formData.get("name");
    const parentId = formData.get("parentId") || null;
    if (name) {
        await mysql_createFolder(name, parentId);
        revalidatePath("/dashboard/documents");
    }
}

// --- File Upload Action ---
export async function uploadFileAction(formData) {
    const file = formData.get("file");
    const folderId = formData.get("folderId") || null;

    if (!file || file.size === 0) {
        return { error: "No file provided" };
    }

    try {
        // 1. Save to cPanel Disk
        const { url, filename, mimeType } = await saveFileToDisk(file);

        // 2. Save Record to MySQL
        await mysql_addFileRecord(filename, url, mimeType, folderId);

        // 3. Refresh UI
        revalidatePath("/dashboard/documents");
        return { success: true, url: url, name: filename };
    } catch (error) {
        console.error("Upload Error:", error);
        return { error: "Upload failed" };
    }
}

export async function deleteFileAction(formData) {
    const internalid = formData.get("internalid");
    if (!internalid) return;

    // 1. Get DB Record
    const fileRecord = await mysql_getFileById(internalid);
    
    if (fileRecord) {
        // ROBUST FIX: Use path.basename to extract "image.png" from "/uploads/image.png"
        // This works regardless of whether there is a leading slash or full domain.
        const filename = path.basename(fileRecord.url);
        
        console.log("Found record:", fileRecord.url, "Extracted filename:", filename);

        // 2. Delete from Disk
        if (filename) {
            const diskResult = await deleteFileFromDisk(filename);
            
            if (!diskResult) {
                // Optional: Decide if you want to stop here. 
                // Currently, we proceed so the "broken" link is removed from the DB anyway.
                console.warn("Warning: File was removed from DB but disk deletion failed (or file was missing).");
            }
        }

        // 3. Delete from DB
        await mysql_deleteFile(internalid);
        revalidatePath("/dashboard/documents");
    }
}

export async function deleteFolderAction(formData) {
    const internalid = formData.get("internalid");
    if (internalid) {
        await mysql_deleteFolder(internalid);
        revalidatePath("/dashboard/documents");
    }
}