"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageProvider";
import { 
  Phone, 
  Mail, 
  MapPin, 
  PhoneCall, 
  Shield 
} from "lucide-react";

// ============================================================
// CUSTOM HOOK: Detect if element is in viewport
// ============================================================
function useInView(ref: React.RefObject<HTMLElement>) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return isInView;
}

// ============================================================
// COMPONENT
// ============================================================
export function Footer() {
  const { t } = useLanguage();
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef);

  return (
    <footer
      ref={footerRef}
      className={`w-full bg-[#1e2761] dark:bg-[#151c48] text-white font-sans pt-12 pb-8 px-8 md:px-16 border-t border-[#2A3380] transition-all duration-700 ease-out ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Logo & Nav Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 md:mb-24">
          {/* Logo - matches navbar style */}
          <div className="md:col-span-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
            >
              <span className="font-light text-slate-300">
                <span className="font-semibold text-white">
                  Adinas
                </span>{" "}
                <span className="text-[#38BDF8]">General Hospital</span>
              </span>
            </Link>
            <p className="text-slate-300 text-sm mt-3 max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Column 1: Quick Links - REMOVED diagnostic_packages, pharma_catalog, careers */}
          <div className="md:col-span-3">
            <h3 className="text-slate-300 font-normal text-base mb-4">
              {t("footer.quick_links")}
            </h3>
            <ul className="space-y-3 text-white font-normal text-base">
              <li>
                <Link
                  href="/#about"
                  className="hover:text-[#38BDF8] transition-colors"
                >
                  {t("nav.about_us")}
                </Link>
              </li>
              <li>
                <Link
                  href="/hospital#departments"
                  className="hover:text-[#38BDF8] transition-colors"
                >
                  {t("footer.hospital_departments")}
                </Link>
              </li>
              {/* REMOVED: footer.diagnostic_packages */}
              {/* REMOVED: footer.pharma_catalog */}
              {/* REMOVED: footer.careers_news */}
            </ul>
          </div>

          {/* Column 2: Contact Info */}
          <div className="md:col-span-3">
            <h3 className="text-slate-300 font-normal text-base mb-4">
              {t("contact")}
            </h3>
            <ul className="space-y-3 text-white font-normal text-base">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span className="hover:text-[#38BDF8] transition-colors">
                  {t("footer.address")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span className="hover:text-[#38BDF8] transition-colors">
                  +251 58 320 4167
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span className="hover:text-[#38BDF8] transition-colors">
                  info@adinasgeneralhospital.com
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Emergency & Support - REMOVED lab_results, pharma_inquiries */}
          <div className="md:col-span-3">
            <h3 className="text-slate-300 font-normal text-base mb-4">
              {t("footer.emergency_support")}
            </h3>
            <ul className="space-y-4 text-white font-normal text-base">
              <li>
                <div className="flex items-start gap-2">
                  <PhoneCall className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("footer.emergency_hotline_label")}</p>
                    <p className="text-lg font-bold text-red-400">
                      8560
                    </p>
                    <p className="text-xs text-slate-300">
                      {t("footer.available_24_7")}
                    </p>
                  </div>
                </div>
              </li>
              {/* REMOVED: footer.lab_results */}
              {/* REMOVED: footer.lab_results_link */}
              {/* REMOVED: footer.pharma_inquiries */}
              {/* REMOVED: footer.pharma_inquiries_contact */}
            </ul>
          </div>
        </div>

        {/* Bottom Section: Copyright - REMOVED Privacy Policy and Terms of Use */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-300 text-sm pt-8 border-t border-[#2A3380]">
          <div className="flex flex-wrap items-center gap-6">
            <span>© 2026 Adinas General Hospital. All Rights Reserved.</span>
            {/* REMOVED: Privacy Policy */}
            {/* REMOVED: Terms of Use */}
          </div>

          {/* Compliance Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#151c48] text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-sm gap-1.5 border border-white/10">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <path d="M6 0L0 2.5V6.5C0 10.2 2.6 13.6 6 14C9.4 13.6 12 10.2 12 6.5V2.5L6 0ZM6 7V11H5V7H3V6H9V7H6Z" />
              </svg>
              <span>ISO</span>
              <span className="text-[8px] font-light tracking-normal opacity-80">GMP</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#151c48] flex items-center justify-center text-white text-[6px] font-bold relative border border-white/10">
              <span>Q</span>
              <div className="absolute inset-0 border border-dashed border-white/40 rounded-full scale-110" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}