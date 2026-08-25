// middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { getJwtSecret } = require('../lib/jwt');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required - No token provided',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Use: Bearer <token>',
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required - Empty token',
      });
    }

    const jwtSecret = getJwtSecret();
    console.log('🔐 Auth middleware - JWT_SECRET length:', jwtSecret.length);
    console.log('🔐 Auth middleware - Token preview:', token.substring(0, 30) + '...');

    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ Token verified. User ID:', decoded.id);

    // ✅ FIXED: Use firstName and lastName instead of name
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,    // ✅ Changed from 'name' to 'firstName'
        lastName: true,     // ✅ Added lastName
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
        lastLogin: true,
        location: true,     // ✅ Added location for hospital-specific filtering
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // ✅ Add computed name field for convenience
    const userWithName = {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim()
    };

    req.user = userWithName;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Auth Error:', error.message);
    console.error('❌ Error Name:', error.name);
    console.error('❌ Error Stack:', error.stack);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: `Invalid token - ${error.message}`,
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Authentication error: ' + error.message,
    });
  }
};

// ============================================================
// AUTHORIZE MIDDLEWARE - Supports SUPER_ADMIN, ADMIN, DOCTOR, USER roles
// ============================================================

// For SUPER_ADMIN only routes (system-wide settings)
const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  console.log('🔐 AuthorizeSuperAdmin - User role:', req.user.role);

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: `Access denied. Only SUPER_ADMIN users can perform this action. Your role: ${req.user.role}`,
    });
  }

  next();
};

// For ADMIN-only routes (create, update, delete services, manage users)
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  console.log('🔐 AuthorizeAdmin - User role:', req.user.role);

  // Allow SUPER_ADMIN and ADMIN roles
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: `Access denied. Only ADMIN users can perform this action. Your role: ${req.user.role}`,
    });
  }

  next();
};

// For DOCTOR routes (view patients, manage appointments)
const authorizeDoctor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  console.log('🔐 AuthorizeDoctor - User role:', req.user.role);

  // Allow SUPER_ADMIN, ADMIN, and DOCTOR roles
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'DOCTOR') {
    return res.status(403).json({
      success: false,
      error: `Access denied. Only DOCTOR users can perform this action. Your role: ${req.user.role}`,
    });
  }

  next();
};

// For USER routes (view services, book appointments)
const authorizeUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  console.log('🔐 AuthorizeUser - User role:', req.user.role);

  // Allow all active roles
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'USER', 'PATIENT', 'NURSE', 'RECEPTIONIST'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Your role: ${req.user.role}`,
    });
  }

  next();
};

// Generic authorize function (backward compatible)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    console.log('🔐 Authorize - User role:', req.user.role);
    console.log('🔐 Authorize - Required roles:', roles);

    // Check if user has any of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// ============================================================
// LOCATION-BASED MIDDLEWARE (for Adinas General Hospital)
// ============================================================

// Check if user belongs to Adinas General Hospital
const authorizeAdinasLocation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  console.log('🔐 AuthorizeAdinasLocation - User location:', req.user.location);

  // SUPER_ADMIN can access all locations
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Check if user is from Adinas General Hospital
  const adinasLocation = 'Adinas General Hospital';
  if (req.user.location !== adinasLocation) {
    return res.status(403).json({
      success: false,
      error: `Access denied. This resource is for ${adinasLocation} staff only.`,
    });
  }

  next();
};

// ============================================================
// USER VALIDATION MIDDLEWARE
// ============================================================

// Ensure user exists and is active
const validateUser = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.params.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        location: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'User account is deactivated',
      });
    }

    req.targetUser = user;
    next();
  } catch (error) {
    console.error('❌ Validate User Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error validating user: ' + error.message,
    });
  }
};

// ============================================================
// ROLE CHECK HELPERS
// ============================================================

const isAdmin = (user) => {
  return user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
};

const isSuperAdmin = (user) => {
  return user && user.role === 'SUPER_ADMIN';
};

const isDoctor = (user) => {
  return user && user.role === 'DOCTOR';
};

const isUser = (user) => {
  return user && (user.role === 'USER' || user.role === 'PATIENT');
};

const isAdinasLocation = (user) => {
  return user && user.location === 'Adinas General Hospital';
};

module.exports = { 
  auth, 
  authorize, 
  authorizeAdmin, 
  authorizeUser,
  authorizeSuperAdmin,
  authorizeDoctor,
  authorizeAdinasLocation,
  validateUser,
  isAdmin,
  isSuperAdmin,
  isDoctor,
  isUser,
  isAdinasLocation
};