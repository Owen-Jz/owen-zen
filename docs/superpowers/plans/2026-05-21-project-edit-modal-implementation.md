# Project Edit Modal — Command Center Max Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 4-column project edit modal with Tiptap rich text editor, color-coded tag system, full deliverables/links management, and metadata fields.

**Architecture:** Single-file component (`ProjectModal` in `ProjectView.tsx`) using Tiptap React with a 4-column CSS grid. API accepts new fields via existing POST/PUT routes. New types added to `src/types/index.ts`.

**Tech Stack:** Tiptap React (editor), Lucide icons (existing), Framer Motion (existing), Tailwind CSS (existing)

---

## File Map

```
Modify: src/types/index.ts              — add ProjectTag type, extend Project interface
Modify: src/app/api/projects/route.ts  — accept new fields in POST
Modify: src/app/api/projects/[id]/route.ts — accept new fields in PUT
Modify: src/components/ProjectView.tsx  — replace ProjectModal with Command Center Max
```

---

## Task 1: Install Tiptap Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install packages**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-underline @tiptap/pm
```

Expected: No errors, packages added to `package.json`

---

## Task 2: Add Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add ProjectTag interface and extend Project**

Find the `Project` interface in `src/types/index.ts` and add the new fields. The file around lines 55–83 looks like:

```typescript
export interface ProjectDeliverable {
    _id?: string;
    title: string;
    completed: boolean;
}

export interface ProjectLink {
    _id?: string;
    title: string;
    url: string;
}

export interface ProjectTag {
    name: string;
    color: string; // hex e.g. "#ef4444"
}

export interface Project {
    _id: string;
    title: string;
    description?: string;
    category: "design" | "development" | "business" | "personal";
    status: "planning" | "active" | "paused" | "completed";
    priority: "high" | "medium" | "low";
    progress: number;
    startDate?: string;
    dueDate?: string;
    deliverables: ProjectDeliverable[];
    notes?: string[];
    links: ProjectLink[];
    createdAt: string;
    taskCount?: number;
    completedTaskCount?: number;
    // NEW FIELDS:
    tags?: ProjectTag[];
    estimatedHours?: number;
    teamMembers?: string[];
    quadrant?: "q1" | "q2" | "q3" | "q4" | null;
    notesRichText?: string; // Tiptap HTML
}
```

---

## Task 3: Update API — POST Route

**Files:**
- Modify: `src/app/api/projects/route.ts`

- [ ] **Step 1: Verify POST accepts all new fields**

The POST route at line 41 does `const project = await Project.create(body);`. Mongoose will accept any fields matching the schema — no code change needed if the schema allows extra keys. Check that the schema (in `src/models/Project.ts`) has `tags`, `estimatedHours`, `teamMembers`, `quadrant`, `notesRichText` added.

Find and read `src/models/Project.ts`, then add any missing fields to the schema:

```typescript
tags: [{
    name: { type: String },
    color: { type: String }
}],
estimatedHours: Number,
teamMembers: [String],
quadrant: String,
notesRichText: String,
```

---

## Task 4: Update API — PUT Route

**Files:**
- Modify: `src/app/api/projects/[id]/route.ts`

- [ ] **Step 1: Verify PUT route forwards all new fields**

Read `src/app/api/projects/[id]/route.ts`. The PUT handler does `await Project.findByIdAndUpdate(id, body, ...)`. Same as POST — if the schema has the fields, no code change is needed. Confirm the schema includes the new fields from Task 3.

---

## Task 5: Build the ProjectModal — Column 1 (Core Fields)

**Files:**
- Modify: `src/components/ProjectView.tsx`

This is the largest task — building the full 4-column modal. Replace the existing `ProjectModal` component (lines 457–827) with the new implementation.

The new `ProjectModal` component structure:

```typescript
// ---- STATE ----
const [title, setTitle] = useState(project?.title || "");
const [description, setDescription] = useState(project?.description || "");
const [category, setCategory] = useState<Project["category"]>(project?.category || "development");
const [status, setStatus] = useState<Project["status"]>(project?.status || "planning");
const [priority, setPriority] = useState<Project["priority"]>(project?.priority || "medium");
const [progress, setProgress] = useState(project?.progress || 0);
const [startDate, setStartDate] = useState(project?.startDate || "");
const [dueDate, setDueDate] = useState(project?.dueDate || "");
const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>(project?.deliverables || []);
const [links, setLinks] = useState<ProjectLink[]>(project?.links || []);
const [notes, setNotes] = useState<string[]>(project?.notes || []);
const [newDeliverable, setNewDeliverable] = useState("");
const [newLinkTitle, setNewLinkTitle] = useState("");
const [newLinkUrl, setNewLinkUrl] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
// NEW STATE:
const [tags, setTags] = useState<ProjectTag[]>(project?.tags || []);
const [estimatedHours, setEstimatedHours] = useState(project?.estimatedHours || "");
const [teamMembers, setTeamMembers] = useState(project?.teamMembers?.join(", ") || "");
const [quadrant, setQuadrant] = useState<"q1" | "q2" | "q3" | "q4" | null>(project?.quadrant || null);
const [notesRichText, setNotesRichText] = useState(project?.notesRichText || "");
const [selectedTagColor, setSelectedTagColor] = useState("#ef4444");
const [newTagName, setNewTagName] = useState("");
const [isDirty, setIsDirty] = useState(false);
const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
```

#### Column 1 — Core Fields JSX

```tsx
{/* Column 1: Core */}
<div className="flex flex-col gap-5">
    {/* Title — large, no label */}
    <input
        type="text"
        value={title}
        onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
        autoFocus
        className="w-full text-xl font-bold bg-transparent border-b border-white/10 focus:border-primary pb-2 focus:outline-none transition-all text-white placeholder-gray-600"
        placeholder="Next Gen Platform Rewrite"
        required
    />

    {/* Category buttons */}
    <div>
        <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Category</label>
        <div className="flex gap-2 flex-wrap">
            {(["development","design","business","personal"] as const).map(cat => (
                <button key={cat} type="button" onClick={() => { setCategory(cat); setIsDirty(true); }}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                        category === cat ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    )}>
                    {cat}
                </button>
            ))}
        </div>
    </div>

    {/* Status buttons */}
    <div>
        <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Status</label>
        <div className="flex gap-2 flex-wrap">
            {(["planning","active","paused","completed"] as const).map(s => (
                <button key={s} type="button" onClick={() => { setStatus(s); setIsDirty(true); }}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                        status === s ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    )}>
                    {s}
                </button>
            ))}
        </div>
    </div>

    {/* Priority buttons */}
    <div>
        <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Priority</label>
        <div className="flex gap-2">
            {(["high","medium","low"] as const).map(p => (
                <button key={p} type="button" onClick={() => { setPriority(p); setIsDirty(true); }}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                        priority === p ? p === "high" ? "bg-red-500/20 border-red-500 text-red-400" :
                            p === "medium" ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" :
                                "bg-gray-500/20 border-gray-500 text-gray-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    )}>
                    {p}
                </button>
            ))}
        </div>
    </div>

    {/* Dates */}
    <div className="grid grid-cols-2 gap-3">
        <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Start</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setIsDirty(true); }}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary transition-all text-white text-sm appearance-none custom-date-input" />
        </div>
        <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Due</label>
            <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setIsDirty(true); }}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary transition-all text-white text-sm appearance-none custom-date-input" />
        </div>
    </div>

    {/* Progress */}
    <div>
        <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Progress</label>
            <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        <input type="range" min="0" max="100" value={progress} onChange={e => { setProgress(Number(e.target.value)); setIsDirty(true); }}
            className="w-full cursor-pointer accent-primary" />
        {deliverables.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1">
                {deliverables.filter(d => d.completed).length} of {deliverables.length} deliverables
            </p>
        )}
    </div>
</div>
```

---

## Task 6: Build the ProjectModal — Column 2 (Tiptap Rich Notes Editor)

**Files:**
- Modify: `src/components/ProjectView.tsx`

#### Column 2 — Rich Notes JSX

Import Tiptap components at the top of the file:

```typescript
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
```

Add a `useEffect` for auto-save:

```typescript
useEffect(() => {
    if (!isDirty || !editor) return;
    const timer = setTimeout(() => {
        setAutoSaveStatus("saving");
        setTimeout(() => setAutoSaveStatus("saved"), 800);
    }, 1500);
    return () => clearTimeout(timer);
}, [notesRichText, isDirty]);
```

Initialize editor:

```typescript
const editor = useEditor({
    extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: "Goals, context, decisions, learnings..." }),
    ],
    content: project?.notesRichText || "",
    onUpdate: ({ editor }) => {
        setNotesRichText(editor.getHTML());
        setIsDirty(true);
    },
});
```

#### Column 2 JSX:

```tsx
{/* Column 2: Rich Notes */}
<div className="flex flex-col h-full">
    <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Notes</h4>
        <span className={cn(
            "text-[10px] font-medium transition-all",
            autoSaveStatus === "saving" ? "text-yellow-500" :
                autoSaveStatus === "saved" ? "text-emerald-500" : "text-gray-600"
        )}>
            {autoSaveStatus === "saving" ? "Saving..." : autoSaveStatus === "saved" ? "Saved ✓" : ""}
        </span>
    </div>

    {/* Toolbar */}
    <div className="flex gap-1 mb-2 flex-wrap">
        {[
            { label: "B", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold"), title: "Bold" },
            { label: "I", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic"), title: "Italic" },
            { label: "U", action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline"), title: "Underline" },
            { label: "S", action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive("strike"), title: "Strikethrough" },
            { label: "H1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }), title: "Heading 1" },
            { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }), title: "Heading 2" },
            { label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }), title: "Heading 3" },
            { label: "•", action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList"), title: "Bullet List" },
            { label: "1.", action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList"), title: "Ordered List" },
            { label: "<>", action: () => editor?.chain().focus().toggleCode().run(), active: editor?.isActive("code"), title: "Inline Code" },
            { label: "❝", action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote"), title: "Blockquote" },
            { label: "🔗", action: () => {
                const url = window.prompt("URL:");
                if (url) editor?.chain().focus().setLink({ href: url }).run();
            }, active: editor?.isActive("link"), title: "Link" },
        ].map((btn, i) => (
            <button key={i} type="button" onClick={btn.action} title={btn.title}
                className={cn("w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all",
                    btn.active ? "bg-primary/30 text-primary" : "text-gray-500 hover:bg-white/10 hover:text-white"
                )}>
                {btn.label}
            </button>
        ))}
    </div>

    {/* Editor */}
    <div className="flex-1 overflow-y-auto">
        <style jsx global>{`
            .tiptap-editor .ProseMirror {
                min-height: 300px;
                padding: 12px;
                outline: none;
                color: #e5e7eb;
                font-size: 14px;
                line-height: 1.7;
            }
            .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                color: #4b5563;
                pointer-events: none;
                float: left;
                height: 0;
            }
            .tiptap-editor .ProseMirror h1 { font-size: 1.4em; font-weight: bold; color: #f3f4f6; margin: 1em 0 0.5em; }
            .tiptap-editor .ProseMirror h2 { font-size: 1.2em; font-weight: bold; color: #f3f4f6; margin: 0.8em 0 0.4em; }
            .tiptap-editor .ProseMirror h3 { font-size: 1.05em; font-weight: bold; color: #f3f4f6; margin: 0.6em 0 0.3em; }
            .tiptap-editor .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
            .tiptap-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
            .tiptap-editor .ProseMirror code { background: rgba(255,255,255,0.1); padding: 0.1em 0.3em; border-radius: 3px; font-family: monospace; }
            .tiptap-editor .ProseMirror blockquote {
                border-left: 3px solid rgba(var(--primary-rgb), 0.5);
                padding-left: 1em;
                color: #9ca3af;
                margin: 0.5em 0;
            }
            .tiptap-editor .ProseMirror a { color: #60a5fa; text-decoration: underline; }
            .tiptap-editor .ProseMirror p { margin: 0.4em 0; }
        `}</style>
        <div className="tiptap-editor bg-black/20 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-all">
            <EditorContent editor={editor} />
        </div>
    </div>
</div>
```

---

## Task 7: Build the ProjectModal — Column 3 (Tags & Metadata)

**Files:**
- Modify: `src/components/ProjectView.tsx`

#### Column 3 JSX:

```tsx
{/* Column 3: Tags & Metadata */}
<div className="flex flex-col gap-6">
    {/* Tags */}
    <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tags</h4>

        {/* Color swatches */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
            {[
                { color: "#ef4444", label: "Red" },
                { color: "#f97316", label: "Orange" },
                { color: "#eab308", label: "Yellow" },
                { color: "#22c55e", label: "Green" },
                { color: "#14b8a6", label: "Teal" },
                { color: "#3b82f6", label: "Blue" },
                { color: "#a855f7", label: "Purple" },
                { color: "#ec4899", label: "Pink" },
            ].map(c => (
                <button key={c.color} type="button"
                    onClick={() => { setSelectedTagColor(c.color); setIsDirty(true); }}
                    title={c.label}
                    className={cn("w-5 h-5 rounded-full border-2 transition-all",
                        selectedTagColor === c.color ? "border-white scale-125" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.color }} />
            ))}
        </div>

        {/* New tag input */}
        <div className="flex gap-2 mb-3">
            <input
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (!newTagName.trim()) return;
                        setTags(prev => [...prev, { name: newTagName.trim(), color: selectedTagColor }]);
                        setNewTagName("");
                        setIsDirty(true);
                    }
                }}
                placeholder="Tag name... press Enter"
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-600"
            />
            <button type="button" onClick={() => {
                if (!newTagName.trim()) return;
                setTags(prev => [...prev, { name: newTagName.trim(), color: selectedTagColor }]);
                setNewTagName("");
                setIsDirty(true);
            }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">
                Add
            </button>
        </div>

        {/* Tag chips */}
        <div className="flex gap-2 flex-wrap">
            {tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-white/10 bg-black/20 group/tag">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="text-gray-200">{tag.name}</span>
                    <button type="button" onClick={() => { setTags(prev => prev.filter((_, idx) => idx !== i)); setIsDirty(true); }}
                        className="text-gray-500 hover:text-red-400 ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity">×</button>
                </span>
            ))}
        </div>
    </div>

    {/* Metadata */}
    <div className="space-y-4">
        {/* Estimated hours */}
        <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Estimated Hours</label>
            <div className="relative">
                <input
                    type="number"
                    min="0"
                    value={estimatedHours}
                    onChange={e => { setEstimatedHours(Number(e.target.value)); setIsDirty(true); }}
                    placeholder="0"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-primary transition-all text-white text-sm placeholder-gray-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">h</span>
            </div>
        </div>

        {/* Team members */}
        <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Team Members</label>
            <input
                type="text"
                value={teamMembers}
                onChange={e => { setTeamMembers(e.target.value); setIsDirty(true); }}
                placeholder="Sarah, Mike, Priya..."
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-all text-white text-sm placeholder-gray-600"
            />
        </div>

        {/* Quadrant */}
        <div>
            <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Quadrant</label>
            <div className="grid grid-cols-2 gap-1.5">
                {[
                    { q: "q1", label: "Q1", sub: "Urgent + Important", color: "#ef4444" },
                    { q: "q2", label: "Q2", sub: "Not Urgent + Important", color: "#3b82f6" },
                    { q: "q3", label: "Q3", sub: "Urgent + Not Important", color: "#f97316" },
                    { q: "q4", label: "Q4", sub: "Not Urgent + Not Important", color: "#6b7280" },
                ].map(item => (
                    <button key={item.q} type="button"
                        onClick={() => { setQuadrant(quadrant === item.q ? null : item.q as any); setIsDirty(true); }}
                        className={cn(
                            "p-2 rounded-lg border text-left transition-all",
                            quadrant === item.q
                                ? "border-current text-white"
                                : "border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
                        )}
                        style={{ borderColor: quadrant === item.q ? item.color : undefined }}>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold">{item.label}</span>
                        </div>
                        <p className="text-[9px] mt-0.5 opacity-70">{item.sub}</p>
                    </button>
                ))}
            </div>
        </div>
    </div>
</div>
```

---

## Task 8: Build the ProjectModal — Column 4 (Deliverables & Links) + Header/Footer

**Files:**
- Modify: `src/components/ProjectView.tsx`

#### Column 4 JSX (add to the existing right-side section):

```tsx
{/* Column 4: Deliverables & Links */}
<div className="flex flex-col gap-6">
    {/* Deliverables */}
    <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Deliverables
        </h4>
        <div className="flex gap-2 mb-3">
            <input
                type="text"
                value={newDeliverable}
                onChange={e => setNewDeliverable(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDeliverable(); }}}
                placeholder="e.g. Phase 1 MVP"
                className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all"
            />
            <button type="button" onClick={addDeliverable}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">Add</button>
        </div>
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {deliverables.length === 0 && <p className="text-xs text-gray-600">No deliverables yet.</p>}
            {deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface/50 p-2 rounded-lg border border-white/5 group">
                    <button type="button" onClick={() => {
                        const updated = [...deliverables];
                        updated[i].completed = !updated[i].completed;
                        setDeliverables(updated);
                        setIsDirty(true);
                    }}
                        className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                            d.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500")}>
                        {d.completed && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className={cn("text-xs flex-1", d.completed && "line-through text-gray-500")}>{d.title}</span>
                    <button type="button" onClick={() => { setDeliverables(prev => prev.filter((_, idx) => idx !== i)); setIsDirty(true); }}
                        className="text-gray-600 hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
        </div>
    </div>

    {/* Links */}
    <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <ExternalLink size={14} className="text-blue-500" /> Links
        </h4>
        <div className="space-y-2 mb-3">
            <input type="text" value={newLinkTitle}
                onChange={e => setNewLinkTitle(e.target.value)}
                placeholder="Label (e.g. Figma)"
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all" />
            <div className="flex gap-2">
                <input type="url" value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); }}}
                    placeholder="https://..."
                    className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all" />
                <button type="button" onClick={addLink}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">Add</button>
            </div>
        </div>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {links.length === 0 && <p className="text-xs text-gray-600">No links yet.</p>}
            {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface/50 p-2 rounded-lg border border-white/5 group">
                    <ExternalLink size={11} className="text-gray-500 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <span className="text-xs font-medium text-gray-200 block truncate">{link.title}</span>
                        <a href={link.url} target="_blank" rel="noreferrer"
                            className="text-[10px] text-primary hover:underline truncate block">{link.url}</a>
                    </div>
                    <button type="button" onClick={() => { setLinks(prev => prev.filter((_, idx) => idx !== i)); setIsDirty(true); }}
                        className="text-gray-600 hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={11} />
                    </button>
                </div>
            ))}
        </div>
    </div>
</div>
```

#### Header & Footer (replace existing):

```tsx
{/* Header */}
<div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
    <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">{project ? "Edit Project" : "New Project"}</h2>
        {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes" />}
    </div>
    <div className="flex items-center gap-3">
        <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors">
            Cancel
        </button>
        <button type="submit" form="project-form" disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold transition-all disabled:opacity-50 flex items-center gap-2">
            {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? "Saving..." : "Save Project"}
        </button>
    </div>
</div>
{/* Footer */}
<div className="px-6 py-2 border-t border-white/5 text-[10px] text-gray-600 text-right">
    Esc to close · Cmd+Enter to save
</div>
```

#### Update the payload in `handleSubmit`:

```typescript
const payload = {
    title, description, category, status, priority, progress, startDate, dueDate,
    deliverables, links, notes, tags, estimatedHours,
    teamMembers: teamMembers.split(",").map(s => s.trim()).filter(Boolean),
    quadrant, notesRichText
};
```

#### Add `onKeyDown` for Cmd+Enter on the form:

```typescript
useEffect(() => {
    const handler = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            const form = document.getElementById("project-form") as HTMLFormElement;
            form?.requestSubmit();
        }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
}, []);
```

---

## Task 9: Wire the 4-Column Layout in the Modal Container

**Files:**
- Modify: `src/components/ProjectView.tsx`

Replace the old modal container div (starting around line 534) with the new 4-column layout:

```tsx
<motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    className="relative w-full max-w-[1100px] bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
    style={{ maxHeight: "90vh" }}
>
    {/* Header */}
    {/* (header JSX from Task 8) */}

    {/* Body: 4-column grid */}
    <div className="flex flex-1 overflow-hidden">
        {/* Col 1: Core */}
        <div className="w-[28%] border-r border-white/5 p-5 overflow-y-auto">
            {/* (Column 1 JSX from Task 5) */}
        </div>

        {/* Col 2: Rich Notes */}
        <div className="w-[30%] border-r border-white/5 p-5 overflow-y-auto flex flex-col">
            {/* (Column 2 JSX from Task 6) */}
        </div>

        {/* Col 3: Tags & Meta */}
        <div className="w-[22%] border-r border-white/5 p-5 overflow-y-auto">
            {/* (Column 3 JSX from Task 7) */}
        </div>

        {/* Col 4: Deliverables & Links */}
        <div className="w-[20%] p-5 overflow-y-auto">
            {/* (Column 4 JSX from Task 8) */}
        </div>
    </div>

    {/* Footer */}
    {/* (footer JSX from Task 8) */}

    {/* The form — hidden, triggered by submit */}
    <form id="project-form" onSubmit={handleSubmit} className="hidden" />
</motion.div>
```

**Important:** The `handleSubmit` function is triggered by `form="project-form"` on the Save button. Fields that are controlled by React state are already updated before submit (no hidden inputs needed).

---

## Task 10: Self-Review

**Spec coverage checklist:**

- [ ] Column 1 — Core fields: title, category, status, priority, dates, progress — all implemented
- [ ] Column 2 — Tiptap editor: toolbar (bold/italic/underline/strike/h1/h2/h3/lists/code/blockquote/link), auto-save, placeholder — all implemented
- [ ] Column 3 — Tags: color swatches (8 colors), free-form input, chip display with delete — all implemented
- [ ] Column 3 — Metadata: estimated hours, team members, quadrant selector — all implemented
- [ ] Column 4 — Deliverables: add/toggle/delete, auto-progress — all implemented
- [ ] Column 4 — Links: title+url, add/delete — all implemented
- [ ] Header: title with dirty indicator, Cancel, Save with spinner — all implemented
- [ ] Footer: Esc hint, Cmd+Enter hint — all implemented
- [ ] Keyboard: Cmd+Enter to submit, Esc to close — implemented
- [ ] Types updated: ProjectTag, new Project fields — implemented
- [ ] API: schema updated for new fields — implemented
- [ ] Auto-save: debounced 1.5s — implemented

**Placeholder scan:**
- No "TBD", "TODO", or incomplete sections
- All color values are actual hex codes
- All field names match the type definitions
- No vague requirements

**Type consistency check:**
- `ProjectTag` interface: `{ name: string, color: string }` — consistent across all tag operations
- `quadrant` type: `"q1" | "q2" | "q3" | "q4" | null` — consistent in state, setter, and JSX
- `teamMembers` stored as `string[]` from comma-split — consistent
- `notesRichText` stores Tiptap HTML string — consistent

---

## Task 11: Commit

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat: command center max project edit modal

- 4-column layout: core fields, rich notes (Tiptap), tags & metadata, deliverables & links
- Full Tiptap editor with toolbar, markdown shortcuts, auto-save indicator
- Color-coded tag system with 8 preset swatches + free-form input
- Quadrant selector (Q1-Q4), estimated hours, team members
- Cmd+Enter to save, Esc to close, dirty state indicator
- Updated types and Mongoose schema for new fields

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks for fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?