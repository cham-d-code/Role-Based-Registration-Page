# Backend - Temp Staff Coordination System API (PostgreSQL)

## Quick Setup

### 1. Install PostgreSQL
Download from: https://www.postgresql.org/download/windows/

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Create Database

**Using pgAdmin or psql:**
```sql
CREATE DATABASE temp_staff_db;
```

**Then run the schema:**
```bash
# Using psql
psql -U postgres -d temp_staff_db -f database/schema.sql
psql -U postgres -d temp_staff_db -f database/seed.sql
```

**Or in pgAdmin:**
1. Open pgAdmin → Connect to server
2. Right-click Databases → Create → Database → Name: `temp_staff_db`
3. Right-click on `temp_staff_db` → Query Tool
4. Open `database/schema.sql` → Execute (F5)
5. Open `database/seed.sql` → Execute (F5)

### 4. Configure Environment
```bash
copy .env.example .env
```
Edit `.env` with your PostgreSQL password.

### 5. Start Server
```bash
npm run dev
```

## Test Credentials

All seeded users have password: `Password123`

| Role | Email | 
|------|-------|
| HOD | hod@kln.ac.lk |
| Coordinator | coordinator@kln.ac.lk |
| Mentor | mentor1@kln.ac.lk |
| Staff | staff1@kln.ac.lk |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| GET | /api/health | Health check |
