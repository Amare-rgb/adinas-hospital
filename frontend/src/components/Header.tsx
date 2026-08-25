// components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageProvider";
import { api } from "@/lib/api";
import {
  ChevronDown,
  Globe,
  Moon,
  Sun,
  X,
  Calendar,
  Menu,
  Monitor,
  User,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  UserCircle,
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Microscope,
  Pill,
  Syringe,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

// ============================================================
// SCROLL DETECTION HOOK
// ============================================================
function useScroll() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { isScrolled };
}

// ============================================================
// CUSTOM HOOK: Click outside detection
// ============================================================
function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ============================================================
// SERVICE ICON HELPER
// ============================================================
const getServiceIcon = (category: string | null, name: string) => {
  const lower = (category || name).toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return <Heart className="w-4 h-4" />;
  if (lower.includes('brain') || lower.includes('neuro')) return <Brain className="w-4 h-4" />;
  if (lower.includes('bone') || lower.includes('ortho')) return <Bone className="w-4 h-4" />;
  if (lower.includes('pediatric') || lower.includes('baby') || lower.includes('child')) return <Baby className="w-4 h-4" />;
  if (lower.includes('eye') || lower.includes('ophthalm')) return <Eye className="w-4 h-4" />;
  if (lower.includes('dental') || lower.includes('dent')) return <Syringe className="w-4 h-4" />;
  if (lower.includes('lab') || lower.includes('diagnostic')) return <Microscope className="w-4 h-4" />;
  if (lower.includes('pharmacy') || lower.includes('pill') || lower.includes('drug')) return <Pill className="w-4 h-4" />;
  return <Stethoscope className="w-4 h-4" />;
};

// ============================================================
// HEADER COMPONENT
// ============================================================
export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [appointmentDropdownOpen, setAppointmentDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Refs for dropdowns
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const appointmentDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const { isScrolled } = useScroll();
  const pathname = usePathname();
  const router = useRouter();

  const LOCATION = "Adinas General Hospital";

  // Fetch services for dropdown
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const response = await api.get<any>(`/services?location=${encodeURIComponent(LOCATION)}&includeInactive=false`);
        
        let servicesData: any[] = [];
        if (response) {
          if (Array.isArray(response)) {
            servicesData = response;
          } else if (response.data && Array.isArray(response.data)) {
            servicesData = response.data;
          } else if (response.services && Array.isArray(response.services)) {
            servicesData = response.services;
          }
        }
        
        servicesData = servicesData.filter(s => s.isActive !== false);
        setServices(servicesData.slice(0, 10));
      } catch (error) {
        console.error('Failed to load services for navigation:', error);
        setServices([
          { id: '1', name: 'Cardiology', description: 'Heart care services', category: 'Specialist', isActive: true },
          { id: '2', name: 'Neurology', description: 'Brain and nervous system', category: 'Specialist', isActive: true },
          { id: '3', name: 'Orthopedics', description: 'Bone and joint care', category: 'Specialist', isActive: true },
          { id: '4', name: 'Pediatrics', description: 'Child healthcare', category: 'Specialist', isActive: true },
        ]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Which pages get the transparent/glass effect at the top?
  const isTransparentPage = ["/", "/blogs", "/aboutUs", "/departments", "/doctors", "/services", "/contact"].includes(pathname);

  // SIMPLE RULE: Solid if scrolled OR not on a transparent page
  const isSolid = isScrolled || !isTransparentPage;

  // Click outside handlers
  useClickOutside(languageDropdownRef, () => setLanguageDropdownOpen(false));
  useClickOutside(themeDropdownRef, () => setThemeDropdownOpen(false));
  useClickOutside(appointmentDropdownRef, () => setAppointmentDropdownOpen(false));
  useClickOutside(moreDropdownRef, () => setMoreDropdownOpen(false));
  useClickOutside(mobileMenuRef, () => setMobileOpen(false));
  useClickOutside(servicesDropdownRef, () => setServicesDropdownOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ============================================================
  // Navigation items - NO ICONS
  // ============================================================
  const navItems = useMemo(
    () => [
      { 
        id: "home", 
        label: t("nav.home") || "Home", 
        href: "/",
      },
      { 
        id: "about", 
        label: t("nav.about_us") || "About Us", 
        href: "/aboutUs",
      },
      { 
        id: "doctors", 
        label: t("nav.doctors") || "Doctors", 
        href: "/doctors",
      },
      { 
        id: "departments", 
        label: t("nav.departments") || "Departments", 
        href: "/departments",
      },
      { 
        id: "services", 
        label: t("nav.services") || "Services", 
        href: "/services",
        hasDropdown: true,
      },
      { 
        id: "blog", 
        label: t("nav.blog") || "Blog", 
        href: "/blogs",
      },
      { 
        id: "contact", 
        label: t("nav.contact") || "Contact", 
        href: "/contact",
      },
    ],
    [t],
  );

  // Account dropdown items for logged in users
  const accountItems = useMemo(
    () => [
      { id: "profile", label: t("nav.profile") || "My Profile", href: "/profile", icon: UserCircle },
      { id: "settings", label: t("nav.settings") || "Settings", href: "/settings", icon: Settings },
    ],
    [t],
  );

  // ============================================================
  // SCROLL DIRECTION – hide/show main header on scroll down/up
  // ============================================================
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const goHome = () => {
    router.push("/");
  };

  const closeAll = () => {
    setLanguageDropdownOpen(false);
    setThemeDropdownOpen(false);
    setMobileOpen(false);
    setAppointmentDropdownOpen(false);
    setMoreDropdownOpen(false);
    setServicesDropdownOpen(false);
  };

  // ✅ Handle booking navigation - redirects to hospital booking page
  const handleBookAppointment = () => {
    router.push("/appointments/hospital");
    setAppointmentDropdownOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setMoreDropdownOpen(false);
    router.push('/');
  };

  const getThemeLabel = (): string => {
    if (theme === "light") return t("theme.light") || "Light";
    if (theme === "dark") return t("theme.dark") || "Dark";
    return t("theme.system") || "System";
  };

  const getLanguageLabel = (): string => {
    return language === "en" ? "English" : "አማርኛ";
  };

  return (
    <>
      <header
        className={`fixed left-1/2 z-40 mx-auto flex w-[95vw] max-w-[1400px] -translate-x-1/2 rounded-2xl transition-all duration-500 ease-in-out transform ${
          showHeader ? "translate-y-0" : "-translate-y-[calc(100%+20px)]"
        }`}
        id="main-header"
        style={{ top: "8px" }}
      >
        {/* Header Background */}
        <div
          className={`absolute inset-0 -z-10 rounded-2xl transition-all duration-300 ${
            isSolid
              ? "border border-[#2A3380]/20 bg-white/95 shadow-lg shadow-[#2A3380]/10 backdrop-blur-sm dark:border-[#2A3380]/30 dark:bg-slate-900/95 dark:shadow-[#2A3380]/10"
              : "border-transparent bg-transparent shadow-none"
          }`}
        />

        <nav className="relative flex w-full items-center justify-between gap-2 px-2 py-2 sm:px-4 lg:px-6">
          
          {/* ============================================================
              LOGO SECTION
              ============================================================ */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-3 flex-shrink-0 group"
              aria-label="Adinas General Hospital Logo"
              translate="no"
              onClick={goHome}
            >
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex-shrink-0">
                <Image
                  src="/llogo.jpg"
                  alt="Adinas General Hospital"
                  fill
                  className="object-contain rounded-lg border-2 border-[#2A3380]/20 dark:border-[#2A3380]/30 group-hover:border-[#2A3380]/50 transition-all duration-300 shadow-md group-hover:shadow-xl"
                  priority
                  sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
                />
              </div>
              
              <div className="flex flex-col leading-tight">
                <span className={`text-base sm:text-lg md:text-xl font-extrabold tracking-tight transition-colors duration-300 ${
                  isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"
                }`}>
                  Adinas Hospital
                </span>
                <span className={`text-[8px] sm:text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase transition-colors duration-300 ${
                  isSolid ? "text-[#2A3380]/70 dark:text-[#2A3380]/70" : "text-white/70"
                }`}>
                  General Hospital
                </span>
              </div>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION - NO ICONS */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
            <div className="flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => {
                const active = isActiveLink(item.href);
                
                if (item.hasDropdown) {
                  return (
                    <div key={item.id} className="relative" ref={servicesDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                        onMouseEnter={() => setServicesDropdownOpen(true)}
                        onMouseLeave={() => setServicesDropdownOpen(false)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                          active || servicesDropdownOpen
                            ? isSolid
                              ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]"
                              : "bg-white/25 text-white"
                            : isSolid
                              ? "text-[#2A3380] hover:bg-[#2A3380]/10 hover:text-[#1E3A8A] dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10 dark:hover:text-[#2A3380]"
                              : "text-white/90 hover:bg-white/25 hover:text-white"
                        }`}
                      >
                        {item.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {/* Services Dropdown */}
                      {servicesDropdownOpen && (
                        <div
                          onMouseEnter={() => setServicesDropdownOpen(true)}
                          onMouseLeave={() => setServicesDropdownOpen(false)}
                          className={`absolute left-0 top-full mt-1 w-64 rounded-xl overflow-hidden transition-all duration-200 ${
                            isSolid
                              ? "border border-[#2A3380]/20 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-[#2A3380]/30 dark:bg-slate-900/95"
                              : "border border-white/25 bg-white/20 backdrop-blur-2xl shadow-2xl shadow-black/20"
                          }`}
                        >
                          <div className="p-2">
                            <div className={`px-3 py-2 border-b ${isSolid ? "border-[#2A3380]/20 dark:border-[#2A3380]/30" : "border-white/20"}`}>
                              <p className={`text-xs font-semibold uppercase tracking-wider ${isSolid ? "text-gray-400 dark:text-gray-500" : "text-white/60"}`}>
                                {t("nav.services") || "Services"}
                              </p>
                            </div>
                            {loadingServices ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 text-[#2A3380] animate-spin" />
                              </div>
                            ) : services.length > 0 ? (
                              <div className="max-h-64 overflow-y-auto">
                                {services.map((service) => (
                                  <Link
                                    key={service.id}
                                    href={`/services/${service.id}`}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                                      isSolid
                                        ? "hover:bg-[#2A3380]/5 dark:hover:bg-[#2A3380]/10"
                                        : "hover:bg-white/10"
                                    }`}
                                    onClick={() => setServicesDropdownOpen(false)}
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#2A3380] group-hover:text-white ${
                                      isSolid ? "bg-[#2A3380]/10 text-[#2A3380]" : "bg-white/20 text-white"
                                    }`}>
                                      {getServiceIcon(service.category, service.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${isSolid ? "text-gray-800 dark:text-gray-200" : "text-white"}`}>
                                        {service.name}
                                      </p>
                                      <p className="text-xs text-gray-400 truncate">
                                        {service.category || "General"}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="px-3 py-4 text-center text-sm text-gray-500">
                                No services available
                              </div>
                            )}
                            <div className={`border-t ${isSolid ? "border-[#2A3380]/20 dark:border-[#2A3380]/30" : "border-white/20"} mt-1 pt-1`}>
                              <Link
                                href="/services"
                                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                  isSolid
                                    ? "text-[#2A3380] hover:bg-[#2A3380]/5 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                                    : "text-white hover:bg-white/10"
                                }`}
                                onClick={() => setServicesDropdownOpen(false)}
                              >
                                <span>View All Services</span>
                                <ChevronDown className="w-4 h-4 -rotate-90" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? isSolid
                          ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]"
                          : "bg-white/25 text-white"
                        : isSolid
                          ? "text-[#2A3380] hover:bg-[#2A3380]/10 hover:text-[#1E3A8A] dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10 dark:hover:text-[#2A3380]"
                          : "text-white/90 hover:bg-white/25 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {/* ✅ APPOINTMENT BUTTON - Redirects to /appointments/hospital */}
            <div className="relative" ref={appointmentDropdownRef}>
              <button
                type="button"
                onClick={() => setAppointmentDropdownOpen(!appointmentDropdownOpen)}
                className={`inline-flex items-center rounded-lg px-2 sm:px-3.5 py-0.5 sm:py-1.5 text-[9px] sm:text-xs lg:text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap ${
                  isSolid
                    ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                    : "text-white hover:bg-white/40"
                } ${appointmentDropdownOpen ? (isSolid ? "bg-[#2A3380]/10" : "bg-white/20") : ""}`}
                aria-haspopup="true"
                aria-expanded={appointmentDropdownOpen}
              >
                <Calendar className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                <span className="text-[7px] sm:text-xs lg:text-sm whitespace-nowrap ml-0.5 sm:ml-1">{t("nav.book") || "Book Appointment"}</span>
              </button>
              {appointmentDropdownOpen && (
                <div className={`absolute right-0 top-full z-50 mt-2 w-[220px] rounded-2xl p-2 transition-all duration-200 ${
                  isSolid
                    ? "border border-[#2A3380]/20 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-[#2A3380]/30 dark:bg-slate-900/95"
                    : "border border-white/25 bg-white/20 backdrop-blur-2xl shadow-2xl shadow-black/20"
                }`}>
                  <div className="px-3 py-2 border-b border-[#2A3380]/20 dark:border-[#2A3380]/30 mb-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isSolid ? "text-gray-400 dark:text-gray-500" : "text-white/60"}`}>
                      {t("nav.book_services") || "Book Services"}
                    </p>
                  </div>
                  {/* ✅ BOOK APPOINTMENT - Redirects to hospital booking page */}
                  <button
                    onClick={handleBookAppointment}
                    className={`flex flex-col rounded-lg px-3 py-2.5 w-full text-left transition-colors ${isSolid ? "hover:bg-[#2A3380]/10 dark:hover:bg-[#2A3380]/10" : "hover:bg-white/10"}`}
                  >
                    <span className={`font-medium ${isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"}`}>
                      {t("nav.book_appointment") || "Book Appointment"}
                    </span>
                    <span className={`text-[10px] ${isSolid ? "text-[#2A3380]/70 dark:text-[#4A90D9]/70" : "text-white/60"}`}>
                      {t("nav.book_hospital_desc") || "Book at Adinas General Hospital"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* MORE BUTTON - Shows Account, Language, Theme */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`inline-flex items-center gap-1 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs lg:text-sm font-medium transition-colors ${
                  isSolid
                    ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                    : "text-white hover:bg-white/20"
                } ${moreDropdownOpen ? (isSolid ? "bg-[#2A3380]/10" : "bg-white/20") : ""}`}
                aria-haspopup="true"
                aria-expanded={moreDropdownOpen}
              >
                <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-xs font-medium">
                  {t("nav.more") || "More"}
                </span>
                <ChevronDown className={`h-2 w-2 sm:h-3 sm:w-3 transition-transform duration-200 ${moreDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {moreDropdownOpen && (
                <div className={`absolute right-0 top-full z-50 mt-2 w-[260px] rounded-2xl p-2 transition-all duration-200 ${
                  isSolid
                    ? "border border-[#2A3380]/20 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-[#2A3380]/30 dark:bg-slate-900/95"
                    : "border border-white/25 bg-white/20 backdrop-blur-2xl shadow-2xl shadow-black/20"
                }`}>
                  {/* ============================================================
                      ACCOUNT SECTION
                      ============================================================ */}
                  <div className="px-3 py-2 border-b border-[#2A3380]/20 dark:border-[#2A3380]/30 mb-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isSolid ? "text-gray-400 dark:text-gray-500" : "text-white/60"}`}>
                      <User className="inline w-3 h-3 mr-1" /> {t("nav.account") || "Account"}
                    </p>
                  </div>
                  
                  {isLoggedIn ? (
                    <>
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-[#2A3380]/20 dark:border-[#2A3380]/30 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2A3380]/20 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-[#2A3380] dark:text-[#4A90D9]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2A3380] dark:text-[#4A90D9] truncate">
                              {user?.firstName || user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user?.email || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Profile & Settings */}
                      {accountItems.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => { setMoreDropdownOpen(false); }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white"}`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      ))}
                      
                      {/* Logout */}
                      <div className="border-t border-[#2A3380]/20 dark:border-[#2A3380]/30 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout") || "Logout"}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Sign In */}
                      <Link
                        href="/login"
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white"}`}
                      >
                        <LogIn className="h-4 w-4" />
                        {t("nav.sign_in") || "Sign In"}
                      </Link>
                      
                      {/* Create Account */}
                      <Link
                        href="/register"
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white"}`}
                      >
                        <UserPlus className="h-4 w-4" />
                        {t("nav.create_account") || "Create Account"}
                      </Link>
                    </>
                  )}

                  {/* ============================================================
                      LANGUAGE SECTION
                      ============================================================ */}
                  <div className="mt-3 pt-3 border-t border-[#2A3380]/20 dark:border-[#2A3380]/30">
                    <div className="px-3 py-1 mb-1">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${isSolid ? "text-gray-400 dark:text-gray-500" : "text-white/60"}`}>
                        <Globe className="inline w-3 h-3 mr-1" /> Language
                      </p>
                    </div>
                    <button 
                      onClick={() => { setLanguage("en"); setMoreDropdownOpen(false); }} 
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${language === "en" ? (isSolid ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]" : "bg-white/30 text-white") : (isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white")}`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>English</span>
                      {language === "en" && <span className="ml-auto text-xs">✓</span>}
                    </button>
                    <button 
                      onClick={() => { setLanguage("am"); setMoreDropdownOpen(false); }} 
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${language === "am" ? (isSolid ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]" : "bg-white/30 text-white") : (isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white")}`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>አማርኛ</span>
                      {language === "am" && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  </div>

                  {/* ============================================================
                      THEME SECTION
                      ============================================================ */}
                  {mounted && (
                    <div className="mt-2 pt-2 border-t border-[#2A3380]/20 dark:border-[#2A3380]/30">
                      <div className="px-3 py-1 mb-1">
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isSolid ? "text-gray-400 dark:text-gray-500" : "text-white/60"}`}>
                          {theme === "light" ? <Sun className="inline w-3 h-3 mr-1" /> : theme === "dark" ? <Moon className="inline w-3 h-3 mr-1" /> : <Monitor className="inline w-3 h-3 mr-1" />} Theme
                        </p>
                      </div>
                      <button 
                        onClick={() => { setTheme("light"); setMoreDropdownOpen(false); }} 
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${theme === "light" ? (isSolid ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]" : "bg-white/30 text-white") : (isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white")}`}
                      >
                        <Sun className="h-4 w-4" />
                        <span>{t("theme.light") || "Light"}</span>
                        {theme === "light" && <span className="ml-auto text-xs">✓</span>}
                      </button>
                      <button 
                        onClick={() => { setTheme("dark"); setMoreDropdownOpen(false); }} 
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${theme === "dark" ? (isSolid ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]" : "bg-white/30 text-white") : (isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white")}`}
                      >
                        <Moon className="h-4 w-4" />
                        <span>{t("theme.dark") || "Dark"}</span>
                        {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
                      </button>
                      <button 
                        onClick={() => { setTheme("system"); setMoreDropdownOpen(false); }} 
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${theme === "system" ? (isSolid ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]" : "bg-white/30 text-white") : (isSolid ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "text-white/90 hover:bg-white/20 hover:text-white")}`}
                      >
                        <Monitor className="h-4 w-4" />
                        <span>{t("theme.system") || "System"}</span>
                        {theme === "system" && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              className={`relative flex size-6 sm:size-8 lg:size-9 items-center justify-center rounded-lg text-[12px] font-medium transition-colors focus:outline-none lg:hidden flex-shrink-0 ${
                isSolid
                  ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                  : "text-white hover:bg-white/20"
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="size-3 sm:size-4 shrink-0" /> : <Menu className="size-3 sm:size-4 shrink-0" />}
              <span className="sr-only">{t("nav.toggle_menu") || "Toggle navigation"}</span>
            </button>
          </div>
        </nav>

        {/* MOBILE MENU - NO ICONS */}
        <div
          ref={mobileMenuRef}
          className={`${mobileOpen ? "max-h-[85vh] opacity-100" : "max-h-0 opacity-0"} absolute left-0 right-0 top-full mt-2 overflow-hidden overflow-y-auto rounded-2xl transition-all duration-300 lg:hidden ${
            isSolid
              ? "border border-[#2A3380]/20 bg-white/95 shadow-lg dark:border-[#2A3380]/30 dark:bg-slate-900/95"
              : "border border-white/20 bg-white/10 backdrop-blur-md shadow-lg"
          }`}
        >
          <div className="flex flex-col gap-0.5 p-4">
            {/* Mobile Logo */}
            <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-[#2A3380]/20 dark:border-[#2A3380]/30">
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image
                  src="/llogo.jpg"
                  alt="Adinas General Hospital"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-extrabold ${isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"}`}>
                  Adinas Hospital
                </span>
                <span className={`text-[8px] font-semibold tracking-[0.25em] uppercase ${isSolid ? "text-[#2A3380]/70 dark:text-[#2A3380]/70" : "text-white/60"}`}>
                  General Hospital
                </span>
              </div>
            </div>

            {/* NAV ITEMS - NO ICONS */}
            {navItems.map((item) => {
              const active = isActiveLink(item.href);
              
              if (item.hasDropdown) {
                return (
                  <div key={item.id}>
                    <div
                      className={`flex items-center justify-between rounded-lg p-3 font-medium transition-all duration-200 cursor-pointer ${
                        active
                          ? isSolid
                            ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]"
                            : "bg-white/25 text-white"
                          : isSolid
                            ? "text-[#2A3380] hover:bg-[#2A3380]/10 hover:text-[#1E3A8A] dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10 dark:hover:text-[#2A3380]"
                            : "text-white/90 hover:bg-white/25 hover:text-white"
                      }`}
                      onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${servicesDropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                    {servicesDropdownOpen && (
                      <div className="ml-4 pl-4 border-l-2 border-[#2A3380]/20 dark:border-[#2A3380]/30 space-y-1 mt-1">
                        {loadingServices ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 text-[#2A3380] animate-spin" />
                          </div>
                        ) : services.length > 0 ? (
                          services.map((service) => (
                            <Link
                              key={service.id}
                              href={`/services/${service.id}`}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                                isSolid
                                  ? "text-gray-600 hover:bg-[#2A3380]/5 dark:text-gray-300 dark:hover:bg-[#2A3380]/10"
                                  : "text-white/80 hover:bg-white/10"
                              }`}
                              onClick={() => {
                                setMobileOpen(false);
                                setServicesDropdownOpen(false);
                              }}
                            >
                              {getServiceIcon(service.category, service.name)}
                              {service.name}
                            </Link>
                          ))
                        ) : (
                          <p className={`px-3 py-2 text-sm ${isSolid ? "text-gray-400" : "text-white/50"}`}>
                            No services available
                          </p>
                        )}
                        <Link
                          href="/services"
                          className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            isSolid
                              ? "text-[#2A3380] hover:bg-[#2A3380]/5 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                              : "text-white hover:bg-white/10"
                          }`}
                          onClick={() => {
                            setMobileOpen(false);
                            setServicesDropdownOpen(false);
                          }}
                        >
                          View All Services →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={closeAll}
                  className={`flex items-center rounded-lg p-3 font-medium transition-all duration-200 ${
                    active
                      ? isSolid
                        ? "bg-[#2A3380]/15 text-[#2A3380] dark:bg-[#2A3380]/20 dark:text-[#4A90D9]"
                        : "bg-white/25 text-white"
                      : isSolid
                        ? "text-[#2A3380] hover:bg-[#2A3380]/10 hover:text-[#1E3A8A] dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10 dark:hover:text-[#2A3380]"
                        : "text-white/90 hover:bg-white/25 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* ✅ MOBILE BOOK SECTION - Redirects to /appointments/hospital */}
            <div className="mt-4 border-t border-[#2A3380]/20 dark:border-[#2A3380]/30 pt-4">
              <p className={`text-xs font-medium mb-2 px-1 ${isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"}`}>
                {t("nav.book_services") || "Book Services"}
              </p>
              <button
                onClick={handleBookAppointment}
                className={`flex items-center rounded-lg p-3 w-full text-left transition-colors ${isSolid ? "hover:bg-[#2A3380]/10 dark:hover:bg-[#2A3380]/10" : "hover:bg-white/10"}`}
              >
                <div>
                  <div className={`font-medium ${isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"}`}>
                    {t("nav.book_appointment") || "Book Appointment"}
                  </div>
                  <div className={`text-xs ${isSolid ? "text-[#2A3380]/70 dark:text-[#4A90D9]/70" : "text-white/60"}`}>
                    {t("nav.book_hospital_desc") || "Book at Adinas General Hospital"}
                  </div>
                </div>
              </button>
            </div>

            {/* Mobile Account Section */}
            <div className="mt-4 border-t border-[#2A3380]/20 dark:border-[#2A3380]/30 pt-4">
              <p className={`text-xs font-medium mb-2 px-1 ${isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"}`}>
                {t("nav.account") || "Account"}
              </p>
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#2A3380]/20 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-[#2A3380] dark:text-[#4A90D9]" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium truncate ${isSolid ? "text-[#2A3380] dark:text-[#4A90D9]" : "text-white"}`}>
                        {user?.firstName || user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                  {accountItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closeAll}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isSolid
                          ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                          : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout") || "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isSolid
                        ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                        : "text-white/90 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <LogIn className="h-4 w-4" />
                    {t("nav.sign_in") || "Sign In"}
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeAll}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isSolid
                        ? "text-[#2A3380] hover:bg-[#2A3380]/10 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10"
                        : "text-white/90 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("nav.create_account") || "Create Account"}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Language & Theme */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#2A3380]/20 dark:border-[#2A3380]/30 pt-4">
              <div className="relative">
                <button type="button" onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isSolid ? "border-[#2A3380]/30 text-[#2A3380] hover:bg-[#2A3380]/10 dark:border-[#2A3380]/30 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "border-white/30 text-white hover:bg-white/20"}`}>
                  <Globe className="h-4 w-4" /><span>{getLanguageLabel()}</span><ChevronDown className="h-3 w-3" />
                </button>
                {languageDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-full min-w-[160px] rounded-xl border bg-white p-1 shadow-lg dark:bg-slate-900">
                    <button onClick={() => { setLanguage("en"); setLanguageDropdownOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${language === "en" ? "bg-[#2A3380]/15 text-[#2A3380]" : "hover:bg-[#2A3380]/10"}`}>
                      <Globe className="h-4 w-4" /><span>English</span>{language === "en" && <span className="ml-auto">✓</span>}
                    </button>
                    <button onClick={() => { setLanguage("am"); setLanguageDropdownOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${language === "am" ? "bg-[#2A3380]/15 text-[#2A3380]" : "hover:bg-[#2A3380]/10"}`}>
                      <Globe className="h-4 w-4" /><span>አማርኛ</span>{language === "am" && <span className="ml-auto">✓</span>}
                    </button>
                  </div>
                )}
              </div>
              {mounted && (
                <div className="relative">
                  <button type="button" onClick={() => setThemeDropdownOpen(!themeDropdownOpen)} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isSolid ? "border-[#2A3380]/30 text-[#2A3380] hover:bg-[#2A3380]/10 dark:border-[#2A3380]/30 dark:text-[#4A90D9] dark:hover:bg-[#2A3380]/10" : "border-white/30 text-white hover:bg-white/20"}`}>
                    {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    <span>{getThemeLabel()}</span><ChevronDown className="h-3 w-3" />
                  </button>
                  {themeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full min-w-[160px] rounded-xl border bg-white p-1 shadow-lg dark:bg-slate-900">
                      <button onClick={() => { setTheme("light"); setThemeDropdownOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${theme === "light" ? "bg-[#2A3380]/15 text-[#2A3380]" : "hover:bg-[#2A3380]/10"}`}>
                        <Sun className="h-4 w-4" /><span>{t("theme.light") || "Light"}</span>{theme === "light" && <span className="ml-auto">✓</span>}
                      </button>
                      <button onClick={() => { setTheme("dark"); setThemeDropdownOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${theme === "dark" ? "bg-[#2A3380]/15 text-[#2A3380]" : "hover:bg-[#2A3380]/10"}`}>
                        <Moon className="h-4 w-4" /><span>{t("theme.dark") || "Dark"}</span>{theme === "dark" && <span className="ml-auto">✓</span>}
                      </button>
                      <button onClick={() => { setTheme("system"); setThemeDropdownOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${theme === "system" ? "bg-[#2A3380]/15 text-[#2A3380]" : "hover:bg-[#2A3380]/10"}`}>
                        <Monitor className="h-4 w-4" /><span>{t("theme.system") || "System"}</span>{theme === "system" && <span className="ml-auto">✓</span>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

// Set CSS variable for header offset
if (typeof window !== 'undefined') {
  const setHeaderOffset = () => {
    try {
      const header = document.querySelector('#main-header') as HTMLElement | null;
      const headerH = header ? header.offsetHeight : 0;
      
      let total = headerH + 8;
      document.documentElement.style.setProperty('--header-offset', `${total}px`);
      document.documentElement.style.setProperty('--topbar-height', `0px`);
    } catch (e) {
      /* ignore */
    }
  };

  setHeaderOffset();
  window.addEventListener('resize', setHeaderOffset);
}