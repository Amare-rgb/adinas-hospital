// D:\Afilass-general-pro\frontend\src\app\departments\detail\page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageProvider";
import { 
  ArrowLeft, 
  Heart, 
  Brain, 
  Bone, 
  Shield, 
  Ambulance, 
  Users,
  Stethoscope,
  Loader2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  CheckCircle
} from "lucide-react";
import { useState, useEffect } from "react";

// Mapping function for icons based on department name
const getDepartmentIcon = (name: string) => {
  if (!name) return { Icon: Stethoscope, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  
  const lower = name.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) 
    return { Icon: Heart, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  if (lower.includes('pediat') || lower.includes('child') || lower.includes('paed')) 
    return { Icon: Users, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  if (lower.includes('brain') || lower.includes('neuro')) 
    return { Icon: Brain, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  if (lower.includes('bone') || lower.includes('ortho')) 
    return { Icon: Bone, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  if (lower.includes('emergency') || lower.includes('trauma')) 
    return { Icon: Ambulance, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  if (lower.includes('oncol') || lower.includes('cancer')) 
    return { Icon: Shield, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
  return { Icon: Stethoscope, color: "text-[#2A3380]", bgColor: "bg-[#2A3380]/10", borderColor: "border-[#2A3380]/30" };
};

// Main component that uses useSearchParams
function DepartmentDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const isAm = language === 'am';
  const departmentId = searchParams.get('id');
  
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Translations
  const t = (key: string): string => {
    const dict: Record<string, { en: string; am: string }> = {
      'loading': { en: 'Loading department details...', am: 'የክፍል ዝርዝሮችን በማግኘት ላይ...' },
      'not_found': { en: 'Department Not Found', am: 'ክፍል አልተገኘም' },
      'not_found_message': { en: "The department you're looking for doesn't exist or has been removed.", am: 'የሚፈልጉት ክፍል የለም ወይም ተወግዷል።' },
      'back_to_all': { en: 'Back to All Departments', am: 'ወደ ሁሉም ክፍሎች ተመለስ' },
      'back': { en: 'Back to Departments', am: 'ወደ ክፍሎች ተመለስ' },
      'department': { en: 'Department', am: 'ክፍል' },
      'about': { en: 'About', am: 'ስለ' },
      'services': { en: 'Our Services', am: 'አገልግሎቶቻችን' },
      'service_1': { en: 'Specialized consultations', am: 'ልዩ ምክክር' },
      'service_2': { en: 'Advanced diagnostics', am: 'የላቀ ምርመራ' },
      'service_3': { en: 'Treatment plans', am: 'የህክምና እቅዶች' },
      'service_4': { en: 'Follow-up care', am: 'ክትትል ህክምና' },
      'hours': { en: 'Working Hours', am: 'የስራ ሰዓቶች' },
      'weekdays': { en: 'Monday - Friday', am: 'ሰኞ - አርብ' },
      'saturday': { en: 'Saturday', am: 'ቅዳሜ' },
      'sunday': { en: 'Sunday', am: 'እሁድ' },
      'closed': { en: 'Closed', am: 'ዝግ' },
      'emergency': { en: 'Emergency', am: 'ድንገተኛ' },
      'contact_location': { en: 'Contact & Location', am: 'አድራሻ እና መገኛ' },
      'location': { en: 'Felege Hiwot Area, Lake Tana Shore, Bahir Dar', am: 'ፍልገ ህይወት አካባቢ፣ ጣና ሐይቅ ዳርቻ፣ ባህር ዳር' },
      'book_appointment': { en: 'Book Appointment', am: 'ቀጠሮ ይያዙ' },
    };
    return dict[key]?.[isAm ? 'am' : 'en'] || key;
  };

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!departmentId) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/departments');
        const data = await res.json();
        
        console.log('📊 Department API Response:', data);
        
        if (data.success && Array.isArray(data.data)) {
          const found = data.data.find((dept: any) => dept.id === departmentId);
          
          if (found) {
            console.log('✅ Found department:', found);
            setDepartment(found);
            setError(false);
          } else {
            console.error('❌ Department not found with ID:', departmentId);
            setError(true);
          }
        } else {
          console.error('❌ Invalid API response:', data);
          setError(true);
        }
      } catch (error) {
        console.error('❌ Failed to fetch department:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [departmentId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <div className="container mx-auto px-4 py-20 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#2A3380] mx-auto mb-4" />
            <p className="text-foreground/70">{t('loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !department) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <div className="container mx-auto px-4 py-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-6">🔍</div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {t('not_found')}
              </h1>
              <p className="text-foreground/70 mb-8">
                {t('not_found_message')}
              </p>
              <button
                onClick={() => router.push("/departments")}
                className="inline-flex items-center justify-center gap-2 bg-[#2A3380] text-white px-6 py-3 rounded-lg hover:bg-[#1E3A8A] transition"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('back_to_all')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { Icon, color, bgColor, borderColor } = getDepartmentIcon(department.name || '');
  const displayName = department.name || 'Department';
  const fullDescription = department.fullDescription || department.description || '';
  const shortDescription = department.shortDescription || department.description || '';

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-[#2A3380]/5 via-white to-[#2A3380]/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[#2A3380]/30 blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#2A3380]/20 blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
            <button
              onClick={() => router.push("/departments")}
              className="inline-flex items-center gap-2 text-foreground/60 hover:text-[#2A3380] mb-4 transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>
            
            <div className="max-w-4xl">
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${bgColor} border ${borderColor} mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
                <span className={`font-medium text-sm ${color}`}>
                  {t('department')}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                {displayName}
              </h1>
              
              <p className="text-base md:text-lg text-foreground/70 max-w-2xl">
                {shortDescription.split('.')[0] || shortDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Department Details */}
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto">
            {/* About Section - Full Description */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#2A3380]" />
                {t('about')} {displayName}
              </h2>
              <div className="text-foreground/80 leading-relaxed text-base space-y-3">
                <p>{fullDescription}</p>
                
                {/* Department details */}
                {department.code && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-foreground/60">
                      <span className="font-semibold text-foreground/80">Department Code:</span> {department.code}
                    </p>
                  </div>
                )}
                {department.location && (
                  <p className="text-sm text-foreground/60">
                    <span className="font-semibold text-foreground/80">Location:</span> {department.location}
                  </p>
                )}
                {department.phone && (
                  <p className="text-sm text-foreground/60">
                    <span className="font-semibold text-foreground/80">Phone:</span> {department.phone}
                  </p>
                )}
                {department.email && (
                  <p className="text-sm text-foreground/60">
                    <span className="font-semibold text-foreground/80">Email:</span> {department.email}
                  </p>
                )}
              </div>
            </div>

            {/* Services and Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#2A3380]/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-[#2A3380]" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t('services')}
                  </h3>
                </div>
                <ul className="space-y-2 text-foreground/70 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A3380]"></div>
                    {t('service_1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A3380]"></div>
                    {t('service_2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A3380]"></div>
                    {t('service_3')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2A3380]"></div>
                    {t('service_4')}
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#2A3380]/10 rounded-lg">
                    <Clock className="w-5 h-5 text-[#2A3380]" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t('hours')}
                  </h3>
                </div>
                <ul className="space-y-2 text-foreground/70 text-sm">
                  <li className="flex items-center justify-between">
                    <span>{t('weekdays')}</span>
                    <span className="font-medium">8:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{t('saturday')}</span>
                    <span className="font-medium">9:00 AM - 2:00 PM</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{t('sunday')}</span>
                    <span className="font-medium text-[#2A3380]">{t('closed')}</span>
                  </li>
                  <li className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[#2A3380] font-medium">{t('emergency')}</span>
                    <span className="font-medium text-red-500">24/7</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2A3380]" />
                {t('contact_location')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-foreground/70 text-sm">
                    <Phone className="w-4 h-4 text-[#2A3380]" />
                    <span>+251 98 320 1998</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/70 text-sm">
                    <Mail className="w-4 h-4 text-[#2A3380]" />
                    <span>info@afilas.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground/70 text-sm">
                    <MapPin className="w-4 h-4 text-[#2A3380]" />
                    <span>{t('location')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/appointments/hospital")}
                    className="flex-1 bg-[#2A3380] hover:bg-[#1E3A8A] text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Calendar className="w-4 h-4" />
                    {t('book_appointment')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Loading fallback for Suspense
function DepartmentDetailFallback() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#2A3380] mx-auto mb-4" />
          <p className="text-foreground/70">Loading department...</p>
        </div>
      </main>
    </div>
  );
}

// Main page component with Suspense boundary
export default function DepartmentDetailPage() {
  return (
    <Suspense fallback={<DepartmentDetailFallback />}>
      <DepartmentDetailContent />
    </Suspense>
  );
}