"use client";

import { useState, useMemo } from "react";
import { Search, ArrowLeft, X } from "lucide-react";
import {
  filterTerms,
  groupTermsByCategory,
  CATEGORIES,
  CATEGORY_COLORS,
  type Category,
  type Term,
  ALL_TERMS,
} from "@/lib/dict";

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const filtered = useMemo(
    () => filterTerms(ALL_TERMS, search, activeCategory),
    [search, activeCategory]
  );

  const grouped = useMemo(
    () => groupTermsByCategory(filtered, activeCategory),
    [filtered, activeCategory]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4 mb-5">
            <a
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Dashboard
            </a>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <h1 className="text-xl font-bold text-white">AI Prompting Dictionary</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {ALL_TERMS.length} terms across {CATEGORIES.length} categories
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms, definitions..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/25 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveCategory("All")}
```javascript
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeCategory === "All"
                  ? "bg-white/15 text-white border-white/20"
                  : "text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10"
              }`}
            >
              All ({ALL_TERMS.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = ALL_TERMS.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    activeCategory === cat
                      ? `${CATEGORY_COLORS[cat]} font-semibold`
                      : "text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <p className="text-lg">No terms match &ldquo;{search}&rdquo;</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : activeCategory !== "All" ? (
          <TermGrid terms={filtered} />
        ) : (
          <div className="space-y-12">
            {CATEGORIES.map((cat) => {
              const terms = grouped?.[cat];
              if (!terms || terms.length === 0) return null;
              return (
                <section key={cat}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">{cat}</h2>
                    <span className={`px-2 py-0.5 rounded-md text-xs border ${CATEGORY_COLORS[cat]}`}>
                      {terms.length}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <TermGrid terms={terms} />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TermGrid({ terms }: { terms: Term[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {terms.map((term) => (
        <TermCard key={term.term} term={term} />
      ))}
    </div>
  );
}

function TermCard({ term }: { term: Term }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-white text-sm leading-tight">{term.term}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${CATEGORY_COLORS[term.category]}`}>
          {term.category.split(" ")[0]}
        </span>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{term.definition}</p>
      {term.example && (
        <p className="mt-2 text-gray-600 text-xs italic leading-relaxed border-t border-white/5 pt-2">
          {term.example}
        </p>
      )}
    </div>
  );
}
