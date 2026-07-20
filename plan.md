# SQA Ticket Tracker
### Project Planning & System Design Document
**Version:** 1.0
**Database:** MongoDB
**Frontend:** Next.js (React + TypeScript)
**Backend:** Node.js + Express/NestJS
**Authentication:** JWT
**Target User:** Personal (Initially), Multi-user (Future)
**Author:** Project Planning Document

---

# 1. Project Overview

## Problem Statement

As an SQA Engineer, I work with multiple Jira tickets every day. Although Jira manages project tasks, I often face several practical problems:

- Forgetting to close Production tickets.
- Losing track of ticket numbers.
- Forgetting ticket status.
- Unable to remember pending deployment tasks.
- Missing follow-up tickets.
- Difficulty tracking blockers.
- Hard to know which tickets require retesting.
- Forgetting which environment a ticket is deployed to.
- Managing tickets from multiple projects becomes confusing.
- Difficult to generate personal work reports.

Jira is excellent for team collaboration, but it is not optimized as a personal productivity tracker.

Therefore, I need a dedicated application that acts as my personal Ticket Management Dashboard.

---

# 2. Goal

Build a centralized ticket tracking application where I can:

- Track every Jira ticket
- Organize tickets by project
- Organize tickets by Epic
- Organize tickets by Sprint
- Track Subtasks
- Maintain production deployment status
- Never forget to close tickets
- Receive reminders
- Generate productivity reports
- Search tickets instantly
- View today's work
- View pending work
- View completed work

---

# 3. Objectives

The application should become my personal work assistant.

Instead of opening Jira every time,

I should open this application first.

It should answer:

- What should I work on today?
- Which tickets are blocked?
- Which Production tickets are still open?
- Which tickets are waiting for retesting?
- Which tickets are pending deployment?
- Which tickets are overdue?
- Which tickets require follow-up?

---

# 4. User Roles

## Phase 1

Single User

Only me.

---

## Phase 2

Multi User

- Admin
- QA
- Developer
- Project Manager

---

# 5. Core Modules

---

## Dashboard

Shows

- Today's Tasks
- Pending Tickets
- Blocked Tickets
- Production Pending
- Ready for Testing
- Ready for Deployment
- Recently Updated Tickets
- Due Today
- Overdue Tickets

Widgets

```
Today's Work

15 Tickets

Completed Today

8

Pending

5

Blocked

2

Production Pending

3

```

---

## Project Module

Create Projects

Example

```
HRMS
Banking Portal
ERP
Ecommerce
CRM

```

Each Project contains

- Name
- Description
- Color
- Icon
- Client
- Status

---

## Epic Module

Each project contains multiple epics.

Example

```
Authentication

User Management

Payroll

Inventory

Payment Gateway

```

---

## Sprint Module

Each project contains multiple sprints.

Example

```
Sprint 10

Sprint 11

Sprint 12

```

---

## Ticket Module

Main module.

Supports

- Story
- Task
- Bug
- Improvement
- Spike
- Technical Task
- Research
- Production Issue

Each ticket contains

---

Basic Information

- Ticket Number
- Jira URL
- Title
- Description

---

Hierarchy

- Project
- Epic
- Sprint
- Parent Ticket

---

Assignment

- Assigned To
- Reporter

---

Status

- To Do
- In Progress
- QA
- Ready for QA
- Retest
- Blocked
- Ready for Deploy
- Production
- Closed
- Cancelled

---

Priority

- Highest
- High
- Medium
- Low
- Lowest

---

Severity

- Critical
- Major
- Minor
- Trivial

---

Environment

- Local
- Dev
- QA
- Staging
- UAT
- Production

---

Deployment

- Deployment Date
- Release Version
- Production Date

---

Testing

- Test Completed
- Regression Completed
- Smoke Completed

---

Tracking

- Created Date
- Updated Date
- Closed Date

---

Reminder

- Reminder Date
- Reminder Time

---

Notes

Unlimited notes.

---

Attachments

Upload

- Screenshot
- Video
- Log File
- PDF

---

Labels

Example

```
Backend

Frontend

API

Regression

Smoke

Hotfix

Urgent

```

---

Tags

Custom tags.

---

Subtasks

Unlimited subtasks.

---

Checklist

Example

```
☐ API Tested

☐ UI Tested

☐ Regression Done

☐ Cross Browser

☐ Production Verified

☐ Jira Updated

☐ QA Comment Added

☐ Closed

```

---

Comments

Internal comments.

---

Activity Timeline

Shows every update.

---

# Ticket Reminder System

One of the most important modules.

Automatic reminders for

- Pending tickets
- Production tickets
- Tickets not updated
- Overdue tickets
- Blocked tickets

Notification

- Browser Notification
- Email (Future)
- Desktop Notification

---

# Ticket Search

Powerful search.

Search by

- Ticket Number
- Title
- Label
- Project
- Epic
- Sprint
- Status
- Priority
- Date
- Environment

---

# Advanced Filters

Filter

- Pending
- Production Pending
- Blocked
- Overdue
- Today's Work
- This Week
- This Month
- Regression
- Smoke
- Ready for QA

---

# Reports

Daily Report

Example

```
Completed

8

Pending

3

Blocked

1

Production

2

```

Weekly Report

Monthly Report

Quarterly Report

Yearly Report

---

Charts

- Pie Chart
- Bar Chart
- Line Chart
- Heatmap

---

# Calendar View

Shows

- Due Dates
- Deployment
- Production
- Reminder
- Sprint End

---

# Kanban Board

Columns

```
To Do

↓

In Progress

↓

QA

↓

Retest

↓

Ready for Deploy

↓

Production

↓

Closed

```

Drag and Drop.

---

# Timeline View

Shows

```
Ticket Created

↓

Testing

↓

Regression

↓

Deployment

↓

Production

↓

Closed

```

---

# Favorite Tickets

Star important tickets.

---

# Recently Viewed

Quick access.

---

# Personal Notes

Personal notebook.

---

# Productivity Statistics

Track

Average completion time

Most worked project

Daily productivity

Monthly productivity

Completed tickets

Pending tickets

---

# Backup

Export

JSON

CSV

Excel

Import

JSON

CSV

---

# Authentication

JWT Authentication

Login

Logout

Remember Me

Password Reset

Future

Google Login

GitHub Login

---

# Database Design (MongoDB)

Collections

```
users

projects

epics

sprints

tickets

subtasks

comments

attachments

notifications

labels

tags

activityLogs

notes

settings

reports

```

---

# Ticket Document Example

```json
{
  "_id": "...",
  "ticketNo": "QA-234",
  "title": "Verify Login API",
  "projectId": "...",
  "epicId": "...",
  "sprintId": "...",
  "status": "In Progress",
  "priority": "High",
  "severity": "Major",
  "environment": "QA",
  "jiraUrl": "",
  "deploymentDate": "",
  "productionDate": "",
  "checklist": [],
  "labels": [],
  "subtasks": [],
  "comments": [],
  "attachments": [],
  "activityLogs": [],
  "createdAt": "",
  "updatedAt": ""
}
```

---

# Folder Structure

```
ticket-tracker/

│

├── client/

│ ├── app/

│ ├── components/

│ ├── hooks/

│ ├── services/

│ ├── store/

│ ├── types/

│ ├── utils/

│

├── server/

│ ├── controllers/

│ ├── services/

│ ├── repositories/

│ ├── routes/

│ ├── middleware/

│ ├── models/

│ ├── validators/

│ ├── config/

│ ├── utils/

│

├── docs/

├── uploads/

└── README.md

```

---

# System Architecture

```
                User
                  │
                  ▼
          Next.js Frontend
                  │
          REST API / GraphQL
                  │
        Node.js Backend Server
                  │
        Business Service Layer
                  │
          MongoDB Database
                  │
        Notification Scheduler
                  │
      Browser/Desktop Reminder
```

---

# Future Integrations

- Jira API Synchronization
- GitHub Integration
- Azure DevOps
- Slack Notification
- Microsoft Teams
- Google Calendar
- Outlook Calendar
- Email Notification
- AI Ticket Assistant
- Voice Reminder

---

# AI Features (Future)

- Suggest next task
- Detect forgotten tickets
- Predict overdue tickets
- Generate daily report
- Generate stand-up report
- Generate release notes
- Summarize ticket history
- Auto-prioritize tasks

---

# Non-Functional Requirements

## Performance

- API response < 300ms
- Dashboard loads < 2 seconds

## Security

- JWT
- Password hashing (bcrypt)
- Input validation
- Rate limiting
- XSS protection
- CSRF protection
- Secure file uploads

## Scalability

- Modular architecture
- Repository pattern
- Service layer
- RESTful APIs
- Microservice-ready design

## Reliability

- Automatic backups
- Error logging
- Activity tracking
- Audit logs

---

# Development Roadmap

## Phase 1 (MVP)

- Authentication
- Dashboard
- Projects
- Epics
- Tickets
- Subtasks
- Checklist
- Search
- Filters
- Kanban Board

---

## Phase 2

- Reports
- Calendar
- Notifications
- Attachments
- Activity Logs
- Export/Import

---

## Phase 3

- Jira Integration
- AI Assistant
- Multi-user
- Team Dashboard
- Email Notifications
- Analytics

---

# Success Criteria

The application is considered successful if it enables the user to:

- Never lose track of a ticket.
- Always know which tickets require attention.
- Quickly search any ticket by number or keyword.
- Track the full lifecycle of every ticket from creation to production closure.
- Receive timely reminders for pending and overdue work.
- Maintain complete testing, deployment, and production history.
- Generate personal productivity reports with minimal effort.
- Scale from a personal productivity tool to a collaborative team platform without major architectural changes.

---

# Vision Statement

**Build an intelligent personal SQA workspace that complements Jira rather than replacing it—providing a unified dashboard for managing projects, epics, tickets, testing activities, reminders, deployments, and personal productivity. The long-term vision is to evolve the application into an AI-assisted quality engineering companion that proactively helps prevent missed tickets, forgotten production closures, and overlooked follow-up tasks while improving overall testing efficiency.**