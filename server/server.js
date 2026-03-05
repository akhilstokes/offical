const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const staffInviteController = require('./controllers/staffInviteController');
const rateScheduler = require('./services/rateScheduler');
const http = require('http');
const setupWebSocketServer = require('./websocketServer');

// Load environment variables from server/.env
dotenv.config({ path: __dirname + '/.env' });

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

// Allow all localhost origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🔧 CORS Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) {
      return callback(null, true);
    }

    // Allow any localhost origin in development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Check against allowed origins list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
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
   ROUTES
========================= */

app.post('/api/staff/verify-invite', staffInviteController.verify);

// Core routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/user-management', require('./routes/userManagementRoutes'));

// Barrel routes
app.use('/api/barrels', require('./routes/barrelRoutes'));
app.use('/api/barrel-management', require('./routes/barrelManagementRoutes'));
app.use('/api/barrel-requests', require('./routes/barrelRequestRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/barrel-issue-register', require('./routes/barrelIssueRegisterRoutes'));
app.use('/api/return-barrels', require('./routes/returnBarrelRoutes'));

// Stock and inventory
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/hanger-spaces', require('./routes/hangerSpaceRoutes'));
app.use('/api/chemicals', require('./routes/chemRoutes'));
app.use('/api/chem-requests', require('./routes/chemicalRequestRoutes'));

// Latex testing
app.use('/api/latex', require('./routes/latexRoutes'));

// Rates and pricing
app.use('/api/rates', require('./routes/rateRoutes'));
app.use('/api/rubber-rates', require('./routes/rubberRateRoutes'));

// Bills and payments
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/purchase-bills', require('./routes/purchaseBillRoutes'));

// Staff and workers
app.use('/api/staff-invite', require('./routes/staffInviteRoutes'));
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/staff-schedule', require('./routes/staffScheduleRoutes'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/shift-assignments', require('./routes/shiftAssignments'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/wages', require('./routes/wagesRoutes'));

// Delivery and field staff
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/field-staff', require('./routes/fieldStaffRoutes'));

// Sell requests
app.use('/api/sell-requests', require('./routes/sellRequestRoutes'));

// Notifications
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/bulk-notifications', require('./routes/bulkNotificationRoutes'));

// Complaints
app.use('/api/complaints', require('./routes/complaintRoutes'));

// Uploads
app.use('/api/uploads', require('./routes/uploadRoutes'));

// Predictions
app.use('/api/predict', require('./routes/predictionRoutes'));

// Vehicles
app.use('/api/vehicles', require('./routes/vehicleRoutes'));

// Dashboards
app.use('/api/admin-dashboard', require('./routes/adminDashboard'));
app.use('/api/manager-dashboard', require('./routes/managerDashboard'));
app.use('/api/staff-dashboard', require('./routes/staffDashboard'));
app.use('/api/user-dashboard', require('./routes/userDashboard'));

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
      console.log(`Server running on port ${PORT}`);

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