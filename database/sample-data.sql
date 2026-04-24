-- =====================================================
-- Sample Data for Testing
-- Nicotine Cessation Clinic Dashboard Usability Feedback
-- =====================================================

-- Insert sample feedback responses
INSERT INTO Dashboard_Usability_Feedback
  (UserRole, Q1_Requirements, Q2_EaseOfUse, AdditionalFeedback)
VALUES
  -- Excellent ratings
  ('Attending Physician', 7, 7, 'Excellent dashboard! Very intuitive and meets all my needs.'),
  ('Fellow', 6, 7, 'Great tool for tracking patient progress.'),
  ('Clinic Manager', 7, 6, 'Makes my job so much easier. Love the reporting features.'),

  -- Good ratings
  ('Nurse Practitioner', 6, 5, 'Good overall, but could use better mobile support.'),
  ('Physician Assistant', 5, 6, 'Does what I need it to do.'),
  ('Registered Nurse', 5, 5, 'Helpful for daily tasks.'),

  -- OK ratings
  ('Medical Assistant', 4, 5, 'Works fine but takes time to learn.'),
  ('Other Clinical Staff', 5, 4, 'Adequate for basic needs.'),

  -- Lower ratings
  ('Attending Physician', 3, 4, 'Some features are confusing. Need better training materials.'),
  ('Fellow', 4, 3, 'Interface could be more modern.'),

  -- Mixed feedback without additional comments
  ('Clinic Manager', 6, 6, NULL),
  ('Nurse Practitioner', 5, 5, NULL),
  ('Physician Assistant', 7, 6, NULL),
  ('Registered Nurse', 4, 4, NULL),
  ('Medical Assistant', 6, 5, NULL);

-- Verify insertions
SELECT
  COUNT(*) as total_inserted,
  MIN(FeedbackID) as first_id,
  MAX(FeedbackID) as last_id
FROM Dashboard_Usability_Feedback;

-- View results with calculated scores
SELECT
  FeedbackID,
  UserRole,
  Q1_Requirements,
  Q2_EaseOfUse,
  FinalScore_100,
  AdjectiveRating,
  SUBSTRING(AdditionalFeedback, 1, 50) as feedback_preview
FROM vw_Dashboard_Usability_Scores
ORDER BY FinalScore_100 DESC;

-- Show statistics
SELECT
  COUNT(*) as total_responses,
  ROUND(AVG(FinalScore_100), 2) as average_score,
  MIN(FinalScore_100) as min_score,
  MAX(FinalScore_100) as max_score,
  MODE() WITHIN GROUP (ORDER BY AdjectiveRating) as most_common_rating
FROM vw_Dashboard_Usability_Scores;
