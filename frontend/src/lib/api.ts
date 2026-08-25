// lib/api.ts - COMPLETE FIXED VERSION
// Use port 5000 (your backend port)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Client initialized with URL:', API_URL);

export class ApiError extends Error {
  status: number;
  data?: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token key
const TOKEN_KEY = 'token';

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 🔥 FIX: Always try to add token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Auth token added to request');
  } else {
    console.warn('⚠️ No token found in localStorage');
  }

  const url = `${API_URL}${path}`;
  console.log(`📡 ${options.method || 'GET'} ${url}`);

  try {
    const res = await fetch(url, { 
      ...options, 
      headers, 
      cache: 'no-store',
    });

    console.log(`📡 Response status: ${res.status}`);

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as unknown as T;
    }

    // Parse response
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || 'Invalid response from server' };
    }

    console.log(`📡 Response data:`, data);

    // Handle errors
    if (!res.ok) {
      const errorMessage = data.error || data.message || data.data?.error || `HTTP ${res.status}`;
      throw new ApiError(errorMessage, res.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network errors (connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('❌ Network error - is the backend running?');
      throw new ApiError(
        'Cannot connect to server. Please make sure the backend is running on http://localhost:5000',
        0
      );
    }
    
    console.error('❌ Request error:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500
    );
  }
}

export const api = {
  get: <T>(path: string, auth: boolean = true): Promise<T> => 
    request<T>(path, { method: 'GET', auth }),
  
  post: <T>(path: string, body?: unknown, auth: boolean = true): Promise<T> => {  // 🔥 FIX: auth default = true
    // Handle FormData separately
    if (body instanceof FormData) {
      const token = getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = `${API_URL}${path}`;
      return fetch(url, { 
        method: 'POST', 
        headers, 
        body: body,
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new ApiError(data.error || data.message || `HTTP ${res.status}`, res.status, data);
        }
        return res.json() as Promise<T>;
      });
    }
    
    // Standard JSON request
    return request<T>(path, { 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined, 
      auth 
    });
  },
  
  put: <T>(path: string, body?: unknown, auth: boolean = true): Promise<T> => {  // 🔥 FIX: auth default = true
    // Handle FormData separately
    if (body instanceof FormData) {
      const token = getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = `${API_URL}${path}`;
      return fetch(url, { 
        method: 'PUT', 
        headers, 
        body: body,
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new ApiError(data.error || data.message || `HTTP ${res.status}`, res.status, data);
        }
        return res.json() as Promise<T>;
      });
    }
    
    return request<T>(path, { 
      method: 'PUT', 
      body: body ? JSON.stringify(body) : undefined, 
      auth 
    });
  },
  
  patch: <T>(path: string, body?: unknown, auth: boolean = true): Promise<T> => {  // 🔥 FIX: auth default = true
    // Handle FormData separately
    if (body instanceof FormData) {
      const token = getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const url = `${API_URL}${path}`;
      return fetch(url, { 
        method: 'PATCH', 
        headers, 
        body: body,
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new ApiError(data.error || data.message || `HTTP ${res.status}`, res.status, data);
        }
        return res.json() as Promise<T>;
      });
    }
    
    return request<T>(path, { 
      method: 'PATCH', 
      body: body ? JSON.stringify(body) : undefined, 
      auth 
    });
  },
  
  delete: <T>(path: string, auth: boolean = true): Promise<T> =>  // 🔥 FIX: auth default = true
    request<T>(path, { method: 'DELETE', auth }),

  // Helper to extract data from response
  extractData: <T>(response: any): T => {
    if (!response) return [] as unknown as T;
    if (Array.isArray(response)) return response as T;
    if (response.data && Array.isArray(response.data)) return response.data as T;
    if (response.data) return response.data as T;
    if (response.success && response.data) return response.data as T;
    return response as T;
  },

  // File upload methods
  uploadFile: async (file: File, type: string = 'doctors'): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_URL}/upload?type=${type}`;
    console.log(`📡 Uploading file to ${url}`);
    console.log(`📦 File: ${file.name} (${file.size} bytes)`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Upload error response:', errorData);
        throw new ApiError(
          errorData.error || errorData.message || 'Upload failed',
          response.status,
          errorData
        );
      }
      
      const result = await response.json();
      console.log('✅ File uploaded successfully:', result);
      
      return {
        url: result.url,
        filename: result.filename
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('❌ Upload error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'File upload failed',
        500
      );
    }
  },

  uploadMultiple: async (files: File[], type: string = 'gallery'): Promise<Array<{ url: string; filename: string }>> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const token = getToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_URL}/upload/multiple?type=${type}`;
    console.log(`📡 Uploading ${files.length} files to ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Upload failed',
          response.status,
          errorData
        );
      }
      
      const result = await response.json();
      console.log('✅ Files uploaded successfully:', result);
      
      return result.data.map((item: any) => ({
        url: item.url,
        filename: item.filename
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('❌ Upload error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'File upload failed',
        500
      );
    }
  },

  deleteFile: async (type: string, filename: string): Promise<void> => {
    const token = getToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_URL}/upload/${type}/${filename}`;
    console.log(`📡 Deleting file: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Delete failed',
          response.status,
          errorData
        );
      }
      
      console.log('✅ File deleted successfully');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('❌ Delete error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'File delete failed',
        500
      );
    }
  },

  // ============ APPOINTMENT SPECIFIC METHODS ============

  // Get all appointments with filters
  getAppointments: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    location?: string;
  }, auth: boolean = true) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== 'undefined') {
          queryParams.append(key, value);
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/appointments${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, auth);
  },

  // Get single appointment
  getAppointment: (id: string, auth: boolean = true) => 
    api.get(`/appointments/${id}`, auth),

  // Create appointment - 🔥 NOW AUTH BY DEFAULT
  createAppointment: (data: any, auth: boolean = true) =>   // 🔥 FIX: auth default = true
    api.post('/appointments', data, auth),

  // Update appointment status
  updateAppointmentStatus: (id: string, status: string, auth: boolean = true) =>
    api.patch(`/appointments/${id}/status`, { status }, auth),

  // Update appointment details
  updateAppointment: (id: string, data: any, auth: boolean = true) =>
    api.put(`/appointments/${id}`, data, auth),

  // Delete appointment
  deleteAppointment: (id: string, auth: boolean = true) =>
    api.delete(`/appointments/${id}`, auth),

  // Cancel appointment (user)
  cancelAppointment: (id: string, auth: boolean = true) =>
    api.delete(`/appointments/${id}/cancel`, auth),

  // ============ DEPARTMENT METHODS ============
  
  getDepartments: (auth: boolean = false) => 
    api.get('/departments', auth),

  getDepartment: (id: string, auth: boolean = false) => 
    api.get(`/departments/${id}`, auth),

  // ============ DOCTOR METHODS ============
  
  getDoctors: (params?: { departmentId?: string; active?: boolean }, auth: boolean = false) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/doctors${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, auth);
  },

  getDoctor: (id: string, auth: boolean = false) => 
    api.get(`/doctors/${id}`, auth),

  // ============ SERVICE METHODS ============
  
  getServices: (params?: { departmentId?: string; isActive?: boolean }, auth: boolean = false) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/services${queryString ? `?${queryString}` : ''}`;
    return api.get(endpoint, auth);
  },

  getService: (id: string, auth: boolean = false) => 
    api.get(`/services/${id}`, auth),

  // ============ AUTH METHODS ============
  
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),

  register: (data: any) => 
    api.post('/auth/register', data),

  getProfile: (auth: boolean = true) => 
    api.get('/auth/profile', auth),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // ============ DASHBOARD METHODS ============
  
  getDashboardSummary: (auth: boolean = true) => 
    api.get('/dashboard/summary', auth),
};

// Helper function to safely extract data from API responses
export function extractApiData<T>(response: any): T {
  if (!response) return [] as unknown as T;
  if (Array.isArray(response)) return response as T;
  if (response.data && Array.isArray(response.data)) return response.data as T;
  if (response.data) return response.data as T;
  if (response.success && response.data) return response.data as T;
  return response as T;
}

// Helper function to check if API response is successful
export function isApiSuccess(response: any): boolean {
  return response && (response.success === true || response.status === 'success');
}

// Helper to get error message from API error
export function getApiErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.data?.error) {
    return error.data.error;
  }
  return 'An unexpected error occurred';
}

export default api;