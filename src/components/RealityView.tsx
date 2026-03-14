"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Shield, Flame, Clock, Sparkles, Edit2, Check, X, Plus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface RealityData {
  vision: string;
  mission: string;
  antiPornText: string;
  killList: string[];
  wifeVision: string;
  yearPlans: {
    1: string;
    5: string;
    10: string;
    30: string;
  };
}

const defaultData: RealityData = {
  vision: `Become a shining light, leading people to God in the world at large. Becoming a strong figure in the world that people know it's by God's power. Raise a tech empire that is built on the foundation and principles of God.`,
  mission: `I commit to being a radiant beacon of hope and faith, guiding those I encounter toward a deeper connection with God. Through my daily actions, words, and love, I aspire to inspire spiritual growth, fostering compassion, and understanding in the lives of the people I touch. My personal mission is to illuminate the path to God's love and grace, nurturing a world filled with harmony and inclusivity, one heart at a time.`,
  antiPornText: `Every time you give in to porn, you are:
• Training your brain to seek instant gratification
• Destroying your ability to connect with real people
• Weakening your discipline and willpower
• Killing your potential before it has a chance to bloom
• Choosing a temporary pleasure over a lifetime of fulfillment

The urge is a wave. You are the ocean. You don't have to react.

What you do NOW defines who you become.

Your future self is watching. Make him proud.`,
  killList: [
    "Sleep - stop oversleeping, maximize your productive hours",
    "Procrastination of work - just start, don't think",
    "Porn and masturbation - destroys your potential",
    "Over eating - discipline your body",
    "Failing to implement - execution is everything",
    "Not taking responsibility - own your life"
  ],
  wifeVision: `Who do I want as a wife:
• Prayerful - deep connection with God
• Virgin - pure before God
• Hardworking - willing to build with me
• Business driven - understands the mission
• Consistent in work, health, spirituality
• Great physical shape - takes care of her body`,
  yearPlans: {
    1: `Where do I want to be next year (24 years old):
• Set up my team
• Planning for my master's
• Investing for the future`,
    5: `Where do I want to be in 5 years time (28 years old):
• Gotten my own house
• Business should be running excellently
• Getting married by then (possibility)
• Expanded income streams`,
    10: `Where do I want to be in 10 years time (33 years old):
• Settled in with family
• Investment pools set up and can afford to not work
• Teaching others and growing`,
    30: ""
  }
};

export const RealityView = () => {
  const [data, setData] = useState<RealityData>(defaultData);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newKillItem, setNewKillItem] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("reality-data");
    if (saved) {
      try {
        setData({ ...defaultData, ...JSON.parse(saved) });
      } catch {
        setData(defaultData);
      }
    }
  }, []);

  const saveData = (newData: RealityData) => {
    setData(newData);
    localStorage.setItem("reality-data", JSON.stringify(newData));
  };

  const startEditing = (section: keyof RealityData, value: string) => {
    setEditingSection(section);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingSection) return;
    const newData = { ...data, [editingSection]: editValue };
    saveData(newData);
    setEditingSection(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditValue("");
  };

  const addKillItem = () => {
    if (!newKillItem.trim()) return;
    const newData = { ...data, killList: [...data.killList, newKillItem.trim()] };
    saveData(newData);
    setNewKillItem("");
  };

  const removeKillItem = (index: number) => {
    const newData = { ...data, killList: data.killList.filter((_, i) => i !== index) };
    saveData(newData);
  };

  const updateYearPlan = (years: number, value: string) => {
    const newData = {
      ...data,
      yearPlans: { ...data.yearPlans, [years]: value }
    };
    saveData(newData);
  };

  const SectionCard = ({ 
    title, 
    icon: Icon, 
    children, 
    accentColor = "primary",
    editable = true
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    accentColor?: string;
    editable?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/50 border border-white/5 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            accentColor === "primary" && "bg-primary/20 text-primary",
            accentColor === "red" && "bg-red-500/20 text-red-500",
            accentColor === "green" && "bg-green-500/20 text-green-500",
            accentColor === "purple" && "bg-purple-500/20 text-purple-500",
            accentColor === "pink" && "bg-pink-500/20 text-pink-500",
            accentColor === "orange" && "bg-orange-500/20 text-orange-500"
          )}>
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Vision & Mission */}
      <div className="grid md:grid-cols-2 gap-6">
        <SectionCard title="My Vision" icon={Eye} accentColor="primary">
          {editingSection === "vision" ? (
            <div className="space-y-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-gray-300 focus:border-primary/50 focus:outline-none resize-none"
                placeholder="What do you see for your future?"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm flex items-center gap-1"><Check size={14} /> Save</button>
                <button onClick={cancelEdit} className="px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg text-sm flex items-center gap-1"><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => startEditing("vision", data.vision)} className={cn("cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors", !data.vision && "text-gray-500 italic")}>
              {data.vision || "Click to add your vision..."}
            </div>
          )}
        </SectionCard>

        <SectionCard title="My Mission" icon={Target} accentColor="green">
          {editingSection === "mission" ? (
            <div className="space-y-3">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-gray-300 focus:border-green-500/50 focus:outline-none resize-none"
                placeholder="What is your purpose?"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm flex items-center gap-1"><Check size={14} /> Save</button>
                <button onClick={cancelEdit} className="px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg text-sm flex items-center gap-1"><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => startEditing("mission", data.mission)} className={cn("cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors", !data.mission && "text-gray-500 italic")}>
              {data.mission || "Click to add your mission..."}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Year Plans */}
      <SectionCard title="My Plan" icon={Clock} accentColor="purple">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { years: 1, label: "1 Year (24)", color: "bg-blue-500" },
            { years: 5, label: "5 Years (28)", color: "bg-green-500" },
            { years: 10, label: "10 Years (33)", color: "bg-purple-500" },
            { years: 30, label: "30 Years", color: "bg-orange-500" }
          ].map(({ years, label, color }) => (
            <div key={years} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-sm font-medium text-gray-400">{label}</span>
              </div>
              {editingSection === `yearPlan-${years}` ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-24 bg-black/20 border border-white/10 rounded-xl p-3 text-gray-300 focus:border-purple-500/50 focus:outline-none resize-none text-sm"
                    placeholder={`What do you want to achieve in ${years} years?`}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { updateYearPlan(years, editValue); setEditingSection(null); setEditValue(""); }} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm flex items-center gap-1"><Check size={14} /> Save</button>
                    <button onClick={cancelEdit} className="px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg text-sm flex items-center gap-1"><X size={14} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => { setEditingSection(`yearPlan-${years}`); setEditValue(data.yearPlans[years as keyof typeof data.yearPlans]); }}
                  className={cn("cursor-pointer hover:bg-white/5 p-3 -m-2 rounded-xl transition-colors text-sm min-h-[80px]", !data.yearPlans[years as keyof typeof data.yearPlans] && "text-gray-500 italic")}
                >
                  {data.yearPlans[years as keyof typeof data.yearPlans] || `Click to add your ${years}-year plan...`}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Anti-Porn Urge Text */}
      <SectionCard title="When the Urge Hits" icon={Shield} accentColor="red">
        {editingSection === "antiPornText" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-3 text-gray-300 focus:border-red-500/50 focus:outline-none resize-none"
              placeholder="Write something that will remind you why you need to stay strong..."
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm flex items-center gap-1"><Check size={14} /> Save</button>
              <button onClick={cancelEdit} className="px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg text-sm flex items-center gap-1"><X size={14} /> Cancel</button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => startEditing("antiPornText", data.antiPornText)}
            className="cursor-pointer hover:bg-white/5 p-3 -m-2 rounded-xl transition-colors text-gray-300 leading-relaxed whitespace-pre-line"
          >
            {data.antiPornText}
          </div>
        )}
      </SectionCard>

      {/* Kill List */}
      <SectionCard title="Kill These or They Kill You" icon={Flame} accentColor="orange">
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">Bad habits, mindsets, or behaviors you must eliminate NOW:</p>
          
          <div className="space-y-2">
            {data.killList.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={index}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="flex-1 text-gray-200">{item}</span>
                <button onClick={() => removeKillItem(index)} className="p-1 text-gray-500 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newKillItem}
              onChange={(e) => setNewKillItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKillItem()}
              placeholder="Add something to kill..."
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-gray-300 focus:border-orange-500/50 focus:outline-none"
            />
            <button 
              onClick={addKillItem}
              disabled={!newKillItem.trim()}
              className="px-4 py-2 bg-orange-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Future Wife Vision */}
      <SectionCard title="Vision for My Future Wife" icon={Heart} accentColor="pink">
        {editingSection === "wifeVision" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-3 text-gray-300 focus:border-pink-500/50 focus:outline-none resize-none"
              placeholder="Describe the woman you want to build a life with..."
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-sm flex items-center gap-1"><Check size={14} /> Save</button>
              <button onClick={cancelEdit} className="px-3 py-1.5 bg-white/10 text-gray-400 rounded-lg text-sm flex items-center gap-1"><X size={14} /> Cancel</button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => startEditing("wifeVision", data.wifeVision)}
            className={cn("cursor-pointer hover:bg-white/5 p-3 -m-2 rounded-xl transition-colors text-gray-300 leading-relaxed", !data.wifeVision && "text-gray-500 italic")}
          >
            {data.wifeVision || "Click to describe your future wife..."}
          </div>
        )}
      </SectionCard>

      <p className="text-center text-xs text-gray-600 pt-4">
        <Sparkles size={12} className="inline mr-1" />
        All data is stored locally on your device
      </p>
    </div>
  );
};
