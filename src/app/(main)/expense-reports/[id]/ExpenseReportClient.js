"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, FileText, FilePlus, X } from "lucide-react";
import { assignTimeEntryAction, generateInvoiceAction } from "../actions";

export default function ExpenseReportClient({ report, lines, pendingEntries }) {
    const router = useRouter();
    const [selectedTimeEntry, setSelectedTimeEntry] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);

    // Invoice Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [invoiceData, setInvoiceData] = useState({});

    // --- CALCULATIONS ---
    const totalEstLabor = lines.reduce((sum, l) => sum + parseFloat(l.estimated_labor_cost || 0), 0);
    const totalActualHours = lines.reduce((sum, l) => sum + parseFloat(l.actual_hours || 0), 0);
    const totalBilledHours = lines.reduce((sum, l) => sum + parseFloat(l.billed_hours || 0), 0);
    const totalBilledAmount = lines.reduce((sum, l) => sum + parseFloat(l.billed_labor || 0), 0);

    // --- HANDLERS ---
    async function handleAssignToLine(lineId) {
        if (!selectedTimeEntry) return alert("Select a time entry from the right side first.");

        setIsAssigning(true);
        const res = await assignTimeEntryAction(selectedTimeEntry.internalid, lineId);
        if (res.success) {
            setSelectedTimeEntry(null);
            router.refresh();
        } else {
            alert(res.error);
        }
        setIsAssigning(false);
    }

    // Open Modal and prepopulate unbilled hours
    function handleOpenInvoiceModal() {
        const initialData = {};
        lines.forEach(line => {
            const unbilledHours = Math.max(0, parseFloat(line.actual_hours) - parseFloat(line.billed_hours));
            initialData[line.internalid] = {
                hoursToBill: unbilledHours,
                amountToBill: unbilledHours * 65 // Default $65/hr
            };
        });
        setInvoiceData(initialData);
        setIsInvoiceModalOpen(true);
    }

    function handleInvoiceInput(lineId, field, value) {
        const numVal = parseFloat(value) || 0;
        setInvoiceData(prev => {
            const updated = { ...prev[lineId], [field]: numVal };
            // Auto-calculate amount if hours change
            if (field === 'hoursToBill') updated.amountToBill = numVal * 65;
            return { ...prev, [lineId]: updated };
        });
    }

    async function handleGenerateInvoice() {
        if (!confirm("Generate draft invoice for these amounts?")) return;
        setIsGenerating(true);

        const itemsToBill = lines
            .filter(line => invoiceData[line.internalid]?.amountToBill > 0)
            .map(line => ({
                expense_report_line_id: line.internalid,
                description: line.task_name,
                billed_hours: invoiceData[line.internalid].hoursToBill,
                billed_labor_amount: invoiceData[line.internalid].amountToBill
            }));

        if (itemsToBill.length === 0) {
            alert("Please enter billable amounts for at least one line.");
            setIsGenerating(false);
            return;
        }

        const subtotal = itemsToBill.reduce((sum, item) => sum + item.billed_labor_amount, 0);

        const payload = {
            projectId: report.project_id,
            expenseReportId: report.internalid,
            customerId: report.customer_id, // Ensure getExpenseReportAction returns this!
            items: itemsToBill,
            subtotal
        };

        const res = await generateInvoiceAction(payload);
        if (res.success) {
            alert("Invoice Generated!");
            setIsInvoiceModalOpen(false);
            router.refresh();
        } else {
            alert("Error generating invoice: " + res.error);
        }
        setIsGenerating(false);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* --- INVOICE MODAL --- */}
            {isInvoiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1c1917] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col border border-stone-800">
                        <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FilePlus className="text-amber-600" /> Generate Progress Invoice
                            </h3>
                            <button onClick={() => setIsInvoiceModalOpen(false)}><X className="text-stone-400 hover:text-stone-600" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-900/50 text-xs text-stone-500 uppercase">
                                    <tr>
                                        <th className="p-3">Task</th>
                                        <th className="p-3 text-center">Actuals</th>
                                        <th className="p-3 text-center">Billed</th>
                                        <th className="p-3 text-center">Unbilled</th>
                                        <th className="p-3 text-right">Bill Now (Hrs)</th>
                                        <th className="p-3 text-right">Bill Now ($)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 divide-stone-800">
                                    {lines.map(line => {
                                        const unbilled = Math.max(0, parseFloat(line.actual_hours) - parseFloat(line.billed_hours));
                                        return (
                                            <tr key={line.internalid} className="hover:bg-stone-900/30">
                                                <td className="p-3 font-bold text-white">{line.task_name}</td>
                                                <td className="p-3 text-center font-mono">{line.actual_hours}h</td>
                                                <td className="p-3 text-center font-mono text-green-600">{line.billed_hours}h</td>
                                                <td className="p-3 text-center font-mono text-amber-600 font-bold">{unbilled}h</td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" step="0.25"
                                                        className="w-20 ml-auto block bg-white bg-stone-900 border border-stone-700 rounded p-1 text-right font-mono"
                                                        value={invoiceData[line.internalid]?.hoursToBill || ''}
                                                        onChange={e => handleInvoiceInput(line.internalid, 'hoursToBill', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" step="0.01"
                                                        className="w-24 ml-auto block bg-white bg-stone-900 border border-stone-700 rounded p-1 text-right font-mono text-amber-600 font-bold"
                                                        value={invoiceData[line.internalid]?.amountToBill || ''}
                                                        onChange={e => handleInvoiceInput(line.internalid, 'amountToBill', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-stone-800 bg-stone-900/50 flex justify-between items-center">
                            <div className="text-stone-500 text-sm">
                                Subtotal to bill: <span className="font-bold text-lg text-white font-mono">
                                    ${Object.values(invoiceData).reduce((s, d) => s + (d.amountToBill || 0), 0).toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={handleGenerateInvoice} disabled={isGenerating}
                                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95"
                            >
                                {isGenerating ? "Processing..." : "Create Draft Invoice"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div>
                <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-500 hover:text-amber-600 text-sm font-bold mb-4">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-800 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded uppercase">{report.status}</span>
                            <span className="text-stone-400 font-mono text-sm">Report #{report.internalid}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white font-serif">{report.name}</h1>
                        <p className="text-stone-500 mt-1">Project: {report.project_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-right">
                        <div>
                            <span className="block text-xs font-bold text-stone-400 uppercase">Est. Labor Budget</span>
                            <span className="text-xl font-mono font-bold text-white">${totalEstLabor.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-stone-400 uppercase">Total Billed</span>
                            <span className="text-xl font-mono font-bold text-green-600">${totalBilledAmount.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleOpenInvoiceModal}
                            className="bg-stone-900 bg-white text-white text-stone-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-800 hover:bg-stone-100 transition-colors shadow-lg"
                        >
                            <FilePlus size={18} /> Generate Invoice
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SPLIT SCREEN LAYOUT --- */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* LEFT: Budget Lines (Expense Report) */}
                <div className="flex-1 bg-[#1c1917] rounded-2xl border border-stone-800 shadow-sm overflow-hidden">
                    <div className="p-4 bg-stone-900/50 border-b border-stone-800">
                        <h3 className="font-bold flex items-center gap-2 text-stone-200">
                            <FileText size={18} className="text-amber-600" /> Budget Lines & Actuals
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs font-bold text-stone-400 uppercase border-b border-stone-800 bg-stone-50 bg-[#141210]">
                                <tr>
                                    <th className="px-6 py-4">Task</th>
                                    <th className="px-4 py-4 text-center">Budget ($)</th>
                                    <th className="px-4 py-4 text-center">Actual (Hrs)</th>
                                    <th className="px-4 py-4 text-center">Billed (Hrs)</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 divide-stone-800">
                                {lines.map(line => (
                                    <tr key={line.internalid} className={`transition-colors ${selectedTimeEntry ? 'bg-amber-50/50 bg-amber-900/10 hover:bg-amber-100 hover:bg-amber-900/30' : 'hover:bg-stone-900/30'}`}>
                                        <td className="px-6 py-4 font-bold text-white">{line.task_name}</td>
                                        <td className="px-4 py-4 text-center font-mono text-stone-500">${parseFloat(line.estimated_labor_cost).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center font-mono font-bold text-amber-600">{line.actual_hours}h</td>
                                        <td className="px-4 py-4 text-center font-mono font-bold text-green-600">{line.billed_hours}h</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                disabled={!selectedTimeEntry || isAssigning}
                                                onClick={() => handleAssignToLine(line.internalid)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedTimeEntry
                                                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 animate-pulse'
                                                    : 'bg-stone-100 bg-stone-800 text-stone-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isAssigning ? 'Assigning...' : 'Assign Here'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: Unallocated Time Entries */}
                <div className="w-full lg:w-96 flex flex-col gap-4">
                    <div className="bg-stone-900 text-white p-5 rounded-xl shadow-md">
                        <h3 className="font-bold flex items-center gap-2 text-lg">
                            <Clock size={20} className="text-amber-500" /> Pending Time
                        </h3>
                        <p className="text-stone-400 text-xs mt-1">Select an entry, then assign it to a budget line to log actuals.</p>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                        {pendingEntries.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-stone-800 rounded-xl text-stone-500 bg-[#1c1917]">
                                <CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} />
                                All caught up! No pending entries.
                            </div>
                        ) : pendingEntries.map(entry => (
                            <div
                                key={entry.internalid}
                                onClick={() => setSelectedTimeEntry(entry)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTimeEntry?.internalid === entry.internalid
                                    ? 'border-amber-500 bg-amber-50 bg-amber-900/20 shadow-md transform scale-[1.02]'
                                    : 'border-stone-800 bg-[#1c1917] hover:border-amber-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-stone-200">{entry.employee_name}</span>
                                    <span className="font-mono font-bold text-amber-600 bg-amber-100 bg-amber-900/40 px-2 py-0.5 rounded text-sm">{entry.hours} hrs</span>
                                </div>
                                <div className="text-xs text-stone-500 font-mono mb-2">{new Date(entry.date).toLocaleDateString()}</div>
                                <div className="text-sm text-stone-400 italic bg-stone-900/50 p-2 rounded line-clamp-2">"{entry.memo || entry.task_name || 'No description'}"</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}