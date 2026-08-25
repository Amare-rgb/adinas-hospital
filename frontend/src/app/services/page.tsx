// app/services/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useTheme } from "@/contexts/ThemeProvider"; // ✅ Added theme import
import { api } from "@/lib/api";
import { 
  Stethoscope, 
  ChevronRight, 
  Calendar,
  PhoneCall,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Syringe,
  Microscope,
  Pill,
  Building2,
  Loader2,
  ArrowRight,
  Clock,
  DollarSign,
  MapPin,
  Search,
  X
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface Service {
  id: string;
  name: string;
  description: string;
  price: number | null;
  duration: number | null;
  image: string | null;
  category: string | null;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// HELPERS
// ============================================================

const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `http://localhost:5000${cleanPath}`;
};

const getServiceIcon = (category: string | null, name: string) => {
  const lower = (category || name).toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return <Heart className="w-5 h-5" />;
  if (lower.includes('brain') || lower.includes('neuro')) return <Brain className="w-5 h-5" />;
  if (lower.includes('bone') || lower.includes('ortho')) return <Bone className="w-5 h-5" />;
  if (lower.includes('pediatric') || lower.includes('baby') || lower.includes('child')) return <Baby className="w-5 h-5" />;
  if (lower.includes('eye') || lower.includes('ophthalm')) return <Eye className="w-5 h-5" />;
  if (lower.includes('dental') || lower.includes('dent')) return <Syringe className="w-5 h-5" />;
  if (lower.includes('lab') || lower.includes('diagnostic')) return <Microscope className="w-5 h-5" />;
  if (lower.includes('pharmacy') || lower.includes('pill') || lower.includes('drug')) return <Pill className="w-5 h-5" />;
  return <Stethoscope className="w-5 h-5" />;
};

const getServiceColor = (category: string | null, name: string) => {
  const lower = (category || name).toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return '#2A3380';
  if (lower.includes('brain') || lower.includes('neuro')) return '#0EA5E9';
  if (lower.includes('bone') || lower.includes('ortho')) return '#10B981';
  if (lower.includes('pediatric') || lower.includes('baby') || lower.includes('child')) return '#F59E0B';
  if (lower.includes('eye') || lower.includes('ophthalm')) return '#8B5CF6';
  if (lower.includes('dental') || lower.includes('dent')) return '#EC4899';
  if (lower.includes('lab') || lower.includes('diagnostic')) return '#3B82F6';
  if (lower.includes('pharmacy') || lower.includes('pill') || lower.includes('drug')) return '#14B8A6';
  return '#2A3380';
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================================
// SERVICE CARD COMPONENT - With dark mode support
// ============================================================

function ServiceCard({ service }: { service: Service }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const icon = getServiceIcon(service.category, service.name);
  const color = getServiceColor(service.category, service.name);
  const imageUrl = getImageUrl(service.image);

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group rounded-xl border overflow-hidden transition-all duration-300 hover:-translate-y-1
        ${isDark 
          ? 'bg-gray-800 border-gray-700 hover:border-[#4A5BCC]/30 hover:shadow-[#4A5BCC]/20 hover:shadow-xl' 
          : 'bg-white border-gray-200 hover:border-[#2A3380]/30 hover:shadow-xl'}`}
    >
      {/* Image */}
      <div className={`relative h-48 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className={`flex items-center justify-center h-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <span className={`text-6xl ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>🏥</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-[10px] px-2 py-1 font-medium rounded-full
            ${isDark 
              ? 'bg-gray-800/90 text-gray-200' 
              : 'bg-white/90 text-gray-700'}`}>
            {service.category || 'General'}
          </span>
        </div>
        
        {/* Duration Badge */}
        {service.duration && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] px-2 py-1 bg-black/60 backdrop-blur-sm text-white font-medium rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {service.duration} min
            </span>
          </div>
        )}
        
        {/* Icon Badge */}
        <div className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-sm shadow-md flex items-center justify-center
          ${isDark 
            ? 'bg-gray-800/90 text-[#4A5BCC]' 
            : 'bg-white/90 text-[#2A3380]'}`}>
          {icon}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className={`text-lg font-bold mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {service.name}
        </h3>
        <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {service.description}
        </p>
        
        {/* Price */}
        <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
              {formatCurrency(service.price)}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {service.location || 'Adinas General Hospital'}
            </p>
          </div>
          <div className={`text-sm font-medium transition-colors
            ${isDark 
              ? 'text-[#4A5BCC] group-hover:text-[#5B6BD8]' 
              : 'text-[#2A3380] group-hover:text-[#0EA5E9]'}`}>
            Learn More →
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// SERVICES CONTENT - With dark mode support
// ============================================================

function ServicesContent() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const searchParams = useSearchParams();
  
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  const LOCATION = "Adinas General Hospital";

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<any>(`/services?location=${encodeURIComponent(LOCATION)}`);
        
        let servicesData: Service[] = [];
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
        
        setServices(servicesData);
        setFilteredServices(servicesData);

        const uniqueCategories = [...new Set(servicesData.map(s => s.category).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      } catch (error: any) {
        console.error('Failed to fetch services:', error);
        setError(error.message || 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Filter services
  useEffect(() => {
    let filtered = services;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    setFilteredServices(filtered);
  }, [searchTerm, selectedCategory, services]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  // Loading state - With dark mode support
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className={`w-12 h-12 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
        <p className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading services...
        </p>
      </div>
    );
  }

  // Error state - With dark mode support
  if (error) {
    return (
      <div className="text-center py-16">
        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className={`mt-4 ${isDark ? 'text-[#4A5BCC] hover:text-[#5B6BD8]' : 'text-[#2A3380] hover:underline'}`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Navigation Header */}
      <Header />

      <main className={`min-h-screen transition-colors duration-300
        ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-background text-foreground'}`}>
        
        {/* ==========================================================================
           1. SERVICES HERO & DYNAMIC BREADCRUMBS - With dark mode support
           ========================================================================== */}
        <section className={`relative overflow-hidden border-b transition-colors duration-300 py-12 sm:py-16 px-4 sm:px-6 lg:px-8
          ${isDark 
            ? 'bg-gradient-to-b from-[#4A5BCC]/10 via-gray-900 to-gray-900 border-gray-700' 
            : 'bg-gradient-to-b from-[#2A3380]/10 via-background to-background border-border/50'}`}>
          {/* Ambient background light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden opacity-30">
            <div className={`absolute -top-24 left-1/4 w-96 h-96 rounded-full blur-3xl
              ${isDark ? 'bg-[#4A5BCC]/10' : 'bg-[#2A3380]/20'}`} />
            <div className={`absolute top-1/2 right-1/4 w-80 h-80 rounded-full blur-3xl
              ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Dynamic Breadcrumbs - With dark mode support */}
            <nav className={`flex items-center space-x-2 text-xs sm:text-sm mb-6 flex-wrap transition-colors duration-300
              ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
              <Link href="/" className={`transition-colors ${isDark ? 'hover:text-[#4A5BCC]' : 'hover:text-[#2A3380]'}`}>
                {t("nav.home")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {t("nav.services")}
              </span>
            </nav>

            {/* Badge & Headline - With dark mode support */}
            <div className="text-center max-w-3xl mx-auto">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 border transition-colors duration-300
                ${isDark 
                  ? 'bg-[#4A5BCC]/20 border-[#4A5BCC]/30 text-[#4A5BCC]' 
                  : 'bg-[#2A3380]/10 border-[#2A3380]/20 text-[#2A3380]'}`}>
                <Stethoscope className="w-4 h-4" />
                <span>{t("services.hero.badge") || "Complete Medical Care"}</span>
              </div>

              <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight transition-colors duration-300
                ${isDark ? 'text-white' : 'text-foreground'}`}>
                {t("services.hero.title") || "Our Healthcare Services"}
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                {t("services.hero.subtitle") || "Explore our comprehensive range of specialized medical services."}
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           2. SEARCH AND FILTER SECTION - With dark mode support
           ========================================================================== */}
        <section className={`py-6 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-300
          ${isDark 
            ? 'border-gray-700 bg-gray-800/40' 
            : 'border-border/40 bg-card/40'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search services by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent text-sm transition-colors duration-300
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC]' 
                        : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>
              
              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent appearance-none text-sm transition-colors duration-300
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  className={`flex items-center gap-1 text-sm transition-colors
                    ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
              
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           3. SERVICES GRID - With dark mode support
           ========================================================================== */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {filteredServices.length === 0 ? (
              <div className={`text-center py-16 rounded-xl border transition-colors duration-300
                ${isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'}`}>
                <Building2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  No Services Found
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'No services available at this time.'}
                </p>
                {(searchTerm || selectedCategory) && (
                  <button
                    onClick={clearFilters}
                    className={`mt-4 text-sm hover:underline ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==========================================================================
           4. EMERGENCY & BOOKING QUICK CTA BANNER - With dark mode support
           ========================================================================== */}
        <section className={`border-t transition-colors duration-300 py-12 sm:py-16 px-4 sm:px-6 lg:px-8
          ${isDark 
            ? 'bg-[#4A5BCC]/5 border-gray-700' 
            : 'bg-[#2A3380]/5 border-border'}`}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="max-w-xl">
              <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300
                ${isDark ? 'text-white' : 'text-foreground'}`}>
                Need Immediate Medical Care or Consultation?
              </h3>
              <p className={`text-sm leading-relaxed transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                Our emergency department and specialist doctors are available round-the-clock at Adinas General Hospital.
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
                    : 'border-border bg-card text-foreground hover:bg-[#2A3380]/10'}`}
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

// ============================================================
// MAIN EXPORT - With dark mode support for Suspense fallback
// ============================================================

export default function ServicesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Suspense fallback={
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${isDark ? 'bg-gray-900' : 'bg-background'}`}>
        <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin
          ${isDark 
            ? 'border-[#4A5BCC]' 
            : 'border-[#2A3380]'}`} />
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}