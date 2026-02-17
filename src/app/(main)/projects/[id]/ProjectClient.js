"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Calendar, Users, Clock,
    Layout, FileText, Briefcase, CheckCircle2,
    Mail, Phone, ExternalLink, Pencil, Save, X, Trash2
} from "lucide-react";
import { updateProjectAction, deleteProjectAction } from "../actions";

export default function ProjectClient({ data }) {
    const router = useRouter();
    const { project, estimates, timeEntries } = data;

    const [activeTab, setActiveTab] = useState("details");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State (Initialized with current data)
    const [formData, setFormData] = useState({
        internalid: project.internalid,
        name: project.name,
        status: project.status,
        budget: project.budget,
        description: project.description,
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ""
    });

    // --- HANDLERS ---

    async function handleSave() {
        setIsSaving(true);
        const payload = new FormData();
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));

        const res = await updateProjectAction(payload);
        if (res.success) {
            setIsEditing(false);
            router.refresh(); // Refresh server data
        } else {
            alert("Error saving: " + res.error);
        }
        setIsSaving(false);
    }

    async function handleDelete() {
        if (!confirm("Are you sure? This will delete the project. Linked estimates will lose their project association.")) return;

        const res = await deleteProjectAction(project.internalid);
        if (res.success) {
            router.push("/projects");
        } else {
            alert("Delete failed: " + res.error);
        }
    }

    // Helper for Status Colors
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Planning': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-stone-100 text-stone-500 border-stone-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20">

            {/* --- HEADER --- */}
            <div className="space-y-4">
                <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-amber-600 transition-colors">
                    <ArrowLeft size={16} /> Back to Projects
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">

                            {isEditing ? (
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-stone-300 bg-white outline-none"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Planning">Planning</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            )}
                            <span className="text-stone-400 text-sm font-mono">#{project.internalid}</span>
                        </div>

                        {isEditing ? (
                            <input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="text-4xl font-bold text-stone-900 dark:text-white font-serif bg-transparent border-b-2 border-amber-500/50 focus:border-amber-500 outline-none w-full max-w-lg"
                            />
                        ) : (
                            <h1 className="text-4xl font-bold text-stone-900 dark:text-white font-serif">{project.name}</h1>
                        )}

                        <div className="flex items-center gap-2 text-stone-500 mt-2">
                            <Briefcase size={16} />
                            <span className="font-medium">{project.company_name || "Unknown Client"}</span>
                        </div>
                    </div>

                    {/* Key Stats & Action Buttons */}
                    <div className="flex flex-col items-end gap-4">
                        {/* Edit / Save Buttons */}
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md active:scale-95 transition-all">
                                        {isSaving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                                    </button>
                                    {/* DELETE BUTTON (Only in Edit Mode) */}


                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-2 bg-red-700 text-white hover:bg-red-800 border border-red-700 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        <Trash2 size={16} /> Delete Project
                                    </button>


                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-500 hover:text-amber-600 rounded-lg transition-all shadow-sm"
                                >
                                    <Pencil size={14} /> Edit Project
                                </button>
                            )}

                        </div>
                        <div className="flex gap-4 md:gap-8">
                            <div>
                                <span className="block text-xs font-bold text-stone-400 uppercase">Budget</span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                        className="block w-32 text-xl font-mono font-bold text-stone-900 dark:text-white bg-transparent border-b border-stone-300 focus:border-amber-500 outline-none"
                                    />
                                ) : (
                                    <span className="block text-xl font-mono font-bold text-stone-900 dark:text-white">
                                        ${parseFloat(project.budget || 0).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-stone-400 uppercase">Spent (Est)</span>
                                <span className="block text-xl font-mono font-bold text-stone-900 dark:text-white">
                                    ${timeEntries.reduce((sum, t) => sum + (parseFloat(t.hours) * 65), 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl w-full md:w-fit">
                <TabButton id="details" label="Details" icon={<Layout size={16} />} active={activeTab} onClick={setActiveTab} />
                <TabButton id="time" label="Time Entries" icon={<Clock size={16} />} count={timeEntries.length} active={activeTab} onClick={setActiveTab} />
                <TabButton id="estimates" label="Estimates" icon={<FileText size={16} />} count={estimates.length} active={activeTab} onClick={setActiveTab} />
                <TabButton id="contacts" label="Contacts" icon={<Users size={16} />} active={activeTab} onClick={setActiveTab} />
            </div>

            {/* --- TAB CONTENT --- */}
            <div className="min-h-[400px]">

                {/* 1. DETAILS TAB */}
                {activeTab === "details" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Info Card */}
                        <div className="md:col-span-2 bg-white dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm relative">
                            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Project Overview</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-stone-400 uppercase block mb-2">Description</label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.description || ""}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={5}
                                            className="w-full p-3 bg-stone-200 border border-stone-700 rounded-lg outline-none focus:ring-1 focus:ring-amber-500/50 text-stone-900"
                                        />
                                    ) : (
                                        <p className="text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                                            {project.description || "No description provided."}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Start Date</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={formData.start_date}
                                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full p-2 bg-stone-50  border border-stone-200 rounded-lg"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-medium">
                                                <Calendar size={16} className="text-amber-600" />
                                                {project.start_date ? new Date(project.start_date).toLocaleDateString() : "Not set"}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Deadline</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={formData.deadline}
                                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-medium">
                                                <CheckCircle2 size={16} className="text-amber-600" />
                                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Client Info Card (Read-Only) */}
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 h-fit">
                            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-4">Client Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Briefcase className="mt-1 text-stone-400" size={16} />
                                    <div>
                                        <div className="font-bold text-stone-800 dark:text-stone-200">{project.company_name}</div>
                                        <div className="text-xs text-stone-500">Customer ID: {project.customer_id}</div>
                                    </div>
                                </div>
                                {project.client_email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="text-stone-400" size={16} />
                                        <a href={`mailto:${project.client_email}`} className="text-sm text-amber-600 hover:underline">{project.client_email}</a>
                                    </div>
                                )}
                                {project.client_phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="text-stone-400" size={16} />
                                        <span className="text-sm text-stone-600 dark:text-stone-300">{project.client_phone}</span>
                                    </div>
                                )}
                                <Link href={`/customers/${project.customer_id}`} className="flex items-center justify-center gap-2 w-full mt-4 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 py-2 rounded-lg text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-amber-600 transition-colors shadow-sm">
                                    View Customer Profile <ExternalLink size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* ... (Keep Time Entries, Estimates, Contacts tabs exactly as they were) ... */}
                {/* Repeat the previous Time/Estimates tabs code here to keep them visible */}
                {activeTab === "time" && (
                    <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-400 font-bold uppercase text-xs border-b border-stone-100 dark:border-stone-800">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Task</th>
                                    <th className="px-6 py-4 text-center">Hours</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                                {timeEntries.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-stone-400">No time entries recorded for this project yet.</td></tr>
                                ) : timeEntries.map(entry => (
                                    <tr key={entry.internalid} className="hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors">
                                        <td className="px-6 py-4 text-stone-500 font-mono">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <img src={entry.avatar_url || "/system/user_placeholder.png"} className="w-6 h-6 rounded-full bg-stone-200" />
                                                <span className="font-medium text-stone-700 dark:text-stone-300">{entry.employee_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-stone-800 dark:text-white">{entry.task_name}</div>
                                            {entry.memo && <div className="text-xs text-stone-400 truncate max-w-[200px]">{entry.memo}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-bold">{entry.hours}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${entry.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "estimates" && (
                    <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-400 font-bold uppercase text-xs border-b border-stone-100 dark:border-stone-800">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Estimate Name</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                                {estimates.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-stone-400">No estimates found for this project.</td></tr>
                                ) : estimates.map(est => (
                                    <tr key={est.internalid} className="hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors group">
                                        <td className="px-6 py-4 text-stone-500 font-mono">{new Date(est.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold text-stone-800 dark:text-white">{est.project_name || "Untitled Estimate"}</td>
                                        <td className="px-6 py-4 text-right font-mono font-medium">${est.grand_total?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-bold">{est.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/estimates/${est.internalid}`} className="text-amber-600 hover:underline font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ id, label, icon, count, active, onClick }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${isActive
                ? "bg-white dark:bg-[#1c1917] text-stone-900 dark:text-white shadow-sm"
                : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800"
                }`}
        >
            {icon}
            <span>{label}</span>
            {count !== undefined && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-stone-100 dark:bg-stone-800' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}