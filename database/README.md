# Database Documentation

## Schema Overview

This database stores usability feedback for the Nicotine Cessation Clinic Dashboard using the UMUX-Lite methodology.

## Installation

### PostgreSQL Setup

1. Create database:
```sql
CREATE DATABASE usability_scoring;
```

2. Run schema script:
```bash
psql -U postgres -d usability_scoring -f schema.sql
```

## Tables

### Dashboard_Usability_Feedback

Stores raw feedback responses from medical staff.

**Columns:**
- `FeedbackID`: Auto-incrementing primary key
- `SubmittedDate`: Automatically set to current timestamp
- `UserRole`: User's job title (e.g., "Attending Physician")
- `Q1_Requirements`: Rating 1-7 for "capabilities meet requirements"
- `Q2_EaseOfUse`: Rating 1-7 for "easy to use"
- `AdditionalFeedback`: Optional free-text comments

**Constraints:**
- `Q1_Requirements` and `Q2_EaseOfUse` must be between 1 and 7
- CHECK constraints enforce valid ranges
- UserRole cannot be NULL or empty

**Indexes:**
- `idx_submitted_date`: For date-based queries
- `idx_user_role`: For role-based analytics

## Views

### vw_Dashboard_Usability_Scores

Calculated view that adds UMUX-Lite scores to raw data.

**Additional Columns:**
- `FinalScore_100`: Calculated score (0-100)
- `AdjectiveRating`: Text rating based on score

**Formula:**
```sql
((Q1_Requirements - 1) + (Q2_EaseOfUse - 1)) / 12.0 * 100
```

**Adjective Rating Thresholds:**
- ≥ 85.6: "Best Imaginable"
- ≥ 72.6: "Excellent"
- ≥ 52.0: "Good"
- ≥ 38.0: "OK"
- ≥ 24.0: "Poor"
- < 24.0: "Worst Imaginable"

## Common Queries

### Get All Feedback with Scores
```sql
SELECT * FROM vw_Dashboard_Usability_Scores
ORDER BY SubmittedDate DESC;
```

### Average Score by Role
```sql
SELECT
  UserRole,
  COUNT(*) as responses,
  ROUND(AVG(FinalScore_100), 2) as avg_score,
  ROUND(AVG(Q1_Requirements), 2) as avg_q1,
  ROUND(AVG(Q2_EaseOfUse), 2) as avg_q2
FROM vw_Dashboard_Usability_Scores
GROUP BY UserRole
ORDER BY avg_score DESC;
```

### Distribution by Adjective Rating
```sql
SELECT
  AdjectiveRating,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vw_Dashboard_Usability_Scores
GROUP BY AdjectiveRating
ORDER BY
  CASE AdjectiveRating
    WHEN 'Best Imaginable' THEN 1
    WHEN 'Excellent' THEN 2
    WHEN 'Good' THEN 3
    WHEN 'OK' THEN 4
    WHEN 'Poor' THEN 5
    WHEN 'Worst Imaginable' THEN 6
  END;
```

### Recent Feedback (Last 7 Days)
```sql
SELECT
  FeedbackID,
  SubmittedDate,
  UserRole,
  FinalScore_100,
  AdjectiveRating
FROM vw_Dashboard_Usability_Scores
WHERE SubmittedDate >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY SubmittedDate DESC;
```

### Overall Statistics
```sql
SELECT
  COUNT(*) as total_responses,
  ROUND(AVG(FinalScore_100), 2) as avg_score,
  ROUND(STDDEV(FinalScore_100), 2) as std_dev,
  MIN(FinalScore_100) as min_score,
  MAX(FinalScore_100) as max_score,
  MODE() WITHIN GROUP (ORDER BY AdjectiveRating) as most_common_rating,
  COUNT(DISTINCT UserRole) as unique_roles
FROM vw_Dashboard_Usability_Scores;
```

### Trend Analysis (Monthly)
```sql
SELECT
  DATE_TRUNC('month', SubmittedDate) as month,
  COUNT(*) as responses,
  ROUND(AVG(FinalScore_100), 2) as avg_score,
  MODE() WITHIN GROUP (ORDER BY AdjectiveRating) as most_common_rating
FROM vw_Dashboard_Usability_Scores
GROUP BY DATE_TRUNC('month', SubmittedDate)
ORDER BY month DESC;
```

## Maintenance

### Backup Database
```bash
pg_dump -U postgres usability_scoring > backup_$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
psql -U postgres -d usability_scoring < backup_20240315.sql
```

### Clean Test Data
```sql
-- WARNING: This deletes all data!
TRUNCATE TABLE Dashboard_Usability_Feedback RESTART IDENTITY CASCADE;
```

### View Table Size
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('Dashboard_Usability_Feedback')) as total_size,
  pg_size_pretty(pg_relation_size('Dashboard_Usability_Feedback')) as table_size,
  pg_size_pretty(pg_indexes_size('Dashboard_Usability_Feedback')) as indexes_size;
```

## Performance Optimization

### Analyze Table Statistics
```sql
ANALYZE Dashboard_Usability_Feedback;
```

### Check Index Usage
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'Dashboard_Usability_Feedback';
```

## Security

### Create Read-Only User
```sql
-- Create user
CREATE USER usability_readonly WITH PASSWORD 'secure_password';

-- Grant connect
GRANT CONNECT ON DATABASE usability_scoring TO usability_readonly;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO usability_readonly;

-- Grant SELECT on view only
GRANT SELECT ON vw_Dashboard_Usability_Scores TO usability_readonly;
```

### Create Application User
```sql
-- Create user for backend application
CREATE USER usability_app WITH PASSWORD 'secure_app_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE usability_scoring TO usability_app;
GRANT USAGE ON SCHEMA public TO usability_app;
GRANT SELECT, INSERT ON Dashboard_Usability_Feedback TO usability_app;
GRANT SELECT ON vw_Dashboard_Usability_Scores TO usability_app;
GRANT USAGE, SELECT ON SEQUENCE dashboard_usability_feedback_feedbackid_seq TO usability_app;
```

## Troubleshooting

### Check View Definition
```sql
\d+ vw_Dashboard_Usability_Scores
```

### Verify Constraints
```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'Dashboard_Usability_Feedback'::regclass;
```

### Test Score Calculation
```sql
-- Insert test data
INSERT INTO Dashboard_Usability_Feedback
  (UserRole, Q1_Requirements, Q2_EaseOfUse, AdditionalFeedback)
VALUES
  ('Test User', 7, 7, 'Max score test');

-- Verify calculation (should be 100.00)
SELECT FinalScore_100, AdjectiveRating
FROM vw_Dashboard_Usability_Scores
WHERE UserRole = 'Test User'
ORDER BY FeedbackID DESC LIMIT 1;
```
