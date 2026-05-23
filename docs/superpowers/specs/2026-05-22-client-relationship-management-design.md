# Client Relationship Management (CRM) Section — Design Spec

## Overview

A new "CRM" sidebar section for managing client relationships independently from the existing Leads CRM (which handles prospecting). This is for tracking clients you already work with — storing contact info, session notes, communication preferences, personal context, and linked projects for quick reference.

---

## Sidebar Structure

**New "CRM" section** containing:
- **Clients** — new client relationship management (this spec)
- **Leads CRM** — existing leads system (move from Tools → CRM)

---

## Data Model

**Collection: `Client`**

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | auto |
| `name` | string | required |
| `email` | string | optional |
| `phone` | string | optional |
| `company` | string | optional |
| `role` | string | optional |
| `avatar` | string | URL or initials fallback |
| `communicationPrefs` | object | see below |
| `personalNotes` | string | freeform |
| `projects` | array of ObjectIds | refs to existing Project collection |
| `sessions` | array of objects | see Sessions tab |
| `tags` | array of strings | e.g. "active", "dormant", "needs-followup" |
| `status` | string | "active" \| "dormant" \| "needs-followup" |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

**communicationPrefs object**:
- `preferredContactMethod` — email | phone | slack | video | other
- `bestTimeToContact` — morning | afternoon | evening | specific hours string
- `timezone` — string
- `communicationStyle` — formal | casual | detail-oriented | big-picture

**Session object**:
- `date` — Date (default: now)
- `summary` — string (what was discussed)
- `followUps` — array of strings (action items)
- `nextSteps` — string (optional note on next steps)

---

## Pages

### `/clients` — Client List View

**Layout**: Card grid, 3 columns on desktop, 1 on mobile.

**Each client card shows**:
- Name + initials avatar
- Company + role
- Last session date ("Last contact: 3 days ago")
- Status badge (active / dormant / needs follow-up)
- Number of linked projects

**Features**:
- Search by name, company, email
- Filter: all | active | dormant | needs follow-up
- Sort: name A-Z | last session | date added
- "Add Client" button at top right

**Empty state**: "No clients yet. Add your first client to start building relationships."

### `/clients/[id]` — Client Profile View

**Header**: Name, company, role, clickable contact icons (email, phone).

**Tabs**:
1. **Overview** — contact details, communication preferences, personal notes, tags
2. **Sessions** — timeline of session notes (see below)
3. **Projects** — linked projects as compact cards (read-only context from Project HQ)
4. **Edit** — full form to edit all fields

#### Sessions Tab

**Add session form** at top:
- Date (default: today)
- Summary (textarea)
- Follow-ups (dynamic list — add/remove items)
- Next steps (optional textarea)

**Session timeline** below — cards ordered newest first:
- Date + summary preview (truncated at 2 lines)
- Follow-up count badge
- Click to expand full session details

#### Projects Tab

**Linked projects** displayed as small cards:
- Project name
- Status badge
- Clicking opens the project in Project HQ

If no projects linked: "No projects linked. Connect a project from the Projects tab."

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/[id]` | Get single client |
| PUT | `/api/clients/[id]` | Update client |
| DELETE | `/api/clients/[id]` | Delete client |
| POST | `/api/clients/[id]/sessions` | Add session note |
| GET | `/api/clients/[id]/projects` | Fetch linked project details |

**Response shape**: `{ success: boolean, data?: any, error?: string }`

---

## Component Inventory

1. **ClientListView** — grid of client cards + search/filter/sort toolbar
2. **ClientCard** — compact card for list view
3. **ClientProfileView** — tabbed profile page
4. **ClientOverviewTab** — contact info, prefs, notes display
5. **ClientSessionsTab** — add form + timeline
6. **ClientProjectsTab** — linked project cards
7. **ClientEditForm** — full edit form
8. **SessionCard** — single session in timeline
9. **AddSessionForm** — form for new session entries

---

## Tech Stack

- Same stack as rest of Owen Zen: Next.js App Router, TypeScript, MongoDB/Mongoose, Tailwind CSS v4, Framer Motion
- New model: `src/models/Client.ts`
- New API routes: `src/app/api/clients/` and `src/app/api/clients/[id]/`
- New components: `src/components/clients/`
- Existing Project model used for linked projects (no duplication)

---

## Out of Scope (v1)

- Turning session follow-ups into tasks automatically
- Email/notification reminders
- File attachments to sessions
- Client-specific dashboard/widget for Command Center
- Billing or invoicing