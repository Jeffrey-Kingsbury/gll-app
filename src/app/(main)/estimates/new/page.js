"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    ChevronDown,
    Plus,
    Briefcase,
    LayoutTemplate,
    DollarSign,
    User,
    X,
    Pencil,
    Check,
    Trash2,
    History,
    CheckCircle2,
    Calculator
} from "lucide-react";
import {
    getProjectsAction,
    getTemplatesAction,
    getTemplateItemsAction,
    saveEstimateAction
} from "../actions";

const LOCAL_STORAGE_KEY = 'wyatt-estimate-draft';

export default function NewEstimatePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Data States
    const [availableProjects, setAvailableProjects] = useState([]);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [draftFound, setDraftFound] = useState(null);

    // Calculator State
    const [calcModal, setCalcModal] = useState({ isOpen: false, targetIndex: null });
    const [calcValues, setCalcValues] = useState({ count: 1, hours: 1, rate: 65 });

    // Form States
    const [projectMode, setProjectMode] = useState('new');
    const [meta, setMeta] = useState({
        projectName: "",
        selectedProjectId: "",
        adminFee: 15
    });

    const [lineItems, setLineItems] = useState([]);

    // 1. Initial Data Fetch & Draft Check
    useEffect(() => {
        async function init() {
            try {
                const [projects, templates] = await Promise.all([
                    getProjectsAction(),
                    getTemplatesAction()
                ]);

                setAvailableProjects(projects || []);
                setAvailableTemplates(templates || []);

                const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed.lineItems?.length > 0 || parsed.meta?.projectName) {
                            setDraftFound(parsed);
                        }
                    } catch (e) {
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                    }
                }
            } catch (error) {
                console.error("Failed to load estimate data", error);
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, []);

    // 2. Auto-Save
    useEffect(() => {
        if (!isLoading && !draftFound) {
            const data = { lineItems, meta, projectMode, lastSaved: new Date() };
            const timeoutId = setTimeout(() => {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [lineItems, meta, projectMode, isLoading, draftFound]);

    // 3. Handlers
    const handleRestoreDraft = () => {
        if (!draftFound) return;
        setMeta(draftFound.meta);
        setProjectMode(draftFound.projectMode || 'new');
        setLineItems(draftFound.lineItems || []);
        setDraftFound(null);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setDraftFound(null);
    };

    const handleTemplateChange = async (e) => {
        const tmplId = e.target.value;
        if (!tmplId) return;

        if (lineItems.length > 0) {
            if (!confirm("Load new template? This will replace your current line items.")) {
                e.target.value = "";
                return;
            }
        }

        setIsLoading(true);
        const newItems = await getTemplateItemsAction(tmplId);
        setLineItems(newItems);
        setIsLoading(false);
    };

    // --- ITEM & SECTION HANDLERS ---

    const handleUpdateItem = (index, field, value) => {
        const newItems = [...lineItems];
        const val = (field === 'labor' || field === 'material')
            ? (value === '' ? 0 : parseFloat(value))
            : value;

        newItems[index][field] = val;
        setLineItems(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = lineItems.filter((_, i) => i !== index);
        setLineItems(newItems);
    };

    const handleAddItem = (category) => {
        setLineItems([...lineItems, {
            code: "000",
            category: category,
            subcategory: "New Service",
            details: "Description...",
            labor: 0,
            material: 0
        }]);
    };

    const handleAddSection = () => {
        const name = prompt("Enter new section name:", "New Phase");
        if (name) {
            setLineItems([...lineItems, {
                code: "000",
                category: name,
                subcategory: "Initial Item",
                details: "Description...",
                labor: 0,
                material: 0
            }]);
        }
    };

    const handleRenameSection = (oldName, newName) => {
        if (!newName || newName === oldName) return;
        const newItems = lineItems.map(item =>
            item.category === oldName ? { ...item, category: newName } : item
        );
        setLineItems(newItems);
    };

    const handleDeleteSection = (categoryName) => {
        if (confirm(`Delete section "${categoryName}" and all its items?`)) {
            const newItems = lineItems.filter(item => item.category !== categoryName);
            setLineItems(newItems);
        }
    };

    // --- CALCULATOR HANDLERS ---
    const handleOpenCalculator = (index) => {
        // Reset to defaults or try to reverse engineer current value?
        // Let's stick to defaults for now to be safe.
        setCalcValues({ count: 1, hours: 8, rate: 65 });
        setCalcModal({ isOpen: true, targetIndex: index });
    };

    const handleApplyCalculator = () => {
        if (calcModal.targetIndex === null) return;

        const total = (parseFloat(calcValues.count) || 0) * (parseFloat(calcValues.hours) || 0) * (parseFloat(calcValues.rate) || 0);

        handleUpdateItem(calcModal.targetIndex, 'labor', total);
        setCalcModal({ isOpen: false, targetIndex: null });
    };

    const handleSave = async () => {
        if (projectMode === 'new' && !meta.projectName) return alert("Please enter a Project Name.");
        if (projectMode === 'existing' && !meta.selectedProjectId) return alert("Please select a Project.");

        setIsSaving(true);

        const payload = {
            ...meta,
            projectMode,
            items: lineItems,
            totals: totals
        };

        const result = await saveEstimateAction(payload);

        if (result.success) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            router.push("/estimates");
        } else {
            alert("Error saving: " + result.error);
            setIsSaving(false);
        }
    };

    // 4. Calculations
    const groupedItems = useMemo(() => {
        return lineItems.reduce((groups, item, index) => {
            const category = item.category || "Uncategorized";
            if (!groups[category]) groups[category] = [];
            groups[category].push({ ...item, originalIndex: index });
            return groups;
        }, {});
    }, [lineItems]);

    const totals = useMemo(() => {
        const laborTotal = lineItems.reduce((sum, i) => sum + (i.labor || 0), 0);
        const materialTotal = lineItems.reduce((sum, i) => sum + (i.material || 0), 0);
        const subtotal = laborTotal + materialTotal;
        const adminAmt = subtotal * (meta.adminFee / 100);
        return { laborTotal, materialTotal, subtotal, adminAmt, grandTotal: subtotal + adminAmt };
    }, [lineItems, meta.adminFee]);

    // Calculator Result Preview
    const calcResult = (calcValues.count * calcValues.hours * calcValues.rate).toFixed(2);

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-stone-500 animate-pulse">
            <Briefcase className="mr-2" /> Loading Estimator...
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-40 animate-in slide-in-from-bottom-4 duration-500 relative">

            {/* --- CALCULATOR MODAL --- */}
            {calcModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#1c1917] border border-stone-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-stone-800 p-4 border-b border-stone-700 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Calculator size={18} className="text-amber-500" /> Labor Calculator
                            </h3>
                            <button onClick={() => setCalcModal({ isOpen: false, targetIndex: null })} className="text-stone-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Labourers</label>
                                    <input
                                        type="number"
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                        value={calcValues.count}
                                        onChange={e => setCalcValues({ ...calcValues, count: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Hours</label>
                                    <input
                                        type="number"
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                        value={calcValues.hours}
                                        onChange={e => setCalcValues({ ...calcValues, hours: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Hourly Rate ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                                    <input
                                        type="number"
                                        className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 pl-8 text-white focus:border-amber-500 outline-none"
                                        value={calcValues.rate}
                                        onChange={e => setCalcValues({ ...calcValues, rate: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="bg-stone-900 rounded-xl p-4 border border-stone-800 flex justify-between items-center">
                                <span className="text-stone-400 font-medium">Calculated Total</span>
                                <span className="text-2xl font-bold text-amber-500 font-mono">${calcResult}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-stone-800 border-t border-stone-700 flex gap-3">
                            <button
                                onClick={() => setCalcModal({ isOpen: false, targetIndex: null })}
                                className="flex-1 py-3 rounded-xl font-bold text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApplyCalculator}
                                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95"
                            >
                                Apply Value
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DRAFT BANNER --- */}
            {draftFound && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 shadow-lg backdrop-blur-sm">
                    {/* ... (Draft banner content same as before) ... */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="text-amber-100 font-bold text-sm">Unsaved Draft Found</h3>
                            <p className="text-amber-500/80 text-xs">
                                From {new Date(draftFound.lastSaved).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={handleDiscardDraft} className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-stone-400 hover:text-stone-200 transition-colors">Discard</button>
                        <button onClick={handleRestoreDraft} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-900/20 transition-all active:scale-95">
                            <CheckCircle2 size={14} /> Restore Draft
                        </button>
                    </div>
                </div>
            )}

            {/* --- TOP BAR --- */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-white font-serif flex items-center gap-3">
                        <Briefcase className="text-stone-400" size={32} />
                        New Estimate
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-4 py-2 text-stone-500 hover:text-stone-300 transition-colors text-sm font-medium">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-black/10 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSaving ? 'Saving...' : <><Save size={18} /> Save Estimate</>}
                    </button>
                </div>
            </div>

            {/* --- CONFIGURATION CARD --- */}
            <div className="bg-white dark:bg-[#1c1917] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-8">
                {/* ... (Project & Template Inputs same as before) ... */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider">Project Information</label>
                        <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-lg">
                            <button onClick={() => setProjectMode('new')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${projectMode === 'new' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>New Project</button>
                            <button onClick={() => setProjectMode('existing')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${projectMode === 'existing' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Existing</button>
                        </div>
                    </div>
                    <div className="w-full">
                        {projectMode === 'new' ? (
                            <input className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-5 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-medium placeholder:text-stone-400 transition-all" placeholder="Enter Project Name (e.g. Smith Kitchen Renovation)" value={meta.projectName} onChange={e => setMeta({ ...meta, projectName: e.target.value })} />
                        ) : (
                            <div className="relative">
                                <select className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-5 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none" value={meta.selectedProjectId} onChange={e => setMeta({ ...meta, selectedProjectId: e.target.value })}>
                                    <option value="">-- Select Existing Project --</option>
                                    {availableProjects.map(p => (<option key={p.internalid} value={p.internalid}>{p.name} {p.client_name ? `• ${p.client_name}` : ''}</option>))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100 dark:border-stone-800">
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider mb-2"><LayoutTemplate size={14} /> Import Template</label>
                        <div className="relative">
                            <select className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none text-sm" onChange={handleTemplateChange} value="">
                                <option value="" disabled>Select a template to load items...</option>
                                {availableTemplates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={14} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Admin / Overhead Fee (%)</label>
                        <div className="relative">
                            <input type="number" className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-mono text-sm" value={meta.adminFee} onChange={e => setMeta({ ...meta, adminFee: parseFloat(e.target.value) })} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ESTIMATE TABLES --- */}
            <div className="space-y-6">
                {Object.keys(groupedItems).map((category) => (
                    <CategoryTable
                        key={category}
                        category={category}
                        items={groupedItems[category]}
                        onUpdate={handleUpdateItem}
                        onRemove={handleRemoveItem}
                        onAdd={handleAddItem}
                        onRenameSection={handleRenameSection}
                        onDeleteSection={handleDeleteSection}
                        onOpenCalculator={handleOpenCalculator}
                    />
                ))}
            </div>

            {/* --- ADD SECTION BUTTON --- */}
            <button onClick={handleAddSection} className="w-full py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-center gap-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:border-stone-400 dark:hover:border-stone-600 transition-all group">
                <Plus size={20} className="group-hover:scale-110 transition-transform" /> <span className="font-bold">Add New Section</span>
            </button>

            {/* --- STICKY FOOTER SUMMARY --- */}
            <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-right-4">
                <div className="bg-stone-900/95 dark:bg-[#0c0a09]/95 text-stone-200 p-6 rounded-2xl shadow-2xl shadow-black/50 border border-stone-700 min-w-[320px] backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-y-1 gap-x-8 text-sm mb-4">
                        <span className="text-stone-500">Labor</span><span className="font-mono text-right">${totals.laborTotal.toFixed(2)}</span>
                        <span className="text-stone-500">Material</span><span className="font-mono text-right">${totals.materialTotal.toFixed(2)}</span>
                        <span className="text-stone-300 font-bold pt-2">Subtotal</span><span className="font-mono text-right font-bold pt-2 border-t border-stone-800 mt-2">${totals.subtotal.toFixed(2)}</span>
                        <span className="text-stone-500">Admin ({meta.adminFee}%)</span><span className="font-mono text-right">${totals.adminAmt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-stone-800 pt-4">
                        <span className="font-bold text-lg text-white">Total</span><span className="font-bold text-3xl text-amber-500 font-serif">${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: CATEGORY TABLE ---
function CategoryTable({ category, items, onUpdate, onRemove, onAdd, onRenameSection, onDeleteSection, onOpenCalculator }) {
    const [isOpen, setIsOpen] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(category);

    const catTotal = items.reduce((sum, item) => sum + (item.labor || 0) + (item.material || 0), 0);

    const saveName = (e) => {
        e.stopPropagation();
        if (tempName.trim()) {
            onRenameSection(category, tempName);
            setIsEditingName(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            {/* Category Header (Unchanged logic, just ensure Pencil/Trash icons are present as in previous step) */}
            <div onClick={() => !isEditingName && setIsOpen(!isOpen)} className={`flex justify-between items-center p-5 cursor-pointer transition-colors ${isOpen ? 'bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800' : 'bg-white dark:bg-[#1c1917] hover:bg-stone-50 dark:hover:bg-stone-900/30'}`}>
                <div className="flex items-center gap-3 flex-1">
                    <div className={`p-1 rounded-md transition-transform duration-200 ${isOpen ? 'rotate-0 text-amber-600' : '-rotate-90 text-stone-400'}`}>
                        <ChevronDown size={20} />
                    </div>
                    {isEditingName ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <input autoFocus className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded px-2 py-1 text-lg font-bold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50" value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveName(e); if (e.key === 'Escape') setIsEditingName(false); }} />
                            <button onClick={saveName} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={18} /></button>
                            <button onClick={() => setIsEditingName(false)} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 group/header">
                            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">{category}</h3>
                            <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }} className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors" title="Rename Section"><Pencil size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSection(category); }} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete Section"><Trash2 size={14} /></button>
                            </div>
                            <span className="bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">{items.length}</span>
                        </div>
                    )}
                </div>
                <div className="text-right"><span className="font-mono font-bold text-stone-900 dark:text-white text-lg">${catTotal.toFixed(2)}</span></div>
            </div>

            {/* Table Rows */}
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-[#1c1917] text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                            <tr>
                                <th className="px-6 py-4 w-24">Code</th>
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-4 py-4 w-40">Labor Cost</th>
                                <th className="px-4 py-4 w-36">Material Cost</th>
                                <th className="px-6 py-4 w-32 text-right">Total</th>
                                <th className="px-4 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                            {items.map((item) => (
                                <tr key={item.originalIndex} className="group hover:bg-stone-50/80 dark:hover:bg-stone-900/30 transition-colors">
                                    <td className="px-6 py-4 align-top pt-5">
                                        <EditableInput value={item.code} onChange={val => onUpdate(item.originalIndex, 'code', val)} fontClass="font-mono text-xs text-stone-500" />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <EditableInput value={item.subcategory} onChange={val => onUpdate(item.originalIndex, 'subcategory', val)} fontClass="font-bold text-base text-stone-800 dark:text-stone-200 mb-1" placeholder="Item Name" />
                                        <EditableInput value={item.details} onChange={val => onUpdate(item.originalIndex, 'details', val)} fontClass="text-sm text-stone-500 leading-snug" multiline placeholder="Add description..." />
                                    </td>

                                    {/* Labor Input with Calculator Icon */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex items-start gap-1">
                                            <div className="relative group/input flex-1 bg-stone-50 dark:bg-stone-900 rounded-lg border border-transparent focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-amber-600 transition-colors pointer-events-none"><User size={14} /></div>
                                                <input type="number" step="0.01" className="w-full bg-transparent rounded-lg pl-8 pr-3 py-2 text-right font-mono text-stone-900 dark:text-stone-200 outline-none" value={item.labor === 0 ? '' : item.labor} placeholder="0.00" onChange={(e) => onUpdate(item.originalIndex, 'labor', e.target.value)} />
                                            </div>
                                            {/* CALCULATOR BUTTON */}
                                            <button
                                                onClick={() => onOpenCalculator(item.originalIndex)}
                                                className="p-2.5 bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-amber-500 rounded-lg transition-colors border border-transparent hover:border-amber-500/30"
                                                title="Calculate Labor"
                                            >
                                                <Calculator size={14} />
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 align-top">
                                        <div className="relative group/input bg-stone-50 dark:bg-stone-900 rounded-lg border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within/input:text-blue-500 transition-colors pointer-events-none"><DollarSign size={14} /></div>
                                            <input type="number" step="0.01" className="w-full bg-transparent rounded-lg pl-8 pr-3 py-2 text-right font-mono text-stone-900 dark:text-stone-200 outline-none" value={item.material === 0 ? '' : item.material} placeholder="0.00" onChange={(e) => onUpdate(item.originalIndex, 'material', e.target.value)} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right align-top pt-5">
                                        <span className="font-mono font-medium text-stone-700 dark:text-stone-300">${((item.labor || 0) + (item.material || 0)).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center align-top pt-4">
                                        <button onClick={() => onRemove(item.originalIndex)} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remove Item"><X size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="py-3 bg-stone-50 dark:bg-[#141210] border-t border-stone-200 dark:border-stone-800 text-center">
                        <button onClick={() => onAdd(category)} className="text-xs font-bold text-stone-400 hover:text-amber-600 flex items-center justify-center gap-2 mx-auto py-1 transition-colors uppercase tracking-wide group">
                            <span className="bg-stone-200 dark:bg-stone-800 group-hover:bg-amber-100 text-stone-500 group-hover:text-amber-600 rounded-full p-0.5 transition-colors"><Plus size={12} /></span> Add Item to {category}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function EditableInput({ value, onChange, fontClass, multiline = false, placeholder }) {
    const [isFocused, setIsFocused] = useState(false);
    return (
        <div className="relative group/edit flex items-start gap-2">
            {multiline ? (
                <textarea className={`w-full bg-transparent outline-none resize-none transition-all border-b border-transparent focus:border-amber-500/50 ${fontClass}`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={1} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} style={{ minHeight: '1.5em' }} />
            ) : (
                <input className={`w-full bg-transparent outline-none transition-all border-b border-transparent focus:border-amber-500/50 ${fontClass}`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
            )}
            <div className={`pt-0.5 text-stone-300 pointer-events-none transition-opacity duration-200 ${isFocused || !value ? 'opacity-100 text-amber-500/50' : 'opacity-0 group-hover/edit:opacity-100'}`}><Pencil size={12} /></div>
        </div>
    );
}