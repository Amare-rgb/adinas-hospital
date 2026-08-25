// app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
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
  id?: string;  // 🔥 FIXED: Made optional
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  timezone: string;
  currency: string;
  taxRate?: number;  // 🔥 FIXED: Made optional
  clinicHours: string;
}

export default function AdminSettingsPage() {
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
        // Default settings
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
      // 🔥 FIXED: Create payload without using delete
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
        <Loader2 className="w-8 h-8 text-[#2A3380] animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Settings Found</h3>
        <button
          onClick={loadSettings}
          className="mt-4 px-4 py-2 bg-[#2A3380] text-white rounded-lg hover:bg-[#1E3A8A] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#2A3380]" />
          Hospital Settings
        </h1>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                value={settings.hospitalName || ''}
                onChange={(e) => handleChange('hospitalName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={settings.hospitalAddress || ''}
                onChange={(e) => handleChange('hospitalAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={settings.hospitalPhone || ''}
                  onChange={(e) => handleChange('hospitalPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.hospitalEmail || ''}
                  onChange={(e) => handleChange('hospitalEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2A3380]" />
            Working Hours
          </h2>
          <textarea
            rows={3}
            value={settings.clinicHours || ''}
            onChange={(e) => handleChange('clinicHours', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
            placeholder="Enter working hours..."
          />
        </div>

        {/* Currency & Timezone */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#2A3380]" />
            Currency & Timezone
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={settings.currency || 'ETB'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={settings.timezone || ''}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#2A3380] hover:bg-[#1E3A8A] text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
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