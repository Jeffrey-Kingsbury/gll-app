// app/page.js
"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation"; 
import { queryMySQL, mysql_getUserByGoogleId } from "../context/mysqlConnection";

export default function LoginPage() {
  const { lang, setLang, t } = useSettings();
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [mysqlData, setMysqlData] = useState(null);
  
  // Fetch some data from MySQL on component mount (for demonstration)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await queryMySQL("SELECT * FROM test_data");
        console.log("RESULTS" + JSON.stringify(results));
        setMysqlData(results);
      } catch (error) {
        console.error("MySQL Error:", error);
      }
    };
    fetchData();
  }, []);

  async function checkUserInMySQL(googleId) {
    try {
      let existingUser = await mysql_getUserByGoogleId(googleId);
      if (!existingUser) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error("MySQL User Check Error:", error);
    }
  }

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // --- REDIRECT LOGIC ---
        checkUserInMySQL(currentUser.uid).then((exists) => {
          if (exists) {
            router.push("/dashboard");
          } else {
            // Handle case where user does not exist in MySQL
            console.log("User does not exist in MySQL");
            console.log("Google ID: " + currentUser.uid);
            // logout the user
            auth.signOut().then(() => {
              //router.push("/");
              alert("User not found in database. Please contact support.");
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // The useEffect above will handle the redirect automatically 
      // once the auth state changes to 'logged in'
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
      </div>

      {/* Top Right Controls (Lang) */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => setLang(lang === "en" ? "fr" : "en")}
          className="px-4 py-2 bg-white/80 backdrop-blur-md text-sm font-semibold text-secondary-600 hover:text-primary-600 hover:bg-white/90 rounded-xl shadow-soft transition-all duration-200 border border-gray-100"
        >
          {lang === "en" ? "FR" : "EN"}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-large overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="px-8 pt-12 pb-8 text-center">
          <div className="mb-8 flex justify-center">
             {/* Logo */}
             <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-large transform hover:scale-105 transition-all duration-300">
               GLL
             </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
            {t.welcome}
          </h1>
          <p className="text-secondary-500 text-base">
            {t.subtitle}
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-12">
          <div className="space-y-6">
            
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-primary-200 text-gray-700 font-semibold py-4 rounded-2xl transition-all duration-200 group shadow-medium hover:shadow-large transform hover:scale-102"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  className="text-blue-500"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  className="text-green-500"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  className="text-yellow-500"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  className="text-red-500"
                />
              </svg>
              <span>{t.googleLogin}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Simple Footer */}
      <div className="mt-8 text-sm text-secondary-400 bg-white/50 px-4 py-2 rounded-full backdrop-blur-md">
        {t.footer}
      </div>
    </div>
  );
}