const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const staffInviteController = require('./controllers/staffInviteController');
const rateScheduler = require('./services/rateScheduler');

// Load environment variables
dotenv.config();

// Connect to the MongoDB database (server will start after successful connection)
// We'll await this in an init function below

const app = express();

// ✅ CORS Setup: Allow React frontend, Vercel, and Render deployments
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'https://holyfamilyprojectt.vercel.app',
    'https://holyfamilyprojectt-b486fa3gw-akhilstokes-projects.vercel.app',
    'https://holy-family-polymers-frontend.onrender.com',
    process.env.FRONTEND_URL // Dynamic frontend URL from env
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Add Cross-Origin-Opener-Policy header to allow Google OAuth popups
app.use((req, res, next) => {
    res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// Enable JSON parsing for incoming requests
app.use(express.json());

// Debug middleware to log requests (commented out for production)
// app.use((req, res, next) => {
//   if (req.path.includes('/user-management/')) {
//     console.log(`Request: ${req.method} ${req.path}`);
//   }
//   next();
// });

// Static hosting for uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route Definitions
// Public staff verify endpoint must be reachable without auth
app.post('/api/staff/verify-invite', staffInviteController.verify);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/barrels', require('./routes/barrelRoutes'));
app.use('/api/barrel-logistics', require('./routes/barrelMovementRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/capacity', require('./routes/capacityRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/rates', require('./routes/rateRoutes'));
app.use('/api/daily-rates', require('./routes/dailyRateRoutes'));
app.use('/api/user-rate-history', require('./routes/RateHistoryRoutes'));
app.use('/api/latex', require('./routes/latexRoutes'));
// Rubber Board rate auto-fetch
app.use('/api/rubber-rate', require('./routes/rubberRateRoutes'));

// Barrel Management System - New CRUD API
app.use('/api/barrel-management', require('./routes/barrelManagementRoutes'));

// Barrel Issue Register System - Transaction Ledger
app.use('/api/barrel-register', require('./routes/barrelIssueRegisterRoutes'));

// Enhanced routes with role-based access control
app.use('/api', require('./routes/enhancedRoutes'));

// Barrel tracking and DRC workflow routes
app.use('/api', require('./routes/barrelTrackingRoutes'));
// New admin endpoints for latex intake listing and pricing
app.use('/api/latex-intake', require('./routes/latexIntakeRoutes'));
app.use('/api/latex-pricing', require('./routes/latexPricingRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/user-management', require('./routes/userManagementRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/predict', require('./routes/predictionRoutes'));
app.use('/api/barrel-scrapes', require('./routes/barrelScrapeRoutes'));
app.use('/api/damages', require('./routes/damageRoutes'));
app.use('/api/repairs', require('./routes/repairRoutes'));
app.use('/api/staff-barrels', require('./routes/staffBarrelRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/barrel-requests', require('./routes/barrelRequestRoutes'));
// Manager to Admin barrel creation requests
app.use('/api/barrel-creation-requests', require('./routes/barrelCreationRequestRoutes'));
app.use('/api/chemicals', require('./routes/chemRoutes'));
app.use('/api/chem-requests', require('./routes/chemicalRequestRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/wages', require('./routes/wagesRoutes'));
app.use('/api/salary-notifications', require('./routes/salaryNotificationRoutes'));
app.use('/api/daily-wage', require('./routes/dailyWageRoutes'));
app.use('/api/monthly-wage', require('./routes/monthlyWageRoutes'));
app.use('/api/wage-templates', require('./routes/wageTemplateRoutes'));
app.use('/api/rate-scheduler', require('./routes/rateSchedulerRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/hanger-spaces', require('./routes/hangerSpaceRoutes'));
app.use('/api/sell-requests', require('./routes/sellRequestRoutes'));
// Mount invite routes BEFORE trips routes so public verify doesn't hit auth middleware
app.use('/api/staff-invite', require('./routes/staffInviteRoutes'));
app.use('/api/staff-records', require('./routes/staffRecordRoutes'));
app.use('/api/staff', require('./routes/staffTripRoutes'));
app.use('/api/field-staff', require('./routes/fieldStaffRoutes'));
app.use('/api/admin/return-barrels', require('./routes/adminReturnBarrelRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/bulk-notifications', require('./routes/bulkNotificationRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/lab', require('./routes/labSampleRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/knn', require('./routes/knnRoutes'));
app.use('/api/decision-tree', require('./routes/decisionTreeRoutes'));
app.use('/api/stock-history', require('./routes/stockHistoryRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/shift-assignments', require('./routes/shiftAssignments'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/accountant', require('./routes/accountantRoutes'));
app.use('/api/accountant/expenses', require('./routes/expenseRoutes'));
app.use('/api/accountant/branches', require('./routes/branchRoutes'));
app.use('/api/accountant-payments', require('./routes/accountantPaymentRoutes'));
app.use('/api/accountant-audit', require('./routes/accountantAuditRoutes'));
app.use('/api/financial', require('./routes/financialReportRoutes'));
app.use('/api/barrels', require('./routes/barrelReturnRoutes'));
app.use('/api/daily-wage', require('./routes/dailyWageRoutes'));
app.use('/api/monthly-wage', require('./routes/monthlyWageRoutes'));
app.use('/api/unified-salary', require('./routes/unifiedSalaryRoutes'));

// Vehicle Management System
app.use('/api/vehicles', require('./routes/vehicleRoutes'));

// New dashboard routes
app.use('/api/staff-dashboard', require('./routes/staffDashboard'));
app.use('/api/manager-dashboard', require('./routes/managerDashboard'));
app.use('/api/manager/schedule', require('./routes/staffScheduleRoutes'));
app.use('/api/admin-dashboard', require('./routes/adminDashboard'));
app.use('/api/user-dashboard', require('./routes/userDashboard'));

// Optional notifications endpoint (placeholder controller inline)
app.post('/api/notifications/staff-trip-event', async (req, res) => {
    try {
        const { userId, title, message, link, meta, targetRole } = req.body || {};
        const Notification = require('./models/Notification');
        const User = require('./models/userModel');

        // If a specific userId is provided, notify that user
        if (userId) {
            await Notification.create({ userId, title: title || 'Trip Update', message: message || 'Status changed', link, meta });
            return res.json({ ok: true });
        }

        // Broadcast to role (e.g., lab)
        if (targetRole) {
            const role = String(targetRole).toLowerCase();
            const users = await User.find({ role: role.includes('lab') ? 'lab' : role, status: 'active' }).select('_id').lean();
            if (users.length) {
                const docs = users.map(u => ({ userId: u._id, title: title || 'Update', message: message || 'Status changed', link, meta }));
                await Notification.insertMany(docs);
            }
            return res.json({ ok: true, delivered: users.length });
        }

        // Fallback: if only meta.userEmail provided, skip for now
        return res.json({ ok: true });
    } catch (e) {
        res.json({ ok: false, error: e?.message || 'error' });
    }
});

// Serve React build files (AFTER all API routes)
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch-all route to serve React app for any non-API routes
app.get('*', (req, res, next) => {
    // Don't serve HTML for API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Seed default Lab Staff users if not exists
const seedLabStaff = async () => {
    try {
        const User = require('./models/userModel');
        const bcrypt = require('bcryptjs');
        
        const labStaffUsers = [
            {
                name: 'Lab Staff',
                email: 'labstaff@xyz.com',
                phoneNumber: '9876543210',
                password: 'labstaff@123',
                role: 'lab_staff',
                staffId: 'LAB000',
                status: 'active'
            },
            {
                name: 'Lab Manager',
                email: 'labmanager@xyz.com',
                phoneNumber: '9876543211',
                password: 'labmanager@123',
                role: 'lab_manager',
                staffId: 'LABMGR',
                status: 'active'
            }
        ];

        for (const userData of labStaffUsers) {
            const existing = await User.findOne({ email: userData.email }).lean();
            if (!existing) {
                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);
                
                await User.create({
                    ...userData,
                    password: hashedPassword
                });
                console.log('Seeded default Lab user:', userData.email);
            }
        }
    } catch (e) {
        console.warn('Failed to seed default Lab Staff users:', e?.message || e);
    }
};

// Start the server only after DB connection is established
const PORT = process.env.PORT || 5000;
const http = require('http');
const setupWebSocketServer = require('./websocketServer');

(async () => {
  try {
    await connectDB();
    // Seed Lab Staff users after successful DB connection
    await seedLabStaff();
    
    const server = http.createServer(app);
    // Set up WebSocket server
    const wss = setupWebSocketServer(server);

    server.listen(PORT, () => {
      console.log(`HTTP Server running on port ${PORT}`);
      console.log(`WebSocket Server is running on ws://localhost:${PORT}`);
      // Start the rate scheduler after server starts
      setTimeout(() => {
        try {
          rateScheduler.start();
          console.log('Rate scheduler initialized');
          
          // Start vehicle expiry check cron job
          const { startVehicleExpiryCheckJob } = require('./jobs/vehicleExpiryCheck');
          startVehicleExpiryCheckJob();
          console.log('Vehicle expiry check cron job initialized');
        } catch (e) {
          console.warn('Scheduler failed to start:', e?.message || e);
        }
      }, 2000);
    });
  } catch (e) {
    console.error('Failed to initialize server:', e?.message || e);
    process.exit(1);
  }
})();
