// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import
import { 
  Save, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  DollarSign,
  X
} from 'lucide-react';

interface Settings {
  id?: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  timezone: string;
  currency: string;
  taxRate?: number;
  clinicHours: string;
}

export default function AdminSettingsPage() {
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<any>('/settings', true);
      
      let settingsData = null;
      if (response) {
        if (response.data) {
          settingsData = response.data;
        } else if (response.id) {
          settingsData = response;
        }
      }
      
      if (settingsData) {
        setSettings(settingsData);
      } else {
        setSettings({
          hospitalName: 'Adinas General Hospital',
          hospitalAddress: 'Felege Hiwot Area, Lake Tana Shore, Bahir Dar',
          hospitalPhone: '+251 98 320 1998',
          hospitalEmail: 'info@afilas.com',
          timezone: 'Africa/Nairobi',
          currency: 'ETB',
          taxRate: 0,
          clinicHours: 'Mon-Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 2:00 PM\nSun: Closed',
        });
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      setSettings({
        hospitalName: 'Adinas General Hospital',
        hospitalAddress: 'Felege Hiwot Area, Lake Tana Shore, Bahir Dar',
        hospitalPhone: '+251 98 320 1998',
        hospitalEmail: 'info@afilas.com',
        timezone: 'Africa/Nairobi',
        currency: 'ETB',
        taxRate: 0,
        clinicHours: 'Mon-Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 2:00 PM\nSun: Closed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const { id, ...payload } = settings;
      
      const response = await api.put('/settings', payload, true);
      
      setSuccess('Settings saved successfully!');
      toast.success('Settings saved successfully!');
      await loadSettings();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setError(error.message || 'Failed to save settings');
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className={`w-8 h-8 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-20">
        <Building2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
          No Settings Found
        </h3>
        <button
          onClick={loadSettings}
          className={`mt-4 px-4 py-2 text-white rounded-lg transition-colors
            ${isDark 
              ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
              : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header - With dark mode support */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold flex items-center gap-2 transition-colors duration-300
          ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Building2 className={`w-6 h-6 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
          Hospital Settings
        </h1>
      </div>

      {/* Success Message - With dark mode support */}
      {success && (
        <div className={`mb-6 p-4 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'}`}>
          <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </button>
        </div>
      )}

      {/* Error Message - With dark mode support */}
      {error && (
        <div className={`mb-6 p-4 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'}`}>
          <XCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information - With dark mode support */}
        <div className={`rounded-xl border p-6 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300
            ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Hospital Name
              </label>
              <input
                type="text"
                value={settings.hospitalName || ''}
                onChange={(e) => handleChange('hospitalName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC]' 
                    : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Address
              </label>
              <input
                type="text"
                value={settings.hospitalAddress || ''}
                onChange={(e) => handleChange('hospitalAddress', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC]' 
                    : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300
                  ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone
                </label>
                <input
                  type="text"
                  value={settings.hospitalPhone || ''}
                  onChange={(e) => handleChange('hospitalPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC]' 
                      : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300
                  ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={settings.hospitalEmail || ''}
                  onChange={(e) => handleChange('hospitalEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC]' 
                      : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours - With dark mode support */}
        <div className={`rounded-xl border p-6 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors duration-300
            ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Clock className={`w-5 h-5 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
            Working Hours
          </h2>
          <textarea
            rows={3}
            value={settings.clinicHours || ''}
            onChange={(e) => handleChange('clinicHours', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
              ${isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC] placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900'}`}
            placeholder="Enter working hours..."
          />
        </div>

        {/* Currency & Timezone - With dark mode support */}
        <div className={`rounded-xl border p-6 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors duration-300
            ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <DollarSign className={`w-5 h-5 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
            Currency & Timezone
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Currency
              </label>
              <input
                type="text"
                value={settings.currency || 'ETB'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC]' 
                    : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Timezone
              </label>
              <input
                type="text"
                value={settings.timezone || ''}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent transition-colors duration-300
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#4A5BCC]' 
                    : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>
        </div>

        {/* Submit Button - With dark mode support */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2.5 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md
              ${isDark 
                ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}