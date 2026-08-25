// app/admin/blog/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { getToken, clearSession } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import
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
  User,
  Tag,
  Eye,
  Save,
  AlertCircle,
  Image as ImageIcon,
  Video,
  Calendar,
  Heart,
  MessageSquare,
  BookOpen,
  Search,
  ChevronDown,
  Upload,
  Play,
  FileText,
  Globe
} from 'lucide-react';
import Image from 'next/image';

// ============================================================
// TYPES
// ============================================================

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  category: string;
  location: string;
  tags: string[];
  image?: string;
  videoUrl?: string;
  isPublished: boolean;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  location: string;
  tags: string[];
  image: string;
  videoUrl: string;
  mediaType: 'image' | 'video';
  isPublished: boolean;
}

interface FormErrors {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  media?: string;
  image?: string;
  videoUrl?: string;
  tags?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const LOCATION = 'Adinas General Hospital';
const DEFAULT_CATEGORIES = [
  'Medical News',
  'Health Tips',
  'Research',
  'Patient Stories',
  'Events',
  'Announcements',
  'Wellness',
  'Technology',
  'Education',
  'Community'
];

const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

const validateTitle = (value: string): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return 'Title is required';
  if (trimmed.length < 5) return 'Title must be at least 5 characters';
  if (trimmed.length > 200) return 'Title must be less than 200 characters';
  return null;
};

const validateContent = (value: string): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return 'Content is required';
  if (trimmed.length < 20) return 'Content must be at least 20 characters';
  if (trimmed.length > 10000) return 'Content must be less than 10,000 characters';
  return null;
};

const validateExcerpt = (value: string): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return 'Excerpt is required';
  if (trimmed.length < 10) return 'Excerpt must be at least 10 characters';
  if (trimmed.length > 500) return 'Excerpt must be less than 500 characters';
  return null;
};

const validateCategory = (value: string): string | null => {
  if (!value?.trim()) return 'Category is required';
  return null;
};

const isValidVideoUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
};

const validateMedia = (mediaType: string, image: string, videoUrl: string, imageFile: File | null): string | null => {
  if (!mediaType) return 'Please select a media type (Image or Video)';
  
  if (mediaType === 'image') {
    if (!image && !imageFile) return 'Please upload an image';
    if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
      }
      if (imageFile.size > IMAGE_MAX_SIZE) {
        return 'Image size must be less than 10MB';
      }
    }
  }
  
  if (mediaType === 'video') {
    if (!videoUrl?.trim()) return 'Please enter a video URL';
    if (!isValidVideoUrl(videoUrl)) {
      return 'Please enter a valid video URL (e.g., https://www.youtube.com/watch?v=...)';
    }
  }
  
  return null;
};

const validateTags = (tags: string[]): string | null => {
  if (tags.length === 0) return null;
  if (tags.length > 20) return 'Maximum 20 tags allowed';
  for (const tag of tags) {
    if (tag.length < 2) return 'Each tag must be at least 2 characters';
    if (tag.length > 30) return 'Each tag must be less than 30 characters';
  }
  return null;
};

// ============================================================
// COMPONENT
// ============================================================

export default function AdminBlogPage() {
  const { t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  
  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tagInput, setTagInput] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    location: LOCATION,
    tags: [],
    image: '',
    videoUrl: '',
    mediaType: 'image',
    isPublished: false
  });

  // ============================================================
  // API CALLS
  // ============================================================

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<any>(`/blog?location=${encodeURIComponent(LOCATION)}`, true);
      
      let postsData: BlogPost[] = [];
      if (Array.isArray(response)) {
        postsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response?.posts && Array.isArray(response.posts)) {
        postsData = response.posts;
      }
      
      setPosts(postsData);
    } catch (error: any) {
      console.error('Failed to load blog posts:', error);
      setError(error.message || 'Failed to load blog posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateField = useCallback((field: keyof FormErrors, value: any): string | null => {
    switch (field) {
      case 'title': return validateTitle(value);
      case 'content': return validateContent(value);
      case 'excerpt': return validateExcerpt(value);
      case 'category': return validateCategory(value);
      case 'media': return validateMedia(formData.mediaType, formData.image, formData.videoUrl, imageFile);
      case 'image': return validateMedia('image', formData.image, '', imageFile);
      case 'videoUrl': return validateMedia('video', '', value, null);
      case 'tags': return validateTags(formData.tags);
      default: return null;
    }
  }, [formData.mediaType, formData.image, formData.videoUrl, imageFile, formData.tags]);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    
    const titleError = validateTitle(formData.title);
    if (titleError) errors.title = titleError;
    
    const contentError = validateContent(formData.content);
    if (contentError) errors.content = contentError;
    
    const excerptError = validateExcerpt(formData.excerpt);
    if (excerptError) errors.excerpt = excerptError;
    
    const categoryError = validateCategory(formData.category);
    if (categoryError) errors.category = categoryError;
    
    const mediaError = validateMedia(formData.mediaType, formData.image, formData.videoUrl, imageFile);
    if (mediaError) errors.media = mediaError;
    
    const tagsError = validateTags(formData.tags);
    if (tagsError) errors.tags = tagsError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, imageFile]);

  const handleFieldChange = (field: keyof FormErrors, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const hasError = (field: keyof FormErrors) => {
    return formErrors[field] && touched[field];
  };

  // ============================================================
  // FILTERED POSTS
  // ============================================================

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter ? post.category === categoryFilter : true;
      const matchesStatus = statusFilter ? 
        (statusFilter === 'published' ? post.isPublished : !post.isPublished) : true;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [posts, searchTerm, categoryFilter, statusFilter]);

  // ============================================================
  // IMAGE HANDLING
  // ============================================================

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const imageError = validateMedia('image', '', '', file);
    if (imageError) {
      setFormErrors(prev => ({ ...prev, image: imageError }));
      setError(imageError);
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setFormData(prev => ({ 
        ...prev, 
        mediaType: 'image', 
        videoUrl: '' 
      }));
      setVideoPreview('');
      setVideoUrlInput('');
    };
    reader.readAsDataURL(file);
    setFormErrors(prev => ({ ...prev, image: undefined }));
    setError('');
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoUrlInput(url);
    setTouched(prev => ({ ...prev, videoUrl: true }));
    
    if (!url || !url.trim()) {
      setVideoPreview('');
      setFormData(prev => ({ ...prev, videoUrl: '', mediaType: 'image' }));
      setFormErrors(prev => ({ ...prev, videoUrl: undefined }));
      return;
    }

    if (isValidVideoUrl(url)) {
      setVideoPreview(url);
      setFormData(prev => ({ 
        ...prev, 
        videoUrl: url.trim(), 
        mediaType: 'video' 
      }));
      setPreviewImage('');
      setImageFile(null);
      setFormErrors(prev => ({ ...prev, videoUrl: undefined }));
    } else {
      setFormErrors(prev => ({ 
        ...prev, 
        videoUrl: 'Please enter a valid video URL (e.g., https://www.youtube.com/watch?v=...)' 
      }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = getToken();
    if (!token) throw new Error('No authentication token found');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload?type=blog`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    const data = await response.json();
    if (response.status === 401) {
      clearSession();
      throw new Error('Session expired. Please login again.');
    }
    if (!response.ok) throw new Error(data.error || data.message || 'Upload failed');
    return data.url;
  };

  // ============================================================
  // MODAL HANDLING
  // ============================================================

  const handleOpenModal = useCallback((post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        location: post.location,
        tags: post.tags || [],
        image: post.image || '',
        videoUrl: post.videoUrl || '',
        mediaType: post.videoUrl ? 'video' : 'image',
        isPublished: post.isPublished
      });
      setPreviewImage(post.image || '');
      setVideoPreview(post.videoUrl || '');
      setVideoUrlInput(post.videoUrl || '');
      setImageFile(null);
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        location: LOCATION,
        tags: [],
        image: '',
        videoUrl: '',
        mediaType: 'image',
        isPublished: false
      });
      setPreviewImage('');
      setVideoPreview('');
      setVideoUrlInput('');
      setImageFile(null);
      setTagInput('');
    }
    setFormErrors({});
    setTouched({});
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingPost(null);
    setError('');
    setFormErrors({});
    setTouched({});
    setTagInput('');
    setImageFile(null);
    setPreviewImage('');
    setVideoPreview('');
    setVideoUrlInput('');
    setIsSubmitting(false);
    setUploadingMedia(false);
  }, []);

  // ============================================================
  // TAG HANDLING
  // ============================================================

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    
    const tagsError = validateTags([...formData.tags, trimmedTag]);
    if (tagsError) {
      setFormErrors(prev => ({ ...prev, tags: tagsError }));
      return;
    }
    
    if (!formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setTagInput('');
      setFormErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // ============================================================
  // SUBMIT HANDLING
  // ============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    allTouched.media = true;
    setTouched(allTouched);
    
    if (!validateForm()) {
      setIsSubmitting(false);
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      let imageUrl = formData.image;
      let videoUrl = formData.videoUrl;
      let mediaType = formData.mediaType;

      if (imageFile && formData.mediaType === 'image') {
        setUploadingMedia(true);
        try {
          imageUrl = await uploadImage(imageFile);
          mediaType = 'image';
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload image');
          setIsSubmitting(false);
          setUploadingMedia(false);
          return;
        }
        setUploadingMedia(false);
      }

      if (formData.mediaType === 'video') {
        videoUrl = formData.videoUrl;
        mediaType = 'video';
      }

      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        category: formData.category,
        location: formData.location || LOCATION,
        tags: formData.tags,
        image: mediaType === 'image' ? imageUrl : '',
        videoUrl: mediaType === 'video' ? videoUrl : '',
        isPublished: formData.isPublished,
        author: 'Admin',
      };

      console.log('📤 Submitting data:', submitData);

      if (editingPost) {
        await api.put(`/blog/${editingPost.id}`, submitData, true);
        setSuccess('Blog post updated successfully!');
      } else {
        await api.post('/blog', submitData, true);
        setSuccess('Blog post created successfully!');
      }
      handleCloseModal();
      await loadPosts();
    } catch (error: any) {
      console.error('❌ Failed to save blog post:', error);
      setError(error.message || 'Failed to save blog post');
    } finally {
      setIsSubmitting(false);
      setUploadingMedia(false);
    }
  };

  // ============================================================
  // DELETE HANDLING
  // ============================================================

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      await api.delete(`/blog/${id}`, true);
      setSuccess('Blog post deleted successfully!');
      await loadPosts();
    } catch (error: any) {
      console.error('Failed to delete blog post:', error);
      setError(error.message || 'Failed to delete blog post');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/blog/${id}`, { isPublished: !currentStatus }, true);
      setSuccess(`Blog post ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
      await loadPosts();
    } catch (error: any) {
      console.error('Failed to toggle publish status:', error);
      setError(error.message || 'Failed to update blog post status');
    }
  };

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Medical News': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'Health Tips': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'Research': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'Patient Stories': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      'Events': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      'Announcements': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'Wellness': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
      'Technology': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      'Education': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
      'Community': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* Header - With dark mode support */}
      <div className="flex items-center justify-end mb-6 flex-wrap gap-4">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={loadPosts}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2 disabled:opacity-50
              ${isDark 
                ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:border-gray-600' 
                : 'bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700'}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleOpenModal()}
            className={`rounded-lg px-4 py-2 text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow-md
              ${isDark 
                ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8] text-white' 
                : 'bg-[#2A3380] hover:bg-[#1E3A8A] text-white'}`}
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Filters - With dark mode support */}
      <div className={`rounded-xl border p-4 mb-6 transition-colors duration-300
        ${isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] text-sm transition-colors
                  ${isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'}`}
                aria-label="Search blog posts"
              />
            </div>
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] appearance-none text-sm transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'}`}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-3 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] appearance-none text-sm transition-colors
                ${isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'}`}
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Alerts - With dark mode support */}
      {success && (
        <div className={`mb-6 p-3 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'}`} role="alert">
          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto" aria-label="Dismiss">
            <X className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </button>
        </div>
      )}

      {error && (
        <div className={`mb-6 p-3 border rounded-lg flex items-center gap-2 transition-colors duration-300
          ${isDark 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'}`} role="alert">
          <XCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button onClick={() => setError('')} className="ml-auto" aria-label="Dismiss">
            <X className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </button>
        </div>
      )}

      {/* Posts Grid - With dark mode support */}
      {loading ? (
        <div className="flex items-center justify-center p-12" aria-label="Loading">
          <Loader2 className={`w-8 h-8 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={`border rounded-xl p-12 text-center transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            No Blog Posts Found
          </h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchTerm || categoryFilter || statusFilter ? 
              'Try adjusting your filters' : 
              'Click "New Post" to create your first blog post'}
          </p>
          {!searchTerm && !categoryFilter && !statusFilter && (
            <button
              onClick={() => handleOpenModal()}
              className={`rounded-lg px-5 py-2 text-sm transition-colors shadow-sm hover:shadow-md
                ${isDark 
                  ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8] text-white' 
                  : 'bg-[#2A3380] hover:bg-[#1E3A8A] text-white'}`}
            >
              + New Post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className={`rounded-lg border overflow-hidden hover:shadow-md transition-all duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-700 hover:shadow-[#4A5BCC]/20' 
                : 'bg-white border-gray-200 hover:shadow-lg'}`}>
              {/* Post Image/Video */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : post.videoUrl ? (
                  <div className="flex items-center justify-center h-full bg-black">
                    <Play className="w-12 h-12 text-white/30" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    post.isPublished 
                      ? 'bg-green-500 dark:bg-green-600 text-white' 
                      : 'bg-gray-500 dark:bg-gray-600 text-white'
                  }`}>
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                {/* Media Type Badge */}
                <div className="absolute bottom-2 left-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    post.videoUrl 
                      ? 'bg-black/50 dark:bg-black/70 text-white' 
                      : 'bg-[#2A3380]/70 dark:bg-[#4A5BCC]/70 text-white'
                  }`}>
                    {post.videoUrl ? '🎬 Video' : '📷 Image'}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className={`text-sm font-semibold line-clamp-2 ${isDark ? 'text-white' : 'text-gray-800'}`} title={post.title}>
                  {post.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                </div>
                
                <p className={`text-xs mt-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {post.excerpt}
                </p>
                
                <div className={`flex items-center gap-3 mt-3 pt-3 border-t text-[10px] flex-wrap
                  ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {post.views || 0}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3" />
                    {post.likes || 0}
                  </span>
                </div>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Tag className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full
                        ${isDark 
                          ? 'bg-gray-700 text-gray-400' 
                          : 'bg-gray-100 text-gray-500'}`}>
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                <div className={`flex gap-1 mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={() => handleTogglePublish(post.id, post.isPublished)}
                    className={`flex-1 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                      post.isPublished
                        ? isDark 
                          ? 'text-gray-400 hover:bg-gray-700' 
                          : 'text-gray-500 hover:bg-gray-100'
                        : isDark
                          ? 'text-[#4A5BCC] hover:bg-[#4A5BCC]/10'
                          : 'text-[#2A3380] hover:bg-[#2A3380]/10'
                    }`}
                  >
                    {post.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleOpenModal(post)}
                    className={`flex-1 text-[10px] font-medium px-2 py-1 rounded transition-colors
                      ${isDark 
                        ? 'text-[#4A5BCC] hover:bg-[#4A5BCC]/10 hover:text-[#5B6BD8]' 
                        : 'text-[#2A3380] hover:bg-[#2A3380]/10 hover:text-[#1E3A8A]'}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className={`flex-1 text-[10px] font-medium px-2 py-1 rounded transition-colors
                      ${isDark 
                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredPosts.length > 0 && (
        <div className={`mt-4 text-xs flex items-center justify-end ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} in {LOCATION}
        </div>
      )}

      {/* Modal - With dark mode support */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800' 
              : 'bg-white'}`}>
            <div className={`sticky top-0 border-b px-4 py-3 flex items-center justify-between rounded-t-xl transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingPost ? (
                  <>
                    <Pencil className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
                    Edit Post
                  </>
                ) : (
                  <>
                    <Plus className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
                    New Post
                  </>
                )}
              </h3>
              <button
                onClick={handleCloseModal}
                className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Title */}
              <div data-error={!!formErrors.title && touched.title}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('title')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                  placeholder="Enter blog title"
                  maxLength={200}
                />
                {hasError('title') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.title}</p>
                )}
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.title.length}/200
                </p>
              </div>

              {/* Category */}
              <div data-error={!!formErrors.category && touched.category}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('category')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                >
                  <option value="">Select category</option>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {hasError('category') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.category}</p>
                )}
              </div>

              {/* Excerpt */}
              <div data-error={!!formErrors.excerpt && touched.excerpt}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Excerpt <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, excerpt: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('excerpt')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                  rows={2}
                  placeholder="Brief summary"
                  maxLength={500}
                />
                {hasError('excerpt') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.excerpt}</p>
                )}
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.excerpt.length}/500
                </p>
              </div>

              {/* Content */}
              <div data-error={!!formErrors.content && touched.content}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, content: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none font-mono ${
                    hasError('content')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                  rows={6}
                  placeholder="Write your content here..."
                  maxLength={10000}
                />
                {hasError('content') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.content}</p>
                )}
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.content.length}/10000
                </p>
              </div>

              {/* Media Type */}
              <div data-error={!!formErrors.media && touched.media}>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Media Type <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, mediaType: 'image', videoUrl: '' }));
                      setVideoPreview('');
                      setVideoUrlInput('');
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      formData.mediaType === 'image'
                        ? isDark
                          ? 'bg-[#4A5BCC] text-white'
                          : 'bg-[#2A3380] text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, mediaType: 'video' }));
                      setPreviewImage('');
                      setImageFile(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      formData.mediaType === 'video'
                        ? isDark
                          ? 'bg-[#4A5BCC] text-white'
                          : 'bg-[#2A3380] text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    Video
                  </button>
                </div>
                {hasError('media') && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.media}</p>
                )}
              </div>

              {/* Image Upload */}
              {formData.mediaType === 'image' && (
                <div data-error={!!formErrors.image && touched.image}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      previewImage 
                        ? isDark ? 'border-green-700 bg-green-900/20' : 'border-green-400 bg-green-50'
                        : isDark ? 'border-gray-600 hover:border-[#4A5BCC]' : 'border-gray-300 hover:border-[#2A3380]'
                    }`}
                  >
                    {previewImage ? (
                      <div className="relative">
                        <div className={`relative w-full h-36 rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Image
                            src={previewImage}
                            alt="Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage('');
                            setImageFile(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          ✓ Image uploaded
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className={`w-8 h-8 mx-auto mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Click to upload image
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          JPG, PNG, GIF, WebP (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  {hasError('image') && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.image}</p>
                  )}
                </div>
              )}

              {/* Video URL */}
              {formData.mediaType === 'video' && (
                <div data-error={!!formErrors.videoUrl && touched.videoUrl}>
                  <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Video URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, videoUrl: true }))}
                    className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                      hasError('videoUrl')
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : isDark
                          ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]'
                          : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                    }`}
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  />
                  {hasError('videoUrl') && (
                    <p className="text-xs text-red-500 mt-0.5">{formErrors.videoUrl}</p>
                  )}
                  {videoPreview && (
                    <div className="mt-2 relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              <div data-error={!!formErrors.tags && touched.tags}>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Tags
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors
                      ${isDark 
                        ? 'border-gray-600 bg-gray-700 text-white focus:border-[#4A5BCC] focus:ring-1 focus:ring-[#4A5BCC]' 
                        : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'}`}
                    placeholder="Add tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className={`px-3 py-1.5 rounded-lg transition-colors text-sm
                      ${isDark 
                        ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8] text-white' 
                        : 'bg-[#2A3380] hover:bg-[#1E3A8A] text-white'}`}
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                          ${isDark 
                            ? 'bg-[#4A5BCC]/20 text-[#4A5BCC]' 
                            : 'bg-[#2A3380]/10 text-[#2A3380]'}`}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className={isDark ? 'hover:text-[#5B6BD8]' : 'hover:text-[#1E3A8A]'}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {hasError('tags') && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.tags}</p>
                )}
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.tags.length} tags
                </p>
              </div>

              {/* Location */}
              <div>
                <label className={`block text-xs font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  disabled
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm cursor-not-allowed
                    ${isDark 
                      ? 'bg-gray-700 border-gray-600 text-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                />
              </div>

              {/* Publish */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className={`w-4 h-4 rounded focus:ring-[#2A3380] 
                      ${isDark ? 'bg-gray-700 border-gray-600 text-[#4A5BCC]' : 'text-[#2A3380]'}`}
                  />
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Publish immediately
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <button
                  type="submit"
                  disabled={uploadingMedia || isSubmitting}
                  className={`flex-1 rounded-lg text-white text-sm font-medium px-4 py-1.5 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50
                    ${isDark 
                      ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                      : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
                >
                  {uploadingMedia || isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {uploadingMedia ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {editingPost ? 'Update' : 'Add'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`flex-1 rounded-lg text-sm font-medium px-4 py-1.5 transition-colors
                    ${isDark 
                      ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500' 
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}
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