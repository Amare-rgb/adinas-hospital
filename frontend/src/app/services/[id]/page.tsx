// app/services/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useTheme } from "@/contexts/ThemeProvider"; // ✅ Added theme import
import { api } from "@/lib/api";
import { Header } from "@/components/Header";
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar, 
  Loader2,
  Heart,
  Stethoscope,
  Brain,
  Bone,
  Baby,
  Eye,
  Syringe,
  Microscope,
  Pill,
  Building2,
  CheckCircle2,
  ArrowRight
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
  if (lower.includes('cardio') || lower.includes('heart')) return <Heart className="w-6 h-6" />;
  if (lower.includes('brain') || lower.includes('neuro')) return <Brain className="w-6 h-6" />;
  if (lower.includes('bone') || lower.includes('ortho')) return <Bone className="w-6 h-6" />;
  if (lower.includes('pediatric') || lower.includes('baby') || lower.includes('child')) return <Baby className="w-6 h-6" />;
  if (lower.includes('eye') || lower.includes('ophthalm')) return <Eye className="w-6 h-6" />;
  if (lower.includes('dental') || lower.includes('dent')) return <Syringe className="w-6 h-6" />;
  if (lower.includes('lab') || lower.includes('diagnostic')) return <Microscope className="w-6 h-6" />;
  if (lower.includes('pharmacy') || lower.includes('pill') || lower.includes('drug')) return <Pill className="w-6 h-6" />;
  return <Stethoscope className="w-6 h-6" />;
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
// MAIN COMPONENT
// ============================================================

export default function ServiceDetailPage() {
  const { t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);

  // Fetch service details
  useEffect(() => {
    if (!id) {
      setError('No service ID provided');
      setLoading(false);
      return;
    }

    const fetchService = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`📡 Fetching service with ID: ${id}`);
        
        const response = await api.get<any>(`/services/${id}`);
        
        console.log('📥 Service response:', response);
        
        let serviceData: Service | null = null;
        if (response) {
          if (response.data) {
            serviceData = response.data;
          } else if (response.id) {
            serviceData = response;
          }
        }

        if (!serviceData) {
          setError('Service not found');
          setLoading(false);
          return;
        }

        setService(serviceData);

        // Fetch related services (same category)
        if (serviceData.category) {
          try {
            const relatedResponse = await api.get<any>(`/services?category=${encodeURIComponent(serviceData.category)}`);
            let relatedData: Service[] = [];
            if (relatedResponse) {
              if (Array.isArray(relatedResponse)) {
                relatedData = relatedResponse;
              } else if (relatedResponse.data && Array.isArray(relatedResponse.data)) {
                relatedData = relatedResponse.data;
              } else if (relatedResponse.services && Array.isArray(relatedResponse.services)) {
                relatedData = relatedResponse.services;
              }
            }
            relatedData = relatedData
              .filter(s => s.id !== serviceData.id && s.isActive !== false)
              .slice(0, 3);
            setRelatedServices(relatedData);
          } catch (e) {
            console.error('Failed to fetch related services:', e);
          }
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch service:', error);
        if (error.response?.status === 404) {
          setError('Service not found');
        } else {
          setError(error.message || 'Failed to load service details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  // Loading state - With dark mode support
  if (loading) {
    return (
      <>
        <Header />
        <div className={`min-h-[80vh] flex flex-col items-center justify-center transition-colors duration-300
          ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <Loader2 className={`w-12 h-12 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
          <p className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading service details...
          </p>
        </div>
      </>
    );
  }

  // Error state - With dark mode support
  if (error || !service) {
    return (
      <>
        <Header />
        <div className={`min-h-[80vh] flex flex-col items-center justify-center px-4 transition-colors duration-300
          ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`rounded-xl shadow-lg p-8 max-w-md w-full text-center border transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700 shadow-[#4A5BCC]/10' 
              : 'bg-white border-gray-200 shadow-lg'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
              ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <span className="text-3xl">🔍</span>
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Service Not Found
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {error || "The service you're looking for doesn't exist or has been removed."}
            </p>
            <Link
              href="/services"
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-lg transition-colors text-sm font-medium
                ${isDark 
                  ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                  : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </Link>
          </div>
        </div>
      </>
    );
  }

  const icon = getServiceIcon(service.category, service.name);
  const color = getServiceColor(service.category, service.name);
  const imageUrl = getImageUrl(service.image);

  return (
    <>
      <Header />
      <div className={`min-h-screen transition-colors duration-300 pt-16
        ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Simple Header - With dark mode support */}
        <div className={`border-b transition-colors duration-300 py-6 px-4 sm:px-6 lg:px-8
          ${isDark 
            ? 'border-gray-700 bg-gray-800' 
            : 'border-gray-200 bg-white'}`}>
          <div className="max-w-7xl mx-auto">
            <Link
              href="/services"
              className={`inline-flex items-center gap-2 transition-colors text-sm font-medium mb-3
                ${isDark 
                  ? 'text-[#4A5BCC] hover:text-[#5B6BD8]' 
                  : 'text-[#2A3380] hover:text-[#1E3A8A]'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </Link>
            
            <div className="flex items-start gap-4 mt-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDark ? 'bg-[#4A5BCC]/20 text-[#4A5BCC]' : 'bg-[#2A3380]/10 text-[#2A3380]'}`}>
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                    ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {service.category || 'General'}
                  </span>
                  {service.isActive && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                      Available
                    </span>
                  )}
                </div>
                <h1 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {service.name}
                </h1>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {service.location || 'Adinas General Hospital'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image - With dark mode support */}
              {imageUrl && (
                <div className={`relative w-full max-w-2xl mx-auto h-56 md:h-64 rounded-xl overflow-hidden border transition-colors duration-300
                  ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                  <Image
                    src={imageUrl}
                    alt={service.name}
                    fill
                    className="object-contain"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Description - With dark mode support */}
              <div className={`rounded-xl border p-6 transition-colors duration-300
                ${isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'}`}>
                <h2 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Description
                </h2>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {service.description || 'No description available.'}
                </p>
              </div>

              {/* Details Grid - With dark mode support */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.duration && (
                  <div className={`rounded-xl border p-4 flex items-center gap-3 transition-colors duration-300
                    ${isDark 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Duration</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {service.duration} minutes
                      </p>
                    </div>
                  </div>
                )}
                
                <div className={`rounded-xl border p-4 flex items-center gap-3 transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Price</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                </div>

                <div className={`rounded-xl border p-4 flex items-center gap-3 transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Location</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {service.location || 'Adinas General Hospital'}
                    </p>
                  </div>
                </div>

                <div className={`rounded-xl border p-4 flex items-center gap-3 transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Available</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {service.isActive ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Right - With dark mode support */}
            <div className="space-y-6">
              {/* Book Appointment Card - With dark mode support */}
              <div className={`rounded-xl border p-6 sticky top-6 transition-colors duration-300
                ${isDark 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Book This Service
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : ''}`}>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Service</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {service.name}
                    </span>
                  </div>
                  {service.duration && (
                    <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : ''}`}>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Duration</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {service.duration} min
                      </span>
                    </div>
                  )}
                  <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : ''}`}>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Price</span>
                    <span className={`font-bold ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <div className={`flex justify-between text-sm ${isDark ? 'text-gray-300' : ''}`}>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Location</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {service.location || 'Adinas General Hospital'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/appointment?service=${service.id}`}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium text-sm
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                      : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className={`text-xs mt-3 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Book now and our team will contact you shortly.
                </p>
              </div>

              {/* Related Services - With dark mode support */}
              {relatedServices.length > 0 && (
                <div className={`rounded-xl border p-6 transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Related Services
                  </h3>
                  <div className="space-y-3">
                    {relatedServices.map((related) => {
                      const relIcon = getServiceIcon(related.category, related.name);
                      return (
                        <Link
                          key={related.id}
                          href={`/services/${related.id}`}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors border
                            ${isDark 
                              ? 'border-gray-700 hover:bg-gray-700 hover:border-[#4A5BCC]/30' 
                              : 'border-gray-100 hover:bg-gray-50 hover:border-[#2A3380]/30'}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                            ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            {relIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {related.name}
                            </p>
                            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                              {related.category || 'General'}
                            </p>
                          </div>
                          <ArrowRight className={`w-4 h-4 transition-colors
                            ${isDark ? 'text-gray-500 group-hover:text-[#4A5BCC]' : 'text-gray-400 group-hover:text-[#2A3380]'}`} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}