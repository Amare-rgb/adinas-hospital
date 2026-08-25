// src/lib/services/appointment.ts - UPDATED VERSION

// src/lib/services/appointment.ts
import api, { extractApiData, isApiSuccess, getApiErrorMessage } from '@/lib/api';
import { Appointment } from '@/lib/types';

export interface AppointmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  location?: string;
  patientEmail?: string;
  patientPhone?: string;
}

export interface CreateAppointmentData {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: number | null;
  patientGender?: string | null;
  date: string;
  time: string;
  doctorId?: string;  // 🔥 Made optional for hospital booking
  serviceId?: string; // 🔥 Made optional for hospital booking
  location?: string;
  notes?: string;
  symptoms?: string;
  isEmergency?: boolean;
  visitType?: string;  // 🔥 Added for hospital booking
  departmentId?: string; // 🔥 Added for hospital booking
  city?: string;
  subCity?: string;
  woreda?: string;
  homeAddress?: string;
  gpsPin?: string;
}

export interface UpdateAppointmentData {
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  patientAge?: number | null;
  patientGender?: string | null;
  date?: string;
  time?: string;
  doctorId?: string;
  serviceId?: string;
  location?: string;
  notes?: string;
  symptoms?: string;
  isEmergency?: boolean;
}

export const appointmentService = {
  /**
   * Get all appointments with filters
   * GET /api/appointments
   */
  async getAppointments(filters: AppointmentFilters = {}, auth = true): Promise<Appointment[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }
      if (filters.doctorId) {
        queryParams.append('doctorId', filters.doctorId);
      }
      if (filters.location && filters.location !== 'all' && filters.location !== 'undefined') {
        queryParams.append('location', filters.location);
      }
      if (filters.patientEmail) {
        queryParams.append('patientEmail', filters.patientEmail);
      }
      if (filters.patientPhone) {
        queryParams.append('patientPhone', filters.patientPhone);
      }

      const queryString = queryParams.toString();
      const endpoint = `/appointments${queryString ? `?${queryString}` : ''}`;
      
      console.log(`📡 Fetching appointments: ${endpoint}`);
      const response = await api.get(endpoint, auth);
      console.log('📊 Appointments response:', response);
      
      return extractApiData<Appointment[]>(response) || [];
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Get a single appointment by ID
   * GET /api/appointments/:id
   */
  async getAppointment(id: string, auth = true): Promise<Appointment> {
    try {
      console.log(`📡 Fetching appointment: ${id}`);
      const response = await api.get(`/appointments/${id}`, auth);
      console.log('📊 Appointment response:', response);
      
      const appointment = extractApiData<Appointment>(response);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      return appointment;
    } catch (error) {
      console.error(`Failed to fetch appointment ${id}:`, error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Create a new appointment
   * POST /api/appointments
   * 🔥 FIX: auth now defaults to true
   */
  async createAppointment(data: CreateAppointmentData, auth = true): Promise<Appointment> {  // 🔥 CHANGED: false → true
    try {
      console.log('📡 Creating appointment:', data);
      
      const payload = {
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        patientPhone: data.patientPhone,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        date: data.date,
        time: data.time,
        doctorId: data.doctorId || null,  // 🔥 Make optional
        serviceId: data.serviceId || null, // 🔥 Make optional
        departmentId: data.departmentId || null, // 🔥 Added
        location: data.location || 'Adinas General Hospital',
        notes: data.notes || '',
        symptoms: data.symptoms || '',
        isEmergency: data.isEmergency || false,
        visitType: data.visitType || 'HOSPITAL', // 🔥 Added
        city: data.city || null,
        subCity: data.subCity || null,
        woreda: data.woreda || null,
        homeAddress: data.homeAddress || null,
        gpsPin: data.gpsPin || null,
      };

      const response = await api.post('/appointments', payload, auth);
      console.log('📊 Create appointment response:', response);
      
      if (isApiSuccess(response)) {
        return extractApiData<Appointment>(response);
      } else {
        const errorMsg = response && typeof response === 'object' && 'message' in response 
          ? String(response.message) 
          : 'Failed to create appointment';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Update appointment status
   * PATCH /api/appointments/:id/status
   */
  async updateAppointmentStatus(id: string, status: string, auth = true): Promise<Appointment> {
    try {
      console.log(`📡 Updating appointment ${id} status to: ${status}`);
      const response = await api.patch(`/appointments/${id}/status`, { status }, auth);
      console.log('📊 Update status response:', response);
      
      if (isApiSuccess(response)) {
        return extractApiData<Appointment>(response);
      } else {
        const errorMsg = response && typeof response === 'object' && 'message' in response 
          ? String(response.message) 
          : 'Failed to update status';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`Failed to update appointment ${id} status:`, error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Update appointment details
   * PUT /api/appointments/:id
   */
  async updateAppointment(id: string, data: UpdateAppointmentData, auth = true): Promise<Appointment> {
    try {
      console.log(`📡 Updating appointment: ${id}`, data);
      const response = await api.put(`/appointments/${id}`, data, auth);
      console.log('📊 Update appointment response:', response);
      
      if (isApiSuccess(response)) {
        return extractApiData<Appointment>(response);
      } else {
        const errorMsg = response && typeof response === 'object' && 'message' in response 
          ? String(response.message) 
          : 'Failed to update appointment';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`Failed to update appointment ${id}:`, error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Delete an appointment
   * DELETE /api/appointments/:id
   */
  async deleteAppointment(id: string, auth = true): Promise<void> {
    try {
      console.log(`📡 Deleting appointment: ${id}`);
      const response = await api.delete(`/appointments/${id}`, auth);
      console.log('📊 Delete appointment response:', response);
      
      if (!isApiSuccess(response)) {
        const errorMsg = response && typeof response === 'object' && 'message' in response 
          ? String(response.message) 
          : 'Failed to delete appointment';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`Failed to delete appointment ${id}:`, error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Cancel an appointment (user)
   * DELETE /api/appointments/:id/cancel
   */
  async cancelAppointment(id: string, auth = true): Promise<Appointment> {
    try {
      console.log(`📡 Cancelling appointment: ${id}`);
      const response = await api.delete(`/appointments/${id}/cancel`, auth);
      console.log('📊 Cancel appointment response:', response);
      
      if (isApiSuccess(response)) {
        return extractApiData<Appointment>(response);
      } else {
        const errorMsg = response && typeof response === 'object' && 'message' in response 
          ? String(response.message) 
          : 'Failed to cancel appointment';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error(`Failed to cancel appointment ${id}:`, error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  // ============ LOCATION SPECIFIC METHODS ============

  /**
   * Get appointments for a specific location
   */
  async getAppointmentsByLocation(location: string, filters: Omit<AppointmentFilters, 'location'> = {}, auth = true): Promise<Appointment[]> {
    return this.getAppointments({ ...filters, location }, auth);
  },

  /**
   * Get appointments for Adinas General Hospital
   */
  async getGeneralHospitalAppointments(filters: Omit<AppointmentFilters, 'location'> = {}, auth = true): Promise<Appointment[]> {
    return this.getAppointmentsByLocation('Adinas General Hospital', filters, auth);
  },

  /**
   * Get appointments for Diagnosis Center
   */
  async getDiagnosisCenterAppointments(filters: Omit<AppointmentFilters, 'location'> = {}, auth = true): Promise<Appointment[]> {
    return this.getAppointmentsByLocation('Adinas Diagnosis Center', filters, auth);
  },

  /**
   * Get appointments for Drug Manufacturing
   */
  async getDrugManufacturingAppointments(filters: Omit<AppointmentFilters, 'location'> = {}, auth = true): Promise<Appointment[]> {
    return this.getAppointmentsByLocation('Adinas Drug Manufacturing', filters, auth);
  },

  /**
   * Get appointments for Home Care
   */
  async getHomeCareAppointments(filters: Omit<AppointmentFilters, 'location'> = {}, auth = true): Promise<Appointment[]> {
    return this.getAppointmentsByLocation('Home Care', filters, auth);
  },

  // ============ STATISTICS METHODS ============

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(filters: AppointmentFilters = {}, auth = true): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const appointments = await this.getAppointments(filters, auth);
      
      return {
        total: appointments.length,
        pending: appointments.filter(a => a.status === 'PENDING').length,
        confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      };
    } catch (error) {
      console.error('Failed to get appointment stats:', error);
      throw new Error(getApiErrorMessage(error));
    }
  },

  /**
   * Get appointment statistics for a specific location
   */
  async getLocationAppointmentStats(location: string, filters: Omit<AppointmentFilters, 'location'> = {}, auth = true): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  }> {
    return this.getAppointmentStats({ ...filters, location }, auth);
  },
};

export default appointmentService;