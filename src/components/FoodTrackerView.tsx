"use client";

import { Flame, Plus, Trash2, Loader2, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface FoodEntry {
  _id: string;
  date: string;
  items: string[];
  totalCalories: number | null;
  analyzedAt: string | null;
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function FoodTrackerView() {
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchFoodEntry(today);
  }, [today]);

  const fetchFoodEntry = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/food?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntry(data);
      }
    } catch (err) {
      console.error("Failed to fetch food entry:", err);
    } finally {
      setLoading(false);
    }
  };

  const addItems = async () => {
    if (!inputText.trim()) return;

    const items = inputText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, date: today }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry(data);
        setInputText("");
      }
    } catch (err) {
      setError("Failed to add items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemToDelete: string) => {
    if (!entry) return;

    const newItems = entry.items.filter((item) => item !== itemToDelete);

    if (newItems.length === 0) {
      // Delete the entire entry if no items left
      await deleteEntry();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/food/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry(data);
      }
    } catch (err) {
      setError("Failed to delete item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async () => {
    if (!entry) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/food/${entry._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEntry(null);
      }
    } catch (err) {
      setError("Failed to delete entry");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFood = async () => {
    if (!entry || entry.items.length === 0) return;

    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/food/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry(data);
      } else {
        setError("Failed to analyze food");
      }
    } catch (err) {
      setError("Failed to analyze food");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getCalorieColor = (calories: number) => {
    const percentage = (calories / 2000) * 100;
    if (percentage < 90) return "text-emerald-500";
    if (percentage <= 110) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (calories: number) => {
    const percentage = (calories / 2000) * 100;
    if (percentage < 90) return "bg-emerald-500";
    if (percentage <= 110) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressWidth = (calories: number) => {
    const percentage = Math.min((calories / 2000) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Food Tracker</h1>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="bg-surface border border-white/10 rounded-xl p-4 mb-6">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Breakfast: 2 eggs, toast... (comma-separated)"
          className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none resize-none"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              addItems();
            }
          }}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={addItems}
            disabled={loading || !inputText.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium",
              loading && "opacity-50"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Items
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !entry && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        </div>
      )}

      {/* Items List */}
      {entry && entry.items.length > 0 && (
        <div className="bg-surface border border-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today&apos;s Items</h3>
          <div className="space-y-2">
            {entry.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-white">{item}</span>
                <button
                  onClick={() => deleteItem(item)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={analyzeFood}
            disabled={analyzing}
            className={cn(
              "w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white rounded-lg transition-all font-medium",
              analyzing && "opacity-70"
            )}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                Analyze Calories
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Display */}
      {entry && entry.totalCalories !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-white/10 rounded-xl p-6"
        >
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-2">Total Calories</p>
            <p className={cn("text-6xl font-bold", getCalorieColor(entry.totalCalories))}>
              {entry.totalCalories}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Daily Goal</span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                2000
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", getProgressColor(entry.totalCalories))}
                style={{ width: getProgressWidth(entry.totalCalories) }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {Math.round((entry.totalCalories / 2000) * 100)}% of daily goal
            </p>
          </div>

          {entry.analyzedAt && (
            <p className="text-center text-xs text-gray-500">
              Analyzed at {new Date(entry.analyzedAt).toLocaleTimeString()}
            </p>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {entry && entry.items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Flame className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No food items logged today</p>
          <p className="text-sm mt-1">Add items above to start tracking</p>
        </div>
      )}
    </div>
  );
}
