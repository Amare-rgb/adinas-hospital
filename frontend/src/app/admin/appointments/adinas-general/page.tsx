// app/admin/appointments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Appointment, AppointmentStatus } from '@/lib/types';
import { toast } from 'sonner';

const STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'MISSED'];

export default function AdinasGeneralAppointmentsPage() {
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

  // 🔥 FIXED: Helper to get notes (handles both 'note' and 'notes')
  const getNotes = (appointment: Appointment): string => {
    if (appointment.notes) return appointment.notes;
    if (appointment.note) return appointment.note;
    return 'N/A';
  };

  // 🔥 FIXED: Helper to get symptoms
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'MISSED': return 'bg-gray-200 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium"
        >
          <span>⟳</span>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-700 p-3">
          <p className="text-xs text-yellow-600">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 p-3">
          <p className="text-xs text-blue-600">Confirmed</p>
          <p className="text-xl font-bold text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-700 p-3">
          <p className="text-xs text-green-600">Completed</p>
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-700 p-3">
          <p className="text-xs text-red-600">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-600">⏰ Missed</p>
          <p className="text-xl font-bold text-gray-600">{stats.missed || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-gray-500">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
          {stats.homeVisits > 0 && (
            <span className="ml-2 text-blue-600">({stats.homeVisits} home visits)</span>
          )}
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="focus-ring rounded-lg border border-gray-300 pl-3 pr-8 py-2 bg-white text-sm appearance-none cursor-pointer hover:border-gray-400 transition-colors"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <span className="text-green-600 flex-shrink-0">✓</span>
          <p className="text-sm text-green-600">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <span className="text-green-600">×</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span className="text-red-600 flex-shrink-0">✗</span>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <span className="text-red-600">×</span>
          </button>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm w-full">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading appointments...</p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-sm text-gray-500">No appointments found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter ? 'Try changing the status filter' : 'No appointments available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
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
                  
                  // 🔥 FIXED: Use helper functions
                  const symptoms = getSymptoms(appointment);
                  const notes = getNotes(appointment);
                  
                  return (
                    <tr key={appointment.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0 ${isPast && !missed ? 'bg-orange-50/30' : ''} ${missed ? 'bg-gray-50 opacity-60' : ''} ${isHomeVisit ? 'bg-blue-50/30' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-800 truncate max-w-[120px]">
                          {appointment.patientName}
                        </div>
                        {appointment.isEmergency && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                            🚨 Emergency
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div className="text-xs">
                          {appointment.patientAge || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div className="text-xs font-medium">
                          {appointment.patientGender || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div className="text-xs truncate max-w-[100px]">{appointment.patientEmail}</div>
                        <div className="text-xs mt-0.5 truncate max-w-[100px]">{appointment.patientPhone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium whitespace-nowrap">
                          {departmentName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-xs font-medium text-gray-700 whitespace-nowrap">
                          {doctorName}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-xs text-gray-800 max-w-[100px] truncate">
                          {symptoms}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-xs text-gray-600 max-w-[100px] truncate">
                          {notes}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col text-xs whitespace-nowrap">
                          <span className="text-gray-800">
                            {new Date(dateStr).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-gray-500 text-[10px]">
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
                          <span className={`font-medium text-xs whitespace-nowrap ${isHomeVisit ? 'text-blue-600' : 'text-gray-800'}`}>
                            {appointment.visitType || 'HOSPITAL'}
                          </span>
                          {isHomeVisit && hasAddress && (
                            <button
                              onClick={() => openAddressModal(appointment)}
                              className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline transition-colors whitespace-nowrap flex items-center gap-1"
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
                                className="px-2 py-1 w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {updatingId === appointment.id ? '...' : '✅ Approve'}
                              </button>
                              <button
                                onClick={() => rejectAppointment(appointment.id)}
                                disabled={updatingId === appointment.id}
                                className="px-2 py-1 w-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {updatingId === appointment.id ? '...' : '❌ Reject'}
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() => completeAppointment(appointment.id)}
                              disabled={updatingId === appointment.id}
                              className="px-2 py-1 w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {updatingId === appointment.id ? '...' : 'Complete'}
                            </button>
                          )}

                          {(appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED' || appointment.status === 'MISSED') && (
                            <div className="text-[10px] text-gray-400 italic whitespace-nowrap">
                              {appointment.status === 'COMPLETED' ? '✓ Done' : 
                               appointment.status === 'MISSED' ? '⏰ Missed' : 
                               '✗ Cancelled'}
                            </div>
                          )}
                          
                          <button
                            onClick={() => remove(appointment.id)}
                            className="text-red-500 hover:text-red-700 text-[10px] font-medium hover:underline transition-colors whitespace-nowrap"
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
        <div className="text-xs text-gray-400 flex items-center justify-between">
          <span>Showing {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} for {LOCATION_NAME}</span>
          <span>🏠 {stats.homeVisits} home visits • ⏰ {stats.missed} missed</span>
        </div>
      )}

      {/* Address Modal */}
      {isAddressModalOpen && selectedAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📍</span>
                Home Address Details
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="text-2xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Patient</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedAddress.patientName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedAddress.patientEmail} • {selectedAddress.patientPhone}
                  </p>
                </div>

                <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedAddress.city || 'Not provided'}
                  </p>
                </div>
                
                <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub-City</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedAddress.subCity || 'Not provided'}
                  </p>
                </div>
                
                <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Woreda</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedAddress.woreda || 'Not provided'}
                  </p>
                </div>
                
                <div className="border-b border-gray-100 dark:border-gray-700 pb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">📍 GPS Pin</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-all font-mono text-xs">
                    {selectedAddress.gpsPin || 'Not provided'}
                  </p>
                </div>
                
                <div className="pb-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">📌 Detailed Address</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedAddress.homeAddress || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
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
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
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