"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Briefcase, Plus, Search, Calendar, DollarSign,
    Trash2, X, Users, Layout
} from "lucide-react";
import { getProjectsAction, createProjectAction, deleteProjectAction, getCustomersForDropdownAction } from "./actions";

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [customers, setCustomers] = useState([]); // List for dropdown
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [projRes, custRes] = await Promise.all([
            getProjectsAction(),
            getCustomersForDropdownAction()
        ]);
        setProjects(projRes.data);
        setCustomers(custRes);
        setIsLoading(false);
    }

    // Handle Create
    async function handleSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);
        const res = await createProjectAction(formData);

        if (res.success) {
            setIsModalOpen(false);
            loadData();
        } else {
            alert("Error: " + res.error);
        }
        setIsSubmitting(false);
    }

    // Handle Delete
    async function handleDelete(id) {
        if (!confirm("Delete this project? Linked estimates will be detached.")) return;
        const res = await deleteProjectAction(id);
        if (res.success) {
            loadData();
        } else {
            alert("Cannot delete: " + res.error);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white font-serif flex items-center gap-3">
                        <Layout className="text-stone-400" size={32} />
                        Projects
                    </h1>
                    <p className="text-stone-500 mt-1">Manage active jobs and client sites.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-stone-900 bg-amber-600 hover:bg-stone-800 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95"
                >
                    <Plus size={18} /> New Project
                </button>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-stone-500 animate-pulse">Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-stone-900/50 rounded-2xl border border-dashed border-stone-800">
                    <Briefcase className="mx-auto text-stone-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-stone-300">No Projects Found</h3>
                    <p className="text-stone-400 mb-6">Link a customer to a new project to get started.</p>
                    <button onClick={() => setIsModalOpen(true)} className="text-amber-600 hover:underline font-bold">Create Project</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.internalid} className="bg-[#1c1917] border border-stone-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${project.status === 'Active' ? 'bg-green-100 text-green-700 bg-green-900/30 text-green-400' :
                                    project.status === 'Completed' ? 'bg-stone-100 text-stone-500' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {project.status}
                                </div>
                                <button onClick={() => handleDelete(project.internalid)} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>

                            <Link href={`/projects/${project.internalid}`} className="block group-hover:text-amber-600 transition-colors">
                                <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
                            </Link>

                            <div className="flex items-center gap-2 text-stone-500 text-sm mb-6">
                                <Users size={14} />
                                <span>{project.company_name || `${project.first_name} ${project.last_name}`}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm border-t border-stone-800 pt-4">
                                <div>
                                    <span className="block text-stone-400 text-xs font-bold uppercase">Budget</span>
                                    <span className="font-mono font-medium text-stone-300">${project.budget?.toLocaleString() || '0.00'}</span>
                                </div>
                                <div>
                                    <span className="block text-stone-400 text-xs font-bold uppercase">Estimates</span>
                                    <span className="font-mono font-medium text-stone-300">{project.estimate_count} linked</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1c1917] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-stone-800">
                        <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
                            <h3 className="text-lg font-bold text-white">Create New Project</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-stone-400 hover:text-stone-600" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Project Name</label>
                                <input name="name" required className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none focus:border-amber-500 text-white" placeholder="e.g. Smith Kitchen Reno" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Customer</label>
                                <select name="customer_id" required className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none focus:border-amber-500 text-white appearance-none">
                                    <option value="">-- Select Customer --</option>
                                    {customers.map(c => (
                                        <option key={c.internalid} value={c.internalid}>
                                            {c.company_name ? c.company_name : `${c.first_name} ${c.last_name}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Budget ($)</label>
                                    <input type="number" name="budget" className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none focus:border-amber-500 text-white" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Status</label>
                                    <select name="status" className="w-full bg-stone-900 border border-stone-200 border-stone-700 rounded-lg p-2.5 outline-none focus:border-amber-500 text-white">
                                        <option value="Active">Active</option>
                                        <option value="Planning">Planning</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <button disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl mt-4 transition-all active:scale-95">
                                {isSubmitting ? "Creating..." : "Create Project"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}