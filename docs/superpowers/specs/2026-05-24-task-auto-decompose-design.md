# Task Auto-Decompose — Design Spec

## Concept & Vision

An "Auto-Decompose" button in the EditTaskModal that uses AI to break a task's description into actionable subtask steps. The user reviews the AI-generated subtasks in a modal before accepting them — no surprise additions, full control.

## Flow

1. User opens a task in EditTaskModal
2. Writes or pastes a description (e.g., "Launch iOS app with push notifications and analytics")
3. Clicks the "Auto-Decompose" button (wand/sparkles icon) near the subtask section
4. Loading state while AI processes (1-3 seconds)
5. Preview modal shows editable subtasks
6. User edits/deletes/accepts → subtasks merge into the task's subtask list
7. Main Save button persists as normal

## UI Placement

**EditTaskModal.tsx** — Add an "Auto-Decompose" button next to the subtask section header, using the `Sparkles` icon from lucide-react.

Button state:
- **Disabled** (grayed out, tooltip: "Add a description first") when description has fewer than 3 words
- **Enabled** otherwise

## API Route

**`POST /api/tasks/decompose`** — New route that accepts a description and returns decomposed subtasks.

Request:
```json
{ "description": "Launch iOS app with push notifications and analytics integration" }
```

Response:
```json
{
  "success": true,
  "data": {
    "subtasks": [
      { "title": "Set up Xcode project with iOS deployment target", "completed": false, "description": "" },
      { "title": "Implement push notification service with APNs", "completed": false, "description": "" },
      { "title": "Integrate analytics SDK (e.g., Firebase or Mixpanel)", "completed": false, "description": "" },
      { "title": "Build and test notification permissions flow", "completed": false, "description": "" }
    ]
  }
}
```

**Error response:**
- Empty description → `{ success: false, error: "Description is required." }`, status 400
- AI failure → `{ success: false, error: "Failed to decompose. Please try again." }`, status 500
- Empty AI response → `{ success: false, error: "Could not decompose. Try a more detailed description." }`, status 422

## AI Prompt

Send to MiniMax API (same provider as existing `/api/ai/summary` route):

```
You are a task decomposition assistant. Given a task description, break it down into 3-8 clear, actionable sub-steps that a developer or knowledge worker can complete independently.

Task description: "{description}"

Rules:
- Each sub-step should be a single, concrete action (verb + object)
- Use imperative mood (e.g., "Set up Xcode project" not "Setting up Xcode project")
- Order logically — prerequisite steps first
- Each step should take 15-60 minutes to complete
- Return ONLY a valid JSON array with no markdown, no code blocks, no explanation

Output format:
[{"title": "Step 1 text", "completed": false}, {"title": "Step 2 text", "completed": false}]

Respond ONLY with the JSON array. No preamble or explanation.
```

## Preview Modal

A centered modal (AnimatePresence + Framer Motion, matching existing modal styling in the project):

- **Header:** "Auto-Decompose — Review Steps" with a Sparkles icon
- **Body:** List of subtask rows, each with:
  - Text input (editable — user can tweak the AI output)
  - Delete (×) button to remove that step
  - Drag handle (optional, future)
- **Footer:**
  - "Cancel" button (secondary, left)
  - "Accept All" button (primary, right) — merges into task subtask list
- **Loading state:** While waiting for AI, show spinner in button and disable modal interactions

## State Management

**EditTaskModal local state:**
- `decomposingSubtasks: SubTask[] | null` — null = modal closed, [] = modal open and empty
- When "Accept All" clicked: merge into existing `subtasks` array (append, don't replace)
- When "Cancel" or modal closes: discard `decomposingSubtasks`

**No new global state** — this is entirely modal-local until accepted.

## Implementation Files

- **New:** `src/app/api/tasks/decompose/route.ts` — API route
- **Modify:** `src/components/EditTaskModal.tsx` — add button and preview modal
- **No new dependencies** — reuses existing MiniMax API key, existing modal patterns, existing `SubTask` type

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty description | Button disabled, tooltip explains |
| AI returns fewer than 2 steps | Toast "Could not decompose. Try a more detailed description." |
| AI call fails | Toast error with message, no modal opens |
| User clicks Cancel | Modal closes, no changes to task |
| User clicks Accept All | Subtasks merged, modal closes |
| Task already has subtasks | New subtasks appended (not replaced) |
| Network timeout (30s) | Same as AI failure — toast error |

## Out of Scope

- Drag-to-reorder in preview modal
- Multi-phase grouping (Planning/Development/Testing)
- Client-side parsing fallback
- Saving decomposed subtasks to a "template library" for reuse