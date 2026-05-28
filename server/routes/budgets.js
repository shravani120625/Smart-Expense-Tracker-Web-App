const express = require('express');
const router = express.Router();
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getBudgetStatus
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect); // protect all budget routes

router.route('/')
  .get(getBudgets)
  .post(upsertBudget);

router.get('/status', getBudgetStatus);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
