# Weekly Report Management System

## Stack

- Next.js
- React
- TypeScript
- FastAPI
- Python
- PostgreSQL
- SQLAlchemy
- Alembic
- Tailwind CSS
- Groq (AI assistant)

## Architecture

Next.js → FastAPI → PostgreSQL

## Setup Instructions

### 1. Installing dependencies

**Frontend:**

```
cd frontend
npm install
```

**Backend:**

```
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Running the database

Requires a local PostgreSQL server. Create the database and role (run in
`psql` as a superuser):

```sql
CREATE ROLE weekly_app WITH LOGIN PASSWORD 'password_here';
CREATE DATABASE weekly_reports OWNER weekly_app;
```

Set up the backend environment file:

```
cd backend
Copy-Item .env.example .env   # fill in DATABASE_URL, SECRET_KEY, etc.
```

Apply migrations to build the schema:

```
alembic upgrade head
```

Optionally, populate it with demo data:

```
python -m scripts.seed
```

### 3. Running the backend

```
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

The API is available at <http://localhost:8000> (docs at `/docs`).

### 4. Running the frontend

```
cd frontend
npm run dev
```

The app is available at <http://localhost:3000>. It expects
`NEXT_PUBLIC_API_URL` in `frontend/.env.local` to point at the backend
(defaults to `http://localhost:8000`).

## AI Assistant

The dashboard includes an AI chat assistant backed by [Groq](https://groq.com/)
(not Anthropic). To enable it, set the following in `backend/.env`:

```
GROQ_API_KEY=your_key_here
ASSISTANT_ENABLED=true
```

Without a `GROQ_API_KEY`, the assistant stays disabled and the rest of the app
is unaffected.