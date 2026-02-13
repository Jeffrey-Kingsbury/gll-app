// app/dashboard/customers/[id]/CustomerClient.js

"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  updateCustomerAction, uploadTempLogoAction,
  deleteTempLogoAction, deleteCustomerAction
} from "../actions";
import { uploadFileAction } from "../../documents/actions";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function CustomerClient({ customer, allImages = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state based on URL param
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [isLoading, setIsLoading] = useState(false);

  // Logo State
  const [logoPreview, setLogoPreview] = useState(customer.logo_url);
  const [selectedLogo, setSelectedLogo] = useState(customer.logo_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [tempFileUrl, setTempFileUrl] = useState(null);

  const handleDelete = async () => {
    const confirmDelete = confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`);
    if (!confirmDelete) return;

    setIsLoading(true);
    const result = await deleteCustomerAction(customer.internalid);

    if (result.success) {
      router.push("/customers");
    } else {
      alert(result.error);
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    // If we uploaded a temp file but didn't save, delete it now.
    if (tempFileUrl) {
      await deleteTempLogoAction(tempFileUrl);
      setTempFileUrl(null);
    }



    // Revert visual state
    setLogoPreview(customer.logo_url);
    setSelectedLogo(customer.logo_url || "");
    window.location.href = `/customers/${customer.internalid}`;
  };

  // --- Upload Logic ---
  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    // If there was already a DIFFERENT temp file, delete it before uploading new one
    if (tempFileUrl) {
      await deleteTempLogoAction(tempFileUrl);
    }

    const formData = new FormData();
    formData.append("file", file);

    // Call the specific TEMP action
    const result = await uploadTempLogoAction(formData);

    if (result.success) {
      // Update State
      setTempFileUrl(result.url); // Mark for potential cleanup
      setSelectedLogo(result.url); // Set as value to be saved
      setLogoPreview(result.url);  // Show immediately
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
    if (selectedLogo) {
      formData.append("logo_url", selectedLogo);
    }

    const result = await updateCustomerAction(formData);

    if (result.success) {
      // Success! The file is now permanent. 
      // We clear tempFileUrl so we don't accidentally try to delete the now-permanent file.
      setTempFileUrl(null);

      setIsEditing(false);
      window.location.href = `/customers/${customer.internalid}`;
    } else {
      alert("Error saving data");
    }
    setIsLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">

      {/* --- TOP NAVIGATION --- */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.location.href = `/customers/`}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Customers
        </button>

        <div className="flex gap-3">
          {isEditing ? (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-stone-500 hover:text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <X size={16} /> Cancel
            </button>
            
          ) : (
            <button
              onClick={() => window.location.href = "?edit=true"}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-500 hover:text-amber-600 rounded-lg transition-all shadow-sm"
            >
              <Edit2 size={16} /> Edit Customer
            </button>
          )}
          {isEditing && (
            <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center gap-2 bg-red-700 text-white hover:bg-red-800 border border-red-700 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Delete</span>
              </button>
          )}
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <form onSubmit={handleSubmit} className={`
        bg-white dark:bg-[#1c1917] rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm
        ${isEditing ? 'border-amber-500/50 ring-4 ring-amber-500/5' : 'border-stone-200 dark:border-stone-800'}
      `}>

        {/* --- HEADER SECTION --- */}
        <div className="px-8 py-8 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-6 md:items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-6">

            {/* Logo Box */}
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center overflow-hidden shadow-sm relative shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="text-stone-300" size={40} />
              )}
            </div>

            {/* Title Info */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                {isEditing ? (
                  <input
                    name="name"
                    defaultValue={customer.name}
                    required
                    className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white bg-transparent border-b-2 border-amber-500 focus:outline-none w-full md:w-auto"
                    placeholder="Company Name"
                  />
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                    {customer.name}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm font-mono text-stone-500">
                <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-600 dark:text-stone-400">
                  ID: #{customer.internalid}
                </span>
                {isEditing && <span className="text-amber-600 font-bold flex items-center gap-1"><Edit2 size={10} /> Editing Mode</span>}
              </div>
            </div>
          </div>

          {/* Save Button (Header Location) */}
          {isEditing && (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95"
            >
              {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          )}
        </div>

        {/* --- BODY CONTENT --- */}
        <div className="p-8 space-y-8">
          <input type="hidden" name="internalid" value={customer.internalid} />

          {/* LOGO UPLOADER (Edit Mode Only) */}
          {isEditing && (
            <div className="p-6 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Select Existing Logo</label>
                <select
                  name="logo_url"
                  value={selectedLogo}
                  onChange={(e) => {
                    setSelectedLogo(e.target.value);
                    setLogoPreview(e.target.value);
                  }}
                  className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">-- No Logo --</option>
                  {allImages.map(img => (
                    <option key={img.internalid} value={img.url}>{img.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Upload New Logo</label>
                <div className="relative group">
                  <button type="button" className="flex items-center justify-center gap-2 w-full p-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-300 group-hover:border-amber-500 transition-colors">
                    <UploadCloud size={18} />
                    <span>{isUploading ? "Uploading..." : "Click to Upload"}</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQuickUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- FORM GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">

            {/* Section 1: Contact Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-stone-800 dark:text-white flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                <User className="text-amber-600" size={20} />
                Contact Information
              </h3>

              <div className="space-y-4">
                <Field
                  icon={<Mail size={16} />}
                  label="Email Address"
                  name="email"
                  placeholder="contact@company.com"
                  defaultValue={customer.email || ""} // Needs backend support
                  isEditing={isEditing}
                />
                <Field
                  icon={<Phone size={16} />}
                  label="Phone Number"
                  name="phone"
                  placeholder="(555) 123-4567"
                  defaultValue={customer.phone || ""} // Needs backend support
                  isEditing={isEditing}
                />
                <Field
                  icon={<Globe size={16} />}
                  label="Website"
                  name="website"
                  placeholder="https://..."
                  defaultValue={customer.website || ""} // Needs backend support
                  isEditing={isEditing}
                />
              </div>
            </div>

            {/* Section 2: Address & Details */}
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
                  defaultValue={customer.address || ""} // Needs backend support
                  isEditing={isEditing}
                />

                {/* Status Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={12} /> Status
                  </label>
                  {isEditing ? (
                    <select
                      name="status"
                      className="w-full p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="Active">Active</option>
                      <option value="Lead">Lead</option>
                      <option value="Archived">Archived</option>
                    </select>
                  ) : (
                    <div className="text-base font-medium text-stone-700 dark:text-stone-300 py-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Notes (Full Width) */}
            <div className="md:col-span-2 space-y-2 mt-2">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                <FileText size={14} /> Internal Notes
              </h3>
              {isEditing ? (
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Add internal notes about this client..."
                  className="w-full p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              ) : (
                <div className="p-4 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400 italic text-sm min-h-[100px]">
                  {customer.notes || "No notes available."}
                </div>
              )}
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}

// --- HELPER COMPONENT FOR CONSISTENT INPUTS ---
function Field({ label, icon, isEditing, value, placeholder, name, defaultValue }) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors group-focus-within:text-amber-600">
        {icon} {label}
      </label>
      {isEditing ? (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-stone-300"
        />
      ) : (
        <div className={`text-base font-medium py-1 border-b border-transparent ${!defaultValue ? 'text-stone-300 italic' : 'text-stone-700 dark:text-stone-300'}`}>
          {defaultValue || "Not provided"}
        </div>
      )}
    </div>
  );
}