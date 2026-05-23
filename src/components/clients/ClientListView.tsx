"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { Client } from "@/types";
import { ClientCard } from "./ClientCard";

interface Props {
  onSelectClient: (id: string) => void;
}

export function ClientListView({ onSelectClient }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "dormant" | "needs-followup">("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", role: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(j => { if (j.success) setClients(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="dormant">Dormant</option>
          <option value="needs-followup">Needs Follow-up</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-surface border border-border rounded-xl p-5 h-32 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No clients yet</p>
          <p className="text-sm">Add your first client to start building relationships.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <ClientCard key={client._id} client={client} onClick={() => onSelectClient(client._id)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Add Client</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!form.name.trim()) return;
                setSubmitting(true);
                try {
                  const res = await fetch("/api/clients", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                  });
                  const json = await res.json();
                  if (json.success) {
                    setClients(prev => [json.data, ...prev]);
                    setForm({ name: "", email: "", phone: "", company: "", role: "" });
                    setShowAddModal(false);
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Client name"
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                    placeholder="Company name"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-2">Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    placeholder="Job title or role"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!form.name.trim() || submitting}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submitting ? "Adding..." : "Add Client"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}