// server.js
require('dotenv').config();

// ===== FIX: Verify environment variables are loaded =====
console.log('📋 Environment Check:');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ MISSING!');
console.log('  PORT:', process.env.PORT || 5000);
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Loaded' : '❌ MISSING!');
console.log('  CHAPA_SECRET_KEY:', process.env.CHAPA_SECRET_KEY ? '✅ Loaded' : '⚠️ Not set (payment will fail)');
console.log('  BASE_URL:', process.env.BASE_URL || 'http://localhost:5000');

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in .env file!');
  console.error('Please add JWT_SECRET=your-secret-key to .env file');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const dashboardRoutes = require('./routes/dashboard');
const serviceRoutes = require('./routes/services');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/paymentRoutes');
const departmentRoutes = require('./routes/departments');
// 🔥 ADDED: Settings routes
const settingsRoutes = require('./routes/settings');

// ❌ REMOVED: const pharmaOrdersRoutes = require('./routes/pharma-orders.routes');

const app = express();

// ============================================================
// CONFIGURATION
// ============================================================
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  CLIENT_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

// ============================================================
// MIDDLEWARE (Must come before routes)
// ============================================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn('⚠️ Blocked CORS request from:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));

// Logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// STATIC FILES
// ============================================================
const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Serving uploads from:', uploadsPath);

if (!fs.existsSync(uploadsPath)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use('/uploads', express.static(uploadsPath));

// ============================================================
// NOTIFICATION DATA (In-memory storage - Will reset on restart)
// ============================================================
let notifications = [];
let notificationIdCounter = 1;

const getUserId = (req) => {
  if (req.user?.id) return req.user.id;
  if (req.user?.userId) return req.user.userId;
  return 'admin-123';
};

const getTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
};

const createSampleNotifications = (userId) => {
  const now = new Date();
  return [
    {
      id: notificationIdCounter++,
      userId: userId,
      title: 'New appointment booked by John Doe',
      message: 'Dr. Smith has a new appointment with patient John Doe at 2:30 PM tomorrow.',
      type: 'appointment',
      read: false,
      createdAt: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      id: notificationIdCounter++,
      userId: userId,
      title: 'Patient feedback received from Sarah Smith',
      message: 'Patient Sarah Smith submitted feedback with rating 4.5 stars.',
      type: 'patient',
      read: false,
      createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
    },
    {
      id: notificationIdCounter++,
      userId: userId,
      title: 'Dr. Johnson schedule updated for tomorrow',
      message: 'Dr. Johnson has updated their schedule. 2 new slots available.',
      type: 'doctor',
      read: true,
      createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
    },
    {
      id: notificationIdCounter++,
      userId: userId,
      title: 'System maintenance scheduled for tonight',
      message: 'Maintenance at 11:00 PM. Expected downtime: 30 minutes.',
      type: 'system',
      read: true,
      createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
    },
    {
      id: notificationIdCounter++,
      userId: userId,
      title: 'New patient registered: Michael Brown',
      message: 'A new patient has registered at Adinas General Hospital.',
      type: 'patient',
      read: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 3600000).toISOString(),
    },
    {
      id: notificationIdCounter++,
      userId: userId,
      title: 'Lab results ready for patient Emily Wilson',
      message: 'Lab results are now available. Please review.',
      type: 'general',
      read: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 3600000).toISOString(),
    },
  ];
};

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

app.get('/api/notifications/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Notification routes are working!',
    timestamp: new Date().toISOString(),
    totalNotifications: notifications.length
  });
});

app.get('/api/notifications', (req, res) => {
  try {
    const userId = getUserId(req);
    
    let userNotifications = notifications.filter(n => n.userId === userId);
    if (userNotifications.length === 0) {
      const samples = createSampleNotifications(userId);
      notifications = [...notifications, ...samples];
      userNotifications = notifications.filter(n => n.userId === userId);
    }
    
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    const formatted = userNotifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message || '',
      time: getTimeAgo(n.createdAt),
      read: n.read,
      type: n.type || 'general',
      createdAt: n.createdAt,
    }));
    
    res.json({ 
      success: true,
      notifications: formatted, 
      unreadCount 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread/count', (req, res) => {
  try {
    const userId = getUserId(req);
    const count = notifications.filter(n => n.userId === userId && !n.read).length;
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get count' });
  }
});

app.patch('/api/notifications/:id/read', (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    
    const notification = notifications.find(n => n.id === id && n.userId === userId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    notification.readAt = new Date().toISOString();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.patch('/api/notifications/read/all', (req, res) => {
  try {
    const userId = getUserId(req);
    let count = 0;
    
    notifications = notifications.map(n => {
      if (n.userId === userId && !n.read) {
        count++;
        return { ...n, read: true, readAt: new Date().toISOString() };
      }
      return n;
    });
    
    res.json({ success: true, updatedCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/api/notifications/:id', (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    
    const index = notifications.findIndex(n => n.id === id && n.userId === userId);
    if (index === -1) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    notifications.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.post('/api/notifications', (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, message, type } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const notification = {
      id: notificationIdCounter++,
      userId,
      title,
      message: message || '',
      type: type || 'general',
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    notifications.push(notification);
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create' });
  }
});

app.get('/api/notifications/sample', (req, res) => {
  try {
    const userId = getUserId(req);
    notifications = notifications.filter(n => n.userId !== userId);
    const samples = createSampleNotifications(userId);
    notifications = [...notifications, ...samples];
    
    res.json({ 
      success: true, 
      message: `Created ${samples.length} sample notifications`,
      count: samples.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sample notifications' });
  }
});

// ============================================================
// ✅ REGISTER ALL ROUTES
// ============================================================

console.log('\n📦 Registering routes...');

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: 'Adinas Hospital API',
    jwt_configured: !!process.env.JWT_SECRET,
    chapa_configured: !!process.env.CHAPA_SECRET_KEY,
    environment: NODE_ENV,
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Adinas Hospital API is running',
    version: '1.0.0',
    jwt_configured: !!process.env.JWT_SECRET,
    endpoints: {
      auth: '/api/auth',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      services: '/api/services',
      payment: '/api/payment',
      notifications: '/api/notifications',
      departments: '/api/departments',
      settings: '/api/settings',
    }
  });
});

try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered at /api/auth');

  app.use('/api/doctors', doctorRoutes);
  console.log('✅ Doctor routes registered at /api/doctors');

  app.use('/api/appointments', appointmentRoutes);
  console.log('✅ Appointment routes registered at /api/appointments');

  app.use('/api/blog', blogRoutes);
  console.log('✅ Blog routes registered at /api/blog');

  app.use('/api/contact', contactRoutes);
  console.log('✅ Contact routes registered at /api/contact');

  app.use('/api/dashboard', dashboardRoutes);
  console.log('✅ Dashboard routes registered at /api/dashboard');

  app.use('/api/services', serviceRoutes);
  console.log('✅ Service routes registered at /api/services');

  app.use('/api/upload', uploadRoutes);
  console.log('✅ Upload routes registered at /api/upload');

  app.use('/api/users', userRoutes);
  console.log('✅ User routes registered at /api/users');

  // ❌ REMOVED: app.use('/api/pharma-orders', pharmaOrdersRoutes);
  
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Payment routes registered at /api/payment');

  app.use('/api/departments', departmentRoutes);
  console.log('✅ Department routes registered at /api/departments');

  // 🔥 ADDED: Settings routes
  app.use('/api/settings', settingsRoutes);
  console.log('✅ Settings routes registered at /api/settings');

} catch (error) {
  console.error('❌ Error registering routes:', error);
  process.exit(1);
}

// ============================================================
// ERROR HANDLING (Must be after all routes)
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Global Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { 
      stack: err.stack,
      path: req.path,
    }),
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`📁 Base URL: ${BASE_URL}`);
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
  console.log(`\n🔐 Security:`);
  console.log(`   JWT: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing!'}`);
  console.log(`   Chapa: ${process.env.CHAPA_SECRET_KEY ? '✅ Configured' : '⚠️ Not set'}`);
  console.log(`   CORS: ${allowedOrigins.join(', ')}`);
  
  console.log('\n📋 Available API Endpoints:');
  console.log(`   🔹 GET  /health - Health check`);
  console.log(`   🔹 GET  / - API information`);
  console.log(`   🔹 POST /api/auth/login - Login`);
  console.log(`   🔹 POST /api/auth/register - Register`);
  console.log(`   🔹 GET  /api/appointments - Get appointments`);
  console.log(`   🔹 POST /api/appointments - Create appointment`);
  console.log(`   🔹 GET  /api/doctors - Get doctors`);
  console.log(`   🔹 GET  /api/services - Get services`);
  console.log(`   🔹 GET  /api/blog - Get blog posts`);
  console.log(`   🔹 POST /api/contact - Send contact message`);
  console.log(`   🔹 GET  /api/dashboard/stats - Dashboard stats`);
  console.log(`   🔹 POST /api/upload - Upload files`);
  console.log(`   🔹 GET  /api/users - Get users (admin only)`);
  
  console.log(`\n   💳 PAYMENT ENDPOINTS:`);
  console.log(`   🔹 POST /api/payment/initiate - Initiate payment`);
  console.log(`   🔹 GET  /api/payment/verify?tx_ref=XXX - Verify payment`);
  console.log(`   🔹 GET  /api/payment/status/:tx_ref - Check payment status`);
  console.log(`   🔹 POST /api/payment/webhook - Chapa webhook`);
  
  console.log(`\n   🔔 NOTIFICATION ENDPOINTS:`);
  console.log(`   🔹 GET  /api/notifications - Get notifications`);
  console.log(`   🔹 GET  /api/notifications/unread/count - Unread count`);
  console.log(`   🔹 PATCH /api/notifications/:id/read - Mark as read`);
  console.log(`   🔹 PATCH /api/notifications/read/all - Mark all as read`);
  console.log(`   🔹 DELETE /api/notifications/:id - Delete notification`);
  console.log(`   🔹 POST /api/notifications - Create notification`);
  console.log(`   🔹 GET  /api/notifications/sample - Create sample notifications`);

  console.log(`\n   🏥 DEPARTMENT ENDPOINTS:`);
  console.log(`   🔹 GET  /api/departments - List all departments`);
  console.log(`   🔹 POST /api/departments - Create a new department`);

  console.log(`\n   ⚙️ SETTINGS ENDPOINTS:`);
  console.log(`   🔹 GET  /api/settings - Get settings`);
  console.log(`   🔹 PUT  /api/settings - Update settings`);
  console.log('========================================\n');
});

// ============================================================
// HANDLE UNCAUGHT EXCEPTIONS
// ============================================================
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  if (NODE_ENV === 'production') {
    process.exit(1);
  }
});