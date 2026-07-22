# Redesign the Projects Page (Card View)

You are a Senior UI/UX Designer and Senior Frontend Engineer.

I already have a fully functional Projects page in my application.

Do NOT change any business logic, API, routing, or database models.

Only redesign the UI while keeping all existing functionality intact.

## Current Problem

The current project cards use a centered folder icon and centered text, giving the page a file-explorer appearance. While the components themselves are visually appealing, the alignment makes the page feel unbalanced and inefficient for a project management application.

This application is used daily by Software Quality Assurance Engineers, so readability and information density are more important than decorative presentation.

## Objective

Redesign the Projects page using a professional **horizontal card layout** similar to Linear, Jira, GitHub Projects, or Azure DevOps.

The page should prioritize fast scanning, readability, and efficient use of space.

---

## Layout

Each project should be displayed as a full-width card.

Example structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📁  Test Project                                            ● Active   ⋮   │
│     Created by Bijoy Biswas                                              │
│     Personal project for SQA ticket management                           │
│                                                                          │
│     [2 Epics]  [15 Tickets]  [3 Open]  [5 Completed]                     │
│                                                         Updated 2 hours ago│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Card Requirements

### Left Section

Display:

- Folder icon
- Project title
- Owner
- Short description
- Statistics badges

The folder icon must be left-aligned.

Do not center any content.

---

### Center Section

Display project information.

Example:

Project Name

Owner

Description

Badges

Everything aligned vertically.

---

### Right Section

Display

- Last Updated
- Three-dot action menu

Actions:

- Open
- Edit
- Archive
- Delete

---

## Card Design

Use

- Rounded corners
- Soft border
- Light shadow
- Smooth hover effect
- Entire card clickable
- Pointer cursor

Hover effect should slightly lift the card and brighten the border without excessive animation.

---

## Statistics

Replace plain text such as:

```
2 epics • 15 tickets
```

with compact badges:

- 2 Epics
- 15 Tickets
- 3 Open
- Active

Badges should wrap gracefully on smaller screens.

---

## Top Toolbar

Keep the existing toolbar but improve alignment.

```
Search _______________________

Status ▼

Sort ▼

+ New Project
```

The "New Project" button should remain right-aligned.

---

## Responsive Design

### Desktop

Full-width cards with a three-column layout inside each card (left, center, right).

### Tablet

Maintain horizontal cards with reduced spacing.

### Mobile

Stack content vertically while keeping the folder icon aligned to the left.

Statistics should wrap naturally.

Action menu should remain accessible.

---

## UX Requirements

- The entire card opens the Project Details page.
- The action menu should not trigger navigation.
- Maintain keyboard accessibility.
- Preserve dark/light theme support.
- Reuse existing components where possible.
- Do not modify the existing functionality or API.

## Implementation Rules

- Reuse existing React components.
- Reuse existing Tailwind classes where possible.
- Keep the current project card logic.
- Only improve layout, spacing, alignment, and visual hierarchy.
- Produce clean, maintainable, production-ready code that matches the application's existing design system.