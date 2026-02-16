"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Pencil, Printer, Save, Trash2, X,
    Briefcase, LayoutTemplate, User, DollarSign,
    Calculator, Plus, ChevronDown, Check
} from "lucide-react";
import { updateEstimateAction } from "../actions";

export default function EstimateDetailClient({ estimate, projects, templates, initialIsEditing }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [isSaving, setIsSaving] = useState(false);

    // --- FORM STATE (Initialized with DB Data) ---
    const [lineItems, setLineItems] = useState(estimate.items || []);
    const [meta, setMeta] = useState({
        projectName: estimate.project_name,
        selectedProjectId: estimate.project_id || "",
        adminFee: Number(estimate.admin_fee_percent) || 0,
        clientName: estimate.client_name,
        status: estimate.status
    });
    const [projectMode, setProjectMode] = useState(estimate.project_id ? 'existing' : 'new');

    // --- CALCULATOR STATE ---
    const [calcModal, setCalcModal] = useState({ isOpen: false, targetIndex: null });
    const [calcValues, setCalcValues] = useState({ count: 1, hours: 1, rate: 65 });

    // --- CALCULATIONS ---
    const totals = useMemo(() => {
        const laborTotal = lineItems.reduce((sum, i) => sum + Number(i.labor_cost || i.labor || 0), 0);
        const materialTotal = lineItems.reduce((sum, i) => sum + Number(i.material_cost || i.material || 0), 0);
        const subtotal = laborTotal + materialTotal;
        const adminAmt = subtotal * (meta.adminFee / 100);
        return { laborTotal, materialTotal, subtotal, adminAmt, grandTotal: subtotal + adminAmt };
    }, [lineItems, meta.adminFee]);

    const groupedItems = useMemo(() => {
        return lineItems.reduce((groups, item, index) => {
            const category = item.category || "Uncategorized";
            if (!groups[category]) groups[category] = [];
            groups[category].push({ ...item, originalIndex: index });
            return groups;
        }, {});
    }, [lineItems]);

    // --- HANDLERS (Editor Logic) ---
    const handleUpdateItem = (index, field, value) => {
        const newItems = [...lineItems];
        // Normalize field names (DB uses _cost, UI uses simple names. Let's stick to UI names for state)
        // If we receive data from DB, we map it to state. 
        // Ideally, we should normalize the initial state to use 'labor' and 'material' keys everywhere.
        newItems[index][field] = value;
        setLineItems(newItems);
    };

    const handleSave = async () => {
        setIsSaving(true);

        // Normalize items for API
        const apiItems = lineItems.map(i => ({
            ...i,
            labor: Number(i.labor_cost || i.labor || 0),
            material: Number(i.material_cost || i.material || 0)
        }));

        const payload = {
            ...meta,
            projectMode,
            items: apiItems,
            totals
        };

        const result = await updateEstimateAction(estimate.internalid, payload);

        if (result.success) {
            setIsEditing(false);
            router.refresh();
            setIsSaving(false);
        } else {
            alert("Save failed: " + result.error);
            setIsSaving(false);
        }
    };

    const handleApplyCalculator = () => {
        if (calcModal.targetIndex === null) return;
        const total = (parseFloat(calcValues.count) || 0) * (parseFloat(calcValues.hours) || 0) * (parseFloat(calcValues.rate) || 0);

        const newItems = [...lineItems];
        // Support both key styles just in case
        newItems[calcModal.targetIndex].labor = total;
        newItems[calcModal.targetIndex].labor_cost = total;
        setLineItems(newItems);

        setCalcModal({ isOpen: false, targetIndex: null });
    };

    // --- VIEW MODE RENDERER ---
    if (!isEditing) {
        return (
            <div className="max-w-5xl mx-auto pb-20 space-y-8">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-500 hover:text-stone-300">
                        <ArrowLeft size={18} /> Back to Estimates
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium transition-colors">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all">
                            <Pencil size={18} /> Edit Estimate
                        </button>
                    </div>
                </div>

                {/* Paper Document View */}
                <div className="bg-white text-stone-900 p-8 md:p-12 rounded-xl shadow-xl min-h-[800px]">
                    {/* Doc Header */}
                    <div className="flex justify-between border-b-2 border-stone-100 pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Estimate</h1>
                            <p className="text-stone-500">#{estimate.internalid}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-stone-800">{meta.projectName}</h2>
                            <p className="text-stone-500">{meta.clientName}</p>
                            <p className="text-stone-400 text-sm mt-1">{new Date(estimate.date).toLocaleDateString()}</p>
                            <div className={`mt-2 inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${meta.status === 'Sent' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    meta.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                        'bg-stone-100 text-stone-500 border-stone-200'
                                }`}>
                                {meta.status}
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="space-y-8">
                        {Object.keys(groupedItems).map(category => (
                            <div key={category}>
                                <h3 className="text-lg font-bold text-stone-800 border-b border-stone-200 pb-2 mb-4 uppercase tracking-wider text-xs">{category}</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-stone-400 text-xs uppercase text-left">
                                            <th className="pb-2 w-20">Code</th>
                                            <th className="pb-2">Description</th>
                                            <th className="pb-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {groupedItems[category].map((item, idx) => {
                                            const l = Number(item.labor_cost || item.labor || 0);
                                            const m = Number(item.material_cost || item.material || 0);
                                            return (
                                                <tr key={idx}>
                                                    <td className="py-3 font-mono text-stone-400 text-xs">{item.code}</td>
                                                    <td className="py-3">
                                                        <div className="font-bold text-stone-800">{item.subcategory}</div>
                                                        <div className="text-stone-500 text-xs">{item.details}</div>
                                                    </td>
                                                    <td className="py-3 text-right font-mono font-medium text-stone-900">
                                                        ${(l + m).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Totals Footer */}
                    <div className="mt-12 pt-8 border-t-2 border-stone-100 flex justify-end">
                        <div className="w-64 space-y-2 text-sm">
                            <div className="flex justify-between text-stone-500">
                                <span>Labor</span>
                                <span className="font-mono">${totals.laborTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-500">
                                <span>Material</span>
                                <span className="font-mono">${totals.materialTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-800 font-bold pt-2 border-t border-stone-100">
                                <span>Subtotal</span>
                                <span className="font-mono">${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-500">
                                <span>Overhead ({meta.adminFee}%)</span>
                                <span className="font-mono">${totals.adminAmt.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold text-stone-900 pt-4 border-t-2 border-stone-900 mt-4">
                                <span>Total</span>
                                <span className="font-serif">${totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- EDIT MODE RENDERER (Reusing logic from New Page) ---
    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-40">

            {/* CALCULATOR MODAL */}
            {calcModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1c1917] border border-stone-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-5">
                        <h3 className="text-white font-bold flex items-center gap-2"><Calculator className="text-amber-500" /> Labor Calculator</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" className="bg-stone-900 border border-stone-700 rounded-lg p-3 text-white" value={calcValues.count} onChange={e => setCalcValues({ ...calcValues, count: e.target.value })} placeholder="Count" />
                            <input type="number" className="bg-stone-900 border border-stone-700 rounded-lg p-3 text-white" value={calcValues.hours} onChange={e => setCalcValues({ ...calcValues, hours: e.target.value })} placeholder="Hours" />
                        </div>
                        <input type="number" className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white" value={calcValues.rate} onChange={e => setCalcValues({ ...calcValues, rate: e.target.value })} placeholder="Rate" />
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setCalcModal({ isOpen: false, targetIndex: null })} className="flex-1 py-3 rounded-xl text-stone-400 bg-stone-800">Cancel</button>
                            <button onClick={handleApplyCalculator} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold">Apply</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex justify-between items-center border-b border-stone-800 pb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Pencil className="text-amber-500" /> Edit Estimate</h1>
                <div className="flex gap-3">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-stone-500 hover:text-white">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-bold">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Meta Fields */}
            <div className="bg-[#1c1917] p-6 rounded-2xl border border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-stone-500 uppercase">Project Name</label>
                    <input
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white mt-2"
                        value={meta.projectName}
                        onChange={e => setMeta({ ...meta, projectName: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase">Status</label>
                        <select
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white mt-2"
                            value={meta.status}
                            onChange={e => setMeta({ ...meta, status: e.target.value })}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase">Admin Fee %</label>
                        <input
                            type="number"
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white mt-2"
                            value={meta.adminFee}
                            onChange={e => setMeta({ ...meta, adminFee: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Editor Tables (Simplified for brevity, assumes reused components or inline mapping) */}
            <div className="space-y-6">
                {Object.keys(groupedItems).map(category => (
                    <div key={category} className="bg-white dark:bg-[#1c1917] border border-stone-800 rounded-xl overflow-hidden">
                        <div className="p-4 bg-stone-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-stone-200">{category}</h3>
                            <button onClick={() => {
                                // Add item logic
                                setLineItems([...lineItems, { category, code: '000', subcategory: 'New Item', labor: 0, material: 0 }])
                            }} className="text-xs bg-stone-800 px-3 py-1 rounded-full text-stone-400 hover:text-white">+ Add Item</button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-stone-800">
                                {groupedItems[category].map((item) => (
                                    <tr key={item.originalIndex} className="hover:bg-stone-900/30">
                                        <td className="p-4 w-20">
                                            <input className="w-full bg-transparent text-stone-500 font-mono text-xs outline-none" value={item.code} onChange={e => handleUpdateItem(item.originalIndex, 'code', e.target.value)} />
                                        </td>
                                        <td className="p-4">
                                            <input className="w-full bg-transparent text-white font-bold mb-1 outline-none" value={item.subcategory} onChange={e => handleUpdateItem(item.originalIndex, 'subcategory', e.target.value)} />
                                            <input className="w-full bg-transparent text-stone-500 text-xs outline-none" value={item.details} onChange={e => handleUpdateItem(item.originalIndex, 'details', e.target.value)} />
                                        </td>
                                        <td className="p-4 w-32">
                                            <div className="flex items-center gap-2">
                                                <input type="number" className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-white text-right" value={item.labor_cost || item.labor || 0} onChange={e => handleUpdateItem(item.originalIndex, 'labor', Number(e.target.value))} />
                                                <button onClick={() => setCalcModal({ isOpen: true, targetIndex: item.originalIndex })} className="text-stone-500 hover:text-amber-500"><Calculator size={14} /></button>
                                            </div>
                                        </td>
                                        <td className="p-4 w-32">
                                            <input type="number" className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-white text-right" value={item.material_cost || item.material || 0} onChange={e => handleUpdateItem(item.originalIndex, 'material', Number(e.target.value))} />
                                        </td>
                                        <td className="p-4 w-10 text-center">
                                            <button onClick={() => {
                                                const newItems = lineItems.filter((_, i) => i !== item.originalIndex);
                                                setLineItems(newItems);
                                            }} className="text-stone-600 hover:text-red-500"><X size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}