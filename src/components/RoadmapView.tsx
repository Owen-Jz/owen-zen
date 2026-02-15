"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Lock, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Trophy, Heart, Briefcase } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const RoadmapView = () => {
  // In a real app, these states would be fetched from DB
  const [tiers, setTiers] = useState([
    {
      id: 1,
      title: "Foundation",
      icon: ShieldCheck,
      color: "blue",
      status: "in-progress", // locked, in-progress, completed
      goals: [
        { id: "g1", text: "$3k–$5k Consistent Monthly Income", done: false, note: "3 consecutive stable months minimum." }
      ]
    },
    {
      id: 2,
      title: "Stability",
      icon: Lock,
      color: "emerald",
      status: "locked",
      goals: [
        { id: "g2", text: "Emergency Fund (6 Months Expenses)", done: false, note: "$12k saved." },
        { id: "g3", text: "Move Into Own Apartment", done: false, note: "Only after income is stable for 3+ months." }
      ]
    },
    {
      id: 3,
      title: "Reward",
      icon: Trophy,
      color: "amber",
      status: "locked",
      goals: [
        { id: "g4", text: "Buy 2018 Camry SE (White)", done: false, note: "Only if Income ≥ $5k/mo & Fund intact." }
      ]
    },
    {
      id: 4,
      title: "Impact",
      icon: Heart,
      color: "rose",
      status: "locked",
      goals: [
        { id: "g5", text: "Gift Parents 1M", done: false, note: "From overflow, not sacrifice." }
      ]
    },
    {
      id: 5,
      title: "The Engine",
      icon: Briefcase,
      color: "violet",
      status: "locked",
      goals: [
        { id: "g6", text: "Startup: YOU", done: false, note: "Skill, Positioning, Leverage." }
      ]
    }
  ]);

  const toggleGoal = (tierIndex: number, goalIndex: number) => {
    const newTiers = [...tiers];
    const goal = newTiers[tierIndex].goals[goalIndex];
    goal.done = !goal.done;
    
    // Check if tier is complete
    const allDone = newTiers[tierIndex].goals.every(g => g.done);
    if (allDone) {
        newTiers[tierIndex].status = "completed";
        // Unlock next
        if (tierIndex + 1 < newTiers.length) {
            newTiers[tierIndex + 1].status = "in-progress";
        }
    } else {
        // If unchecking, might need to lock future tiers? 
        // For simplicity, we just toggle done state for now.
        newTiers[tierIndex].status = "in-progress";
    }

    setTiers(newTiers);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 py-8">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            2026: The Year of <span className="text-primary">Sovereignty</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Transition from <span className="text-white font-bold">Supported Talent</span> → <span className="text-white font-bold">Financially Independent Operator</span>.
        </p>
      </div>

      {/* Tiers */}
      <div className="relative space-y-24 before:absolute before:left-8 md:before:left-1/2 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent before:-z-10">
          
          {tiers.map((tier, i) => {
              const isLocked = tier.status === "locked";
              const isCompleted = tier.status === "completed";
              const Icon = tier.icon;
              const alignRight = i % 2 !== 0;

              return (
                  <motion.div 
                    key={tier.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                        "relative flex flex-col md:flex-row items-center gap-8 md:gap-16",
                        alignRight ? "md:flex-row-reverse" : ""
                    )}
                  >
                      {/* Center Node */}
                      <div className={cn(
                          "absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 flex items-center justify-center z-10 transition-all duration-500 bg-background",
                          isCompleted ? "border-primary text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]" : 
                          isLocked ? "border-border text-gray-700 bg-surface" : "border-white text-white animate-pulse"
                      )}>
                          {isCompleted ? <CheckCircle2 size={24} /> : <span className="font-black text-lg">{tier.id}</span>}
                      </div>

                      {/* Content Card */}
                      <div className={cn(
                          "w-full md:w-1/2 ml-16 md:ml-0 p-6 md:p-8 rounded-2xl border transition-all duration-500 relative overflow-hidden group",
                          isLocked ? "bg-surface/10 border-border/20 opacity-50 grayscale" : "bg-surface/40 border-border hover:border-primary/30"
                      )}>
                          {/* Background Glow */}
                          {!isLocked && (
                              <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2", 
                                tier.color === "blue" ? "bg-blue-500" :
                                tier.color === "emerald" ? "bg-emerald-500" :
                                tier.color === "amber" ? "bg-amber-500" :
                                tier.color === "rose" ? "bg-rose-500" : "bg-violet-500"
                              )} />
                          )}

                          <div className="flex items-center gap-4 mb-6">
                              <div className={cn("p-3 rounded-xl", isLocked ? "bg-white/5" : "bg-white/10 text-white")}>
                                  <Icon size={24} />
                              </div>
                              <div>
                                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Tier {tier.id}</div>
                                  <h2 className="text-2xl font-bold">{tier.title}</h2>
                              </div>
                          </div>

                          <div className="space-y-4">
                              {tier.goals.map((goal, gIndex) => (
                                  <div 
                                    key={goal.id} 
                                    onClick={() => !isLocked && toggleGoal(i, gIndex)}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                        isLocked ? "border-transparent" : "border-border/50 hover:bg-white/5",
                                        goal.done ? "bg-primary/10 border-primary/30" : ""
                                    )}
                                  >
                                      <div className={cn(
                                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                          goal.done ? "bg-primary border-primary text-white" : "border-gray-600",
                                          isLocked && "border-gray-800"
                                      )}>
                                          {goal.done && <CheckCircle2 size={14} />}
                                      </div>
                                      <div>
                                          <div className={cn("font-medium", goal.done && "text-gray-400 line-through")}>
                                              {goal.text}
                                          </div>
                                          {goal.note && (
                                              <div className="text-xs text-gray-500 mt-1">{goal.note}</div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>

                          {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-gray-800 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                      <Lock size={12} /> Locked - Complete Tier {tier.id - 1} First
                                  </div>
                              </div>
                          )}
                      </div>
                  </motion.div>
              );
          })}

      </div>
      
      {/* The Choice */}
      <div className="mt-32 p-8 md:p-12 rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-black text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-6" />
          <h3 className="text-2xl md:text-3xl font-bold mb-4">The Final Question</h3>
          <p className="text-lg text-gray-300 max-w-xl mx-auto mb-8">
              If December 31st 2026 comes and you achieved only ONE thing... would you rather it be the Camry or $5k/month stable income?
          </p>
          <div className="inline-block px-6 py-3 rounded-full bg-red-500/10 border border-red-500/50 text-red-400 font-bold uppercase tracking-widest text-sm">
              Choose Carefully
          </div>
      </div>

    </div>
  );
};
