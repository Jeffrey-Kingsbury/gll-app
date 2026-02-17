"use client";

import { useState, useEffect } from "react";
import { Clock, User, CheckCircle2, Lock } from "lucide-react";
import { getTimeEntriesAction } from "@/app/(main)/time-entries/actions";

export default function ProjectTimeEntries({ projectId }) {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId]);

    async function loadData() {
        setIsLoading(true);
        const res = await getTimeEntriesAction({
            projectIdFilter: projectId,
            limit: 100 // Load more for project view
        });
        setEntries(res.data);
        setIsLoading(false);
    }

    if (isLoading) {
        return <div className="p-8 text-center text-stone-400 animate-pulse">Loading time entries...</div>;
    }

    if (entries.length === 0) {
        return <div className="p-8 text-center text-stone-400 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">No time entries found for this project.</div>;
    }

    return (
        <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-400 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Task</th>
                        <th className="px-6 py-4 text-center">Hours</th>
                        <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    {entries.map(entry => (
                        <tr key={entry.internalid} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                            <td className="px-6 py-4 text-stone-500 font-mono">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center overflow-hidden">
                                        {entry.avatar_url ? (
                                            <img src={entry.avatar_url} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-stone-400" />
                                        )}
                                    </div>
                                    <span className="font-bold text-stone-700 dark:text-stone-300">{entry.employee_name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-stone-800 dark:text-white font-medium">{entry.task_name}</div>
                                <div className="text-stone-500 text-xs truncate max-w-[200px]">{entry.memo}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-stone-600 dark:text-stone-300">{entry.hours}</td>
                            <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${entry.status === 'Approved' ? 'text-green-600 bg-green-50' : 'text-stone-400 bg-stone-100'
                                    }`}>
                                    {entry.status === 'Approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {entry.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
