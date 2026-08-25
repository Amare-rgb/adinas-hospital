// app/services/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageProvider";
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
// SERVICE CARD COMPONENT
// ============================================================

function ServiceCard({ service }: { service: Service }) {
  const { t } = useLanguage();
  const icon = getServiceIcon(service.category, service.name);
  const color = getServiceColor(service.category, service.name);
  const imageUrl = getImageUrl(service.image);

  return (
    <Link
      href={`/services/${service.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[#2A3380]/30 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
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
          <div className="flex items-center justify-center h-full bg-gray-100">
            <span className="text-6xl text-gray-300">🏥</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[10px] px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 font-medium rounded-full">
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
        <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#2A3380]">
          {icon}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{service.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
        
        {/* Price */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm font-bold text-[#2A3380]">
              {formatCurrency(service.price)}
            </p>
            <p className="text-[10px] text-gray-400">{service.location || 'Adinas General Hospital'}</p>
          </div>
          <div className="text-sm font-medium text-[#2A3380] group-hover:text-[#0EA5E9] transition-colors">
            Learn More →
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// SERVICES CONTENT
// ============================================================

function ServicesContent() {
  const { t } = useLanguage();
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
        
        // Filter active services
        servicesData = servicesData.filter(s => s.isActive !== false);
        
        setServices(servicesData);
        setFilteredServices(servicesData);

        // Extract unique categories
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

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-[#2A3380] animate-spin" />
        <p className="text-sm text-gray-500 mt-4">Loading services...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-[#2A3380] hover:underline"
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

      <main className="bg-background text-foreground transition-colors duration-300 min-h-screen">
        {/* ==========================================================================
           1. SERVICES HERO & DYNAMIC BREADCRUMBS SECTION
           ========================================================================== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#2A3380]/10 via-background to-background border-b border-border/50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          {/* Ambient background light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden opacity-30">
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#2A3380]/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Dynamic Breadcrumbs: Home > Services */}
            <nav className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground mb-6 flex-wrap">
              <Link href="/" className="hover:text-[#2A3380] transition-colors">
                {t("nav.home")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-semibold">
                {t("nav.services")}
              </span>
            </nav>

            {/* Badge & Headline */}
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2A3380]/10 border border-[#2A3380]/20 text-[#2A3380] text-xs sm:text-sm font-semibold mb-4">
                <Stethoscope className="w-4 h-4" />
                <span>{t("services.hero.badge") || "Complete Medical Care"}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4 sm:mb-6 leading-tight">
                {t("services.hero.title") || "Our Healthcare Services"}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {t("services.hero.subtitle") || "Explore our comprehensive range of specialized medical services."}
              </p>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           2. SEARCH AND FILTER SECTION
           ========================================================================== */}
        <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40 bg-card/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              {categories.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent appearance-none bg-white text-sm"
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
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
              
              <div className="text-sm text-gray-500">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
           3. SERVICES GRID
           ========================================================================== */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {filteredServices.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Services Found</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'No services available at this time.'}
                </p>
                {(searchTerm || selectedCategory) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-[#2A3380] hover:underline text-sm"
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
           4. EMERGENCY & BOOKING QUICK CTA BANNER
           ========================================================================== */}
        <section className="bg-[#2A3380]/5 border-t border-border py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Need Immediate Medical Care or Consultation?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our emergency department and specialist doctors are available round-the-clock at Adinas General Hospital.
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
                className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#2A3380]/10 transition-all shadow-sm active:scale-95"
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

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2A3380] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}