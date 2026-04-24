/**
 * Express Server for Usability Scoring Application
 * Handles API endpoints for feedback submission and retrieval
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { insertFeedback, getAllScores, getStatistics } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// Middleware
// =====================================================

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// =====================================================
// Validation Middleware
// =====================================================

/**
 * Validates feedback submission data
 */
function validateFeedback(req, res, next) {
  const { userName, userRole, q1Requirements, q2EaseOfUse } = req.body;

  const errors = [];

  if (userName && userName.length > 100) {
    errors.push('userName must be 100 characters or less');
  }

  if (!userRole || typeof userRole !== 'string' || userRole.trim().length === 0) {
    errors.push('userRole is required');
  } else if (userRole.length > 100) {
    errors.push('userRole must be 100 characters or less');
  }

  // Validate Q1_Requirements
  if (q1Requirements === undefined || q1Requirements === null) {
    errors.push('Q1_Requirements is required');
  } else if (!Number.isInteger(q1Requirements) || q1Requirements < 1 || q1Requirements > 7) {
    errors.push('Q1_Requirements must be an integer between 1 and 7');
  }

  // Validate Q2_EaseOfUse
  if (q2EaseOfUse === undefined || q2EaseOfUse === null) {
    errors.push('Q2_EaseOfUse is required');
  } else if (!Number.isInteger(q2EaseOfUse) || q2EaseOfUse < 1 || q2EaseOfUse > 7) {
    errors.push('Q2_EaseOfUse must be an integer between 1 and 7');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
}

// =====================================================
// API Routes
// =====================================================

/**
 * POST /api/feedback
 * Submit new usability feedback
 */
app.post('/api/feedback', validateFeedback, async (req, res) => {
  try {
    const { userName, userRole, q1Requirements, q2EaseOfUse } = req.body;

    const result = await insertFeedback({
      userName: userName?.trim() || null,
      userRole: userRole.trim(),
      q1Requirements,
      q2EaseOfUse,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: result.feedbackid,
        submittedDate: result.submitteddate,
      },
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);

    // Handle database constraint violations
    if (error.code === '23514') { // CHECK constraint violation
      return res.status(400).json({
        success: false,
        errors: ['Invalid values: scores must be between 1 and 7'],
      });
    }

    res.status(500).json({
      success: false,
      errors: ['An error occurred while submitting feedback. Please try again.'],
    });
  }
});

/**
 * GET /api/feedback
 * Retrieve all feedback with calculated scores
 */
app.get('/api/feedback', async (req, res) => {
  try {
    const scores = await getAllScores();

    res.status(200).json({
      success: true,
      count: scores.length,
      data: scores,
    });
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    res.status(500).json({
      success: false,
      errors: ['An error occurred while retrieving feedback'],
    });
  }
});

/**
 * GET /api/statistics
 * Retrieve aggregate statistics
 */
app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await getStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error retrieving statistics:', error);
    res.status(500).json({
      success: false,
      errors: ['An error occurred while retrieving statistics'],
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// Error Handling
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    errors: ['Endpoint not found'],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    errors: ['An unexpected error occurred'],
  });
});

// =====================================================
// Start Server
// =====================================================

app.listen(PORT, () => {
  console.log(`\n✓ Usability Scoring API Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
