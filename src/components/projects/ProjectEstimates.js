"use client";

import { useState, useEffect } from "react";
import { FileText, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { getEstimatesAction } from "@/app/(main)/estimates/actions";

export default function ProjectEstimates({ projectId }) {
    const [estimates, setEstimates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId]);

    async function loadData() {
        setIsLoading(true);
        const res = await getEstimatesAction({
            projectId: projectId,
            limit: 50
        });
        setEstimates(res.data);
        setIsLoading(false);
    }

    if (isLoading) {
        return <div className="p-8 text-center text-stone-400 animate-pulse">Loading estimates...</div>;
    }

    if (estimates.length === 0) {
        return <div className="p-8 text-center text-stone-400 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">No estimates found for this project.</div>;
    }

    return (
        <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-400 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Estimate ID</th>
                        <th className="px-6 py-4">Date Created</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-right">Status</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    {estimates.map(est => (
                        <tr key={est.internalid} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group">
                            <td className="px-6 py-4 font-mono text-stone-500">#{est.internalid}</td>
                            <td className="px-6 py-4 text-stone-500">
                                {new Date(est.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-stone-800 dark:text-white">
                                ${new Intl.NumberFormat('en-US').format(est.grand_total || 0)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${est.status === 'Won' ? 'bg-green-100 text-green-700' :
                                        est.status === 'Lost' ? 'bg-red-100 text-red-700' :
                                            'bg-stone-100 text-stone-600'
                                    }`}>
                                    {est.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-stone-400 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100">
                                    <ArrowRight size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
