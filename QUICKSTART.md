# Quick Start Guide

Get the Usability Scoring Application running in 5 minutes.

## Prerequisites Check

```bash
node --version   # Should be >= 18.0.0
psql --version   # Should be >= 13.0
```

## Setup Steps

### 1. Database Setup (2 minutes)

```bash
# Create database
psql -U postgres -c "CREATE DATABASE usability_scoring;"

# Run schema
psql -U postgres -d usability_scoring -f database/schema.sql

# (Optional) Load sample data
psql -U postgres -d usability_scoring -f database/sample-data.sql
```

### 2. Backend Setup (1 minute)

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and update DB_PASSWORD
# Then start the server
npm start
```

You should see:
```
✓ Database connection established
✓ Usability Scoring API Server running on port 3001
```

### 3. Frontend Setup (1 minute)

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the app
npm start
```

Browser opens automatically at `http://localhost:3000`

## Test the Application

1. Select a role (e.g., "Attending Physician")
2. Rate Question 1: Click any number 1-7
3. Rate Question 2: Click any number 1-7
4. (Optional) Add feedback
5. Click "Submit Feedback"

You should see: "Thank you for your feedback!"

## Verify Data

```bash
# Check the database
psql -U postgres -d usability_scoring

# Run query
SELECT * FROM vw_Dashboard_Usability_Scores;
```

## API Endpoints

Test with curl:

```bash
# Health check
curl http://localhost:3001/api/health

# Get all feedback
curl http://localhost:3001/api/feedback

# Submit feedback
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "Test User",
    "q1Requirements": 7,
    "q2EaseOfUse": 6,
    "additionalFeedback": "Test submission"
  }'

# Get statistics
curl http://localhost:3001/api/statistics
```

## Common Issues

**Port 3001 already in use?**
```bash
lsof -i :3001
kill -9 <PID>
```

**Database connection failed?**
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify password in `backend/.env`

**Frontend won't start?**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [database/README.md](database/README.md) for query examples
- Customize roles in `frontend/src/components/UsabilityForm.jsx`
- Adjust styling in `frontend/src/App.css`

## Production Deployment

For production use:

1. Set `NODE_ENV=production` in backend `.env`
2. Build frontend: `cd frontend && npm run build`
3. Serve build folder with nginx or similar
4. Use environment variables for sensitive config
5. Enable HTTPS
6. Set up database backups
7. Configure firewall rules

---

**Need help?** Check the troubleshooting section in README.md
