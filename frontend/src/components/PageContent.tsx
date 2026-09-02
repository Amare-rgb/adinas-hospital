// src/components/PageContent.tsx
"use client";

import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { GeneralSec } from "@/components/generalsec";
import { CardSection } from "@/components/CardSection";


export function PageContent() {
  return (
    <>
      <Header />
      <main>
        {/* ============================================================
            1. HERO SECTION - First
            ============================================================ */}
        <HeroSection />

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B3E0F2]/50 to-transparent dark:via-gray-700/50" />

        {/* ============================================================
            2. GENERAL HOSPITAL SECTION - Second
            Includes: "Adinas General Hospital" & "Why Choose Us"
            ============================================================ */}
        <GeneralSec />

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B3E0F2]/50 to-transparent dark:via-gray-700/50" />

        {/* ============================================================
            3. CARD SECTION - Third
            "Your trusted destination for compassionate care"
            ============================================================ */}
        <CardSection />

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B3E0F2]/50 to-transparent dark:via-gray-700/50" />

        {/* ============================================================
            4. OUR MEDICAL SERVICES - Fourth
            ============================================================ */}
    

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B3E0F2]/50 to-transparent dark:via-gray-700/50" />

        {/* Doctor Finder - Future section */}
      </main>
    </>
  );
}