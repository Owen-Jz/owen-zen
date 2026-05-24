# Task Auto-Decompose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Auto-Decompose" button to EditTaskModal that uses MiniMax AI to break a task description into actionable subtask steps, shown in a review modal before merging.

**Architecture:** New API route `POST /api/tasks/decompose` calls MiniMax; EditTaskModal gains a local preview modal state and an "Auto-Decompose" button.

**Tech Stack:** Next.js 16, MiniMax API (existing key), Framer Motion, React local state.

---

## File Map

- Create: `src/app/api/tasks/decompose/route.ts`
- Modify: `src/components/EditTaskModal.tsx` — add button + preview modal + `decomposingSubtasks` state

---

## Tasks

### Task 1: API Route

**Files:**
- Create: `src/app/api/tasks/decompose/route.ts`

- [ ] **Step 1: Write the decompose API route**

```typescript
import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description || description.trim().split(/\s+/).length < 3) {
      return NextResponse.json(
        { success: false, error: "Description must have at least 3 words to decompose." },
        { status: 400 }
      );
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key not configured." }, { status: 500 });
    }

    const prompt = `You are a task decomposition assistant. Given a task description, break it down into 3-8 clear, actionable sub-steps that a developer or knowledge worker can complete independently.

Task description: "${description}"

Rules:
- Each sub-step should be a single, concrete action (verb + object)
- Use imperative mood (e.g., "Set up Xcode project" not "Setting up Xcode project")
- Order logically — prerequisite steps first
- Each step should take 15-60 minutes to complete
- Return ONLY a valid JSON array with no markdown, no code blocks, no explanation

Output format:
[{"title": "Step 1 text", "completed": false}, {"title": "Step 2 text", "completed": false}]

Respond ONLY with the JSON array. No preamble or explanation.`;

    const response = await fetchWithTimeout("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return NextResponse.json(
        { success: false, error: "Failed to decompose. Please try again." },
        { status: 500 }
      );
    }

    const rawContent = data.choices[0].message.content.trim();

    // Strip markdown code fences if present
    const jsonStr = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let subtasks;
    try {
      subtasks = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not decompose. Try a more detailed description." },
        { status: 422 }
      );
    }

    if (!Array.isArray(subtasks) || subtasks.length < 2) {
      return NextResponse.json(
        { success: false, error: "Could not decompose. Try a more detailed description." },
        { status: 422 }
      );
    }

    // Normalize: ensure each has title and completed
    const normalized = subtasks.map((s: any) => ({
      title: String(s.title || "").trim(),
      completed: false,
      description: String(s.description || "").trim(),
    })).filter((s: any) => s.title.length > 0);

    if (normalized.length < 2) {
      return NextResponse.json(
        { success: false, error: "Could not decompose. Try a more detailed description." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: { subtasks: normalized } });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 504 });
    }
    console.error("[Decompose] Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to decompose." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tasks/decompose/route.ts
git commit -m "feat: add tasks/decompose API route for AI subtask generation"
```

---

### Task 2: EditTaskModal — Button & Preview Modal

**Files:**
- Modify: `src/components/EditTaskModal.tsx`

The change adds to EditTaskModal:
1. A `Sparkles` icon import (already in lucide-react)
2. A `useState` for `decomposingSubtasks: SubTask[] | null` (null = modal not shown)
3. A `decomposeMutation` using React Query `useMutation` against `POST /api/tasks/decompose`
4. An "Auto-Decompose" button in the subtask section header, disabled when description < 3 words
5. A preview modal (AnimatePresence + Framer Motion) showing editable subtask rows with Accept/Cancel
6. On "Accept All": merge `decomposingSubtasks` into `subtasks`, close modal

**Key logic:**
```tsx
const [decomposingSubtasks, setDecomposingSubtasks] = useState<SubTask[] | null>(null);

const decomposeMutation = useMutation({
  mutationFn: async (description: string) => {
    const res = await fetch("/api/tasks/decompose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data.subtasks as SubTask[];
  },
  onSuccess: (subtasks) => {
    setDecomposingSubtasks(subtasks);
  },
  onError: (error: any) => {
    // TODO: wire to existing toast/notification system
    alert(error.message);
  },
});
```

**Button JSX (in subtask section header):**
```tsx
<button
  onClick={() => decomposeMutation.mutate(description)}
  disabled={decomposeMutation.isPending || description.trim().split(/\s+/).length < 3}
  className={clsx(
    "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all",
    description.trim().split(/\s+/).length < 3
      ? "text-gray-500 cursor-not-allowed"
      : "bg-primary/20 text-primary hover:bg-primary/30"
  )}
  title={description.trim().split(/\s+/).length < 3 ? "Add at least 3 words to description first" : "Auto-decompose description into steps"}
>
  <Sparkles size={14} className={decomposeMutation.isPending ? "animate-spin" : ""} />
  {decomposeMutation.isPending ? "Decomposing..." : "Auto-Decompose"}
</button>
```

**Preview modal** — follows the same pattern as existing modals in the file (StartModal, StopModal). Full code will be provided to the implementer who will follow the project's existing modal styling.

- [ ] **Step 1: Add imports — Sparkles icon and SubTask type**
- [ ] **Step 2: Add `decomposingSubtasks` state and `decomposeMutation`**
- [ ] **Step 3: Add "Auto-Decompose" button next to subtask count**
- [ ] **Step 4: Add preview modal with editable subtask rows, Accept/Cancel, loading state**
- [ ] **Step 5: Handle "Accept All" — merge into subtasks, close modal**
- [ ] **Step 6: Handle "Cancel" — discard and close modal**
- [ ] **Step 7: Commit**

```bash
git add src/components/EditTaskModal.tsx
git commit -m "feat: add auto-decompose button and preview modal to EditTaskModal"
```

---

### Self-Review Checklist

1. **Spec coverage:** Every section in the spec has a corresponding task? ✅/❌
2. **Placeholder scan:** No TBD, TODO, vague steps? ✅/❌
3. **Type consistency:** `SubTask` interface used correctly? `SubTask[] | null` for decomposing state? ✅/❌
4. **Spec gaps found:** (fill in if any)

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-24-task-auto-decompose.md`.**