// app/admin/security/page.tsx
'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Security() {
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPasswordData({...passwordData, [e.target.name]: e.target.value});
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password updated successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="flex justify-end">
      <div className={`w-full max-w-md rounded-xl shadow-sm border p-6 transition-colors duration-300
        ${isDark 
          ? 'bg-gray-800 border-gray-700 shadow-[#4A5BCC]/10' 
          : 'bg-white border-gray-200 shadow-lg'}`}>
        
        {/* Security Title inside Card - With dark mode support */}
        <div className={`flex items-center gap-3 mb-6 pb-4 border-b transition-colors duration-300
          ${isDark 
            ? 'border-gray-700' 
            : 'border-gray-200'}`}>
          <div>
            <h1 className={`text-xl font-bold transition-colors duration-300
              ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Security
            </h1>
            <p className={`text-sm transition-colors duration-300
              ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your security settings
            </p>
          </div>
        </div>

        {/* Change Password Section - With dark mode support */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className={`text-base font-semibold transition-colors duration-300
                ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Change Password
              </h2>
              <p className={`text-xs transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Current Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2.5 border rounded-lg transition-colors duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow text-sm
                  ${isDark 
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2.5 border rounded-lg transition-colors duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow text-sm
                  ${isDark 
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 transition-colors duration-300
                ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full p-2.5 border rounded-lg transition-colors duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow text-sm
                  ${isDark 
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                placeholder="Confirm new password"
                required
              />
            </div>

            {/* Show Password Checkbox - With dark mode support */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className={`w-4 h-4 rounded border-gray-300 focus:ring-green-500
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-green-500' 
                    : 'text-green-600'}`}
              />
              <label className={`text-sm cursor-pointer transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Show passwords
              </label>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg transition-colors font-semibold text-sm mt-2
                ${isDark 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}