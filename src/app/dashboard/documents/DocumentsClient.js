// app/dashboard/documents/DocumentsClient.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Folder, 
  Upload, 
  Plus, 
  File as FileIcon, 
  ArrowLeft,
  Download,
  Trash2,
  MoreVertical
} from "lucide-react";
import { createFolderAction, uploadFileAction, deleteFileAction, deleteFolderAction } from "./actions";

export default function DocumentsClient({ initialFolders = [], initialFiles = [] }) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState(null);

    // 1. Filter Data
    const visibleFolders = initialFolders.filter(f => f.parent_id === currentFolderId);
    const visibleFiles = initialFiles.filter(f => f.folder_id === currentFolderId);
    
    const currentFolderObj = initialFolders.find(f => f.internalid === currentFolderId);

    // 2. Handlers
    async function handleUpload(event) {
        event.preventDefault();
        setIsUploading(true);
        const formData = new FormData(event.target);
        if (currentFolderId) formData.append("folderId", currentFolderId);

        const result = await uploadFileAction(formData);
        if (result.success) {
            event.target.reset();
            router.refresh();
        } else {
            alert("Error: " + result.error);
        }
        setIsUploading(false);
    }

async function handleDeleteFile(internalid) {
    console.log("Button Clicked! ID:", internalid); // <--- LOOK FOR THIS IN BROWSER CONSOLE

    if(!confirm("Are you sure you want to delete this file?")) return;
    
    const formData = new FormData();
    formData.append("internalid", internalid);
    
    console.log("Sending to server..."); // <--- LOOK FOR THIS IN BROWSER CONSOLE
    
    await deleteFileAction(formData);
    
    console.log("Server finished."); // <--- LOOK FOR THIS IN BROWSER CONSOLE
    router.refresh();
}

    async function handleDeleteFolder(internalid) {
        if(!confirm("Delete this folder? Files inside will be moved to Root.")) return;
        const formData = new FormData();
        formData.append("internalid", internalid);
        await deleteFolderAction(formData);
        router.refresh();
    }

    // 3. Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="p-6 space-y-6">
            
            {/* Header & Breadcrumbs */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Folder className="text-blue-500" /> Documents
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <button 
                        onClick={() => setCurrentFolderId(null)}
                        className={`hover:text-blue-600 transition ${!currentFolderId ? 'font-bold text-gray-900' : ''}`}
                    >
                        Root
                    </button>
                    {currentFolderObj && (
                        <>
                            <span>/</span>
                            <span className="font-bold text-gray-900">{currentFolderObj.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-medium">
                {currentFolderId && (
                    <button 
                        onClick={() => setCurrentFolderId(currentFolderObj?.parent_id || null)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all duration-200"
                        title="Go Up Level"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* New Folder */}
                <form action={createFolderAction} className="flex gap-2 items-center border-r border-gray-200 pr-4">
                    <input type="hidden" name="parentId" value={currentFolderId || ""} />
                    <input 
                        name="name" 
                        placeholder="New Folder..." 
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 ring-primary-500 outline-none transition-all duration-200"
                        required 
                    />
                    <button className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-all duration-200">
                        <Plus size={18} />
                    </button>
                </form>

                {/* Upload */}
                <form onSubmit={handleUpload} className="flex gap-2 items-center flex-1">
                    <input 
                        type="file" 
                        name="file"
                        required
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <button 
                        type="submit" 
                        disabled={isUploading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm font-medium text-sm"
                    >
                        {isUploading ? "Uploading..." : <><Upload size={16} /> Upload</>}
                    </button>
                </form>
            </div>

            {/* List View (Table) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-medium">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-secondary-500 w-12">Type</th>
                            <th className="px-6 py-3 font-medium text-secondary-500">Name</th>
                            <th className="px-6 py-3 font-medium text-secondary-500 w-48">Date Added</th>
                            <th className="px-6 py-3 font-medium text-secondary-500 text-right w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        
                        {/* 1. Folders */}
                        {visibleFolders.map((folder) => (
                            <tr 
                                key={`folder-${folder.internalid}`} 
                                className="hover:bg-secondary-50 transition-colors group cursor-pointer"
                                onClick={() => setCurrentFolderId(folder.internalid)}
                            >
                                <td className="px-6 py-3">
                                    <Folder className="text-primary-500 fill-primary-50" size={20} />
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-900">
                                    {folder.name}
                                </td>
                                <td className="px-6 py-3 text-secondary-500">
                                    {formatDate(folder.created_at)}
                                </td>
                                <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleDeleteFolder(folder.internalid)}
                                        className="p-1.5 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Delete Folder"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* 2. Files */}
                        {visibleFiles.map((file) => (
                            <tr key={`file-${file.internalid}`} className="hover:bg-secondary-50 transition-colors group">
                                <td className="px-6 py-3">
                                    {file.type && file.type.startsWith("image/") ? (
                                        <div className="w-8 h-8 rounded bg-secondary-100 overflow-hidden border border-gray-200">
                                            <img src={file.url} alt="thumbnail" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <FileIcon className="text-gray-400" size={20} />
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    <a href={file.url} target="_blank" className="text-gray-700 hover:text-primary-600 hover:underline font-medium">
                                        {/* Remove timestamp prefix for clean display */}
                                        {file.name.includes('_') ? file.name.split('_').slice(1).join('_') : file.name}
                                    </a>
                                </td>
                                <td className="px-6 py-3 text-secondary-500">
                                    {formatDate(file.created_at)}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a 
                                            href={file.url} 
                                            download 
                                            target="_blank"
                                            className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </a>
                                        <button 
                                            onClick={() => handleDeleteFile(file.internalid)}
                                            className="p-1.5 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            title="Delete File"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Empty State */}
                        {visibleFolders.length === 0 && visibleFiles.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                    This folder is empty
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}