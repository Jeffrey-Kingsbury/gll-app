"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function EstimatesTable({ estimates, totalCount, totalPages, sortCol, sortDir, currentPage, limit }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => params.set(key, value));
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleSort = (column) => {
    const newDir = sortCol === column && sortDir === "asc" ? "desc" : "asc";
    updateParams({ sort: column, dir: newDir, page: 1 });
  };

  const handleLimitChange = (e) => {
    updateParams({ limit: e.target.value, page: 1 });
  };

  return (
    <div className={`space-y-4 transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
      
      {/* Table Section */}
      <div className="bg-[#1c1917] rounded-xl border border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#eaddcf]">
            <thead className="bg-stone-800 border-b border-stone-700">
              <tr>
                <Header label="ID" col="internalid" current={sortCol} dir={sortDir} onSort={handleSort} />
                <Header label="Project Name" col="project" current={sortCol} dir={sortDir} onSort={handleSort} />
                <Header label="Client" col="client" current={sortCol} dir={sortDir} onSort={handleSort} />
                <Header label="Date" col="date" current={sortCol} dir={sortDir} onSort={handleSort} />
                <Header label="Total" col="total" current={sortCol} dir={sortDir} onSort={handleSort} align="right" />
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right">Status</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {estimates && estimates.length > 0 ? (
                estimates.map((est) => (
                  <tr key={est.internalid} className="hover:bg-stone-800/50 transition-colors group">
                    <td className="px-6 py-4 text-stone-500 font-mono text-xs">
                      EST-{est.internalid}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#eaddcf] group-hover:text-white transition-colors">
                      {est.project}
                    </td>
                    <td className="px-6 py-4 text-stone-400">
                      {est.client}
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-xs">
                      {new Date(est.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-amber-500">
                      ${Number(est.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                          est.status === 'Sent' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 
                          est.status === 'Approved' ? 'bg-green-900/30 text-green-300 border-green-800' :
                          'bg-stone-800 text-stone-400 border-stone-700'
                      }`}>
                          {est.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/estimates/${est.internalid}`}
                          className="text-xs font-bold text-stone-500 hover:text-[#eaddcf] px-3 py-1.5 rounded-md hover:bg-stone-700 transition-all"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/estimates/${est.internalid}?edit=true`}
                          className="text-xs font-bold text-amber-600 hover:text-amber-500 px-3 py-1.5 rounded-md hover:bg-stone-700 transition-all"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-stone-500 italic">
                    No estimates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="bg-stone-800/50 px-6 py-4 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select 
                value={limit} 
                onChange={handleLimitChange}
                className="bg-stone-900 border border-stone-700 text-stone-200 rounded px-2 py-1 outline-none focus:border-amber-500"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
            <span>Total: {totalCount} estimates</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1 || isPending}
              onClick={() => updateParams({ page: currentPage - 1 })}
              className="p-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="px-4 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs font-bold text-amber-500">
              Page {currentPage} of {totalPages || 1}
            </div>

            <button 
              disabled={currentPage >= totalPages || isPending}
              onClick={() => updateParams({ page: currentPage + 1 })}
              className="p-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal Helper for Sortable Headers
function Header({ label, col, current, dir, onSort, align = "left" }) {
  const isActive = current === col;
  return (
    <th className={`px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button 
        onClick={() => onSort(col)} 
        className="group inline-flex items-center gap-1 hover:text-amber-500 transition-colors uppercase"
      >
        {label}
        <span className={`transition-opacity ${isActive ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-50'}`}>
          {isActive && dir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>
    </th>
  );
}