"use client";

import { useState, useEffect } from "react";
import {
    Clock, Calendar, Save, CheckCircle2, Lock, PersonStanding, User,
    Filter, Plus, X, ArrowUp, ArrowDown, RefreshCcw, UploadCloud, Trash2, Image as ImageIcon,
} from "lucide-react";
import {
    getTimeEntriesAction,
    getProjectTasksAction,
    saveTimeEntryAction,
    toggleApprovalAction
} from "./actions";
import { getProjectsAction } from "../projects/actions";

export default function TimeEntriesPage() {
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [userLevel, setUserLevel] = useState(3);
    const [isLoading, setIsLoading] = useState(true);

    // --- FILTERS & SORTING STATE ---
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        projectId: ""
    });
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // --- FORM STATE ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormState());

    function initialFormState() {
        return {
            internalid: null,
            project_id: "",
            date: new Date().toISOString().split('T')[0],
            hours: "",
            task_name: "",
            memo: "",
            image_url: "", // Stores the DB URL
            image_file: null // Stores the actual File object
        };
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) return alert("File too large (Max 10MB)");

            // Create a fake URL for preview
            const previewUrl = URL.createObjectURL(file);
            setFormData({
                ...formData,
                image_file: file,
                image_url: previewUrl // Temporarily show the local file
            });
        }
    }


    // 1. Initialize Dates (Current Week) & Fetch Data
    useEffect(() => {
        // Calculate current week (Monday to Sunday)
        const today = new Date();
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

        const monday = new Date(today.setDate(diff));
        const sunday = new Date(today.setDate(diff + 6));

        setFilters(prev => ({
            ...prev,
            startDate: monday.toISOString().split('T')[0],
            endDate: sunday.toISOString().split('T')[0]
        }));

        loadProjects();
    }, []);

    // 2. Trigger fetch when filters or sort change
    useEffect(() => {
        if (filters.startDate) { // Wait for init
            loadData();
        }
    }, [filters, sortConfig]);

    async function loadData() {
        setIsLoading(true);
        const res = await getTimeEntriesAction({
            projectIdFilter: filters.projectId,
            startDate: filters.startDate,
            endDate: filters.endDate,
            sortCol: sortConfig.key,
            sortDir: sortConfig.direction
        });
        setEntries(res.data);
        setUserLevel(res.currentUserLevel);
        setIsLoading(false);
    }

    async function loadProjects() {
        const res = await getProjectsAction();
        setProjects(res.data);
    }

    // --- HANDLERS ---

    function handleSort(key) {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    }

    async function handleProjectChange(e) {
        const pid = e.target.value;
        setFormData({ ...formData, project_id: pid, task_name: "" });
        if (pid) {
            const taskList = await getProjectTasksAction(pid);
            setTasks(taskList);
        } else {
            setTasks([]);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const data = new FormData();

        // Append standard fields
        data.append("internalid", formData.internalid || "");
        data.append("project_id", formData.project_id);
        data.append("date", formData.date);
        data.append("hours", formData.hours);
        data.append("task_name", formData.task_name);
        data.append("memo", formData.memo);

        // Append File Logic
        if (formData.image_file) {
            data.append("image_file", formData.image_file);
        }
        // If no new file, but we have an old URL, send it so we don't lose it
        // (Note: The server action logic I wrote handles this via "existing_image_url")
        if (formData.image_url && !formData.image_file) {
            data.append("existing_image_url", formData.image_url);
        }

        const res = await saveTimeEntryAction(data);
        if (res.success) {
            setIsFormOpen(false);
            setFormData(initialFormState());
            loadData(); // Refresh list
        } else {
            alert(res.error);
        }
    }

    function handleEdit(entry) {
        if (userLevel === 3 && entry.status === 'Approved') return alert("Entry is locked.");
        setFormData(entry);
        getProjectTasksAction(entry.project_id).then(setTasks);
        setIsFormOpen(true);
    }

    async function toggleApprove(id, currentStatus) {
        await toggleApprovalAction(id, currentStatus === 'Approved' ? 'Pending' : 'Approved');
        loadData();
    }

    return (
        <div className="space-y-6 animate-in fade-in pb-20">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Clock className="text-amber-600" size={32} />
                        Time Entries
                    </h1>
                    <p className="text-stone-500">Track and approve hours.</p>
                </div>
                <button
                    onClick={() => { setFormData(initialFormState()); setIsFormOpen(true); }}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                    <Plus size={18} /> Log Time
                </button>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-auto">
                    <label className="text-xs font-bold text-stone-400 uppercase block mb-1">Start Date</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full md:w-40 bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2 text-sm outline-none text-white"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <label className="text-xs font-bold text-stone-400 uppercase block mb-1">End Date</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full md:w-40 bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2 text-sm outline-none text-white"
                    />
                </div>
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-stone-400 uppercase block mb-1">Filter Project</label>
                    <select
                        value={filters.projectId}
                        onChange={e => setFilters({ ...filters, projectId: e.target.value })}
                        className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2 text-sm outline-none text-white"
                    >
                        <option value="">All Projects</option>
                        {projects.map(p => <option key={p.internalid} value={p.internalid}>{p.name}</option>)}
                    </select>
                </div>
                <button onClick={loadData} className="p-2 bg-stone-100 bg-stone-800 text-stone-500 rounded-lg hover:text-amber-600 transition-colors">
                    <RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* --- ENTRIES TABLE --- */}
            <div className="bg-[#1c1917] border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-900/50 text-stone-400 font-bold uppercase text-xs">
                        <tr>
                            <SortableHeader label="Date" colKey="date" align="center" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Employee" colKey="employee" align="center" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Project / Task" colKey="project" align="center" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Hours" colKey="hours" align="center" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Memo" colKey="memo" align="center" currentSort={sortConfig} onSort={handleSort} />
                            <SortableHeader label="Status" colKey="status" align="center" currentSort={sortConfig} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 divide-stone-800/50">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-stone-400 animate-pulse">Loading data...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-stone-400">No time entries found for this period.</td></tr>
                        ) : entries.map(entry => (
                            <tr
                                key={entry.internalid}
                                onClick={() => handleEdit(entry)}
                                className={`group transition-colors cursor-pointer hover:bg-stone-800`}
                            >
                                <td className="px-6 py-4 text-stone-500 font-mono">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <User className="w-6 h-6 text-stone-300" />
                                        <span className="font-bold text-stone-300">{entry.employee_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{entry.project_name}</div>
                                    <div className="text-stone-500 text-xs">{entry.task_name}</div>
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-bold text-lg text-stone-300">{entry.hours}</td>
                                <td className="px-6 py-4 text-left font-mono font-bold text-xs text-stone-300">{entry.memo}</td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    {userLevel <= 2 ? (
                                        <button
                                            onClick={() => toggleApprove(entry.internalid, entry.status)}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${entry.status === 'Approved'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                                }`}
                                        >
                                            {entry.status === 'Approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {entry.status}
                                        </button>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entry.status === 'Approved' ? 'text-green-600 bg-green-50' : 'text-stone-400 bg-stone-100'}`}>
                                            {entry.status === 'Approved' && <Lock size={10} />}
                                            {entry.status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- FORM MODAL (Same as before) --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1c1917] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-800 animate-in zoom-in-95">
                        <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
                            <h3 className="text-lg font-bold text-white">{formData.internalid ? "Edit Entry" : "New Time Entry"}</h3>
                            <button onClick={() => setIsFormOpen(false)}><X className="text-stone-400 hover:text-stone-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-stone-400 uppercase">Date</label><input type="date" required value={formData.date ? formData.date.split('T')[0] : ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none text-white" /></div>
                                <div><label className="text-xs font-bold text-stone-400 uppercase">Hours</label><input type="number" step="0.25" required value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none text-white" /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase">Project</label>
                                <select value={formData.project_id} onChange={handleProjectChange} className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none text-white">
                                    <option value="">-- Select Project --</option>
                                    {projects.map(p => <option key={p.internalid} value={p.internalid}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase">Task</label>
                                <select required value={formData.task_name} onChange={e => setFormData({ ...formData, task_name: e.target.value })} className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none text-white">
                                    <option value="">-- Select Task --</option>
                                    {tasks.map((t, i) => <option key={i} value={t.task_name}>{t.task_name}</option>)}
                                    <option value="General">General / Other</option>
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-stone-400 uppercase">Memo</label><textarea value={formData.memo || ''} onChange={e => setFormData({ ...formData, memo: e.target.value })} className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none text-white" rows="3" /></div>
                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Attachment</label>

                                {/* Preview Area */}
                                {formData.image_url ? (
                                    <div className="relative w-full h-40 bg-stone-900 rounded-xl overflow-hidden group border border-stone-200 border-stone-700">
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: "", image_file: null })}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex items-center gap-2"
                                            >
                                                <Trash2 size={16} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Upload Box */
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-700 rounded-xl cursor-pointer hover:bg-stone-900/50 hover:border-amber-500 transition-all group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-3 text-stone-400 group-hover:text-amber-500 transition-colors" />
                                            <p className="mb-1 text-sm text-stone-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-stone-400">JPG, PNG, WEBP (Max 10MB)</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>                            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all">Save Entry</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUB-COMPONENT: Sortable Header ---
function SortableHeader({ label, colKey, align = "left", currentSort, onSort }) {
    const isSorted = currentSort.key === colKey;
    return (
        <th className={`px-6 py-4 cursor-pointer hover:text-amber-600 transition-colors text-${align}`} onClick={() => onSort(colKey)}>
            <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}>
                {label}
                {isSorted && (
                    currentSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                )}
            </div>
        </th>
    );
}