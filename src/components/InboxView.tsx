"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, ExternalLink, Globe, Lightbulb,
  Video, MapPin, Wrench, FileText, MessageSquare,
  Inbox, Eye, CheckCheck, Trash2, LayoutGrid, List,
  Brain, Loader2, ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type EntryType = "Idea" | "Article" | "Video" | "Social Post" | "Location" | "Tool/App";
type Status = "New" | "Reviewing" | "Processed" | "Archive";

interface InboxItem {
  _id: string;
  title: string;
  url?: string;
  entryType: EntryType;
  status: Status;
  source?: string;
  quickNotes?: string;
  dateAdded: string;
}

type ViewId = "inbox" | "media" | "brainstorm" | "radar";

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_META: Record<EntryType, { icon: React.ElementType; color: string; bg: string }> = {
  Idea:         { icon: Lightbulb,     color: "text-yellow-400",  bg: "bg-yellow-400/10 border-yellow-400/20" },
  Article:      { icon: FileText,      color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20" },
  Video:        { icon: Video,         color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20" },
  "Social Post":{ icon: MessageSquare, color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/20" },
  Location:     { icon: MapPin,        color: "text-green-400",   bg: "bg-green-400/10 border-green-400/20" },
  "Tool/App":   { icon: Wrench,        color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20" },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  New:       { label: "📥 New",       color: "text-sky-400",    bg: "bg-sky-400/10 border-sky-400/20" },
  Reviewing: { label: "🔍 Reviewing", color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/20" },
  Processed: { label: "✅ Processed", color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20" },
  Archive:   { label: "🗑️ Archive",   color: "text-gray-500",   bg: "bg-gray-500/10 border-gray-500/20" },
};

const VIEWS: { id: ViewId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "inbox",      label: "Global Inbox",        icon: Inbox,      desc: "All new captures" },
  { id: "media",      label: "Media Gallery",        icon: LayoutGrid, desc: "Videos & social posts" },
  { id: "brainstorm", label: "Brainstorming Board",  icon: Brain,      desc: "Ideas grouped by type" },
  { id: "radar",      label: "Location Radar",       icon: MapPin,     desc: "Places to visit" },
];

const ENTRY_TYPES: EntryType[] = ["Idea", "Article", "Video", "Social Post", "Location", "Tool/App"];
const STATUSES: Status[]       = ["New", "Reviewing", "Processed", "Archive"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Add Entry Modal ───────────────────────────────────────────────────────────
function AddModal({
  onClose,
  onSave,
  prefill,
}: {
  onClose: () => void;
  onSave: (item: Partial<InboxItem>) => Promise<void>;
  prefill?: Partial<InboxItem>;
}) {
  const [form, setForm] = useState<Partial<InboxItem>>({
    title: "", url: "", entryType: "Idea", status: "New", source: "", quickNotes: "",
    ...prefill,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof InboxItem, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-bold text-lg text-white">New Capture</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Title *</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="What's this about?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition"
            />
          </div>

          {/* URL */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">URL / Link</label>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={form.url}
                onChange={e => set("url", e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition"
              />
            </div>
          </div>

          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
              <div className="relative">
                <select
                  value={form.entryType}
                  onChange={e => set("entryType", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition appearance-none cursor-pointer"
                >
                  {ENTRY_TYPES.map(t => <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition appearance-none cursor-pointer"
                >
                  {STATUSES.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{STATUS_META[s as Status].label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Source</label>
            <input
              value={form.source}
              onChange={e => set("source", e.target.value)}
              placeholder="Reddit, YouTube, IRL, Twitter..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Quick Notes</label>
            <textarea
              value={form.quickNotes}
              onChange={e => set("quickNotes", e.target.value)}
              placeholder="Quick context or thoughts..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title?.trim()}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Capture
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Inbox Card ────────────────────────────────────────────────────────────────
function InboxCard({
  item,
  onStatusChange,
  onDelete,
  compact = false,
}: {
  item: InboxItem;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const type   = TYPE_META[item.entryType] || TYPE_META["Idea"];
  const status = STATUS_META[item.status]  || STATUS_META["New"];
  const Icon   = type.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${type.bg}`}>
          <Icon size={15} className={type.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-snug line-clamp-2">{item.title}</p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-0.5 transition-colors"
                >
                  <ExternalLink size={10} />
                  {(() => { try { return new URL(item.url).hostname.replace("www.", ""); } catch { return item.url.slice(0, 30); } })()}
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {item.status !== "Processed" && (
                <button
                  onClick={() => onStatusChange(item._id, "Processed")}
                  title="Mark Processed"
                  className="p-1.5 rounded-lg hover:bg-green-400/10 text-gray-500 hover:text-green-400 transition-colors"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              {item.status !== "Reviewing" && item.status !== "Processed" && (
                <button
                  onClick={() => onStatusChange(item._id, "Reviewing")}
                  title="Mark Reviewing"
                  className="p-1.5 rounded-lg hover:bg-amber-400/10 text-gray-500 hover:text-amber-400 transition-colors"
                >
                  <Eye size={13} />
                </button>
              )}
              <button
                onClick={() => onDelete(item._id)}
                title="Delete"
                className="p-1.5 rounded-lg hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {!compact && item.quickNotes && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.quickNotes}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Status badge (clickable cycle) */}
            <button
              onClick={() => {
                const cycle: Status[] = ["New", "Reviewing", "Processed", "Archive"];
                const next = cycle[(cycle.indexOf(item.status) + 1) % cycle.length];
                onStatusChange(item._id, next);
              }}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all hover:opacity-80 ${status.bg} ${status.color}`}
            >
              {status.label}
            </button>
            {item.source && (
              <span className="text-[11px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{item.source}</span>
            )}
            <span className="text-[11px] text-gray-700 ml-auto">{timeAgo(item.dateAdded)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Media Card (Grid) ─────────────────────────────────────────────────────────
function MediaCard({
  item,
  onStatusChange,
  onDelete,
}: {
  item: InboxItem;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}) {
  const type   = TYPE_META[item.entryType];
  const status = STATUS_META[item.status];
  const Icon   = type.icon;

  // Try to extract YouTube thumbnail
  const ytThumb = (() => {
    if (!item.url) return null;
    try {
      const u = new URL(item.url);
      const vid = u.searchParams.get("v") || (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
      return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
    } catch { return null; }
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all"
    >
      {/* Thumbnail / placeholder */}
      <div className={`relative h-36 flex items-center justify-center ${type.bg} border-b border-white/5`}>
        {ytThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ytThumb} alt="" className="w-full h-full object-cover opacity-80" />
        ) : (
          <Icon size={32} className={`${type.color} opacity-40`} />
        )}
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onStatusChange(item._id, "Processed")} className="p-1.5 bg-black/60 rounded-lg text-green-400 hover:bg-black/80 transition-colors">
            <CheckCheck size={12} />
          </button>
          <button onClick={() => onDelete(item._id)} className="p-1.5 bg-black/60 rounded-lg text-red-400 hover:bg-black/80 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{item.title}</p>
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1 transition-colors">
            <ExternalLink size={10} /> Open
          </a>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${status.bg} ${status.color}`}>{status.label}</span>
          <span className="text-[10px] text-gray-700">{timeAgo(item.dateAdded)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ view, onAdd }: { view: ViewId; onAdd: () => void }) {
  const messages: Record<ViewId, { icon: string; text: string }> = {
    inbox:      { icon: "📥", text: "Inbox is clear. Capture something new." },
    media:      { icon: "🎬", text: "No videos or social posts yet." },
    brainstorm: { icon: "💡", text: "No ideas captured yet. Dump your brain." },
    radar:      { icon: "📍", text: "No locations saved. Drop a pin." },
  };
  const m = messages[view];
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">{m.icon}</span>
      <p className="text-gray-500 text-sm mb-5">{m.text}</p>
      <button onClick={onAdd} className="px-4 py-2 bg-primary/20 text-primary text-sm font-medium rounded-xl hover:bg-primary/30 transition-colors flex items-center gap-2">
        <Plus size={14} /> Add First Entry
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const InboxView = () => {
  const [items, setItems]         = useState<InboxItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState<ViewId>("inbox");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);

  // Fetch all items
  const fetchItems = useCallback(async () => {
    try {
      const res  = await fetch("/api/inbox");
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Create
  const handleCreate = async (form: Partial<InboxItem>) => {
    const res  = await fetch("/api/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) setItems(prev => [data.data, ...prev]);
  };

  // Update status
  const handleStatusChange = async (id: string, status: Status) => {
    setItems(prev => prev.map(i => i._id === id ? { ...i, status } : i));
    await fetch(`/api/inbox/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  };

  // Delete
  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(i => i._id !== id));
    await fetch(`/api/inbox/${id}`, { method: "DELETE" });
  };

  // ── View Filtering ─────────────────────────────────────────────────────────
  const searchFilter = (i: InboxItem) =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) || (i.source || "").toLowerCase().includes(search.toLowerCase());

  const viewItems = (() => {
    switch (view) {
      case "inbox":
        return items.filter(i => i.status === "New" && searchFilter(i));
      case "media":
        return items.filter(i => (i.entryType === "Video" || i.entryType === "Social Post") && searchFilter(i));
      case "brainstorm":
        return items.filter(i => i.entryType === "Idea" && searchFilter(i));
      case "radar":
        return items.filter(i => i.entryType === "Location" && searchFilter(i));
      default:
        return [];
    }
  })();

  // Brainstorm groups by status
  const brainstormGroups = STATUSES.filter(s => viewItems.some(i => i.status === s)).map(s => ({
    status: s,
    items: viewItems.filter(i => i.status === s),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search inbox..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/80 transition-colors shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Capture</span>
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1">
        {VIEWS.map(v => {
          const Icon = v.icon;
          const count = (() => {
            switch (v.id) {
              case "inbox":      return items.filter(i => i.status === "New").length;
              case "media":      return items.filter(i => i.entryType === "Video" || i.entryType === "Social Post").length;
              case "brainstorm": return items.filter(i => i.entryType === "Idea").length;
              case "radar":      return items.filter(i => i.entryType === "Location").length;
            }
          })();
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                view === v.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{v.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  view === v.id ? "bg-white/20 text-white" : "bg-white/10 text-gray-400"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* View description */}
      <p className="text-xs text-gray-600 -mt-2">
        {VIEWS.find(v => v.id === view)?.desc}
        {view === "inbox" && " · Items disappear when marked Processed or Archived"}
      </p>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-600" />
        </div>
      ) : viewItems.length === 0 ? (
        <EmptyState view={view} onAdd={() => setShowModal(true)} />
      ) : (
        <AnimatePresence mode="popLayout">
          {/* ── Global Inbox: list ─────────────────────────────────── */}
          {view === "inbox" && (
            <div className="space-y-2">
              {viewItems.map(item => (
                <InboxCard key={item._id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* ── Media Gallery: grid ────────────────────────────────── */}
          {view === "media" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {viewItems.map(item => (
                <MediaCard key={item._id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* ── Brainstorming Board: grouped by status ─────────────── */}
          {view === "brainstorm" && (
            <div className="space-y-6">
              {brainstormGroups.length > 0 ? brainstormGroups.map(g => (
                <div key={g.status}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_META[g.status as Status].bg} ${STATUS_META[g.status as Status].color}`}>
                      {STATUS_META[g.status as Status].label}
                    </span>
                    <span className="text-xs text-gray-600">{g.items.length} idea{g.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-2 pl-1 border-l-2 border-white/5">
                    {g.items.map(item => (
                      <InboxCard key={item._id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} compact />
                    ))}
                  </div>
                </div>
              )) : <EmptyState view={view} onAdd={() => setShowModal(true)} />}
            </div>
          )}

          {/* ── Location Radar: list with map icon ────────────────── */}
          {view === "radar" && (
            <div className="space-y-2">
              {viewItems.map(item => (
                <InboxCard key={item._id} item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <AddModal
            onClose={() => setShowModal(false)}
            onSave={handleCreate}
            prefill={
              view === "media"      ? { entryType: "Video" } :
              view === "brainstorm" ? { entryType: "Idea" }  :
              view === "radar"      ? { entryType: "Location" } :
              undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
};
