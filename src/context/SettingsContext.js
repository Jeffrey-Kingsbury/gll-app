// context/SettingsContext.js
"use client";
import { createContext, useContext, useState } from "react";

const SettingsContext = createContext();

export const translations = {
  en: {
    welcome: "Welcome back",
    subtitle: "Sign in to GLL Project Manager",
    googleLogin: "Sign in with Google",
    emailPlaceholder: "name@company.com",
    passPlaceholder: "Password",
    forgotPass: "Forgot password?",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    footer: "© 2024 GLL. General Contractor Management.",
    login: "Login",
    logout: "Logout",
    // Dashboard Keys
    dashboard: "Dashboard",
    projects: "Projects",
    estimates: "Estimates",
    quotes: "Quotes",
    time: "Time Entries",
    quickActions: "Quick Actions",
    newProject: "New Project",
    newEstimate: "New Estimate",
    newQuote: "New Quote",
    logTime: "Log Time",
    activeProjects: "Active Projects",
    totalQuotes: "Total Quotes",
    hoursThisWeek: "Hours This Week",
    revenue: "Project Revenue",
    recentActivity: "Recent Activity",
  },
  fr: {
    welcome: "Bon retour",
    subtitle: "Connectez-vous au gestionnaire GLL",
    googleLogin: "Continuer avec Google",
    emailPlaceholder: "nom@entreprise.com",
    passPlaceholder: "Mot de passe",
    forgotPass: "Mot de passe oublié ?",
    signIn: "Se connecter",
    noAccount: "Pas de compte ?",
    signUp: "S'inscrire",
    footer: "© 2024 GLL. Gestion pour entrepreneurs généraux.",
    login: "Connexion",
    logout: "Déconnexion",
    // Dashboard Keys
    dashboard: "Tableau de bord",
    projects: "Projets",
    estimates: "Estimations",
    quotes: "Devis",
    time: "Feuilles de temps",
    quickActions: "Actions Rapides",
    newProject: "Nouveau Projet",
    newEstimate: "Nouvelle Est.",
    newQuote: "Nouveau Devis",
    logTime: "Saisir Temps",
    activeProjects: "Projets Actifs",
    totalQuotes: "Total Devis",
    hoursThisWeek: "Heures (Semaine)",
    revenue: "Revenus Projets",
    recentActivity: "Activité Récente",
  },
};

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState("en");

  const t = translations[lang];

  return (
    <SettingsContext.Provider value={{ lang, setLang, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}