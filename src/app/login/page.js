// app/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { useSettings } from "../../context/SettingsContext";
import { translations } from "../../context/translations";

// Firebase & Auth
import { auth, googleProvider, signInWithPopup } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Backend Logic
import { queryMySQL, mysql_getUserByGoogleId } from "../../context/mysqlConnection";

// Icons & UI
import { CheckCircle2, Globe, LayoutDashboard, Hammer } from "lucide-react";

export default function LoginPage() {
  // --- State & Hooks ---
  const { lang, setLang } = useSettings(); 
  const router = useRouter();
  
  // Select the correct language object from the external file
  const text = translations[lang] || translations.en;

  const [isLoading, setIsLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  // --- Logic: MySQL User Check ---
  async function checkUserInMySQL(googleId) {
    try {
      let existingUser = await mysql_getUserByGoogleId(googleId);
      return !!existingUser;
    } catch (error) {
      console.error("MySQL User Check Error:", error);
      return false;
    }
  }

  // --- Logic: Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoading(true);
        const exists = await checkUserInMySQL(currentUser.uid);
        
        if (exists) {
          router.push("/");
        } else {
          console.log("User does not exist in MySQL. Google ID: " + currentUser.uid);
          await signOut(auth);
          setIsLoading(false);
          alert(lang === 'fr' ? "Utilisateur non trouvé. Contactez le support." : "User not found. Please contact support.");
        }
      } else {
        setAuthChecking(false);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, lang]);

  // --- Logic: Handle Login Click ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      setIsLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen flex w-full bg-[#fdfaf6] dark:bg-stone-950">
      
      {/* LEFT SIDE: Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-12 text-stone-100">
        
        {/* Background Decor - Subtle, Structural, Warm */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay sepia-[0.3]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900/95 to-stone-800/90 z-10"></div>

        {/* Content Layer */}
        <div className="relative z-20 flex flex-col h-full justify-center items-start gap-6">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[#eaddcf]">
            {/* Logo Icon */}
                <img 
                src="/system/wyatt_logo.svg" 
                alt="Logo " 
                className="w-auto h-60 object-contain px-6"
              />
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight text-white">
              {text.slogan}
            </h1>
            <p className="text-[#d6cbbd] text-lg font-light leading-relaxed">
              {text.subSlogan}
            </p>
            
            <div className="space-y-4 pt-4">
              <FeatureItem text={text.feature1} />
              <FeatureItem text={text.feature2} />
              <FeatureItem text={text.feature3} />
            </div>
          </div>

          <div className="flex justify-between items-end text-sm text-stone-500 font-medium">
            <span>{text.copyright}</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Logic */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-[#fdfaf6] dark:bg-stone-950 transition-colors">
        
        {/* Language Toggle */}
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full text-xs font-bold tracking-wide transition-all border border-stone-200 dark:border-stone-800 shadow-sm"
          >
            <Globe size={14} />
            {lang === "en" ? "EN" : "FR"}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
               <img 
                src="/system/wyatt_logo.svg" 
                alt="Logo " 
                className="w-auto h-60 object-contain px-6"
              />
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-bold text-stone-900 dark:text-[#eaddcf] tracking-tight font-serif ">
                {process.env.NEXT_PUBLIC_COMPANY_NAME || ""}
              </h2>
              <p className="mt-3 text-stone-500 dark:text-stone-400">
                {text.subtitle}
              </p>
            </div>

            {/* Login Box */}
            <div className="mt-8 space-y-4">
              
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading || authChecking}
                className="group relative w-full flex items-center justify-center gap-3 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium py-4 px-4 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading || authChecking ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin"></div>
                    <span className="text-stone-500">{text.verifying}</span>
                  </div>
                ) : (
                  <>
                    <img 
                      src="https://www.svgrepo.com/show/475656/google-color.svg" 
                      alt="Google" 
                      className="w-5 h-5 group-hover:scale-110 transition-transform" 
                    />
                    <span>{text.googleLogin}</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-stone-400 mt-6">
                  {text.footer}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Component ---
function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      {/* Checkmark in Amber/Stone accent */}
      <div className="bg-amber-500/10 p-1 rounded-full">
        <CheckCircle2 size={16} className="text-amber-500" />
      </div>
      <span className="font-medium text-stone-200">{text}</span>
    </div>
  );
}