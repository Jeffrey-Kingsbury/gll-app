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
    HardDrive
} from "lucide-react";
import { createFolderAction, uploadFileAction, deleteFileAction, deleteFolderAction } from "./actions";

export default function DocumentsClient({ initialFolders = [], initialFiles = [] }) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState(null);

    // --- STORAGE LOGIC ---
    const MAX_STORAGE_GB = 50;
    const MAX_STORAGE_BYTES = MAX_STORAGE_GB * 1024 * 1024 * 1024;

    // Calculate total used bytes from the initialFiles array
    const totalUsedBytes = initialFiles.reduce((acc, file) => acc + (parseInt(file.size) || 0), 0);

    // Calculate percentage (capped at 100%)
    const usagePercentage = Math.min((totalUsedBytes / MAX_STORAGE_BYTES) * 100, 100);

    // Color logic: Amber normally, Red if over 90%
    const barColor = usagePercentage > 90 ? "bg-red-500" : "bg-amber-600";

    // Helper to format bytes cleanly (e.g. "12.5 MB")
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 1. Filter Data (Client-Side Navigation)
    const visibleFolders = initialFolders.filter(f => f.parent_id === currentFolderId);
    const visibleFiles = initialFiles.filter(f => f.folder_id === currentFolderId);

    const currentFolderObj = initialFolders.find(f => f.internalid === currentFolderId);

    // 2. Handlers
    async function handleUpload(event) {
        event.preventDefault();

        const fileInput = event.target.file; // Access by name="file"
        const file = fileInput?.files?.[0];

        if (!file) return;

        // Quick Client-Side Check
        if (totalUsedBytes + file.size > MAX_STORAGE_BYTES) {
            alert("Storage limit reached! Cannot upload this file.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        if (currentFolderId) formData.append("folderId", currentFolderId);

        try {
            const result = await uploadFileAction(formData);
            if (result.success) {
                // Clear the input
                fileInput.value = "";
                router.refresh();
            } else {
                alert("Error: " + (result.error || "Upload failed"));
            }
        } catch (error) {
            console.error(error);
            alert("Upload failed unexpectedly");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleCreateFolder(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        if (currentFolderId) formData.append("parentId", currentFolderId);

        await createFolderAction(formData);
        form.reset();
        router.refresh();
    }

    async function handleDeleteFile(internalid) {
        if (!confirm("Are you sure you want to delete this file?")) return;

        const formData = new FormData();
        formData.append("internalid", internalid);
        await deleteFileAction(formData);
        router.refresh();
    }

    async function handleDeleteFolder(internalid) {
        if (!confirm("Delete this folder? Files inside will be moved to Root.")) return;
        const formData = new FormData();
        formData.append("internalid", internalid);
        await deleteFolderAction(formData);
        router.refresh();
    }

    // 3. Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                {/* Breadcrumbs */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-stone-50">
                        <button
                            onClick={() => setCurrentFolderId(null)}
                            className={`flex items-center gap-1 hover:text-amber-600 transition-colors ${!currentFolderId ? 'font-bold text-stone-50' : 'text-stone-400'}`}
                        >
                            <Home size={16} />
                            <span>Root</span>
                        </button>
                        {currentFolderObj && (
                            <>
                                <ChevronRight size={14} className="text-stone-500" />
                                <span className="font-bold text-amber-500 border-b border-amber-500/30 pb-0.5">
                                    {currentFolderObj.name}
                                </span>
                            </>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-stone-100">
                        {currentFolderObj ? currentFolderObj.name : "Documents"}
                    </h1>
                </div>

                {/* --- STORAGE WIDGET --- */}
                <div className="w-full md:w-72 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs text-stone-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                            <HardDrive size={14} />
                            <span>Storage</span>
                        </div>
                        <span className={usagePercentage > 90 ? "text-red-500" : "text-stone-400"}>
                            {formatBytes(totalUsedBytes)} / {MAX_STORAGE_GB} GB
                        </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                        <div
                            className={`h-full ${barColor} transition-all duration-500 ease-out`}
                            style={{ width: `${usagePercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Toolbar - Dark Stone Theme */}
            <div className="flex flex-wrap items-center gap-4 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm text-[#eaddcf]">
                {currentFolderId && (
                    <button
                        onClick={() => setCurrentFolderId(currentFolderObj?.parent_id || null)}
                        className="p-2.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-400 hover:text-white transition-all duration-200 border border-stone-700"
                        title="Go Up Level"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}

                {/* New Folder Form */}
                <form onSubmit={handleCreateFolder} className="flex gap-2 items-center border-r border-stone-800 pr-4 mr-2">
                    <div className="relative">
                        <Folder size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                        <input
                            name="name"
                            placeholder="New Folder..."
                            className="w-40 pl-9 pr-3 py-2.5 border border-stone-700 rounded-lg text-sm bg-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-stone-600 text-stone-200"
                            required
                        />
                    </div>
                    <button className="bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white p-2.5 rounded-lg transition-all duration-200 border border-stone-700">
                        <Plus size={18} />
                    </button>
                </form>

                {/* Upload Form */}
                <form onSubmit={handleUpload} className="flex gap-3 items-center flex-1 justify-end">
                    <div className="relative flex-1 max-w-xs">
                        <input
                            type="file"
                            name="file"
                            required
                            className="block w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-stone-800 file:text-stone-300 hover:file:bg-stone-700 hover:file:text-white cursor-pointer"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading || usagePercentage >= 100}
                        className={`
                            px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg font-bold text-sm whitespace-nowrap
                            ${usagePercentage >= 100
                                ? "bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed"
                                : "bg-amber-700 text-white hover:bg-amber-600 hover:shadow-amber-900/20 active:scale-95"
                            }
                        `}
                    >
                        {isUploading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Uploading...</span>
                            </div>
                        ) : (
                            <><Upload size={18} /> Upload File</>
                        )}
                    </button>
                </form>
            </div>

            {/* List View (Table) */}
            <div className="bg-[#1c1917] rounded-xl border border-stone-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-[#eaddcf]">
                    <thead className="bg-stone-900/50 border-b border-stone-800">
                        <tr>
                            <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs w-16">Type</th>
                            <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs">Name</th>
                            <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs w-32">Size</th>
                            <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs w-48">Date Added</th>
                            <th className="px-6 py-4 font-bold text-stone-500 uppercase tracking-wider text-xs text-right w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/50">

                        {/* 1. Folders */}
                        {visibleFolders.map((folder) => (
                            <tr
                                key={`folder-${folder.internalid}`}
                                className="hover:bg-stone-800/40 transition-colors group cursor-pointer"
                                onClick={() => setCurrentFolderId(folder.internalid)}
                            >
                                <td className="px-6 py-4">
                                    <Folder className="text-amber-500 fill-amber-500/10" size={24} />
                                </td>
                                <td className="px-6 py-4 font-medium text-stone-200 group-hover:text-white transition-colors">
                                    {folder.name}
                                </td>
                                <td className="px-6 py-4 text-stone-600 text-xs">
                                    -
                                </td>
                                <td className="px-6 py-4 text-stone-600 text-xs">
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
                            <tr key={`file-${file.internalid}`} className="hover:bg-stone-800/40 transition-colors group">
                                <td className="px-6 py-4">
                                    {file.type && file.type.startsWith("image/") ? (
                                        <div className="w-8 h-8 rounded-md bg-stone-800 overflow-hidden border border-stone-700 flex items-center justify-center">
                                            <img src={file.url} alt="thumb" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    ) : (
                                        <FileIcon className="text-stone-500" size={20} />
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        className="text-stone-300 hover:text-white hover:underline font-medium flex items-center gap-2"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* Basic clean up of filename if stored with timestamp prefix */}
                                        {file.name}
                                    </a>
                                </td>
                                <td className="px-6 py-4 text-stone-500 text-xs font-mono">
                                    {formatBytes(file.size || 0)}
                                </td>
                                <td className="px-6 py-4 text-stone-600 text-xs">
                                    {formatDate(file.created_at)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={file.url}
                                            download
                                            target="_blank"
                                            className="p-2 text-stone-500 hover:text-white hover:bg-stone-700 rounded-lg transition-all duration-200"
                                            title="Download"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Download size={16} />
                                        </a>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.internalid); }}
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
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-stone-700">
                                        <Folder size={48} className="mb-3 opacity-20" />
                                        <p className="text-stone-500 font-medium">This folder is empty</p>
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