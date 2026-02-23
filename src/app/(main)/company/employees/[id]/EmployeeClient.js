"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateEmployeeAction, deleteEmployeeAction } from "../actions";
import {
    ArrowLeft, Edit2, Save, X, User, Briefcase,
    Mail, Phone, Calendar, Shield, DollarSign, FileText, Trash2
} from "lucide-react";

export default function EmployeeClient({ employee, accessLevelOptions }) {
    const accessLevels = accessLevelOptions || [];
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isEditing) router.replace(`/company/employees/${employee.internalid}`, { scroll: false });
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.target);
        const result = await updateEmployeeAction(formData);
        if (result.success) {
            setIsEditing(false);
            router.refresh();
        } else {
            alert("Error saving employee data");
        }
        setIsLoading(false);
    }

    const handleDelete = async () => {
        const confirmDelete = confirm(
            `Are you sure you want to delete ${employee.first_name} ${employee.last_name}? This action is permanent.`
        );

        if (!confirmDelete) return;

        setIsLoading(true);
        const result = await deleteEmployeeAction(employee.internalid);

        if (result.success) {
            window.location.href = "/company/employees";
        } else {
            alert(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <button onClick={() => router.push("/company/employees")} className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-amber-600 transition-colors">
                    <ArrowLeft size={16} /> Back to Employees
                </button>
                <div className="flex gap-3">
                    {isEditing ? (
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-stone-500 bg-stone-200 rounded-lg transition-all"><X size={16} /></button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-stone-800 border border-stone-700 text-stone-300 hover:border-amber-500 rounded-lg transition-all"><Edit2 size={16} /> Edit Profile</button>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className={`bg-stone-900 rounded-2xl border transition-all ${isEditing ? 'border-amber-500/50 ring-4 ring-amber-500/5' : 'border-stone-800'}`}>
                <div className="px-8 py-8 border-b border-stone-800 bg-stone-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-amber-900/30 flex items-center justify-center border border-amber-800">
                            <User size={40} className="text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {employee.first_name} {employee.last_name}
                            </h1>
                            <p className="text-sm text-stone-500 font-mono">Employee ID: #{employee.internalid}</p>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Trash2 size={18} />
                                <span className="hidden sm:inline">Delete Record</span>
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95"
                            >
                                {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <input type="hidden" name="internalid" value={employee.internalid} />

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={16} /> Professional</h3>
                        <Field label="First Name" name="first_name" defaultValue={employee.first_name} isEditing={isEditing} />
                        <Field label="Last Name" name="last_name" defaultValue={employee.last_name} isEditing={isEditing} />
                        <Field label="Job Title" name="job_title" defaultValue={employee.job_title} isEditing={isEditing} />
                        <Field label="Department" name="department" defaultValue={employee.department} isEditing={isEditing} />
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2"><Shield size={16} /> Access & Status</h3>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-400">Access Level</label>
                            {isEditing ? (
                                <select name="level_access" defaultValue={employee.level_access} className="w-full p-2.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200">
                                    {accessLevels.map(level => (
                                        <option key={level.internalid} value={level.internalid}>{level.access_level_name}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="py-1 font-medium text-stone-300">
                                    {accessLevels.find(l => l.internalid == employee.level_access)?.access_level_name || "Unknown Role"}
                                </div>
                            )}
                        </div>
                        <Field label="Email" name="email" defaultValue={employee.email} isEditing={isEditing} />
                        <Field label="Hire Date" name="hire_date" defaultValue={employee.hire_date?.toISOString().split('T')[0]} isEditing={isEditing} type="date" />
                    </section>
                </div>
            </form>
        </div>
    );
}

function Field({ label, name, defaultValue, isEditing, type = "text" }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400">{label}</label>
            {isEditing ? (
                <input type={type} name={name} defaultValue={defaultValue} className="w-full p-2.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50" />
            ) : (
                <div className="py-1 font-medium text-stone-300 border-b border-transparent">
                    {defaultValue || "Not set"}
                </div>
            )}
        </div>
    );
}