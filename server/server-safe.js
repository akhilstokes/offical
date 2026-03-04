const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const staffInviteController = require('./controllers/staffInviteController');
const rateScheduler = require('./services/rateScheduler');
const http = require('http');
const setupWebSocketServer = require('./websocketServer');

dotenv.config();

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());

app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

/* =========================
   ROUTES - WITH ERROR HANDLING
========================= */

// Helper function to safely load routes
function safeLoadRoute(path, routePath) {
  try {
    app.use(path, require(routePath));
    console.log(`✓ Loaded: ${path}`);
    return true;
  } catch (error) {
    console.warn(`✗ Failed to load ${path}: ${error.message}`);
    return false;
  }
}

app.post('/api/staff/verify-invite', staffInviteController.verify);

// Core routes
safeLoadRoute('/api/auth', './routes/authRoutes');
safeLoadRoute('/api/users', './routes/userRoutes');

// Barrel routes
safeLoadRoute('/api/barrels', './routes/barrelRoutes');
safeLoadRoute('/api/barrel-management', './routes/barrelManagementRoutes');
safeLoadRoute('/api/barrel-requests', './routes/barrelRequestRoutes');
safeLoadRoute('/api/barrel-issue-register', './routes/barrelIssueRegisterRoutes');
safeLoadRoute('/api/return-barrels', './routes/returnBarrelRoutes');

// Stock and inventory
safeLoadRoute('/api/stock', './routes/stockRoutes');
safeLoadRoute('/api/hanger-spaces', './routes/hangerSpaceRoutes');

// Rates and pricing
safeLoadRoute('/api/rates', './routes/rateRoutes');
safeLoadRoute('/api/rubber-rates', './routes/rubberRateRoutes');

// Bills and payments
safeLoadRoute('/api/bills', './routes/billRoutes');
safeLoadRoute('/api/expenses', './routes/expenseRoutes');

// Staff and workers
safeLoadRoute('/api/workers', './routes/workerRoutes');
safeLoadRoute('/api/attendance', './routes/attendanceRoutes');
safeLoadRoute('/api/schedules', './routes/scheduleRoutes');
safeLoadRoute('/api/staff-schedule', './routes/staffScheduleRoutes');
safeLoadRoute('/api/shifts', './routes/shifts');
safeLoadRoute('/api/shift-assignments', './routes/shiftAssignments');
safeLoadRoute('/api/leave', './routes/leaveRoutes');
safeLoadRoute('/api/salary', './routes/salaryRoutes');
safeLoadRoute('/api/wages', './routes/wagesRoutes');

// Delivery and field staff
safeLoadRoute('/api/delivery', './routes/deliveryRoutes');
safeLoadRoute('/api/field-staff', './routes/fieldStaffRoutes');

// Sell requests
safeLoadRoute('/api/sell-requests', './routes/sellRequestRoutes');

// Notifications
safeLoadRoute('/api/notifications', './routes/notificationRoutes');

// Uploads
safeLoadRoute('/api/uploads', './routes/uploadRoutes');

// Predictions
safeLoadRoute('/api/predict', './routes/predictionRoutes');

// Vehicles
safeLoadRoute('/api/vehicles', './routes/vehicleRoutes');

// Dashboards
safeLoadRoute('/api/admin-dashboard', './routes/adminDashboard');
safeLoadRoute('/api/manager-dashboard', './routes/managerDashboard');
safeLoadRoute('/api/staff-dashboard', './routes/staffDashboard');
safeLoadRoute('/api/user-dashboard', './routes/userDashboard');

/* =========================
   HEALTH CHECK ROUTE
========================= */

app.get('/', (req, res) => {
  res.json({ status: 'Backend is running 🚀' });
});

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    setupWebSocketServer(server);

    server.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`Server running on port ${PORT}`);
      console.log(`========================================\n`);

      setTimeout(() => {
        try {
          rateScheduler.start();
          console.log('Rate scheduler initialized');
        } catch (e) {
          console.warn('Scheduler failed:', e.message);
        }
      }, 2000);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();
