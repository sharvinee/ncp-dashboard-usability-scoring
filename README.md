# Nicotine Cessation Program Dashboard — Usability Scoring

A UMUX-Lite usability survey for the Nicotine Cessation Program Dashboard. Respondents are guided through a multi-step flow — entering their name and role, rating two questions on a 1–7 drag slider, reviewing their responses, and submitting — then immediately see their score on a visual gauge.

## Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│  Multi-step UI  │
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────┐
│  Express API    │ (Port 3001)
│  REST Endpoints │
└────────┬────────┘
         │ pg driver
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  usability_     │
│  scoring        │
└─────────────────┘
```

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 18 (Homebrew)
- npm

## Installation

### 1. Database Setup

```bash
# Start PostgreSQL
brew services start postgresql@18

# Create user and database
psql postgres
```

```sql
CREATE USER myuser WITH PASSWORD 'your_password';
CREATE DATABASE usability_scoring;
GRANT ALL PRIVILEGES ON DATABASE usability_scoring TO myuser;
\q
```

```bash
# Run schema as superuser
psql -d usability_scoring -f database/schema.sql

# Grant table permissions to myuser
psql -d usability_scoring -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO myuser; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO myuser;"
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usability_scoring
DB_USER=myuser
DB_PASSWORD=your_password
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the App

**Terminal 1 — Backend:**
```bash
cd backend && npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm start
```

Opens at `http://localhost:3000`.

## User Flow

1. **Landing** — respondent reads the instruction to explore the dashboard first (shared via email), enters their name (optional) and selects their role (required: CTTS, Physician, Student, Other)
2. **Question 1** — drag slider 1–7: *"This system's capabilities meet my requirements."*
3. **Question 2** — drag slider 1–7: *"This system is easy to use."*
4. **Review** — see both answers with option to edit before submitting
5. **Results** — score (0–100), adjective rating, grade, and visual gauge

## Scoring Methodology

**Formula** (Finstad, 2010):
```
Score = ((Q1 - 1) + (Q2 - 1)) / 12 × 100
```

**Adjective Ratings** (Bangor et al., 2009):

| Score     | Rating           |
|-----------|-----------------|
| ≥ 85.6    | Best Imaginable |
| ≥ 72.6    | Excellent       |
| ≥ 52.0    | Good            |
| ≥ 38.0    | OK              |
| ≥ 24.0    | Poor            |
| < 24.0    | Worst Imaginable|

**Grade** (Sauro & Lewis, 2012):

| Score  | Grade |
|--------|-------|
| ≥ 80.3 | A     |
| ≥ 68.0 | B     |
| ≥ 51.0 | C     |
| ≥ 35.0 | D     |
| < 35.0 | F     |

## Database Schema

### Table: Dashboard_Usability_Feedback

| Column          | Type         | Constraints             |
|-----------------|--------------|-------------------------|
| FeedbackID      | SERIAL       | PRIMARY KEY             |
| SubmittedDate   | TIMESTAMP    | NOT NULL, DEFAULT NOW() |
| UserName        | VARCHAR(100) | NULL (optional)         |
| UserRole        | VARCHAR(100) | NOT NULL                |
| Q1_Requirements | INTEGER      | NOT NULL, CHECK (1–7)   |
| Q2_EaseOfUse    | INTEGER      | NOT NULL, CHECK (1–7)   |

### View: vw_Dashboard_Usability_Scores

All table columns plus `FinalScore_100`, `AdjectiveRating`, and `Grade`.

## API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| POST   | /api/feedback     | Submit a response                  |
| GET    | /api/feedback     | Retrieve all responses with scores |
| GET    | /api/statistics   | Aggregate stats                    |
| GET    | /api/health       | Health check                       |

**POST /api/feedback body:**
```json
{
  "userName": "Jane Doe",
  "userRole": "Physician",
  "q1Requirements": 6,
  "q2EaseOfUse": 7
}
```

## Viewing Submissions

**In psql:**
```bash
psql -U myuser -d usability_scoring
```
```sql
SELECT UserName, UserRole, Q1_Requirements, Q2_EaseOfUse, FinalScore_100, AdjectiveRating, Grade, SubmittedDate
FROM vw_Dashboard_Usability_Scores
ORDER BY SubmittedDate DESC;
```

**Export to CSV:**
```bash
psql -U myuser -d usability_scoring -c "\COPY (SELECT * FROM vw_Dashboard_Usability_Scores ORDER BY SubmittedDate DESC) TO '/path/to/output.csv' CSV HEADER"
```

**Clear all responses:**
```bash
psql -U myuser -d usability_scoring -c "TRUNCATE TABLE Dashboard_Usability_Feedback;"
```

## Troubleshooting

**`role "postgres" does not exist`**
Run the schema without `-U` (uses your OS superuser): `psql -d usability_scoring -f database/schema.sql`

**`permission denied for schema public`**
```bash
psql -d usability_scoring -c "GRANT ALL ON SCHEMA public TO myuser;"
```

**`relation does not exist`**
Re-run schema and grants (see Installation step 1).

**Port in use:**
```bash
lsof -i :3001   # find PID
kill -9 <PID>
```

## References

- Finstad, K. (2010). The Usability Metric for User Experience. *Interacting with Computers*, 22(5), 323–327.
- Bangor, A., Kortum, P., & Miller, J. (2009). Determining What Individual SUS Scores Mean. *Journal of Usability Studies*, 4(3), 114–123.
- Lewis, J. R., Utesch, B. S., & Maher, D. E. (2013). UMUX-LITE: When There's No Time for the SUS. *CHI 2013*.
- Sauro, J., & Lewis, J. R. (2012). *Quantifying the User Experience*. Morgan Kaufmann.
