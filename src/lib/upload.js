// lib/upload.js
import fs from "node:fs/promises";
import path from "node:path";

export async function saveFileToDisk(file) {
  // 1. Define the upload directory (inside the public folder)
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // 2. Create the directory if it doesn't exist
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // 3. Create a unique filename (timestamp + original name) to prevent overwrites
  const timestamp = Date.now();
  // Sanitize filename to remove spaces/weird chars
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); 
  const filename = `${timestamp}_${safeName}`;
  const filePath = path.join(uploadDir, filename);

  // 4. Convert the File object (Blob) to a Node.js Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 5. Write to disk
  await fs.writeFile(filePath, buffer);

  // 6. Return the public URL and the filename
  return {
    url: `/uploads/${filename}`,
    filename: filename,
    mimeType: file.type
  };
}

export async function deleteFileFromDisk(filename) {
  // Debug: Print the filename we received
  console.log("Attempting to delete file:", filename);

  const filePath = path.join(process.cwd(), "public", "uploads", filename);
  
  // Debug: Print the full path we are trying to target
  console.log("Full target path:", filePath);

  try {
    await fs.unlink(filePath);
    console.log("File successfully deleted from disk");
    return true;
  } catch (error) {
    console.error("CRITICAL ERROR: Could not delete file from disk:", error);
    return false;
  }
}