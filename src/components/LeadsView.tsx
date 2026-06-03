"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Mail, MessageSquare, TrendingUp, Plus, X, Tag,
  Trash2, ChevronDown, Check, ExternalLink, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

interface Lead {
  _id: string;
  name: string;
  email: string;
  status: "new" | "contacted" | "qualified" | "converted";
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadsViewProps {
  leads: Lead[];
  onUpdate: (leads: Lead[]) => void;
}

export default function LeadsView({ leads, onUpdate }: LeadsViewProps) {
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", status: "new" as Lead["status"], source: "", notes: "" });

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  const addLead = (lead: Omit<Lead, "_id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newLead: Lead = { ...lead, _id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    onUpdate([...leads, newLead]);
    setShowForm(false);
    setFormData({ name: "", email: "", status: "new", source: "", notes: "" });
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    onUpdate(leads.map(l => l._id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
    setEditingLead(null);
  };

  const deleteLead = (id: string) => {
    if (confirm("Delete this lead?")) onUpdate(leads.filter(l => l._id !== id));
  };

  const statusColors: Record<Lead["status"], string> = {
    new: "bg-blue-500/20 text-blue-400",
    contacted: "bg-yellow-500/20 text-yellow-400",
    qualified: "bg-purple-500/20 text-purple-400",
    converted: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Leads</h2>
          <p className="text-sm text-zinc-400 mt-1">{leads.length} total · {leads.filter(l => l.status === "new").length} new</p>
        </div>
        <button
          onClick={() => { setEditingLead(null); setFormData({ name: "", email: "", status: "new", source: "", notes: "" }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "new", "contacted", "qualified", "converted"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors", filter === f ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700")}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description={filter !== "all" ? `No ${filter} leads. Try a different filter.` : "Add your first lead to start tracking prospects."}
          />
        ) : (
          filtered.map(lead => (
            <motion.div
              key={lead._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{lead.name}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColors[lead.status])}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>
                    {lead.source && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {lead.source}</span>}
                  </div>
                  {lead.notes && <p className="text-sm text-zinc-500 mt-2">{lead.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingLead(lead); setFormData({ name: lead.name, email: lead.email, status: lead.status, source: lead.source || "", notes: lead.notes || "" }); setShowForm(true); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"><Tag className="w-4 h-4" /></button>
                  <button onClick={() => deleteLead(lead._id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{editingLead ? "Edit Lead" : "Add New Lead"}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-sm text-zinc-400 block mb-1">Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" placeholder="Full name" /></div>
                <div><label className="text-sm text-zinc-400 block mb-1">Email</label><input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" placeholder="email@example.com" /></div>
                <div><label className="text-sm text-zinc-400 block mb-1">Status</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as Lead["status"] })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="converted">Converted</option></select></div>
                <div><label className="text-sm text-zinc-400 block mb-1">Source (optional)</label><input value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" placeholder="Twitter, referral, etc." /></div>
                <div><label className="text-sm text-zinc-400 block mb-1">Notes (optional)</label><textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none" rows={3} placeholder="Any additional context..." /></div>
                <button
                  onClick={() => {
                    if (!formData.name.trim() || !formData.email.trim()) return;
                    if (editingLead) updateLead(editingLead._id, formData); else addLead(formData);
                    setShowForm(false);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  {editingLead ? "Save Changes" : "Add Lead"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}