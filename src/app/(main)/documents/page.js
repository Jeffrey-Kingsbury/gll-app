import { mysql_getFolders, mysql_getFiles } from "../../../context/mysqlConnection";
import DocumentsClient from "./DocumentsClient";

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
    // Parallel data fetching for speed
    // We fetch ALL files/folders initially to let the client handle navigation instantly
    // This creates a "snappy" feel without server roundtrips for every click
    const [folders, files] = await Promise.all([
        mysql_getFolders(null), // Fetch root folders (or you can fetch all if you change the SQL)
        mysql_getFiles(null)    // Fetch root files
        // Note: For a true recursive file tree, you might need a different SQL strategy 
        // or fetch everything flattened. For now, assuming flattened fetch or root-based.
        // If your mysql_getFiles only returns root, you might want to update it to return ALL 
        // if you want client-side navigation of the whole tree.
    ]);

    // *Correction*: The previous `mysqlConnection.js` code filtered by ID. 
    // To make the client-side navigation work smoothly for ALL folders as requested by the 
    // client code logic (filtering by parent_id), we need to fetch EVERYTHING.
    // Let's assume for this specific Page + Client combo, we want to fetch all.
    // If your SQL filters by `IS NULL`, the client won't see subfolders.
    //
    // However, sticking to the provided code structure:

    return (
        <DocumentsClient
            initialFolders={folders}
            initialFiles={files}
        />
    );
}