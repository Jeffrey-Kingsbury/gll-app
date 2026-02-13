"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployeeAction } from "../actions";
import { ArrowLeft, Save, UserPlus, Briefcase, Shield } from "lucide-react";

export default function NewEmployeePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.target);
        const result = await createEmployeeAction(formData);

        if (result.success) {
            router.push(`/company/employees/${result.newId}`);
        } else {
            alert("Error creating employee: " + result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-20">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-amber-600 transition-colors">
                <ArrowLeft size={16} /> Back
            </button>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-stone-900 dark:text-white">New Employee</h1>
                            <p className="text-sm text-stone-500">Create a new staff record in Wyatt</p>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70">
                        {isLoading ? 'Creating...' : 'Create Employee'}
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Personal Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="First Name" name="first_name" required />
                            <Input label="Last Name" name="last_name" required />
                        </div>
                        <Input label="Email Address" name="email" type="email" required />
                        <Input label="Phone Number" name="phone" />
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Employment</h3>
                        <Input label="Job Title" name="job_title" placeholder="e.g. Project Manager" />
                        <div className="grid grid-cols-2 gap-4">
                             <Input label="Hire Date" name="hire_date" type="date" />
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-400">Access Level</label>
                                <select name="level_access" className="w-full p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 outline-none">
                                    <option value="1">Standard</option>
                                    <option value="2">Manager</option>
                                    <option value="3">Admin</option>
                                </select>
                             </div>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400">{label}</label>
            <input {...props} className="w-full p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" />
        </div>
    );
}