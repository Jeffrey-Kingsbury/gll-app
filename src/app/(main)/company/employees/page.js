// app/company/employees/page.js
import { mysql_executeQueryReadOnly } from "../../../../context/mysqlConnection";
import Link from "next/link";
import { Plus, Search, Filter, UserCheck, Briefcase, Mail } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  // 1. Fetch data directly from MySQL
  // We'll use the read-only query helper we created for the SQL utility
  const employees = await mysql_executeQueryReadOnly("SELECT * FROM employees ORDER BY last_name ASC");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
            <UserCheck size={28} className="text-amber-600" />
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Employees</h1>
        </div>

        <Link 
          href="/company/employees/new"
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95"
        >
          <Plus size={18} />
          Add Employee
        </Link>
      </div>

      {/* Toolbar / Search - Matching Wyatt Style */}
      <div className="flex gap-3 bg-[#1c1917] p-4 rounded-xl border border-stone-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="w-full pl-10 pr-4 py-2 bg-stone-900 border border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-stone-600 text-[#eaddcf]"
          />
        </div>
        <button className="p-2 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-[#eaddcf] transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* List Table - Wyatt Dark Theme */}
      <div className="bg-[#1c1917] rounded-xl border border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#eaddcf]">
            <thead className="bg-stone-800 border-b border-stone-700">
              <tr>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs w-32">ID</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Role & Dept</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs">Access Level</th>
                <th className="px-6 py-4 font-bold text-stone-400 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <tr 
                    key={emp.internalid} 
                    className="hover:bg-stone-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-stone-500 font-mono text-xs">
                      #{emp.internalid}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#eaddcf] group-hover:text-white transition-colors">
                            {emp.first_name} {emp.last_name}
                        </span>
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Mail size={10} /> {emp.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-stone-300 flex items-center gap-1.5">
                            <Briefcase size={12} className="text-amber-600/70" /> {emp.job_title}
                        </span>
                        <span className="text-xs text-stone-500">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            emp.level_access === 3 ? 'bg-red-900/30 text-red-400 border border-red-900/50' :
                            emp.level_access === 2 ? 'bg-amber-900/30 text-amber-400 border border-amber-900/50' :
                            'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}>
                            {emp.level_access === 3 ? 'Admin' : emp.level_access === 2 ? 'Manager' : 'Employee'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/company/employees/${emp.internalid}`}
                          className="text-xs font-bold text-stone-500 hover:text-[#eaddcf] px-3 py-1.5 rounded-md hover:bg-stone-700 transition-all"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/company/employees/${emp.internalid}?edit=true`}
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
                  <td colSpan="5" className="px-6 py-16 text-center text-stone-500">
                    <div className="flex flex-col items-center gap-3">
                       <UserCheck size={40} className="opacity-20 text-stone-400" />
                       <p>No employees found.</p>
                       <p className="text-xs font-light text-stone-600">Add staff members to begin managing your team.</p>
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