"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction, uploadTempLogoAction, deleteTempLogoAction } from "../actions";
import { 
  ArrowLeft, Save, Building2, User, Phone, Mail, 
  MapPin, Globe, FileText, UploadCloud, CheckCircle2 
} from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Logo State
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [tempFileUrl, setTempFileUrl] = useState(null);

  // --- Upload Logic ---
  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    // Clean up previous temp file if exists
    if (tempFileUrl) await deleteTempLogoAction(tempFileUrl);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadTempLogoAction(formData);

    if (result.success) {
        setTempFileUrl(result.url);
        setSelectedLogo(result.url);
        setLogoPreview(result.url); 
    } else {
        alert("Upload Failed");
    }
    
    setIsUploading(false);
  };

  // --- Submit Logic ---
  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.target);
    if (selectedLogo) formData.append("logo_url", selectedLogo);

    const result = await createCustomerAction(formData);

    if (result.success) {
      // Success: Redirect to the new customer's page
      router.push(`/customers/${result.newId}`);
    } else {
      alert("Error creating customer");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Nav */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">New Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="px-8 py-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-6">
             {/* Logo Preview Box */}
             <div className="w-24 h-24 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center overflow-hidden shadow-sm relative shrink-0">
                {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                    <Building2 className="text-stone-300" size={40} />
                )}
            </div>
            
            <div className="space-y-1">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Company Profile</h2>
                <p className="text-sm text-stone-500">Enter the details for the new client record.</p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? 'Creating...' : <><Save size={18} /> Create Record</>}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-8 space-y-8">
            
            {/* Logo Uploader */}
            <div className="p-6 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-dashed border-stone-300 dark:border-stone-700">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 block">Company Logo</label>
                <div className="relative group max-w-md">
                    <button type="button" className="flex items-center justify-center gap-2 w-full p-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-300 group-hover:border-amber-500 transition-colors">
                        <UploadCloud size={18} />
                        <span>{isUploading ? "Uploading..." : "Click to Upload Logo"}</span>
                    </button>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleQuickUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-stone-800 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                   <User className="text-amber-600" size={20} />
                   Contact Information
                </h3>
                <div className="space-y-4">
                   <Field 
                      icon={<Building2 size={16} />} 
                      label="Company Name" 
                      name="name" 
                      placeholder="e.g. Acme Inc." 
                      required={true}
                   />
                   <Field 
                      icon={<Mail size={16} />} 
                      label="Email Address" 
                      name="email" 
                      placeholder="contact@company.com" 
                   />
                   <Field 
                      icon={<Phone size={16} />} 
                      label="Phone Number" 
                      name="phone" 
                      placeholder="(555) 123-4567" 
                   />
                   <Field 
                      icon={<Globe size={16} />} 
                      label="Website" 
                      name="website" 
                      placeholder="https://..." 
                   />
                </div>
              </div>

              {/* Address & Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-stone-800 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                   <MapPin className="text-amber-600" size={20} />
                   Address & Details
                </h3>
                <div className="space-y-4">
                   <Field 
                      icon={<MapPin size={16} />} 
                      label="Billing Address" 
                      name="address" 
                      placeholder="123 Stone Lane, City, ST" 
                   />
                   
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={12} /> Status
                      </label>
                      <select 
                        name="status"
                        className="w-full p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        <option value="Active">Active</option>
                        <option value="Lead">Lead</option>
                        <option value="Archived">Archived</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2 space-y-2 mt-2">
                 <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                   <FileText size={14} /> Internal Notes
                </h3>
                <textarea 
                  name="notes"
                  rows={4}
                  placeholder="Add internal notes about this client..."
                  className="w-full p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

            </div>
        </div>
      </form>
    </div>
  );
}

// Reuse the Field Component for consistency
function Field({ label, icon, placeholder, name, required = false }) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors group-focus-within:text-amber-600">
        {icon} {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-stone-300"
      />
    </div>
  );
}