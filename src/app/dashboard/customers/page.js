// app/dashboard/customers/page.js
import { mysql_getCustomers } from "../../../context/mysqlConnection";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";

// This is a Server Component by default
export default async function CustomersPage() {
  // Fetch data directly from MySQL
  const customers = await mysql_getCustomers();

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customers
          </h1>
          <p className="text-sm text-secondary-500">
            Manage your client database
          </p>
        </div>
        <Link 
          href="/dashboard/customers/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition active:scale-95"
        >
          <Plus size={18} />
          New Customer
        </Link>
      </div>

      {/* Filters / Search Bar (Visual only for now) */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all duration-200"
          />
        </div>
        <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-secondary-50 text-secondary-600">
          <Filter size={20} />
        </button>
      </div>

      {/* NetSuite-style List Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-medium">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary-50 text-secondary-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-24">Internal ID</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <tr 
                    key={customer.internalid} 
                    className="hover:bg-secondary-50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-secondary-500 font-mono text-xs">
                      #{customer.internalid}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/dashboard/customers/${customer.internalid}`}
                          className="text-xs font-medium text-primary-600 hover:text-primary-500 px-3 py-1.5 rounded-md hover:bg-primary-50"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/dashboard/customers/${customer.internalid}/edit`}
                          className="text-xs font-medium text-secondary-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-secondary-100"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-secondary-500">
                    No customers found. Click "New Customer" to create one.
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