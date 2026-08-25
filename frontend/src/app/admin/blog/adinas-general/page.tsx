// app/admin/blog/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
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

// 🔥 FIXED: Video URL validation using URL constructor
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

  // 🔥 FIXED: Video URL handler with proper validation
  const handleVideoUrlChange = (url: string) => {
    setVideoUrlInput(url);
    setTouched(prev => ({ ...prev, videoUrl: true }));
    
    if (!url || !url.trim()) {
      setVideoPreview('');
      setFormData(prev => ({ ...prev, videoUrl: '', mediaType: 'image' }));
      setFormErrors(prev => ({ ...prev, videoUrl: undefined }));
      return;
    }

    // Check if it's a valid URL
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
    
    // Mark all fields as touched
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
      'Medical News': 'bg-blue-100 text-blue-700',
      'Health Tips': 'bg-green-100 text-green-700',
      'Research': 'bg-purple-100 text-purple-700',
      'Patient Stories': 'bg-pink-100 text-pink-700',
      'Events': 'bg-orange-100 text-orange-700',
      'Announcements': 'bg-yellow-100 text-yellow-700',
      'Wellness': 'bg-teal-100 text-teal-700',
      'Technology': 'bg-indigo-100 text-indigo-700',
      'Education': 'bg-cyan-100 text-cyan-700',
      'Community': 'bg-rose-100 text-rose-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
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
      {/* Header */}
      <div className="flex items-center justify-end mb-6 flex-wrap gap-4">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={loadPosts}
            disabled={loading}
            className="rounded-lg bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 px-4 py-2 text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="rounded-lg bg-[#2A3380] hover:bg-[#1E3A8A] text-white px-4 py-2 text-sm transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Post
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
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] text-sm"
                aria-label="Search blog posts"
              />
            </div>
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] appearance-none bg-white text-sm"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A3380]/50 focus:border-[#2A3380] appearance-none bg-white text-sm"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="text-sm text-gray-500">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2" role="alert">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto" aria-label="Dismiss">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2" role="alert">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError('')} className="ml-auto" aria-label="Dismiss">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12" aria-label="Loading">
          <Loader2 className="w-8 h-8 text-[#2A3380] animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Blog Posts Found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchTerm || categoryFilter || statusFilter ? 
              'Try adjusting your filters' : 
              'Click "New Post" to create your first blog post'}
          </p>
          {!searchTerm && !categoryFilter && !statusFilter && (
            <button
              onClick={() => handleOpenModal()}
              className="rounded-lg bg-[#2A3380] hover:bg-[#1E3A8A] text-white px-5 py-2 text-sm transition-colors shadow-sm hover:shadow-md"
            >
              + New Post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Post Image/Video */}
              <div className="relative h-48 bg-gray-100">
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
                    <FileText className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    post.isPublished 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                {/* Media Type Badge */}
                <div className="absolute bottom-2 left-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    post.videoUrl ? 'bg-black/50 text-white' : 'bg-[#2A3380]/70 text-white'
                  }`}>
                    {post.videoUrl ? '🎬 Video' : '📷 Image'}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-800 line-clamp-2" title={post.title}>
                  {post.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{post.excerpt}</p>
                
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex-wrap">
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
                    <Tag className="w-3 h-3 text-gray-400" />
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-[9px] text-gray-400">+{post.tags.length - 2}</span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleTogglePublish(post.id, post.isPublished)}
                    className={`flex-1 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                      post.isPublished
                        ? 'text-gray-500 hover:bg-gray-100'
                        : 'text-[#2A3380] hover:bg-[#2A3380]/10'
                    }`}
                  >
                    {post.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleOpenModal(post)}
                    className="flex-1 text-[10px] text-[#2A3380] hover:text-[#1E3A8A] font-medium hover:bg-[#2A3380]/10 px-2 py-1 rounded transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex-1 text-[10px] text-gray-500 hover:text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
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
        <div className="mt-4 text-xs text-gray-400 flex items-center justify-end">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} in {LOCATION}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                {editingPost ? (
                  <>
                    <Pencil className="w-4 h-4 text-[#2A3380]" />
                    Edit Post
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#2A3380]" />
                    New Post
                  </>
                )}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Title */}
              <div data-error={!!formErrors.title && touched.title}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
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
                      : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                  placeholder="Enter blog title"
                  maxLength={200}
                />
                {hasError('title') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.title}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{formData.title.length}/200</p>
              </div>

              {/* Category */}
              <div data-error={!!formErrors.category && touched.category}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('category')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
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
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Excerpt <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, excerpt: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none ${
                    hasError('excerpt')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                  rows={2}
                  placeholder="Brief summary"
                  maxLength={500}
                />
                {hasError('excerpt') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.excerpt}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{formData.excerpt.length}/500</p>
              </div>

              {/* Content */}
              <div data-error={!!formErrors.content && touched.content}>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, content: true }))}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none font-mono ${
                    hasError('content')
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-200 focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380]'
                  }`}
                  rows={6}
                  placeholder="Write your content here..."
                  maxLength={10000}
                />
                {hasError('content') && (
                  <p className="text-xs text-red-500 mt-0.5">{formErrors.content}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{formData.content.length}/10000</p>
              </div>

              {/* Media Type */}
              <div data-error={!!formErrors.media && touched.media}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        ? 'bg-[#2A3380] text-white'
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
                        ? 'bg-[#2A3380] text-white'
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
                      previewImage ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#2A3380]'
                    }`}
                  >
                    {previewImage ? (
                      <div className="relative">
                        <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gray-100">
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
                        <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Click to upload image</p>
                        <p className="text-[10px] text-gray-400">JPG, PNG, GIF, WebP (max 10MB)</p>
                      </div>
                    )}
                  </div>
                  {hasError('image') && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.image}</p>
                  )}
                </div>
              )}

              {/* 🔥 FIXED: Video URL */}
              {formData.mediaType === 'video' && (
                <div data-error={!!formErrors.videoUrl && touched.videoUrl}>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
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
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  Tags
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#2A3380] focus:ring-1 focus:ring-[#2A3380] outline-none transition-colors"
                    placeholder="Add tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-[#2A3380] hover:bg-[#1E3A8A] text-white rounded-lg transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2A3380]/10 text-[#2A3380] rounded-full text-xs"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-[#1E3A8A]"
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
                <p className="text-[10px] text-gray-400 mt-0.5">{formData.tags.length} tags</p>
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

              {/* Publish */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="w-4 h-4 text-[#2A3380] rounded focus:ring-[#2A3380]"
                  />
                  <span className="text-xs font-medium text-gray-700">Publish immediately</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={uploadingMedia || isSubmitting}
                  className="flex-1 rounded-lg bg-[#2A3380] text-white hover:bg-[#1E3A8A] disabled:opacity-50 text-sm font-medium px-4 py-1.5 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
                  className="flex-1 rounded-lg bg-white border border-gray-200 text-gray-500 text-sm font-medium px-4 py-1.5 hover:bg-gray-50 hover:border-gray-300 transition-colors"
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