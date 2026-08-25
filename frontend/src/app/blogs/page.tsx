// app/blogs/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { useTheme } from "@/contexts/ThemeProvider"; // ✅ Added theme import

import { getBlogPosts, BlogPost, getYouTubeEmbedUrl } from "@/lib/blog";
import {
  Search,
  Tag,
  Eye,
  Heart,
  MessageSquare,
  Play,
  Calendar,
  User,
  MapPin,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Loader2,
} from "lucide-react";

export default function BlogsPage() {
  return (
    <Suspense fallback={<BlogsLoadingFallback />}>
      <BlogsContent />
    </Suspense>
  );
}

function BlogsLoadingFallback() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>
      <Header />
      <main className="flex-grow flex items-center justify-center py-20">
        <Loader2 className={`w-8 h-8 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
      </main>
    </div>
  );
}

function BlogsContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location");

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLocation, setSelectedLocation] = useState<string>(
    locationParam ? getLocationFromParam(locationParam) : "All"
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeModalBlog, setActiveModalBlog] = useState<BlogPost | null>(null);
  const [likedBlogIds, setLikedBlogIds] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsMap, setCommentsMap] = useState<Record<string, Array<{ author: string; text: string; date: string }>>>({});

  function getLocationFromParam(param: string): string {
    const map: { [key: string]: string } = {
      hospital: "Adinas General Hospital",
      diagnostics: "Adinas Diagnosis Center",
      pharma: "Adinas Drug Manufacturing",
    };
    return map[param] || "All";
  }

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBlogPosts({ published: true });
      if (response.success) {
        setBlogs(response.data || []);
      } else {
        setError("Failed to load blogs. Please try again.");
        setBlogs([]);
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
      setError("Failed to load blogs. Please try again later.");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(blogs.map(b => b.category)));
  const locations = Array.from(new Set(blogs.map(b => b.location)));

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = searchQuery.trim() === "" ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;
    const matchesLocation = selectedLocation === "All" || blog.location === selectedLocation;
    const matchesTag = !selectedTag || blog.tags.includes(selectedTag);
    return matchesSearch && matchesCategory && matchesLocation && matchesTag;
  });

  const featuredBlog = blogs.find(b => b.videoUrl || b.image) || blogs[0];

  const handleToggleLike = (e: React.MouseEvent, blogId: string) => {
    e.stopPropagation();
    const isLiked = likedBlogIds[blogId];
    setLikedBlogIds(prev => ({ ...prev, [blogId]: !isLiked }));
    setBlogs(prev => prev.map(b =>
      b.id === blogId ? { ...b, likes: isLiked ? b.likes - 1 : b.likes + 1 } : b
    ));
    if (activeModalBlog && activeModalBlog.id === blogId) {
      setActiveModalBlog(prev => prev ? { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 } : null);
    }
  };

  const handleOpenBlog = (blog: BlogPost) => {
    setActiveModalBlog(blog);
    setBlogs(prev => prev.map(b =>
      b.id === blog.id ? { ...b, views: b.views + 1 } : b
    ));
  };

  const handleAddComment = (e: React.FormEvent, blogId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const commentObj = {
      author: "You",
      text: newCommentText.trim(),
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setCommentsMap(prev => ({
      ...prev,
      [blogId]: [...(prev[blogId] || []), commentObj],
    }));
    setBlogs(prev => prev.map(b =>
      b.id === blogId ? { ...b, comments: b.comments + 1 } : b
    ));
    if (activeModalBlog && activeModalBlog.id === blogId) {
      setActiveModalBlog(prev => prev ? { ...prev, comments: prev.comments + 1 } : null);
    }
    setNewCommentText("");
  };

  // Render error state - with dark mode support
  if (error && !loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>
        <Header />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="text-center px-4">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Oops! Something went wrong
            </h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{error}</p>
            <button
              onClick={() => loadBlogs()}
              className={`px-6 py-3 rounded-xl text-white font-semibold transition-colors
                ${isDark 
                  ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                  : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>
      <Header />
      <main className="flex-grow pb-20">
        {/* Hero Section - With dark mode support */}
        <section className={`relative pt-24 pb-10 border-b transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border mb-3
                ${isDark 
                  ? 'bg-[#4A5BCC]/20 text-[#4A5BCC] border-[#4A5BCC]/30' 
                  : 'bg-[#2A3380]/10 text-[#2A3380] border-[#2A3380]/20'}`}>
                <Sparkles className="w-3 h-3" />
                <span>Adinas Group Newsroom</span>
              </div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight transition-colors duration-300
                ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Health & Medical Blog
              </h1>
              <p className={`text-sm mt-2 max-w-2xl mx-auto transition-colors duration-300
                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Latest news, health tips, and insights from our medical experts
              </p>
              <div className="mt-4 max-w-xl mx-auto">
                <div className="relative flex items-center">
                  <Search className={`absolute left-3 w-4 h-4 pointer-events-none
                    ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className={`w-full pl-9 pr-8 py-2.5 rounded-xl border transition-all text-sm
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A5BCC] focus:border-transparent' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#2A3380] focus:border-transparent'}`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className={`absolute right-3 transition-colors
                        ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters - With dark mode support */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider mr-1 flex items-center gap-1
              ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Filter className="w-3 h-3" /> Categories:
            </span>
            <button
              onClick={() => { setSelectedCategory("All"); setSelectedTag(null); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === "All"
                  ? isDark ? "bg-[#4A5BCC] text-white" : "bg-[#2A3380] text-white"
                  : isDark 
                    ? "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedTag(null); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? isDark ? "bg-[#4A5BCC] text-white" : "bg-[#2A3380] text-white"
                    : isDark 
                      ? "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className={`text-[10px] font-semibold uppercase tracking-wider ml-2 flex items-center gap-1
              ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <MapPin className="w-3 h-3" /> Location:
            </span>
            <button
              onClick={() => setSelectedLocation("All")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedLocation === "All"
                  ? isDark ? "bg-[#4A5BCC] text-white" : "bg-[#2A3380] text-white"
                  : isDark 
                    ? "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedLocation === loc
                    ? isDark ? "bg-[#4A5BCC] text-white" : "bg-[#2A3380] text-white"
                    : isDark 
                      ? "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {loc.replace("Adinas ", "")}
              </button>
            ))}
          </div>
          {selectedTag && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Filtered by tag:
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                ${isDark 
                  ? 'bg-[#4A5BCC]/20 text-[#4A5BCC]' 
                  : 'bg-[#2A3380]/10 text-[#2A3380]'}`}>
                #{selectedTag}
                <button 
                  onClick={() => setSelectedTag(null)} 
                  className={`ml-1 hover:text-red-600 ${isDark ? 'hover:text-red-400' : ''}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </section>

        {/* Featured Blog - With dark mode support */}
        {!loading && !error && selectedCategory === "All" && selectedLocation === "All" && !searchQuery && !selectedTag && featuredBlog && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className={`relative rounded-xl overflow-hidden shadow-sm grid md:grid-cols-12 gap-0 group transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200'}`}>
              <div className="md:col-span-5 relative min-h-[200px] md:min-h-[280px] bg-gray-900 flex items-center justify-center">
                {featuredBlog.image ? (
                  <img src={featuredBlog.image} alt={featuredBlog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2A3380] via-gray-900 to-gray-950 flex flex-col items-center justify-center p-6 text-center">
                    <Sparkles className="w-12 h-12 text-[#2A3380]/40 mb-3" />
                    <span className="text-gray-400 text-xs font-medium">Adinas Group Highlight</span>
                  </div>
                )}
                {featuredBlog.videoUrl && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                    <button 
                      onClick={() => handleOpenBlog(featuredBlog)} 
                      className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300
                        ${isDark ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}>
                      <Play className="w-6 h-6 ml-1 fill-current" />
                    </button>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#2A3380] text-white text-[9px] font-bold shadow-md">Featured</span>
                  {featuredBlog.videoUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold shadow-md flex items-center gap-1">
                      <Play className="w-2 h-2 fill-current" /> Video
                    </span>
                  )}
                </div>
              </div>
              <div className="md:col-span-7 p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className={`font-semibold ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
                      {featuredBlog.category}
                    </span>
                    <span>•</span>
                    <span className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : ''}`}>
                      <MapPin className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      {featuredBlog.location}
                    </span>
                  </div>
                  <h2 
                    onClick={() => handleOpenBlog(featuredBlog)} 
                    className={`text-lg sm:text-xl font-bold tracking-tight cursor-pointer transition-colors line-clamp-2
                      ${isDark 
                        ? 'text-white hover:text-[#4A5BCC]' 
                        : 'text-gray-900 hover:text-[#2A3380]'}`}>
                    {featuredBlog.title}
                  </h2>
                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {featuredBlog.excerpt}
                  </p>
                </div>
                <div className={`pt-3 mt-3 flex items-center justify-between
                  ${isDark ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-[10px]
                      ${isDark 
                        ? 'bg-[#4A5BCC]/30 text-[#4A5BCC]' 
                        : 'bg-[#2A3380]/20 text-[#2A3380]'}`}>
                      {featuredBlog.author?.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className={`text-[10px] font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {featuredBlog.author || "Admin"}
                      </p>
                      <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(featuredBlog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenBlog(featuredBlog)} 
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-[10px] font-semibold transition-all shadow-sm
                      ${isDark 
                        ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                        : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}>
                    {featuredBlog.videoUrl ? "Watch" : "Read More"}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Blog Grid - With dark mode support */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {loading ? "Loading..." : `${filteredBlogs.length} ${filteredBlogs.length === 1 ? "Article" : "Articles"}`}
            </h2>
            {(searchQuery || selectedCategory !== "All" || selectedLocation !== "All" || selectedTag) && (
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedLocation("All"); setSelectedTag(null); }} 
                className={`text-[10px] font-semibold hover:underline
                  ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
                Clear Filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-8 h-8 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} animate-spin`} />
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className={`text-center py-12 rounded-xl border p-6 transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'}`}>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No blog posts found
              </p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedLocation("All"); setSelectedTag(null); }} 
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition-colors
                  ${isDark 
                    ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                    : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBlogs.map((blog) => {
                const isLiked = likedBlogIds[blog.id];
                return (
                  <article key={blog.id} className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group
                    ${isDark 
                      ? 'bg-gray-800 border-gray-700 hover:shadow-[#4A5BCC]/20' 
                      : 'bg-white border-gray-200 hover:shadow-lg'}`}>
                    <div>
                      <div onClick={() => handleOpenBlog(blog)} className="relative h-40 w-full bg-gray-900 overflow-hidden cursor-pointer">
                        {blog.image ? (
                          <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#2A3380]/60 to-gray-900 flex items-center justify-center p-4 text-center">
                            <span className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase">{blog.category}</span>
                          </div>
                        )}
                        {blog.videoUrl && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                            <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform
                              ${isDark ? 'bg-[#4A5BCC]' : 'bg-[#2A3380]'}`}>
                              <Play className="w-4 h-4 ml-0.5 fill-current" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-[#2A3380]/90 backdrop-blur-md text-white text-[8px] font-bold tracking-wide">
                            {blog.category}
                          </span>
                          {blog.videoUrl && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-600/90 backdrop-blur-md text-white text-[8px] font-bold flex items-center gap-0.5">
                              <Play className="w-2 h-2 fill-current" /> Video
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className={`flex items-center gap-1.5 text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <MapPin className={`w-3 h-3 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'} shrink-0`} />
                          <span className="truncate">{blog.location}</span>
                        </div>
                        <h3 onClick={() => handleOpenBlog(blog)} className={`text-sm font-bold line-clamp-2 cursor-pointer transition-colors
                          ${isDark 
                            ? 'text-white hover:text-[#4A5BCC]' 
                            : 'text-gray-900 hover:text-[#2A3380]'}`}>
                          {blog.title}
                        </h3>
                        <p className={`text-[10px] leading-relaxed line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {blog.excerpt}
                        </p>
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {blog.tags.slice(0, 2).map((tag) => (
                              <button 
                                key={tag} 
                                onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }} 
                                className={`px-1.5 py-0.5 rounded-md text-[8px] font-medium transition-colors
                                  ${isDark 
                                    ? 'bg-gray-700 text-gray-400 hover:text-[#4A5BCC]' 
                                    : 'bg-gray-100 text-gray-600 hover:text-[#2A3380]'}`}>
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-4 py-3 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200/50 text-gray-500'}`}>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{blog.views}</span>
                        <button 
                          onClick={(e) => handleToggleLike(e, blog.id)} 
                          className={`flex items-center gap-0.5 transition-colors ${isLiked ? "text-red-500 font-bold" : isDark ? "hover:text-white" : "hover:text-gray-800"}`}>
                          <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />{blog.likes}
                        </button>
                        <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{blog.comments}</span>
                      </div>
                      <button 
                        onClick={() => handleOpenBlog(blog)} 
                        className={`font-semibold hover:underline flex items-center gap-0.5 text-[10px]
                          ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
                        Read <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Blog Modal - With dark mode support */}
      {activeModalBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md">
          <div className={`border w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative transition-colors duration-300
            ${isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'}`}>
            <div className={`sticky top-0 z-20 border-b px-4 py-3 flex items-center justify-between transition-colors duration-300
              ${isDark 
                ? 'bg-gray-800/95 border-gray-700' 
                : 'bg-white/95 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${isDark 
                    ? 'bg-[#4A5BCC]/20 text-[#4A5BCC]' 
                    : 'bg-[#2A3380]/10 text-[#2A3380]'}`}>
                  {activeModalBlog.category}
                </span>
                <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  • {activeModalBlog.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleToggleLike(e, activeModalBlog.id)} 
                  className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-medium transition-colors
                    ${likedBlogIds[activeModalBlog.id] 
                      ? isDark 
                        ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                      : isDark 
                        ? 'border-gray-600 text-gray-400 hover:bg-gray-700' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <Heart className={`w-3 h-3 ${likedBlogIds[activeModalBlog.id] ? "fill-current" : ""}`} />
                  <span>{activeModalBlog.likes}</span>
                </button>
                <button 
                  onClick={() => setActiveModalBlog(null)} 
                  className={`p-1.5 rounded-full transition-colors
                    ${isDark 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight leading-tight transition-colors duration-300
                  ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activeModalBlog.title}
                </h1>
                <div className={`flex flex-wrap items-center justify-between gap-2 text-[10px] pt-2 border-b pb-3 transition-colors duration-300
                  ${isDark 
                    ? 'text-gray-400 border-gray-700' 
                    : 'text-gray-500 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      <User className={`w-3 h-3 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
                      {activeModalBlog.author || "Admin"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(activeModalBlog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{activeModalBlog.views} views</span>
                </div>
              </div>
              {activeModalBlog.videoUrl && (
                <div className="space-y-2">
                  <div className={`relative aspect-video w-full rounded-xl overflow-hidden bg-black border shadow-sm
                    ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    {getYouTubeEmbedUrl(activeModalBlog.videoUrl) ? (
                      <iframe 
                        src={getYouTubeEmbedUrl(activeModalBlog.videoUrl)!} 
                        title={activeModalBlog.title} 
                        className="w-full h-full border-0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white">
                        <Play className="w-10 h-10 text-[#2A3380] mb-2" />
                        <p className="text-xs">Video URL: {activeModalBlog.videoUrl}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!activeModalBlog.videoUrl && activeModalBlog.image && (
                <div className={`rounded-xl overflow-hidden border max-h-[300px]
                  ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <img src={activeModalBlog.image} alt={activeModalBlog.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`p-3 rounded-lg border text-xs sm:text-sm font-medium italic
                ${isDark 
                  ? 'bg-[#4A5BCC]/20 border-[#4A5BCC]/30 text-[#4A5BCC]' 
                  : 'bg-[#2A3380]/10 border-[#2A3380]/20 text-[#2A3380]'}`}>
                "{activeModalBlog.excerpt}"
              </div>
              <div className={`prose max-w-none space-y-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line
                ${isDark ? 'text-gray-300' : 'text-gray-700/90'}`}>
                {activeModalBlog.content || (
                  <p>Medical advancements and research at {activeModalBlog.location} continuously elevate the benchmark of health care. This article provides essential insights into {activeModalBlog.category.toLowerCase()} methodologies, safety protocols, and clinical effectiveness.</p>
                )}
              </div>
              {activeModalBlog.tags && activeModalBlog.tags.length > 0 && (
                <div className={`pt-4 border-t flex items-center gap-1.5 flex-wrap
                  ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <Tag className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`text-[10px] font-semibold mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tags:
                  </span>
                  {activeModalBlog.tags.map(tag => (
                    <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                      ${isDark 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-600'}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className={`pt-4 border-t space-y-4 transition-colors duration-300
                ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <MessageSquare className={`w-4 h-4 ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`} />
                  Comments ({activeModalBlog.comments})
                </h3>
                <form onSubmit={(e) => handleAddComment(e, activeModalBlog.id)} className="space-y-2">
                  <textarea 
                    rows={2} 
                    value={newCommentText} 
                    onChange={(e) => setNewCommentText(e.target.value)} 
                    placeholder="Share your thoughts..." 
                    className={`w-full p-3 rounded-lg border transition-colors text-xs
                      ${isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A5BCC] focus:border-transparent' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#2A3380] focus:border-transparent'}`}
                  />
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      className={`px-4 py-1.5 rounded-lg text-white text-[10px] font-semibold transition-all shadow-sm
                        ${isDark 
                          ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                          : 'bg-[#2A3380] hover:bg-[#1E3A8A]'}`}>
                      Submit Comment
                    </button>
                  </div>
                </form>
                <div className="space-y-2 pt-1">
                  {commentsMap[activeModalBlog.id] && commentsMap[activeModalBlog.id].length > 0 ? (
                    commentsMap[activeModalBlog.id].map((c, i) => (
                      <div key={i} className={`p-3 rounded-lg border space-y-0.5 transition-colors duration-300
                        ${isDark 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-bold ${isDark ? 'text-[#4A5BCC]' : 'text-[#2A3380]'}`}>
                            {c.author}
                          </span>
                          <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                            {c.date}
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {c.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className={`text-[10px] italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}