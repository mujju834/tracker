// routes/expenses.js
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

// Handle QR Code Scan
router.post('/scan', async (req, res) => {
  try {
    const { userId, data } = req.body;

    // Validate presence of userId and data
    if (!userId || !data) {
      return res.status(400).json({ message: 'userId and data are required' });
    }

    // Parse the QR data
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid QR data format. Expected JSON string.' });
    }

    const { destinatary, amount } = parsedData;

    // Validate the parsed data
    if (!destinatary || !amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid expense data in QR code.' });
    }

    // Create and save the new expense
    const newExpense = new Expense({
      userId,
      category: destinatary,
      amount,
      date: new Date(),
    });

    await newExpense.save();

    res.status(201).json({ message: 'Expense added via QR scan successfully', expense: newExpense });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add expense via QR scan', error: error.message });
  }
});

module.exports = router;
