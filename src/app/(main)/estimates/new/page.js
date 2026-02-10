// app/dashboard/estimates/new/page.js
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  ChevronDown, 
  Trash2, 
  Plus,
  Briefcase,
  LayoutTemplate,
  DollarSign,
  User,
  X
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
    
    // Data States
    const [availableProjects, setAvailableProjects] = useState([]);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    
    // Form States
    const [projectMode, setProjectMode] = useState('new'); // 'new' | 'existing'
    const [meta, setMeta] = useState({
        projectName: "", // For new project
        selectedProjectId: "", // For existing project (internalid)
        adminFee: 15
    });
    
    const [lineItems, setLineItems] = useState([]);

    // 1. Initial Data Fetch
    useEffect(() => {
        async function init() {
            try {
                const [projects, templates, defaultItems] = await Promise.all([
                    getProjectsAction(),
                    getTemplatesAction(),
                    getTemplateItemsAction('default')
                ]);
                
                setAvailableProjects(projects || []);
                setAvailableTemplates(templates || []);

                // Recover Draft Logic
                const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.lineItems && parsed.lineItems.length > 0) {
                        if (confirm("Recover unsaved draft?")) {
                            setLineItems(parsed.lineItems);
                            setMeta(parsed.meta);
                            setProjectMode(parsed.projectMode || 'new');
                            setIsLoading(false);
                            return;
                        }
                    }
                }

                setLineItems(defaultItems || []);
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
        if (!isLoading) {
            const data = { lineItems, meta, projectMode, lastSaved: new Date() };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }
    }, [lineItems, meta, projectMode, isLoading]);

    // 3. Handlers
    const handleTemplateChange = async (e) => {
        const tmplId = e.target.value;
        if (!tmplId) return;
        
        if (confirm("Changing template will reset your line items. Continue?")) {
            const newItems = await getTemplateItemsAction(tmplId);
            setLineItems(newItems);
        }
    };

    const handleUpdateItem = (index, field, value) => {
        const newItems = [...lineItems];
        newItems[index][field] = parseFloat(value) || 0;
        setLineItems(newItems);
    };

    const handleRemoveItem = (index) => {
        if (confirm("Remove this line item?")) {
            const newItems = lineItems.filter((_, i) => i !== index);
            setLineItems(newItems);
        }
    };

    const handleSave = async () => {
        // Validation
        if (projectMode === 'new' && !meta.projectName) return alert("Please enter a Project Name.");
        if (projectMode === 'existing' && !meta.selectedProjectId) return alert("Please select a Project.");

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

    if (isLoading) return <div className="p-10 text-stone-500">Loading Wyatt Estimator...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* --- TOP BAR --- */}
            <div className="flex justify-between items-end border-b border-stone-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-stone-50 font-serif">New Estimate</h1>
                </div>
                <div className="flex gap-3">
                    <button 
                         onClick={() => {
                            if(confirm("Discard changes?")) {
                                localStorage.removeItem(LOCAL_STORAGE_KEY);
                                window.location.reload();
                            }
                        }}
                        className="px-4 py-2 text-white bg-red-700 hover:bg-red-600 rounded-xl transition-colors text-sm font-medium"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-amber-500 text-stone-900 px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-amber-400 transition-all active:scale-95"
                    >
                        <Save size={18} /> Save Estimate
                    </button>
                </div>
            </div>

            {/* --- CONFIGURATION CARD (WHITE) --- */}
            <div className="bg-[#1c1917] p-6 rounded-xl border border-stone-900 shadow-sm space-y-6">
                
                {/* Row 1: Template & Admin Fee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                            <LayoutTemplate size={14} /> Load Template
                        </label>
                        <select 
                            className="w-full border border-stone-700 rounded-lg px-4 py-2.5 text-stone-50 focus:ring-2 focus:ring-amber-500 outline-none"
                            onChange={handleTemplateChange}
                            defaultValue=""
                        >
                            <option value="" disabled>Select a template...</option>
                            {availableTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Admin Fee (%)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                className="w-full border border-stone-700 rounded-lg px-4 py-2.5 text-stone-50 focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                                value={meta.adminFee}
                                onChange={e => setMeta({...meta, adminFee: parseFloat(e.target.value)})}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">%</span>
                        </div>
                    </div>
                </div>

                <hr className="border-stone-700" />

                {/* Row 2: Project Selection */}
                <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                        <Briefcase size={14} /> Project Details
                    </label>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* Toggle Buttons */}
                        <div className="flex bg-stone-700 p-1 rounded-lg shrink-0">
                            <button 
                                onClick={() => setProjectMode('new')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${projectMode === 'new' ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-900'}`}
                            >
                                New Project
                            </button>
                            <button 
                                onClick={() => setProjectMode('existing')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${projectMode === 'existing' ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-900'}`}
                            >
                                Existing
                            </button>
                        </div>

                        {/* Conditional Inputs */}
                        <div className="flex-1 w-full">
                            {projectMode === 'new' ? (
                                <input 
                                    className="w-full border border-stone-700 rounded-lg px-4 py-2.5 text-stone-50 focus:ring-2 focus:ring-amber-500 outline-none font-medium placeholder:text-stone-400"
                                    placeholder="Enter Project Name..."
                                    value={meta.projectName}
                                    onChange={e => setMeta({...meta, projectName: e.target.value})}
                                />
                            ) : (
                                <select 
                                    className="w-full border border-stone-700 rounded-lg px-4 py-2.5 text-stone-50 focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={meta.selectedProjectId}
                                    onChange={e => setMeta({...meta, selectedProjectId: e.target.value})}
                                >
                                    <option value="">-- Select Existing Project --</option>
                                    {availableProjects.map(p => (
                                        <option key={p.internalid} value={p.internalid}>
                                            {p.name} {p.client_name ? `(${p.client_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ESTIMATE TABLES (WHITE) --- */}
            <div className="space-y-6">
                {Object.keys(groupedItems).map((category) => (
                    <CategoryTable 
                        key={category}
                        category={category}
                        items={groupedItems[category]}
                        onUpdate={handleUpdateItem}
                        onRemove={handleRemoveItem}
                    />
                ))}
            </div>

            {/* --- STICKY FOOTER SUMMARY --- */}
            <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-right-4">
                <div className="bg-[#1c1917] text-[#eaddcf] p-6 rounded-2xl shadow-2xl border border-stone-700 min-w-[320px] backdrop-blur-xl">
                    <div className="grid grid-cols-2 gap-y-1 gap-x-8 text-sm mb-4">
                        <span className="text-stone-500">Labor</span>
                        <span className="font-mono text-right">${totals.laborTotal.toFixed(2)}</span>
                        
                        <span className="text-stone-500">Material</span>
                        <span className="font-mono text-right">${totals.materialTotal.toFixed(2)}</span>
                        
                        <span className="text-stone-300 font-bold pt-2">Subtotal</span>
                        <span className="font-mono text-right font-bold pt-2">${totals.subtotal.toFixed(2)}</span>
                        
                        <span className="text-stone-500">Admin ({meta.adminFee}%)</span>
                        <span className="font-mono text-right">${totals.adminAmt.toFixed(2)}</span>
                    </div>
                    
                    <div className="h-px bg-stone-700 mb-4" />
                    
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-lg text-white">Grand Total</span>
                        <span className="font-bold text-3xl text-amber-500 font-serif">${totals.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

// --- SUB-COMPONENT: CATEGORY TABLE (WHITE) ---
function CategoryTable({ category, items, onUpdate, onRemove }) {
    const [isOpen, setIsOpen] = useState(true);
    
    // Calculate category totals
    const catLabor = items.reduce((sum, item) => sum + (item.labor || 0), 0);
    const catMat = items.reduce((sum, item) => sum + (item.material || 0), 0);
    const catTotal = catLabor + catMat;

    return (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            {/* Category Header */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex justify-between items-center p-5 cursor-pointer transition-colors ${isOpen ? 'bg-stone-50 border-b border-stone-200' : 'bg-white hover:bg-stone-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-md transition-transform duration-200 ${isOpen ? 'rotate-0 text-stone-800' : '-rotate-90 text-stone-400'}`}>
                        <ChevronDown size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800">{category}</h3>
                    <span className="bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {items.length} items
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-stone-400 uppercase mr-3">Category Total</span>
                    <span className="font-mono font-bold text-stone-900 text-lg">${catTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Table Rows */}
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-xs font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4 w-20">Code</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 w-40">Labor ($)</th>
                                <th className="px-6 py-4 w-40">Material ($)</th>
                                <th className="px-6 py-4 w-32 text-right">Total</th>
                                <th className="px-4 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {items.map((item) => {
                                const rowTotal = (item.labor || 0) + (item.material || 0);
                                return (
                                    <tr key={item.code} className="group hover:bg-stone-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-stone-400 text-xs pt-5">
                                            {item.code}
                                        </td>
                                        <td className="px-6 py-4 pt-5">
                                            <div className="font-bold text-stone-800 text-base mb-0.5">{item.subcategory}</div>
                                            <div className="text-stone-500 leading-snug">{item.details}</div>
                                        </td>
                                        
                                        {/* Labor Input */}
                                        <td className="px-6 py-4">
                                            <div className="relative group/input">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within/input:text-amber-500 transition-colors pointer-events-none">
                                                    <User size={14} />
                                                </div>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-right font-mono text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-stone-300"
                                                    value={item.labor || ''}
                                                    onChange={(e) => onUpdate(item.originalIndex, 'labor', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        {/* Material Input */}
                                        <td className="px-6 py-4">
                                            <div className="relative group/input">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within/input:text-blue-500 transition-colors pointer-events-none">
                                                    <DollarSign size={14} />
                                                </div>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-2 text-right font-mono text-stone-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-stone-300"
                                                    value={item.material || ''}
                                                    onChange={(e) => onUpdate(item.originalIndex, 'material', e.target.value)}
                                                />
                                            </div>
                                        </td>

                                        {/* Row Total */}
                                        <td className="px-6 py-4 text-right font-mono font-medium text-stone-700 pt-5">
                                            ${rowTotal.toFixed(2)}
                                        </td>

                                        {/* Delete Button */}
                                        <td className="px-4 py-4 text-center pt-5">
                                            <button 
                                                onClick={() => onRemove(item.originalIndex)}
                                                className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove Item"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Add Item Footer */}
                    <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
                        <button className="text-xs font-bold text-stone-400 hover:text-stone-800 flex items-center justify-center gap-1 mx-auto py-1 transition-colors uppercase tracking-wide">
                            <Plus size={14} /> Add Line Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}