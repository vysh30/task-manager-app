# TaskFlow

TaskFlow is a team task management REST API built with Node.js and Express.  
It supports authentication, project management, task assignment, dashboard statistics, and role-based access control for Admins and Members.

## Features

- JWT Authentication (Signup/Login)
- Role-based access control
- Project and team management
- Task creation and assignment
- Task status tracking
- Dashboard with overdue task tracking
- Input validation and security middleware

## Tech Stack

- Node.js
- Express.js
- SQLite
- JWT Authentication
- Railway Deployment

## Local Setup

```bash
git clone https://github.com/vysh30/taskflow.git
cd taskflow
npm install
cp .env.example .env
npm run setup
npm run dev

Server runs on:
http://localhost:3000

Environment Variables
PORT=3000
JWT_SECRET=your_secret
NODE_ENV=development
API Routes
Auth
POST /api/auth/signup
POST /api/auth/login
Projects
GET /api/projects
POST /api/projects
Tasks
GET /api/tasks
POST /api/tasks
PATCH /api/tasks/:id
Dashboard
GET /api/tasks/dashboard/summary
Deployment

The application is deployed on Railway and fully functional.


Live API:

https://your-app.railway



Role Access
Admin
Manage all projects and tasks
Add/remove members
Update user roles
Member
Access assigned projects
Create and update tasks
Track task progress
Security
Helmet
CORS
Rate limiting
Request validationy.app

Author

Vyshnavi

GitHub: https://github.com/vysh30


