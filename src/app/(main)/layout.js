// app/(main)/layout.js
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Folder,
  Calculator,
  LogOut,
  ChevronLeft,
  Palette,
  Type,
  FileInput,
  ShieldCheck,
  Sliders,
  Menu,
  X,
  Database,
  Building2, // Icon for Company Setup
  UserCheck  // Icon for Employees
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useSettings } from "../../context/SettingsContext";

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode } = useSettings();

  const [sidebarMode, setSidebarMode] = useState("main");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const mainMenuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Customers", href: "/customers/", icon: Users },
    { name: "Documents", href: "/documents/", icon: Folder },
    { name: "Estimates", href: "/estimates/", icon: Calculator },
  ];

  const customizationMenuItems = [
    { name: "Templates", href: "/customizations/templates/", icon: Palette },
    { name: "Fields", href: "/customizations/fields/", icon: Type },
    { name: "Forms", href: "/customizations/forms/", icon: FileInput },
    { name: "Roles & Permissions", href: "/customizations/roles/", icon: ShieldCheck },
    { name: "SQL utility", href: "/customizations/sqlutil/", icon: Database },
  ];

  // --- NEW: Company Setup Menu Items ---
  const companyMenuItems = [
    { name: "Employees", href: "/company/employees/", icon: UserCheck },
    // You can add "Departments" or "Offices" here later
  ];

  const getPageTitle = () => {
    const mainMatch = mainMenuItems.find(item => 
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    );
    if (mainMatch) return mainMatch.name;

    const customMatch = customizationMenuItems.find(item => pathname.startsWith(item.href));
    if (customMatch) return customMatch.name;

    const companyMatch = companyMenuItems.find(item => pathname.startsWith(item.href));
    if (companyMatch) return companyMatch.name;

    return "Wyatt";
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] dark:bg-stone-950 transition-colors duration-300">
      {/* --- MOBILE HEADER --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-stone-900 border-b border-stone-800 z-50 flex items-center px-4 text-stone-100 shadow-md">
        <button onClick={() => setIsMobileOpen(true)} className="p-2 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-colors z-10 relative">
          <Menu size={24} />
        </button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="font-bold text-lg tracking-tight text-stone-100">{getPageTitle()}</span>
        </div>
      </header>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 flex flex-col shadow-2xl border-r border-stone-800 transition-transform duration-300 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:shadow-none`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-stone-800 bg-stone-950/50">
          <div className="flex items-center justify-center gap-2 w-full">
            <img src="/system/wyatt_logo.svg" alt="Wyatt" className="h-10 w-auto object-contain" />
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-1 text-stone-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* MAIN MENU */}
          {sidebarMode === "main" && (
            <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
              {mainMenuItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-amber-600 text-white font-medium shadow-lg shadow-amber-900/20" : "hover:bg-stone-800 hover:text-white"}`}>
                    <item.icon size={20} className={isActive ? "text-white" : "text-stone-500 group-hover:text-amber-500 transition-colors"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="my-4 border-t border-stone-800/50 mx-2"></div>

              {/* Company Setup Toggle */}
              <button onClick={() => setSidebarMode("company")} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-stone-800 hover:text-white ${pathname.includes("/company") ? "text-amber-500 font-medium" : "text-stone-300"}`}>
                <div className="flex items-center gap-3">
                  <Building2 size={20} className="text-stone-500 group-hover:text-amber-500 transition-colors" />
                  <span>Company Setup</span>
                </div>
                <ChevronLeft size={16} className="rotate-180 text-stone-600 group-hover:text-stone-400" />
              </button>

              <button onClick={() => setSidebarMode("customizations")} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-stone-800 hover:text-white ${pathname.includes("/customizations") ? "text-amber-500 font-medium" : "text-stone-300"}`}>
                <div className="flex items-center gap-3">
                  <Sliders size={20} className="text-stone-500 group-hover:text-amber-500 transition-colors" />
                  <span>Customizations</span>
                </div>
                <ChevronLeft size={16} className="rotate-180 text-stone-600 group-hover:text-stone-400" />
              </button>
            </div>
          )}

          {/* COMPANY SETUP MENU */}
          {sidebarMode === "company" && (
            <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setSidebarMode("main")} className="w-full flex items-center gap-2 px-4 py-3 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-all mb-4">
                <ChevronLeft size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Back</span>
              </button>

              <div className="px-4 pb-2 text-xs font-semibold text-stone-500 uppercase tracking-widest">Company Setup</div>
              {companyMenuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-stone-800 text-amber-500 font-medium border-l-4 border-amber-500" : "hover:bg-stone-800 hover:text-white border-l-4 border-transparent"}`}>
                    <item.icon size={18} className={isActive ? "text-amber-500" : "text-stone-500 group-hover:text-amber-500 transition-colors"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* CUSTOMIZATIONS MENU */}
          {sidebarMode === "customizations" && (
            <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setSidebarMode("main")} className="w-full flex items-center gap-2 px-4 py-3 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-all mb-4">
                <ChevronLeft size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Back</span>
              </button>
              <div className="px-4 pb-2 text-xs font-semibold text-stone-500 uppercase tracking-widest">Customizations</div>
              {customizationMenuItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? "bg-stone-800 text-amber-500 font-medium border-l-4 border-amber-500" : "hover:bg-stone-800 hover:text-white border-l-4 border-transparent"}`}>
                    <item.icon size={18} className={isActive ? "text-amber-500" : "text-stone-500 group-hover:text-amber-500 transition-colors"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-stone-800 bg-stone-950/30">
          <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-3 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}