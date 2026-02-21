"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Mail, MessageSquare, TrendingUp, Plus, X, Tag,
  Trash2, ChevronDown, Check, ExternalLink, RefreshCw
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  source: string;
  message?: string;
  status: "new" | "contacted" | "replied" | "converted" | "archived";
  tags: string[];
  replyCount: number;
  lastReplyAt?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  replied: "bg-green-500/15 text-green-400 border-green-500/30",
  converted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const SOURCE_COLORS: Record<string, string> = {
  twitter: "bg-sky-500/10 text-sky-400",
  instagram: "bg-pink-500/10 text-pink-400",
  linkedin: "bg-blue-600/10 text-blue-400",
  website: "bg-purple-500/10 text-purple-400",
  referral: "bg-orange-500/10 text-orange-400",
  direct: "bg-gray-500/10 text-gray-400",
  other: "bg-gray-500/10 text-gray-400",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={cn("p-3 rounded-lg", color)}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</div>
      </div>
    </div>
  );
}

function AddLeadForm({ onAdd, onClose }: { onAdd: (lead: Partial<Lead>) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("direct");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onAdd({ name, email, source, message });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-surface border border-border rounded-xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg">Add Lead</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">Name *</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">Source</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
          >
            {["direct", "website", "twitter", "instagram", "linkedin", "referral", "other"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide block mb-1.5">Initial Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What did they say..."
            rows={3}
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600 resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {loading ? "Adding..." : "Add Lead"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function LeadRow({ lead, onUpdate, onDelete }: {
  lead: Lead;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(lead.notes || "");
  const [status, setStatus] = useState(lead.status);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (newStatus: Lead["status"]) => {
    setStatus(newStatus);
    await onUpdate(lead._id, { status: newStatus });
  };

  const handleNotesSave = async () => {
    if (notes !== lead.notes) {
      await onUpdate(lead._id, { notes });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete lead "${lead.name}"?`)) return;
    setDeleting(true);
    await onDelete(lead._id);
  };

  return (
    <div className={cn("border border-border rounded-xl overflow-hidden transition-all", deleting && "opacity-40")}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
          {lead.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{lead.name}</div>
          <div className="text-xs text-gray-500 truncate">{lead.email}</div>
        </div>

        {/* Source badge */}
        <span className={cn("hidden sm:inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize", SOURCE_COLORS[lead.source] || SOURCE_COLORS.other)}>
          {lead.source}
        </span>

        {/* Status badge */}
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", STATUS_COLORS[status])}>
          {status}
        </span>

        {/* Reply count */}
        {lead.replyCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-green-400">
            <MessageSquare size={12} />
            {lead.replyCount}
          </div>
        )}

        {/* Time */}
        <span className="hidden md:block text-xs text-gray-600 whitespace-nowrap">{timeAgo(lead.createdAt)}</span>

        <ChevronDown size={16} className={cn("text-gray-500 transition-transform shrink-0", expanded && "rotate-180")} />
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {/* Initial message */}
              {lead.message && (
                <div className="bg-background rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Initial Message</div>
                  <p className="text-sm text-gray-300">{lead.message}</p>
                </div>
              )}

              {/* Status + Actions row */}
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</div>
                  <select
                    value={status}
                    onChange={e => handleStatusChange(e.target.value as Lead["status"])}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                  >
                    {["new", "contacted", "replied", "converted", "archived"].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <a
                  href={`mailto:${lead.email}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                >
                  <Mail size={13} /> Email
                </a>

                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors ml-auto"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Notes</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  placeholder="Add private notes about this lead..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-gray-600 resize-none"
                />
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span>Added {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                {lead.lastReplyAt && <span>Last reply {timeAgo(lead.lastReplyAt)}</span>}
                {lead.replyCount > 0 && <span>{lead.replyCount} {lead.replyCount === 1 ? "reply" : "replies"}</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const json = await res.json();
      if (json.success) setLeads(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const addLead = async (data: Partial<Lead>) => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to create lead");
    setLeads(prev => [json.data, ...prev]);
  };

  const updateLead = async (id: string, data: Partial<Lead>) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      setLeads(prev => prev.map(l => l._id === id ? { ...l, ...json.data } : l));
    }
  };

  const deleteLead = async (id: string) => {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads(prev => prev.filter(l => l._id !== id));
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    replied: leads.filter(l => l.status === "replied").length,
    converted: leads.filter(l => l.status === "converted").length,
  };

  const filters = ["all", "new", "contacted", "replied", "converted", "archived"];
  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total" value={stats.total} color="bg-primary/10 text-primary" />
        <StatCard icon={Mail} label="New" value={stats.new} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={MessageSquare} label="Replied" value={stats.replied} color="bg-green-500/10 text-green-400" />
        <StatCard icon={TrendingUp} label="Converted" value={stats.converted} color="bg-emerald-500/10 text-emerald-400" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap",
                filter === f
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent hover:border-border"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="p-2 text-gray-500 hover:text-white border border-border rounded-lg hover:border-gray-500 transition-all"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Add Lead Form */}
      <AnimatePresence>
        {showAdd && (
          <AddLeadForm onAdd={addLead} onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>

      {/* Leads list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <Users size={36} className="text-gray-700 mx-auto mb-3" />
          <div className="text-gray-500 font-medium">No leads yet</div>
          <div className="text-gray-700 text-sm mt-1">
            {filter !== "all" ? `No leads with status "${filter}"` : "Add your first lead or connect your lead magnet form"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map(lead => (
              <motion.div
                key={lead._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <LeadRow lead={lead} onUpdate={updateLead} onDelete={deleteLead} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Webhook hint */}
      <div className="bg-surface/50 border border-border/50 rounded-xl p-4 flex items-start gap-3">
        <ExternalLink size={16} className="text-gray-500 mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-medium text-gray-400 mb-0.5">Resend Webhook</div>
          <div className="text-xs text-gray-600">
            Point your Resend inbound/reply webhook to:
            <code className="ml-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">
              https://owen-zen.vercel.app/api/leads/webhook
            </code>
            — replies will auto-notify you on Telegram.
          </div>
        </div>
      </div>
    </div>
  );
}
