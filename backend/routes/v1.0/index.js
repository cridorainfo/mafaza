const express = require('express');
const router = express.Router();
const authorize = require('../../app/Middleware/Authorize');

//auth route
router.use('/auth', require('./routes/authRoutes'));
router.use('/user', require('./routes/userRoutes'));
router.use('/transaction', require('./routes/transactionRoutes'));
router.use('/project', require('./routes/projectRoutes'));
router.use('/ledger', require('./routes/userLedgerRoutes'));
router.use('/modular-access', require('./routes/modularAccessRoutes'));
router.use('/audit-log', require('./routes/auditLogRoutes'));
router.use('/migration', require('./routes/migrationRoutes'));
router.use('/notification', require('./routes/notificationRoutes'));

router.get("/stats", authorize([], 'dashboard'), require('../../app/Controllers/DashboardController').getStats)
router.get("/stats/next-payments", authorize([], 'dashboard'), require('../../app/Controllers/DashboardController').getNextPayments)

module.exports = router;
