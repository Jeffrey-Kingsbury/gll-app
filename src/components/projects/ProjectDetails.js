"use client";

import { Calendar, CheckCircle2, DollarSign, User } from "lucide-react";

export default function ProjectDetails({ project }) {
    if (!project) return <div className="p-4 text-stone-500">Project not found.</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Info Card */}
                <div className="bg-white dark:bg-[#1c1917] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="text-amber-600" size={20} />
                        Client Information
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase block">Customer</label>
                            <div className="text-stone-900 dark:text-stone-200 font-medium">{project.company_name}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase block">Project Status</label>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${project.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                                }`}>
                                <CheckCircle2 size={12} />
                                {project.status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financials Card */}
                <div className="bg-white dark:bg-[#1c1917] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign className="text-emerald-600" size={20} />
                        Financials
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase block">Budget</label>
                            <div className="text-2xl font-bold text-stone-900 dark:text-white font-mono">
                                ${new Intl.NumberFormat('en-US').format(project.budget || 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-white dark:bg-[#1c1917] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm md:col-span-2">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase block">Start Date</label>
                            <div className="text-stone-900 dark:text-stone-200 font-medium">
                                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-400 uppercase block">Deadline</label>
                            <div className="text-stone-900 dark:text-stone-200 font-medium">
                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
