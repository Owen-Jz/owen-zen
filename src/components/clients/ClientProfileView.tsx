"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Edit2 } from "lucide-react";
import { Client } from "@/types";
import { ClientOverviewTab } from "./ClientOverviewTab";
import { ClientSessionsTab } from "./ClientSessionsTab";
import { ClientProjectsTab } from "./ClientProjectsTab";
import { ClientEditForm } from "./ClientEditForm";

interface Props {
  clientId: string;
  onBack: () => void;
}

type Tab = "overview" | "sessions" | "projects" | "edit";

export function ClientProfileView({ clientId, onBack }: Props) {
  const [client, setClient] = useState<Client | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  const fetchClient = () => {
    fetch(`/api/clients/${clientId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setClient(j.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClient(); }, [clientId]);

  const handleSave = async (data: Partial<Client>) => {
    await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchClient();
    setTab("overview");
  };

  if (loading) return <div className="animate-pulse h-96 bg-surface rounded-xl" />;
  if (!client) return <div className="text-center py-16 text-gray-400">Client not found</div>;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={14} /> Back to Clients
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          {client.company && <p className="text-gray-400 text-sm">{client.role ? `${client.role} at ${client.company}` : client.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          {client.email && <a href={`mailto:${client.email}`} className="p-2 hover:text-primary"><Mail size={18} /></a>}
          {client.phone && <a href={`tel:${client.phone}`} className="p-2 hover:text-primary"><Phone size={18} /></a>}
          <button onClick={() => setTab("edit")} className="p-2 hover:text-primary"><Edit2 size={18} /></button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {(["overview", "sessions", "projects"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize ${tab === t ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>
            {t} {t === "sessions" && client.sessions?.length ? `(${client.sessions.length})` : ""}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {tab === "overview" && <ClientOverviewTab client={client} />}
        {tab === "sessions" && <ClientSessionsTab client={client} onUpdate={fetchClient} />}
        {tab === "projects" && <ClientProjectsTab client={client} />}
        {tab === "edit" && <ClientEditForm client={client} onSave={handleSave} onCancel={() => setTab("overview")} />}
      </motion.div>
    </div>
  );
}