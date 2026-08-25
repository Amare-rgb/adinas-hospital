// app/admin/doctors/page.tsx
'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api';
import { getToken, clearSession } from '@/lib/auth';
import { Doctor, ScheduleSlot } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import

interface DoctorFormData {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  scheduleSlots: {
    [key: number]: {
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }
  };
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  experience?: string;
  schedule?: string;
  bio?: string;
  photo?: string;
}

type ScheduleSlotsType = {
  [key: number]: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  };
};

const emptyForm: DoctorFormData = { 
  name: '', 
  title: '', 
  bio: '', 
  photoUrl: '',
  email: '',
  phone: '',
  specialization: '',
  experience: 0,
  scheduleSlots: {
    0: { startTime: '', endTime: '', isAvailable: false },
    1: { startTime: '', endTime: '', isAvailable: false },
    2: { startTime: '', endTime: '', isAvailable: false },
    3: { startTime: '', endTime: '', isAvailable: false },
    4: { startTime: '', endTime: '', isAvailable: false },
    5: { startTime: '', endTime: '', isAvailable: false },
    6: { startTime: '', endTime: '', isAvailable: false }
  }
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LOCATION_NAME = 'Adinas General Hospital';

// ============================================================
// VALIDATION FUNCTIONS (unchanged)
// ============================================================

const validateName = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Name is required';
  }
  if (value.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (value.trim().length > 100) {
    return 'Name must be less than 100 characters';
  }
  if (!/^[a-zA-Z\s\-'.]+$/.test(value.trim())) {
    return 'Name contains invalid characters (only letters, spaces, hyphens, apostrophes, and periods allowed)';
  }
  return null;
};

const validateEmail = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Email is required';
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(value.trim())) {
    return 'Please enter a valid email address';
  }
  if (value.trim().length > 255) {
    return 'Email must be less than 255 characters';
  }
  return null;
};

const validatePhone = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
  if (!phoneRegex.test(value.trim())) {
    return 'Please enter a valid phone number (7-20 characters, numbers, spaces, +, -, (), allowed)';
  }
  return null;
};

const validateSpecialization = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Specialization is required';
  }
  if (value.trim().length < 2) {
    return 'Specialization must be at least 2 characters';
  }
  if (value.trim().length > 100) {
    return 'Specialization must be less than 100 characters';
  }
  if (!/^[a-zA-Z\s\-',.&]+$/.test(value.trim())) {
    return 'Specialization contains invalid characters';
  }
  return null;
};

const validateExperience = (value: number): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  if (value < 0) {
    return 'Experience cannot be negative';
  }
  if (value > 100) {
    return 'Experience cannot exceed 100 years';
  }
  if (!Number.isInteger(value)) {
    return 'Experience must be a whole number';
  }
  return null;
};

const validateBio = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  if (value.trim().length > 500) {
    return 'Bio must be less than 500 characters';
  }
  return null;
};

const validateSchedule = (scheduleSlots: ScheduleSlotsType): string | null => {
  const entries = Object.entries(scheduleSlots) as [string, { startTime: string; endTime: string; isAvailable: boolean }][];
  
  const hasAvailableDay = entries.some(([_, slot]) => slot.isAvailable === true);
  
  if (!hasAvailableDay) {
    return 'Please set at least one working day';
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const [day, slot] of entries) {
    if (!slot.isAvailable) continue;
    
    const dayIndex = parseInt(day);
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      return 'Invalid day of week';
    }
    
    if (!slot.startTime || !slot.endTime) {
      return `Please set both start and end times for ${dayNames[dayIndex]}`;
    }
    
    if (slot.startTime >= slot.endTime) {
      return `Invalid time range for ${dayNames[dayIndex]}: Start time must be before end time`;
    }
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(slot.startTime)) {
      return `Invalid start time format for ${dayNames[dayIndex]} (use HH:MM)`;
    }
    if (!timeRegex.test(slot.endTime)) {
      return `Invalid end time format for ${dayNames[dayIndex]} (use HH:MM)`;
    }
  }
  
  return null;
};

const validatePhoto = (file: File | null): string | null => {
  if (!file) return null;
  
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB';
  }
  
  return null;
};

export default function AdminDoctorsPage() {
  const { t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorFormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const doctorsResponse = await api.get<any>(`/doctors?location=${encodeURIComponent(LOCATION_NAME)}`);
      
      let doctorsData: Doctor[] = [];
      if (doctorsResponse) {
        if (Array.isArray(doctorsResponse)) {
          doctorsData = doctorsResponse;
        } else if (doctorsResponse.data && Array.isArray(doctorsResponse.data)) {
          doctorsData = doctorsResponse.data;
        } else if (doctorsResponse.doctors && Array.isArray(doctorsResponse.doctors)) {
          doctorsData = doctorsResponse.doctors;
        }
      }
      
      setDoctors(doctorsData);
      console.log(`✅ Loaded ${doctorsData.length} doctors for ${LOCATION_NAME}`);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const photoError = validatePhoto(file);
      if (photoError) {
        setFormErrors({ ...formErrors, photo: photoError });
        setError(photoError);
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormErrors({ ...formErrors, photo: undefined });
      setError('');
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('http://localhost:5000/api/upload?type=doctors', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      const data = await response.json();
      if (response.status === 401) {
        clearSession();
        throw new Error('Session expired. Please login again.');
      }
      if (!response.ok) throw new Error(data.error || data.message || 'Upload failed');
      return data.url;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'specialization':
        return validateSpecialization(value);
      case 'experience':
        return validateExperience(value);
      case 'bio':
        return validateBio(value);
      case 'schedule':
        return validateSchedule(form.scheduleSlots);
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    const nameError = validateName(form.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateEmail(form.email);
    if (emailError) errors.email = emailError;
    
    const phoneError = validatePhone(form.phone);
    if (phoneError) errors.phone = phoneError;
    
    const specializationError = validateSpecialization(form.specialization);
    if (specializationError) errors.specialization = specializationError;
    
    const experienceError = validateExperience(form.experience);
    if (experienceError) errors.experience = experienceError;
    
    const bioError = validateBio(form.bio);
    if (bioError) errors.bio = bioError;
    
    const scheduleError = validateSchedule(form.scheduleSlots);
    if (scheduleError) errors.schedule = scheduleError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
    setTouched({ ...touched, [field]: true });
    
    const error = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: error || undefined });
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const updatedSlots = { ...form.scheduleSlots };
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value
    };
    setForm({ ...form, scheduleSlots: updatedSlots });
    setTouched({ ...touched, schedule: true });
    
    const error = validateSchedule(updatedSlots);
    setFormErrors({ ...formErrors, schedule: error || undefined });
  };

  const handleScheduleToggle = (index: number, isChecked: boolean) => {
    const updatedSlots = { ...form.scheduleSlots };
    updatedSlots[index] = {
      ...updatedSlots[index],
      isAvailable: isChecked,
      startTime: isChecked ? (form.scheduleSlots[index]?.startTime || '09:00') : '',
      endTime: isChecked ? (form.scheduleSlots[index]?.endTime || '17:00') : ''
    };
    setForm({ ...form, scheduleSlots: updatedSlots });
    setTouched({ ...touched, schedule: true });
    
    const error = validateSchedule(updatedSlots);
    setFormErrors({ ...formErrors, schedule: error || undefined });
  };

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setTouched({});
    setShowForm(true);
    setError('');
    setSuccess('');
    setImageFile(null);
    setImagePreview('');
  }

  function startEdit(doc: Doctor) {
    const scheduleSlots = { ...emptyForm.scheduleSlots };
    if (doc.scheduleSlots && doc.scheduleSlots.length > 0) {
      doc.scheduleSlots.forEach(slot => {
        if (slot.dayOfWeek !== undefined && slot.dayOfWeek >= 0 && slot.dayOfWeek <= 6) {
          scheduleSlots[slot.dayOfWeek] = {
            startTime: slot.startTime || '',
            endTime: slot.endTime || '',
            isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true
          };
        }
      });
    }

    setEditingId(doc.id);
    setForm({
      name: doc.name || '',
      title: doc.title || '',
      bio: doc.bio || '',
      photoUrl: doc.photoUrl || '',
      email: doc.email || '',
      phone: doc.phone || '',
      specialization: doc.specialization || '',
      experience: doc.experience || 0,
      scheduleSlots
    });
    setFormErrors({});
    setTouched({});
    setImagePreview(doc.photoUrl || '');
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(key => {
      allTouched[key] = true;
    });
    allTouched.schedule = true;
    setTouched(allTouched);
    
    const isValid = validateForm();
    
    if (!isValid) {
      setSaving(false);
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      let photoUrl = form.photoUrl;
      if (imageFile) {
        setUploadingImage(true);
        try {
          photoUrl = await uploadImage(imageFile);
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload image');
          setSaving(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }
      
      const workingHours = Object.entries(form.scheduleSlots)
        .filter(([_, slot]) => slot.isAvailable === true && slot.startTime && slot.endTime)
        .map(([day, slot]) => ({
          dayOfWeek: parseInt(day),
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: true
        }));

      if (workingHours.length === 0) {
        setError('Please set at least one working day');
        setFormErrors({ ...formErrors, schedule: 'Please set at least one working day' });
        setSaving(false);
        return;
      }

      const doctorData = { 
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        title: form.title.trim() || form.specialization.trim(),
        bio: form.bio?.trim() || '',
        photoUrl: photoUrl,
        email: form.email.trim().toLowerCase(),
        phone: form.phone?.trim() || '',
        experience: form.experience || 0,
        location: LOCATION_NAME,
        isAvailable: true,
        active: true,
        workingHours: workingHours
      };

      console.log('📤 Sending doctor data:', JSON.stringify(doctorData, null, 2));
      console.log(`📅 Working hours: ${workingHours.length} slots`);
      
      if (editingId) {
        await api.put(`/doctors/${editingId}`, doctorData, true);
        setSuccess('Doctor updated successfully');
      } else {
        await api.post('/doctors', doctorData, true);
        setSuccess('Doctor created successfully');
      }
      
      setShowForm(false);
      await load();
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      console.error('❌ Error saving doctor:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save doctor. Please try again.');
      }
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await api.delete(`/doctors/${id}`, true);
      setSuccess('Doctor deleted successfully');
      await load();
    } catch (error) {
      console.error('❌ Failed to delete doctor:', error);
      alert('Failed to delete doctor');
    }
  }

  const formatTimeDisplay = (time?: string) => {
    if (!time || time === '') return 'Not set';
    
    try {
      const parts = time.split(':');
      if (parts.length < 2) return time;
      
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      
      if (isNaN(hours) || hours < 0 || hours > 23) return time;
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  const getScheduleDisplay = (doctor: Doctor) => {
    if (!doctor.scheduleSlots || doctor.scheduleSlots.length === 0) {
      return 'No schedule set';
    }
    
    const availableSlots = doctor.scheduleSlots.filter(s => s.isAvailable);
    if (availableSlots.length === 0) return 'No schedule set';
    
    const days = availableSlots
      .map(s => DAYS_OF_WEEK[s.dayOfWeek])
      .filter(Boolean);
    
    const timeRanges = availableSlots.map(s => {
      const start = formatTimeDisplay(s.startTime);
      const end = formatTimeDisplay(s.endTime);
      return `${start} - ${end}`;
    });
    
    const uniqueDays = [...new Set(days)];
    const uniqueTimes = [...new Set(timeRanges)];
    
    if (uniqueTimes.length === 1) {
      return `${uniqueDays.join(', ')} - ${uniqueTimes[0]}`;
    }
    
    const timeDisplay = uniqueTimes.map(t => `(${t})`).join(' ');
    return `${uniqueDays.join(', ')} ${timeDisplay}`;
  };

  const hasError = (field: keyof FormErrors) => {
    return formErrors[field] && touched[field];
  };

  return (
    <>
      {/* Header - With dark mode support */}
      <div className="flex items-center justify-end mb-8 flex-wrap gap-4">
        <button
          onClick={() => load()}
          className={`focus-ring rounded-lg border text-sm font-semibold px-5 py-2.5 transition-colors shadow-sm flex items-center gap-2
            ${isDark 
              ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}`}
        >
          ⟳ Refresh
        </button>
        <button
          onClick={startCreate}
          className={`focus-ring rounded-lg text-white text-sm font-semibold px-5 py-2.5 transition-colors shadow-sm
            ${isDark 
              ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
              : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
        >
          + Add Doctor
        </button>
      </div>

      {/* Success Message - With dark mode support */}
      {success && (
        <div className={`mb-6 p-4 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'}`}>
          <span className={isDark ? 'text-green-400' : 'text-green-600'}>✓</span>
          <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <span className={isDark ? 'text-green-400' : 'text-green-600'}>×</span>
          </button>
        </div>
      )}

      {/* Error Message - With dark mode support */}
      {error && (
        <div className={`mb-6 p-4 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'}`}>
          <span className={isDark ? 'text-red-400' : 'text-red-600'}>✗</span>
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <span className={isDark ? 'text-red-400' : 'text-red-600'}>×</span>
          </button>
        </div>
      )}

      {/* Modal Form - With dark mode support */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800' 
              : 'bg-white'}`}>
            <div className={`sticky top-0 border-b px-4 py-3 flex items-center justify-between rounded-t-xl transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingId ? '✏️ Edit Doctor' : '➕ New Doctor'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setImageFile(null);
                  setImagePreview('');
                  setError('');
                  setFormErrors({});
                  setTouched({});
                }}
                className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Image Upload - With dark mode support */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-100 border-gray-200'}`}>
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Doctor preview"
                        width={56}
                        height={56}
                        unoptimized
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className={`text-2xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>👤</span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute bottom-0 right-0 border p-0.5 rounded-full transition-colors text-xs shadow-sm
                      ${isDark 
                        ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    📷
                  </button>
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Photo</p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG, GIF, WebP (max 5MB)</p>
                </div>
              </div>
              {formErrors.photo && touched.photo && (
                <p className="text-xs text-red-500 -mt-2">{formErrors.photo}</p>
              )}
              
              {/* Full Name */}
              <div data-error={!!formErrors.name && touched.name}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[a-zA-Z\s\-'.]*$/.test(value) || value === '') {
                      handleFieldChange('name', value);
                    }
                  }}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('name')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400'
                  }`}
                  placeholder="Dr. John Doe"
                  maxLength={100}
                />
                {hasError('name') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.name}</p>
                )}
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {form.name.length}/100
                </p>
              </div>
              
              {/* Specialization */}
              <div data-error={!!formErrors.specialization && touched.specialization}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Specialization <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Cardiology"
                  value={form.specialization}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[a-zA-Z\s\-',.&]*$/.test(value) || value === '') {
                      handleFieldChange('specialization', value);
                    }
                  }}
                  onBlur={() => setTouched({ ...touched, specialization: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('specialization')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400'
                  }`}
                  maxLength={100}
                />
                {hasError('specialization') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.specialization}</p>
                )}
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {form.specialization.length}/100
                </p>
              </div>
              
              {/* Email */}
              <div data-error={!!formErrors.email && touched.email}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  placeholder="doctor@example.com"
                  value={form.email}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase();
                    handleFieldChange('email', value);
                  }}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('email')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400'
                  }`}
                  maxLength={255}
                />
                {hasError('email') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.email}</p>
                )}
              </div>
              
              {/* Phone */}
              <div data-error={!!formErrors.phone && touched.phone}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+251-911-123456"
                  value={form.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[\+\d\s\-\(\)]*$/.test(value) || value === '') {
                      handleFieldChange('phone', value);
                    }
                  }}
                  onBlur={() => setTouched({ ...touched, phone: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('phone')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400'
                  }`}
                  maxLength={20}
                />
                {hasError('phone') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.phone}</p>
                )}
              </div>

              {/* Experience */}
              <div data-error={!!formErrors.experience && touched.experience}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Experience (years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.experience}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      handleFieldChange('experience', 0);
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num) && num >= 0 && num <= 100) {
                        handleFieldChange('experience', num);
                      }
                    }
                  }}
                  onBlur={() => setTouched({ ...touched, experience: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('experience')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400'
                  }`}
                  placeholder="10"
                />
                {hasError('experience') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.experience}</p>
                )}
              </div>

              {/* Weekly Schedule - With dark mode support */}
              <div className={`border rounded-lg p-3 transition-colors duration-300 ${
                hasError('schedule') 
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
                  : isDark
                    ? 'border-gray-700 bg-gray-700/50'
                    : 'border-gray-200 bg-gray-50'
              }`}>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Weekly Schedule <span className="text-red-400">*</span>
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={index} className={`flex items-center gap-1.5 p-1.5 rounded-lg shadow-sm transition-colors duration-300
                      ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                      <div className="w-14 flex-shrink-0">
                        <label className={`flex items-center gap-1 text-xs font-medium cursor-pointer
                          ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <input
                            type="checkbox"
                            checked={form.scheduleSlots[index]?.isAvailable || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              console.log(`Day ${index} (${day}) toggled:`, isChecked);
                              handleScheduleToggle(index, isChecked);
                            }}
                            className={`rounded border-gray-300 focus:ring-[#2A3380] dark:focus:ring-[#4A5BCC] cursor-pointer
                              ${isDark ? 'bg-gray-700 border-gray-600 text-[#4A5BCC]' : ''}`}
                          />
                          <span className="truncate text-[10px]">{day.slice(0, 3)}</span>
                        </label>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-1">
                        <input
                          type="time"
                          value={form.scheduleSlots[index]?.startTime || ''}
                          disabled={!form.scheduleSlots[index]?.isAvailable}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          className={`w-full rounded border px-1.5 py-0.5 text-[10px] transition-colors outline-none ${
                            form.scheduleSlots[index]?.isAvailable 
                              ? isDark
                                ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                                : 'border-gray-300 bg-white focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                              : isDark
                                ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          step="900"
                        />
                        <input
                          type="time"
                          value={form.scheduleSlots[index]?.endTime || ''}
                          disabled={!form.scheduleSlots[index]?.isAvailable}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          className={`w-full rounded border px-1.5 py-0.5 text-[10px] transition-colors outline-none ${
                            form.scheduleSlots[index]?.isAvailable 
                              ? isDark
                                ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                                : 'border-gray-300 bg-white focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                              : isDark
                                ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          step="900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {hasError('schedule') && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <span>⚠️</span> {formErrors.schedule}
                  </p>
                )}
                {!hasError('schedule') && (
                  <p className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Check at least one day and set working hours
                  </p>
                )}
              </div>
              
              {/* Bio */}
              <div data-error={!!formErrors.bio && touched.bio}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={form.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  onBlur={() => setTouched({ ...touched, bio: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('bio')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400'
                  }`}
                  placeholder="Brief bio..."
                  maxLength={500}
                />
                <div className="flex justify-between">
                  {hasError('bio') && (
                    <p className="text-xs text-red-500 mt-0.5">{formErrors.bio}</p>
                  )}
                  <p className={`text-[10px] mt-0.5 ml-auto ${form.bio.length > 450 ? 'text-orange-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {form.bio.length}/500
                  </p>
                </div>
              </div>

              {/* Action Buttons - With dark mode support */}
              <div className={`flex gap-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className={`flex-1 rounded-lg text-white text-sm font-medium px-4 py-2 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                      : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
                >
                  {saving || uploadingImage ? (
                    <>
                      <span className={`inline-block w-3 h-3 border-2 border-t-transparent rounded-full animate-spin
                        ${isDark ? 'border-white' : 'border-white'}`}></span>
                      {uploadingImage ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    editingId ? 'Update Doctor' : 'Add Doctor'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setImageFile(null);
                    setImagePreview('');
                    setError('');
                    setFormErrors({});
                    setTouched({});
                  }}
                  className={`flex-1 rounded-lg border text-sm font-medium px-4 py-2 transition-colors
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State - With dark mode support */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <span className={`${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin text-2xl`}>⟳</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className={`border rounded-xl p-12 text-center transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            No Doctors Found
          </h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No doctors available for Adinas General Hospital
          </p>
          <button
            onClick={startCreate}
            className={`focus-ring rounded-lg text-white text-sm font-semibold px-5 py-2.5 transition-colors
              ${isDark 
                ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
          >
            + Add Doctor
          </button>
        </div>
      ) : (
        /* Doctor Cards - With dark mode support */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className={`rounded-xl border overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col
              ${isDark 
                ? 'bg-gray-800 border-gray-700 hover:border-[#4A5BCC]/30 hover:shadow-[#4A5BCC]/20' 
                : 'bg-white border-gray-200 hover:border-[#2A3380]/30 hover:shadow-lg'}`}>
              <div className={`relative flex-shrink-0 p-4 flex items-center justify-center
                ${isDark 
                  ? 'bg-[#4A5BCC]/10' 
                  : 'bg-gradient-to-br from-[#2A3380]/10 to-gray-100'}`}>
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-md
                  ${isDark ? 'border-gray-700' : 'border-white'}`}>
                  {doc.photoUrl ? (
                    <Image
                      src={doc.photoUrl}
                      alt={doc.name || 'Doctor'}
                      width={128}
                      height={128}
                      unoptimized
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className={`flex items-center justify-center w-full h-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <span className={`text-4xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>👤</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    doc.isAvailable !== false 
                      ? isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                      : isDark ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {doc.isAvailable !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className={`font-semibold text-lg text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {doc.name || 'Unknown'}
                </h3>
                <p className={`text-sm font-medium text-center ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
                  {doc.specialization || doc.title || 'General'}
                </p>
                
                {doc.email && (
                  <p className={`text-xs mt-1 text-center ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                    {doc.email}
                  </p>
                )}
                
                {doc.bio && (
                  <p className={`text-xs mt-3 line-clamp-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {doc.bio}
                  </p>
                )}
                
                {doc.scheduleSlots && doc.scheduleSlots.filter(s => s.isAvailable).length > 0 && (
                  <div className="mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}">
                    <div className="text-xs text-center">
                      <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {getScheduleDisplay(doc)}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button 
                    onClick={() => startEdit(doc)} 
                    className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1
                      ${isDark 
                        ? 'text-[#4A5BCC] hover:text-[#5B6BD8] hover:bg-[#4A5BCC]/10' 
                        : 'text-[#2A3380] hover:text-[#1E3A8A] hover:bg-[#2A3380]/10'}`}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => remove(doc.id)} 
                    className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1
                      ${isDark 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                        : 'text-red-600 hover:text-red-800 hover:bg-red-50'}`}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && doctors.length > 0 && (
        <div className={`mt-4 text-xs flex items-center justify-end ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>Showing {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} for Adinas General Hospital</span>
        </div>
      )}
    </>
  );
}