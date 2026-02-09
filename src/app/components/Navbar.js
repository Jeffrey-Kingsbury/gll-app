// components/Navbar.js
"use client";
import { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import { auth, googleProvider, signInWithPopup, signOut } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Navbar() {
  const { lang, setLang, t } = useSettings();
  const [user, setUser] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-medium">
              GLL
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
              Project Manager
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              className="px-3 py-2 text-sm font-semibold text-secondary-500 hover:text-primary-600 bg-secondary-50 hover:bg-primary-50 rounded-lg transition-all duration-200"
            >
              {lang === "en" ? "FR" : "EN"}
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-xl">
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-7 h-7 rounded-full border-2 border-white shadow-soft"
                  />
                  <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                    {user.displayName?.split(' ')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-medium hover:shadow-large transform hover:scale-105"
              >
                {t.login}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}