'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Bell,
  BellOff,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageProvider';

// Define types
type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'am';

interface Settings {
  notifications: boolean;
  emailNotifications: boolean;
  twoFactorAuth: boolean;
  password: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    emailNotifications: true,
    twoFactorAuth: false,
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev: Settings) => ({ 
          ...prev, 
          ...parsed
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    
    setLoading(false);
  }, [router]);

  const handleToggle = (key: keyof Omit<Settings, 'password' | 'confirmPassword'>) => {
    setSettings((prev: Settings) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: Settings) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (settings.password && settings.password !== settings.confirmPassword) {
        setErrorMessage(language === 'am' ? 'የይለፍ ቃሎች አይዛመዱም' : 'Passwords do not match');
        setSaving(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const settingsToSave = {
        notifications: settings.notifications,
        emailNotifications: settings.emailNotifications,
        twoFactorAuth: settings.twoFactorAuth
      };
      
      localStorage.setItem('userSettings', JSON.stringify(settingsToSave));
      
      setSuccessMessage(language === 'am' ? 'ቅንብሮች ተሳክተዋል!' : 'Settings saved successfully!');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(language === 'am' ? 'ስህተት ተከስቷል' : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-10 w-10 border-b-2 mx-auto
            ${isDark ? 'border-[#4A5BCC]' : 'border-teal-600'}`}></div>
          <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-4 px-4 sm:py-6 sm:px-6 transition-colors duration-300
      ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Back Button - With dark mode support */}
        <Link 
          href="/" 
          className={`inline-flex items-center gap-1.5 text-sm transition-colors mb-4
            ${isDark ? 'text-gray-400 hover:text-[#4A5BCC]' : 'text-gray-600 hover:text-teal-600'}`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'am' ? 'ተመለስ' : 'Back'}</span>
        </Link>

        {/* Settings Card - With dark mode support */}
        <div className={`rounded-xl border overflow-hidden shadow-sm transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700 shadow-[#4A5BCC]/10' 
            : 'bg-white border-gray-200 shadow-sm'}`}>
          
          {/* Header - With dark mode support */}
          <div className={`px-5 py-4 sm:px-6 border-b transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center
                ${isDark ? 'bg-[#4A5BCC]/20' : 'bg-teal-50'}`}>
                <SettingsIcon className={`h-5 w-5 ${isDark ? 'text-[#4A5BCC]' : 'text-teal-600'}`} />
              </div>
              <div>
                <h1 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {language === 'am' ? 'ቅንብሮች' : 'Settings'}
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'am' ? 'ቅንብሮችዎን ያስተዳድሩ' : 'Manage your preferences'}
                </p>
              </div>
            </div>
          </div>

          {/* Body - With dark mode support */}
          <div className="p-4 sm:p-5">
            {/* Success Message - With dark mode support */}
            {successMessage && (
              <div className={`mb-4 p-3 border rounded-lg flex items-center gap-2 transition-colors duration-300
                ${isDark 
                  ? 'bg-green-900/20 border-green-800 text-green-400' 
                  : 'bg-green-50 border-green-200 text-green-700'}`}>
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}
            
            {/* Error Message - With dark mode support */}
            {errorMessage && (
              <div className={`mb-4 p-3 border rounded-lg flex items-center gap-2 transition-colors duration-300
                ${isDark 
                  ? 'bg-red-900/20 border-red-800 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-700'}`}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Notifications Section - With dark mode support */}
              <div>
                <h2 className={`flex items-center gap-2 text-sm font-semibold mb-2.5
                  ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Bell className={`h-4 w-4 ${isDark ? 'text-[#4A5BCC]' : 'text-teal-600'}`} />
                  {language === 'am' ? 'ማስታወቂያዎች' : 'Notifications'}
                </h2>
                <div className="space-y-2">
                  {/* Push Notifications */}
                  <div className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300
                    ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Bell className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                          {language === 'am' ? 'ማስታወቂያዎች' : 'Push Notifications'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'am' ? 'የአፕሊኬሽን ማስታወቂያዎችን ይቀበሉ' : 'Receive app notifications'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('notifications')}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                        settings.notifications 
                          ? isDark ? 'bg-[#4A5BCC]' : 'bg-teal-600' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          settings.notifications ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email Notifications */}
                  <div className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300
                    ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <BellOff className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                          {language === 'am' ? 'የኢሜል ማስታወቂያዎች' : 'Email Notifications'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'am' ? 'የኢሜል ማስታወቂያዎችን ይቀበሉ' : 'Receive email notifications'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('emailNotifications')}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                        settings.emailNotifications 
                          ? isDark ? 'bg-[#4A5BCC]' : 'bg-teal-600' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Section - With dark mode support */}
              <div>
                <h2 className={`flex items-center gap-2 text-sm font-semibold mb-2.5
                  ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Shield className={`h-4 w-4 ${isDark ? 'text-[#4A5BCC]' : 'text-teal-600'}`} />
                  {language === 'am' ? 'ደህንነት' : 'Security'}
                </h2>
                <div className="space-y-2">
                  {/* Two-Factor Authentication */}
                  <div className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300
                    ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Lock className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                          {language === 'am' ? 'ሁለት ደረጃ ማረጋገጫ' : 'Two-Factor Authentication'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'am' ? 'ተጨማሪ ደህንነት ያክሉ' : 'Add an extra layer of security'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('twoFactorAuth')}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                        settings.twoFactorAuth 
                          ? isDark ? 'bg-[#4A5BCC]' : 'bg-teal-600' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          settings.twoFactorAuth ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Change Password - With dark mode support */}
                  <div className={`p-3 rounded-lg space-y-3 transition-colors duration-300
                    ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Lock className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                        {language === 'am' ? 'የይለፍ ቃል ለውጥ' : 'Change Password'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={settings.password}
                          onChange={handlePasswordChange}
                          placeholder={language === 'am' ? 'አዲስ የይለፍ ቃል' : 'New password'}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-300
                            ${isDark 
                              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC]' 
                              : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                            ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={settings.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder={language === 'am' ? 'የይለፍ ቃል ያረጋግጡ' : 'Confirm password'}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-300
                          ${isDark 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC]' 
                            : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button - With dark mode support */}
              <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8] text-white' 
                      : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
                >
                  {saving ? (
                    <>
                      <svg className={`animate-spin h-4 w-4 ${isDark ? 'text-white' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{language === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{language === 'am' ? 'ቅንብሮችን አስቀምጥ' : 'Save Settings'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}