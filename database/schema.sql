-- =====================================================
-- Nicotine Cessation Clinic Dashboard Usability Scoring
-- Database Schema
-- =====================================================

-- Drop existing objects if they exist (for clean reinstall)
DROP VIEW IF EXISTS vw_Dashboard_Usability_Scores;
DROP TABLE IF EXISTS Dashboard_Usability_Feedback;

-- =====================================================
-- TABLE: Dashboard_Usability_Feedback
-- Stores raw usability feedback responses
-- =====================================================

CREATE TABLE Dashboard_Usability_Feedback (
    FeedbackID SERIAL PRIMARY KEY,
    SubmittedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UserName VARCHAR(100),
    UserRole VARCHAR(100) NOT NULL,
    Q1_Requirements INTEGER NOT NULL CHECK (Q1_Requirements BETWEEN 1 AND 7),
    Q2_EaseOfUse INTEGER NOT NULL CHECK (Q2_EaseOfUse BETWEEN 1 AND 7)
);

CREATE INDEX idx_submitted_date ON Dashboard_Usability_Feedback(SubmittedDate);
CREATE INDEX idx_user_role ON Dashboard_Usability_Feedback(UserRole);

-- =====================================================
-- VIEW: vw_Dashboard_Usability_Scores
-- Calculates UMUX-Lite scores and adjective ratings
-- =====================================================

CREATE OR REPLACE VIEW vw_Dashboard_Usability_Scores AS
SELECT
    FeedbackID,
    SubmittedDate,
    UserName,
    UserRole,
    Q1_Requirements,
    Q2_EaseOfUse,

    -- UMUX-Lite Score Calculation
    -- Formula: ((([Q1] - 1) + ([Q2] - 1)) / 12.0) * 100
    ROUND(
        ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100,
        2
    ) AS FinalScore_100,

    -- Adjective Rating based on score thresholds
    CASE
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 85.6
            THEN 'Best Imaginable'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 72.6
            THEN 'Excellent'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 52.0
            THEN 'Good'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 38.0
            THEN 'OK'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 24.0
            THEN 'Poor'
        ELSE 'Worst Imaginable'
    END AS AdjectiveRating,

    -- Grade based on Sauro & Lewis (2012) SUS grading scale
    CASE
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 80.3
            THEN 'A'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 68.0
            THEN 'B'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 51.0
            THEN 'C'
        WHEN ((CAST(Q1_Requirements - 1 AS DECIMAL) + CAST(Q2_EaseOfUse - 1 AS DECIMAL)) / 12.0) * 100 >= 35.0
            THEN 'D'
        ELSE 'F'
    END AS Grade

FROM Dashboard_Usability_Feedback;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE Dashboard_Usability_Feedback IS 'Stores raw usability feedback from clinical dashboard users using UMUX-Lite methodology';
COMMENT ON COLUMN Dashboard_Usability_Feedback.FeedbackID IS 'Unique identifier for each feedback submission';
COMMENT ON COLUMN Dashboard_Usability_Feedback.SubmittedDate IS 'Timestamp of submission (auto-populated)';
COMMENT ON COLUMN Dashboard_Usability_Feedback.UserName IS 'Full name of the respondent';
COMMENT ON COLUMN Dashboard_Usability_Feedback.UserRole IS 'Role of the respondent (CTTS, Physician, Student, Other)';
COMMENT ON COLUMN Dashboard_Usability_Feedback.Q1_Requirements IS 'Rating 1-7: The dashboard capabilities meet my requirements';
COMMENT ON COLUMN Dashboard_Usability_Feedback.Q2_EaseOfUse IS 'Rating 1-7: This dashboard is easy to use';

COMMENT ON VIEW vw_Dashboard_Usability_Scores IS 'Calculated UMUX-Lite scores (0-100) and adjective ratings for all feedback entries';
