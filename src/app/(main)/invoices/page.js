"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, Plus, FileCheck2 } from "lucide-react";
import { getInvoicesAction } from "./actions";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const res = await getInvoicesAction();
            setInvoices(res.data || []);
            setIsLoading(false);
        }
        loadData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-stone-100 text-stone-600 border-stone-200'; // Draft
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white font-serif flex items-center gap-3">
                        <FileCheck2 className="text-stone-400" size={32} />
                        Invoices
                    </h1>
                    <p className="text-stone-500 mt-1">Manage progress billing and payments.</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1c1917] border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-900/50 text-stone-400 font-bold uppercase text-xs border-b border-stone-800">
                        <tr>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Client / Project</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 divide-stone-800/50">
                        {isLoading ? (
                            <tr><td colSpan="6" className="text-center py-10 text-stone-400 animate-pulse">Loading invoices...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-stone-400">No invoices generated yet. Create one from an Expense Report.</td></tr>
                        ) : invoices.map(invoice => (
                            <tr key={invoice.internalid} className="hover:bg-stone-900/30 transition-colors group">
                                <td className="px-6 py-4 font-bold text-white">{invoice.invoice_number}</td>
                                <td className="px-6 py-4 text-stone-500 font-mono">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white">{invoice.company_name}</div>
                                    <div className="text-stone-500 text-xs">{invoice.project_name}</div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-stone-200">
                                    ${parseFloat(invoice.total_amount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getStatusStyle(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/invoices/${invoice.internalid}`} className="text-amber-600 hover:underline font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}