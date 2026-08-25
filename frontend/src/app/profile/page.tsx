'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  ArrowLeft,
  Save,
  Edit2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageProvider';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
          address: parsedUser.address || '',
          role: parsedUser.role || 'User'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    setLoading(false);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = {
        ...user,
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccessMessage(language === 'am' ? 'መገለጫ ተሳክቷል!' : 'Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(language === 'am' ? 'ስህተት ተከስቷል' : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const roleMap: Record<string, string> = {
      'SUPER_ADMIN': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'ADMIN': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'DOCTOR': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'USER': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return roleMap[role?.toUpperCase()] || roleMap['USER'];
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

        {/* Profile Card - With dark mode support */}
        <div className={`rounded-xl border overflow-hidden shadow-sm transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700 shadow-[#4A5BCC]/10' 
            : 'bg-white border-gray-200 shadow-sm'}`}>
          
          {/* Header - With dark mode support */}
          <div className={`px-5 py-4 sm:px-6 border-b transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center
                  ${isDark ? 'bg-[#4A5BCC]/20' : 'bg-teal-50'}`}>
                  <User className={`h-6 w-6 ${isDark ? 'text-[#4A5BCC]' : 'text-teal-600'}`} />
                </div>
                <div>
                  <h1 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {formData.name || 'User'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.role)}`}>
                      {formData.role || 'User'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.email}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium
                  ${isDark 
                    ? 'bg-[#4A5BCC]/20 hover:bg-[#4A5BCC]/30 text-[#4A5BCC]' 
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700'}`}
              >
                {isEditing ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{language === 'am' ? 'ተመልከት' : 'View'}</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{language === 'am' ? 'አርትዕ' : 'Edit'}</span>
                  </>
                )}
              </button>
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

            <div className="space-y-4">
              {/* Name - With dark mode support */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'am' ? 'ሙሉ ስም' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors
                        ${isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC]' 
                          : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder={language === 'am' ? 'ሙሉ ስምዎን ያስገቡ' : 'Enter your full name'}
                    />
                  ) : (
                    <div className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                      {formData.name || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Email - Read Only - With dark mode support */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'am' ? 'ኢሜል' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                    {formData.email || '—'}
                  </div>
                </div>
                <p className={`mt-0.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {language === 'am' ? 'ኢሜል ሊቀየር አይችልም' : 'Email cannot be changed'}
                </p>
              </div>

              {/* Phone - With dark mode support */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors
                        ${isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC]' 
                          : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder={language === 'am' ? 'ስልክ ቁጥርዎን ያስገቡ' : 'Enter your phone number'}
                    />
                  ) : (
                    <div className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                      {formData.phone || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Address - With dark mode support */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'am' ? 'አድራሻ' : 'Address'}
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-2.5 h-3.5 w-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors resize-none
                        ${isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-[#4A5BCC]' 
                          : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder={language === 'am' ? 'አድራሻዎን ያስገቡ' : 'Enter your address'}
                    />
                  ) : (
                    <div className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg min-h-[42px] ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                      {formData.address || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Role - Read Only - With dark mode support */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'am' ? 'ሚና' : 'Role'}
                </label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg flex items-center justify-between
                    ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                    <span>{formData.role || 'User'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(formData.role)}`}>
                      {formData.role || 'User'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button - With dark mode support */}
              {isEditing && (
                <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed
                      ${isDark 
                        ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                        : 'bg-teal-600 hover:bg-teal-700'}`}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{language === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{language === 'am' ? 'አስቀምጥ' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}