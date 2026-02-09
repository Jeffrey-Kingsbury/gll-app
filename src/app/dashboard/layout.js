// app/dashboard/layout.js
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signOut } from "../../lib/firebase"; // Adjust path if needed
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
  Folder
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { t, lang, setLang } = useSettings();

  // Auth Protection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/"); // Redirect to login if not authenticated
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary-500 rounded-xl animate-pulse mb-4 mx-auto"></div>
        <p className="text-secondary-500 font-medium">Loading...</p>
      </div>
    </div>
  );

  const navItems = [
    { label: t.dashboard, icon: <LayoutDashboard size={20} />, href: "/dashboard" },
    { label: "Customers", icon: <Users size={20} />, href: "/dashboard/customers" },
    { label: "Documents", icon: <Folder size={20} />, href: "/dashboard/documents" },
    { label: t.projects, icon: <FolderKanban size={20} />, href: "/dashboard/projects" },
    { label: t.estimates, icon: <Calculator size={20} />, href: "/dashboard/estimates" },
    { label: t.quotes, icon: <FileText size={20} />, href: "/dashboard/quotes" },
    { label: t.time, icon: <Clock size={20} />, href: "/dashboard/time" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-accent-50/30 flex">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-gray-100 shadow-large transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white/50">
          <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-medium mr-3">
            GLL
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</span>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-secondary-600 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
          >
            <span className="group-hover:scale-110 transition-transform duration-200">
              <LogOut size={20} />
            </span>
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shadow-soft">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-secondary-600 hover:bg-secondary-100 rounded-xl transition-all duration-200"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
             {/* Language */}
             <button
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              className="px-3 py-2 text-sm font-semibold text-secondary-500 hover:text-primary-600 bg-secondary-50 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              {lang === "en" ? "FR" : "EN"}
            </button>

            {/* User Avatar */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 bg-secondary-50 rounded-xl">
                <img 
                  src={user.photoURL} 
                  alt="User" 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-soft" 
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}