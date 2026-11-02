# SQA Ticket Tracker

A focused ticket tracker for QA and dev work: projects, epics, sprints and tickets on one pipeline (**To do → In progress → QA → Release → Done**), with a fast, keyboard-friendly UI in light and dark themes.

**All data lives in your own local MongoDB** (`mongodb://localhost:27017/ticket-tracker` by default). Nothing is sent to any shared or hosted database. See [docs/REDESIGN_PLAN.md](docs/REDESIGN_PLAN.md) for the product plan and [docs/UI_CONVENTIONS.md](docs/UI_CONVENTIONS.md) for how the client is organised.

## Features

- **Home** — what needs attention (overdue, due today, blocked, QA failed), pipeline overview, your queue, recent activity, project progress
- **Tickets** — one grouped list (by stage, status, priority, assignee, project, epic) with search, filters, sorting and inline status/priority changes; filters live in the URL so views are shareable
- **Board** — drag-and-drop kanban by pipeline stage or by exact status
- **Ticket page** (`/tickets/:id`) — inline-editable properties, description, sub-tasks, checklist, QA sign-off (test / regression / smoke), attachments, comments, full activity history
- **Projects** — project workspace with Overview, Tickets, Board, Epics, Sprints and Activity tabs
- **Epics & Sprints** — progress, due dates, start/complete sprint
- **Calendar** — due dates, deployments and production releases (month grid or agenda)
- **Reports** — created vs closed, status/priority/type mix, ageing, per-project split, QA sign-off, cycle time — all computed from your tickets
- **Notes**, **Labels** (Settings), **Needs-attention bell** (derived live from tickets)
- **Command palette** — `Ctrl K` / `/` to jump to any ticket, project or page; `C` creates a ticket; `G` then `D/T/B/P/C/R` navigates
- **Light / dark / system theme**, responsive down to phone width

## Tech Stack

**Client** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, Axios, `@hello-pangea/dnd`, Recharts, `react-hot-toast`, `date-fns`, `@heroicons/react`

**Server** — Node.js, Express, TypeScript, MongoDB with Mongoose, JWT auth, Multer (attachments)

## Project Structure

```
bug-tracker/
├── client/
│   ├── app/
│   │   ├── auth/             # sign in / create account
│   │   └── (app)/            # authenticated pages (dashboard, tickets, board, projects, epics, sprints, calendar, reports, notes, settings)
│   ├── components/
│   │   ├── ui/               # design-system primitives (Button, Form, Dialog, Popover/Menu, Tabs, …)
│   │   ├── layout/           # app shell: Sidebar, MobileNav, NotificationsMenu, UserMenu
│   │   ├── tickets/          # ticket badges, filters, list, board, form dialog, ticket detail
│   │   └── planning/ dashboard/ calendar/ reports/ notes/ settings/
│   ├── lib/tickets.ts        # single source of truth: statuses, stages, priorities, types, colours
│   ├── store/                # workspaceStore (all data + mutations), uiStore, authStore
│   └── services/api.ts       # Axios client
├── server/                   # Express API (config, controllers, middleware, models, routes)
├── docs/                     # redesign plan + UI conventions
├── start.ps1                 # Windows launcher (MongoDB + API + client)
└── package.json
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

All routes are mounted under `http://localhost:5000/api` and (except auth) require `Authorization: Bearer <token>`, set automatically by the client after login. Every record is scoped to the signed-in user.

- `POST /auth/register`, `POST /auth/login`, `GET|PUT /auth/me`, `PUT /auth/password`
- `GET|POST|PUT|DELETE /projects` — deleting a project also deletes its tickets, epics and sprints
- `GET|POST|PUT|DELETE /epics`, `/sprints` — deleting one only detaches its tickets
- `GET|POST|PUT|DELETE /tickets` — filters: `projectId, epicId, sprintId, parentTicketId, status, priority, type, severity, environment, labels, isFavorite, search, sort`
  - `PATCH /tickets/:id/favorite`
  - `POST /tickets/:id/comments`, `DELETE /tickets/:id/comments/:commentId`
  - `POST /tickets/:id/checklist`, `PATCH|DELETE /tickets/:id/checklist/:itemId`
  - `POST /tickets/:id/attachments` (multipart field `file`), `DELETE /tickets/:id/attachments/:filename`
- `GET|POST|PUT|DELETE /notes`, `/labels`
- `GET /health`

Ticket numbers (`QA-12`) are assigned as *highest existing number + 1*, so deleting tickets never produces duplicates.

## Your data

- Data is stored in the MongoDB database named in `MONGODB_URI` (default `ticket-tracker`) — keep it pointing at `localhost`.
- Uploaded attachments are stored in `uploads/` at the repo root (git-ignored).
- **Back up before big changes:** `mongodump --uri="mongodb://localhost:27017/ticket-tracker" --out=data/backups/$(date +%Y%m%d)` (restore with `mongorestore`). `Settings → Data` also exports everything as JSON.
- Older tickets keep working: the legacy status `to-do` is still accepted and shown as "To do".
