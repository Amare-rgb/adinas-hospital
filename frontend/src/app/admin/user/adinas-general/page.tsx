// app/admin/users/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import
import { toast } from 'sonner';
import { 
  Users,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  XCircle,
  Search,
  ChevronDown,
  Trash2,
  UserX,
  UserCheck,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'USER';
  isActive: boolean;
  location?: string;
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

const LOCATION_NAME = 'Adinas General Hospital';

export default function UsersPage() {
  const { t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // ============================================================
  // AUTO-CLEAR MESSAGES
  // ============================================================
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ============================================================
  // Helper to get user display name
  // ============================================================
  const getUserDisplayName = (user: User): string => {
    if (user.name) return user.name;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return 'Unknown User';
  };

  // ============================================================
  // LOAD USERS
  // ============================================================
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      console.log(`📡 Fetching users for location: ${LOCATION_NAME}`);
      const response = await api.get<any>(`/users?location=${encodeURIComponent(LOCATION_NAME)}`, true);
      
      console.log('📊 API Response:', response);
      
      let usersData: User[] = [];
      if (response) {
        if (Array.isArray(response)) {
          usersData = response;
        } else if (response.data && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          usersData = response.users;
        } else if (response.success && response.data && Array.isArray(response.data)) {
          usersData = response.data;
        }
      }
      
      usersData = usersData.map(user => ({
        ...user,
        name: user.name || getUserDisplayName(user)
      }));
      
      usersData = usersData.filter(user => user.role !== 'SUPER_ADMIN');
      usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`✅ Loaded ${usersData.length} users for ${LOCATION_NAME}`);
      setUsers(usersData);
    } catch (error: any) {
      console.error('❌ Failed to load users:', error);
      setError(error.message || 'Failed to load users');
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // DELETE USER
  // ============================================================
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setDeletingId(userToDelete.id);
    setShowDeleteModal(false);
    setError('');
    setSuccess('');
    
    try {
      await api.delete(`/users/${userToDelete.id}`, true);
      const displayName = getUserDisplayName(userToDelete);
      setSuccess(`✅ User "${displayName}" deleted successfully`);
      toast.success(`User "${displayName}" deleted successfully`);
      await load();
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to delete user';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  // ============================================================
  // TOGGLE USER STATUS
  // ============================================================
  const handleToggleStatus = async (userId: string, currentStatus: boolean, user: User) => {
    const displayName = getUserDisplayName(user);
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmMsg = currentStatus 
      ? `Are you sure you want to deactivate user "${displayName}"? They will not be able to log in.`
      : `Are you sure you want to activate user "${displayName}"? They will be able to log in.`;
    
    if (!confirm(confirmMsg)) return;
    
    setUpdatingId(userId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/users/${userId}/toggle-status`, { isActive: !currentStatus }, true);
      
      const message = currentStatus 
        ? `❌ User "${displayName}" deactivated` 
        : `✅ User "${displayName}" activated`;
      setSuccess(message);
      toast.success(message);
      await load();
    } catch (error: any) {
      const errorMsg = error.message || `Failed to ${action} user`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // HELPER FUNCTIONS - With dark mode support
  // ============================================================
  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'ADMIN': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'DOCTOR': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'USER': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[role] || colors['USER'];
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      'SUPER_ADMIN': '👑',
      'ADMIN': '🛡️',
      'DOCTOR': '👨‍⚕️',
      'USER': '👤'
    };
    return icons[role] || '👤';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Never';
    }
  };

  // ============================================================
  // FILTER USERS
  // ============================================================
  const filteredUsers = users.filter(user => {
    const displayName = getUserDisplayName(user);
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || (filterStatus === 'active' ? user.isActive : !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ============================================================
  // STATS
  // ============================================================
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const userCount = users.filter(u => u.role === 'USER').length;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header with Stats - With dark mode support */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-lg border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Users</p>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalUsers}</p>
        </div>
        <div className={`rounded-lg border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Active</p>
          <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{activeUsers}</p>
        </div>
        <div className={`rounded-lg border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Inactive</p>
          <p className={`text-lg font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{inactiveUsers}</p>
        </div>
        <div className={`rounded-lg border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Admins</p>
          <p className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{adminCount}</p>
        </div>
      </div>

      {/* Actions - With dark mode support */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <button
          onClick={load}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors disabled:opacity-50
            ${isDark 
              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
              : 'bg-white border-gray-300 hover:bg-gray-50'}`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Success Message - With dark mode support */}
      {success && (
        <div className={`p-4 border rounded-lg flex items-center gap-2 animate-fade-in transition-colors duration-300
          ${isDark 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'}`}>
          <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
          <button 
            onClick={() => setSuccess('')} 
            className={`ml-auto ${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message - With dark mode support */}
      {error && (
        <div className={`p-4 border rounded-lg flex items-center gap-2 animate-fade-in transition-colors duration-300
          ${isDark 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'}`}>
          <XCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button 
            onClick={() => setError('')} 
            className={`ml-auto ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters - With dark mode support */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={`px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="USER">USER</option>
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* Users Table - With dark mode support */}
      <div className={`rounded-xl border overflow-hidden shadow-sm transition-colors duration-300
        ${isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-spin`} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12">
            <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No users found for {LOCATION_NAME}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchTerm || filterRole || filterStatus ? 'Try changing your filters' : 'No users registered for this location'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b transition-colors duration-300
                  ${isDark 
                    ? 'text-gray-400 border-gray-700 bg-gray-900/50' 
                    : 'text-gray-500 border-gray-200 bg-gray-50'}`}>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold hidden sm:table-cell">Email / Phone</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Last Login</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const displayName = getUserDisplayName(user);
                  return (
                    <tr key={user.id} className={`border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0
                            ${isDark ? '' : ''}`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {displayName}
                            </span>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} hidden sm:table-cell`}>
                        <div className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-xs truncate max-w-[150px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${getRoleBadge(user.role)}`}>
                          <span>{getRoleIcon(user.role)}</span>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} hidden md:table-cell`}>
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.isActive, user)}
                            disabled={updatingId === user.id || deletingId === user.id}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              user.isActive 
                                ? isDark 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                                : isDark
                                  ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400 hover:text-green-300'
                                  : 'bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-800'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {updatingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            disabled={deletingId === user.id || updatingId === user.id}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50
                              ${isDark 
                                ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300' 
                                : 'bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700'}`}
                            title="Delete user"
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats - With dark mode support */}
      {!loading && filteredUsers.length > 0 && (
        <div className={`text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2
          ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} for {LOCATION_NAME}</span>
          <span>
            <span className={isDark ? 'text-green-400' : 'text-green-600'}>{activeUsers}</span> active,{' '}
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{inactiveUsers}</span> inactive
          </span>
        </div>
      )}

      {/* Delete Confirmation Modal - With dark mode support */}
      {showDeleteModal && userToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setUserToDelete(null);
            }
          }}
        >
          <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors duration-300
            ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete User</h3>
            </div>
            
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to delete user <strong className={isDark ? 'text-white' : 'text-gray-900'}>
                "{getUserDisplayName(userToDelete)}"
              </strong>?
            </p>
            <p className={`text-xs mb-6 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              ⚠️ This action cannot be undone. All data associated with this user will be permanently deleted.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === userToDelete.id}
                className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {deletingId === userToDelete.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Yes, Delete User'
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}