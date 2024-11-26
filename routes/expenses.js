// routes/expenses.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// Add a new expense
router.post('/add', async (req, res) => {
  try {
    const { userId, category, amount } = req.body;

    // Validation: Ensure all fields are present
    if (!userId || !category || amount === undefined) {
      return res.status(400).json({ message: 'userId, category, and amount are required.' });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId.' });
    }

    // Validation: Ensure amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
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

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId.' });
    }

    // Build the query object
    const query = { userId };
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: 'Invalid startDate or endDate.' });
      }

      query.date = {
        $gte: start,
        $lte: end,
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
      return res.status(400).json({ message: 'userId and data are required.' });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId.' });
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
    if (!destinatary || amount === undefined) {
      return res.status(400).json({ message: 'destinatary and amount are required in QR data.' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

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

// Delete an expense
router.delete('/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;

    // Validate expenseId
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ message: 'Invalid expenseId.' });
    }

    // Find the expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    // Delete the expense
    await Expense.deleteOne({ _id: expenseId });

    res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete expense.', error: error.message });
  }
});

module.exports = router;
