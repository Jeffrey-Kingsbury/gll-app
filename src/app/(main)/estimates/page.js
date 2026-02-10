import Link from "next/link";
import { Plus, Search, Filter, Calculator, FileText } from "lucide-react";
import { getEstimatesAction } from "./actions";

export default async function EstimatesPage() {
  const estimates = await getEstimatesAction();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
            <Link 
            href="/dashboard/estimates/settings"
            className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
            >
            Templates
            </Link>
            <Link 
            href="/dashboard/estimates/new"
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95"
            >
            <Plus size={18} />
            New Estimate
            </Link>
        </div>
      </div>

      {/* Toolbar - Dark Stone Theme */}
      <div className="flex gap-3 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
          <input 
            type="text" 
            placeholder="Search estimates..." 
            className="w-full pl-10 pr-4 py-2 bg-stone-900 border border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-stone-600 text-[#eaddcf]"
          />
        </div>
        <button className="p-2 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-[#eaddcf] transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* List Table */}
      <div className="bg-[#1c1917] rounded-xl border border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#eaddcf]">
            <thead className="bg-stone-800 border-b border-stone-700">
              <tr>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs w-24">ID</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Project Name</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Client</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right">Total</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {estimates.map((est) => (
                <tr 
                  key={est.id} 
                  className="hover:bg-stone-800/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 text-stone-500 font-mono text-xs">
                    EST-{est.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#eaddcf] group-hover:text-white">
                    {est.project}
                  </td>
                  <td className="px-6 py-4 text-stone-400">
                    {est.client}
                  </td>
                  <td className="px-6 py-4 text-stone-500 text-xs">
                    {est.date}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-amber-500">
                    ${est.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                        est.status === 'Sent' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 
                        'bg-stone-800 text-stone-400 border-stone-700'
                    }`}>
                        {est.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}