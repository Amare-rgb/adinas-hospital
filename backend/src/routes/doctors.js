const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// HELPER: Build absolute image URL for the Frontend
// ============================================================
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
// HELPER: Generate doctor ID
// ============================================================
function generateDoctorId() {
  const prefix = 'DR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// ============================================================
// HELPER: Generate license number
// ============================================================
function generateLicenseNumber() {
  const prefix = 'LIC';
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

const validateName = (value) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Name is required');
  }
  if (value.trim().length < 2) {
    throw new Error('Name must be at least 2 characters');
  }
  if (value.trim().length > 100) {
    throw new Error('Name must be less than 100 characters');
  }
  if (!/^[a-zA-Z\s\-'.]+$/.test(value.trim())) {
    throw new Error('Name contains invalid characters (only letters, spaces, hyphens, apostrophes, and periods allowed)');
  }
  return value.trim();
};

const validateEmail = (value) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Email is required');
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(value.trim())) {
    throw new Error('Please enter a valid email address');
  }
  if (value.trim().length > 255) {
    throw new Error('Email must be less than 255 characters');
  }
  return value.trim().toLowerCase();
};

const validatePhone = (value) => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
  if (!phoneRegex.test(value.trim())) {
    throw new Error('Please enter a valid phone number (7-20 characters, numbers, spaces, +, -, (), allowed)');
  }
  return value.trim();
};

const validateSpecialization = (value) => {
  if (!value || value.trim().length === 0) {
    throw new Error('Specialization is required');
  }
  if (value.trim().length < 2) {
    throw new Error('Specialization must be at least 2 characters');
  }
  if (value.trim().length > 100) {
    throw new Error('Specialization must be less than 100 characters');
  }
  if (!/^[a-zA-Z\s\-',.&]+$/.test(value.trim())) {
    throw new Error('Specialization contains invalid characters');
  }
  return value.trim();
};

const validateExperience = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const num = parseInt(value);
  if (isNaN(num)) {
    throw new Error('Experience must be a valid number');
  }
  if (num < 0) {
    throw new Error('Experience cannot be negative');
  }
  if (num > 100) {
    throw new Error('Experience cannot exceed 100 years');
  }
  return num;
};

const validateBio = (value) => {
  if (!value || value.trim().length === 0) {
    return null;
  }
  if (value.trim().length > 500) {
    throw new Error('Bio must be less than 500 characters');
  }
  return value.trim();
};

const validateConsultationFee = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error('Consultation fee must be a valid number');
  }
  if (num < 0) {
    throw new Error('Consultation fee cannot be negative');
  }
  if (num > 999999) {
    throw new Error('Consultation fee cannot exceed 999,999');
  }
  return num;
};

const validateWorkingHours = (workingHours) => {
  if (!workingHours || !Array.isArray(workingHours)) {
    return null;
  }
  
  if (workingHours.length === 0) {
    return null;
  }
  
  const validDays = [];
  const errors = [];
  
  workingHours.forEach((slot, index) => {
    if (slot.dayOfWeek === undefined || slot.dayOfWeek === null) {
      errors.push(`Slot ${index + 1}: Day of week is required`);
      return;
    }
    if (typeof slot.dayOfWeek !== 'number' || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      errors.push(`Slot ${index + 1}: Invalid day of week (must be 0-6)`);
      return;
    }
    
    if (validDays.includes(slot.dayOfWeek)) {
      errors.push(`Slot ${index + 1}: Duplicate day of week (${slot.dayOfWeek})`);
      return;
    }
    validDays.push(slot.dayOfWeek);
    
    if (!slot.startTime || slot.startTime.trim() === '') {
      errors.push(`Slot ${index + 1}: Start time is required`);
      return;
    }
    if (!slot.endTime || slot.endTime.trim() === '') {
      errors.push(`Slot ${index + 1}: End time is required`);
      return;
    }
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(slot.startTime.trim())) {
      errors.push(`Slot ${index + 1}: Invalid start time format (use HH:MM)`);
      return;
    }
    if (!timeRegex.test(slot.endTime.trim())) {
      errors.push(`Slot ${index + 1}: Invalid end time format (use HH:MM)`);
      return;
    }
    
    if (slot.startTime >= slot.endTime) {
      errors.push(`Slot ${index + 1}: Start time must be before end time`);
      return;
    }
    
    if (slot.isAvailable !== undefined && typeof slot.isAvailable !== 'boolean') {
      errors.push(`Slot ${index + 1}: isAvailable must be a boolean`);
      return;
    }
  });
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return workingHours;
};

// ============================================================
// GET ROUTES
// ============================================================

// Get all doctors with filters
router.get('/', [
  query('specialization').optional().isString().withMessage('Specialization must be a string'),
  query('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { specialization, isAvailable, search } = req.query;
    
    const where = {};
    
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (search && search.trim().length > 0) {
      where.OR = [
        { 
          user: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ]
          } 
        },
        { specialization: { contains: search, mode: 'insensitive' } },
        { 
          user: { 
            email: { contains: search, mode: 'insensitive' } 
          } 
        },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
        workingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { 
        user: {
          firstName: 'asc'
        }
      },
    });

    const mappedDoctors = doctors.map(doc => {
      const fullName = doc.user ? `${doc.user.firstName} ${doc.user.lastName}`.trim() : 'Unknown';
      return {
        id: doc.id,
        name: fullName,
        title: doc.specialization,
        bio: doc.bio || '',
        photoUrl: buildImageUrl(doc.image),
        active: doc.isAvailable,
        email: doc.user?.email || null,
        phone: doc.user?.phone || '',
        specialization: doc.specialization,
        experience: doc.experience,
        education: doc.education,
        rating: doc.rating,
        consultationFee: doc.consultationFee,
        scheduleSlots: doc.workingHours || [], 
        location: doc.user?.location || 'Adinas General Hospital',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    });

    res.json({
      success: true,
      data: mappedDoctors,
      count: mappedDoctors.length,
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctors',
    });
  }
});

// Get single doctor
router.get('/:id', [
  param('id').isString().withMessage('Invalid doctor ID'),
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

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
        workingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    const fullName = doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}`.trim() : 'Unknown';

    const mappedDoctor = {
      id: doctor.id,
      name: fullName,
      title: doctor.specialization,
      bio: doctor.bio || '',
      photoUrl: buildImageUrl(doctor.image),
      active: doctor.isAvailable,
      email: doctor.user?.email || null,
      phone: doctor.user?.phone || '',
      specialization: doctor.specialization,
      experience: doctor.experience,
      education: doctor.education,
      rating: doctor.rating,
      consultationFee: doctor.consultationFee,
      scheduleSlots: doctor.workingHours || [],
      location: doctor.user?.location || 'Adinas General Hospital',
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };

    res.json({
      success: true,
      data: mappedDoctor,
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor',
    });
  }
});

// Get available doctors for appointment
router.get('/available', [
  query('date').isISO8601().withMessage('Date must be a valid ISO date'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { date } = req.query;
    
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    const where = {
      isAvailable: true,
      workingHours: {
        some: {
          dayOfWeek: dayOfWeek,
          isAvailable: true,
        },
      },
    };

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
        workingHours: {
          where: {
            dayOfWeek: dayOfWeek,
            isAvailable: true,
          },
        },
        appointments: {
          where: {
            date: selectedDate,
            status: {
              notIn: ['CANCELLED', 'COMPLETED'],
            },
          },
          select: {
            time: true,
          },
        },
      },
    });

    const availableDoctors = doctors.map(doctor => {
      const bookedTimes = doctor.appointments.map(apt => apt.time);
      const fullName = doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}`.trim() : 'Unknown';
      return {
        ...doctor,
        name: fullName,
        email: doctor.user?.email || null,
        phone: doctor.user?.phone || '',
        location: doctor.user?.location || 'Adinas General Hospital',
        bookedTimes: bookedTimes,
        appointments: undefined,
        user: undefined,
      };
    });

    res.json({
      success: true,
      data: availableDoctors,
    });
  } catch (error) {
    console.error('Get available doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available doctors',
    });
  }
});

// ============================================================
// CREATE DOCTOR - FIXED
// ============================================================
router.post('/', auth, authorize('SUPER_ADMIN', 'ADMIN'), [
  body('name').notEmpty().withMessage('Name is required').isString(),
  body('email').notEmpty().withMessage('Email is required').isEmail(),
  body('specialization').notEmpty().withMessage('Specialization is required').isString(),
  body('phone').optional().isString(),
  body('experience').optional().isInt({ min: 0, max: 100 }),
  body('bio').optional().isString(),
  body('education').optional().isString(),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('workingHours').optional().isArray(),
  body('photoUrl').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }

    const { 
      name, email, phone, specialization, experience, 
      bio, education, consultationFee, 
      workingHours, photoUrl 
    } = req.body;

    console.log('📝 Creating doctor with data:', { name, email, specialization });

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'Doctor';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    // Check if user exists with this email AND include doctor relation
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        doctor: true,
      },
    });

    // If user exists and already has a doctor profile, return error
    if (user && user.doctor) {
      return res.status(400).json({
        success: false,
        error: 'Doctor with this email already exists',
      });
    }

    // If user doesn't exist, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          phone: phone || '',
          role: 'DOCTOR',
          password: 'temporary_password_change_me',
          isActive: true,
          location: 'Adinas General Hospital',
        },
      });
    } else {
      // User exists but doesn't have a doctor profile yet
      if (phone && phone !== user.phone) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phone: phone },
        });
      }
    }

    // Generate doctor ID and license number
    const doctorId = generateDoctorId();
    const licenseNumber = generateLicenseNumber();

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        doctorId: doctorId,
        licenseNumber: licenseNumber,
        specialization: specialization.trim(),
        bio: bio || '',
        education: education || '',
        experience: experience || 0,
        consultationFee: consultationFee || 0,
        image: photoUrl || '',
        isAvailable: true,
        workingHours: workingHours && workingHours.length > 0 ? {
          create: workingHours.map(slot => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
          })),
        } : undefined,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
        workingHours: true,
      },
    });

    const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.trim();

    console.log(`✅ Doctor created: ${fullName} (ID: ${doctor.doctorId})`);

    res.status(201).json({
      success: true,
      data: {
        ...doctor,
        name: fullName,
        email: doctor.user?.email,
        phone: doctor.user?.phone || '',
        location: doctor.user?.location || 'Adinas General Hospital',
      },
      message: 'Doctor created successfully',
    });
  } catch (error) {
    console.error('❌ Create doctor error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Doctor with this email already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create doctor',
    });
  }
});

// ============================================================
// UPDATE DOCTOR
// ============================================================
router.put('/:id', auth, authorize('SUPER_ADMIN', 'ADMIN'), [
  param('id').isString().withMessage('Invalid doctor ID'),
  body('name').optional().isString(),
  body('email').optional().isEmail(),
  body('specialization').optional().isString(),
  body('phone').optional().isString(),
  body('experience').optional().isInt({ min: 0, max: 100 }),
  body('bio').optional().isString(),
  body('education').optional().isString(),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('active').optional().isBoolean(),
  body('workingHours').optional().isArray(),
  body('photoUrl').optional().isString(),
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
    const { 
      name, email, phone, specialization, experience, 
      bio, education, consultationFee, 
      active, workingHours, photoUrl 
    } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    if (email && email !== doctor.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser && existingUser.id !== doctor.userId) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }
    }

    const userUpdateData = {};
    if (email && email !== doctor.user.email) {
      userUpdateData.email = email.toLowerCase().trim();
    }
    if (phone !== undefined && phone !== doctor.user.phone) {
      userUpdateData.phone = phone || '';
    }
    if (name) {
      const nameParts = name.trim().split(' ');
      userUpdateData.firstName = nameParts[0] || 'Doctor';
      userUpdateData.lastName = nameParts.slice(1).join(' ') || 'Unknown';
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: userUpdateData,
      });
    }

    const doctorUpdateData = {};
    if (specialization !== undefined) doctorUpdateData.specialization = specialization.trim();
    if (bio !== undefined) doctorUpdateData.bio = bio;
    if (education !== undefined) doctorUpdateData.education = education;
    if (experience !== undefined) doctorUpdateData.experience = experience;
    if (consultationFee !== undefined) doctorUpdateData.consultationFee = consultationFee;
    if (photoUrl !== undefined) doctorUpdateData.image = photoUrl;
    if (active !== undefined) doctorUpdateData.isAvailable = active;

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: doctorUpdateData,
    });

    if (workingHours !== undefined) {
      await prisma.workingHour.deleteMany({
        where: { doctorId: id },
      });

      if (workingHours.length > 0) {
        await prisma.workingHour.createMany({
          data: workingHours.map(slot => ({
            doctorId: id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
          })),
        });
      }
    }

    const finalDoctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
        workingHours: true,
      },
    });

    const fullName = finalDoctor.user ? `${finalDoctor.user.firstName} ${finalDoctor.user.lastName}`.trim() : 'Unknown';

    res.json({
      success: true,
      data: {
        ...finalDoctor,
        name: fullName,
        email: finalDoctor.user?.email,
        phone: finalDoctor.user?.phone || '',
        location: finalDoctor.user?.location || 'Adinas General Hospital',
      },
      message: 'Doctor updated successfully',
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update doctor',
    });
  }
});

// ============================================================
// TOGGLE DOCTOR AVAILABILITY
// ============================================================
router.patch('/:id/toggle-status', auth, authorize('SUPER_ADMIN', 'ADMIN'), [
  param('id').isString().withMessage('Invalid doctor ID'),
], async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: {
        isAvailable: !doctor.isAvailable,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            location: true,
          }
        },
        workingHours: true,
      },
    });

    const fullName = updated.user ? `${updated.user.firstName} ${updated.user.lastName}`.trim() : 'Unknown';

    res.json({
      success: true,
      data: {
        ...updated,
        name: fullName,
        email: updated.user?.email,
        phone: updated.user?.phone || '',
        location: updated.user?.location || 'Adinas General Hospital',
      },
      message: `Doctor ${updated.isAvailable ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle doctor status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle doctor status',
    });
  }
});

// ============================================================
// DELETE DOCTOR
// ============================================================
router.delete('/:id', auth, authorize('SUPER_ADMIN', 'ADMIN'), [
  param('id').isString().withMessage('Invalid doctor ID'),
], async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
        workingHours: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    if (doctor.workingHours.length > 0) {
      await prisma.workingHour.deleteMany({
        where: { doctorId: id },
      });
    }

    await prisma.doctor.delete({
      where: { id },
    });

    await prisma.user.delete({
      where: { id: doctor.userId },
    });

    const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.trim();

    res.json({
      success: true,
      message: `Doctor "${fullName}" deleted successfully.`,
      data: {
        deletedDoctor: {
          id: doctor.id,
          name: fullName,
          email: doctor.user.email,
          phone: doctor.user.phone || '',
        },
      },
    });

  } catch (error) {
    console.error('Delete doctor error:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete doctor because they have related records.',
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete doctor',
    });
  }
});

module.exports = router;