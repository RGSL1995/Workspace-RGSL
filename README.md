# RGSL Task Management + AI Employee Productivity System

A unified task management and AI-powered employee productivity platform for RGSL Group (RGSL & LRSD companies) built with React, TypeScript, Express, MongoDB, and Claude AI.

## 🎯 Project Overview

**Purpose:** Internal company tool for Finance, Trading, Lending, and Compliance departments to:
- Manage cross-departmental tasks in real-time
- Classify and prioritize emails using AI
- Get personalized AI insights and recommendations
- Monitor team workload and deadlines
- Connect multiple Gmail/company email accounts

## 🏗️ Architecture

```
RGSL Group (Parent Organization)
├── RGSL Company (rgslgroup.com)
│   ├── Employees
│   ├── Email Accounts (personal + shared)
│   └── Tasks (Finance, Trading, Lending, Compliance)
└── LRSD Company (lrsdindia.com)
    ├── Employees
    ├── Email Accounts (personal + shared)
    └── Tasks (Finance, Trading, Lending, Compliance)
```

## 📦 Tech Stack

### Frontend
- **React 19** + TypeScript
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons
- **Socket.io Client** - Real-time updates

### Backend
- **Node.js** + Express.js
- **TypeScript**
- **MongoDB** + Mongoose
- **Passport.js** - Google OAuth 2.0
- **LangChain.js** + Claude API - AI
- **Gmail API** - Email sync
- **Socket.io** - Real-time notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Workspace (for OAuth)
- Anthropic API key
- GitHub account

### 1. Clone & Install

```bash
git clone https://github.com/RGSL1995/Workspace-RGSL.git
cd Workspace-RGSL

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-management
PORT=5000
FRONTEND_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_random_secret

ANTHROPIC_API_KEY=sk-ant-your_api_key
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` and sign in with your Google Workspace account.

## 📋 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Database, Passport setup
│   │   ├── models/        # MongoDB schemas (Employee, Task, Email, EmailConnection)
│   │   ├── routes/        # API endpoints (auth, employees, tasks, emails, AI)
│   │   ├── services/      # Claude AI, Gmail integration
│   │   ├── controllers/   # Auth logic
│   │   └── server.ts      # Express app setup
│   ├── .env.example       # Environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx          # Public landing page
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   └── Dashboard/
│   │   │       ├── Briefing.tsx     # Daily AI briefing
│   │   │       ├── Inbox.tsx        # Email management
│   │   │       └── AIAssistant.tsx  # Chat interface
│   │   ├── context/       # Auth state management
│   │   ├── components/    # Reusable components
│   │   ├── App.tsx        # Routing
│   │   └── main.tsx       # Entry point
│   ├── tailwind.config.js # Tailwind setup
│   └── package.json
│
└── README.md
```

## 🔐 Authentication Flow

1. Employee visits landing page
2. Clicks "Sign In" → Google OAuth prompt
3. Authenticates with company email (@rgslgroup.com or @lrsdindia.com)
4. System verifies employee exists in MongoDB
5. Session created → Redirects to dashboard
6. Employee can connect Gmail account for email monitoring

## 📧 Email Management

- **Personal emails**: One per employee (e.g., user@rgslgroup.com)
- **Shared mailboxes**: Multiple employees access same inbox (e.g., finance@rgslgroup.com)
- **AI Classification**: 
  - Important
  - Action Required
  - Informational
  - Low Priority
- **Confidence Score**: 0-1 accuracy rating for each classification

## 🤖 AI Features

### For Employees
- **Daily Briefing**: AI-generated summary of tasks, emails, and priorities
- **Email Classification**: Automatic categorization of incoming emails
- **Ask AI**: Free-form questions about workload, deadlines, emails
- **Suggested Tasks**: AI can suggest tasks from important emails

### For Managers
- **Team Insights**: Workload analysis, blocked tasks, deadline risks
- **Delegation Opportunities**: AI suggests task redistribution
- **Team Analytics**: Performance metrics and capacity planning

## 📱 Dashboard Tabs

1. **Briefing** - Daily AI-generated summary
2. **Inbox** - AI-classified emails with filters
3. **AI Assistant** - Chat with Claude for custom questions
4. **My Tasks** - Task management (in development)

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Employees
- `GET /api/employees` - List all
- `POST /api/employees` - Create
- `PUT /api/employees/:id` - Update

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id/status` - Update status
- `PUT /api/tasks/:id/escalate` - Escalate task

### Email Connections
- `GET /api/email-connections` - List connections
- `POST /api/email-connections/personal` - Connect personal email
- `POST /api/email-connections/shared` - Create shared mailbox (admin)

### AI
- `GET /api/ai/briefing` - Get daily briefing
- `GET /api/ai/team-insights` - Get team insights (managers)
- `POST /api/ai/ask` - Ask AI a question
- `GET /api/ai/unread-emails` - Get unread emails
- `GET /api/ai/important-emails` - Get classified important emails

## 🎯 Hierarchy & Permissions

### Super Admin (1 per organization)
- Visibility: All tasks, all employees, all departments
- Permissions: Global create/assign/escalate/delete
- AI Tools: Global dashboard, org-wide analytics

### Department Head (1 per department)
- Visibility: Department tasks and employees only
- Permissions: Assign within department, escalate up
- AI Tools: Team workload, blocked tasks, deadline risks

### Department Person (Multiple per department)
- Visibility: Own tasks, assigned tasks, department public tasks
- Permissions: Create tasks, assign within department
- AI Tools: Personal briefing, email insights, deadline reminders

## 📅 Development Roadmap

### Phase 1 ✅ (Complete)
- Models & core APIs
- Google OAuth authentication
- Email connection management
- Claude AI email classification
- Dashboard with briefing, inbox, AI chat

### Phase 2 (In Progress)
- Socket.io real-time updates
- Gmail API email sync scheduler
- Task escalation workflow

### Phase 3 (Planned)
- Email-to-task automation
- Meeting extraction
- Daily/weekly reports
- SMS/Email notifications
- IPO listing alerts

## 🛠️ Environment Setup

### Google Workspace Setup
1. Go to Google Workspace Admin Console
2. Enable Gmail API
3. Create OAuth credentials tied to your domain
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

### MongoDB Setup
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Add to `.env` as `MONGODB_URI`

### Anthropic Setup
1. Get API key from https://console.anthropic.com
2. Add to `.env` as `ANTHROPIC_API_KEY`

## 🤝 Contributing

This is an internal RGSL tool. For changes:
1. Create a feature branch
2. Make your changes
3. Test locally
4. Create a pull request
5. Get approval from team lead

## 📝 Notes

- `.env` file is NOT committed (security)
- Use `.env.example` as template
- API keys should never be pushed to GitHub
- All employee emails must exist in MongoDB before OAuth

## 🆘 Support

For issues or questions:
- Internal: Contact IT/Dev team
- GitHub Issues: Use GitHub issue tracker

## 📄 License

Internal - RGSL Group Only

---

**Built with ❤️ for RGSL Group by Development Team**
