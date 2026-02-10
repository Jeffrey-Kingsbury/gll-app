// app/dashboard/customers/page.js
import { mysql_getCustomers } from "../../../context/mysqlConnection";
import Link from "next/link";
import { Plus, Search, Filter, Users, MoreHorizontal } from "lucide-react";

// This is a Server Component by default
export default async function CustomersPage() {
  // Fetch data directly from MySQL
  const customers = await mysql_getCustomers();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header - Text remains dark because the PAGE background is light */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        {/* Primary Action - Amber to match Documents 'Upload' */}
        <Link 
          href="/dashboard/customers/new"
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95"
        >
          <Plus size={18} />
          New Customer
        </Link>
      </div>

      {/* Toolbar / Search - Dark Stone Theme */}
      <div className="flex gap-3 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-2 bg-stone-900 border border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-stone-600 text-[#eaddcf]"
          />
        </div>
        <button className="p-2 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-[#eaddcf] transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* List Table - Dark Stone Theme */}
      <div className="bg-[#1c1917] rounded-xl border border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#eaddcf]">
            <thead className="bg-stone-800 border-b border-stone-700">
              <tr>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs w-32">Internal ID</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Customer Name</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {customers && customers.length > 0 ? (
                customers.map((customer) => (
                  <tr 
                    key={customer.internalid} 
                    className="hover:bg-stone-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-stone-500 font-mono text-xs">
                      #{customer.internalid}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#eaddcf] group-hover:text-white transition-colors">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/dashboard/customers/${customer.internalid}`}
                          className="text-xs font-bold text-stone-500 hover:text-[#eaddcf] px-3 py-1.5 rounded-md hover:bg-stone-700 transition-all"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/dashboard/customers/${customer.internalid}/edit`}
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
                  <td colSpan="3" className="px-6 py-16 text-center text-stone-500">
                    <div className="flex flex-col items-center gap-3">
                       <Users size={40} className="opacity-20 text-stone-400" />
                       <p>No customers found.</p>
                       <p className="text-xs font-light text-stone-600">Click "New Customer" to add your first client.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}