import fs from "node:fs/promises";
import path from "node:path";

export async function saveFileToDisk(file) {
  // 1. Define the upload directory inside 'public'
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  // 2. Ensure the directory exists (CRITICAL FIX)
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  // 3. Sanitize Filename (Fixes broken links caused by spaces)
  const timestamp = Date.now();
  // Replace spaces and special chars with underscores
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); 
  const filename = `${timestamp}_${safeName}`;
  
  const filePath = path.join(uploadDir, filename);

  // 4. Convert and Write File
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  await fs.writeFile(filePath, buffer);

  // 5. Return the RELATIVE URL for the database
  // Next.js serves files in 'public' directly at root.
  // So 'public/uploads/img.jpg' is accessible at '/uploads/img.jpg'
  return { 
    url: `/uploads/${filename}`, 
    filename: filename, 
    mimeType: file.type 
  };
}

export async function deleteFileFromDisk(filename) {
    try {
        const filePath = path.join(process.cwd(), "public", "uploads", filename);
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.warn(`Failed to delete file from disk: ${filename}`, error.message);
        return false;
    }
}