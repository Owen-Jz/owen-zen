"use client";
import { useState } from "react";
import { Client } from "@/types";

interface Props {
  client: Client;
  onSave: (data: Partial<Client>) => Promise<void>;
  onCancel: () => void;
}

export function ClientEditForm({ client, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Client>>({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    company: client.company || "",
    role: client.role || "",
    personalNotes: client.personalNotes || "",
    tags: client.tags || [],
    status: client.status,
    communicationPrefs: client.communicationPrefs || {},
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: (f.tags || []).filter(t => t !== tag) }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide">Name *</label>
        <input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
          <input type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide">Phone</label>
          <input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide">Company</label>
          <input value={form.company || ""} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide">Role</label>
          <input value={form.role || ""} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide">Status</label>
        <select value={form.status || "active"} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm">
          <option value="active">Active</option>
          <option value="dormant">Dormant</option>
          <option value="needs-followup">Needs Follow-up</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide">Personal Notes</label>
        <textarea value={form.personalNotes || ""} onChange={e => setForm(f => ({ ...f, personalNotes: e.target.value }))}
          rows={3} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
      </div>
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wide">Tags</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {(form.tags || []).map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          <button type="button" onClick={addTag} className="px-3 py-2 bg-surface border border-border rounded-lg text-sm hover:opacity-80">Add</button>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm hover:opacity-80">
          Cancel
        </button>
      </div>
    </form>
  );
}