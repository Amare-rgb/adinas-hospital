"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { DoctorFinder } from "@/components/DoctorFinder";
import { useLanguage } from "@/contexts/LanguageProvider";
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
  const [selectedLocation, setSelectedLocation] = useState<string>("Adinas General Hospital");

  // Single location - Adinas General Hospital
  const locationPillars = [
    {
      id: "Adinas General Hospital",
      nameKey: "hospital.name.full",
      descKey: "hospital.welcome.desc",
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <>
      {/* Navigation Header */}
      <Header />

      <main className="bg-gray-50 text-gray-800 min-h-screen">
        {/* ==========================================================================
           1. HERO / HEADER SECTION - SIMPLIFIED
           ========================================================================== */}
        <section className="relative bg-white border-b border-gray-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-[#2A3380] transition-colors">
                {t("nav.home")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-800 font-semibold">
                {t("nav.doctors")}
              </span>
            </nav>

            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A3380]/10 border border-[#2A3380]/20 text-[#2A3380] text-xs sm:text-sm font-semibold mb-4">
                <Users className="w-4 h-4" />
                <span>{t("doctors.hero.badge") || "Find a Doctor"}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4 sm:mb-6 leading-tight">
                {t("doctors.hero.title") || "Our Expert Doctors"}
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {t("doctors.hero.subtitle") || "Connect with experienced specialists across key medical disciplines."}
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           2. LOCATION BADGE
           ========================================================================== */}
        <section className="py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2">
             
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
           4. BOOKING & EMERGENCY QUICK CTA BANNER
           ========================================================================== */}
        <section className="bg-[#2A3380]/5 border-t border-gray-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Need Help Selecting a Specialist?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our medical receptionists and triage teams are ready 24/7 to guide you to the right doctor or clinic.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link
                href="/appointment"
                className="inline-flex items-center gap-2 bg-[#2A3380] hover:bg-[#1E3A8A] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>{t("cta.book_appointment") || "Book Appointment"}</span>
              </Link>
              <a
                href="tel:+251983201998"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-red-500" />
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