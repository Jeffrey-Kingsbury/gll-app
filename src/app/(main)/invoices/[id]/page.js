"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, CheckCircle, Send, FileText } from "lucide-react";
import { getInvoiceByIdAction, updateInvoiceStatusAction } from "../actions";
import { use } from "react"; // For unwraping params

export default function InvoiceDetailClient({ params }) {
    // React 19 / Next.js 15 requires unwrapping params
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const router = useRouter();
    const [data, setData] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        async function loadInvoice() {
            const result = await getInvoiceByIdAction(id);
            if (result) setData(result);
        }
        loadInvoice();
    }, [id]);

    if (!data) return <div className="p-20 text-center animate-pulse">Loading Invoice...</div>;

    const { invoice, lines } = data;

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true);
        const res = await updateInvoiceStatusAction(invoice.internalid, newStatus);
        if (res.success) {
            setData(prev => ({ ...prev, invoice: { ...prev.invoice, status: newStatus } }));
        } else {
            alert("Error updating status");
        }
        setIsUpdating(false);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in">
            {/* Toolbar - Hidden when printing */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-500 hover:text-stone-300">
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium transition-colors">
                        <Printer size={18} /> Print
                    </button>

                    {invoice.status === 'Draft' && (
                        <button onClick={() => handleStatusChange('Sent')} disabled={isUpdating} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all">
                            <Send size={18} /> Mark as Sent
                        </button>
                    )}
                    {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
                        <button onClick={() => handleStatusChange('Paid')} disabled={isUpdating} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-all">
                            <CheckCircle size={18} /> Mark as Paid
                        </button>
                    )}
                </div>
            </div>

            {/* Paper Document View */}
            <div className="bg-white text-stone-900 p-12 rounded-xl shadow-xl min-h-[800px] border border-stone-200 print:shadow-none print:border-0 print:p-0">
                {/* Header */}
                <div className="flex justify-between border-b-2 border-stone-100 pb-8 mb-8">
                    <div>
                        <h1 className="text-5xl font-serif font-bold text-stone-900 mb-2">INVOICE</h1>
                        <p className="text-stone-500 font-mono tracking-wider">{invoice.invoice_number}</p>

                        <div className="mt-8">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Bill To:</p>
                            <h3 className="text-lg font-bold text-stone-800">{invoice.company_name}</h3>
                            <p className="text-sm text-stone-500">{invoice.client_email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-stone-800">Wyatt Construction</h2>
                        <p className="text-sm text-stone-500 mb-6">Vaudreuil-Dorion, QC</p>

                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-8"><span className="text-stone-500">Issue Date:</span> <span className="font-mono">{new Date(invoice.issue_date).toLocaleDateString()}</span></div>
                            <div className="flex justify-between gap-8"><span className="text-stone-500">Due Date:</span> <span className="font-mono">{new Date(invoice.due_date).toLocaleDateString()}</span></div>
                            <div className="flex justify-between gap-8 font-bold"><span className="text-stone-500">Project:</span> <span>{invoice.project_name}</span></div>
                        </div>

                        {/* Status Badge - Hidden on print if Paid/Draft so it looks clean */}
                        <div className={`mt-4 inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border print:hidden ${invoice.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' :
                            invoice.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-stone-100 text-stone-500 border-stone-200'
                            }`}>
                            {invoice.status}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <table className="w-full text-sm mb-12">
                    <thead>
                        <tr className="text-stone-400 text-xs uppercase border-b-2 border-stone-100">
                            <th className="pb-3 text-left">Description</th>
                            <th className="pb-3 text-center">Hours Billed</th>
                            <th className="pb-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {lines.map(line => (
                            <tr key={line.internalid}>
                                <td className="py-4 font-bold text-stone-800">{line.description}</td>
                                <td className="py-4 text-center text-stone-500 font-mono">{line.billed_hours}</td>
                                <td className="py-4 text-right font-mono text-stone-900">${parseFloat(line.billed_labor_amount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-3 text-sm border-t-2 border-stone-100 pt-6">
                        <div className="flex justify-between text-stone-600">
                            <span>Subtotal</span>
                            <span className="font-mono">${parseFloat(invoice.subtotal).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                            <span>Tax (14.975%)</span>
                            <span className="font-mono">${parseFloat(invoice.tax_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-stone-900 pt-4 border-t-2 border-stone-900 mt-2">
                            <span>Total Due</span>
                            <span className="font-serif">${parseFloat(invoice.total_amount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}