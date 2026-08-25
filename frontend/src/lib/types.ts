// lib/types.ts - UPDATED VERSION

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isActive?: boolean;
  location?: string;
}

export interface Department {
  id: string;
  name: string;
  nameAmharic?: string | null;
  slug?: string;
  summary?: string;
  details?: string;
  description?: string;
  icon?: string | null;
  order?: number;
  code?: string; // Added for backend compatibility
  doctors?: Doctor[];
  services?: Service[];
  isActive?: boolean;
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

// 🔥 FIXED: Doctor interface matches backend response
export interface Doctor {
  id: string;
  name?: string; // Optional - backend may not have this directly
  title?: string; // Optional - backend may not have this
  userId?: string;
  doctorId?: string;
  user?: User; // Backend returns user object with firstName/lastName
  specialization?: string;
  subSpecialization?: string;
  bio?: string | null;
  photoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  departmentId?: string;
  department?: Department;
  isAvailable?: boolean;
  active?: boolean;
  scheduleSlots?: ScheduleSlot[];
  experience?: number;
  education?: string;
  rating?: number;
  consultationFee?: number;
  location?: string | null;
  licenseNumber?: string;
  licenseExpiry?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'MISSED';

// 🔥 FIXED: Appointment interface matches backend response
export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: number | null;
  patientGender?: string | null;
  departmentId?: string;
  department?: Department | string | null; // Can be object or string
  doctorId?: string | null;
  doctor?: Doctor | string | null; // Can be object or string
  serviceId?: string | null;
  service?: Service | null;
  appointmentDate?: string;
  date?: string;
  time?: string;
  note?: string | null;
  notes?: string | null;
  symptoms?: string | null;
  isEmergency?: boolean;
  status: AppointmentStatus;
  location?: string | null;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  
  // Home visit fields
  visitType?: 'HOSPITAL' | 'HOME' | string | null;
  city?: string | null;
  subCity?: string | null;
  woreda?: string | null;
  gpsPin?: string | null;
  homeAddress?: string | null;
  
  // Additional fields from backend
  reason?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category: string;
  published: boolean;
  publishedAt: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  description?: string | null;
  caption?: string | null;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DashboardSummary {
  totalAppointments: number;
  pendingAppointments: number;
  todaysAppointments: number;
  totalDoctors: number;
  totalDepartments: number;
  totalArticles: number;
  upcoming: Appointment[];
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  image?: string | null;
  departmentId: string;
  department?: Department;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// Upload response
export interface UploadResponse {
  url: string;
  filename: string;
  success: boolean;
  message?: string;
}