"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageProvider";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeProvider"; // ✅ Correct import
import { 
  Heart, 
  Users, 
  Stethoscope, 
  Clock, 
  Building2, 
  Award,
  CheckCircle2,
  ArrowRight,
  Mail,
  Send,
  Microscope,
  Pill,
  Activity,
  Bone,
  Brain,
  Baby,
  Eye,
  Syringe,
  Loader2
} from "lucide-react";

// ============================================================
// CONFIGURATION – Local image path
// ============================================================
const GENERAL_IMAGE = {
  src: "/Adinasimag.jpg",
  alt: "Adinas General Hospital building",
};

const LOCATION = "Adinas General Hospital";
const MAX_SERVICES_TO_DISPLAY = 12;

// ============================================================
// SERVICE CARD COMPONENT - WITH DARK MODE SUPPORT
// ============================================================
function ServiceCard({ 
  icon, 
  title, 
  description, 
  image, 
  color,
  price,
  duration,
  onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  image: string;
  color: string;
  price?: number;
  duration?: number;
  onClick?: () => void;
}) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div 
      onClick={onClick}
      className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer
        ${isDark 
          ? 'bg-gray-800/50 border-gray-700 hover:border-[#2A3380]/50 shadow-lg hover:shadow-[#2A3380]/20' 
          : 'bg-white border-gray-100 hover:border-[#2A3380]/30 shadow-sm hover:shadow-xl'
        }`}
    >
      {/* Service Image */}
      <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = `flex items-center justify-center h-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`;
                fallback.innerHTML = `<span class="text-4xl text-gray-400">🏥</span>`;
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-[${color}]/90 flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
      {price && (
        <p className={`text-sm font-bold mt-2 ${isDark ? 'text-[#0EA5E9]' : 'text-[#2A3380]'}`}>
          ${price.toFixed(2)}
          {duration && <span className={`text-xs font-normal ml-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>({duration} min)</span>}
        </p>
      )}
      <div className={`inline-flex items-center gap-1 mt-3 text-sm font-semibold transition-colors
        ${isDark ? 'text-[#0EA5E9] hover:text-[#4A5BCC]' : 'text-[#2A3380] hover:text-[#0EA5E9]'}`}>
        {t("general.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT - WITH DARK MODE SUPPORT
// ============================================================
export function GeneralSec() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await api.get<any>(`/services?location=${encodeURIComponent(LOCATION)}`);
        
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
        setServices(servicesData.slice(0, MAX_SERVICES_TO_DISPLAY));
        console.log(`✅ Loaded ${servicesData.length} services, showing ${Math.min(servicesData.length, MAX_SERVICES_TO_DISPLAY)} for ${LOCATION}`);
      } catch (error: any) {
        console.error('❌ Failed to load services:', error);
        setError(error.message || 'Failed to load services');
        setServices(getFallbackServices());
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Fallback services if API fails
  const getFallbackServices = () => {
    return [
      {
        id: '1',
        name: t("hospital.dept.cardiology.name") || 'Cardiology',
        description: t("hospital.dept.cardiology.desc") || 'Comprehensive heart care including diagnostics, treatment, and rehabilitation.',
        image: '/services/cardiology.jpg',
        category: 'Specialist',
        price: 150,
        duration: 30,
        isActive: true
      },
      {
        id: '2',
        name: t("hospital.dept.neurology.name") || 'Neurology',
        description: t("hospital.dept.neurology.desc") || 'Expert care for brain, spine, and nervous system disorders.',
        image: '/services/neurology.jpg',
        category: 'Specialist',
        price: 200,
        duration: 45,
        isActive: true
      },
      {
        id: '3',
        name: t("hospital.dept.orthopedics.name") || 'Orthopedics',
        description: t("hospital.dept.orthopedics.desc") || 'Advanced bone, joint, and muscle care with surgical expertise.',
        image: '/services/orthopedics.jpg',
        category: 'Specialist',
        price: 175,
        duration: 30,
        isActive: true
      },
      {
        id: '4',
        name: t("hospital.dept.pediatrics.name") || 'Pediatrics',
        description: t("hospital.dept.pediatrics.desc") || 'Compassionate healthcare for children from newborns to adolescents.',
        image: '/services/pediatrics.jpg',
        category: 'Specialist',
        price: 120,
        duration: 25,
        isActive: true
      },
      {
        id: '5',
        name: 'Ophthalmology',
        description: 'Complete eye care from routine exams to complex surgeries.',
        image: '/services/ophthalmology.jpg',
        category: 'Specialist',
        price: 130,
        duration: 30,
        isActive: true
      },
      {
        id: '6',
        name: 'Dentistry',
        description: 'Full dental services including preventive, restorative, and cosmetic care.',
        image: '/services/dentistry.jpg',
        category: 'Specialist',
        price: 100,
        duration: 30,
        isActive: true
      },
      {
        id: '7',
        name: t("hospital.sec_services.lab") || 'Lab Services',
        description: t("hospital.sec_services.lab_desc") || 'State-of-the-art diagnostic testing for accurate results.',
        image: '/services/lab.jpg',
        category: 'Diagnostic',
        price: 80,
        duration: 15,
        isActive: true
      },
      {
        id: '8',
        name: t("hospital.sec_services.pharmacy") || 'Pharmacy',
        description: t("hospital.sec_services.pharmacy_desc") || 'Full-service pharmacy with prescription medications and health products.',
        image: '/services/pharmacy.jpg',
        category: 'Pharmacy',
        price: 50,
        duration: 10,
        isActive: true
      },
      {
        id: '9',
        name: 'Radiology',
        description: 'Advanced imaging services including X-ray, MRI, CT scans, and ultrasound.',
        image: '/services/radiology.jpg',
        category: 'Diagnostic',
        price: 200,
        duration: 30,
        isActive: true
      },
      {
        id: '10',
        name: 'Physical Therapy',
        description: 'Rehabilitation and physical therapy services for recovery and wellness.',
        image: '/services/physical-therapy.jpg',
        category: 'Therapy',
        price: 90,
        duration: 45,
        isActive: true
      },
      {
        id: '11',
        name: 'Emergency Medicine',
        description: '24/7 emergency care for critical and urgent medical conditions.',
        image: '/services/emergency.jpg',
        category: 'Emergency',
        price: 250,
        duration: 60,
        isActive: true
      },
      {
        id: '12',
        name: 'Preventive Care',
        description: 'Comprehensive preventive healthcare services and wellness checkups.',
        image: '/services/preventive-care.jpg',
        category: 'Preventive Care',
        price: 75,
        duration: 30,
        isActive: true
      }
    ];
  };

  // Map service category to icon
  const getServiceIcon = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('cardio') || lower.includes('heart')) return <Heart className="w-5 h-5" />;
    if (lower.includes('brain') || lower.includes('neuro')) return <Brain className="w-5 h-5" />;
    if (lower.includes('bone') || lower.includes('ortho')) return <Bone className="w-5 h-5" />;
    if (lower.includes('pediatric') || lower.includes('baby')) return <Baby className="w-5 h-5" />;
    if (lower.includes('eye') || lower.includes('ophthalm')) return <Eye className="w-5 h-5" />;
    if (lower.includes('dental') || lower.includes('dent')) return <Syringe className="w-5 h-5" />;
    if (lower.includes('lab') || lower.includes('diagnostic')) return <Microscope className="w-5 h-5" />;
    if (lower.includes('pharmacy') || lower.includes('pill')) return <Pill className="w-5 h-5" />;
    if (lower.includes('emergency')) return <Activity className="w-5 h-5" />;
    if (lower.includes('therapy') || lower.includes('physical')) return <Users className="w-5 h-5" />;
    if (lower.includes('preventive') || lower.includes('wellness')) return <Award className="w-5 h-5" />;
    return <Stethoscope className="w-5 h-5" />;
  };

  // Map service category to color
  const getServiceColor = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('cardio') || lower.includes('heart')) return '#2A3380';
    if (lower.includes('brain') || lower.includes('neuro')) return '#0EA5E9';
    if (lower.includes('bone') || lower.includes('ortho')) return '#10B981';
    if (lower.includes('pediatric') || lower.includes('baby')) return '#F59E0B';
    if (lower.includes('eye') || lower.includes('ophthalm')) return '#8B5CF6';
    if (lower.includes('dental') || lower.includes('dent')) return '#EC4899';
    if (lower.includes('lab') || lower.includes('diagnostic')) return '#3B82F6';
    if (lower.includes('pharmacy') || lower.includes('pill')) return '#14B8A6';
    if (lower.includes('emergency')) return '#EF4444';
    if (lower.includes('therapy') || lower.includes('physical')) return '#8B5CF6';
    if (lower.includes('preventive') || lower.includes('wellness')) return '#22C55E';
    return '#2A3380';
  };

  // Helper to build image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://localhost:5000${cleanPath}`;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const displayServices = services.length > 0 ? services : getFallbackServices();

  // Dynamic styles based on theme
  const sectionBg = isDark 
    ? 'from-gray-900 via-gray-800 to-gray-900' 
    : 'from-white to-gray-50';
  
  const servicesSectionBg = isDark 
    ? 'bg-gray-900' 
    : 'bg-white';
  
  const textColor = isDark ? 'text-white' : 'text-[#1a1a1a]';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';

  return (
    <>
      {/* ============================================================
          GENERAL/HOSPITAL SECTION - WITH DARK MODE
          ============================================================ */}
      <section
        id="adinas-general-hospital"
        ref={sectionRef}
        className={`py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b ${sectionBg} relative overflow-hidden transition-colors duration-300`}
      >
        {/* Subtle background decoration - Adjusted for dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2A3380]/5 via-transparent to-[#0EA5E9]/5 pointer-events-none" />
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDark ? 'bg-[#2A3380]/5' : 'bg-[#2A3380]/10'} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${isDark ? 'bg-[#0EA5E9]/5' : 'bg-[#0EA5E9]/10'} rounded-full blur-3xl pointer-events-none`} />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main content: two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* Left column – Title, Description, Features */}
            <div
              className={`space-y-6 transition-all duration-700 ease-out delay-100 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {/* TITLE - With dark mode support */}
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight`}>
                <span className="text-[#2A3380] dark:text-[#4A5BCC]">{t("hospital.name.adinas") || "Adinas"}</span>{" "}
                <span className="text-[#0EA5E9] dark:text-[#38BDF8]">{t("hospital.name.general") || "General Hospital"}</span>
              </h2>

              {/* Description - With dark mode support */}
              <p className={`${textSecondary} text-sm sm:text-base leading-relaxed max-w-xl`}>
                {t("general.hospital_description") || "Our hospital has been delivering compassionate, expert medical care to our community. Our legacy of excellence is built on experience, innovation, and an unwavering commitment to patient well-being."}
              </p>

              {/* Why Choose Us - Features - With dark mode support */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${textColor} flex items-center gap-2`}>
                  <CheckCircle2 className="w-5 h-5 text-[#2A3380] dark:text-[#4A5BCC]" />
                  {t("general.why_choose_us") || "Why Choose Us?"}
                </h3>
                <div className="space-y-2.5">
                  {[
                    t("general.why_choose_1") || "Medical excellence with highly experienced specialists.",
                    t("general.why_choose_2") || "Comprehensive Care - A full range of medical services.",
                    t("general.why_choose_3") || "Advanced Technology - State-of-the-art medical equipment.",
                    t("general.why_choose_4") || "Patient-Centered Approach - Compassionate, personalized care.",
                    t("general.why_choose_5") || "24/7 Availability - Emergency and critical care services.",
                    t("general.why_choose_6") || "High-Quality Facilities - Modern inpatient rooms and ICUs."
                  ].map((text, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-2 rounded-lg transition-colors
                      ${isDark ? 'hover:bg-[#2A3380]/10' : 'hover:bg-[#2A3380]/5'}`}>
                      <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-[#2A3380]/20' : 'bg-[#2A3380]/10'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
                      </div>
                      <span className={`text-sm ${textSecondary} leading-relaxed`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button - With dark mode support */}
              <div className="mt-6">
                <Link
                  href="/services"
                  className={`inline-flex items-center gap-2.5 px-8 py-3.5 font-semibold text-sm rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8] text-white shadow-lg shadow-[#2A3380]/20 hover:shadow-xl hover:shadow-[#2A3380]/30' 
                      : 'bg-[#2A3380] hover:bg-[#1E3A8A] text-white shadow-lg shadow-[#2A3380]/30 hover:shadow-xl hover:shadow-[#2A3380]/40'
                    }`}
                >
                  <span>{t("general.cta") || "Discover Our Services"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Right column – Image - With dark mode support */}
            <div
              className={`relative transition-all duration-700 ease-out delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className={`absolute -top-6 -right-6 w-64 h-64 ${isDark ? 'bg-[#2A3380]/10' : 'bg-[#2A3380]/20'} rounded-full blur-3xl opacity-70`} />
              <div className={`absolute -bottom-6 -left-6 w-64 h-64 ${isDark ? 'bg-[#0EA5E9]/10' : 'bg-[#0EA5E9]/20'} rounded-full blur-3xl opacity-70`} />
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 ${isDark ? 'bg-[#2A3380]/5' : 'bg-[#2A3380]/10'} rounded-full blur-3xl`} />

              <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'shadow-[#2A3380]/10' : 'shadow-[#2A3380]/15'} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="aspect-[4/3] relative">
                  <Image
                    src={GENERAL_IMAGE.src}
                    alt={GENERAL_IMAGE.alt}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SERVICES SECTION - DYNAMIC FROM API - CENTERED
          WITH DARK MODE SUPPORT
          ============================================================ */}
      <section className={`py-16 sm:py-20 px-4 sm:px-6 lg:px-8 ${servicesSectionBg} relative overflow-hidden transition-colors duration-300`}>
        <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-white'} pointer-events-none`} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header - Centered - With dark mode support */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 ${isDark ? 'bg-[#2A3380]/20' : 'bg-[#2A3380]/10'} rounded-full mb-4`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} uppercase tracking-wider`}>
                {t("hospital.dept.badge") || "Our Services"}
              </span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold ${textColor}`}>
              <span className="text-[#0EA5E9] dark:text-[#38BDF8]">{t("hospital.sec_services.title") || "Healthcare"}</span>{" "}
              <span className="text-[#2A3380] dark:text-[#4A5BCC]">{t("hospital.sec_services.subtitle") || "Services"}</span>
            </h2>
            <p className={`${textSecondary} text-sm sm:text-base mt-2 max-w-2xl mx-auto`}>
              {t("hospital.sec_services.description") || "We offer a wide range of medical services to meet all your healthcare needs."}
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className={`w-12 h-12 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
              <p className={`text-sm ${textSecondary} mt-4`}>{t("doctors.status_loading") || "Loading services..."}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className={isDark ? 'text-red-400' : 'text-red-500'}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={`mt-2 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} hover:underline`}
              >
                {t("departments.try_again") || "Retry"}
              </button>
            </div>
          ) : displayServices.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {t("departments.empty_message") || "No services available at this time."}
              </p>
            </div>
          ) : (
            /* Services Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayServices.map((service) => {
                const icon = getServiceIcon(service.category || service.name);
                const color = getServiceColor(service.category || service.name);
                const imageUrl = getImageUrl(service.image);
                
                return (
                  <ServiceCard
                    key={service.id}
                    icon={icon}
                    title={service.name}
                    description={service.description}
                    image={imageUrl || ''}
                    color={color}
                    price={service.price}
                    duration={service.duration}
                    onClick={() => {
                      window.location.href = `/services/${service.id}`;
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* View All Services Button - With dark mode support */}
          <div className="text-center mt-12">
            <Link
              href="/services"
              className={`inline-flex items-center gap-2.5 px-8 py-3.5 border-2 font-semibold text-sm rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95
                ${isDark 
                  ? 'border-[#4A5BCC] text-[#4A5BCC] hover:bg-[#4A5BCC] hover:text-white' 
                  : 'border-[#2A3380] text-[#2A3380] hover:bg-[#2A3380] hover:text-white'
                }`}
            >
              <span>{t("hospital.sec_services.view_all_btn") || "View All Services"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          NEWSLETTER SUBSCRIPTION - WITH DARK MODE SUPPORT
          ============================================================ */}
      <section className={`py-8 sm:py-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-colors duration-300`}>
        <div className="max-w-3xl mx-auto relative z-10">
          {subscribed ? (
            <div className="text-center text-[#2A3380] dark:text-[#4A5BCC]">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#0EA5E9] dark:text-[#38BDF8]" />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Thank you for subscribing!</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="text-center sm:text-left">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                  Subscribe to our news
                </h3>
              </div>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className={`px-4 py-2 text-sm rounded-full border transition-all w-full sm:w-64
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A5BCC]' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#2A3380]'
                    } focus:border-transparent focus:outline-none`}
                />
                <button
                  type="submit"
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 shadow-lg flex items-center justify-center gap-1.5
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8] text-white shadow-[#2A3380]/20 hover:shadow-xl hover:shadow-[#2A3380]/30' 
                      : 'bg-[#2A3380] hover:bg-[#1E3A8A] text-white shadow-[#2A3380]/30 hover:shadow-xl hover:shadow-[#2A3380]/40'
                    }`}
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}