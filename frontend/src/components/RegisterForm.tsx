// components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, ArrowRight, Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageProvider';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const t = (key: string) => {
    const map: Record<string, { en: string; am: string }> = {
      'title': { en: 'Create Account', am: 'መለያ ይፍጠሩ' },
      'subtitle': { en: 'Join Adinas General Hospital', am: 'አዲናስ አጠቃላይ ሆስፒታል ይቀላቀሉ' },
      'success': { en: 'Registration Successful! 🎉', am: 'ምዝገባ ተሳክቷል! 🎉' },
      'welcome': { en: 'Welcome to Adinas General Hospital', am: 'እንኳን ወደ አዲናስ አጠቃላይ ሆስፒታል በደህና መጡ' },
      'continue': { en: 'Continue', am: 'ቀጥል' },
      'backHome': { en: 'Back to Home', am: 'ወደ መነሻ ተመለስ' },
      'firstName': { en: 'First Name', am: 'ስም' },
      'firstNamePlaceholder': { en: 'Enter first name', am: 'ስም ያስገቡ' },
      'lastName': { en: 'Last Name', am: 'የቤት ስም' },
      'lastNamePlaceholder': { en: 'Enter last name', am: 'የቤት ስም ያስገቡ' },
      'email': { en: 'Email', am: 'ኢሜል' },
      'emailPlaceholder': { en: 'you@example.com', am: 'እርስዎ@ምሳሌ.ኮም' },
      'phone': { en: 'Phone', am: 'ስልክ' },
      'phonePlaceholder': { en: '+251 9XX XXX XXX', am: '+251 9XX XXX XXX' },
      'password': { en: 'Password', am: 'የይለፍ ቃል' },
      'passwordPlaceholder': { en: 'Min 6 characters', am: 'ቢያንስ 6 ቁምፊ' },
      'confirmPassword': { en: 'Confirm Password', am: 'የይለፍ ቃል ያረጋግጡ' },
      'confirmPlaceholder': { en: 'Confirm password', am: 'የይለፍ ቃል ያረጋግጡ' },
      'errFirstName': { en: 'First name required', am: 'ስም ያስፈልጋል' },
      'errFirstNameMin': { en: 'Min 2 characters', am: 'ቢያንስ 2 ቁምፊ' },
      'errLastName': { en: 'Last name required', am: 'የቤት ስም ያስፈልጋል' },
      'errLastNameMin': { en: 'Min 2 characters', am: 'ቢያንስ 2 ቁምፊ' },
      'errEmail': { en: 'Email required', am: 'ኢሜል ያስፈልጋል' },
      'errEmailInvalid': { en: 'Valid email required', am: 'ትክክለኛ ኢሜል ያስፈልጋል' },
      'errPhone': { en: 'Phone required', am: 'ስልክ ያስፈልጋል' },
      'errPhoneInvalid': { en: 'Valid phone required', am: 'ትክክለኛ ስልክ ያስፈልጋል' },
      'errPassword': { en: 'Password required', am: 'የይለፍ ቃል ያስፈልጋል' },
      'errPasswordMin': { en: 'Min 6 characters', am: 'ቢያንስ 6 ቁምፊ' },
      'errMatch': { en: 'Passwords do not match', am: 'የይለፍ ቃሎች አይዛመዱም' },
      'create': { en: 'Create Account', am: 'መለያ ይፍጠሩ' },
      'creating': { en: 'Creating...', am: 'በመፍጠር...' },
      'signin': { en: 'Sign in', am: 'ግባ' },
      'already': { en: 'Already have an account?', am: 'መለያ አለዎት?' },
    };
    return map[key]?.[language as 'en' | 'am'] || key;
  };

  const isAm = language === 'am';

  const validate = () => {
    const e: Record<string, string> = {};
    
    if (!formData.firstName.trim()) e.firstName = t('errFirstName');
    else if (formData.firstName.trim().length < 2) e.firstName = t('errFirstNameMin');
    
    if (!formData.lastName.trim()) e.lastName = t('errLastName');
    else if (formData.lastName.trim().length < 2) e.lastName = t('errLastNameMin');
    
    if (!formData.email.trim()) e.email = t('errEmail');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = t('errEmailInvalid');
    
    if (!formData.phone.trim()) e.phone = t('errPhone');
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.trim())) e.phone = t('errPhoneInvalid');
    
    if (!formData.password) e.password = t('errPassword');
    else if (formData.password.length < 6) e.password = t('errPasswordMin');
    
    if (formData.password !== formData.confirmPassword) e.confirmPassword = t('errMatch');
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    
    try {
      // 🔥 FIXED: Send payload matching backend /users endpoint exactly
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'USER',
        location: 'Adinas General Hospital',
        isActive: true
      };
      
      console.log('📡 Registering user with payload:', payload);
      
      // 🔥 FIXED: Use /users endpoint directly (matches your backend)
      const response = await api.post('/users', payload, false);
      
      console.log('✅ Registration response:', response);
      
      toast.success('Registration successful! 🎉');
      setIsSuccess(true);
      
      setTimeout(() => {
        setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
        setIsSuccess(false);
        router.push('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      let errorMsg = 'Registration failed. Please try again.';
      
      // 🔥 FIXED: Better error message extraction
      if (error.message) {
        errorMsg = error.message;
      } else if (error.data?.message) {
        errorMsg = error.data.message;
      } else if (error.data?.error) {
        errorMsg = error.data.error;
      } else if (error.data?.errors) {
        errorMsg = error.data.errors.map((e: any) => e.msg || e.message).join(', ');
      }
      
      // Check for specific error messages
      if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('exists')) {
        errorMsg = 'This email is already registered. Please login or use a different email.';
      }
      
      toast.error(errorMsg);
      setErrors({ submit: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const inpClass = (field: string) => {
    const base = "w-full pl-8 pr-3 py-1.5 rounded-lg border-2 transition-all outline-none bg-background text-foreground text-sm";
    const err = errors[field] ? 'border-destructive bg-destructive/10' : '';
    const focus = focusedField === field ? 'border-[#2A3380] shadow-sm shadow-[#2A3380]/20' : 'border-border hover:border-[#2A3380]/50';
    return `${base} ${err || focus}`;
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-lg p-4 border border-border">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-1.5" strokeWidth={1.5} />
            <h3 className={`text-base font-bold text-green-700 dark:text-green-300 ${isAm ? 'font-medium' : ''}`}>{t('success')}</h3>
            <p className={`text-green-600 dark:text-green-400 mt-0.5 text-xs ${isAm ? 'font-medium' : ''}`}>{t('welcome')}</p>
            <div className="flex flex-col gap-1.5 mt-2.5">
              <button onClick={() => router.push('/login')} className="px-4 py-1 bg-[#2A3380] text-white rounded-lg hover:bg-[#1E3A8A] text-xs transition-colors">
                {t('continue')}
              </button>
              <Link href="/" className="px-4 py-1 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-xs flex items-center justify-center gap-1 transition-colors">
                <Home className="w-3 h-3" />{t('backHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-card rounded-2xl shadow-lg p-4 border border-border">
        <Link href="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-[#2A3380] text-xs font-medium mb-2 transition-colors">
          <ArrowLeft className="w-3 h-3" />{t('backHome')}
        </Link>

        <div className="text-center mb-3">
          <div className="flex justify-center mb-2">
            <div className="relative w-20 h-20">
              <Image 
                src="/llogo.jpg" 
                alt="Adinas General Hospital" 
                fill
                className="object-contain"
                priority 
              />
            </div>
          </div>
          <h2 className={`text-base font-bold text-[#2A3380] ${isAm ? 'font-medium' : ''}`}>{t('title')}</h2>
          <p className={`text-[10px] text-muted-foreground ${isAm ? 'font-medium' : ''}`}>{t('subtitle')}</p>
        </div>

        <form onSubmit={submit} className="space-y-2">
          {/* First Name */}
          <div>
            <label className={`block text-[10px] font-semibold text-foreground/80 mb-0.5 ${isAm ? 'font-medium' : ''}`}>{t('firstName')}</label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={change} 
                onFocus={() => setFocusedField('firstName')} 
                onBlur={() => setFocusedField(null)} 
                className={inpClass('firstName')} 
                placeholder={t('firstNamePlaceholder')} 
                dir="ltr" 
              />
            </div>
            {errors.firstName && <p className={`mt-0.5 text-[9px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className={`block text-[10px] font-semibold text-foreground/80 mb-0.5 ${isAm ? 'font-medium' : ''}`}>{t('lastName')}</label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={change} 
                onFocus={() => setFocusedField('lastName')} 
                onBlur={() => setFocusedField(null)} 
                className={inpClass('lastName')} 
                placeholder={t('lastNamePlaceholder')} 
                dir="ltr" 
              />
            </div>
            {errors.lastName && <p className={`mt-0.5 text-[9px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.lastName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className={`block text-[10px] font-semibold text-foreground/80 mb-0.5 ${isAm ? 'font-medium' : ''}`}>{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={change} 
                onFocus={() => setFocusedField('email')} 
                onBlur={() => setFocusedField(null)} 
                className={inpClass('email')} 
                placeholder={t('emailPlaceholder')} 
                dir="ltr" 
              />
            </div>
            {errors.email && <p className={`mt-0.5 text-[9px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className={`block text-[10px] font-semibold text-foreground/80 mb-0.5 ${isAm ? 'font-medium' : ''}`}>{t('phone')}</label>
            <div className="relative">
              <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={change} 
                onFocus={() => setFocusedField('phone')} 
                onBlur={() => setFocusedField(null)} 
                className={inpClass('phone')} 
                placeholder={t('phonePlaceholder')} 
                dir="ltr" 
              />
            </div>
            {errors.phone && <p className={`mt-0.5 text-[9px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label className={`block text-[10px] font-semibold text-foreground/80 mb-0.5 ${isAm ? 'font-medium' : ''}`}>{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                value={formData.password} 
                onChange={change} 
                onFocus={() => setFocusedField('password')} 
                onBlur={() => setFocusedField(null)} 
                className={`${inpClass('password')} pr-7`} 
                placeholder={t('passwordPlaceholder')} 
                dir="ltr" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-3 h-3 text-muted-foreground hover:text-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground hover:text-foreground" />}
              </button>
            </div>
            {errors.password && <p className={`mt-0.5 text-[9px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className={`block text-[10px] font-semibold text-foreground/80 mb-0.5 ${isAm ? 'font-medium' : ''}`}>{t('confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                name="confirmPassword" 
                value={formData.confirmPassword} 
                onChange={change} 
                onFocus={() => setFocusedField('confirmPassword')} 
                onBlur={() => setFocusedField(null)} 
                className={`${inpClass('confirmPassword')} pr-7`} 
                placeholder={t('confirmPlaceholder')} 
                dir="ltr" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="w-3 h-3 text-muted-foreground hover:text-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground hover:text-foreground" />}
              </button>
            </div>
            {errors.confirmPassword && <p className={`mt-0.5 text-[9px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading} 
            className={`w-full py-1.5 rounded-lg bg-[#2A3380] text-white font-semibold text-sm transition-all ${
              isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-[#1E3A8A] hover:shadow-md hover:scale-[1.01]'
            } ${isAm ? 'font-medium' : ''}`}
          >
            {isLoading ? (
              <><svg className="animate-spin h-3.5 w-3.5 text-white inline mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> {t('creating')}</>
            ) : (
              <>{t('create')} <ArrowRight className="w-3.5 h-3.5 inline" /></>
            )}
          </button>

          {/* Error Message */}
          {errors.submit && (
            <p className={`text-center text-[10px] text-destructive ${isAm ? 'font-medium' : ''}`}>{errors.submit}</p>
          )}

          {/* Login Link */}
          <p className={`text-center text-[10px] text-muted-foreground ${isAm ? 'font-medium' : ''}`}>
            {t('already')} <Link href="/login" className="text-[#2A3380] hover:text-[#1E3A8A] font-semibold hover:underline transition-colors">{t('signin')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}