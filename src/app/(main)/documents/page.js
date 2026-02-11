// app/dashboard/documents/page.js
import { mysql_getAllFolders, mysql_getAllFiles } from "../../../context/mysqlConnection";
import DocumentsClient from "./DocumentsClient";

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
    // Parallel data fetching for speed
    const [folders, files] = await Promise.all([
        mysql_getAllFolders(),
        mysql_getAllFiles()
    ]);

    return (
        <DocumentsClient 
            initialFolders={folders} 
            initialFiles={files} 
        />
    );
}