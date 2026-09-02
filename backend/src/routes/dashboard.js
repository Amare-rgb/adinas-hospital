const express = require('express');
const prisma = require('../lib/prisma');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// HELPER 1: Get location filter for Prisma
// ============================================================
function getLocationFilter(location) {
  if (!location || location === 'all' || location === 'undefined' || location === 'null' || location === '') {
    return {}; 
  }
  
  return { 
    location: { 
      contains: location.trim(), 
      mode: 'insensitive' 
    } 
  };
}

// ============================================================
// GET Dashboard Statistics
// ============================================================
router.get('/stats', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { location = 'all' } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const locationFilter = getLocationFilter(location);

    console.log(`📊 Dashboard Querying for Location: "${location}"`);

    // ============================================================
    // 1. QUERIES WITH LOCATION FILTER
    // ============================================================
    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      totalDoctors,
      totalServices,
      pendingContacts,
      appointmentsByStatus,
      recentAppointments,
    ] = await Promise.all([
      prisma.appointment ? prisma.appointment.count({ where: locationFilter }).catch(() => 0) : 0,
      prisma.appointment ? prisma.appointment.count({
        where: {
          ...locationFilter,
          date: { gte: today, lt: tomorrow },
        },
      }).catch(() => 0) : 0,
      prisma.appointment ? prisma.appointment.count({
        where: {
          ...locationFilter,
          date: { gte: today, lte: nextWeek },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }).catch(() => 0) : 0,
      prisma.doctor ? prisma.doctor.count({ where: locationFilter }).catch(() => 0) : 0,
      prisma.service ? prisma.service.count({ where: { isActive: true } }).catch(() => 0) : 0,
      prisma.contact ? prisma.contact.count({ where: { status: 'UNREAD' } }).catch(() => 0) : 0,
      prisma.appointment ? prisma.appointment.groupBy({
        by: ['status'],
        where: locationFilter,
        _count: { _all: true },
      }).catch(() => []) : [],
      prisma.appointment ? prisma.appointment.findMany({
        where: locationFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { name: true } },
          user: { 
            select: { 
              firstName: true,  // ✅ Changed from 'name' to 'firstName'
              lastName: true,   // ✅ Added lastName
              id: true,
              email: true,
              phone: true,
            } 
          },
        },
      }).catch(() => []) : [],
    ]);

    // ============================================================
    // 2. QUERIES WITHOUT LOCATION FILTER (WITH MODEL CHECKS)
    // ============================================================
    const totalUsers = prisma.user ? await prisma.user.count({ where: { isActive: true } }).catch(() => 0) : 0;
    const totalDepartments = prisma.department ? await prisma.department.count({ where: { isActive: true } }).catch(() => 0) : 0;

    // ============================================================
    // 3. SAFELY HANDLE MISSING 'news' AND 'review' MODELS
    // ============================================================
    let totalNews = 0;
    try {
      if (prisma.news) {
        totalNews = await prisma.news.count({ where: { isPublished: true } });
      }
    } catch (e) { /* Keep 0 */ }

    let safeTotalReviews = 0;
    let safeAverageRating = 0;
    try {
      if (prisma.review) {
        safeTotalReviews = await prisma.review.count();
        const avg = await prisma.review.aggregate({ _avg: { rating: true } });
        safeAverageRating = avg?._avg?.rating || 0;
      }
    } catch (e) { /* Keep 0 */ }

    // ============================================================
    // FORMAT STATUS COUNTS
    // ============================================================
    const statusCounts = {};
    if (Array.isArray(appointmentsByStatus)) {
      appointmentsByStatus.forEach((item) => {
        if (item && item.status) {
          const countValue = typeof item._count === 'number' 
            ? item._count 
            : (item._count?._all || item._count?.id || 0);

          statusCounts[item.status] = countValue;
        }
      });
    }

    // ============================================================
    // MAP RECENT APPOINTMENTS FOR FRONTEND
    // ============================================================
    const mappedRecentAppointments = Array.isArray(recentAppointments)
      ? recentAppointments.map((app) => ({
          id: app.id,
          date: app.date,
          status: app.status,
          doctor: null, 
          service: app.service ? { name: app.service.name } : null,
          patientName: app.user 
            ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() || 'Unknown'  // ✅ Combined firstName + lastName
            : app.patientName || 'Unknown',
        }))
      : [];

    console.log(`✅ Success: Appointments=${totalAppointments}, Doctors=${totalDoctors}, Users=${totalUsers}`);

    return res.json({
      success: true,
      data: {
        overview: {
          totalAppointments,
          todayAppointments,
          upcomingAppointments,
          totalDoctors,
          totalDepartments,
          totalServices,
          totalUsers,
          pendingContacts,
          totalNews,
        },
        appointmentsByStatus: statusCounts,
        recentAppointments: mappedRecentAppointments,
        reviews: {
          totalReviews: safeTotalReviews,
          averageRating: safeAverageRating,
        },
        location,
      },
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return res.json({
      success: true,
      data: {
        overview: {
          totalAppointments: 0,
          todayAppointments: 0,
          upcomingAppointments: 0,
          totalDoctors: 0,
          totalDepartments: 0,
          totalServices: 0,
          totalUsers: 0,
          pendingContacts: 0,
          totalNews: 0,
        },
        appointmentsByStatus: {},
        recentAppointments: [],
        reviews: {
          totalReviews: 0,
          averageRating: 0,
        },
        location: 'all',
      },
    });
  }
});

// ============================================================
// GET Appointments Chart Data
// ============================================================
router.get('/appointments-chart', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { period = 'month', location = 'all' } = req.query;
    const now = new Date();
    let startDate = new Date();

    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 6);
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setMonth(startDate.getMonth() - 6);

    const locationFilter = getLocationFilter(location);

    const appointments = prisma.appointment ? await prisma.appointment.findMany({
      where: {
        ...locationFilter,
        date: { gte: startDate, lte: now },
      },
      select: { date: true, status: true },
    }).catch(() => []) : [];

    const monthMap = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 12; i++) {
      monthMap[monthOrder[i]] = { month: monthOrder[i], appointments: 0, completed: 0, cancelled: 0 };
    }

    appointments.forEach((app) => {
      if (app.date) {
        const month = new Date(app.date).toLocaleString('default', { month: 'short' });
        if (monthMap[month]) {
          monthMap[month].appointments++;
          if (app.status === 'COMPLETED') monthMap[month].completed++;
          if (app.status === 'CANCELLED') monthMap[month].cancelled++;
        }
      }
    });

    return res.json({ success: true, data: Object.values(monthMap) });
  } catch (error) {
    console.error('❌ Appointments chart error:', error);
    return res.json({ success: true, data: [] });
  }
});

// ============================================================
// GET Users Chart Data
// ============================================================
router.get('/users-chart', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const users = prisma.user ? await prisma.user.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: { _all: true },
    }).catch(() => []) : [];

    let chartData = Array.isArray(users)
      ? users.map((user) => ({
          role: user.role,
          count: typeof user._count === 'number' 
            ? user._count 
            : (user._count?._all || user._count?.id || 0),
        }))
      : [];

    if (chartData.length === 0) {
      chartData = [
        { role: 'SUPER_ADMIN', count: 0 },
        { role: 'ADMIN', count: 0 },
        { role: 'DOCTOR', count: 0 },
        { role: 'USER', count: 0 },
      ];
    }

    return res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('❌ Users chart error:', error);
    return res.json({ success: true, data: [] });
  }
});

module.exports = router;