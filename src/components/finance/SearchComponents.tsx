"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Filter, Calendar, DollarSign, ChevronDown,
  SlidersHorizontal, RotateCcw
} from "lucide-react";
import { clsx } from "clsx";

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface ExpenseSearchProps {
  onSearch: (query: SearchParams) => void;
  categories: Category[];
  debounceMs?: number;
}

export interface SearchParams {
  q?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  booleanOperator?: "AND" | "OR";
  page?: string;
  limit?: string;
}

export function ExpenseSearch({ onSearch, categories, debounceMs = 300 }: ExpenseSearchProps) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchParams>({
    booleanOperator: "AND",
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({ ...filters, q: query || undefined });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, filters, debounceMs, onSearch]);

  const clearFilters = () => {
    setQuery("");
    setFilters({ booleanOperator: "AND" });
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== "AND" && v !== "20"
  );

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search expenses by description, amount, or date..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            showFilters || hasActiveFilters
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-surface border border-border text-gray-400 hover:text-white"
          )}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
              {Object.values(filters).filter((v) => v && v !== "AND" && v !== "20").length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-surface border border-border text-gray-400 hover:text-red-400 transition-colors"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        )}

        {/* Boolean Operator Toggle */}
        {showFilters && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-gray-500 mr-2">Match:</span>
            {(["AND", "OR"] as const).map((op) => (
              <button
                key={op}
                onClick={() => setFilters({ ...filters, booleanOperator: op })}
                className={clsx(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  filters.booleanOperator === op
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {op}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-surface/50 border border-border rounded-xl">
              {/* Category Filter */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                <select
                  value={filters.categoryId || ""}
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">Amount Range</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.amountMin || ""}
                      onChange={(e) => setFilters({ ...filters, amountMin: e.target.value || undefined })}
                      className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.amountMax || ""}
                      onChange={(e) => setFilters({ ...filters, amountMax: e.target.value || undefined })}
                      className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Category Filter Component
interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          selected === null
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-surface border border-border text-gray-400 hover:text-white"
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onSelect(cat._id)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            selected === cat._id
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-surface border border-border text-gray-400 hover:text-white"
          )}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

// Date Range Picker
interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  presets?: { label: string; days: number }[];
}

export function DateRangePicker({ from, to, onChange, presets = [] }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onChange(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Calendar size={16} />
        {from && to ? `${from} - ${to}` : "Select dates"}
        <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-surface border border-border rounded-xl p-3 z-50 min-w-[250px] shadow-xl">
          {/* Manual Input */}
          <div className="space-y-2 mb-3">
            <input
              type="date"
              value={from}
              onChange={(e) => onChange(e.target.value, to)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => onChange(from, e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Presets */}
          {presets.length > 0 && (
            <>
              <div className="border-t border-border pt-3">
                <div className="text-xs text-gray-500 mb-2">Quick Select</div>
                <div className="flex flex-wrap gap-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.days}
                      onClick={() => handlePreset(preset.days)}
                      className="px-2 py-1 bg-background rounded text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ExpenseSearch;
