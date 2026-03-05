const express = require('express');
const router = express.Router();
const {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    approveExpense,
    markAsPaid,
    deleteExpense,
    addComment,
    getExpenseStats
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Statistics route (before :id routes)
router.get('/stats', getExpenseStats);

// Main CRUD routes
router.route('/')
    .get(getAllExpenses)
    .post(createExpense);

router.route('/:id')
    .get(getExpenseById)
    .put(updateExpense)
    .delete(deleteExpense);

// Action routes
router.patch('/:id/approve', approveExpense);
router.patch('/:id/pay', markAsPaid);
router.post('/:id/comments', addComment);

module.exports = router;
