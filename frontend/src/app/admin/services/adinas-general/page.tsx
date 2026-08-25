'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api';
import { getToken, clearSession } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  Clock,
  DollarSign,
  Search,
  ChevronDown,
  Edit,
  Save,
  Building2,
  Upload,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  location: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  location: string;
  image: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  duration?: string;
  category?: string;
  image?: string;
}

const LOCATION = 'Adinas General Hospital';
const DEFAULT_CATEGORIES = [
  'Consultation',
  'Diagnostic',
  'Surgery',
  'Emergency',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Therapy',
  'Preventive Care',
  'Specialist'
];

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

const validateName = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Service name is required';
  }
  if (value.trim().length < 3) {
    return 'Service name must be at least 3 characters';
  }
  if (value.trim().length > 100) {
    return 'Service name must be less than 100 characters';
  }
  return null;
};

const validateDescription = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Description is required';
  }
  if (value.trim().length < 10) {
    return 'Description must be at least 10 characters';
  }
  if (value.trim().length > 500) {
    return 'Description must be less than 500 characters';
  }
  return null;
};

const validatePrice = (value: number): string | null => {
  if (value === undefined || value === null || value === 0) {
    return 'Price is required and must be greater than 0';
  }
  if (value < 0) {
    return 'Price cannot be negative';
  }
  if (value > 999999) {
    return 'Price cannot exceed 999,999';
  }
  if (!Number.isFinite(value)) {
    return 'Please enter a valid price';
  }
  return null;
};

const validateDuration = (value: number): string | null => {
  if (value === undefined || value === null || value === 0) {
    return 'Duration is required';
  }
  if (value < 5) {
    return 'Duration must be at least 5 minutes';
  }
  if (value > 480) {
    return 'Duration cannot exceed 480 minutes (8 hours)';
  }
  if (!Number.isInteger(value)) {
    return 'Duration must be a whole number';
  }
  return null;
};

const validateCategory = (value: string): string | null => {
  if (!value || value.trim().length === 0) {
    return 'Category is required';
  }
  return null;
};

const validateImage = (file: File | null, currentImage?: string): string | null => {
  if (!file && !currentImage) {
    return null;
  }
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must be less than 5MB';
    }
  }
  return null;
};

export default function AdminServicesAdinasGeneralPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    category: '',
    location: LOCATION,
    image: '',
    isActive: true
  });

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
  // MODAL SCROLL LOCK
  // ============================================================
  useEffect(() => {
    if (showModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDeleteModal]);

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) handleCloseModal();
        if (showDeleteModal) handleCloseDeleteModal();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !showModal && !showDeleteModal) {
        e.preventDefault();
        handleOpenModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showDeleteModal]);

  // ============================================================
  // LOAD SERVICES
  // ============================================================
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<any>(`/services?location=${encodeURIComponent(LOCATION)}`);
      
      let servicesData: Service[] = [];
      if (response) {
        if (Array.isArray(response)) {
          servicesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          servicesData = response.data;
        } else if (response.services && Array.isArray(response.services)) {
          servicesData = response.services;
        }
      }
      
      setServices(servicesData);
      console.log(`✅ Loaded ${servicesData.length} services for ${LOCATION}`);
    } catch (error: any) {
      console.error('❌ Failed to load services:', error);
      setError(error.message || 'Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // ============================================================
  // VALIDATION
  // ============================================================
  const validateField = (field: keyof FormErrors, value: any): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'description':
        return validateDescription(value);
      case 'price':
        return validatePrice(value);
      case 'duration':
        return validateDuration(value);
      case 'category':
        return validateCategory(value);
      case 'image':
        return validateImage(imageFile, formData.image);
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    const nameError = validateName(formData.name);
    if (nameError) errors.name = nameError;
    
    const descriptionError = validateDescription(formData.description);
    if (descriptionError) errors.description = descriptionError;
    
    const priceError = validatePrice(formData.price);
    if (priceError) errors.price = priceError;
    
    const durationError = validateDuration(formData.duration);
    if (durationError) errors.duration = durationError;
    
    const categoryError = validateCategory(formData.category);
    if (categoryError) errors.category = categoryError;
    
    const imageError = validateImage(imageFile, formData.image);
    if (imageError) errors.image = imageError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: keyof FormErrors, value: any) => {
    setFormData({ ...formData, [field]: value });
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, value);
    setFormErrors({ ...formErrors, [field]: error || undefined });
  };

  const getFieldStatus = (field: keyof FormErrors) => {
    if (!touched[field]) return null;
    if (formErrors[field]) return 'error';
    return 'success';
  };

  const hasError = (field: keyof FormErrors) => {
    return formErrors[field] && touched[field];
  };

  // ============================================================
  // IMAGE HANDLING
  // ============================================================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageError = validateImage(file, '');
      if (imageError) {
        setFormErrors({ ...formErrors, image: imageError });
        setError(imageError);
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormErrors({ ...formErrors, image: undefined });
      setError('');
    }
  };

  // ============================================================
  // MODAL HANDLING
  // ============================================================
  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.category,
        location: service.location,
        image: service.image || '',
        isActive: service.isActive
      });
      setImagePreview(service.image || '');
      setImageFile(null);
      setShowNewCategory(false);
      setNewCategory('');
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 30,
        category: '',
        location: LOCATION,
        image: '',
        isActive: true
      });
      setImagePreview('');
      setImageFile(null);
      setShowNewCategory(false);
      setNewCategory('');
    }
    setFormErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setError('');
    setFormErrors({});
    setTouched({});
    setImageFile(null);
    setImagePreview('');
    setShowNewCategory(false);
    setNewCategory('');
  };

  // ============================================================
  // DELETE MODAL HANDLING
  // ============================================================
  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    
    setDeletingId(serviceToDelete.id);
    setShowDeleteModal(false);
    
    try {
      const result = await api.delete(`/services/${serviceToDelete.id}`);
      setSuccess('Service deleted successfully!');
      await loadServices();
    } catch (error: any) {
      console.error('❌ Failed to delete service:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(error.message || 'Failed to delete service');
      }
    } finally {
      setDeletingId(null);
      setServiceToDelete(null);
    }
  };

  // ============================================================
  // CATEGORY HANDLING
  // ============================================================
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewCategory(true);
      setFormData({ ...formData, category: '' });
    } else {
      setShowNewCategory(false);
      setNewCategory('');
      setFormData({ ...formData, category: value });
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const trimmedCategory = newCategory.trim();
      if (!categories.includes(trimmedCategory)) {
        setCategories([...categories, trimmedCategory]);
        setFormData({ ...formData, category: trimmedCategory });
        setNewCategory('');
        setShowNewCategory(false);
        setTouched({ ...touched, category: true });
        setFormErrors({ ...formErrors, category: undefined });
      } else {
        setError(`Category "${trimmedCategory}" already exists`);
      }
    }
  };

  // ============================================================
  // SUBMIT HANDLER
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    if (!validateForm()) {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', String(formData.price));
      formDataToSend.append('duration', String(formData.duration));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('location', formData.location || LOCATION);
      formDataToSend.append('isActive', String(formData.isActive));
      
      // Add image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
        console.log('📁 Adding image to form data:', imageFile.name);
      }
      
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }
      
      const url = editingService 
        ? `http://localhost:5000/api/services/${editingService.id}`
        : 'http://localhost:5000/api/services';
      
      console.log(`📡 ${editingService ? 'PUT' : 'POST'} ${url}`);
      
      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      
      setUploading(false);
      
      if (!response.ok) {
        let errorMessage = 'Failed to save service';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('❌ Error response:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ Service saved:', result);
      
      setSuccess(editingService ? 'Service updated successfully!' : 'Service created successfully!');
      handleCloseModal();
      await loadServices();
    } catch (error: any) {
      setUploading(false);
      console.error('❌ Failed to save service:', error);
      setError(error.message || 'Failed to save service');
    }
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `http://localhost:5000${cleanPath}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Consultation': 'bg-blue-100 text-blue-700',
      'Diagnostic': 'bg-purple-100 text-purple-700',
      'Surgery': 'bg-red-100 text-red-700',
      'Emergency': 'bg-orange-100 text-orange-700',
      'Pharmacy': 'bg-green-100 text-green-700',
      'Laboratory': 'bg-yellow-100 text-yellow-700',
      'Radiology': 'bg-indigo-100 text-indigo-700',
      'Therapy': 'bg-pink-100 text-pink-700',
      'Preventive Care': 'bg-teal-100 text-teal-700',
      'Specialist': 'bg-cyan-100 text-cyan-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // ============================================================
  // FILTER SERVICES
  // ============================================================
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? service.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-end mb-6 flex-wrap gap-4">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={loadServices}
            disabled={loading}
            className="rounded-lg bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 px-4 py-2 text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="rounded-lg bg-[#2A3380] hover:bg-[#1E3A8A] text-white px-4 py-2 text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380] focus:border-transparent appearance-none bg-white text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="bg-[#2A3380]/10 text-[#2A3380] px-2 py-0.5 rounded-full text-xs font-medium">
              {filteredServices.length}
            </span>
            service{filteredServices.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-fade-in">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#2A3380] animate-spin" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Services Found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || categoryFilter ? 'Try adjusting your filters' : 'Click "Add Service" to create one'}
          </p>
          {!searchTerm && !categoryFilter && (
            <button
              onClick={() => handleOpenModal()}
              className="rounded-lg bg-[#2A3380] hover:bg-[#1E3A8A] text-white px-5 py-2 text-sm transition-colors"
            >
              + Add Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Service Image */}
              <div className="relative h-40 bg-gray-100">
                {service.image ? (
                  <Image
                    src={getImageUrl(service.image) || ''}
                    alt={service.name}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', service.image);
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'flex items-center justify-center h-full';
                        fallback.innerHTML = `<svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {!service.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-bold px-2 py-1 bg-red-500 rounded">Inactive</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-800 truncate">{service.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${getCategoryColor(service.category)}`}>
                  {service.category}
                </span>
                
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{service.description}</p>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(service.price)}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.duration} min
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(service)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(service)}
                      disabled={deletingId === service.id}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === service.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredServices.length > 0 && (
        <div className="mt-4 text-xs text-gray-400 flex items-center justify-end">
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} in {LOCATION}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && serviceToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseDeleteModal();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Service</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete <strong className="text-gray-900">"{serviceToDelete.name}"</strong>?
            </p>
            <p className="text-xs text-red-600 mb-4">
              ⚠️ This action cannot be undone. All data associated with this service will be permanently deleted.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete Service
              </button>
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="text-sm font-semibold text-gray-800">
                {editingService ? '✏️ Edit Service' : '➕ New Service'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Service preview"
                          width={80}
                          height={80}
                          unoptimized
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-white border border-gray-300 text-gray-600 p-1.5 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Service Image</p>
                    <p className="text-xs text-gray-400">Click the upload button to add an image</p>
                    <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, GIF, WebP (max 5MB)</p>
                    {formData.image && !imageFile && !imagePreview && (
                      <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>
                    )}
                    {getFieldStatus('image') === 'success' && imageFile && (
                      <p className="text-xs text-green-600 mt-1">✓ Image ready to upload</p>
                    )}
                  </div>
                </div>
              </div>
              {hasError('image') && (
                <p className="text-xs text-red-500 -mt-2">{formErrors.image}</p>
              )}

              {/* Service Name */}
              <div data-error={!!formErrors.name && touched.name}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Service Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => setTouched({ ...touched, name: true })}
                    className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                      hasError('name')
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : getFieldStatus('name') === 'success'
                        ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                    }`}
                    placeholder="Enter service name"
                    maxLength={100}
                  />
                  {getFieldStatus('name') === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                  {getFieldStatus('name') === 'error' && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                {hasError('name') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.name}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{formData.name.length}/100</p>
              </div>

              {/* Category */}
              <div data-error={!!formErrors.category && touched.category}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={handleCategoryChange}
                  onBlur={() => setTouched({ ...touched, category: true })}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('category')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new" className="text-[#2A3380] font-medium">+ Add New Category</option>
                </select>
                {hasError('category') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.category}</p>
                )}
              </div>

              {/* New Category Input */}
              {showNewCategory && (
                <div className="flex gap-2 items-center bg-[#2A3380]/5 border border-[#2A3380]/20 rounded-lg p-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380] outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory();
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3 py-1.5 bg-[#2A3380] text-white text-sm font-medium rounded-lg hover:bg-[#1E3A8A] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategory('');
                      setFormData({ ...formData, category: '' });
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Description */}
              <div data-error={!!formErrors.description && touched.description}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    onBlur={() => setTouched({ ...touched, description: true })}
                    className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                      hasError('description')
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : getFieldStatus('description') === 'success'
                        ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                    }`}
                    rows={2}
                    placeholder="Enter service description"
                    maxLength={500}
                  />
                  {getFieldStatus('description') === 'success' && (
                    <CheckCircle className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                  )}
                  {getFieldStatus('description') === 'error' && (
                    <XCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />
                  )}
                </div>
                {hasError('description') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.description}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{formData.description.length}/500</p>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div data-error={!!formErrors.price && touched.price}>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Price (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                      onBlur={() => setTouched({ ...touched, price: true })}
                      className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-sm transition-colors outline-none ${
                        hasError('price')
                          ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : getFieldStatus('price') === 'success'
                          ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                          : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                      }`}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {getFieldStatus('price') === 'success' && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {getFieldStatus('price') === 'error' && (
                      <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {hasError('price') && (
                    <p className="text-xs text-red-500 mt-0.5">{formErrors.price}</p>
                  )}
                </div>

                <div data-error={!!formErrors.duration && touched.duration}>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    Duration (min) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 0)}
                      onBlur={() => setTouched({ ...touched, duration: true })}
                      className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-sm transition-colors outline-none ${
                        hasError('duration')
                          ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : getFieldStatus('duration') === 'success'
                          ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                          : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                      }`}
                      min="5"
                      step="5"
                      placeholder="30"
                    />
                    {getFieldStatus('duration') === 'success' && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {getFieldStatus('duration') === 'error' && (
                      <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {hasError('duration') && (
                    <p className="text-xs text-red-500 mt-0.5">{formErrors.duration}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#2A3380] rounded focus:ring-[#2A3380]"
                  />
                  <span className="text-xs font-medium text-gray-700">Active</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-lg bg-[#2A3380] hover:bg-[#1E3A8A] text-white disabled:opacity-50 text-sm font-medium px-4 py-2 transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingService ? 'Update Service' : 'Create Service'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}