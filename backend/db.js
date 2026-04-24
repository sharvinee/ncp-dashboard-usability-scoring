/**
 * Database Connection Module
 * PostgreSQL connection pool for the Usability Scoring Application
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'usability_scoring',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

/**
 * Insert feedback into the database
 * @param {Object} feedback - The feedback data
 * @returns {Promise<Object>} - The inserted feedback with ID
 */
async function insertFeedback(feedback) {
  const { userName, userRole, q1Requirements, q2EaseOfUse } = feedback;

  const query = `
    INSERT INTO Dashboard_Usability_Feedback
      (UserName, UserRole, Q1_Requirements, Q2_EaseOfUse)
    VALUES
      ($1, $2, $3, $4)
    RETURNING FeedbackID, SubmittedDate;
  `;

  const values = [userName, userRole, q1Requirements, q2EaseOfUse];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database insertion error:', error);
    throw error;
  }
}

/**
 * Get all feedback with calculated scores
 * @returns {Promise<Array>} - All feedback entries with scores
 */
async function getAllScores() {
  const query = `
    SELECT * FROM vw_Dashboard_Usability_Scores
    ORDER BY SubmittedDate DESC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get aggregate statistics
 * @returns {Promise<Object>} - Statistics about feedback
 */
async function getStatistics() {
  const query = `
    SELECT
      COUNT(*) as total_responses,
      ROUND(AVG(FinalScore_100), 2) as average_score,
      MIN(FinalScore_100) as min_score,
      MAX(FinalScore_100) as max_score,
      MODE() WITHIN GROUP (ORDER BY AdjectiveRating) as most_common_rating
    FROM vw_Dashboard_Usability_Scores;
  `;

  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Database statistics error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  insertFeedback,
  getAllScores,
  getStatistics,
};
