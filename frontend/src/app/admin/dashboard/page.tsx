// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeProvider';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';

// Types
interface DashboardStats {
  overview: {
    totalAppointments: number;
    todayAppointments: number;
    upcomingAppointments: number;
    totalDoctors: number;
    totalDepartments?: number;
    totalServices: number;
    totalUsers: number;
    pendingContacts: number;
    totalNews: number;
  };
  appointmentsByStatus: {
    [key: string]: number;
  };
  recentAppointments: Array<{
    id: string;
    date: string;
    status: string;
    doctor: { name: string; specialization: string } | null;
    service: { name: string } | null;
    patientName: string;
  }>;
  reviews: {
    totalReviews: number;
    averageRating: number;
  };
  location?: string;
}

interface ChartDataItem {
  month?: string;
  role?: string;
  appointments?: number;
  completed?: number;
  cancelled?: number;
  count?: number;
}

interface DashboardData {
  stats: DashboardStats;
  appointmentsChart: ChartDataItem[];
  usersChart: ChartDataItem[];
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1'];

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (userRole?.toUpperCase() !== 'ADMIN' && userRole?.toUpperCase() !== 'SUPER_ADMIN') {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Fetch all data in parallel
      const [statsResponse, chartResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/dashboard/appointments-chart?period=${selectedPeriod}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/dashboard/users-chart`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      // Parse responses
      const statsData = await statsResponse.json();
      const chartData = await chartResponse.json();
      const usersData = await usersResponse.json();

      // Extract data from response (handle both { success, data } and direct data)
      const stats = statsData.success ? statsData.data : statsData;
      const appointmentsChart = chartData.success ? chartData.data : (chartData || []);
      const usersChart = usersData.success ? usersData.data : (usersData || []);

      setData({
        stats: stats || {
          overview: {
            totalAppointments: 0,
            todayAppointments: 0,
            upcomingAppointments: 0,
            totalDoctors: 0,
            totalDepartments: 0,
            totalServices: 0,
            totalUsers: 0,
            pendingContacts: 0,
            totalNews: 0,
          },
          appointmentsByStatus: {},
          recentAppointments: [],
          reviews: {
            totalReviews: 0,
            averageRating: 0,
          },
          location: 'Adinas General Hospital',
        },
        appointmentsChart: Array.isArray(appointmentsChart) ? appointmentsChart : [],
        usersChart: Array.isArray(usersChart) ? usersChart : [],
      });
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      
      // Set empty data on error
      setData({
        stats: {
          overview: {
            totalAppointments: 0,
            todayAppointments: 0,
            upcomingAppointments: 0,
            totalDoctors: 0,
            totalDepartments: 0,
            totalServices: 0,
            totalUsers: 0,
            pendingContacts: 0,
            totalNews: 0,
          },
          appointmentsByStatus: {},
          recentAppointments: [],
          reviews: {
            totalReviews: 0,
            averageRating: 0,
          },
          location: 'Adinas General Hospital',
        },
        appointmentsChart: [],
        usersChart: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`star-${i}`} className="text-yellow-400 dark:text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half-star" className="text-yellow-400 dark:text-yellow-400">★</span>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300 dark:text-gray-600">★</span>);
    }
    return stars;
  };

  const renderPieLabel = ({ name, percent }: { name?: string; percent?: number }) => {
    if (!name || !percent) return '';
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  if (loading) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDark ? 'bg-gray-900' : ''}`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4
            ${isDark 
              ? 'border-[#4A5BCC] border-t-transparent' 
              : 'border-[#2A3380] border-t-transparent'}`}></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDark ? 'bg-gray-900' : ''}`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠</div>
          <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Failed to load dashboard data</p>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className={`px-4 py-2 rounded-lg transition-colors text-white
              ${isDark 
                ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
          >
            ↻ Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDark ? 'bg-gray-900' : ''}`}>
        <div className="text-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No data available</p>
        </div>
      </div>
    );
  }

  const { stats, appointmentsChart, usersChart } = data;

  // Summary Cards
  const summaryCards = [
    { 
      label: 'Total Appointments', 
      value: stats?.overview?.totalAppointments?.toLocaleString() || '0',
      color: 'from-green-500 to-emerald-600'
    },
    { 
      label: 'Website Reviews', 
      value: stats?.reviews?.totalReviews?.toString() || '0',
      color: 'from-yellow-500 to-orange-600',
      rating: stats?.reviews?.averageRating || 0
    },
    { 
      label: 'Total Doctors', 
      value: stats?.overview?.totalDoctors?.toString() || '0',
      color: 'from-purple-500 to-violet-600'
    },
    { 
      label: 'Total Users', 
      value: stats?.overview?.totalUsers?.toLocaleString() || '0',
      color: 'from-blue-500 to-cyan-600'
    },
    { 
      label: 'Total Services', 
      value: stats?.overview?.totalServices?.toLocaleString() || '0',
      color: 'from-cyan-500 to-teal-600'
    },
    { 
      label: 'Blog Posts', 
      value: stats?.overview?.totalNews?.toLocaleString() || '0',
      color: 'from-pink-500 to-rose-600'
    },
  ];

  return (
    <div className={`space-y-6 min-h-screen p-6 transition-colors duration-300
      ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      
      {/* Period Selector */}
      <div className={`flex justify-end items-center gap-3 transition-colors duration-300
        ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className={`bg-transparent border-none outline-none text-sm transition-colors duration-300
              ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <button 
          onClick={fetchDashboardData}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm text-white
            ${isDark 
              ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
              : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards - 6 cards in a row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, index) => (
          <div key={index} className={`rounded-xl border p-4 hover:shadow-md transition-all duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700 hover:shadow-[#4A5BCC]/20' 
              : 'bg-white border-gray-200 hover:shadow-lg'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-medium uppercase tracking-wider truncate
                  ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {card.label}
                </p>
                <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {card.value}
                </p>
                {card.rating !== undefined && card.rating > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex items-center">
                      {renderStars(card.rating)}
                    </div>
                    <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {card.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${card.color} flex-shrink-0 ml-2`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* TWO CHARTS: Appointments Trend & Users by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Appointments Trend */}
        <div className={`rounded-xl border p-6 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Appointments Trend
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Adinas General Hospital • Monthly statistics
              </p>
            </div>
          </div>
          {appointmentsChart && appointmentsChart.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={appointmentsChart}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#374151' : '#e5e7eb'} 
                  />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#6B7280' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#F3F4F6' : '#1F2937'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ 
                      color: isDark ? '#D1D5DB' : '#374151' 
                    }} 
                  />
                  <Bar dataKey="appointments" fill="#10B981" name="Total" />
                  <Bar dataKey="completed" fill="#3B82F6" name="Completed" />
                  <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <div className="text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  No appointment data available
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Add appointments to see the chart
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Users by Role */}
        <div className={`rounded-xl border p-6 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Users by Role
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                User role distribution
              </p>
            </div>
          </div>
          {usersChart && usersChart.length > 0 && usersChart.some(item => (item.count ?? 0) > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={usersChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="role"
                  >
                    {usersChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      color: isDark ? '#F3F4F6' : '#1F2937'
                    }} 
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <div className="text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  No user data available
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Add users to see the chart
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}