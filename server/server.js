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
   ROUTES
========================= */

app.post('/api/staff/verify-invite', staffInviteController.verify);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/barrels', require('./routes/barrelRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/rates', require('./routes/rateRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/predict', require('./routes/predictionRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/admin-dashboard', require('./routes/adminDashboard'));

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