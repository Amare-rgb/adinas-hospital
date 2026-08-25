// backend/src/routes/blog.js - FIXED VIDEO URL VALIDATION
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const prisma = require('../lib/prisma');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build image URL
function buildImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  let cleanPath = imagePath;
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  return `http://localhost:5000${cleanPath}`;
}

// ============================================================
// 🔥 FIXED: VALIDATION FUNCTIONS
// ============================================================

const validateTitle = (value) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Title is required');
  }
  if (value.trim().length < 5) {
    throw new Error('Title must be at least 5 characters');
  }
  if (value.trim().length > 200) {
    throw new Error('Title must be less than 200 characters');
  }
  return value.trim();
};

const validateContent = (value) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Content is required');
  }
  if (value.trim().length < 20) {
    throw new Error('Content must be at least 20 characters');
  }
  if (value.trim().length > 10000) {
    throw new Error('Content must be less than 10,000 characters');
  }
  return value.trim();
};

const validateExcerpt = (value) => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  if (value.trim().length < 10) {
    throw new Error('Excerpt must be at least 10 characters');
  }
  if (value.trim().length > 500) {
    throw new Error('Excerpt must be less than 500 characters');
  }
  return value.trim();
};

const validateAuthor = (value) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Author is required');
  }
  if (value.trim().length < 2) {
    throw new Error('Author must be at least 2 characters');
  }
  if (value.trim().length > 100) {
    throw new Error('Author must be less than 100 characters');
  }
  return value.trim();
};

const validateCategory = (value) => {
  if (!value || value.trim().length === 0) {
    return 'General';
  }
  if (value.trim().length > 50) {
    throw new Error('Category must be less than 50 characters');
  }
  return value.trim();
};

const validateLocation = (value) => {
  if (!value || value.trim().length === 0) {
    return 'Adinas General Hospital';
  }
  if (value.trim().length > 100) {
    throw new Error('Location must be less than 100 characters');
  }
  return value.trim();
};

const validateTags = (value) => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  if (value.length > 20) {
    throw new Error('Maximum 20 tags allowed');
  }
  for (const tag of value) {
    if (typeof tag !== 'string' || tag.trim().length === 0) {
      throw new Error('Tags must be non-empty strings');
    }
    if (tag.trim().length < 2) {
      throw new Error('Each tag must be at least 2 characters');
    }
    if (tag.trim().length > 30) {
      throw new Error('Each tag must be less than 30 characters');
    }
  }
  return value.map(tag => tag.trim());
};

const validateImage = (value) => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  if (value.trim().length > 500) {
    throw new Error('Image URL must be less than 500 characters');
  }
  return value.trim();
};

// 🔥 FIXED: More lenient video URL validation
const validateVideoUrl = (value) => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  
  const url = value.trim();
  
  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Please enter a valid video URL');
  }
  
  if (url.length > 500) {
    throw new Error('Video URL must be less than 500 characters');
  }
  
  return url;
};

const validateIsPublished = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

// ============================================================
// ROUTES
// ============================================================

// ===== GET ALL BLOG POSTS =====
router.get('/', [
  query('published').optional().isBoolean().withMessage('published must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('location').optional().isString().withMessage('location must be a string'),
  query('category').optional().isString().withMessage('category must be a string'),
  query('search').optional().isString().withMessage('search must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { published, limit, page, location, category, search } = req.query;
    
    const where = {};
    
    if (published === 'true') {
      where.isPublished = true;
      where.publishedAt = { lte: new Date() };
    } else if (published === 'false') {
      where.isPublished = false;
    }

    if (location && location !== 'all' && location !== 'undefined' && location !== 'null') {
      where.location = location;
    }

    if (category) {
      where.category = category;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = limit ? parseInt(limit) : 20;
    const pageNum = page ? parseInt(page) : 1;
    const skip = (pageNum - 1) * take;

    const [posts, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.news.count({ where }),
    ]);

    const mappedPosts = posts.map(post => ({
      ...post,
      image: buildImageUrl(post.image)
    }));

    res.json({
      success: true,
      data: mappedPosts,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ===== GET BLOG POST BY SLUG =====
router.get('/slug/:slug', [
  param('slug').isString().withMessage('Invalid slug'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { slug } = req.params;
    
    const post = await prisma.news.findUnique({
      where: { slug },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    if (!post.isPublished) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(403).json({
          success: false,
          error: 'This post is not published',
        });
      }
    }

    await prisma.news.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    res.json({
      success: true,
      data: {
        ...post,
        image: buildImageUrl(post.image)
      },
    });
  } catch (error) {
    console.error('Get blog post by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
    });
  }
});

// ===== GET SINGLE BLOG POST BY ID =====
router.get('/:id', [
  param('id').isString().withMessage('Invalid post ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { id } = req.params;
    
    const post = await prisma.news.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...post,
        image: buildImageUrl(post.image)
      },
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
    });
  }
});

// ===== CREATE BLOG POST (Admin only) =====
router.post('/',
  auth,
  authorize('SUPER_ADMIN', 'ADMIN'),
  [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isString().withMessage('Title must be a string')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    
    body('content')
      .notEmpty().withMessage('Content is required')
      .isString().withMessage('Content must be a string')
      .isLength({ min: 20, max: 10000 }).withMessage('Content must be between 20 and 10,000 characters'),
    
    body('excerpt')
      .optional()
      .isString().withMessage('Excerpt must be a string')
      .isLength({ min: 10, max: 500 }).withMessage('Excerpt must be between 10 and 500 characters'),
    
    body('author')
      .notEmpty().withMessage('Author is required')
      .isString().withMessage('Author must be a string')
      .isLength({ min: 2, max: 100 }).withMessage('Author must be between 2 and 100 characters'),
    
    body('category')
      .optional()
      .isString().withMessage('Category must be a string')
      .isLength({ max: 50 }).withMessage('Category must be less than 50 characters'),
    
    body('location')
      .optional()
      .isString().withMessage('Location must be a string')
      .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
    
    body('image')
      .optional()
      .isString().withMessage('Image must be a string')
      .isLength({ max: 500 }).withMessage('Image URL must be less than 500 characters'),
    
    body('videoUrl')
      .optional()
      .isString().withMessage('Video URL must be a string')
      .isLength({ max: 500 }).withMessage('Video URL must be less than 500 characters'),
    
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array'),
    
    body('tags.*')
      .if(body('tags').exists())
      .isString().withMessage('Each tag must be a string')
      .isLength({ min: 2, max: 30 }).withMessage('Each tag must be between 2 and 30 characters'),
    
    body('isPublished')
      .optional()
      .isBoolean().withMessage('isPublished must be a boolean'),
    
    body('mediaType')
      .optional()
      .isString().withMessage('mediaType must be a string')
      .isIn(['image', 'video']).withMessage('mediaType must be either "image" or "video"'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          errors: errors.array().map(e => ({ 
            field: e.param, 
            message: e.msg,
            value: e.value 
          }))
        });
      }

      const { 
        title, 
        content, 
        excerpt, 
        image, 
        videoUrl,
        author, 
        authorId,
        category,
        location,
        tags,
        isPublished,
      } = req.body;

      console.log('📝 Creating blog post with data:', { 
        title, 
        contentLength: content?.length,
        author,
        category,
        location,
        tagsCount: tags?.length,
        isPublished,
        videoUrl: videoUrl || 'none'
      });

      let validatedData = {};
      try {
        validatedData.title = validateTitle(title);
        validatedData.content = validateContent(content);
        validatedData.excerpt = validateExcerpt(excerpt) || content.substring(0, 200);
        validatedData.author = validateAuthor(author);
        validatedData.category = validateCategory(category);
        validatedData.location = validateLocation(location);
        validatedData.tags = validateTags(tags);
        validatedData.image = validateImage(image);
        
        // 🔥 FIXED: Only validate videoUrl if it's provided and not empty
        if (videoUrl && videoUrl.trim().length > 0) {
          validatedData.videoUrl = validateVideoUrl(videoUrl);
        } else {
          validatedData.videoUrl = null;
        }
        
        validatedData.isPublished = validateIsPublished(isPublished);
      } catch (validationError) {
        console.error('❌ Validation error:', validationError.message);
        return res.status(400).json({
          success: false,
          error: validationError.message,
        });
      }

      // Generate unique slug
      let slug = generateSlug(validatedData.title);
      let existing = await prisma.news.findUnique({ where: { slug } });
      
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const post = await prisma.news.create({
        data: {
          title: validatedData.title,
          slug,
          content: validatedData.content,
          excerpt: validatedData.excerpt,
          image: validatedData.image,
          videoUrl: validatedData.videoUrl,
          author: validatedData.author,
          authorId: authorId || '',
          category: validatedData.category,
          location: validatedData.location,
          tags: validatedData.tags,
          isPublished: validatedData.isPublished,
          publishedAt: validatedData.isPublished ? new Date() : null,
          views: 0,
          likes: 0,
          comments: 0,
        },
      });

      console.log(`✅ Blog post created: ${post.title} (ID: ${post.id})`);
      res.status(201).json({
        success: true,
        data: {
          ...post,
          image: buildImageUrl(post.image)
        },
        message: 'Blog post created successfully',
      });
    } catch (error) {
      console.error('❌ Create blog post error:', error);
      console.error('Request body:', req.body);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to create blog post',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// ===== UPDATE BLOG POST (Admin only) =====
router.put('/:id',
  auth,
  authorize('SUPER_ADMIN', 'ADMIN'),
  [
    param('id').isString().withMessage('Invalid post ID'),
    
    body('title')
      .optional()
      .isString().withMessage('Title must be a string')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    
    body('content')
      .optional()
      .isString().withMessage('Content must be a string')
      .isLength({ min: 20, max: 10000 }).withMessage('Content must be between 20 and 10,000 characters'),
    
    body('excerpt')
      .optional()
      .isString().withMessage('Excerpt must be a string')
      .isLength({ min: 10, max: 500 }).withMessage('Excerpt must be between 10 and 500 characters'),
    
    body('author')
      .optional()
      .isString().withMessage('Author must be a string')
      .isLength({ min: 2, max: 100 }).withMessage('Author must be between 2 and 100 characters'),
    
    body('category')
      .optional()
      .isString().withMessage('Category must be a string')
      .isLength({ max: 50 }).withMessage('Category must be less than 50 characters'),
    
    body('location')
      .optional()
      .isString().withMessage('Location must be a string')
      .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
    
    body('image')
      .optional()
      .isString().withMessage('Image must be a string')
      .isLength({ max: 500 }).withMessage('Image URL must be less than 500 characters'),
    
    body('videoUrl')
      .optional()
      .isString().withMessage('Video URL must be a string')
      .isLength({ max: 500 }).withMessage('Video URL must be less than 500 characters'),
    
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array'),
    
    body('tags.*')
      .if(body('tags').exists())
      .isString().withMessage('Each tag must be a string')
      .isLength({ min: 2, max: 30 }).withMessage('Each tag must be between 2 and 30 characters'),
    
    body('isPublished')
      .optional()
      .isBoolean().withMessage('isPublished must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
        });
      }

      const { id } = req.params;
      const { 
        title, 
        content, 
        excerpt, 
        image, 
        videoUrl,
        author, 
        authorId,
        category,
        location,
        tags,
        isPublished 
      } = req.body;

      const existing = await prisma.news.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      let validatedData = {};
      try {
        if (title !== undefined) validatedData.title = validateTitle(title);
        if (content !== undefined) validatedData.content = validateContent(content);
        if (excerpt !== undefined) validatedData.excerpt = validateExcerpt(excerpt);
        if (author !== undefined) validatedData.author = validateAuthor(author);
        if (category !== undefined) validatedData.category = validateCategory(category);
        if (location !== undefined) validatedData.location = validateLocation(location);
        if (tags !== undefined) validatedData.tags = validateTags(tags);
        if (image !== undefined) validatedData.image = validateImage(image);
        
        // 🔥 FIXED: Only validate videoUrl if it's provided
        if (videoUrl !== undefined) {
          if (videoUrl && videoUrl.trim().length > 0) {
            validatedData.videoUrl = validateVideoUrl(videoUrl);
          } else {
            validatedData.videoUrl = null;
          }
        }
        
        if (isPublished !== undefined) validatedData.isPublished = validateIsPublished(isPublished);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message,
        });
      }

      let updateData = {};

      if (validatedData.title !== undefined) {
        updateData.title = validatedData.title;
        let slug = generateSlug(validatedData.title);
        let slugExists = await prisma.news.findFirst({
          where: { slug, id: { not: id } },
        });
        if (slugExists) {
          slug = `${slug}-${Date.now()}`;
        }
        updateData.slug = slug;
      }
      
      if (validatedData.content !== undefined) updateData.content = validatedData.content;
      if (validatedData.excerpt !== undefined) updateData.excerpt = validatedData.excerpt;
      if (validatedData.author !== undefined) updateData.author = validatedData.author;
      if (authorId !== undefined) updateData.authorId = authorId;
      if (validatedData.category !== undefined) updateData.category = validatedData.category;
      if (validatedData.location !== undefined) updateData.location = validatedData.location;
      if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
      if (validatedData.image !== undefined) updateData.image = validatedData.image;
      if (validatedData.videoUrl !== undefined) updateData.videoUrl = validatedData.videoUrl;

      if (validatedData.isPublished !== undefined && validatedData.isPublished !== existing.isPublished) {
        updateData.isPublished = validatedData.isPublished;
        updateData.publishedAt = validatedData.isPublished ? new Date() : null;
      }

      const updated = await prisma.news.update({
        where: { id },
        data: updateData,
      });

      console.log(`✅ Blog post updated: ${updated.title}`);
      res.json({
        success: true,
        data: {
          ...updated,
          image: buildImageUrl(updated.image)
        },
        message: 'Blog post updated successfully',
      });
    } catch (error) {
      console.error('❌ Update blog post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update blog post',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

// ===== PARTIAL UPDATE BLOG POST (Admin only) =====
router.patch('/:id',
  auth,
  authorize('SUPER_ADMIN', 'ADMIN'),
  [
    param('id').isString().withMessage('Invalid post ID'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('content').optional().isString().withMessage('Content must be a string'),
    body('excerpt').optional().isString().withMessage('Excerpt must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
        });
      }

      const { id } = req.params;
      const updates = req.body;

      const existing = await prisma.news.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      if (updates.isPublished !== undefined && updates.isPublished !== existing.isPublished) {
        updates.publishedAt = updates.isPublished ? new Date() : null;
      }

      const updated = await prisma.news.update({
        where: { id },
        data: updates,
      });

      res.json({
        success: true,
        data: {
          ...updated,
          image: buildImageUrl(updated.image)
        },
        message: 'Blog post updated successfully',
      });
    } catch (error) {
      console.error('❌ Patch blog post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update blog post',
      });
    }
  }
);

// ===== DELETE BLOG POST (Admin only) =====
router.delete('/:id',
  auth,
  authorize('SUPER_ADMIN', 'ADMIN'),
  [
    param('id').isString().withMessage('Invalid post ID'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
        });
      }

      const { id } = req.params;

      const existing = await prisma.news.findUnique({
        where: { id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Blog post not found',
        });
      }

      await prisma.news.delete({
        where: { id },
      });

      console.log(`🗑️ Blog post deleted: ${existing.title}`);
      res.json({
        success: true,
        message: 'Blog post deleted successfully',
      });
    } catch (error) {
      console.error('❌ Delete blog post error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete blog post',
      });
    }
  }
);

// ===== LIKE A BLOG POST =====
router.post('/:id/like', [
  param('id').isString().withMessage('Invalid post ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { id } = req.params;

    const post = await prisma.news.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    const updated = await prisma.news.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    res.json({
      success: true,
      data: { likes: updated.likes },
    });
  } catch (error) {
    console.error('❌ Like blog post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like blog post',
    });
  }
});

// ===== GET BLOG POSTS BY LOCATION =====
router.get('/location/:location', [
  param('location').isString().withMessage('Invalid location'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { location } = req.params;
    const { limit, page } = req.query;

    const take = limit ? parseInt(limit) : 10;
    const pageNum = page ? parseInt(page) : 1;
    const skip = (pageNum - 1) * take;

    const where = {
      location: location,
      isPublished: true,
      publishedAt: { lte: new Date() },
    };

    const [posts, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          videoUrl: true,
          author: true,
          category: true,
          tags: true,
          views: true,
          likes: true,
          comments: true,
          createdAt: true,
        },
      }),
      prisma.news.count({ where }),
    ]);

    const mappedPosts = posts.map(post => ({
      ...post,
      image: buildImageUrl(post.image)
    }));

    res.json({
      success: true,
      data: mappedPosts,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get blog posts by location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
    });
  }
});

// ===== GET BLOG POSTS BY CATEGORY =====
router.get('/category/:category', [
  param('category').isString().withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { category } = req.params;
    const { limit, page } = req.query;

    const take = limit ? parseInt(limit) : 10;
    const pageNum = page ? parseInt(page) : 1;
    const skip = (pageNum - 1) * take;

    const where = {
      category: category,
      isPublished: true,
      publishedAt: { lte: new Date() },
    };

    const [posts, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
          videoUrl: true,
          author: true,
          category: true,
          tags: true,
          views: true,
          likes: true,
          comments: true,
          createdAt: true,
        },
      }),
      prisma.news.count({ where }),
    ]);

    const mappedPosts = posts.map(post => ({
      ...post,
      image: buildImageUrl(post.image)
    }));

    res.json({
      success: true,
      data: mappedPosts,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get blog posts by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
    });
  }
});

// ===== GET BLOG STATISTICS (Admin only) =====
router.get('/stats',
  auth,
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req, res) => {
    try {
      const [total, published, draft, totalViews, totalLikes, byLocation, byCategory] = await Promise.all([
        prisma.news.count(),
        prisma.news.count({ where: { isPublished: true } }),
        prisma.news.count({ where: { isPublished: false } }),
        prisma.news.aggregate({ _sum: { views: true } }),
        prisma.news.aggregate({ _sum: { likes: true } }),
        prisma.news.groupBy({
          by: ['location'],
          _count: true,
        }),
        prisma.news.groupBy({
          by: ['category'],
          _count: true,
        }),
      ]);

      const locationStats = {};
      byLocation.forEach(item => {
        locationStats[item.location] = item._count;
      });

      const categoryStats = {};
      byCategory.forEach(item => {
        categoryStats[item.category] = item._count;
      });

      res.json({
        success: true,
        data: {
          total,
          published,
          draft,
          totalViews: totalViews._sum.views || 0,
          totalLikes: totalLikes._sum.likes || 0,
          byLocation: locationStats,
          byCategory: categoryStats,
        },
      });
    } catch (error) {
      console.error('Get blog stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch blog statistics',
      });
    }
  }
);

module.exports = router;