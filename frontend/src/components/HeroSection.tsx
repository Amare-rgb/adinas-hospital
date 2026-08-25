"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageProvider";
import { Calendar, ArrowRight } from "lucide-react";

// ============================================================
// CONFIGURATION – Image & Video files (must be in /public folder)
// ============================================================
// First frame image
const HERO_VIDEOS = [
  "/adinas.mp4", // Video 1
  "/adinas2.mp4", // Video 2
];

// ============================================================
// HERO SECTION COMPONENT
// ============================================================
export function HeroSection() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Intersection Observer for viewport detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Initial load animation
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // ============================================================
  // VIDEO & IMAGE TRANSITION LOGIC
  // ============================================================
  
  // Step 1: Show the static image for a moment, then fade to video
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setIsVideoReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isVisible]);

  // Step 2: Handle video end to swap to next video in playlist
  const handleVideoEnded = useCallback(() => {
    setCurrentVideoIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % HERO_VIDEOS.length;
      return nextIndex;
    });
  }, []);

  // Step 3: When video index changes, reload the new video
  useEffect(() => {
    if (videoRef.current && isVideoReady) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked; we handle silently
      });
    }
  }, [currentVideoIndex, isVideoReady]);

  // Determine overlay opacity based on theme
  const isDark = theme === "dark";
  const overlayOpacity = isDark
    ? "from-black/70 via-black/50 to-black/80"
    : "from-black/40 via-black/25 to-black/50";

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-foreground"
      aria-label={t("hero.headline") || "Hero section with Adinas General Hospital"}
    >
      {/* ============================================================
          BACKGROUND LAYER
          ============================================================ */}
      
      {/* 1. STATIC IMAGE (Shows first, then fades out) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 50%, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 50%, black 100%)",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      >
        
      </div>

      {/* 2. VIDEO PLAYER (Fades in after image) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          !isTransitioning && isVideoReady ? "opacity-100" : "opacity-0"
        }`}
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 50%, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 50%, black 100%)",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      >
        <video
          ref={videoRef}
          key={currentVideoIndex}
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
        >
          <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
          {t("hero.video_not_supported") || "Your browser does not support the video tag."}
        </video>
      </div>

      {/* Dynamic overlay based on theme */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayOpacity}`} />

      {/* Subtle overlay pattern for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)]" />

      {/* ============================================================
          CONTENT SECTION
          ============================================================ */}
      <div className="relative z-10 flex flex-col justify-center min-h-screen px-6 sm:px-12 lg:px-20 pt-24 sm:pt-28">
        
        <div className="max-w-2xl lg:max-w-3xl w-full flex flex-col items-start text-left">
          
          {/* ✅ HEADLINE - Using translations for both words */}
          <div
            className={`w-full transition-all duration-1000 ease-out delay-150 ${
              isLoaded && isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.15] tracking-tight text-left">
              <span className="text-[#0EA5E9] drop-shadow-md">{t("hospital.name.adinas") || "Adinas"}</span>{" "}
              <span className="text-[#0EA5E9] drop-shadow-md">{t("hospital.name.general") || "General Hospital"}</span>
            </h1>
          </div>

          {/* ✅ SUBHEADLINE - Using translation */}
          <div
            className={`w-full transition-all duration-1000 ease-out delay-300 ${
              isLoaded && isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-white/95 leading-relaxed font-medium text-left">
              {t("hero.description") || "Welcome to Adinas General Hospital. We are committed to providing exceptional healthcare services with compassion, innovation, and excellence. Our dedicated team of medical professionals ensures the highest quality care for every patient."}
            </p>
          </div>

          {/* ✅ APPOINTMENT BUTTON - Using translation */}
          <div
            className={`w-full mt-6 sm:mt-8 flex justify-end items-center transition-all duration-1000 ease-out delay-500 ${
              isLoaded && isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <Link
              href="/appointment"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#2A3380] hover:bg-[#1E3A8A] text-white font-semibold text-sm sm:text-base rounded-full transition-all duration-300 shadow-xl shadow-blue-900/40 hover:scale-105 active:scale-95"
            >
              <Calendar className="w-5 h-5" />
              <span>{t("hero.book_appointment") || "Book Appointment"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}