"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Globe, AlertCircle } from "lucide-react";

// --- FIXED IMPORTS ---
import { useSettings } from "@/context/SettingsContext";
import { translations } from "@/context/translations";
import { signIn } from "@/lib/auth-client";
// checkUserExistsAction is no longer strictly needed here as the hook handles it, 
// but keeping it if you have other logic relies on it.

// --- FULL-SCREEN TRIANGULAR MESH COMPONENT (Unchanged) ---
const TriangleMeshCanvas = ({ variant = "desktop" }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isHoveringRef = useRef(false);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let time = 0;
    let currentHoverStrength = 0;

    const isMobile = variant === "mobile";

    const config = {
      particleGap: isMobile ? 70 : 100,
      connectionDistance: isMobile ? 110 : 160,
      interactionRadius: 300,
      baseSpeed: 0.002,
      baseColor: isMobile ? "rgba(175, 169, 165, 0.4)" : "rgba(87, 83, 78, 0.15)",
      strokeColorMobile: "rgba(120, 113, 108, 0.4)"
    };

    const initParticles = () => {
      particlesRef.current = [];
      const cols = Math.ceil(canvas.width / config.particleGap) + 2;
      const rows = Math.ceil(canvas.height / config.particleGap) + 2;

      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          particlesRef.current.push({
            baseX: i * config.particleGap + (Math.random() * 20),
            baseY: j * config.particleGap + (Math.random() * 20),
            x: 0, y: 0,
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            speedX: (Math.random() * 0.5 + 0.5) * config.baseSpeed,
            speedY: (Math.random() * 0.5 + 0.5) * config.baseSpeed,
          });
        }
      }
    };

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        initParticles();
      }
    };
    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e) => {
      if (isMobile) return;
      const rect = canvas.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      isHoveringRef.current = isOver;
      if (isOver) {
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    };

    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    const render = () => {
      if (!canvas.offsetParent) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 1.5;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (!isMobile) {
        const targetStrength = isHoveringRef.current ? 1 : 0;
        currentHoverStrength += (targetStrength - currentHoverStrength) * 0.1;
        if (currentHoverStrength < 0.001) currentHoverStrength = 0;
      }

      particlesRef.current.forEach(p => {
        let targetX = p.baseX + Math.sin(time * p.speedX + p.phaseX) * 20;
        let targetY = p.baseY + Math.cos(time * p.speedY + p.phaseY) * 20;

        if (!isMobile && currentHoverStrength > 0) {
          const dx = mx - targetX;
          const dy = my - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.interactionRadius) {
            const repulsion = (1 - dist / config.interactionRadius) * 30 * currentHoverStrength;
            targetX -= (dx / dist) * repulsion;
            targetY -= (dy / dist) * repulsion;
          }
        }
        p.x = targetX;
        p.y = targetY;
      });

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p1 = particlesRef.current[i];
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.connectionDistance) {
            let strokeColor, lineWidth, shadowBlur;

            if (isMobile) {
              const baseOpacity = 1 - (dist / config.connectionDistance);
              strokeColor = `rgba(120, 113, 108, ${baseOpacity * 1})`;
              lineWidth = 0.7;
              shadowBlur = 0;
            } else {
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              const mouseDist = Math.sqrt((mx - midX) ** 2 + (my - midY) ** 2);

              let glowIntensity = 0;
              if (mouseDist < config.interactionRadius) {
                glowIntensity = Math.pow(1 - (mouseDist / config.interactionRadius), 2);
              }
              const finalGlow = glowIntensity * currentHoverStrength;

              if (finalGlow > 0.01) {
                strokeColor = `hsla(35, 100%, 60%, ${0.1 + (finalGlow * 0.4)})`;
                lineWidth = 0.7 + (finalGlow * 1.5);
                shadowBlur = finalGlow * 20;
              } else {
                const baseOpacity = 1 - (dist / config.connectionDistance);
                strokeColor = `hsla(35, 100%, 60%, ${baseOpacity * .8})`;
                lineWidth = 0.5;
                shadowBlur = 0;
              }
            }

            ctx.beginPath();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = !isMobile ? "rgba(245, 158, 11, 0.8)" : "transparent";
            ctx.shadowBlur = shadowBlur;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (!isMobile) window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

// --- EXTRACTED COMPONENT: Form Content with Params Logic ---
function LoginFormContent() {
  const { lang } = useSettings();
  const text = translations[lang] || translations.en;
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams(); // Hook to read ?error=...

  // Logic to detect error params
  const errorType = searchParams.get("error");
  const errorMessage = errorType === "unauthorized"
    ? (lang === 'fr' ? "Accès refusé" : "Access Denied")
    : null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/" // Redirect to root (Dashboard) after login
      });
    } catch (error) {
      console.error("Login Error:", error);
      setIsLoading(false);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="lg:hidden flex justify-center mb-8">
        <img src="/system/wyatt_logo.svg" draggable='false' alt="Logo" className="w-auto h-60 object-contain px-6 drop-shadow-xl" />
      </div>

      <div className="text-center space-y-4">
        {/* --- ERROR BANNER START --- */}
        {errorMessage && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2 shadow-sm">
            <span className="flex items-center justify-center gap-2 text-center w-full">
              <AlertCircle size={18} className="shrink-0" />
              {errorMessage}
            </span>
          </div>
        )}
        {/* --- ERROR BANNER END --- */}

        <h2 className="text-3xl font-bold text-stone-100 lg:text-stone-900 dark:text-[#eaddcf] tracking-tight font-serif ">
          {process.env.NEXT_PUBLIC_COMPANY_NAME || "Wyatt"}
        </h2>
        <p className="mt-3 text-stone-300 lg:text-stone-600 dark:text-stone-400 font-medium">{text.subtitle}</p>
      </div>

      <div className="mt-8 space-y-4">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="group relative w-full flex items-center justify-center gap-3 bg-white/90 lg:bg-white dark:bg-stone-900/90 dark:lg:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium py-4 px-4 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed backdrop-blur-sm"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin"></div>
              <span className="text-stone-500">Connecting...</span>
            </div>
          ) : (
            <>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{text.googleLogin}</span>
            </>
          )}
        </button>
        <div className="text-center">
          <p className="text-xs text-stone-400 mt-6">
            {text.footer} <a href="/tos" className="underline text-amber-600">{text.tos}</a> {text.tosAnd} <a href="/privacy" className="underline text-amber-600">{text.privacy}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function LoginPage() {
  const { lang, setLang } = useSettings();
  const text = translations[lang] || translations.en;

  return (
    <div className="min-h-screen flex w-full relative bg-[#fdfaf6] dark:bg-stone-950">

      {/* MOBILE BACKGROUND */}
      <div className="absolute inset-0 block lg:hidden z-0 overflow-hidden pointer-events-auto bg-stone-950">
        <TriangleMeshCanvas variant="mobile" />
      </div>

      {/* LEFT SIDE (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-stone-900 relative overflow-hidden flex-col justify-between p-12 text-stone-100 z-10">
        {/* Background Layers */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay sepia-[0.3] z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900/95 to-stone-800/90 z-10"></div>

        {/* Mesh Layer */}
        <div className="absolute inset-0 z-10 opacity-70 mix-blend-plus-lighter pointer-events-auto">
          <TriangleMeshCanvas variant="desktop" />
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col h-full justify-between items-center gap-6 mt-6 select-none pointer-events-none">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[#eaddcf]">
            <img src="/system/wyatt_logo.svg" alt="Logo" draggable="false" className="w-auto h-40 object-contain px-6 drop-shadow-2xl" />
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">{text.slogan}</h1>
            <p className="text-[#d6cbbd] text-lg font-light leading-relaxed drop-shadow-md">{text.subSlogan}</p>
            <div className="space-y-4 pt-4">
              <FeatureItem text={text.feature1} />
              <FeatureItem text={text.feature2} />
              <FeatureItem text={text.feature3} />
            </div>
          </div>

          <div className="flex justify-between items-end text-sm text-stone-500 font-medium w-full">
            <span className="flex gap-2">{text.copyright}
              <span className="flex gap-1">
                <img src="/system/maple_leaf.png" alt="Maple leaf" draggable="false" className="w-auto h-4 object-contain drop-shadow-2xl" />
                Proudly Canadian
              </span>
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Login Form) */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-transparent lg:bg-[#fdfaf6] dark:lg:bg-stone-950 transition-colors z-10">

        {/* Language Toggle */}
        <div className="absolute top-6 right-6 z-30">
          <button onClick={() => setLang(lang === "en" ? "fr" : "en")} className="flex items-center gap-2 px-4 py-2 bg-white/80 lg:bg-white dark:bg-stone-900/80 dark:lg:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full text-xs font-bold tracking-wide transition-all border border-stone-200 dark:border-stone-800 shadow-sm backdrop-blur-sm">
            <Globe size={14} /> {lang === "en" ? "EN" : "FR"}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          {/* SUSPENSE WRAPPER (Required for reading URL Search Params) */}
          <Suspense fallback={<div className="text-stone-400">Loading form...</div>}>
            <LoginFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-amber-500/10 p-1 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
        <CheckCircle2 size={16} className="text-amber-500" />
      </div>
      <span className="font-medium text-stone-200 drop-shadow-sm">{text}</span>
    </div>
  );
}