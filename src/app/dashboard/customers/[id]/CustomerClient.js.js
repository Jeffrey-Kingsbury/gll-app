// app/dashboard/customers/[id]/CustomerClient.js

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerAction } from "../actions";
import { uploadFileAction } from "../../documents/actions";
import { 
  ArrowLeft, 
  Edit2, 
  Save, 
  X, 
  User, 
  Building2,
  Phone,
  Mail
} from "lucide-react";

export default function CustomerClient({ customer, allImages = [] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for the Logo: Defaults to DB value, updates on change
  const [logoPreview, setLogoPreview] = useState(customer.logo_url);
  const [selectedLogo, setSelectedLogo] = useState(customer.logo_url || "");
  const [isUploading, setIsUploading] = useState(false);

  // --- Upload Logic ---
  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", ""); 

    const result = await uploadFileAction(formData);

    if (result.success) {
        setSelectedLogo(result.url);
        setLogoPreview(result.url); // Updates the view immediately
        router.refresh(); 
    } else {
        alert("Upload Failed");
    }
    
    setIsUploading(false);
  };

  // --- Save Logic ---
  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.target);
    
    // Ensure we send the logo_url (whether it changed or not)
    if (selectedLogo) {
        formData.append("logo_url", selectedLogo);
    }

    const result = await updateCustomerAction(formData);

    if (result.success) {
      setIsEditing(false); 
      router.refresh();    
    } else {
      alert("Error saving data");
    }
    setIsLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition"
        >
          <ArrowLeft size={16} /> Back to List
        </button>

        <div className="flex gap-2">
          {isEditing ? (
            <button 
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all duration-200"
              >
                <X size={16} /> Cancel
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-secondary-50 rounded-lg transition-all duration-200 shadow-soft"
            >
              <Edit2 size={16} /> Edit Record
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className={`
        bg-white rounded-xl border shadow-medium transition-all duration-300
        ${isEditing ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-gray-200'}
      `}>
        
        {/* --- CARD HEADER (Logo is Displayed Here) --- */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
          <div className="flex items-center gap-6">
             
             {/* 1. THE LOGO CONTAINER */}
             <div className="w-20 h-20 rounded-xl bg-secondary-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-soft relative group">
                {logoPreview ? (
                    // Display the Image if it exists
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-full h-full object-contain p-1" 
                    />
                ) : (
                    // Default Icon if no logo
                    <Building2 className="text-secondary-300" size={32} />
                )}
            </div>

            {/* Customer Title & ID */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  {customer.name}
                  {isEditing && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Editing</span>}
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-mono">ID: #{customer.internalid}</p>
            </div>
          </div>
        </div>

        {/* --- FORM BODY --- */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <input type="hidden" name="internalid" value={customer.internalid} />

            {/* EDIT MODE ONLY: Logo Selection Tools */}
            {isEditing && (
                <div className="p-5 bg-secondary-50 rounded-xl border border-dashed border-gray-300 space-y-4 mb-8">
                    <label className="block text-sm font-bold text-gray-700">
                        Update Company Logo
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dropdown */}
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-2">Select Existing</span>
                            <select 
                                name="logo_url"
                                value={selectedLogo}
                                onChange={(e) => {
                                    setSelectedLogo(e.target.value);
                                    setLogoPreview(e.target.value);
                                }}
                                className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm"
                            >
                                <option value="">-- No Logo --</option>
                                {allImages.map(img => (
                                    <option key={img.id} value={img.url}>{img.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Upload */}
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-2">Upload New</span>
                             <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleQuickUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                             />
                             {isUploading && <p className="text-xs text-blue-600 mt-2 font-medium animate-pulse">Uploading...</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Customer Name / Company
                </label>
                <input 
                  name="name"
                  defaultValue={customer.name}
                  disabled={!isEditing}
                  required
                  className={`
                    w-full px-4 py-2.5 rounded-lg border outline-none transition-all
                    ${isEditing 
                      ? 'bg-white border-primary-500 ring-2 ring-primary-500/10 text-gray-900' 
                      : 'bg-transparent border-transparent px-0 text-lg font-medium text-gray-900 cursor-default'}
                  `}
                />
              </div>

              {/* Read-Only Placeholder Fields (Visual flair) */}
              <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  Email Address
                </label>
                 <div className="px-0 py-2.5 text-gray-400 italic">No email linked</div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition transform active:scale-95 disabled:opacity-70"
                >
                  {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}