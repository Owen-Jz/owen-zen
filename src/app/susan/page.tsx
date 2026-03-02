"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Cpu, 
  Terminal, 
  Activity, 
  Zap, 
  Globe, 
  Clock, 
  Command,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function SusanDominanceRoom() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/susan?action=get-dominance-logs');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error("Failed to load Susan's logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] p-8 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl animate-pulse shadow-lg shadow-indigo-900/40">
              <Command className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">Susan's Execution Log</h1>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest text-left">Real-time status of MacBook-based operations</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                <Activity size={14} className="text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Sovereign Engine: Online</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {loading && logs.length === 0 ? (
             <div className="bg-white/5 border border-white/5 rounded-3xl p-10 text-center flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Connecting to MacBook bridge...</p>
             </div>
          ) : logs.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-3xl p-20 text-center">
                <AlertCircle className="mx-auto text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-left">No active operations found in the log.</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="bg-[#0B101A] border-l-4 border-indigo-600 p-6 rounded-r-3xl shadow-xl flex items-center gap-6 animate-in slide-in-from-left-4">
                <div className="text-slate-500 font-mono text-[10px] w-24">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase text-white">{log.task}</h3>
                    <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-full text-indigo-400 uppercase border border-white/5">
                        {log.mode || "DOMINANCE"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-left">{log.insight}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                    log.status === "SUCCESS" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    log.status === "ACTIVE" || log.status === "EXECUTING" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse" :
                    "bg-white/5 text-slate-400 border-white/5"
                  } border`}>
                    {log.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <section className="pt-10 border-t border-white/5">
            <h2 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Zap size={18} className="text-indigo-500" /> Current Implementations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                    <h4 className="text-xs font-black uppercase text-indigo-400 mb-2">Unbundled SaaS Engine</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        Replicating high-cost SaaS products into Vertical AI microservices for the Itana ecosystem.
                    </p>
                </div>
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                    <h4 className="text-xs font-black uppercase text-indigo-400 mb-2">Solana Sniper V3</h4>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        Real-time liquidity analysis with bot-volume separation. Currently prototyping wash-trade detection.
                    </p>
                </div>
            </div>
        </section>
      </div>
    </main>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <Activity className={className} size={size} />;
}
