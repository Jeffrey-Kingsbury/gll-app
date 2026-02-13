import Link from "next/link";
import { Plus, Search, Filter, Calculator } from "lucide-react";
import { getEstimatesAction } from "./actions";
import EstimatesTable from "./EstimatesTable";

export const dynamic = 'force-dynamic';

export default async function EstimatesPage({ searchParams }) {
  const params = await searchParams;
  // Parse params with defaults
  const sortCol = params.sort || 'internalid';
  const sortDir = params.dir || 'desc';
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 50;
  const { data, totalCount, totalPages } = await getEstimatesAction({
    sortCol,
    sortDir,
    page,
    limit
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Calculator size={28} className="text-amber-600" />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Estimates</h1>
        </div>
        <Link href="/estimates/new" className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95">
          <Plus size={18} /> New Estimate
        </Link>
      </div>

      <div className="flex gap-3 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
          <input type="text" placeholder="Search estimates..." className="w-full pl-10 pr-4 py-2 bg-stone-900 border border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-stone-600 text-[#eaddcf]" />
        </div>
        <button className="p-2 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-[#eaddcf] transition-colors"><Filter size={20} /></button>
      </div>

      {/* This component handles the sort without flickering */}
      <EstimatesTable
        estimates={data}
        totalCount={totalCount}
        totalPages={totalPages}
        sortCol={sortCol}
        sortDir={sortDir}
        currentPage={page}
        limit={limit}
      />    </div>
  );
}