// server.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS middleware
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses'); // Import expense routes

dotenv.config(); // Load environment variables

connectDB(); // Connect to MongoDB

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Enable CORS for all origins
app.use(cors());

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/expenses', expenseRoutes); // Expense routes

app.get('/', (req, res) => {
    res.status(200).json({ message: 'spending-tracker backend API is working correctly and you can see it here!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
