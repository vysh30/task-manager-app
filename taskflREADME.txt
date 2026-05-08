# TaskFlow — Team Task Manager

A full-stack REST API for team task management with role-based access control, project tracking, and task assignment.

## Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Role-based access** — Admin (full access) and Member (project-scoped access)
- **Projects** — Create, update, delete projects with team membership management
- **Tasks** — Create, assign, and track tasks with status (todo/in-progress/review/done), priority, and due dates
- **Dashboard** — Aggregated stats, overdue detection, per-user and global views
- **Security** — Helmet, CORS, rate limiting (100 req/15min), input validation

## Quick start

```bash
git clone https://github.com/yourusername/taskflow
cd taskflow
npm install
cp .env.example .env        # edit JWT_SECRET
npm run setup               # migrate + seed
npm run dev
```

API runs at `http://localhost:3000`

Demo accounts after seeding:

| Email | Password | Role |
|---|---|---|
| alice@taskflow.io | alice123 | admin |
| bob@taskflow.io | bob123 | member |
| carmen@taskflow.io | carmen123 | member |
| dev@taskflow.io | dev123 | admin |
| emma@taskflow.io | emma123 | member |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | YES | Current user profile |

**Signup / Login body:**
```json
{ "email": "alice@taskflow.io", "password": "alice123" }
```

**Response:**
```json
{ "token": "eyJ...", "user": { "id": 1, "name": "Alice Chen", "role": "admin" } }
```

All subsequent requests require:
```
Authorization: Bearer <token>
```

---

### Projects

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/projects` | YES | Any | List accessible projects |
| POST | `/api/projects` | YES | Admin | Create project |
| GET | `/api/projects/:id` | YES | Member+ | Project details + tasks + members |
| PATCH | `/api/projects/:id` | YES | Owner/Admin | Update project |
| DELETE | `/api/projects/:id` |YES | Owner/Admin | Delete project |
| POST | `/api/projects/:id/members` |YES | Owner/Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | YES | Owner/Admin | Remove member |

**Create project:**
```json
{
  "name": "Website Redesign",
  "description": "Revamp company site",
  "member_ids": [2, 3, 5]
}
```

---

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | ✅ | List tasks (supports filters) |
| POST | `/api/tasks` | ✅ | Create task |
| GET | `/api/tasks/:id` | ✅ | Task details |
| PATCH | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |
| GET | `/api/tasks/dashboard/summary` | ✅ | Stats for dashboard |

**Query filters (GET /api/tasks):**
```
?project_id=1
?status=in-progress
?priority=high
?assignee_id=2
?overdue=true
```

**Create task:**
```json
{
  "project_id": 1,
  "title": "Design homepage wireframes",
  "assignee_id": 2,
  "priority": "high",
  "status": "todo",
  "due_date": "2025-06-01"
}
```

---

### Users

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/users` | YES | Any | List users (admins see all) |
| GET | `/api/users/:id` | YES | Any | User profile + stats |
| PATCH | `/api/users/me` | YES | Any | Update own profile |
| PATCH | `/api/users/:id/role` | YES| Admin | Change user role |

---

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add https://github.com/vysh30/taskflow

```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo
3. Set environment variables in Railway dashboard:

| Variable | Value |
|---|---|
| `JWT_SECRET` | (generate a random 64-char string) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | `https://your-frontend.com` |

4. Railway auto-detects Node.js and runs `npm run setup && npm start`
5. Your API is live at `https://your-app.railway.app`

### 3. Test the live API

```bash
# Login
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@taskflow.io","password":"alice123"}'

# List projects
curl https://your-app.railway.app/api/projects \
  -H "Authorization: Bearer <token>"

# Get overdue tasks
curl "https://your-app.railway.app/api/tasks?overdue=true" \
  -H "Authorization: Bearer <token>"
```

---

## Tech stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: SQLite (better-sqlite3) — swap to PostgreSQL for production scale
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Deployment**: Railway

## Database schema

```
users           — id, name, email, password, role, timestamps
projects        — id, name, description, owner_id (→users), timestamps
project_members — project_id, user_id (composite PK)
tasks           — id, project_id (→projects), title, description,
                  assignee_id (→users), status, priority, due_date,
                  created_by (→users), timestamps
```

## Role permissions summary

| Action | Member | Admin |
|---|---|---|
| View own projects | YES | YES (all) |
| Create project | NO| YES |
| Edit/delete project | NO | YES (or owner) |
| Create task in project | YES| YES |
| Edit own tasks | YES | YES |
| Edit any task | NO | YES|
| Manage members | NO | YES (or owner) |
| View all users | NO | YES |
| Change roles | NO | YES |
