"use client";

import { useState, useEffect } from "react";
import {
    Clock, Calendar, Save, CheckCircle2, Lock,
    Filter, Image as ImageIcon, Plus, X
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
    const [tasks, setTasks] = useState([]); // Tasks based on selected project
    const [userLevel, setUserLevel] = useState(3);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormState());

    function initialFormState() {
        return {
            internalid: null,
            project_id: "",
            date: new Date().toISOString().split('T')[0], // Today
            hours: "",
            task_name: "",
            memo: "",
            image_url: ""
        };
    }

    // Load Data
    useEffect(() => {
        loadData();
        loadProjects();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const res = await getTimeEntriesAction();
        setEntries(res.data);
        setUserLevel(res.currentUserLevel);
        setIsLoading(false);
    }

    async function loadProjects() {
        const res = await getProjectsAction();
        setProjects(res.data);
    }

    // When project changes, fetch tasks from estimates
    async function handleProjectChange(e) {
        const pid = e.target.value;
        setFormData({ ...formData, project_id: pid, task_name: "" }); // Reset task
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
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });

        const res = await saveTimeEntryAction(data);
        if (res.success) {
            setIsFormOpen(false);
            setFormData(initialFormState());
            loadData();
        } else {
            alert(res.error);
        }
    }

    function handleEdit(entry) {
        if (userLevel === 3 && entry.status === 'Approved') {
            alert("This entry is approved and locked.");
            return;
        }
        setFormData(entry);
        // Prefetch tasks for this project so the dropdown works
        getProjectTasksAction(entry.project_id).then(setTasks);
        setIsFormOpen(true);
    }

    async function toggleApprove(id, currentStatus) {
        const newStatus = currentStatus === 'Approved' ? 'Pending' : 'Approved';
        await toggleApprovalAction(id, newStatus);
        loadData();
    }

    return (
        <div className="space-y-6 animate-in fade-in pb-20">

            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-white flex items-center gap-3">
                        <Clock className="text-amber-600" size={32} />
                        Time Entries
                    </h1>
                    <p className="text-stone-500">Track hours and tasks.</p>
                </div>
                <button
                    onClick={() => { setFormData(initialFormState()); setIsFormOpen(true); }}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                    <Plus size={18} /> Log Time
                </button>
            </div>

            {/* --- ENTRY FORM MODAL --- */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#1c1917] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95">
                        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-900/50">
                            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                                {formData.internalid ? "Edit Entry" : "New Time Entry"}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)}><X className="text-stone-400 hover:text-stone-600" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase">Date</label>
                                    <input type="date" required value={formData.date ? formData.date.split('T')[0] : ''} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 outline-none dark:text-white" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase">Hours</label>
                                    <input type="number" step="0.25" required value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 outline-none dark:text-white" placeholder="0.00" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase">Project</label>
                                <select required value={formData.project_id} onChange={handleProjectChange} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 outline-none dark:text-white">
                                    <option value="">-- Select Project --</option>
                                    {projects.map(p => <option key={p.internalid} value={p.internalid}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase">Task (From Estimate)</label>
                                <div className="relative">
                                    <select required value={formData.task_name} onChange={e => setFormData({ ...formData, task_name: e.target.value })} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 outline-none dark:text-white">
                                        <option value="">-- Select Task --</option>
                                        {tasks.map((t, i) => <option key={i} value={t.task_name}>{t.task_name}</option>)}
                                        <option value="General">General / Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase">Memo</label>
                                <textarea value={formData.memo || ''} onChange={e => setFormData({ ...formData, memo: e.target.value })} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 outline-none dark:text-white" rows="3" placeholder="What did you work on?" />
                            </div>

                            {/* Placeholder for Image Upload - integrate your existing upload logic here */}
                            <div>
                                <label className="text-xs font-bold text-stone-400 uppercase">Attach Photo (URL for now)</label>
                                <input type="text" value={formData.image_url || ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5 outline-none dark:text-white" placeholder="https://..." />
                            </div>

                            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all">Save Entry</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- ENTRIES LIST --- */}
            <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-400 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Project / Task</th>
                            <th className="px-6 py-4 text-center">Hours</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                        {entries.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-stone-400">No time entries found.</td></tr>
                        ) : entries.map(entry => (
                            <tr
                                key={entry.internalid}
                                onClick={() => handleEdit(entry)}
                                className={`group transition-colors cursor-pointer ${entry.status === 'Approved' ? 'bg-stone-50/50 dark:bg-stone-900/20' : 'hover:bg-stone-50 dark:hover:bg-stone-900/30'}`}
                            >
                                <td className="px-6 py-4 text-stone-500 font-mono">
                                    {new Date(entry.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={entry.avatar_url || "/system/user_placeholder.png"} className="w-8 h-8 rounded-full bg-stone-200" />
                                        <span className="font-bold text-stone-700 dark:text-stone-300">{entry.employee_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-stone-800 dark:text-white">{entry.project_name}</div>
                                    <div className="text-stone-500 text-xs">{entry.task_name}</div>
                                    {entry.memo && <div className="text-stone-400 italic text-xs mt-1 truncate max-w-[200px]">{entry.memo}</div>}
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-bold text-lg text-stone-600 dark:text-stone-300">
                                    {entry.hours}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    {userLevel <= 2 ? (
                                        // Admin Toggle
                                        <button
                                            onClick={() => toggleApprove(entry.internalid, entry.status)}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${entry.status === 'Approved'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                                }`}
                                        >
                                            {entry.status === 'Approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {entry.status}
                                        </button>
                                    ) : (
                                        // Employee View (Read Only)
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entry.status === 'Approved' ? 'text-green-600 bg-green-50' : 'text-stone-400 bg-stone-100'
                                            }`}>
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
        </div>
    );
}