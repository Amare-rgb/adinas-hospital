// routes/appointments.js - COMPLETE FIXED VERSION
const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { auth, authorize } = require('../middleware/auth');
const notificationService = require('../lib/notificationService');

const router = express.Router();

// ============================================================
// Helper to map appointment for frontend
// ============================================================
function mapAppointment(appointment) {
  return {
    id: appointment.id,
    patientName: appointment.patientName || 'Unknown Patient',
    patientEmail: appointment.patientEmail || '',
    patientPhone: appointment.patientPhone || '',
    patientAge: appointment.patientAge || null,
    patientGender: appointment.patientGender || null,
    serviceId: appointment.serviceId,
    service: appointment.service ? {
      id: appointment.service.id,
      name: appointment.service.name,
      price: appointment.service.price,
      duration: appointment.service.duration,
    } : null,
    appointmentDate: appointment.date,
    date: appointment.date,
    time: appointment.time,
    note: appointment.notes,
    notes: appointment.notes,
    symptoms: appointment.symptoms,
    isEmergency: appointment.isEmergency,
    status: appointment.status,
    location: appointment.location || null,
    reminderSentAt: appointment.reminderSentAt,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    visitType: appointment.visitType || null,
    city: appointment.city || null,
    subCity: appointment.subCity || null,
    woreda: appointment.woreda || null,
    gpsPin: appointment.gpsPin || null,
    homeAddress: appointment.homeAddress || null,
    userId: appointment.userId,
    doctorId: appointment.doctorId,
    doctor: appointment.doctor ? {
      id: appointment.doctor.id,
      name: appointment.doctor.user ? 
        `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}` : 
        appointment.doctor.name,
      specialization: appointment.doctor.specialization,
    } : null,
    patientId: appointment.patientId,
    patient: appointment.patient ? {
      id: appointment.patient.id,
      patientId: appointment.patient.patientId,
      user: appointment.patient.user ? {
        firstName: appointment.patient.user.firstName,
        lastName: appointment.patient.user.lastName,
        email: appointment.patient.user.email,
        phone: appointment.patient.user.phone,
      } : null,
    } : null,
    departmentId: appointment.departmentId,
    department: appointment.department ? {
      id: appointment.department.id,
      name: appointment.department.name,
      code: appointment.department.code,
    } : null,
  };
}

// ============================================================
// Helper to check time slot availability
// ============================================================
async function isTimeSlotAvailable(date, time, doctorId, excludeAppointmentId = null) {
  try {
    const where = {
      date: new Date(date),
      time: time,
      doctorId: doctorId,
      NOT: {
        status: {
          in: ['CANCELLED', 'NO_SHOW']
        }
      }
    };
    
    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }
    
    const existing = await prisma.appointment.findFirst({
      where: where
    });
    
    return !existing;
  } catch (error) {
    console.error('Error checking time slot:', error);
    return true;
  }
}

// ============================================================
// GET all appointments
// ============================================================
router.get('/', auth, authorize('ADMIN', 'DOCTOR', 'PATIENT'), async (req, res) => {
  try {
    const { status, startDate, endDate, location, doctorId, patientId } = req.query;
    
    const where = {};
    
    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (patient) {
        where.patientId = patient.id;
      } else {
        return res.json({
          success: true,
          data: [],
          count: 0,
        });
      }
    } else if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (doctor) {
        where.doctorId = doctor.id;
      } else {
        return res.json({
          success: true,
          data: [],
          count: 0,
        });
      }
    }
    
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (location && location !== 'all' && location !== 'undefined') {
      where.location = location;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const mappedAppointments = appointments.map(mapAppointment);

    res.json({
      success: true,
      data: mappedAppointments,
      count: mappedAppointments.length,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments: ' + error.message,
    });
  }
});

// ============================================================
// GET single appointment
// ============================================================
router.get('/:id', auth, authorize('ADMIN', 'DOCTOR', 'PATIENT'), async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (!patient || appointment.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this appointment',
        });
      }
    }

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (!doctor || appointment.doctorId !== doctor.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this appointment',
        });
      }
    }

    res.json({
      success: true,
      data: mapAppointment(appointment),
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointment',
    });
  }
});

// ============================================================
// CREATE appointment - FIXED
// ============================================================
router.post('/', auth, authorize('ADMIN', 'DOCTOR', 'PATIENT'), [
  body('patientId').optional().isString().withMessage('Invalid patient ID'),
  body('doctorId').optional().isString().withMessage('Invalid doctor ID'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date is required (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM)'),
  body('reason').optional().isString(),
  body('symptoms').optional().isString(),
  body('isEmergency').optional().isBoolean(),
  body('visitType').optional().isIn(['HOSPITAL', 'HOME', 'TELEMEDICINE']),
  body('city').optional().isString(),
  body('subCity').optional().isString(),
  body('woreda').optional().isString(),
  body('homeAddress').optional().isString(),
  body('gpsPin').optional().isString(),
  body('departmentId').optional().isString(),
  body('serviceId').optional().isString(),
  // Patient details for quick booking
  body('patientName').optional().isString(),
  body('patientEmail').optional().isEmail(),
  body('patientPhone').optional().isString(),
  body('patientAge').optional().isInt(),
  body('patientGender').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      patientId, doctorId, date, time, reason, symptoms, 
      isEmergency, visitType, city, subCity, woreda, homeAddress, gpsPin,
      serviceId, departmentId,
      patientName, patientEmail, patientPhone, patientAge, patientGender
    } = req.body;

    const appointmentDate = new Date(date);

    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please use YYYY-MM-DD',
      });
    }

    let finalPatientId = patientId || null;
    let finalDoctorId = doctorId || null;

    // ============================================================
    // STEP 1: Find or Create Patient
    // ============================================================
    if (patientId) {
      const existingPatient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { id: true }
      });
      
      if (existingPatient) {
        finalPatientId = patientId;
        console.log(`✅ Using existing patient: ${patientId}`);
      } else {
        return res.status(404).json({
          success: false,
          error: 'Patient not found with provided ID',
        });
      }
    } else {
      const existingPatient = await prisma.patient.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      
      if (existingPatient) {
        finalPatientId = existingPatient.id;
        console.log(`✅ Found existing patient: ${existingPatient.id} for user ${req.user.id}`);
      } else {
        console.log(`🔍 No patient found for user ${req.user.id}, creating one...`);
        
        const user = await prisma.user.findUnique({
          where: { id: req.user.id }
        });
        
        if (!user) {
          return res.status(400).json({
            success: false,
            error: 'User not found. Please login again.',
          });
        }

        const newPatient = await prisma.patient.create({
          data: {
            patientId: `P${Date.now().toString().slice(-6)}`,
            userId: req.user.id,
          },
          select: { id: true }
        });
        
        finalPatientId = newPatient.id;
        console.log(`✅ Created new patient: ${newPatient.id} for user ${req.user.id}`);
      }
    }

    if (!finalPatientId) {
      return res.status(400).json({
        success: false,
        error: 'Could not find or create patient profile. Please try again.',
      });
    }

    const patientExists = await prisma.patient.findUnique({
      where: { id: finalPatientId },
      select: { id: true }
    });

    if (!patientExists) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found after creation. Please try again.',
      });
    }

    // ============================================================
    // STEP 2: Check if doctor exists and is available
    // ============================================================
    if (finalDoctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: finalDoctorId },
        include: { user: true }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
        });
      }

      if (!doctor.isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Doctor is not available at this time',
        });
      }

      const isAvailable = await isTimeSlotAvailable(appointmentDate, time, finalDoctorId);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked. Please choose another time.',
        });
      }
    }

    // ============================================================
    // STEP 3: Check service and department
    // ============================================================
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!service || !service.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Service is not available',
        });
      }
    }

    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
        });
      }
    }

    // ============================================================
    // STEP 4: Build appointment data - ALL fields now exist in schema
    // ============================================================
    const appointmentData = {
      patientId: finalPatientId,
      doctorId: finalDoctorId,
      departmentId: departmentId || null,
      serviceId: serviceId || null,
      userId: req.user.id,
      patientName: patientName || null,
      patientEmail: patientEmail || null,
      patientPhone: patientPhone || null,
      patientAge: patientAge || null,
      patientGender: patientGender || null,
      date: appointmentDate,
      time: time,
      reason: reason || '',
      symptoms: symptoms || '',
      isEmergency: isEmergency || false,
      status: 'PENDING',
      visitType: visitType || 'HOSPITAL',
      city: city || null,
      subCity: subCity || null,
      woreda: woreda || null,
      homeAddress: homeAddress || null,
      gpsPin: gpsPin || null,
      location: 'Adinas General Hospital',
    };

    console.log('📝 Creating appointment with data:', JSON.stringify(appointmentData, null, 2));

    // ============================================================
    // STEP 5: Create appointment
    // ============================================================
    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    console.log(`✅ Appointment created: ${appointment.id}`);

    // Send confirmation notification
    try {
      if (notificationService.sendAppointmentConfirmation) {
        await notificationService.sendAppointmentConfirmation(appointment);
        console.log('📧 Confirmation notification sent');
      }
    } catch (notifyError) {
      console.warn('⚠️ Failed to send confirmation notification:', notifyError.message);
    }

    res.status(201).json({
      success: true,
      data: mapAppointment(appointment),
      message: 'Appointment created successfully',
    });
  } catch (error) {
    console.error('❌ Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create appointment: ' + error.message,
    });
  }
});

// ============================================================
// UPDATE appointment status
// ============================================================
router.patch('/:id/status', auth, authorize('ADMIN', 'DOCTOR'), [
  body('status').isIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  body('diagnosis').optional().isString(),
  body('treatment').optional().isString(),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status, diagnosis, treatment, notes } = req.body;

    console.log(`📡 Updating appointment ${id} to status: ${status}`);

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true }
        },
        doctor: {
          include: { user: true }
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (!doctor || appointment.doctorId !== doctor.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this appointment',
        });
      }
    }

    const updateData = { 
      status,
      diagnosis: diagnosis || appointment.diagnosis,
      treatment: treatment || appointment.treatment,
      notes: notes || appointment.notes,
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const oldStatus = appointment.status;
    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    console.log(`✅ Appointment ${id} status updated from ${oldStatus} to ${status}`);

    let notifications = { email: false, sms: false };
    
    if (status === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
      console.log(`📧 Sending CONFIRMED notification for appointment ${id}`);
      try {
        if (notificationService.sendAppointmentApproved) {
          const result = await notificationService.sendAppointmentApproved(updated);
          notifications.email = result.email?.success || false;
          notifications.sms = result.sms?.success || false;
        }
      } catch (error) {
        console.error('❌ Failed to send confirmation notification:', error);
      }
    }

    if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      console.log(`📧 Sending CANCELLED notification for appointment ${id}`);
      try {
        if (notificationService.sendAppointmentRejected) {
          const result = await notificationService.sendAppointmentRejected(updated);
          notifications.email = result.email?.success || false;
          notifications.sms = result.sms?.success || false;
        }
      } catch (error) {
        console.error('❌ Failed to send cancellation notification:', error);
      }
    }

    res.json({
      success: true,
      data: mapAppointment(updated),
      message: `Appointment status updated to ${status}`,
      notifications: {
        emailSent: notifications.email,
        smsSent: notifications.sms
      }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment',
    });
  }
});

// ============================================================
// UPDATE appointment details
// ============================================================
router.put('/:id', auth, authorize('ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      patientId, doctorId, date, time, reason, symptoms, 
      diagnosis, treatment, notes, isEmergency, visitType,
      city, subCity, woreda, homeAddress, serviceId, departmentId,
      patientName, patientEmail, patientPhone, patientAge, patientGender
    } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      if (!doctor || appointment.doctorId !== doctor.id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this appointment',
        });
      }
    }

    if (date && time && doctorId) {
      const newDate = new Date(date);
      const isAvailable = await isTimeSlotAvailable(newDate, time, doctorId, id);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked. Please choose another time.',
        });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        patientId: patientId || appointment.patientId,
        doctorId: doctorId || appointment.doctorId,
        departmentId: departmentId !== undefined ? departmentId : appointment.departmentId,
        serviceId: serviceId !== undefined ? serviceId : appointment.serviceId,
        patientName: patientName !== undefined ? patientName : appointment.patientName,
        patientEmail: patientEmail !== undefined ? patientEmail : appointment.patientEmail,
        patientPhone: patientPhone !== undefined ? patientPhone : appointment.patientPhone,
        patientAge: patientAge !== undefined ? patientAge : appointment.patientAge,
        patientGender: patientGender !== undefined ? patientGender : appointment.patientGender,
        date: date ? new Date(date) : appointment.date,
        time: time || appointment.time,
        reason: reason !== undefined ? reason : appointment.reason,
        symptoms: symptoms !== undefined ? symptoms : appointment.symptoms,
        diagnosis: diagnosis !== undefined ? diagnosis : appointment.diagnosis,
        treatment: treatment !== undefined ? treatment : appointment.treatment,
        notes: notes !== undefined ? notes : appointment.notes,
        isEmergency: isEmergency !== undefined ? isEmergency : appointment.isEmergency,
        visitType: visitType !== undefined ? visitType : appointment.visitType,
        city: city !== undefined ? city : appointment.city,
        subCity: subCity !== undefined ? subCity : appointment.subCity,
        woreda: woreda !== undefined ? woreda : appointment.woreda,
        homeAddress: homeAddress !== undefined ? homeAddress : appointment.homeAddress,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: mapAppointment(updated),
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update appointment',
    });
  }
});

// ============================================================
// DELETE appointment
// ============================================================
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete appointment',
    });
  }
});

// ============================================================
// CANCEL appointment
// ============================================================
router.post('/:id/cancel', auth, authorize('PATIENT'), async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });

    if (!patient || appointment.patientId !== patient.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this appointment',
      });
    }

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel appointment with status: ${appointment.status}`,
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    try {
      if (notificationService.sendAppointmentCancelled) {
        await notificationService.sendAppointmentCancelled(updated);
        console.log(`📧 Cancellation notification sent for appointment ${id}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to send cancellation notification:', error.message);
    }

    res.json({
      success: true,
      data: mapAppointment(updated),
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment',
    });
  }
});

// ============================================================
// GET available time slots
// ============================================================
router.get('/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { doctorId } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        error: 'Doctor ID is required',
      });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { workingHours: true }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Doctor is not available',
      });
    }

    const dayOfWeek = appointmentDate.getDay();
    const workingHour = doctor.workingHours.find(wh => wh.dayOfWeek === dayOfWeek && wh.isAvailable);
    
    if (!workingHour) {
      return res.status(400).json({
        success: false,
        error: 'Doctor is not available on this day',
      });
    }

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        date: appointmentDate,
        NOT: {
          status: {
            in: ['CANCELLED', 'NO_SHOW']
          }
        }
      },
      select: {
        time: true,
      },
    });

    const bookedSlots = bookedAppointments.map(a => a.time);

    const allSlots = [];
    const startHour = parseInt(workingHour.startTime.split(':')[0]);
    const startMinute = parseInt(workingHour.startTime.split(':')[1]);
    const endHour = parseInt(workingHour.endTime.split(':')[0]);
    const endMinute = parseInt(workingHour.endTime.split(':')[1]);

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 30) {
        if (hour === endHour && minute >= endMinute) break;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(time);
      }
    }

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: {
        date: date,
        doctorId: doctorId,
        doctorName: doctor.user ? 
          `${doctor.user.firstName} ${doctor.user.lastName}` : 
          'Unknown Doctor',
        availableSlots: availableSlots,
        bookedSlots: bookedSlots,
        totalSlots: allSlots.length,
        availableCount: availableSlots.length,
        workingHours: {
          start: workingHour.startTime,
          end: workingHour.endTime,
        },
      },
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots: ' + error.message,
    });
  }
});

// ============================================================
// GET appointments by patient
// ============================================================
router.get('/patient/my-appointments', auth, authorize('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: appointments.map(mapAppointment),
      count: appointments.length,
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments',
    });
  }
});

// ============================================================
// GET appointments by doctor
// ============================================================
router.get('/doctor/my-appointments', auth, authorize('DOCTOR'), async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
      select: { id: true }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json({
      success: true,
      data: appointments.map(mapAppointment),
      count: appointments.length,
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments',
    });
  }
});

module.exports = router;