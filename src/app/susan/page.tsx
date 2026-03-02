"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Activity, 
  Zap, 
  Command,
  Terminal,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Globe
} from "lucide-react";

export default function SusanDominanceRoom() {
  const [logs, setLogs] = useState<any[]>([]);
  const [intel, setIntel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logRes = await fetch('/api/susan?action=get-dominance-logs');
        const intelRes = await fetch('/api/susan?action=get-strategic-intel');
        const logData = await logRes.json();
        const intelData = await intelRes.json();
        setLogs(logData.logs || []);
        setIntel(intelData.intel || []);
      } catch (e) {
        console.error("Sync Failure");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#020205] text-[#e2e8f0] font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* HUD Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#312e81,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-50 opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Header - The Sovereign Hub */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-12">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="p-5 bg-indigo-600 rounded-[28px] shadow-[0_0_60px_rgba(79,70,229,0.3)] transition-transform group-hover:scale-105 duration-500">
                <Command className="text-white w-8 h-8" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-[#020205] rounded-full animate-ping" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">Sovereign Dominance</h1>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Neural Execution Engine v2.5</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
             <div className="bg-white/[0.03] px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-2xl">
                <Activity size={16} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Link: Stable</span>
             </div>
             <div className="bg-white/[0.03] px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-2xl">
                <Cpu size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Quota: Active</span>
             </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Tactical Intel - Left Column (Higher Priority) */}
          <section className="lg:col-span-7 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                <Globe size={18} className="text-indigo-500" /> Strategic Intelligence Matrix
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {intel.map((item, i) => (
                <div key={i} className="group relative bg-[#0B0F1A]/60 hover:bg-[#0B0F1A]/90 border border-white/5 rounded-[40px] p-8 transition-all duration-500 hover:shadow-[0_0_80px_rgba(79,70,229,0.1)] overflow-hidden">
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full tracking-widest uppercase border border-indigo-500/20">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter px-2 py-0.5 border border-red-500/20 rounded bg-red-500/5">{item.impact} IMPACT</span>
                        <ArrowUpRight className="text-slate-700 group-hover:text-white transition-colors" size={20} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-xl">{item.payload}</p>
                    </div>
                  </div>
                  {/* Decorative Accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[60px] group-hover:bg-indigo-600/10 transition-colors" />
                </div>
              ))}
            </div>
          </section>

          {/* Operational Feed - Right Column */}
          <section className="lg:col-span-5 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
                <Terminal size={18} className="text-red-500" /> Operational Loop
              </h2>
            </div>

            <div className="bg-[#0B0F1A]/40 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-md">
              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-8">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">MacBook Execution Stream</span>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
              </div>
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto scrollbar-hide">
                {logs.map((log, i) => (
                  <div key={i} className="p-6 hover:bg-white/[0.02] transition-colors flex items-start gap-5">
                    <div className="text-[10px] font-bold text-slate-600 font-mono mt-1 opacity-50">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{log.task}</h4>
                        <span className="text-[8px] font-black text-indigo-400/60 uppercase">{log.mode || "CORE"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 italic">"{log.insight}"</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full mt-2 ${log.status === "SUCCESS" ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-indigo-500 animate-pulse"}`} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Global Strategy Section */}
        <section className="bg-indigo-600/[0.03] border border-indigo-500/10 rounded-[50px] p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <TrendingUp size={120} className="text-indigo-500" />
            </div>
            <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">Growth Directives</h2>
                    <p className="text-indigo-400/80 font-bold text-xs uppercase tracking-[0.4em]">Outside-the-Box Capital Deployment</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Solana Sniper V3", desc: "Wash-trade detection active. Filtering LP entries for real 'whale' signatures.", status: "PROTOTYPING" },
                        { title: "Unbundled SaaS", desc: "Ripping the core from $200/mo legal tools to build SEZ-native microservices.", status: "STRATEGY" },
                        { title: "Alpha City RWA", desc: "Fractionalizing infrastructure assets for local liquidity pools.", status: "RESEARCH" }
                    ].map((card, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Zap size={14} className="text-amber-400" />
                                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{card.title}</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                            <span className="inline-block text-[8px] font-black border border-white/10 px-2 py-1 rounded text-slate-400 uppercase tracking-widest">{card.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <footer className="pt-20 pb-10 text-center space-y-4">
           <p className="text-[10px] font-black text-slate-800 uppercase tracking-[1em]">Susan Sovereign Hub • Powered by AntiGravity Core • 2026</p>
           <div className="flex justify-center gap-6 opacity-20 grayscale brightness-200">
               {/* Platform Logos placeholder */}
           </div>
        </footer>
      </div>
    </main>
  );
}
