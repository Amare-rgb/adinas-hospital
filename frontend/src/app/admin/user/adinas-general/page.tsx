// app/admin/users/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
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
  // 🔥 FIXED: DELETE USER - No input confirmation
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
  // HELPER FUNCTIONS
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
      {/* Header with Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totalUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{activeUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
          <p className="text-lg font-bold text-gray-600 dark:text-gray-400">{inactiveUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{adminCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          <button 
            onClick={() => setSuccess('')} 
            className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 animate-fade-in">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError('')} 
            className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 appearance-none text-sm"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="USER">USER</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 appearance-none text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found for {LOCATION_NAME}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filterRole || filterStatus ? 'Try changing your filters' : 'No users registered for this location'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
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
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{displayName}</span>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs truncate max-w-[150px]">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
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
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.isActive, user)}
                            disabled={updatingId === user.id || deletingId === user.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isActive 
                                ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                            } disabled:opacity-50`}
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
                            className="p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors disabled:opacity-50"
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

      {/* Footer Stats */}
      {!loading && filteredUsers.length > 0 && (
        <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} for {LOCATION_NAME}</span>
          <span>
            <span className="text-green-600 dark:text-green-400">{activeUsers}</span> active,{' '}
            <span className="text-gray-600 dark:text-gray-400">{inactiveUsers}</span> inactive
          </span>
        </div>
      )}

      {/* 🔥 FIXED: Delete Confirmation Modal - NO INPUT FIELD */}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to delete user <strong className="text-gray-900 dark:text-white">"{getUserDisplayName(userToDelete)}"</strong>?
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-6">
              ⚠️ This action cannot be undone. All data associated with this user will be permanently deleted.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === userToDelete.id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
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