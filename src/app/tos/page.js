// app/tos/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Globe, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TermsOfService() {
  const [lang, setLang] = useState("fr"); // Default to FR
  const [mounted, setMounted] = useState(false);

  // --- 1. Auto-Detect Language on Mount ---
  useEffect(() => {
    setMounted(true);
    // Check browser language
    if (typeof window !== "undefined" && window.navigator) {
      const browserLang = window.navigator.language.toLowerCase();
      if (browserLang.startsWith("en")) {
        setLang("en");
      } else {
        setLang("fr");
      }
    }
  }, []);

  // Prevent hydration mismatch by not rendering language-dependent content until mounted
  if (!mounted) return <div className="min-h-screen bg-[#fdfaf6] dark:bg-stone-950" />;

  const t = content[lang];

  return (
    <div className="min-h-screen bg-[#fdfaf6] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-amber-500/30">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full bg-[#fdfaf6]/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Back Button */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-500 transition-colors"
          >
            <ArrowLeft size={16} />
            {lang === "en" ? "Back to Login" : "Retour à la connexion"}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full text-xs font-bold tracking-wide transition-all border border-stone-200 dark:border-stone-800"
          >
            <Globe size={14} />
            {lang === "en" ? "EN" : "FR"}
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        
        {/* Title Section */}
        <div className="mb-12 border-b border-stone-200 dark:border-stone-800 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-stone-900 dark:text-[#eaddcf] mb-4">
            {t.title}
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            {t.lastUpdated}: <span className="font-mono text-stone-700 dark:text-stone-300">{new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-CA')}</span>
          </p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-12 text-lg leading-relaxed text-stone-700 dark:text-stone-300">
          
          <Section title={t.section1_title}>
            <p>{t.section1_text}</p>
          </Section>

          <Section title={t.section2_title}>
            <p>{t.section2_text}</p>
            <ul className="list-disc pl-5 space-y-2 mt-4 marker:text-amber-500">
              {t.section2_list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={t.section3_title}>
            <p>{t.section3_text}</p>
          </Section>

          <Section title={t.section4_title}>
            <p>{t.section4_text}</p>
          </Section>

           {/* Contact Box */}
           <div className="mt-16 p-8 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
              <h3 className="text-xl font-bold mb-2 text-stone-900 dark:text-white">{t.contact_title}</h3>
              <p className="text-stone-600 dark:text-stone-400 mb-4">{t.contact_text}</p>
              <a href="mailto:support@wyattsoftware.com" className="text-amber-600 font-medium hover:underline">
                support@wyattsoftware.com
              </a>
           </div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-xs text-stone-400 dark:text-stone-600 border-t border-stone-200 dark:border-stone-800 bg-[#fdfaf6] dark:bg-stone-950">
        &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_COMPANY_NAME || "GLL App"}. {t.footer_rights}
      </footer>
    </div>
  );
}

// --- SUB-COMPONENT ---
function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-[#eaddcf] mb-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        {title}
      </h2>
      <div className="pl-5 border-l border-stone-200 dark:border-stone-800">
        {children}
      </div>
    </section>
  );
}

// --- CONTENT DICTIONARY ---
const content = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last Updated",
    section1_title: "Acceptance of Terms",
    section1_text: "By accessing and using this application, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.",
    section2_title: "Use of Service",
    section2_text: "You agree to use this application only for lawful purposes and in accordance with the following guidelines:",
    section2_list: [
      "Do not use the service for any illegal activities.",
      "Do not attempt to compromise the security of the application.",
      "Do not share your account credentials with unauthorized users.",
      "Respect the privacy and data of other users."
    ],
    section3_title: "Data & Privacy",
    section3_text: "We value your privacy. Your data is stored securely and is never sold to third parties. We use industry-standard encryption to protect your information. For full details, please refer to our Privacy Policy.",
    section4_title: "Termination",
    section4_text: "We reserve the right to suspend or terminate your access to the application at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users.",
    contact_title: "Questions?",
    contact_text: "If you have any questions about these Terms, please contact us.",
    footer_rights: "All rights reserved."
  },
  fr: {
    title: "Conditions d'Utilisation",
    lastUpdated: "Dernière mise à jour",
    section1_title: "Acceptation des Conditions",
    section1_text: "En accédant et en utilisant cette application, vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'acceptez pas une partie de ces conditions, vous ne pouvez pas utiliser nos services.",
    section2_title: "Utilisation du Service",
    section2_text: "Vous acceptez d'utiliser cette application uniquement à des fins légales et conformément aux directives suivantes :",
    section2_list: [
      "N'utilisez pas le service pour des activités illégales.",
      "Ne tentez pas de compromettre la sécurité de l'application.",
      "Ne partagez pas vos identifiants avec des utilisateurs non autorisés.",
      "Respectez la confidentialité et les données des autres utilisateurs."
    ],
    section3_title: "Données et Confidentialité",
    section3_text: "Nous tenons à votre vie privée. Vos données sont stockées en toute sécurité et ne sont jamais vendues à des tiers. Nous utilisons un cryptage standard pour protéger vos informations.",
    section4_title: "Résiliation",
    section4_text: "Nous nous réservons le droit de suspendre ou de résilier votre accès à l'application à notre seule discrétion, sans préavis, pour toute conduite que nous estimons violer ces Conditions d'Utilisation.",
    contact_title: "Des questions ?",
    contact_text: "Si vous avez des questions concernant ces conditions, veuillez nous contacter.",
    footer_rights: "Tous droits réservés."
  }
};