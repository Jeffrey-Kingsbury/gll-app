// app/dashboard/layout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase"; 
import { useSettings } from "../../context/SettingsContext";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Calculator, 
  FileText, 
  Clock, 
  LogOut, 
  Menu, 
  X,
  Users,
  FolderOpen,
  Hammer,
  Globe,
  Settings
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useSettings();

  // --- 1. CONFIGURATION ---
  // We define the metadata for every major section here.
  const navItems = [
    { 
      href: "/", 
      exact: true, // Only match exactly "/dashboard"
      label: t.dashboard || "Dashboard", 
      subtitle: "Overview of your business performance",
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      href: "/customers", 
      label: t.customers || "Customers", 
      subtitle: "Manage your client database & contacts",
      icon: <Users size={20} /> 
    },
    { 
      href: "/documents", 
      label: t.documents || "Documents", 
      subtitle: "Project files, blueprints, and assets",
      icon: <FolderOpen size={20} /> 
    },
    { 
      href: "/projects", 
      label: t.projects || "Projects", 
      subtitle: "Track active jobs and timelines",
      icon: <FolderKanban size={20} /> 
    },
    { 
      href: "/estimates", 
      label: t.estimates || "Estimates", 
      subtitle: "Create and send project bids",
      icon: <Calculator size={20} /> 
    },
    { 
      href: "/quotes", 
      label: t.quotes || "Quotes", 
      subtitle: "Review pending client contracts",
      icon: <FileText size={20} /> 
    },
    { 
      href: "/time", 
      label: t.time || "Time Entries", 
      subtitle: "Log employee hours and shifts",
      icon: <Clock size={20} /> 
    },
  ];

  // --- 2. LOGIC: FIND ACTIVE PAGE ---
  const getPageDetails = () => {
    // A. Sort by length desc (so /dashboard/customers matches before /dashboard)
    const sortedItems = [...navItems].sort((a, b) => b.href.length - a.href.length);
    
    // B. Find the first item where the current pathname starts with its href
    const active = sortedItems.find(item => {
      if (item.exact) return pathname === item.href;
      return pathname.startsWith(item.href);
    });

    // C. Default fallback if nothing matches
    return active || {
      label: "Wyatt",
      subtitle: "Build better. Manage smarter.",
      icon: <Hammer size={20} />
    };
  };

  const activePage = getPageDetails();


  // --- 3. AUTH & EFFECTS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login"); 
        return;
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fdfaf6]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="text-stone-500 font-medium animate-pulse">Wyatt is loading...</p>
      </div>
    </div>
  );

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#fdfaf6] dark:bg-stone-950 font-sans text-stone-900">
      
      {/* MOBILE HEADER (< lg) */}
      <div className="lg:hidden fixed top-0 w-full bg-stone-900 text-[#eaddcf] z-50 px-4 py-3 flex items-center justify-between shadow-md">
        <span className="font-bold text-xl tracking-tight flex items-center gap-2">
          <Hammer size={18} /> Wyatt
        </span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#eaddcf]">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-stone-900 text-stone-400 transform transition-transform duration-200 ease-in-out border-r border-stone-800 flex flex-col
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3 text-[#eaddcf] font-bold text-xl tracking-tight">

                <img 
                src="/system/wyatt_logo.svg" 
                alt="Logo " 
                className="w-auto object-contain h-full px-6"
              />
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            // Check active state
            const isActive = activePage.href === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? "bg-[#eaddcf] text-stone-900 shadow-sm" 
                    : "text-stone-400 hover:bg-stone-800 hover:text-[#eaddcf]"
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={isActive ? "text-stone-800" : "text-stone-500 group-hover:text-[#eaddcf]"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/50 shrink-0">
          {user && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[#eaddcf] text-xs font-bold">
                {user.displayName ? user.displayName.charAt(0) : "U"}
              </div>
              <div className="min-w-0">
                <div className="text-[#eaddcf] font-medium text-sm truncate">{user.displayName}</div>
                <div className="text-xs text-stone-500 truncate">{user.email}</div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-2 text-red-400 hover:text-red-300 w-full text-sm font-medium hover:bg-red-900/10 py-2 rounded-lg bg-red-900/20 transition-all duration-200 text-center"
          >
            <LogOut size={18} />
            {t.logout || "Logout"}
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/80 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pt-14 lg:pt-0">
        
        {/* --- DYNAMIC HEADER (Desktop) --- */}
        <header className="h-20 bg-[#fdfaf6] dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 hidden lg:flex items-center justify-between px-8 shrink-0">
          
          {/* Left: Dynamic Page Info */}
          <div className="flex items-center gap-4">
            {/* The Icon Box */}
            <div className="w-10 h-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400 shadow-sm">
              {activePage.icon}
            </div>
            
            {/* The Title & Subtitle */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-stone-900 dark:text-[#eaddcf] font-serif leading-tight">
                {activePage.label}
              </h1>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {activePage.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-full transition-all uppercase tracking-wide border border-stone-200"
            >
              <Globe size={14} />
              {lang === "en" ? "EN" : "FR"}
            </button>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}