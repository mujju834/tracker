const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Add a new expense
router.post('/add', async (req, res) => {
  try {
    const { userId, category, amount } = req.body;

    // Validation: Ensure amount is a positive number
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const newExpense = new Expense({
      userId,
      category,
      amount,
      date: new Date(), // Store the current date
    });

    await newExpense.save();
    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add expense', error: error.message });
  }
});

// Get all expenses for a specific user (with optional date filtering and pagination)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build the query object
    const query = { userId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1 }, // Sort by date (newest first)
    };

    // Fetch expenses with pagination
    const expenses = await Expense.find(query)
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);

    // Get total count for pagination purposes
    const totalExpenses = await Expense.countDocuments(query);

    res.status(200).json({
      expenses,
      currentPage: options.page,
      totalPages: Math.ceil(totalExpenses / options.limit),
      totalExpenses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve expenses', error: error.message });
  }
});

module.exports = router;
