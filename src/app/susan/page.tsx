"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Cpu, 
  Activity, 
  Zap, 
  Command,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  ChevronRight,
  ArrowUpRight,
  Terminal,
  Loader2
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
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#050508] text-slate-200 selection:bg-indigo-500/30 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12 text-left">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-4 bg-indigo-600 rounded-[22px] shadow-[0_0_40px_rgba(79,70,229,0.4)]">
                <Command className="text-white w-7 h-7" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#050508] rounded-full animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Susan Intelligence</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.2em]">Execution Layer Active</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-center">
             <div className="bg-white/[0.03] px-5 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md flex items-center gap-3">
                <Activity size={14} className="text-green-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sovereign Bridge: Connected</span>
             </div>
          </div>
        </header>

        {/* Tactical Feed */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
              <Terminal size={14} /> Real-Time Operation Log
            </h2>
            <span className="text-[10px] font-mono text-slate-600">LIVE FEED</span>
          </div>

          <div className="space-y-3">
            {loading && logs.length === 0 ? (
               <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-16 text-center flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Synchronizing with MacBook core...</p>
               </div>
            ) : logs.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-16 text-center space-y-4">
                  <AlertCircle className="mx-auto text-slate-800" size={40} />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active logs found in current cycle.</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-[28px] p-5 md:p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 text-left">
                  <div className="text-slate-600 font-mono text-[11px] font-medium tracking-tighter opacity-60">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[15px] font-bold text-white tracking-tight">{log.task}</h3>
                      <span className="text-[9px] font-black bg-indigo-500/10 px-2 py-0.5 rounded-full text-indigo-400 uppercase tracking-wider border border-indigo-500/10">
                          {log.mode || "DOMINANCE"}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-400 leading-relaxed max-w-2xl">{log.insight}</p>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className={`text-[10px] font-bold px-4 py-1.5 rounded-xl uppercase tracking-widest ${
                      log.status === "SUCCESS" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      log.status === "ACTIVE" || log.status === "EXECUTING" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                      "bg-white/5 text-slate-500 border-white/5"
                    } border backdrop-blur-sm`}>
                      {log.status}
                    </div>
                    <ChevronRight size={16} className="text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all hidden md:block" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Implementation Matrix */}
        <section className="pt-12 border-t border-white/5 space-y-8 text-left">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                <Zap size={14} /> Active Deployments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { title: "Unbundled SaaS Engine", desc: "Replicating high-cost SaaS products into Vertical AI microservices for the Itana ecosystem.", tag: "STRATEGY" },
                  { title: "Solana Sniper V3", desc: "Real-time liquidity analysis with bot-volume separation. Currently prototyping wash-trade detection.", tag: "PROTOTYPE" }
                ].map((item, i) => (
                  <div key={i} className="group bg-white/[0.02] p-8 rounded-[36px] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="text-indigo-500" size={20} />
                    </div>
                    <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest mb-4 block">{item.tag}</span>
                    <h4 className="text-lg font-bold text-white mb-3 tracking-tight">{item.title}</h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
            </div>
        </section>

        {/* Footer info */}
        <footer className="pt-12 pb-6 text-center">
           <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em]">Owen Zen • Sovereign Infrastructure Hub • 2026</p>
        </footer>
      </div>
    </main>
  );
}
