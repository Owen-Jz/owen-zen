# Prompt Library Design

> **Date:** 2026-03-18

## Overview

A Prompt Library feature for the Owen Zen platform that allows storing and organizing reusable prompts. Each prompt has a title, the prompt text itself, and a category for organization.

## Data Model

### Prompt Schema

```typescript
interface Prompt {
  _id: string;
  title: string;        // Required, max 100 chars
  prompt: string;        // Required, the actual prompt text
  category: string;      // Required: "Writing" | "Coding" | "Brainstorming" | "Personal" | "Other"
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prompts` | List all prompts (supports ?category= filter) |
| POST | `/api/prompts` | Create new prompt |
| PUT | `/api/prompts/[id]` | Update prompt |
| DELETE | `/api/prompts/[id]` | Delete prompt |

## UI Components

### PromptLibraryView

- **Header:** Title "Prompt Library" + "Add Prompt" button
- **Filters:** Category dropdown + search bar
- **Card Grid:** Responsive grid of prompt cards
- **Card Display:** Title, category tag, prompt preview (truncated)
- **Interactions:** Click to expand, edit button, delete button

### AddPromptModal

- Title input field (required)
- Category dropdown (required)
- Prompt textarea (required, large)
- Save/Cancel buttons

### EditPromptModal

- Same as AddPromptModal but pre-filled with existing data

## Categories

Predefined categories:
- Writing
- Coding
- Brainstorming
- Personal
- Other

## Sidebar Integration

Add to Tools section:
```typescript
{ id: "prompts", label: "Prompt Library", icon: MessageSquare }
```

## Technical Details

- **Database:** MongoDB (Prompt model)
- **Authentication:** Existing session-based auth
- **Styling:** Tailwind CSS matching existing theme
- **Animations:** Framer Motion for modals
- **Loading:** Lazy-loaded component

## Acceptance Criteria

1. User can view a list of all saved prompts
2. User can filter prompts by category
3. User can search prompts by title or content
4. User can add a new prompt with title, category, and prompt text
5. User can edit existing prompts
6. User can delete prompts
7. Prompt Library appears in Tools section of sidebar
8. UI matches existing platform aesthetic
