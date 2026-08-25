// app/admin/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getStoredAdmin } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import

interface ProfileData {
  name: string;
  email: string;
  role: string;
  phone: string;
  location: string;
}

export default function MyProfile() {
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Super Admin',
    email: 'admin@afilashospital.com',
    role: 'Super Admin',
    phone: '+1 (555) 123-4567',
    location: 'ethiopia',
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    const admin = getStoredAdmin();
    if (admin?.name) {
      setProfile(prev => ({ 
        ...prev, 
        name: admin.name || prev.name, 
        email: admin.email || prev.email 
      }));
    }
  }, []);

  return (
    <div className="flex justify-end">
      <div className={`w-full max-w-md rounded-xl shadow-sm border overflow-hidden transition-colors duration-300
        ${isDark 
          ? 'bg-gray-800 border-gray-700 shadow-[#4A5BCC]/10' 
          : 'bg-white border-gray-200 shadow-lg'}`}>
        
        {/* Header with My Profile title - With dark mode support */}
        <div className={`px-5 pt-5 pb-3 border-b transition-colors duration-300
          ${isDark 
            ? 'border-gray-700' 
            : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300
              ${isDark 
                ? 'bg-green-900/30' 
                : 'bg-green-100'}`}>
              <span className="text-base">👤</span>
            </div>
            <div>
              <h1 className={`text-lg font-bold transition-colors duration-300
                ${isDark ? 'text-white' : 'text-gray-900'}`}>
                My Profile
              </h1>
              <p className={`text-xs transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Your personal information
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-5 pb-5 relative">
          {/* Edit Button - With dark mode support */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-md transition-colors text-xs font-medium
                ${isDark 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          {/* Vertical Minimal Details List - With dark mode support */}
          <div className="space-y-2 text-sm">
            {/* Email */}
            <div className={`flex items-center gap-3 py-1.5 border-b transition-colors duration-300
              ${isDark 
                ? 'border-gray-700/50' 
                : 'border-gray-100'}`}>
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-wider transition-colors duration-300
                  ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Email
                </p>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className={`w-full p-1 text-sm border rounded transition-colors duration-300 focus:ring-1 focus:ring-green-500 outline-none
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-400' 
                        : 'bg-white border-gray-200 text-gray-900'}`}
                  />
                ) : (
                  <p className={`font-medium truncate transition-colors duration-300
                    ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {profile.email}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className={`flex items-center gap-3 py-1.5 border-b transition-colors duration-300
              ${isDark 
                ? 'border-gray-700/50' 
                : 'border-gray-100'}`}>
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-wider transition-colors duration-300
                  ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Phone
                </p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className={`w-full p-1 text-sm border rounded transition-colors duration-300 focus:ring-1 focus:ring-green-500 outline-none
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-400' 
                        : 'bg-white border-gray-200 text-gray-900'}`}
                  />
                ) : (
                  <p className={`font-medium truncate transition-colors duration-300
                    ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {profile.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className={`flex items-center gap-3 py-1.5 border-b transition-colors duration-300
              ${isDark 
                ? 'border-gray-700/50' 
                : 'border-gray-100'}`}>
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-wider transition-colors duration-300
                  ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Location
                </p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className={`w-full p-1 text-sm border rounded transition-colors duration-300 focus:ring-1 focus:ring-green-500 outline-none
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-400' 
                        : 'bg-white border-gray-200 text-gray-900'}`}
                  />
                ) : (
                  <p className={`font-medium truncate transition-colors duration-300
                    ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {profile.location}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-wider transition-colors duration-300
                  ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Role
                </p>
                <p className={`font-medium truncate transition-colors duration-300
                  ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {profile.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}