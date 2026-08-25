'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  Loader2,
  UserCircle,
  Users,
  Home,
  ChevronRight,
  ChevronLeft,
  Crosshair,
  Navigation,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageProvider';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import
import api from '@/lib/api';
import { Appointment } from '@/lib/types';

// ============================================================
// SCHEMA DEFINITION
// ============================================================
const hospitalBookingSchema = z.object({
  patientName: z.string().min(2, 'Full name is required'),
  patientPhone: z.string().min(10, 'Valid phone number is required'),
  patientEmail: z.string().email('A valid email is required'),
  patientAge: z.string().optional(),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  visitType: z.enum(['HOSPITAL', 'HOME']),
  city: z.string().optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
  homeAddress: z.string().optional(),
  gpsPin: z.string().optional(),
  departmentId: z.string().optional(),
  doctorId: z.string().optional(),
});

type HospitalBookingData = z.infer<typeof hospitalBookingSchema>;

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function HospitalBookingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  const isAm = language === 'am';

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState<HospitalBookingData | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Fetch Data States
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const t = (key: string): string => {
    const dict: Record<string, { en: string; am: string }> = {
      title: { en: 'Adinas General Hospital', am: 'አዲናስ አጠቃላይ ሆስፒታል' },
      subtitle: { en: 'Book your medical appointment', am: 'የሕክምና ቀጠሮዎን ይያዙ' },
      step1: { en: 'Personal Info', am: 'የግል መረጃ' },
      step2: { en: 'Visit Details', am: 'የጉብኝት ዝርዝር' },
      personalTitle: { en: 'Personal Information', am: 'የግል መረጃዎ' },
      personalSubtitle: { en: 'Please provide your personal details', am: 'እባክዎን የግል መረጃዎን ያስገቡ' },
      fullName: { en: 'Full Name *', am: 'ሙሉ ስም *' },
      fullNamePlaceholder: { en: 'Enter your full name', am: 'ሙሉ ስምዎን ያስገቡ' },
      phone: { en: 'Phone Number *', am: 'ስልክ ቁጥር *' },
      phonePlaceholder: { en: '+251 9XX XXX XXX', am: '+251 9XX XXX XXX' },
      email: { en: 'Email Address *', am: 'ኢሜይል አድራሻ *' },
      emailPlaceholder: { en: 'your@email.com', am: 'እርስዎ@ኢሜይል.ኮም' },
      age: { en: 'Age', am: 'ዕድሜ' },
      agePlaceholder: { en: 'Enter your age', am: 'ዕድሜዎን ያስገቡ' },
      gender: { en: 'Gender', am: 'ጾታ' },
      selectGender: { en: 'Select Gender', am: 'ጾታ ይምረጡ' },
      male: { en: 'Male', am: 'ወንድ' },
      female: { en: 'Female', am: 'ሴት' },
      other: { en: 'Other', am: 'ሌላ' },
      next: { en: 'Next', am: 'ቀጣይ' },
      visitTitle: { en: 'Visit Details', am: 'የጉብኝት ዝርዝር' },
      visitSubtitle: { en: 'Tell us about your visit', am: 'ስለ ጉብኝትዎ ይንገሩን' },
      visitType: { en: 'Visit Type *', am: 'የጉብኝት ዓይነት *' },
      hospitalVisit: { en: 'Hospital Visit', am: 'የሆስፒታል ጉብኝት' },
      homeVisit: { en: 'Home Visit 🏠', am: 'የቤት ጉብኝት 🏠' },
      homeAddressTitle: { en: 'Home Address Details', am: 'የቤት አድራሻ ዝርዝር' },
      homeAddressSubtitle: { en: 'Please provide your home address', am: 'እባክዎን የቤት አድራሻዎን ያስገቡ' },
      city: { en: 'City', am: 'ከተማ' },
      cityPlaceholder: { en: 'Bahir Dar', am: 'ባሕር ዳር' },
      subCity: { en: 'Sub-City', am: 'ክፍለ ከተማ' },
      subCityPlaceholder: { en: 'Kebele 13', am: 'ቀበሌ 13' },
      woreda: { en: 'Woreda', am: 'ወረዳ' },
      woredaPlaceholder: { en: 'Woreda 03', am: 'ወረዳ 03' },
      gpsPin: { en: 'GPS Pin / Location', am: 'ጂፒኤስ / ቦታ' },
      gpsPlaceholder: { en: 'Click crosshair to get location', am: 'ቦታ ለማግኘት መስቀለኛውን ይጫኑ' },
      gpsHelp: { en: "Click the crosshair to use your device's GPS", am: 'የመሳሪያዎን ጂፒኤስ ለመጠቀም መስቀለኛውን ይጫኑ' },
      detailedAddress: { en: 'Detailed Address', am: 'ዝርዝር አድራሻ' },
      detailedAddressPlaceholder: { en: 'House number, building, landmarks...', am: 'የቤት ቁጥር፣ ሕንፃ፣ ምልክት...' },
      symptoms: { en: 'Symptoms', am: 'የሕመም ምልክቶች' },
      symptomsPlaceholder: { en: 'Describe your symptoms (e.g., Headache, fever, cough...)', am: 'የሕመም ምልክቶችዎን ይግለጹ (ምሳሌ፡ ራስ ምታት፣ ትኩሳት...)' },
      notes: { en: 'Additional Notes', am: 'ተጨማሪ ማስታወሻዎች' },
      notesPlaceholder: { en: 'Allergies, medical history, special requests...', am: 'አለርጂዎች፣ የሕክምና ታሪክ...' },
      back: { en: 'Back', am: 'ተመለስ' },
      book: { en: 'Book', am: 'ያዝ' },
      booking: { en: 'Booking...', am: 'በመያዝ ላይ...' },
      confirmed: { en: 'Confirmed! ✅', am: 'ተረጋግጧል! ✅' },
      confirmedSubtitle: { en: 'Your appointment has been booked.', am: 'ቀጠሮዎ በተሳካ ሁኔታ ተይዟል።' },
      patientLabel: { en: 'Patient:', am: 'ታካሚ፡' },
      emailLabel: { en: 'Email:', am: 'ኢሜይል፡' },
      phoneLabel: { en: 'Phone:', am: 'ስልክ፡' },
      ageLabel: { en: 'Age:', am: 'ዕድሜ፡' },
      genderLabel: { en: 'Gender:', am: 'ጾታ፡' },
      visitTypeLabel: { en: 'Visit Type:', am: 'የጉብኝት ዓይነት፡' },
      dateLabel: { en: 'Date:', am: 'ቀን፡' },
      timeLabel: { en: 'Time:', am: 'ሰዓት፡' },
      bookingIdLabel: { en: 'Booking ID:', am: 'የቀጠሮ መለያ፡' },
      homeBtn: { en: 'Home', am: 'መነሻ' },
      printBtn: { en: 'Print', am: 'አትም' },
      termsText: { en: 'By booking, you agree to our terms and conditions', am: 'በመመዝገብ በውሎቻችን እና ሁኔታዎቻችን ይስማማሉ' },
      loadingText: { en: 'Loading...', am: 'በመጫን ላይ...' },
      selectDepartment: { en: 'Select Department', am: 'ክፍል ይምረጡ' },
      selectDoctor: { en: 'Select Doctor', am: 'ሐኪም ይምረጡ' },
      department: { en: 'Department', am: 'ክፍል' },
      doctor: { en: 'Doctor', am: 'ሐኪም' },
    };
    return dict[key]?.[isAm ? 'am' : 'en'] || key;
  };

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<HospitalBookingData>({
    resolver: zodResolver(hospitalBookingSchema),
    defaultValues: {
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      patientAge: '',
      patientGender: undefined,
      symptoms: '',
      notes: '',
      visitType: 'HOSPITAL',
      city: '',
      subCity: '',
      woreda: '',
      homeAddress: '',
      gpsPin: '',
      departmentId: '',
      doctorId: '',
    },
  });

  const visitType = watch('visitType');

  // Fetch Departments & Doctors
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoadingData(true);
        
        const deptRes = await fetch('http://localhost:5000/api/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (deptData.success && Array.isArray(deptData.data) && isMounted) {
            setDepartments(deptData.data);
          }
        }

        const docRes = await fetch('http://localhost:5000/api/doctors');
        if (docRes.ok) {
          const docData = await docRes.json();
          let apiDoctors = [];
          if (docData.success && Array.isArray(docData.data)) apiDoctors = docData.data;
          else if (Array.isArray(docData)) apiDoctors = docData;
          if (isMounted) setDoctors(apiDoctors);
        }
      } catch (err) {
        console.warn('Using mock data for departments & doctors');
        if (isMounted) {
          setDepartments([
            { id: 'dept-1', name: 'Cardiology' },
            { id: 'dept-2', name: 'Pediatrics' },
            { id: 'dept-3', name: 'Neurology' },
          ]);
          setDoctors([
            { id: 'doc-1', user: { firstName: 'Amanuel', lastName: 'Kebede' }, specialization: 'Cardiologist' },
            { id: 'doc-2', user: { firstName: 'Selam', lastName: 'Tesfaye' }, specialization: 'Pediatrician' },
          ]);
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      toast.info(isAm ? 'ቦታዎን በማግኘት ላይ...' : 'Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const gpsString = `${latitude.toFixed(6)}° N, ${longitude.toFixed(6)}° E`;
          setValue('gpsPin', gpsString);
          toast.success(isAm ? 'ቦታው ተይዟል! 📍' : 'Location captured successfully! 📍');
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error(isAm ? 'ቦታ ማግኘት አልተቻለም' : 'Failed to get your location.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast.error(isAm ? 'ጂኦሎኬሽን በብራውዘርዎ አልተደገፈም' : 'Geolocation is not supported by your browser.');
    }
  };

  const nextStep = async () => {
    const step1Fields: (keyof HospitalBookingData)[] = ['patientName', 'patientPhone', 'patientEmail'];
    const isValid = await trigger(step1Fields);
    if (isValid) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: HospitalBookingData) => {
    setIsSubmitting(true);
    setErrorDetails('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = isAm ? 'እባክዎን መጀመሪያ ይግቡ' : 'Please login first';
        toast.error(errorMsg);
        router.push('/login');
        return;
      }

      const location = 'Adinas General Hospital';
      const now = new Date();
      const appointmentDate = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeSlot = `${hours}:${minutes}`;

      const payload: Record<string, unknown> = {
        patientName: data.patientName.trim(),
        patientEmail: data.patientEmail.trim(),
        patientPhone: data.patientPhone.trim(),
        date: appointmentDate,
        time: timeSlot,
        location: location,
        notes: data.notes?.trim() || '',
        symptoms: data.symptoms?.trim() || '',
        isEmergency: false,
        visitType: data.visitType,
        departmentId: data.departmentId || null,
        doctorId: data.doctorId || null,
      };

      if (data.patientAge) payload.patientAge = parseInt(data.patientAge);
      if (data.patientGender) payload.patientGender = data.patientGender;
      if (data.visitType === 'HOME') {
        payload.city = data.city || null;
        payload.subCity = data.subCity || null;
        payload.woreda = data.woreda || null;
        payload.gpsPin = data.gpsPin || null;
        payload.homeAddress = data.homeAddress || null;
      }

      const response = await api.post('/appointments', payload);
      const appointmentData = api.extractData<Appointment>(response);

      console.log('✅ Appointment created:', appointmentData);

      const payRes = await fetch('http://localhost:5000/api/payment/initiate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 500,
          email: data.patientEmail,
          first_name: data.patientName.split(' ')[0],
          last_name: data.patientName.split(' ').slice(1).join(' ') || 'Patient',
          phone: data.patientPhone,
          appointment_id: appointmentData.id,
          doctor_name: 'General Hospital',
        }),
      });

      const payData = await payRes.json();
      console.log('💰 Payment response:', payData);

      if (payData.success && payData.checkout_url) {
        window.location.href = payData.checkout_url;
      } else {
        setCreatedAppointment(appointmentData);
        setBookingData(data);
        setShowConfirmation(true);
        toast.success(isAm ? 'ቀጠሮዎ ተይዟል! 🎉' : 'Appointment booked successfully! 🎉');
      }
    } catch (error: any) {
      console.error('❌ Booking error:', error);
      
      let errorMessage = isAm 
        ? 'ቀጠሮ መያዝ አልተቻለም። እባክዎን ደግመው ይሞክሩ።' 
        : 'Failed to book appointment. Please try again.';
      
      if (error.status === 401 || error.message?.includes('401')) {
        errorMessage = isAm ? 'እባክዎን መጀመሪያ ይግቡ' : 'Please login first';
        localStorage.removeItem('token');
        router.push('/login');
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.error) {
        errorMessage = error.data.error;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      setErrorDetails(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirmation && bookingData) {
    return (
      <div className={`min-h-screen transition-colors duration-300
        ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-background text-foreground'}`}>
        <Header />
        <div className="flex items-center justify-center p-4 pt-32 pb-12">
          <div className={`max-w-md w-full rounded-2xl shadow-xl p-6 border transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700 text-gray-100' 
              : 'bg-card text-card-foreground border-border'}`}>
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3
                ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                <Check className={`w-7 h-7 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-foreground'}`}>{t('confirmed')}</h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('confirmedSubtitle')}</p>
              
              <div className={`mt-4 p-4 rounded-xl text-left space-y-2 max-h-60 overflow-y-auto border transition-colors duration-300
                ${isDark 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-muted/50 border-border'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('patientLabel')}</span> {bookingData.patientName}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('emailLabel')}</span> {bookingData.patientEmail}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('phoneLabel')}</span> {bookingData.patientPhone}
                </p>
                {bookingData.patientAge && (
                  <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                    <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('ageLabel')}</span> {bookingData.patientAge}
                  </p>
                )}
                {bookingData.patientGender && (
                  <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                    <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('genderLabel')}</span> {bookingData.patientGender}
                  </p>
                )}
                <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('visitTypeLabel')}</span> {bookingData.visitType === 'HOSPITAL' ? t('hospitalVisit') : t('homeVisit')}
                </p>
                {bookingData.visitType === 'HOME' && (
                  <>
                    {bookingData.city && (
                      <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                        <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('city')}:</span> {bookingData.city}
                      </p>
                    )}
                    {bookingData.subCity && (
                      <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                        <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('subCity')}:</span> {bookingData.subCity}
                      </p>
                    )}
                    {bookingData.woreda && (
                      <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                        <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('woreda')}:</span> {bookingData.woreda}
                      </p>
                    )}
                    {bookingData.homeAddress && (
                      <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                        <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('detailedAddress')}:</span> {bookingData.homeAddress}
                      </p>
                    )}
                    {bookingData.gpsPin && (
                      <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                        <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('gpsPin')}:</span> {bookingData.gpsPin}
                      </p>
                    )}
                  </>
                )}
                <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('dateLabel')}</span> {new Date().toLocaleDateString(isAm ? 'am-ET' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                  <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('timeLabel')}</span> {new Date().toLocaleTimeString(isAm ? 'am-ET' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {createdAppointment && (
                  <p className={`text-xs ${isDark ? 'text-gray-200' : 'text-foreground'}`}>
                    <span className={`font-semibold ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{t('bookingIdLabel')}</span>{' '}
                    <span className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
                      {createdAppointment.id?.slice(0, 8) || 'N/A'}
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className={`px-4 py-2 text-white font-semibold text-xs rounded-xl transition-all shadow-md
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                      : 'bg-blue-900 hover:bg-blue-800'}`}
                >
                  {t('homeBtn')}
                </button>
                <button
                  onClick={() => window.print()}
                  className={`px-4 py-2 font-semibold text-xs rounded-xl transition-all
                    ${isDark 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-blue-100 text-blue-900 hover:bg-blue-200'}`}
                >
                  {t('printBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300
      ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-background text-foreground'}`}>
      <Header />
      <div className="py-8 px-4 flex items-center justify-center pt-28 sm:pt-32 pb-12">
        <div className="w-full max-w-md">
          <div className={`rounded-2xl shadow-xl border overflow-hidden transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700 text-gray-100' 
              : 'bg-card text-card-foreground border-border'}`}>
            <div className={`px-5 py-3.5 border-b text-white
              ${isDark ? 'bg-[#4A5BCC] border-gray-700' : 'bg-blue-900 border-border'}`}>
              <h1 className="text-base font-bold text-center">
                {t('title')}
              </h1>
              <p className="text-xs text-white/80 text-center mt-0.5">
                {t('subtitle')}
              </p>
            </div>

            <div className="p-4 sm:p-5">
              {loadingData ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-[#4A5BCC]' : 'text-blue-900'}`} />
                  <span className={`ml-2.5 text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    {t('loadingText')}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Step indicators - With dark mode support */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors 
                        ${currentStep >= 1 
                          ? isDark 
                            ? 'bg-[#4A5BCC] text-white shadow-sm' 
                            : 'bg-blue-900 text-white shadow-sm' 
                          : isDark 
                            ? 'bg-gray-700 text-gray-500' 
                            : 'bg-muted text-muted-foreground'}`}>
                        1
                      </div>
                      <span className={`text-xs font-semibold ${currentStep === 1 ? (isDark ? 'text-white font-bold' : 'text-foreground font-bold') : (isDark ? 'text-gray-500' : 'text-muted-foreground')}`}>
                        {t('step1')}
                      </span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-3 ${isDark ? 'bg-gray-700' : 'bg-border'}`}>
                      <div className={`h-full ${isDark ? 'bg-[#4A5BCC]' : 'bg-blue-900'} transition-all duration-300 ${currentStep === 2 ? 'w-full' : 'w-0'}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors 
                        ${currentStep >= 2 
                          ? isDark 
                            ? 'bg-[#4A5BCC] text-white shadow-sm' 
                            : 'bg-blue-900 text-white shadow-sm' 
                          : isDark 
                            ? 'bg-gray-700 text-gray-500' 
                            : 'bg-muted text-muted-foreground'}`}>
                        2
                      </div>
                      <span className={`text-xs font-semibold ${currentStep === 2 ? (isDark ? 'text-white font-bold' : 'text-foreground font-bold') : (isDark ? 'text-gray-500' : 'text-muted-foreground')}`}>
                        {t('step2')}
                      </span>
                    </div>
                  </div>

                  {/* Step 1 - With dark mode support */}
                  {currentStep === 1 && (
                    <div className="space-y-3 pt-1">
                      <div className={`border-b pb-1.5 ${isDark ? 'border-gray-700' : 'border-border'}`}>
                        <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-foreground'}`}>
                          <UserCircle className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-blue-900'}`} />
                          {t('personalTitle')}
                        </h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                          {t('personalSubtitle')}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                            {t('fullName')}
                          </label>
                          <input
                            {...register('patientName')}
                            type="text"
                            placeholder={t('fullNamePlaceholder')}
                            dir="ltr"
                            className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                              ${isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                : 'bg-background border-border text-foreground'}`}
                          />
                          {errors.patientName && (
                            <p className="mt-1 text-[10px] text-destructive font-medium">{errors.patientName.message}</p>
                          )}
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                            {t('phone')}
                          </label>
                          <input
                            {...register('patientPhone')}
                            type="tel"
                            placeholder={t('phonePlaceholder')}
                            dir="ltr"
                            className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                              ${isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                : 'bg-background border-border text-foreground'}`}
                          />
                          {errors.patientPhone && (
                            <p className="mt-1 text-[10px] text-destructive font-medium">{errors.patientPhone.message}</p>
                          )}
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                            {t('email')}
                          </label>
                          <input
                            {...register('patientEmail')}
                            type="email"
                            placeholder={t('emailPlaceholder')}
                            dir="ltr"
                            className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                              ${isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                : 'bg-background border-border text-foreground'}`}
                          />
                          {errors.patientEmail && (
                            <p className="mt-1 text-[10px] text-destructive font-medium">{errors.patientEmail.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                              {t('age')}
                            </label>
                            <input
                              {...register('patientAge')}
                              type="number"
                              placeholder={t('agePlaceholder')}
                              min="0"
                              max="150"
                              dir="ltr"
                              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                                ${isDark 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                  : 'bg-background border-border text-foreground'}`}
                            />
                          </div>

                          <div>
                            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                              {t('gender')}
                            </label>
                            <select
                              {...register('patientGender')}
                              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                                ${isDark 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-background border-border text-foreground'}`}
                            >
                              <option value="">{t('selectGender')}</option>
                              <option value="MALE">{t('male')}</option>
                              <option value="FEMALE">{t('female')}</option>
                              <option value="OTHER">{t('other')}</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={nextStep}
                          className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-white font-semibold rounded-xl transition-all text-xs shadow-md mt-3
                            ${isDark 
                              ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                              : 'bg-blue-900 hover:bg-blue-800'}`}
                        >
                          {t('next')}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 - With dark mode support */}
                  {currentStep === 2 && (
                    <div className="space-y-3 pt-1">
                      <div className={`border-b pb-1.5 ${isDark ? 'border-gray-700' : 'border-border'}`}>
                        <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-foreground'}`}>
                          <Users className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-blue-900'}`} />
                          {t('visitTitle')}
                        </h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                          {t('visitSubtitle')}
                        </p>
                      </div>

                      {/* Department & Doctor Dropdowns - With dark mode support */}
                      <div className="space-y-2">
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                            {t('department')}
                          </label>
                          <select
                            {...register('departmentId')}
                            className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                              ${isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-background border-border text-foreground'}`}
                          >
                            <option value="">{t('selectDepartment')}</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                            {t('doctor')}
                          </label>
                          <select
                            {...register('doctorId')}
                            className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                              ${isDark 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-background border-border text-foreground'}`}
                          >
                            <option value="">{t('selectDoctor')}</option>
                            {doctors.map((doc) => {
                              const fullName = doc.user 
                                ? `Dr. ${doc.user.firstName} ${doc.user.lastName}` 
                                : doc.name || 'Doctor';
                              return (
                                <option key={doc.id} value={doc.id}>
                                  {fullName} {doc.specialization ? `- ${doc.specialization}` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                          {t('visitType')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setValue('visitType', 'HOSPITAL')}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${visitType === 'HOSPITAL' 
                              ? isDark 
                                ? 'border-[#4A5BCC] bg-[#4A5BCC]/20 text-[#4A5BCC] shadow-sm' 
                                : 'border-blue-900 bg-blue-50 text-blue-900 shadow-sm' 
                              : isDark 
                                ? 'border-gray-600 bg-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500' 
                                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-blue-700'}`}
                          >
                            {t('hospitalVisit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue('visitType', 'HOME')}
                            className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${visitType === 'HOME' 
                              ? isDark 
                                ? 'border-[#4A5BCC] bg-[#4A5BCC]/20 text-[#4A5BCC] shadow-sm' 
                                : 'border-blue-900 bg-blue-50 text-blue-900 shadow-sm' 
                              : isDark 
                                ? 'border-gray-600 bg-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500' 
                                : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-blue-700'}`}
                          >
                            {t('homeVisit')}
                          </button>
                        </div>
                        {errors.visitType && (
                          <p className="mt-1 text-[10px] text-destructive font-medium">{errors.visitType.message}</p>
                        )}
                      </div>

                      {visitType === 'HOME' && (
                        <div className={`space-y-2 p-3 rounded-xl border transition-colors duration-300
                          ${isDark 
                            ? 'bg-gray-700/50 border-gray-600' 
                            : 'bg-muted/40 border-border'}`}>
                          <div className={`border-b pb-1 ${isDark ? 'border-gray-600' : 'border-border'}`}>
                            <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-foreground'}`}>
                              <Home className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-blue-900'}`} />
                              {t('homeAddressTitle')}
                            </h3>
                            <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {t('homeAddressSubtitle')}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                                {t('city')}
                              </label>
                              <input
                                {...register('city')}
                                type="text"
                                placeholder={t('cityPlaceholder')}
                                className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                                  ${isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                    : 'bg-background border-border text-foreground'}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                                {t('subCity')}
                              </label>
                              <input
                                {...register('subCity')}
                                type="text"
                                placeholder={t('subCityPlaceholder')}
                                className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                                  ${isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                    : 'bg-background border-border text-foreground'}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                                {t('woreda')}
                              </label>
                              <input
                                {...register('woreda')}
                                type="text"
                                placeholder={t('woredaPlaceholder')}
                                className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none
                                  ${isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                    : 'bg-background border-border text-foreground'}`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                                {t('gpsPin')}
                              </label>
                              <div className="relative">
                                <input
                                  {...register('gpsPin')}
                                  type="text"
                                  placeholder={t('gpsPlaceholder')}
                                  className={`w-full px-3 py-2 text-xs border rounded-xl pr-9 transition outline-none
                                    ${isDark 
                                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                      : 'bg-background border-border text-foreground focus:ring-2 focus:ring-blue-900 focus:border-blue-900'}`}
                                  readOnly
                                />
                                <button
                                  type="button"
                                  onClick={getCurrentLocation}
                                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors
                                    ${isDark ? 'text-gray-400 hover:text-[#4A5BCC]' : 'text-muted-foreground hover:text-blue-900'}`}
                                  title={t('gpsHelp')}
                                >
                                  <Crosshair className="w-4 h-4" />
                                </button>
                              </div>
                              <p className={`text-[10px] mt-1 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                <Navigation className={`w-3 h-3 ${isDark ? 'text-[#4A5BCC]' : 'text-blue-900'}`} />
                                {t('gpsHelp')}
                              </p>
                            </div>
                            <div>
                              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                                {t('detailedAddress')}
                              </label>
                              <textarea
                                {...register('homeAddress')}
                                rows={2}
                                placeholder={t('detailedAddressPlaceholder')}
                                className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none resize-none
                                  ${isDark 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                                    : 'bg-background border-border text-foreground'}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                          {t('symptoms')}
                        </label>
                        <textarea
                          {...register('symptoms')}
                          rows={2}
                          placeholder={t('symptomsPlaceholder')}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none resize-none
                            ${isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                              : 'bg-background border-border text-foreground'}`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-foreground/80'}`}>
                          {t('notes')}
                        </label>
                        <textarea
                          {...register('notes')}
                          rows={2}
                          placeholder={t('notesPlaceholder')}
                          className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition outline-none resize-none
                            ${isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC] focus:border-[#4A5BCC]' 
                              : 'bg-background border-border text-foreground'}`}
                        />
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={prevStep}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 font-semibold rounded-xl transition-all text-xs
                            ${isDark 
                              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                              : 'bg-blue-100 text-blue-900 hover:bg-blue-200'}`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          {t('back')}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || loadingData}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs
                            ${isDark 
                              ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                              : 'bg-blue-900 hover:bg-blue-800'}`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t('booking')}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              {t('book')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {errorDetails && (
                    <div className={`p-2.5 border rounded-xl ${isDark 
                      ? 'bg-red-900/20 border-red-800 text-red-400' 
                      : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                      <p className="text-[10px] font-medium">{errorDetails}</p>
                    </div>
                  )}

                  <p className={`text-center text-[10px] pt-1 ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`}>
                    {t('termsText')}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}