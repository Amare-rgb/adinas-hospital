'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getToken, getStoredAdmin, clearSession } from '@/lib/auth';
import { Admin } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import
import { 
  LogOut,
  ArrowLeft,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  UserCircle,
  Shield,
  ChevronDown,
  Loader2,
  Hospital,
  Users
} from 'lucide-react';

// Define navigation item type
interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

// Navigation for Adinas General Hospital with correct paths
const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/appointments/adinas-general', label: 'Appointments' },
  { href: '/admin/doctors/adinas-general', label: 'Doctors' },
  { href: '/admin/user/adinas-general', label: 'Users' },
  { href: '/admin/departments', label: 'Departments' },
  { href: '/admin/services/adinas-general', label: 'Services' },
  { href: '/admin/blog/adinas-general', label: 'Blog' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New appointment booked', time: 'Just now', read: false },
    { id: 2, title: 'Patient feedback received', time: '1 hour ago', read: false },
    { id: 3, title: 'Doctor schedule updated', time: '3 hours ago', read: true },
    { id: 4, title: 'System maintenance tonight', time: '1 day ago', read: true },
  ]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/admin/login';

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node) && !(event.target as Element).closest('.search-trigger')) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    const token = getToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    const adminData = getStoredAdmin();
    console.log('Admin data from storage:', adminData);
    setAdmin(adminData);
    setChecked(true);
  }, [isLoginPage, router]);

  // Fetch real notifications
  useEffect(() => {
    if (admin) {
      fetchNotifications();
    }
  }, [admin]);

  const fetchNotifications = async () => {
    setNotificationLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.log('No token found, skipping notifications fetch');
        setNotificationLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications response:', data);
        
        if (data && data.notifications) {
          setNotifications(data.notifications);
        } else if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          setNotifications(data.data);
        }
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || data.data || []);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultClick = (result: any) => {
    closeSearch();
    if (result.path) {
      router.push(result.path);
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  if (isLoginPage) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>;
  }

  if (!checked) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  function handleLogout() {
    clearSession();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('admin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = '/';
  }

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      '/admin/dashboard': 'Dashboard',
      '/admin/appointments/adinas-general': 'Appointments',
      '/admin/doctors/adinas-general': 'Doctors',
      '/admin/user/adinas-general': 'Users',
      '/admin/departments': 'Departments',
      '/admin/services/adinas-general': 'Services',
      '/admin/blog/adinas-general': 'Blog',
      '/admin/security': 'Settings',
    };
    for (const [key, value] of Object.entries(titles)) {
      if (pathname === key || pathname.startsWith(key + '/')) {
        return value;
      }
    }
    return 'Dashboard';
  };

  const getPageDescription = () => {
    const descriptions: { [key: string]: string } = {
      '/admin/dashboard': 'Overview of your hospital operations',
      '/admin/appointments/adinas-general': 'Manage all appointments and schedules',
      '/admin/doctors/adinas-general': 'Manage doctor profiles and availability',
      '/admin/user/adinas-general': 'Manage hospital users and permissions',
      '/admin/departments': 'Manage hospital departments and staff',
      '/admin/services/adinas-general': 'Manage medical services and pricing',
      '/admin/blog/adinas-general': 'Create and manage blog posts',
      '/admin/security': 'Configure hospital settings',
    };
    for (const [key, value] of Object.entries(descriptions)) {
      if (pathname === key || pathname.startsWith(key + '/')) {
        return value;
      }
    }
    return 'Manage your hospital';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getUserInitials = () => {
    if (!admin?.name) return 'A';
    return admin.name.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (!admin?.name) return 'Admin';
    return admin.name;
  };

  const isNavActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Sidebar - With dark mode support */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-all duration-300 shadow-lg fixed h-screen z-50`}
      >
        {/* Logo Section - With dark mode support */}
        <div className={`px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center ${
          sidebarOpen ? 'justify-between' : 'justify-center'
        }`}>
          <Link href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10">
              <Image
                src="/llogo.jpg"
                alt="Adinas General Hospital"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold text-[#2A3380] dark:text-white">Adinas Admin</span>
            )}
          </Link>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Navigation - NO ICONS - With dark mode support */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const isActive = isNavActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-[#2A3380] dark:bg-[#4A5BCC] text-white shadow-md hover:bg-[#1E3A8A] dark:hover:bg-[#5B6BD8]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                {sidebarOpen ? (
                  <span className="flex-1 text-left">{item.label}</span>
                ) : (
                  <span className="text-xs font-bold">{item.label.charAt(0)}</span>
                )}
                {isActive && sidebarOpen && (
                  <span className="ml-auto w-1.5 h-6 rounded-full bg-white/50 dark:bg-white/30" />
                )}
                {isActive && !sidebarOpen && (
                  <span className="absolute right-0 w-1 h-8 bg-[#2A3380] dark:bg-[#4A5BCC] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section - With dark mode support */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
          {admin && (
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              !sidebarOpen && 'justify-center'
            }`}>
              <div className="w-8 h-8 rounded-full bg-[#2A3380] dark:bg-[#4A5BCC] text-white flex items-center justify-center font-semibold shrink-0">
                {getUserInitials()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{admin.email}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              !sidebarOpen && 'justify-center'
            } text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>

          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              !sidebarOpen && 'justify-center'
            } text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300`}
            title={!sidebarOpen ? 'Back to site' : undefined}
          >
            <ArrowLeft size={20} className="shrink-0" />
            {sidebarOpen && <span>Back to site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Navbar - With dark mode support */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40 transition-colors duration-300">
          <div className="flex flex-col px-4 sm:px-6">
            {/* System Title - Adinas General Hospital */}
            <div className="flex items-center justify-center py-2 bg-[#2A3380]/5 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h1 className="text-sm font-bold text-[#2A3380] dark:text-white tracking-wider uppercase flex items-center gap-2">
                <Hospital className="w-4 h-4" />
                Adinas General Hospital - Management System
              </h1>
            </div>
            
            {/* Navbar Content */}
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors duration-300">
                    {getPageTitle()}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    {getPageDescription()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* Search Icon */}
                <button
                  onClick={handleSearchClick}
                  className="search-trigger p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} className="text-gray-600 dark:text-gray-300" />
                </button>

                {/* Notification Bell - With dark mode support */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                    aria-label="Notifications"
                  >
                    <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transition-colors duration-300">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-xs font-bold text-gray-800 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] text-[#2A3380] dark:text-[#4A5BCC] hover:text-[#1E3A8A] dark:hover:text-[#5B6BD8] font-bold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto">
                        {notificationLoading ? (
                          <div className="px-3 py-4 text-center">
                            <Loader2 className="w-5 h-5 text-[#2A3380] dark:text-[#4A5BCC] animate-spin mx-auto" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-3 py-4 text-center">
                            <Bell size={20} className="text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                                !notif.read ? 'bg-[#2A3380]/5 dark:bg-[#4A5BCC]/10' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2A3380] dark:bg-[#4A5BCC] mt-1.5 flex-shrink-0"></span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{notif.title}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{notif.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Link
                          href="/admin/notifications"
                          className="block text-center text-[10px] text-[#2A3380] dark:text-[#4A5BCC] hover:text-[#1E3A8A] dark:hover:text-[#5B6BD8] font-bold py-0.5"
                          onClick={() => setNotificationOpen(false)}
                        >
                          View all
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown - With dark mode support */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors pr-2 py-1"
                    aria-label="Profile menu"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-[#2A3380] dark:bg-[#4A5BCC] text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {getUserInitials()}
                      </div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.email}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transition-colors duration-300">
                      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-[#2A3380] dark:bg-[#4A5BCC] text-white flex items-center justify-center font-bold text-xl shadow-lg">
                              {getUserInitials()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 dark:text-white text-base">{getDisplayName()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/admin/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <UserCircle size={18} className="text-gray-400 dark:text-gray-500" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/admin/security"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Shield size={18} className="text-gray-400 dark:text-gray-500" />
                          <span>Security</span>
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                        >
                          <LogOut size={18} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Search Modal - With dark mode support */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm" onClick={closeSearch}>
            <div 
              ref={searchModalRef}
              className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <Search size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <form onSubmit={handleSearch} className="flex-1">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users, patients, doctors, appointments..."
                    className="w-full bg-transparent border-none outline-none text-base text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    autoFocus
                  />
                </form>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      searchRef.current?.focus();
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} className="text-gray-400 dark:text-gray-500" />
                  </button>
                )}
                <button
                  onClick={closeSearch}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              {/* Search Results - With dark mode support */}
              <div className="max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-[#2A3380] dark:text-[#4A5BCC] animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#2A3380]/10 dark:bg-[#4A5BCC]/20 flex items-center justify-center text-[#2A3380] dark:text-[#4A5BCC] font-bold text-sm flex-shrink-0">
                          {result.type?.charAt(0) || 'R'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{result.name || result.title || 'Result'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {result.type || 'Item'}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-8 text-center">
                    <Search size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Search size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type to start searching...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Overlay - With dark mode support */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl transition-colors duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/llogo.jpg"
                      alt="Adinas General Hospital"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <span className="text-lg font-bold text-[#2A3380] dark:text-white">Adinas Admin</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
                {NAV.map((item) => {
                  const isActive = isNavActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#2A3380] dark:bg-[#4A5BCC] text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  {admin && (
                    <div className="px-4 py-2 mb-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ArrowLeft size={20} />
                    Back to Site
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}