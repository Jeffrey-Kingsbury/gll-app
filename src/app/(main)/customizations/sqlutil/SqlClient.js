"use client";

import { useState, useEffect } from "react";
import { executeQueryAction, getSchemaAction } from "./actions";
import { 
    Play, 
    Database, 
    ChevronRight, 
    ChevronDown, 
    Table, 
    Columns,
    RefreshCw,
    AlertCircle,
    Download,    // <--- New Icon
    Copy,        // <--- New Icon
    Check        // <--- New Icon
} from "lucide-react";

export default function SqlClient() {
    const [query, setQuery] = useState("SELECT * FROM customers LIMIT 10;");
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Copy Feedback State
    const [isCopied, setIsCopied] = useState(false);
    
    // Schema State
    const [schema, setSchema] = useState({});
    const [expandedTables, setExpandedTables] = useState({});
    const [isSchemaLoading, setIsSchemaLoading] = useState(true);

    // Load Schema on Mount
    useEffect(() => {
        loadSchema();
    }, []);

    async function loadSchema() {
        setIsSchemaLoading(true);
        const res = await getSchemaAction();
        if (res.success) setSchema(res.data);
        setIsSchemaLoading(false);
    }

    async function handleExecute() {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResults(null);

        const res = await executeQueryAction(query);
        
        if (res.success) {
            setResults(res.data);
        } else {
            setError(res.error);
        }
        setIsLoading(false);
    }

    // --- NEW: Export to CSV ---
    const handleExportCSV = () => {
        if (!results || results.length === 0) return;

        // 1. Get Headers
        const headers = Object.keys(results[0]);
        
        // 2. Build CSV Content
        const csvRows = [];
        csvRows.push(headers.join(",")); // Header Row

        for (const row of results) {
            const values = headers.map(header => {
                const val = row[header];
                // Escape quotes and wrap in quotes if it contains comma
                const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        }

        // 3. Create Blob & Download
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `query_results_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // --- NEW: Copy to Clipboard ---
    const handleCopyClipboard = () => {
        if (!results || results.length === 0) return;

        // Create Tab-Separated Values (TSV) - Pastes better into Excel/Sheets than CSV
        const headers = Object.keys(results[0]);
        const tsvRows = [];
        tsvRows.push(headers.join("\t"));

        for (const row of results) {
            const values = headers.map(header => {
                let val = row[header];
                if (val === null) return "NULL";
                return String(val).replace(/\t/g, "    "); // Sanitize tabs
            });
            tsvRows.push(values.join("\t"));
        }

        navigator.clipboard.writeText(tsvRows.join("\n"));
        
        // Show "Copied!" feedback
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const toggleTable = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 animate-in fade-in pb-4">
            
            {/* --- LEFT: QUERY EDITOR & RESULTS --- */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                
                {/* Editor Card */}
                <div className="bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col h-1/3 min-h-[200px]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 rounded-t-xl">
                        <div className="flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-stone-300">
                            <Database size={16} /> SQL Editor
                        </div>
                        <button 
                            onClick={handleExecute}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                        >
                            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                            EXECUTE
                        </button>
                    </div>
                    <textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 w-full p-4 bg-transparent font-mono text-sm text-stone-800 dark:text-stone-200 outline-none resize-none placeholder:text-stone-400"
                        spellCheck="false"
                        placeholder="SELECT * FROM table_name..."
                    />
                </div>

                {/* Results Area */}
                <div className="flex-1 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col">
                    {error ? (
                        <div className="p-8 flex flex-col items-center justify-center text-red-500 gap-3 h-full">
                            <AlertCircle size={32} />
                            <p className="font-mono text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg text-center max-w-lg border border-red-100 dark:border-red-900/30">
                                {error}
                            </p>
                        </div>
                    ) : !results ? (
                        <div className="h-full flex items-center justify-center text-stone-400 text-sm italic">
                            Results will appear here...
                        </div>
                    ) : (
                        <>
                           {/* --- RESULTS TOOLBAR --- */}
                           <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex justify-between items-center">
                                <span className="font-mono">{results.length} rows returned</span>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleCopyClipboard}
                                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors text-stone-600 dark:text-stone-400"
                                        title="Copy to Clipboard"
                                    >
                                        {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        <span className={isCopied ? "text-green-600 font-medium" : ""}>
                                            {isCopied ? "Copied" : "Copy"}
                                        </span>
                                    </button>
                                    
                                    <div className="h-4 w-px bg-stone-300 dark:bg-stone-700"></div>

                                    <button 
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors text-stone-600 dark:text-stone-400"
                                        title="Download CSV"
                                    >
                                        <Download size={14} />
                                        <span>Export CSV</span>
                                    </button>
                                </div>
                           </div>

                           {/* Table */}
                           <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-xs text-stone-600 dark:text-stone-300 whitespace-nowrap">
                                    <thead className="bg-stone-100 dark:bg-stone-800 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            {results.length > 0 ? Object.keys(results[0]).map(key => (
                                                <th key={key} className="px-4 py-3 font-bold border-b border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200">
                                                    {key}
                                                </th>
                                            )) : <th className="px-4 py-3">Result</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
                                        {results.map((row, i) => (
                                            <tr key={i} className="hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="px-4 py-2 border-r border-stone-100 dark:border-stone-800 last:border-0 max-w-xs truncate">
                                                        {val === null ? <span className="text-stone-300 italic">NULL</span> : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- RIGHT: SCHEMA BROWSER --- */}
            <div className="w-64 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 font-bold text-stone-600 dark:text-stone-300 text-sm flex justify-between items-center">
                    <span>Schema</span>
                    <button onClick={loadSchema} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors" title="Refresh Schema">
                        <RefreshCw size={12} className={isSchemaLoading ? "animate-spin" : ""} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {Object.keys(schema).length === 0 && !isSchemaLoading && (
                        <div className="p-4 text-center text-xs text-stone-400">No tables found</div>
                    )}
                    
                    {Object.keys(schema).map((tableName) => (
                        <div key={tableName} className="rounded-lg overflow-hidden">
                            <button 
                                onClick={() => toggleTable(tableName)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left select-none"
                            >
                                {expandedTables[tableName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Table size={14} className="text-amber-600 shrink-0" />
                                <span className="truncate" title={tableName}>{tableName}</span>
                            </button>
                            
                            {/* Columns List */}
                            {expandedTables[tableName] && (
                                <div className="pl-7 pr-2 py-1 space-y-1 bg-stone-50 dark:bg-stone-900/30 animate-in slide-in-from-top-1 duration-200">
                                    {schema[tableName].map((col) => (
                                        <div key={col.name} className="flex items-center justify-between text-[10px] text-stone-500 group hover:text-stone-800 dark:hover:text-stone-200 cursor-default">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <Columns size={10} className="shrink-0" />
                                                <span className="font-mono truncate" title={col.name}>{col.name}</span>
                                            </div>
                                            <span className="opacity-50 uppercase text-[9px] shrink-0 ml-2">{col.type}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}