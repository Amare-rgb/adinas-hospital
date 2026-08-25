// backend/src/routes/settings.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, authorize } = require('../middleware/auth');

// GET settings
router.get('/', auth, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          hospitalName: 'Adinas General Hospital',
          hospitalAddress: 'Felege Hiwot Area, Lake Tana Shore, Bahir Dar',
          hospitalPhone: '+251 98 320 1998',
          hospitalEmail: 'info@afilas.com',
          timezone: 'Africa/Nairobi',
          currency: 'ETB',
          taxRate: 0,
          clinicHours: 'Mon-Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 2:00 PM\nSun: Closed',
        }
      });
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

// PUT update settings
router.put('/', auth, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const data = req.body;
    
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: data
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: data
      });
    }
    
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

module.exports = router;