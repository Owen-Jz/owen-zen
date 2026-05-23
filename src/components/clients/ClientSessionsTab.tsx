"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";
import { Client, Session } from "@/types";

interface Props {
  client: Client;
  onUpdate: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ClientSessionsTab({ client, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([""]);
  const [nextSteps, setNextSteps] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = [...(client.sessions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddFollowUp = () => setFollowUps(prev => [...prev, ""]);
  const handleRemoveFollowUp = (i: number) => setFollowUps(prev => prev.filter((_, idx) => idx !== i));
  const handleFollowUpChange = (i: number, val: string) => setFollowUps(prev => prev.map((v, idx) => idx === i ? val : v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/clients/${client._id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, summary, followUps: followUps.filter(f => f.trim()), nextSteps }),
      });
      setSummary("");
      setFollowUps([""]);
      setNextSteps("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 text-sm text-primary hover:opacity-80 mb-4"
      >
        <Plus size={14} /> Log Session
      </button>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-5 mb-6 space-y-4"
        >
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Summary *</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3}
              placeholder="What did you discuss?"
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" required />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Follow-ups</label>
            {followUps.map((fu, i) => (
              <div key={i} className="flex gap-2 mt-1">
                <input value={fu} onChange={e => handleFollowUpChange(i, e.target.value)}
                  placeholder="Action item..."
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                {followUps.length > 1 && (
                  <button type="button" onClick={() => handleRemoveFollowUp(i)}
                    className="text-gray-400 hover:text-white text-sm">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddFollowUp}
              className="text-xs text-primary mt-1">+ Add follow-up</button>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">Next Steps</label>
            <input value={nextSteps} onChange={e => setNextSteps(e.target.value)}
              placeholder="What's next with this client?"
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Saving..." : "Save Session"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-sm hover:opacity-80">
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No sessions logged yet.</p>
        ) : sorted.map(session => (
          <div key={session._id} className="bg-surface border border-border rounded-xl p-4">
            <button onClick={() => setExpanded(expanded === session._id ? null : (session._id || ""))}
              className="w-full flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm font-medium">{timeAgo(session.date)}</div>
                <div className="text-xs text-gray-400 line-clamp-2">{session.summary}</div>
              </div>
              <div className="flex items-center gap-2">
                {session.followUps?.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {session.followUps.length} follow-up{session.followUps.length !== 1 ? "s" : ""}
                  </span>
                )}
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded === session._id ? "rotate-180" : ""}`} />
              </div>
            </button>
            {expanded === session._id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-sm text-gray-300">{session.summary}</p>
                {session.followUps?.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Follow-ups</div>
                    {session.followUps.map((fu, i) => (
                      <div key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {fu}
                      </div>
                    ))}
                  </div>
                )}
                {session.nextSteps && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next Steps</div>
                    <p className="text-sm text-gray-300">{session.nextSteps}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}