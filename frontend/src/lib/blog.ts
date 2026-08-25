// lib/blog.ts
import { api } from './api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  category: string;
  location: string;
  tags: string[];
  image?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogResponse {
  success: boolean;
  data: BlogPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ===== PUBLIC API =====
export async function getBlogPosts(params?: {
  location?: string;
  category?: string;
  search?: string;
  limit?: number;
  page?: number;
  published?: boolean;
}): Promise<BlogResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.location) queryParams.append('location', params.location);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.page) queryParams.append('page', String(params.page));
    
    // Default to published=true for public view
    if (params?.published !== undefined) {
      queryParams.append('published', String(params.published));
    } else {
      queryParams.append('published', 'true');
    }

    const endpoint = `/blog?${queryParams.toString()}`;
    console.log('📡 Fetching blogs from:', endpoint);
    
    const response = await api.get<any>(endpoint, true);
    
    console.log('📊 Blog API Response:', response);
    
    let postsData: BlogPost[] = [];
    let pagination = { total: 0, page: 1, limit: 20, pages: 0 };

    if (response) {
      // If response is directly an array
      if (Array.isArray(response)) {
        postsData = response;
      } 
      // If response has data property
      else if (response.data && Array.isArray(response.data)) {
        postsData = response.data;
        if (response.pagination) {
          pagination = response.pagination;
        }
      } 
      // If response has posts property
      else if (response.posts && Array.isArray(response.posts)) {
        postsData = response.posts;
      }
      // If response has success and data
      else if (response.success && response.data && Array.isArray(response.data)) {
        postsData = response.data;
        if (response.pagination) {
          pagination = response.pagination;
        }
      }
    }

    // Filter to only show published posts
    postsData = postsData.filter(post => post.isPublished === true);

    console.log(`✅ Loaded ${postsData.length} published blog posts`);

    return {
      success: true,
      data: postsData,
      pagination: pagination
    };
  } catch (error) {
    console.error('❌ Failed to fetch blog posts:', error);
    return { 
      success: false, 
      data: [], 
      pagination: { total: 0, page: 1, limit: 20, pages: 0 } 
    };
  }
}

export async function getBlogPostsByLocation(
  location: string, 
  params?: { limit?: number; page?: number }
): Promise<BlogResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.page) queryParams.append('page', String(params.page));

    const endpoint = `/blog/location/${encodeURIComponent(location)}?${queryParams.toString()}`;
    console.log('📡 Fetching blogs by location:', endpoint);
    
    const response = await api.get<any>(endpoint, true);
    
    let postsData: BlogPost[] = [];
    let pagination = { total: 0, page: 1, limit: 10, pages: 0 };

    if (response) {
      if (Array.isArray(response)) {
        postsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        postsData = response.data;
        if (response.pagination) {
          pagination = response.pagination;
        }
      } else if (response.posts && Array.isArray(response.posts)) {
        postsData = response.posts;
      } else if (response.success && response.data && Array.isArray(response.data)) {
        postsData = response.data;
        if (response.pagination) {
          pagination = response.pagination;
        }
      }
    }

    return {
      success: true,
      data: postsData,
      pagination: pagination
    };
  } catch (error) {
    console.error(`❌ Failed to fetch blogs for ${location}:`, error);
    return { 
      success: false, 
      data: [], 
      pagination: { total: 0, page: 1, limit: 10, pages: 0 } 
    };
  }
}

export async function getBlogPostsByCategory(
  category: string, 
  params?: { limit?: number; page?: number }
): Promise<BlogResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.page) queryParams.append('page', String(params.page));

    const endpoint = `/blog/category/${encodeURIComponent(category)}?${queryParams.toString()}`;
    console.log('📡 Fetching blogs by category:', endpoint);
    
    const response = await api.get<any>(endpoint, true);
    
    let postsData: BlogPost[] = [];
    let pagination = { total: 0, page: 1, limit: 10, pages: 0 };

    if (response) {
      if (Array.isArray(response)) {
        postsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        postsData = response.data;
        if (response.pagination) {
          pagination = response.pagination;
        }
      } else if (response.posts && Array.isArray(response.posts)) {
        postsData = response.posts;
      } else if (response.success && response.data && Array.isArray(response.data)) {
        postsData = response.data;
        if (response.pagination) {
          pagination = response.pagination;
        }
      }
    }

    return {
      success: true,
      data: postsData,
      pagination: pagination
    };
  } catch (error) {
    console.error(`❌ Failed to fetch blogs for category ${category}:`, error);
    return { 
      success: false, 
      data: [], 
      pagination: { total: 0, page: 1, limit: 10, pages: 0 } 
    };
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await api.get<any>(`/blog/slug/${slug}`, true);
    
    if (response) {
      if (response.data) {
        return response.data;
      }
      if (response.id && response.title) {
        return response;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch blog post:', error);
    return null;
  }
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const response = await api.get<any>(`/blog/${id}`, true);
    
    if (response) {
      if (response.data) {
        return response.data;
      }
      if (response.id && response.title) {
        return response;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch blog post:', error);
    return null;
  }
}

export async function likeBlogPost(id: string): Promise<{ likes: number } | null> {
  try {
    const response = await api.post<any>(`/blog/${id}/like`, {}, false);
    
    if (response) {
      if (response.data) {
        return response.data;
      }
      if (response.likes !== undefined) {
        return response;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to like blog post:', error);
    return null;
  }
}

// ============================================================
// 🔥 FIXED: VIDEO URL FUNCTIONS
// ============================================================

/**
 * Check if a URL is a video URL
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  
  const videoExtensions = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i;
  const videoPlatforms = /(youtube|youtu\.be|vimeo|dailymotion|twitch|facebook\.com\/watch|instagram\.com\/p)/i;
  
  return videoExtensions.test(url) || videoPlatforms.test(url);
}

/**
 * Get embed URL for video platforms
 * Supports: YouTube, Vimeo, Dailymotion, and direct video files
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  const trimmedUrl = url.trim();
  
  // Check if it's already an embed URL
  if (trimmedUrl.includes('/embed/')) {
    return trimmedUrl;
  }
  
  // Check if it's a direct video file
  if (trimmedUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
    return trimmedUrl;
  }
  
  // YouTube patterns (including shorts)
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?#]+)/,
    /youtube\.com\/embed\/([^&\s?#]+)/,
    /youtube\.com\/v\/([^&\s?#]+)/,
    /youtube\.com\/shorts\/([^&\s?#]+)/,
    /youtube\.com\/live\/([^&\s?#]+)/,
  ];
  
  for (const pattern of youtubePatterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      // Check if it's a valid YouTube video ID (11 characters)
      if (videoId.length === 11 || videoId.length > 10) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Vimeo patterns
  const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Dailymotion patterns
  const dailymotionMatch = trimmedUrl.match(/dailymotion\.com\/video\/([^_\s]+)/);
  if (dailymotionMatch && dailymotionMatch[1]) {
    return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
  }
  
  // Facebook video
  const facebookMatch = trimmedUrl.match(/facebook\.com\/watch\/?\?v=(\d+)/);
  if (facebookMatch && facebookMatch[1]) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmedUrl)}`;
  }
  
  // If it's a valid URL but not a known platform, return it as is
  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    // Not a valid URL
    return null;
  }
}

/**
 * Get video thumbnail/poster URL
 */
export function getVideoThumbnail(url: string): string | null {
  if (!url) return null;
  
  const trimmedUrl = url.trim();
  
  // YouTube thumbnail
  const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?#]+)/);
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
  }
  
  // Vimeo thumbnail - we'd need to fetch via API, so return null
  return null;
}

/**
 * Check if URL is YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /(youtube\.com|youtu\.be)/i.test(url);
}

/**
 * Check if URL is Vimeo
 */
export function isVimeoUrl(url: string): boolean {
  if (!url) return false;
  return /vimeo\.com/i.test(url);
}

/**
 * Get platform name from URL
 */
export function getVideoPlatform(url: string): string {
  if (!url) return 'Unknown';
  
  if (isYouTubeUrl(url)) return 'YouTube';
  if (isVimeoUrl(url)) return 'Vimeo';
  if (/dailymotion\.com/i.test(url)) return 'Dailymotion';
  if (/facebook\.com/i.test(url)) return 'Facebook';
  if (/instagram\.com/i.test(url)) return 'Instagram';
  if (/twitch\.tv/i.test(url)) return 'Twitch';
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) return 'Video File';
  
  return 'Unknown';
}