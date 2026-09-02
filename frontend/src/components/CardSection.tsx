// components/CardSection.tsx
'use client';

import { useLanguage } from "@/contexts/LanguageProvider";
import { useTheme } from "@/contexts/ThemeProvider";
import { 
  Heart, 
  Users, 
  Stethoscope, 
  Award, 
  Shield, 
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  Calendar,
  Sparkles,
  ChevronRight,
  Hospital,
  Activity,
  Pill,
  Microscope,
  Bone,
  Brain,
  Baby,
  Eye
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CardSection() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#E8F4F8] via-[#F0F8FF] to-[#F5FAFF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto">
        {/* Section Header - Adinas General Hospital Bahir Dar */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 rounded-full mb-4">
            <Building2 className="w-4 h-4 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            <span className="text-xs font-semibold text-[#0EA5E9] dark:text-[#4A5BCC] uppercase tracking-wider">
              {t("card.badge") || "Adinas General Hospital - Bahir Dar"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="text-[#1a3a4a] dark:text-white">
              {t("card.title") || "Your trusted healthcare destination in"}
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#0EA5E9] to-[#2A3380] bg-clip-text text-transparent">
              {t("card.title_highlight") || "Bahir Dar"}
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
            {t("card.subtitle") || "In the heart of Bahir Dar, our dedicated team of 250+ professionals delivers safe, efficient, and patient-centered services for every member of your family."}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 - Compassionate Care */}
          <div className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer
            ${isDark 
              ? 'bg-gray-800/50 border-gray-700 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20' 
              : 'bg-white/80 backdrop-blur-sm border-[#B3E0F2]/30 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Heart className="w-7 h-7 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a4a] dark:text-white mb-2">
              {t("card.card1_title") || "Compassionate Care"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("card.card1_desc") || "Providing personalized, empathetic healthcare services with a focus on patient well-being and comfort in Bahir Dar."}
            </p>
            <Link href="#" className="inline-flex items-center gap-1 mt-4 text-[#0EA5E9] dark:text-[#4A5BCC] font-semibold text-sm group-hover:gap-2 transition-all">
              {t("card.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2 - Expert Team */}
          <div className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer
            ${isDark 
              ? 'bg-gray-800/50 border-gray-700 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20' 
              : 'bg-white/80 backdrop-blur-sm border-[#B3E0F2]/30 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a4a] dark:text-white mb-2">
              {t("card.card2_title") || "Expert Team"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("card.card2_desc") || "250+ dedicated professionals delivering safe, efficient, and patient-centered services in Bahir Dar."}
            </p>
            <Link href="#" className="inline-flex items-center gap-1 mt-4 text-[#0EA5E9] dark:text-[#4A5BCC] font-semibold text-sm group-hover:gap-2 transition-all">
              {t("card.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3 - Comprehensive Services */}
          <div className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer
            ${isDark 
              ? 'bg-gray-800/50 border-gray-700 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20' 
              : 'bg-white/80 backdrop-blur-sm border-[#B3E0F2]/30 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Stethoscope className="w-7 h-7 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a4a] dark:text-white mb-2">
              {t("card.card3_title") || "Comprehensive Services"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("card.card3_desc") || "From preventive checkups to advanced treatments, we guide you through every step of your health journey in Bahir Dar."}
            </p>
            <Link href="#" className="inline-flex items-center gap-1 mt-4 text-[#0EA5E9] dark:text-[#4A5BCC] font-semibold text-sm group-hover:gap-2 transition-all">
              {t("card.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 4 - 24/7 Emergency */}
          <div className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer
            ${isDark 
              ? 'bg-gray-800/50 border-gray-700 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20' 
              : 'bg-white/80 backdrop-blur-sm border-[#B3E0F2]/30 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-7 h-7 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a4a] dark:text-white mb-2">
              {t("card.card4_title") || "24/7 Emergency Care"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("card.card4_desc") || "Round-the-clock emergency services with rapid response teams for critical and urgent medical conditions in Bahir Dar."}
            </p>
            <Link href="#" className="inline-flex items-center gap-1 mt-4 text-[#0EA5E9] dark:text-[#4A5BCC] font-semibold text-sm group-hover:gap-2 transition-all">
              {t("card.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 5 - Advanced Technology */}
          <div className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer
            ${isDark 
              ? 'bg-gray-800/50 border-gray-700 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20' 
              : 'bg-white/80 backdrop-blur-sm border-[#B3E0F2]/30 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-7 h-7 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a4a] dark:text-white mb-2">
              {t("card.card5_title") || "Advanced Technology"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("card.card5_desc") || "State-of-the-art medical equipment and cutting-edge technology for accurate diagnosis and effective treatment in Bahir Dar."}
            </p>
            <Link href="#" className="inline-flex items-center gap-1 mt-4 text-[#0EA5E9] dark:text-[#4A5BCC] font-semibold text-sm group-hover:gap-2 transition-all">
              {t("card.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 6 - Patient-Centered */}
          <div className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer
            ${isDark 
              ? 'bg-gray-800/50 border-gray-700 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20' 
              : 'bg-white/80 backdrop-blur-sm border-[#B3E0F2]/30 hover:border-[#0EA5E9]/50 hover:shadow-[#0EA5E9]/20'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#B3E0F2]/30 dark:bg-[#2A3380]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Award className="w-7 h-7 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            </div>
            <h3 className="text-xl font-bold text-[#1a3a4a] dark:text-white mb-2">
              {t("card.card6_title") || "Patient-Centered Approach"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t("card.card6_desc") || "Personalized care plans tailored to individual needs, ensuring the best possible outcomes for every patient in Bahir Dar."}
            </p>
            <Link href="#" className="inline-flex items-center gap-1 mt-4 text-[#0EA5E9] dark:text-[#4A5BCC] font-semibold text-sm group-hover:gap-2 transition-all">
              {t("card.learn_more") || "Learn More"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Bottom Description - Bahir Dar */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#0EA5E9] dark:text-[#4A5BCC]" />
            <span className="text-sm font-medium text-[#1a3a4a] dark:text-white">
              {t("card.location") || "Bahir Dar, Ethiopia"}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-base leading-relaxed">
            {t("card.bottom_text") || "From preventive checkups to advanced treatments, Adinas General Hospital - Bahir Dar is here to walk with you through every step of your health journey."}
          </p>
          
          {/* CTA Button - Appointment link to Bahir Dar */}
          <Link
            href="/appointments/hospital"
            className="inline-flex items-center gap-2 px-8 py-3.5 mt-6 bg-gradient-to-r from-[#0EA5E9] to-[#2A3380] hover:from-[#0EA5E9]/90 hover:to-[#2A3380]/90 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 shadow-[#0EA5E9]/30"
          >
            <Calendar className="w-5 h-5" />
            {t("card.book_appointment") || "Book an Appointment at Adinas Bahir Dar"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}