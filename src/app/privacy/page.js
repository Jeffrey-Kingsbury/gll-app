// app/privacy/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, ArrowLeft, ShieldCheck, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPolicy() {
  const [lang, setLang] = useState("fr"); // Default to FR
  const [mounted, setMounted] = useState(false);

  // --- 1. Auto-Detect Language on Mount ---
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.navigator) {
      const browserLang = window.navigator.language.toLowerCase();
      if (browserLang.startsWith("en")) {
        setLang("en");
      } else {
        setLang("fr");
      }
    }
  }, []);

  if (!mounted) return <div className="min-h-screen bg-stone-950" />;

  const t = content[lang];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500/30">

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full bg-[#fdfaf6]/80 bg-stone-950/80 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Back Button */}
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-amber-600 text-stone-400 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft size={16} />
            {lang === "en" ? "Back to Login" : "Retour à la connexion"}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-full text-xs font-bold tracking-wide transition-all border border-stone-800"
          >
            <Globe size={14} />
            {lang === "en" ? "EN" : "FR"}
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">

        {/* Title Section */}
        <div className="mb-12 border-b border-stone-800 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-stone-900 text-[#eaddcf] mb-4">
            {t.title}
          </h1>
          <p className="text-stone-400">
            {t.lastUpdated}: <span className="font-mono text-stone-300">{new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-CA')}</span>
          </p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-12 text-lg leading-relaxed text-stone-300">

          <Section title={t.collection_title} icon={<Database size={20} className="text-stone-400" />}>
            <p>{t.collection_text}</p>
            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-amber-500 text-base">
              {t.collection_list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={t.usage_title} icon={<Eye size={20} className="text-stone-400" />}>
            <p>{t.usage_text}</p>
          </Section>

          <Section title={t.security_title} icon={<Lock size={20} className="text-stone-400" />}>
            <p>{t.security_text}</p>
          </Section>

          <Section title={t.cookies_title} icon={<ShieldCheck size={20} className="text-stone-400" />}>
            <p>{t.cookies_text}</p>
          </Section>

          {/* Contact Box */}
          <div className="mt-16 p-8 bg-stone-900 rounded-2xl border border-stone-800">
            <h3 className="text-xl font-bold mb-2 text-white">{t.contact_title}</h3>
            <p className="text-stone-400 mb-4">{t.contact_text}</p>
            <a href="mailto:privacy@wyattsoftware.com" className="text-amber-600 font-medium hover:underline">
              privacy@wyattsoftware.com
            </a>
          </div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-xs text-stone-600 border-t border-stone-800 bg-stone-950">
        &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || "GLL App"}. {t.footer_rights}
      </footer>
    </div>
  );
}

// --- SUB-COMPONENT ---
function Section({ title, icon, children }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold text-stone-900 text-[#eaddcf] mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center">
          {icon}
        </div>
        {title}
      </h2>
      <div className="pl-11 border-l-2 border-stone-800 ml-4">
        {children}
      </div>
    </section>
  );
}

// --- CONTENT DICTIONARY ---
const content = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated",

    collection_title: "Information We Collect",
    collection_text: "We collect only the information necessary to provide our services efficiently. This includes:",
    collection_list: [
      "Account Information: Name and email address provided via Google Authentication.",
      "Usage Data: Logs of system access and file upload history.",
      "User Content: Files, documents, and images you upload to the platform."
    ],

    usage_title: "How We Use Your Information",
    usage_text: "We use the information we collect to operate, maintain, and improve our services. We do not sell your personal data to third parties. Your data is used strictly for internal business operations, project management, and ensuring the security of your account.",

    security_title: "Data Security",
    security_text: "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest.",

    cookies_title: "Cookies & Tracking",
    cookies_text: "We use essential cookies solely for authentication purposes to keep you logged in securely. We do not use third-party tracking cookies for advertising.",

    contact_title: "Privacy Concerns?",
    contact_text: "If you have any questions regarding your data privacy, please contact our Data Protection Officer.",
    footer_rights: "All rights reserved."
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour",

    collection_title: "Informations que nous collectons",
    collection_text: "Nous ne collectons que les informations nécessaires pour fournir nos services efficacement. Cela inclut :",
    collection_list: [
      "Informations de compte : Nom et adresse e-mail fournis via l'authentification Google.",
      "Données d'utilisation : Journaux d'accès au système et historique des téléchargements.",
      "Contenu utilisateur : Fichiers, documents et images que vous téléchargez sur la plateforme."
    ],

    usage_title: "Utilisation de vos informations",
    usage_text: "Nous utilisons les informations collectées pour exploiter, maintenir et améliorer nos services. Nous ne vendons pas vos données personnelles à des tiers. Vos données sont utilisées strictement pour les opérations commerciales internes et la sécurité de votre compte.",

    security_title: "Sécurité des données",
    security_text: "Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie pour protéger vos informations personnelles contre tout accès, modification, divulgation ou destruction non autorisés. Toutes les données sont cryptées lors du transfert et du stockage.",

    cookies_title: "Cookies et suivi",
    cookies_text: "Nous utilisons des cookies essentiels uniquement à des fins d'authentification pour maintenir votre connexion sécurisée. Nous n'utilisons pas de cookies de suivi tiers pour la publicité.",

    contact_title: "Questions de confidentialité ?",
    contact_text: "Si vous avez des questions concernant la confidentialité de vos données, veuillez contacter notre responsable de la protection des données.",
    footer_rights: "Tous droits réservés."
  }
};