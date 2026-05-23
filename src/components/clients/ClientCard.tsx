"use client";
import { motion } from "framer-motion";
import { Mail, Phone, Building2, Clock } from "lucide-react";
import { Client } from "@/types";

interface Props {
  client: Client;
  onClick: () => void;
}

const STATUS_COLORS = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  dormant: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  "needs-followup": "bg-orange-500/15 text-orange-400 border-orange-500/30",
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

export function ClientCard({ client, onClick }: Props) {
  const lastSession = client.sessions?.[client.sessions.length - 1];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{client.name}</div>
            {client.company && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Building2 size={10} /> {client.company}
              </div>
            )}
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[client.status] || STATUS_COLORS.active}`}>
          {client.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
        {client.email && <span className="flex items-center gap-1"><Mail size={10} /> {client.email}</span>}
        {client.phone && <span className="flex items-center gap-1"><Phone size={10} /> {client.phone}</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        {lastSession ? (
          <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(lastSession.date)}</span>
        ) : (
          <span>No sessions yet</span>
        )}
        {client.projects?.length > 0 && (
          <span>{client.projects.length} project{client.projects.length !== 1 ? "s" : ""}</span>
        )}
      </div>
    </motion.div>
  );
}