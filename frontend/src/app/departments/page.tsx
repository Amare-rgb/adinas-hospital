// D:\Afilass-general-pro\frontend\src\app\departments\page.tsx
"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useTheme } from "@/contexts/ThemeProvider"; // ✅ Added theme import
import { 
  Heart, 
  Brain, 
  Bone, 
  Shield, 
  Ambulance, 
  Users,
  Stethoscope,
  ArrowRight,
  Loader2,
  Building2
} from "lucide-react";
import Link from "next/link";

// Mapping function for icons based on department name
const getDepartmentIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) 
    return { Icon: Heart, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" };
  if (lower.includes('pediat') || lower.includes('child')) 
    return { Icon: Users, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800" };
  if (lower.includes('brain') || lower.includes('neuro')) 
    return { Icon: Brain, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30", borderColor: "border-purple-200 dark:border-purple-800" };
  if (lower.includes('bone') || lower.includes('ortho')) 
    return { Icon: Bone, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/30", borderColor: "border-green-200 dark:border-green-800" };
  if (lower.includes('emergency') || lower.includes('trauma')) 
    return { Icon: Ambulance, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800" };
  if (lower.includes('oncol') || lower.includes('cancer')) 
    return { Icon: Shield, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30", borderColor: "border-orange-200 dark:border-orange-800" };
  return { Icon: Stethoscope, color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-950/30", borderColor: "border-indigo-200 dark:border-indigo-800" };
};

export default function DepartmentsPage() {
  const { t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/departments');
      const data = await res.json();
      
      if (data.success) {
        setDepartments(data.data || []);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Loading state - with dark mode support
  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-background'}`}>
        <Header />
        <main className="pt-32">
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-[#4A5BCC]' : 'text-primary'} mb-4`} />
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>
                {t("departments.loading") || "Loading Departments..."}
              </h2>
              <p className={isDark ? 'text-gray-400' : 'text-foreground/70'}>
                {t("departments.loading_message") || "Please wait while we fetch the departments"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state - with dark mode support
  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-background'}`}>
        <Header />
        <main className="pt-32">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-foreground'} mb-4`}>
              {t("departments.error_title") || "Something went wrong"}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-foreground/70'}>
              {t("departments.error_message") || "Could not load departments. Please try again later."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-3 rounded-lg transition hover:opacity-90
                ${isDark 
                  ? 'bg-[#4A5BCC] text-white hover:bg-[#5B6BD8]' 
                  : 'bg-primary text-primary-foreground'
                }`}
            >
              {t("departments.try_again") || "Try Again"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero Section - With dark mode support */}
        <div className={`relative border-b ${isDark ? 'border-gray-700' : 'border-border'} overflow-hidden transition-colors duration-300
          ${isDark 
            ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-r from-blue-50 via-white to-blue-50'
          }`}>
          <div className="absolute inset-0 opacity-5">
            <div className={`absolute top-20 left-10 w-64 h-64 rounded-full ${isDark ? 'bg-[#4A5BCC]/20' : 'bg-primary/30'} blur-3xl`} />
            <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full ${isDark ? 'bg-[#38BDF8]/20' : 'bg-blue-500/20'} blur-3xl`} />
          </div>
          
          <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-[#4A5BCC]/20' : 'bg-primary/10'} backdrop-blur-sm rounded-full mb-3`}>
                <Building2 className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-primary'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-[#4A5BCC]' : 'text-primary'}`}>
                  {t("departments.badge") || "Medical Services"}
                </span>
              </div>
              
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${isDark ? 'text-white' : 'text-foreground'} mb-2`}>
                {t("departments.title") || "Our Departments"}
              </h1>
              
              <p className={`text-base md:text-lg ${isDark ? 'text-gray-300' : 'text-foreground/70'} max-w-2xl mx-auto`}>
                {t("departments.subtitle") || "Explore our specialized medical departments staffed by expert healthcare professionals"}
              </p>
            </div>
          </div>
        </div>

        {/* Departments Grid - With dark mode support */}
        <div className={`container mx-auto px-4 py-10 ${isDark ? 'bg-gray-900' : 'bg-background'}`}>
          <div className="max-w-6xl mx-auto">
            {departments.length === 0 ? (
              <div className={`text-center py-16 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-card border-border'} border rounded-2xl`}>
                <Stethoscope className={`w-20 h-20 mx-auto mb-4 opacity-20 ${isDark ? 'text-gray-400' : 'text-foreground'}`} />
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-foreground'} mb-2`}>
                  {t("departments.empty_title") || "No Departments Yet"}
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-foreground/70'}>
                  {t("departments.empty_message") || "Departments will appear here once added."}
                </p>
              </div>
            ) : (
              <>
                {/* Department count - With dark mode support */}
                <div className="flex items-center justify-between mb-5">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-foreground/60'}`}>
                    {t("departments.total") || "Total"}: {departments.length} {t("departments.departments") || "Departments"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {departments.map((department) => {
                    const { Icon, color, bgColor, borderColor } = getDepartmentIcon(department.name);
                    
                    return (
                      <Link
                        key={department.id}
                        href={`/departments/dtail?id=${department.id}`}
                        className={`group ${isDark ? 'bg-gray-800 border-gray-700 hover:border-[#4A5BCC]/50' : 'bg-card border-border hover:border-primary/50'} border rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-1`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${bgColor} border ${borderColor}`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold ${isDark ? 'text-white group-hover:text-[#4A5BCC]' : 'text-foreground group-hover:text-primary'} text-base transition-colors`}>
                              {department.name}
                            </h3>
                            <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-foreground/60'}`}>
                              {department.description || `${department.name} ${t("departments.default_description") || "department providing specialized care"}`}
                            </p>
                            
                            <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${isDark ? 'text-[#4A5BCC]' : 'text-primary'}`}>
                              <span>{t("departments.learn_more") || "Learn More"}</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}