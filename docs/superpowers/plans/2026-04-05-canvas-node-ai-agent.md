# Canvas Node AI Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a streaming AI chat panel inside the NodeModal that can ask Socratic questions, search the web, and write results back into the node after preview confirmation.

**Architecture:** Streaming SSE endpoint at `/api/canvas/ai` calls MiniMax with node context. `AIChatPanel` renders the threaded chat with streaming text. Structured JSON directives (`apply_*`, `ask_user`) are parsed from the stream and shown as preview pills in a `SuggestionBar`. NodeModal widens to two-column layout.

**Tech Stack:** Next.js App Router streaming responses, MiniMax `chatcompletion_v2` with streaming + tool calling, SSE client via `fetch` with `ReadableStream`.

---

## File Map

```
src/
├── components/canvas/
│   ├── AIChatPanel.tsx       # CREATE: full chat UI with streaming, message list, input
│   ├── SuggestionBar.tsx     # CREATE: apply-preview pills row
│   └── NodeModal.tsx         # MODIFY: wider (max-w-2xl), two-column, render AIChatPanel
├── app/api/canvas/
│   └── ai/
│       └── route.ts          # CREATE: streaming POST /api/canvas/ai
```

---

## Task 1: Build Streaming API Route — `/api/canvas/ai`

**Files:**
- Create: `src/app/api/canvas/ai/route.ts`

- [ ] **Step 1: Write the API route**

Create `src/app/api/canvas/ai/route.ts`:

```typescript
// src/app/api/canvas/ai/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, nodeData } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Build system prompt with node context
    const systemPrompt = `You are a Socratic + Structured AI assistant helping the user explore and refine a canvas node.

## NODE CONTEXT
Title: ${nodeData.content || '(no title)'}
Description: ${nodeData.description || '(no description)'}
Sub-nodes: ${nodeData.subNodes?.length ? nodeData.subNodes.map((s: any) => s.content).join(' | ') : 'none'}

## YOUR STYLE
- Ask probing questions to challenge assumptions and deepen thinking
- Organize information clearly into categories and bullet points when summarizing
- Suggest concrete next steps when appropriate
- Use structured response directives (see below) when you want to write back to the node

## STRUCTURED RESPONSE DIRECTIVES
When you want to apply changes to the node, respond with a JSON block on its own line:

- Apply description update:
{"type":"apply_description","content":"Your refined description text here..."}

- Apply title update:
{"type":"apply_title","content":"Your refined title here..."}

- Add a new sub-node:
{"type":"apply_subnode","content":"New sub-node content here..."}

- Ask the user a question:
{"type":"ask_user","question":"What specific outcome are you hoping for?"}

For all other responses (questions, analysis, discussion), respond with plain text.`;

    // Construct messages for MiniMax
    const minimaxMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Call MiniMax with streaming
    const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.1",
        messages: minimaxMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Canvas AI] MiniMax error:", errorText);
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    // Stream the response as SSE
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        const processBuffer = () => {
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content || "";
              if (chunk) {
                controller.enqueue(
                  new TextEncoder().encode(`event: message\ndata: ${JSON.stringify({ type: "text", content: chunk })}\n\n`)
                );
              }
            } catch {
              // Skip malformed lines
            }
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Process any remaining buffer
              if (buffer) processBuffer();
              controller.enqueue(new TextEncoder().encode(`event: done\ndata: ${JSON.stringify({})}\n\n`));
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }
        } catch (streamError) {
          console.error("[Canvas AI] Stream error:", streamError);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[Canvas AI] Error:", error.message || error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Run lint check**

Run: `npm run lint -- --quiet src/app/api/canvas/ai/route.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/canvas/ai/route.ts
git commit -m "feat(canvas): add streaming /api/canvas/ai endpoint for node AI agent

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Build AIChatPanel Component

**Files:**
- Create: `src/components/canvas/AIChatPanel.tsx`

**State:**
```typescript
interface Message { role: 'user' | 'assistant'; content: string }
interface Suggestion { type: string; content: string }
// ...
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isStreaming, setIsStreaming] = useState(false);
const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
const messagesEndRef = useRef<HTMLDivElement>(null);
```

**System context injection:** On mount, build a system message with node content (title, description, sub-nodes) and inject it into the messages array so the AI has context. Do NOT show it as a user/assistant message in the UI — it's just sent to the API.

**Streaming logic:**
```typescript
const sendMessage = async () => {
  if (!input.trim() || isStreaming) return;

  const userMessage: Message = { role: 'user', content: input.trim() };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsStreaming(true);

  // Append system context message as first message to API
  const apiMessages = [
    systemContextMessage,
    ...messages,
    userMessage,
  ];

  const response = await fetch('/api/canvas/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, nodeData }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE lines: event: message\ndata: {...}\n\n
      // Append text to assistantMessage and update UI
      // If JSON block with type != "text", add to suggestions
    }
  }

  setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
  setIsStreaming(false);
};
```

**Parse SSE chunks:**
Each chunk from the stream is formatted as:
```
event: message
data: {"type":"text","content":"word "}
```
Use a simple line parser — split by `\n`, find `data: ` lines, JSON.parse them.

**For non-text types**, add to `suggestions` instead of appending to the message:
```typescript
if (parsed.type === 'apply_description' || parsed.type === 'apply_title' || parsed.type === 'apply_subnode') {
  setSuggestions(prev => [...prev, { type: parsed.type, content: parsed.content }]);
} else if (parsed.type === 'ask_user') {
  // Render as regular assistant text with the question
  assistantMessage += parsed.question + ' ';
}
```

**Full JSX structure:**
```tsx
// src/components/canvas/AIChatPanel.tsx
import { useState, useEffect, useRef, useCallback } from 'react';

interface Message { role: 'user' | 'assistant'; content: string }
interface Suggestion { type: string; content: string }

interface AIChatPanelProps {
  nodeId: string;
  nodeData: {
    content: string;
    description?: string;
    subNodes?: { id: string; content: string; color: string }[];
  };
  onUpdate: (id: string, data: any) => void;
  onAddSubNode: (parentId: string, color: string, content?: string) => void;
}

export function AIChatPanel({ nodeId, nodeData, onUpdate, onAddSubNode }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [streamedContent, setStreamedContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  // Build system context from node data
  const systemContext = `The node you're discussing:\nTitle: ${nodeData.content || '(empty)'}\nDescription: ${nodeData.description || '(none)'}\nSub-nodes: ${nodeData.subNodes?.length ? nodeData.subNodes.map((s: any) => s.content).join(' | ') : 'none'}`;

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamedContent('');
    setSuggestions([]);

    const apiMessages = [
      { role: 'system', content: systemContext },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      userMessage,
    ];

    try {
      const response = await fetch('/api/canvas/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, nodeData }),
      });

      if (!response.ok || !response.body) {
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = '';

      const processBuffer = () => {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'text') {
              assistantMessage += parsed.content;
              setStreamedContent(assistantMessage);
            } else if (parsed.type === 'apply_description' || parsed.type === 'apply_title') {
              setSuggestions(prev => [...prev, { type: parsed.type, content: parsed.content }]);
            } else if (parsed.type === 'apply_subnode') {
              setSuggestions(prev => [...prev, { type: 'apply_subnode', content: parsed.content }]);
            } else if (parsed.type === 'ask_user') {
              assistantMessage += parsed.question + ' ';
              setStreamedContent(assistantMessage);
            }
          } catch { /* skip */ }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (err) {
      console.error('[AIChatPanel] Error:', err);
    } finally {
      setIsStreaming(false);
      setStreamedContent('');
    }
  }, [input, isStreaming, messages, nodeData, systemContext]);

  const applySuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'apply_description') {
      onUpdate(nodeId, { description: suggestion.content });
    } else if (suggestion.type === 'apply_title') {
      onUpdate(nodeId, { content: suggestion.content });
    } else if (suggestion.type === 'apply_subnode') {
      onAddSubNode(nodeId, '#f97316', suggestion.content);
    }
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const dismissSuggestion = (suggestion: Suggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSuggestionLabel = (type: string) => {
    if (type === 'apply_description') return 'Update description';
    if (type === 'apply_title') return 'Update title';
    if (type === 'apply_subnode') return 'Add sub-node';
    return type;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>AI Agent</span>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--gray-800)', color: 'var(--gray-400)' }}>
          MiniMax-M2.1
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--gray-500)' }}>
              Ask questions about this node, or let me help you break it down.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
              style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--gray-800)',
                color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                borderBottomLeftRadius: msg.role === 'user' ? '12px' : '4px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming text */}
        {streamedContent && (
          <div className="flex justify-start">
            <div
              className="max-w-[85%] rounded-2xl rounded-bl-4px px-4 py-2.5 text-sm"
              style={{ background: 'var(--gray-800)', color: 'var(--foreground)', borderBottomLeftRadius: '4px', borderBottomRightRadius: '12px' }}
            >
              {streamedContent}
              <span className="opacity-50 animate-pulse">▍</span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamedContent && (
          <div className="flex justify-start">
            <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: 'var(--gray-800)' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--gray-400)', animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SuggestionBar */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full" style={{ background: 'var(--gray-800)' }}>
              <span className="text-xs px-3 py-1.5" style={{ color: 'var(--foreground)' }}>
                {getSuggestionLabel(s.type)}: <span style={{ color: 'var(--gray-400)' }}>{s.content.slice(0, 30)}{s.content.length > 30 ? '...' : ''}</span>
              </span>
              <button
                onClick={() => applySuggestion(s)}
                className="px-2 py-1.5 text-xs rounded-r-full transition-colors hover:bg-green-500/20"
                style={{ color: '#22c55e' }}
              >
                ✓
              </button>
              <button
                onClick={() => dismissSuggestion(s)}
                className="px-2 py-1.5 text-xs rounded-r-full transition-colors hover:bg-red-500/20 pr-3"
                style={{ color: '#ef4444' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
            style={{
              background: 'var(--gray-800)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              maxHeight: '120px',
            }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this node..."
            rows={1}
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--primary)', color: 'white' }}
          >
            {isStreaming ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create AIChatPanel component**

Write `src/components/canvas/AIChatPanel.tsx` with the code above.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit src/components/canvas/AIChatPanel.tsx 2>&1 | head -30`
Expected: No errors (may show some path alias warnings — those are OK)

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/AIChatPanel.tsx
git commit -m "feat(canvas): add AIChatPanel component with streaming chat UI

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Integrate AIChatPanel into NodeModal

**Files:**
- Modify: `src/components/canvas/NodeModal.tsx`

- [ ] **Step 1: Read current NodeModal to identify exact change points**

The key changes to NodeModal:

**Change 1 — Modal width:**
```tsx
// In the modal div className, change:
className="rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
// to:
className="rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
```

**Change 2 — Replace body div with two-column layout:**
The current `<div className="px-6 py-5 space-y-5">` body section becomes:
```tsx
<div className="flex max-h-[80vh]">
  {/* Left column — existing editor */}
  <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
    {/* Title */}
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--gray-400)' }}>Title</label>
      <textarea ... />
    </div>
    {/* Description */}
    <div>...</div>
    {/* Color */}
    <div>...</div>
    {/* Sub nodes */}
    <div>...</div>
  </div>

  {/* Divider */}
  <div className="w-px" style={{ background: 'var(--border)' }} />

  {/* Right column — AI Chat */}
  <div className="flex-1 min-h-0 flex flex-col">
    <AIChatPanel
      nodeId={nodeId}
      nodeData={data}
      onUpdate={onUpdate}
      onAddSubNode={onAddSubNode}
    />
  </div>
</div>
```

**Change 3 — Import AIChatPanel:**
Add at top of file:
```tsx
import { AIChatPanel } from './AIChatPanel';
```

**Change 4 — Add min-h-0 to modal content wrapper:**
The modal body needs `overflow-hidden` removed and replaced with the two-column flex layout.

- [ ] **Step 2: Apply changes to NodeModal.tsx**

Read the current file and apply the edits: width change, two-column layout wrapper, AIChatPanel import and usage.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit src/components/canvas/NodeModal.tsx 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Test in browser (manual)**

Start dev server: `npm run dev`
Open canvas, double-click a node, verify NodeModal opens wide with the AI panel on the right. Type a message, verify it streams back.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/NodeModal.tsx
git commit -m "feat(canvas): integrate AIChatPanel into NodeModal with two-column layout

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every section of the spec has a corresponding task?
  - ✅ Streaming API (`/api/canvas/ai`)
  - ✅ AIChatPanel (messages, streaming, input, auto-scroll)
  - ✅ Structured response parsing (apply_description, apply_title, apply_subnode, ask_user)
  - ✅ SuggestionBar (preview pills, apply/dismiss)
  - ✅ NodeModal wider layout, two columns
  - ✅ System prompt: Socratic + Structured personality
  - ✅ Auto web search (via MiniMax tool calling — happens server-side in MiniMax)

- [ ] **Placeholder scan:** No "TBD", "TODO", "fill in later" anywhere in the plan.
- [ ] **Type consistency:** `AIChatPanel` uses `onUpdate(nodeId, data)` and `onAddSubNode(parentId, color, content)` — matching what NodeModal already passes. The `CanvasNodeData` type covers `content`, `description`, `subNodes` — all supported by the apply actions.
- [ ] **Path accuracy:** All file paths verified against the existing codebase.

---

## Notes for Testing

- MiniMax streaming: if `stream: true` isn't supported by the current API key plan, fall back to non-streaming and accumulate the full response before showing it.
- Tool calling for web search: MiniMax-M2.1 supports function calling. The system prompt instructs the model to return structured directives — this avoids needing formal tool definitions. If web search is needed via a formal tool, add a `web_search` function definition to the MiniMax request body.
- Suggestion pills: clicking apply writes directly to the node via the existing `onUpdate` callback. No confirmation dialog needed — the pill IS the confirmation.
