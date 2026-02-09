// app/dashboard/customers/new/page.js
import { mysql_createCustomer } from "../../../../context/mysqlConnection";
import { redirect } from "next/navigation";

export default function NewCustomerPage() {
  
  // Server Action to handle form submission
  async function createCustomerAction(formData) {
    "use server";
    const name = formData.get("name");
    
    if (name) {
      await mysql_createCustomer(name);
      redirect("/dashboard/customers");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Customer</h1>
      
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-medium">
        <form action={createCustomerAction} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name / Company
            </label>
            <input 
              name="name"
              type="text" 
              required
              placeholder="e.g. Acme Construction Ltd." 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all duration-200"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
             <a 
               href="/dashboard/customers"
               className="px-6 py-2.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all duration-200"
             >
               Cancel
             </a>
             <button 
               type="submit"
               className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/30 transition"
             >
               Save Customer
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}