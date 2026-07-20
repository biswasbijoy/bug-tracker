# SQA Ticket Tracker

A personal ticket / bug tracking dashboard purpose-built for SQA Engineers to manage projects, epics, sprints, tickets, and releases in one place. It combines ideas from Jira, Linear, GitHub Projects, and Notion into a clean, fast, keyboard-friendly workspace — see [UIPlan.md](UIPlan.md) for the full design specification.

## Features

- **Auth** — email/password sign up & login (JWT-based sessions)
- **Dashboard** — live stats (total/pending/blocked/completed tickets, production/deploy status), recently updated tickets
- **Projects** — create/manage projects with client, description, and color
- **Epics & Sprints** — group and schedule work within a project
- **Tickets** — full CRUD with type, priority, severity, environment, labels, checklist, comments, attachments, and Jira linking; searchable/filterable list with a responsive table (desktop) / card (mobile) view
- **Kanban Board** — drag-and-drop tickets across To Do → In Progress → QA → Retest → Ready → Production → Closed
- **Calendar** — month/week/day/agenda views for deadlines, reminders, and deployments
- **Reports** — charts and exportable tables
- **Notes & Labels** — lightweight supporting modules
- **Notifications** — in-app notification center
- **Command palette** — `Ctrl+K` global search and quick navigation
- **Dark / light theme** — persisted per user

## Tech Stack

**Client** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, Axios, `@hello-pangea/dnd`, Recharts, `react-hot-toast`, `date-fns`

**Server** — Node.js, Express, TypeScript, MongoDB with Mongoose, JWT auth, Multer (file uploads), `express-validator`, `node-cron`

## Project Structure

```
bug-tracker/
├── client/               # Next.js frontend
│   ├── app/              # Routes (dashboard, projects, tickets, kanban, ...)
│   ├── components/       # layout/ (Header, Sidebar, ...) and ui/ (design-system primitives)
│   ├── hooks/            # Custom hooks (keyboard shortcuts, etc.)
│   ├── lib/               # theme provider, utils
│   ├── services/         # Axios API client
│   ├── store/            # Zustand stores (auth, notifications)
│   └── types/            # Shared TypeScript types
├── server/               # Express backend
│   ├── config/           # Environment/config loader
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, validation, etc.
│   ├── models/           # Mongoose schemas
│   └── routes/           # API route definitions
├── UIPlan.md              # UI/UX design specification
└── package.json           # Convenience scripts to run client + server together
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or a connection string to a remote instance)

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/biswasbijoy/bug-tracker.git
cd bug-tracker

# install both client and server dependencies
npm run install:all
```

Or install each individually:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure the server environment

Copy the example env file and adjust values as needed:

```bash
cd server
cp .env.example .env
```

`server/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ticket-tracker
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
UPLOAD_DIR=../uploads
```

### 3. Configure the client environment (optional)

By default the client talks to `http://localhost:5000/api`. To point it elsewhere, create `client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

Make sure a MongoDB instance is running and reachable at the URI configured in `server/.env`.

### 5. Run the app

From the repo root, run both apps together:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

- Client: [http://localhost:3000](http://localhost:3000)
- Server API: [http://localhost:5000/api](http://localhost:5000/api) (health check at `/api/health`)

Open [http://localhost:3000](http://localhost:3000), sign up for an account, and you're in.

## Available Scripts

**Root**

| Command | Description |
|---|---|
| `npm run install:all` | Install dependencies for both `server` and `client` |
| `npm run dev` | Run server and client together (requires `concurrently`) |
| `npm run build` | Build both server and client for production |

**client/**

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production build |
| `npm run lint` | Run ESLint |

**server/**

| Command | Description |
|---|---|
| `npm run dev` | Start the API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the compiled server |

## API Overview

All routes are mounted under `http://localhost:5000/api`:

- `POST /auth/register`, `POST /auth/login`
- `GET/POST/PUT/DELETE /projects`
- `GET/POST/PUT/DELETE /epics`
- `GET/POST/PUT/DELETE /sprints`
- `GET/POST/PUT/DELETE /tickets` (plus `/tickets/:id/comments`, `/tickets/:id/checklist`, `/tickets/:id/favorite`)
- `GET /dashboard`
- `GET/POST/PUT/DELETE /notes`
- `GET/POST/PUT/DELETE /labels`
- `POST /upload`
- `GET /health`

Requests to protected routes require an `Authorization: Bearer <token>` header, set automatically by the client after login.
