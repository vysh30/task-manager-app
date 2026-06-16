# TaskFlow

TaskFlow is a team task management REST API built with Node.js and Express.  
It supports authentication, project management, task assignment, dashboard statistics, and role-based access control for Admins and Members.
A production-ready team task management API built with Node.js and Express.

TaskFlow helps teams manage projects, assign tasks, track progress, and monitor productivity through secure authentication, role-based access control, and dashboard analytics.


Live :
https://task-manager-app-production-bed4.up.railway.app/




---

## 🌐 Live Demo
<img width="2647" height="1700" alt="image" src="https://github.com/user-attachments/assets/ce1caa48-a39b-457f-94ea-b0b688983bff" />

<img width="2781" height="1634" alt="image" src="https://github.com/user-attachments/assets/7c3965ef-c9d0-4d7c-ae4a-024d9635b20f" />

<img width="2778" height="1631" alt="image" src="https://github.com/user-attachments/assets/b58ffa20-e5f9-46ba-968e-dd6be7489085" />

<img width="2784" height="1618" alt="image" src="https://github.com/user-attachments/assets/0fead6b9-0db8-4b7e-9fdf-8609cc4556d9" />





**API Base URL**

https://task-manager-app-production-bed4.up.railway.app/

---

## 📌 Overview

TaskFlow is designed for teams that need a lightweight but scalable task management system.

The platform provides:

* Secure JWT authentication
* Project and team management
* Task assignment workflows
* Dashboard analytics
* Role-based permissions
* Overdue task tracking

---

## ✨ Features

### 🔐 Authentication & Authorization

* User Registration
* User Login
* JWT Authentication
* Protected Routes
* Role-Based Access Control (RBAC)

### 📁 Project Management

* Create Projects
* View Projects
* Assign Team Members
* Manage Project Ownership

### ✅ Task Management

* Create Tasks
* Assign Tasks
* Update Task Status
* Track Task Progress
* Overdue Task Monitoring

### 📊 Dashboard Analytics

* Task Summary Metrics
* Completed Tasks
* Pending Tasks
* Overdue Tasks
* Team Productivity Insights

### 🛡️ Security

* Helmet Security Headers
* CORS Protection
* Rate Limiting
* Request Validation
* Environment Variable Protection

---

## 🏗️ Architecture

```text
Client
   │
   ▼
Express API
   │
   ├── Authentication Layer
   ├── Authorization Layer
   ├── Project Module
   ├── Task Module
   └── Dashboard Module
   │
   ▼
SQLite Database
```

---

## 🛠️ Tech Stack

| Category       | Technologies                |
| -------------- | --------------------------- |
| Backend        | Node.js, Express.js         |
| Database       | SQLite                      |
| Authentication | JWT                         |
| Security       | Helmet, CORS, Rate Limiting |
| Deployment     | Railway                     |
| API Testing    | Postman                     |

---

## 📂 Project Structure

```text
taskflow/
│
├── routes/
├── controllers/
├── middleware/
├── models/
├── database/
├── config/
├── utils/
├── .env.example
├── package.json
└── server.js
```

---

## ⚙️ Local Setup

### Clone Repository

```bash
git clone https://github.com/vysh30/taskflow.git
cd taskflow
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Add:

```env
PORT=3000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Setup Database

```bash
npm run setup
```

### Start Development Server

```bash
npm run dev
```

Server:

```text
http://localhost:3000
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/auth/signup |
| POST   | /api/auth/login  |

### Projects

| Method | Endpoint      |
| ------ | ------------- |
| GET    | /api/projects |
| POST   | /api/projects |

### Tasks

| Method | Endpoint       |
| ------ | -------------- |
| GET    | /api/tasks     |
| POST   | /api/tasks     |
| PATCH  | /api/tasks/:id |

### Dashboard

| Method | Endpoint                     |
| ------ | ---------------------------- |
| GET    | /api/tasks/dashboard/summary |

---

## 👥 Role Access

### Admin

* Manage Projects
* Manage Tasks
* Add Team Members
* Remove Team Members
* Update User Roles

### Member

* View Assigned Projects
* Create Tasks
* Update Task Status
* Track Progress

---

## 🚀 Deployment

TaskFlow is deployed on Railway and available for testing.

Deployment Platform:

* Railway

---

## 🔮 Future Improvements

* Email Notifications
* Project Activity Logs
* File Attachments
* Team Chat
* Kanban Board UI
* PostgreSQL Support
* Dockerized Deployment

---

## 📬 Contact

### Vyshnavi Gandla

B.Tech Electronics Communication & Instrumentation Engineering

📧 Email: [vyshnavigandla92@gmail.com](mailto:vyshnavigandla92@gmail.com)

💼 LinkedIn: https://www.linkedin.com/in/vyshnavipatel3021/

🐙 GitHub: https://github.com/Vysh30

---

## ⭐ Support

If this project helped you or you found it useful, consider giving it a ⭐.

Your support motivates future improvements and helps others discover the project.

**⭐ Star this repository if you found it useful!**


## 👩‍💻 Author

**Vyshnavi Gandla** — B.Tech ECIE, KITS Warangal '26

[![GitHub](https://img.shields.io/badge/GitHub-vysh30-181717?style=flat&logo=github)](https://github.com/vysh30)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/YOUR-LINKEDIN-HANDLE)
