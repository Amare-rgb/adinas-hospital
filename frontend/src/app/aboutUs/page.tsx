"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageProvider";
import { Header } from "@/components/Header";

import {
  Heart,
  Star,
  Shield,
  Lightbulb,
  Users,
  CheckCircle2,
  Eye,
  Target,
  ChevronRight,
  Building2,
  BookOpen,
} from "lucide-react";

// ============================================================
// SCROLL-IN-VIEW ANIMATION HOOK
// ============================================================
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ============================================================
// SECTION WRAPPER (scroll‑animated)
// ============================================================
function AnimatedSection({
  id,
  children,
  className = "",
  delay = 0,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      id={id}
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

// ============================================================
// MAIN ABOUT US PAGE
// ============================================================
export default function AboutUsPage() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("what-is-afilas");

  // Table of contents sections
  const tocSections = useMemo(
    () => [
      { id: "what-is-afilas", label: t("about.what_is_afilas"), icon: BookOpen },
      { id: "vision-mission", label: `${t("about.vision_title")} & ${t("about.mission_title")}`, icon: Eye },
      { id: "core-values", label: t("about.core_values_title"), icon: Star },
    ],
    [t]
  );

  // Core values data
  const coreValues = useMemo(
    () => [
      { 
        icon: Heart, 
        title: t("about.core_value_1_title"), 
        desc: t("about.core_value_1_desc"), 
        color: "text-rose-600",
        bgColor: "bg-rose-50"
      },
      { 
        icon: Star, 
        title: t("about.core_value_2_title"), 
        desc: t("about.core_value_2_desc"), 
        color: "text-amber-600",
        bgColor: "bg-amber-50"
      },
      { 
        icon: Shield, 
        title: t("about.core_value_3_title"), 
        desc: t("about.core_value_3_desc"), 
        color: "text-blue-600",
        bgColor: "bg-blue-50"
      },
      { 
        icon: Lightbulb, 
        title: t("about.core_value_4_title"), 
        desc: t("about.core_value_4_desc"), 
        color: "text-emerald-600",
        bgColor: "bg-emerald-50"
      },
      { 
        icon: Users, 
        title: t("about.core_value_5_title"), 
        desc: t("about.core_value_5_desc"), 
        color: "text-violet-600",
        bgColor: "bg-violet-50"
      },
      { 
        icon: CheckCircle2, 
        title: t("about.core_value_6_title"), 
        desc: t("about.core_value_6_desc"), 
        color: "text-cyan-600",
        bgColor: "bg-cyan-50"
      },
    ],
    [t]
  );

  // Intersection observer for active TOC tracking
  useEffect(() => {
    const sectionIds = tocSections.map((s) => s.id);
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [tocSections]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* ================= HERO / TITLE ================= - REMOVED GAP */}
        <section className="relative pt-28 pb-12 bg-white border-b border-gray-200 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2A3380]/10 text-[#2A3380] text-xs font-semibold uppercase tracking-wider border border-[#2A3380]/20 mb-6">
              <Building2 className="w-3.5 h-3.5" />
              <span>Adinas Group</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {t("about.page_title")}
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              {t("about.meaning_text")}
            </p>

            {/* REMOVED: Quick stats section (Established, Meaning, Divisions) */}
          </div>
        </section>

        {/* ================= MAIN CONTENT + TOC LAYOUT ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex gap-10 xl:gap-16 relative">
            {/* ---- Sticky Table of Contents (Desktop sidebar) ---- */}
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
              <nav className="sticky top-32 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 px-3">
                  {t("about.toc_title")}
                </h3>
                {tocSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        activeSection === section.id
                          ? "bg-[#2A3380]/10 text-[#2A3380] border-l-2 border-[#2A3380]"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 border-l-2 border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        activeSection === section.id
                          ? "text-[#2A3380]"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`} />
                      <span className="truncate">{section.label}</span>
                    </a>
                  );
                })}
              </nav>
            </aside>

            {/* ---- Main content column ---- */}
            <div className="flex-1 min-w-0 space-y-16 sm:space-y-20">
              {/* ================= WHAT IS ADINAS ================= */}
              <AnimatedSection id="what-is-afilas" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#2A3380]/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#2A3380]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {t("about.what_is_afilas")}
                  </h2>
                </div>

                <div className="space-y-5 text-base leading-relaxed text-gray-600">
                  <p>{t("about.what_is_afilas_p1")}</p>
                  <p>{t("about.what_is_afilas_p2")}</p>
                  <p>{t("about.what_is_afilas_p3")}</p>
                </div>

                {/* Timeline badges */}
                <div className="mt-8 grid sm:grid-cols-3 gap-4">
                  {[
                    { year: "2017", label: "Adinas Founded", desc: "Health Science Scholars" },
                    { year: "2018", label: "Hospital Opened", desc: "Adinas General Hospital" },
                    { year: "2022–2026", label: "Pharma & Diagnostics", desc: "APW & Diagnosis Center" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="relative p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#2A3380]/30 transition-all group"
                    >
                      <span className="text-3xl font-black text-[#2A3380]/10 absolute top-3 right-4 group-hover:text-[#2A3380]/20 transition-colors">
                        {item.year}
                      </span>
                      <p className="text-sm font-bold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              {/* ================= VISION & MISSION ================= */}
              <AnimatedSection id="vision-mission" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#2A3380]/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-[#2A3380]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {t("about.vision_title")} & {t("about.mission_title")}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Vision Card */}
                  <div className="relative p-8 rounded-3xl bg-[#2A3380] text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                        <Eye className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{t("about.vision_title")}</h3>
                      <p className="text-white/85 leading-relaxed text-sm">
                        {t("about.vision_text")}
                      </p>
                    </div>
                  </div>

                  {/* Mission Card */}
                  <div className="relative p-8 rounded-3xl bg-white border border-gray-200 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#2A3380]/5 blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-[#2A3380]/10 flex items-center justify-center mb-5">
                        <Target className="w-6 h-6 text-[#2A3380]" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{t("about.mission_title")}</h3>
                      <ul className="space-y-3">
                        {[
                          t("about.mission_1"),
                          t("about.mission_2"),
                          t("about.mission_3"),
                          t("about.mission_4"),
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <ChevronRight className="w-4 h-4 text-[#2A3380] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* ================= CORE VALUES ================= */}
              <AnimatedSection id="core-values" className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#2A3380]/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-[#2A3380]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {t("about.core_values_title")}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {coreValues.map((value, idx) => {
                    const Icon = value.icon;
                    return (
                      <div
                        key={idx}
                        className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#2A3380]/30 hover:shadow-md transition-all duration-300"
                      >
                        <div className={`w-11 h-11 rounded-xl ${value.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 ${value.color}`} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">
                          {value.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {value.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </main>

      
    </div>
  );
}