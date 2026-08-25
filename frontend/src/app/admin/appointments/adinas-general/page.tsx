// app/admin/appointments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import

const STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'MISSED'];

export default function AdinasGeneralAppointmentsPage() {
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [selectedAddress, setSelectedAddress] = useState<Appointment | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    missed: 0,
    homeVisits: 0
  });

  const LOCATION_NAME = 'Adinas General Hospital';

  // Helper function to get department name
  const getDepartmentName = (appointment: Appointment): string => {
    if (!appointment.department) return 'Not assigned';
    if (typeof appointment.department === 'string') return appointment.department;
    if (typeof appointment.department === 'object') {
      return appointment.department.name || 'Not assigned';
    }
    return 'Not assigned';
  };

  // Helper function to get doctor name
  const getDoctorName = (appointment: Appointment): string => {
    if (!appointment.doctor) return 'Not assigned';
    if (typeof appointment.doctor === 'string') return appointment.doctor;
    if (typeof appointment.doctor === 'object') {
      if (appointment.doctor.name) return appointment.doctor.name;
      if (appointment.doctor.user) {
        const firstName = appointment.doctor.user.firstName || '';
        const lastName = appointment.doctor.user.lastName || '';
        return `Dr. ${firstName} ${lastName}`.trim() || 'Not assigned';
      }
      return appointment.doctor.doctorId || appointment.doctor.id || 'Not assigned';
    }
    return 'Not assigned';
  };

  // Helper to get notes (handles both 'note' and 'notes')
  const getNotes = (appointment: Appointment): string => {
    if (appointment.notes) return appointment.notes;
    if (appointment.note) return appointment.note;
    return 'N/A';
  };

  // Helper to get symptoms
  const getSymptoms = (appointment: Appointment): string => {
    if (appointment.symptoms) return appointment.symptoms;
    return 'N/A';
  };

  // Check if appointment is older than 24 hours
  const isOlderThan24Hours = (appointmentDate: string | Date): boolean => {
    try {
      const appointmentTime = new Date(appointmentDate);
      const now = new Date();
      const diffHours = (now.getTime() - appointmentTime.getTime()) / (1000 * 60 * 60);
      return diffHours > 24;
    } catch {
      return false;
    }
  };

  // Auto-update missed appointments
  const autoUpdateMissedAppointments = async (appointments: Appointment[]): Promise<Appointment[]> => {
    const updatedAppointments: Appointment[] = [];
    let hasUpdates = false;

    for (const app of appointments) {
      const dateStr = app.appointmentDate || app.date;
      if (!dateStr) {
        updatedAppointments.push(app);
        continue;
      }

      if (app.status === 'PENDING' && isOlderThan24Hours(dateStr)) {
        try {
          console.log(`Auto-updating missed appointment: ${app.patientName} (${app.id})`);
          await api.patch(`/appointments/${app.id}/status`, { status: 'MISSED' }, true);
          
          const updatedApp = { ...app, status: 'MISSED' as AppointmentStatus };
          updatedAppointments.push(updatedApp);
          hasUpdates = true;
        } catch (error) {
          console.error(`❌ Failed to auto-update appointment ${app.id}:`, error);
          updatedAppointments.push(app);
        }
      } else {
        updatedAppointments.push(app);
      }
    }

    if (hasUpdates) {
      setSuccess('Auto-updated missed appointments (older than 24 hours)');
    }

    return updatedAppointments;
  };

  async function load() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      
      console.log(`📡 Fetching appointments with filter: ${filter}`);
      
      const response = await api.get<any>(`/appointments?${params.toString()}`, true);
      
      console.log('📊 API Response:', response);
      
      let appointmentsData: Appointment[] = [];
      
      if (response) {
        if (Array.isArray(response)) {
          appointmentsData = response;
        } 
        else if (response.data && Array.isArray(response.data)) {
          appointmentsData = response.data;
        } 
        else if (response.success && response.data && Array.isArray(response.data)) {
          appointmentsData = response.data;
        }
        else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          appointmentsData = response.data.data;
        }
        else if (response.data && response.data.items && Array.isArray(response.data.items)) {
          appointmentsData = response.data.items;
        }
        else if (response.data && response.data.appointments && Array.isArray(response.data.appointments)) {
          appointmentsData = response.data.appointments;
        }
      }

      console.log(` Found ${appointmentsData.length} appointments before filtering`);

      // Show ONLY General Hospital appointments AND Home Visits
      const filteredAppointments = appointmentsData.filter(app => {
        const isGeneral = app.location === LOCATION_NAME;
        const isHome = app.visitType === 'HOME';
        return isGeneral || isHome;
      });

      console.log(` After filtering: ${filteredAppointments.length} appointments`);

      const updatedAppointments = await autoUpdateMissedAppointments(filteredAppointments);
      
      // Sort by date (newest first)
      updatedAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate || a.date || '');
        const dateB = new Date(b.appointmentDate || b.date || '');
        return dateB.getTime() - dateA.getTime();
      });
      
      setAppointments(updatedAppointments);
      
      const homeVisits = updatedAppointments.filter(a => a.visitType === 'HOME').length;
      
      setStats({
        total: updatedAppointments.length,
        pending: updatedAppointments.filter(a => a.status === 'PENDING').length,
        confirmed: updatedAppointments.filter(a => a.status === 'CONFIRMED').length,
        completed: updatedAppointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: updatedAppointments.filter(a => a.status === 'CANCELLED').length,
        missed: updatedAppointments.filter(a => a.status === 'MISSED').length,
        homeVisits: homeVisits,
      });
      
      console.log(` Loaded ${updatedAppointments.length} appointments for ${LOCATION_NAME}`);
      console.log(` Home visits: ${homeVisits}`);
      
      if (updatedAppointments.length === 0) {
        toast.info('No appointments found for this location');
      }
    } catch (error: any) {
      console.error('❌ Failed to load appointments:', error);
      setError(error.message || 'Failed to load appointments');
      toast.error(error.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function approveAppointment(id: string) {
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      console.log(`📡 Approving appointment ${id}`);
      const response: any = await api.patch(
        `/appointments/${id}/status`, 
        { status: 'CONFIRMED' }, 
        true
      );
      
      console.log('✅ Approve response:', response);
      
      toast.success('✅ Appointment approved successfully');
      setSuccess(`Appointment approved successfully`);
      await load();
    } catch (error: any) {
      console.error('❌ Failed to approve appointment:', error);
      setError(error.message || 'Failed to approve appointment');
      toast.error(error.message || 'Failed to approve appointment');
    } finally {
      setUpdatingId(null);
    }
  }

  async function rejectAppointment(id: string) {
    if (!confirm('Are you sure you want to reject this appointment?')) return;
    setUpdatingId(id);
    setError('');
    setSuccess('');
    try {
      console.log(`📡 Rejecting appointment ${id}`);
      await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' }, true);
      
      toast.success('❌ Appointment rejected successfully');
      setSuccess(`Appointment rejected successfully`);
      await load();
    } catch (error: any) {
      console.error('❌ Failed to reject appointment:', error);
      setError(error.message || 'Failed to reject appointment');
      toast.error(error.message || 'Failed to reject appointment');
    } finally {
      setUpdatingId(null);
    }
  }

  async function completeAppointment(id: string) {
    setUpdatingId(id);
    try {
      console.log(`📡 Completing appointment ${id}`);
      await api.patch(`/appointments/${id}/status`, { status: 'COMPLETED' }, true);
      toast.success('✅ Appointment marked as completed');
      await load();
    } catch (error: any) {
      console.error('❌ Failed to complete appointment:', error);
      toast.error(error.message || 'Failed to complete appointment');
    } finally {
      setUpdatingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    try {
      console.log(`📡 Deleting appointment ${id}`);
      await api.delete(`/appointments/${id}`, true);
      setSuccess('Appointment deleted successfully');
      toast.success('✅ Appointment deleted successfully');
      await load();
    } catch (error: any) {
      console.error('❌ Failed to delete appointment:', error);
      setError(error.message || 'Failed to delete appointment');
      toast.error(error.message || 'Failed to delete appointment');
    }
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'CONFIRMED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700';
      case 'COMPLETED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700';
      case 'CANCELLED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700';
      case 'MISSED': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  const openAddressModal = (appointment: Appointment) => {
    setSelectedAddress(appointment);
    setIsAddressModalOpen(true);
  };

  const isPastAppointment = (dateString: string): boolean => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      return date.getTime() < now.getTime();
    } catch {
      return false;
    }
  };

  const hasAddressData = (appointment: Appointment): boolean => {
    return !!(appointment.city || appointment.subCity || appointment.woreda || appointment.gpsPin || appointment.homeAddress);
  };

  const isMissed = (appointment: Appointment): boolean => {
    return appointment.status === 'MISSED';
  };

  return (
    <div className="space-y-6">
      {/* Header - Refresh button on the right */}
      <div className="flex items-center justify-end">
        <button
          onClick={load}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium
            ${isDark 
              ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}`}
        >
          <span>⟳</span>
          Refresh
        </button>
      </div>

      {/* Stats Cards - With dark mode support */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`rounded-xl border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
        </div>
        <div className={`rounded-xl border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-yellow-700' 
            : 'bg-white border-yellow-200'}`}>
          <p className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Pending</p>
          <p className={`text-xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.pending}</p>
        </div>
        <div className={`rounded-xl border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-blue-700' 
            : 'bg-white border-blue-200'}`}>
          <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Confirmed</p>
          <p className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats.confirmed}</p>
        </div>
        <div className={`rounded-xl border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-green-700' 
            : 'bg-white border-green-200'}`}>
          <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Completed</p>
          <p className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</p>
        </div>
        <div className={`rounded-xl border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-red-700' 
            : 'bg-white border-red-200'}`}>
          <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>Cancelled</p>
          <p className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats.cancelled}</p>
        </div>
        <div className={`rounded-xl border p-3 transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>⏰ Missed</p>
          <p className={`text-xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stats.missed || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
          {stats.homeVisits > 0 && (
            <span className={`ml-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              ({stats.homeVisits} home visits)
            </span>
          )}
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`focus-ring rounded-lg border pl-3 pr-8 py-2 text-sm appearance-none cursor-pointer transition-colors
              ${isDark 
                ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' 
                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'}`}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none
            ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>▼</span>
        </div>
      </div>

      {/* Success Message - With dark mode support */}
      {success && (
        <div className={`p-4 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'}`}>
          <span className={`flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`}>✓</span>
          <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <span className={isDark ? 'text-green-400' : 'text-green-600'}>×</span>
          </button>
        </div>
      )}

      {/* Error Message - With dark mode support */}
      {error && (
        <div className={`p-4 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'}`}>
          <span className={`flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`}>✗</span>
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <span className={isDark ? 'text-red-400' : 'text-red-600'}>×</span>
          </button>
        </div>
      )}

      {/* Appointments Table - With dark mode support */}
      <div className={`rounded-xl border overflow-hidden shadow-sm w-full transition-colors duration-300
        ${isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-8 h-8 border-4 rounded-full animate-spin
                ${isDark 
                  ? 'border-gray-600 border-t-[#4A5BCC]' 
                  : 'border-gray-300 border-t-[#2A3380]'}`}></div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading appointments...
              </p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center p-12">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No appointments found
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {filter ? 'Try changing the status filter' : 'No appointments available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b transition-colors duration-300
                  ${isDark 
                    ? 'text-gray-400 border-gray-700 bg-gray-900/50' 
                    : 'text-gray-500 border-gray-200 bg-gray-50'}`}>
                  <th className="py-3 px-3 font-semibold">Patient</th>
                  <th className="py-3 px-3 font-semibold">Age</th>
                  <th className="py-3 px-3 font-semibold">Gender</th>
                  <th className="py-3 px-3 font-semibold">Contact</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Doctor</th>
                  <th className="py-3 px-3 font-semibold">Symptoms</th>
                  <th className="py-3 px-3 font-semibold">Notes</th>
                  <th className="py-3 px-3 font-semibold">Date & Time</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Visit Type</th>
                  <th className="py-3 px-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const dateStr = appointment.appointmentDate || appointment.date || '';
                  const isPast = isPastAppointment(dateStr);
                  const missed = isMissed(appointment);
                  const isPending = appointment.status === 'PENDING';
                  const isConfirmed = appointment.status === 'CONFIRMED';
                  const isHomeVisit = appointment.visitType === 'HOME';
                  const hasAddress = hasAddressData(appointment);
                  
                  const departmentName = getDepartmentName(appointment);
                  const doctorName = getDoctorName(appointment);
                  
                  const symptoms = getSymptoms(appointment);
                  const notes = getNotes(appointment);
                  
                  return (
                    <tr key={appointment.id} className={`border-b transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${isDark ? 'border-gray-700' : 'border-gray-100'}
                      ${isPast && !missed ? (isDark ? 'bg-orange-900/10' : 'bg-orange-50/30') : ''}
                      ${missed ? (isDark ? 'bg-gray-800/50 opacity-60' : 'bg-gray-50 opacity-60') : ''}
                      ${isHomeVisit ? (isDark ? 'bg-blue-900/10' : 'bg-blue-50/30') : ''}`}>
                      <td className="py-3 px-3">
                        <div className={`font-medium truncate max-w-[120px] ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {appointment.patientName}
                        </div>
                        {appointment.isEmergency && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                            🚨 Emergency
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="text-xs">
                          {appointment.patientAge || 'N/A'}
                        </div>
                      </td>
                      <td className={`py-3 px-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="text-xs font-medium">
                          {appointment.patientGender || 'N/A'}
                        </div>
                      </td>
                      <td className={`py-3 px-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="text-xs truncate max-w-[100px]">{appointment.patientEmail}</div>
                        <div className="text-xs mt-0.5 truncate max-w-[100px]">{appointment.patientPhone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap
                          ${isDark 
                            ? 'bg-blue-900/30 text-blue-400' 
                            : 'bg-blue-50 text-blue-700'}`}>
                          {departmentName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`text-xs font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {doctorName}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`text-xs max-w-[100px] truncate ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                          {symptoms}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`text-xs max-w-[100px] truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notes}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col text-xs whitespace-nowrap">
                          <span className={isDark ? 'text-white' : 'text-gray-800'}>
                            {new Date(dateStr).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(dateStr).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className={`font-medium text-xs whitespace-nowrap ${isHomeVisit ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-300' : 'text-gray-800')}`}>
                            {appointment.visitType || 'HOSPITAL'}
                          </span>
                          {isHomeVisit && hasAddress && (
                            <button
                              onClick={() => openAddressModal(appointment)}
                              className={`mt-1 text-[10px] transition-colors whitespace-nowrap flex items-center gap-1
                                ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                              📍 View Address
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => approveAppointment(appointment.id)}
                                disabled={updatingId === appointment.id}
                                className={`px-2 py-1 w-full text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap
                                  ${isDark 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-green-600 hover:bg-green-700'}`}
                              >
                                {updatingId === appointment.id ? '...' : '✅ Approve'}
                              </button>
                              <button
                                onClick={() => rejectAppointment(appointment.id)}
                                disabled={updatingId === appointment.id}
                                className={`px-2 py-1 w-full text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap
                                  ${isDark 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-red-600 hover:bg-red-700'}`}
                              >
                                {updatingId === appointment.id ? '...' : '❌ Reject'}
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() => completeAppointment(appointment.id)}
                              disabled={updatingId === appointment.id}
                              className={`px-2 py-1 w-full text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap
                                ${isDark 
                                  ? 'bg-blue-600 hover:bg-blue-700' 
                                  : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              {updatingId === appointment.id ? '...' : 'Complete'}
                            </button>
                          )}

                          {(appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED' || appointment.status === 'MISSED') && (
                            <div className={`text-[10px] italic whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {appointment.status === 'COMPLETED' ? '✓ Done' : 
                               appointment.status === 'MISSED' ? '⏰ Missed' : 
                               '✗ Cancelled'}
                            </div>
                          )}
                          
                          <button
                            onClick={() => remove(appointment.id)}
                            className={`text-[10px] font-medium hover:underline transition-colors whitespace-nowrap
                              ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                          >
                            🗑️ Delete
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

      {!loading && appointments.length > 0 && (
        <div className={`text-xs flex items-center justify-between ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} for {LOCATION_NAME}</span>
          <span>🏠 {stats.homeVisits} home visits • ⏰ {stats.missed} missed</span>
        </div>
      )}

      {/* Address Modal - With dark mode support */}
      {isAddressModalOpen && selectedAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800' 
              : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300
              ${isDark 
                ? 'border-gray-700' 
                : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span>📍</span>
                Home Address Details
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className={`transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className={`p-3 rounded-lg mb-2 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Patient</p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAddress.patientName}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedAddress.patientEmail} • {selectedAddress.patientPhone}
                  </p>
                </div>

                <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>City</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAddress.city || 'Not provided'}
                  </p>
                </div>
                
                <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sub-City</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAddress.subCity || 'Not provided'}
                  </p>
                </div>
                
                <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Woreda</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAddress.woreda || 'Not provided'}
                  </p>
                </div>
                
                <div className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>📍 GPS Pin</p>
                  <p className={`text-sm mt-1 break-all font-mono text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAddress.gpsPin || 'Not provided'}
                  </p>
                </div>
                
                <div className="pb-2">
                  <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>📌 Detailed Address</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAddress.homeAddress || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-2 transition-colors duration-300
              ${isDark 
                ? 'border-gray-700' 
                : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  const address = [
                    selectedAddress.city,
                    selectedAddress.subCity,
                    selectedAddress.woreda,
                    selectedAddress.gpsPin,
                    selectedAddress.homeAddress
                  ].filter(Boolean).join(', ');
                  if (address) {
                    navigator.clipboard.writeText(address);
                    toast.success('Address copied to clipboard!');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                📋 Copy Address
              </button>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}