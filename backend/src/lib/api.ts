// src/lib/api.ts - UPDATED VERSION

// Directly define the API URL - no env.ts needed
const API_URL = 'http://localhost:5000/api';

console.log('🔗 API URL:', API_URL);

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// 🔥 Helper to get token from localStorage
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export const api = {
  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    // 🔥 FIX: If token not provided, try to get from localStorage
    const authToken = token || getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('🔑 Auth token added to request');
    } else {
      console.warn('⚠️ No token available for request');
    }

    console.log(`📡 POST ${url}`);
    console.log(`📦 Data:`, data);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log(`📡 Response status: ${response.status}`);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { error: text || 'Invalid response' };
      }

      console.log(`📡 Response data:`, result);

      if (!response.ok) {
        throw new ApiError(response.status, result.error || result.message || `HTTP ${response.status}`, result);
      }

      return result as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ Network error - is the backend running?');
        throw new ApiError(0, 'Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
      }
      
      console.error('❌ API Error:', error);
      throw new ApiError(500, 'An unexpected error occurred');
    }
  },

  async get<T>(endpoint: string, token?: string): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    // 🔥 FIX: If token not provided, try to get from localStorage
    const authToken = token || getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { error: text || 'Invalid response' };
      }

      if (!response.ok) {
        throw new ApiError(response.status, result.error || result.message || 'Request failed', result);
      }

      return result as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Cannot connect to server. Please make sure the backend is running.');
      }
      throw error;
    }
  },

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    // 🔥 FIX: If token not provided, try to get from localStorage
    const authToken = token || getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { error: text || 'Invalid response' };
      }

      if (!response.ok) {
        throw new ApiError(response.status, result.error || result.message || 'Request failed', result);
      }

      return result as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Cannot connect to server. Please make sure the backend is running.');
      }
      throw error;
    }
  },

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    // 🔥 FIX: If token not provided, try to get from localStorage
    const authToken = token || getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { error: text || 'Invalid response' };
      }

      if (!response.ok) {
        throw new ApiError(response.status, result.error || result.message || 'Request failed', result);
      }

      return result as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Cannot connect to server. Please make sure the backend is running.');
      }
      throw error;
    }
  },

  // ===== FILE UPLOAD METHODS =====
  
  /**
   * Upload a single file
   */
  async uploadFile(file: File, type: string = 'doctors', token?: string): Promise<{ url: string; filename: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const authToken = token || getToken();
    
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const url = `${API_URL}/upload/single?type=${type}`;
    console.log(`📡 Uploading file to ${url}`);
    console.log(`📦 File: ${file.name} (${file.size} bytes, ${file.type})`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.error || errorData.message || 'Upload failed',
          errorData
        );
      }
      
      const result = await response.json();
      console.log('✅ File uploaded successfully:', result);
      
      return {
        url: result.data.url,
        filename: result.data.filename,
        size: result.data.size,
        mimetype: result.data.mimetype,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('❌ Upload error:', error);
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'File upload failed'
      );
    }
  },

  /**
   * Upload multiple files
   */
  async uploadMultiple(files: File[], type: string = 'gallery', token?: string): Promise<Array<{ url: string; filename: string; size: number; mimetype: string }>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const authToken = token || getToken();
    
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
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
          response.status,
          errorData.error || errorData.message || 'Upload failed',
          errorData
        );
      }
      
      const result = await response.json();
      console.log(`✅ ${result.data.length} files uploaded successfully`);
      
      return result.data.map((item: any) => ({
        url: item.url,
        filename: item.filename,
        size: item.size,
        mimetype: item.mimetype,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('❌ Upload error:', error);
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'File upload failed'
      );
    }
  },

  /**
   * Delete an uploaded file
   */
  async deleteFile(type: string, filename: string, token?: string): Promise<void> {
    const authToken = token || getToken();
    
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
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
          response.status,
          errorData.error || errorData.message || 'Delete failed',
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
        500,
        error instanceof Error ? error.message : 'File delete failed'
      );
    }
  },

  /**
   * Get all files in a directory
   */
  async getFiles(type: string, token?: string): Promise<Array<{ filename: string; url: string; size: number; modified: string; created: string }>> {
    const authToken = token || getToken();
    
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const url = `${API_URL}/upload/${type}`;
    console.log(`📡 Getting files from: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.error || errorData.message || 'Failed to get files',
          errorData
        );
      }
      
      const result = await response.json();
      console.log(`✅ Retrieved ${result.data.length} files`);
      
      return result.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('❌ Get files error:', error);
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'Failed to get files'
      );
    }
  },

  // ===== HELPER METHODS =====
  
  /**
   * Extract data from API response
   */
  extractData<T>(response: any): T {
    if (!response) return [] as unknown as T;
    if (Array.isArray(response)) return response as T;
    if (response.data && Array.isArray(response.data)) return response.data as T;
    if (response.data) return response.data as T;
    if (response.success && response.data) return response.data as T;
    return response as T;
  },
};

export default api;