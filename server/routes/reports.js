const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all report routes

router.get('/dashboard', getDashboardSummary);

module.exports = router;
