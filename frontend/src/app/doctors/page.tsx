"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { DoctorFinder } from "@/components/DoctorFinder";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useTheme } from "@/contexts/ThemeProvider"; // ✅ Added theme import
import { 
  Users, 
  ChevronRight, 
  Building2, 
  CheckCircle2,
  Calendar,
  PhoneCall
} from "lucide-react";

export default function DoctorsPage() {
  const { t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  const [selectedLocation, setSelectedLocation] = useState<string>("Adinas General Hospital");

  // Single location - Adinas General Hospital - With dark mode support
  const locationPillars = [
    {
      id: "Adinas General Hospital",
      nameKey: "hospital.name.full",
      descKey: "hospital.welcome.desc",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    },
  ];

  return (
    <>
      {/* Navigation Header */}
      <Header />

      <main className={`transition-colors duration-300 min-h-screen
        ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
        
        {/* ==========================================================================
           1. HERO / HEADER SECTION - With dark mode support
           ========================================================================== */}
        <section className={`relative border-b transition-colors duration-300 py-12 sm:py-16 px-4 sm:px-6 lg:px-8
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb - With dark mode support */}
            <nav className={`flex items-center space-x-2 text-xs sm:text-sm mb-6 transition-colors duration-300
              ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Link href="/" className={`transition-colors ${isDark ? 'hover:text-[#4A5BCC]' : 'hover:text-[#2A3380]'}`}>
                {t("nav.home")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {t("nav.doctors")}
              </span>
            </nav>

            {/* Hero Header - With dark mode support */}
            <div className="text-center max-w-3xl mx-auto">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 border transition-colors duration-300
                ${isDark 
                  ? 'bg-[#4A5BCC]/20 border-[#4A5BCC]/30 text-[#4A5BCC]' 
                  : 'bg-[#2A3380]/10 border-[#2A3380]/20 text-[#2A3380]'}`}>
                <Users className="w-4 h-4" />
                <span>{t("doctors.hero.badge") || "Find a Doctor"}</span>
              </div>

              <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight transition-colors duration-300
                ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t("doctors.hero.title") || "Our Expert Doctors"}
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t("doctors.hero.subtitle") || "Connect with experienced specialists across key medical disciplines."}
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           2. LOCATION BADGE - With dark mode support
           ========================================================================== */}
        <section className={`py-4 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-300
          ${isDark 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-gray-50 border-gray-200'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              {/* Empty - kept for structure */}
            </div>
          </div>
        </section>

        {/* ==========================================================================
           3. DOCTOR FINDER COMPONENT
           ========================================================================== */}
        <DoctorFinder 
          selectedLocation={selectedLocation} 
          showHeader={false} 
        />

        {/* ==========================================================================
           4. BOOKING & EMERGENCY QUICK CTA BANNER - With dark mode support
           ========================================================================== */}
        <section className={`border-t transition-colors duration-300 py-12 sm:py-16 px-4 sm:px-6 lg:px-8
          ${isDark 
            ? 'bg-[#4A5BCC]/5 border-gray-700' 
            : 'bg-[#2A3380]/5 border-gray-200'}`}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="max-w-xl">
              <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300
                ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Need Help Selecting a Specialist?
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Our medical receptionists and triage teams are ready 24/7 to guide you to the right doctor or clinic.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link
                href="/appointment"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 text-white
                  ${isDark 
                    ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                    : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t("cta.book_appointment") || "Book Appointment"}</span>
              </Link>
              <a
                href="tel:+251983201998"
                className={`inline-flex items-center gap-2 border px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95
                  ${isDark 
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <PhoneCall className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span>{t("cta.emergency_call") || "Emergency Call"}</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      
    </>
  );
}