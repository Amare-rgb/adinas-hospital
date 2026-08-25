// backend/src/routes/users.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = express.Router();

// ============================================================
// GET all users (with filtering)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { role, search, location } = req.query;
    
    const where = {};
    if (role) where.role = role;
    if (location && location !== 'all' && location !== 'undefined') where.location = location;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },  // ✅ FIXED
        { lastName: { contains: search, mode: 'insensitive' } },   // ✅ FIXED
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('📡 Fetching users with where:', where);

    // ✅ FIXED: Use firstName and lastName instead of name
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,    // ✅ Changed from 'name' to 'firstName'
        lastName: true,     // ✅ Added lastName
        email: true,
        phone: true,
        role: true,
        isActive: true,
        location: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ✅ Add computed name field
    const usersWithName = users.map(user => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim()
    }));

    console.log(`✅ Found ${usersWithName.length} users`);

    res.json({
      success: true,
      data: usersWithName,
      total: usersWithName.length,
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users: ' + error.message,
    });
  }
});

// ============================================================
// GET user by ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Use firstName and lastName instead of name
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        firstName: true,    // ✅ Changed from 'name' to 'firstName'
        lastName: true,     // ✅ Added lastName
        email: true,
        phone: true,
        role: true,
        isActive: true,
        location: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // ✅ Add computed name field
    const userWithName = {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim()
    };

    res.json({
      success: true,
      data: userWithName,
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user: ' + error.message,
    });
  }
});

// ============================================================
// CREATE user (Registration)
// ============================================================
router.post('/', [
  body('firstName')       // ✅ Changed from 'name' to 'firstName'
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName')        // ✅ Added lastName validation
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'USER']).withMessage('Invalid role'),
  body('location')
    .optional()
    .isString(),
  body('phone')
    .optional()
    .isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // ✅ Changed from 'name' to 'firstName' and added 'lastName'
    const { firstName, lastName, email, password, phone, role, location, isActive } = req.body;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FIXED: Use firstName and lastName instead of name
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),    // ✅ Changed from 'name' to 'firstName'
        lastName: lastName.trim(),      // ✅ Added lastName
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        role: role || 'USER',
        location: location || 'Adinas General Hospital',
        isActive: isActive !== undefined ? isActive : true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ Add computed name field
    const userWithName = {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim()
    };

    console.log(`✅ New user created: ${user.email} (${user.role}) at ${user.location}`);

    res.status(201).json({
      success: true,
      data: userWithName,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user: ' + error.message,
    });
  }
});

// ============================================================
// UPDATE user
// ============================================================
router.put('/:id', [
  body('firstName')       // ✅ Changed from 'name' to 'firstName'
    .trim()
    .notEmpty().withMessage('First name is required'),
  body('lastName')        // ✅ Added lastName validation
    .trim()
    .notEmpty().withMessage('Last name is required'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .isIn(['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'USER']).withMessage('Invalid role'),
  body('location')
    .optional()
    .isString(),
], async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ Changed from 'name' to 'firstName' and added 'lastName'
    const { firstName, lastName, email, phone, role, location, isActive, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check email if changed
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: email },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
      }
    }

    // ✅ FIXED: Use firstName and lastName instead of name
    const updateData = {
      firstName: firstName.trim(),    // ✅ Changed from 'name' to 'firstName'
      lastName: lastName.trim(),      // ✅ Added lastName
      email: email.trim().toLowerCase(),
      phone: phone || '',
      role: role,
      location: location || 'Adinas General Hospital',
      isActive: isActive !== undefined ? isActive : user.isActive,
    };

    // Only update password if provided
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ Add computed name field
    const userWithName = {
      ...updated,
      name: `${updated.firstName} ${updated.lastName}`.trim()
    };

    console.log(`✅ User updated: ${updated.email}`);

    res.json({
      success: true,
      data: userWithName,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user: ' + error.message,
    });
  }
});

// ============================================================
// TOGGLE user status (Activate/Deactivate)
// ============================================================
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const updated = await prisma.user.update({
      where: { id: id },
      data: { isActive: isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        location: true,
      },
    });

    // ✅ Add computed name field
    const userWithName = {
      ...updated,
      name: `${updated.firstName} ${updated.lastName}`.trim()
    };

    console.log(`✅ User ${user.email} ${isActive ? 'activated' : 'deactivated'}`);

    res.json({
      success: true,
      data: userWithName,
      message: isActive ? 'User activated successfully' : 'User deactivated successfully',
    });
  } catch (error) {
    console.error('❌ Toggle user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle user status: ' + error.message,
    });
  }
});

// ============================================================
// DELETE user
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent deleting the last SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      const superAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN' },
      });
      if (superAdmins <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last Super Admin',
        });
      }
    }

    await prisma.user.delete({
      where: { id: id },
    });

    console.log(`🗑️ User deleted: ${user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user: ' + error.message,
    });
  }
});

// ============================================================
// GET user statistics
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const [total, byRole, byLocation, activeCount, inactiveCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['location'],
        _count: true,
      }),
      prisma.user.count({
        where: { isActive: true },
      }),
      prisma.user.count({
        where: { isActive: false },
      }),
    ]);

    const roleStats = {};
    byRole.forEach(item => {
      roleStats[item.role] = item._count;
    });

    const locationStats = {};
    byLocation.forEach(item => {
      locationStats[item.location] = item._count;
    });

    res.json({
      success: true,
      data: {
        total,
        byRole: roleStats,
        byLocation: locationStats,
        active: activeCount,
        inactive: inactiveCount,
      },
    });
  } catch (error) {
    console.error('❌ Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics: ' + error.message,
    });
  }
});

// ============================================================
// GET users by role (for dropdowns)
// ============================================================
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { location } = req.query;

    const where = { role };
    if (location && location !== 'all' && location !== 'undefined') {
      where.location = location;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        location: true,
        avatar: true,
      },
      orderBy: { firstName: 'asc' },
    });

    const usersWithName = users.map(user => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim()
    }));

    res.json({
      success: true,
      data: usersWithName,
      total: usersWithName.length,
    });
  } catch (error) {
    console.error('❌ Get users by role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users: ' + error.message,
    });
  }
});

module.exports = router;