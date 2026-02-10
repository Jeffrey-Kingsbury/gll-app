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
  Home,
  ChevronRight,
  Image as ImageIcon
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
        if(!confirm("Are you sure you want to delete this file?")) return;
        
        const formData = new FormData();
        formData.append("internalid", internalid);
        await deleteFileAction(formData);
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
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-2">
                
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-sm text-stone-50">
                    <button 
                        onClick={() => setCurrentFolderId(null)}
                        className={`flex items-center gap-1 hover:text-amber-600 transition-colors ${!currentFolderId ? 'font-bold text-stone-50' : ''}`}
                    >
                        <Home size={14} />
                        <span>Root</span>
                    </button>
                    {currentFolderObj && (
                        <>
                            <ChevronRight size={14} className="text-stone-300" />
                            <span className="font-bold text-stone-50 border-b-2 border-amber-500/50">
                                {currentFolderObj.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Toolbar - Dark Stone Theme */}
            <div className="flex flex-wrap items-center gap-4 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm text-[#eaddcf]">
                {currentFolderId && (
                    <button 
                        onClick={() => setCurrentFolderId(currentFolderObj?.parent_id || null)}
                        className="p-2 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-[#eaddcf] transition-all duration-200"
                        title="Go Up Level"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* New Folder Form */}
                <form action={createFolderAction} className="flex gap-2 items-center border-r border-stone-700 pr-4">
                    <input type="hidden" name="parentId" value={currentFolderId || ""} />
                    <input 
                        name="name" 
                        placeholder="New Folder..." 
                        className="w-32 px-3 py-2 border border-stone-700 rounded-lg text-sm bg-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-stone-500 text-[#eaddcf]"
                        required 
                    />
                    <button className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-2 rounded-lg transition-all duration-200">
                        <Plus size={18} />
                    </button>
                </form>

                {/* Upload Form */}
                <form onSubmit={handleUpload} className="flex gap-3 items-center flex-1">
                    <input 
                        type="file" 
                        name="file"
                        required
                        className="block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-stone-800 file:text-[#eaddcf] hover:file:bg-stone-700 cursor-pointer"
                    />
                    <button 
                        type="submit" 
                        disabled={isUploading}
                        className="bg-amber-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-600 disabled:opacity-70 disabled:cursor-not-allowed transition shadow-md font-medium text-sm whitespace-nowrap ml-auto"
                    >
                        {isUploading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Uploading...</span>
                            </div>
                        ) : (
                            <><Upload size={16} /> Upload File</>
                        )}
                    </button>
                </form>
            </div>

            {/* List View (Table) - Dark Stone Theme */}
            <div className="bg-[#1c1917] rounded-xl border border-stone-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-[#eaddcf]">
                    <thead className="bg-stone-800 border-b border-stone-700">
                        <tr>
                            <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs w-16">Type</th>
                            <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Name</th>
                            <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs w-48">Date Added</th>
                            <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                        
                        {/* 1. Folders */}
                        {visibleFolders.map((folder) => (
                            <tr 
                                key={`folder-${folder.internalid}`} 
                                className="hover:bg-stone-800/50 transition-colors group cursor-pointer"
                                onClick={() => setCurrentFolderId(folder.internalid)}
                            >
                                <td className="px-6 py-4">
                                    <Folder className="text-amber-500 fill-amber-500/20" size={24} />
                                </td>
                                <td className="px-6 py-4 font-medium text-[#eaddcf] group-hover:text-white transition-colors">
                                    {folder.name}
                                </td>
                                <td className="px-6 py-4 text-stone-500 text-xs">
                                    {formatDate(folder.created_at)}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleDeleteFolder(folder.internalid)}
                                        className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                        title="Delete Folder"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* 2. Files */}
                        {visibleFiles.map((file) => (
                            <tr key={`file-${file.internalid}`} className="hover:bg-stone-800/50 transition-colors group">
                                <td className="px-6 py-4">
                                    {file.type && file.type.startsWith("image/") ? (
                                        <div className="w-8 h-8 rounded-md bg-stone-800 overflow-hidden border border-stone-700 flex items-center justify-center">
                                            <img src={file.url} alt="thumb" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <FileIcon className="text-stone-500" size={20} />
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <a 
                                        href={file.url} 
                                        target="_blank" 
                                        className="text-[#eaddcf] hover:text-white hover:underline font-medium flex items-center gap-2"
                                    >
                                        {file.name.includes('_') ? file.name.split('_').slice(1).join('_') : file.name}
                                    </a>
                                </td>
                                <td className="px-6 py-4 text-stone-500 text-xs">
                                    {formatDate(file.created_at)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a 
                                            href={file.url} 
                                            download 
                                            target="_blank"
                                            className="p-2 text-stone-500 hover:text-[#eaddcf] hover:bg-stone-700 rounded-lg transition-all duration-200"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </a>
                                        <button 
                                            onClick={() => handleDeleteFile(file.internalid)}
                                            className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200"
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
                                <td colSpan="4" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-stone-600">
                                        <Folder size={48} className="mb-3 opacity-20" />
                                        <p className="text-stone-500 font-medium">This folder is empty</p>
                                        <p className="text-xs text-stone-600 mt-1">Upload a file or create a folder to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}