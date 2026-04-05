# Canvas Node AI Agent — Design Specification

## Overview

An AI-powered exploration panel inside the Canvas NodeModal. The user can double-click any node, open its NodeModal, and have a threaded Socratic + Structured conversation with MiniMax about that node. The AI can ask questions, answer questions, suggest improvements, create sub-nodes, search the web automatically, and write results back into the node after preview confirmation.

---

## Architecture

### Layout
- NodeModal widens from `max-w-lg` to `max-w-2xl` (672px)
- Two-column layout: left = existing editor (title, description, color, sub-nodes), right = AIChatPanel
- Left column: ~50% width, scrollable. Right column: ~50%, fixed-height chat area

### Component Structure
```
NodeModal
├── LeftColumn
│   ├── Title textarea
│   ├── Description textarea
│   ├── Color picker
│   └── SubNodes list + adder
└── RightColumn
    └── AIChatPanel (new)
        ├── Header ("AI Agent" + model indicator)
        ├── MessageList (scrollable)
        ├── SuggestionBar (apply previews)
        └── InputBar (textarea + send)
```

### AI Agent System Prompt
The agent is Socratic + Structured:
- It asks probing questions to challenge assumptions
- It organizes information clearly into categories/bullets
- It can create sub-nodes from a node's content when asked
- It uses web search automatically when the query would benefit from current information

### Structured Response Protocol
MiniMax returns responses as JSON blocks for structured actions:

```json
{ "type": "apply_description", "content": "..." }
{ "type": "apply_title", "content": "..." }
{ "type": "apply_subnode", "content": "..." }
{ "type": "ask_user", "question": "..." }
{ "type": "text", "content": "..." }
```

Plain text responses (`type: "text"`) render as normal AI chat bubbles. Structured actions render a dismissable suggestion pill in the SuggestionBar.

---

## AIChatPanel Component

### Props
```typescript
interface AIChatPanelProps {
  nodeId: string;
  nodeData: {
    content: string;      // node title
    description?: string;
    color: string;
    subNodes?: { id: string; content: string; color: string }[];
  };
  onUpdate: (id: string, data: Partial<CanvasNodeData>) => void;
  onAddSubNode: (parentId: string, color: string, content?: string) => void;
}
```

### State
- `messages: { role: 'user' | 'assistant', content: string }[]`
- `isStreaming: boolean`
- `suggestions: { type: string; content: string }[]` — pending apply previews

### Behavior
1. On mount, inject a system context message describing the node's content
2. On user submit → append user message → stream assistant response
3. Parse MiniMax response for structured action blocks
4. If `apply_*` action → add to SuggestionBar (not auto-applied)
5. If `ask_user` → display question as assistant message naturally
6. Auto-scroll to bottom on new messages

### Web Search
- MiniMax tool calling with a `web_search` tool
- The tool is passed to MiniMax automatically — no UI toggle needed
- MiniMax decides when to call it; results appear inline in the response

### Streaming
- Server-Sent Events (SSE) from a new API route `/api/canvas/ai`
- Assistant message streams word-by-word into the panel
- Streaming indicator (animated dots) while generating

---

## API Design

### `POST /api/canvas/ai`
New route for AI chat + streaming.

**Request:**
```json
{
  "nodeId": "uuid",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "nodeData": {
    "content": "node title",
    "description": "...",
    "subNodes": [...]
  }
}
```

**Response:** Server-Sent Events stream
```
event: message
data: {"type":"text","content":"word "}

event: message
data: {"type":"apply_description","content":"..."}

event: done
data: {}
```

**Implementation:**
- Use MiniMax chat completion v2 with streaming
- Include node content as system context
- Enable tool calling for web search
- Parse SSE chunks for structured response types

---

## SuggestionBar

Appears above the input bar when there are pending apply suggestions.

**UI:** Horizontal row of pills/badges, each showing the action type + truncated content:
- "Update description →" (click to apply)
- "Add sub-node →" (click to apply)
- "Update title →" (click to apply)

**On click apply:**
- Call `onUpdate` or `onAddSubNode` immediately
- Remove pill from SuggestionBar
- Dismissed pills are gone forever (no undo needed)

---

## NodeModal Changes

### Width
```tsx
// Before
className="rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"

// After
className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
```

### Layout
Two-column flexbox with a vertical divider:

```tsx
<div className="flex">
  {/* Left: existing editor, ~50% */}
  <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
    { /* title, description, color, sub-nodes */ }
  </div>

  {/* Divider */}
  <div className="w-px" style={{ background: 'var(--border)' }} />

  {/* Right: AIChatPanel, ~50% */}
  <div className="flex-1 min-h-0">
    <AIChatPanel ... />
  </div>
</div>
```

### onUpdate propagation
NodeModal already has `onUpdate`. AIChatPanel calls it directly for apply actions. No change needed to the callback signature — `Partial<CanvasNodeData>` already covers `content`, `description`, and `subNodes`.

---

## File Structure

```
src/
├── components/canvas/
│   ├── NodeModal.tsx           # Modified: wider, two-column, imports AIChatPanel
│   ├── AIChatPanel.tsx         # New: full chat UI
│   ├── SuggestionBar.tsx       # New: apply preview pills
│   └── CanvasNode.tsx          # Unchanged
├── app/api/canvas/
│   ├── route.ts                # Unchanged
│   └── ai/
│       └── route.ts            # New: streaming AI endpoint
```

---

## Implementation Order

1. **API route** — `/api/canvas/ai` with streaming MiniMax call, tool calling for web search, structured response parsing
2. **AIChatPanel component** — message list, streaming, input bar
3. **SuggestionBar component** — apply preview pills
4. **NodeModal integration** — wider layout, two columns, wire AIChatPanel into onUpdate/onAddSubNode
5. **System prompt tuning** — Socratic + Structured personality

---

## Scope Boundaries

**In scope:**
- Streaming AI chat inside NodeModal
- Structured response protocol (apply_description, apply_title, apply_subnode, ask_user, text)
- Auto web search via MiniMax tool calling
- Preview-before-apply confirmation
- Node content as context

**Out of scope for now:**
- Saving chat history per node (resets on modal close)
- Multiple AI personalities/modes
- Image attachments in chat
- Multiple canvas nodes being edited simultaneously
- Undo/redo on applied suggestions
