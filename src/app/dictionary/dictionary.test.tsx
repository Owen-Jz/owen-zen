import { describe, it, expect } from 'vitest';
import {
  filterTerms,
  groupTermsByCategory,
  CATEGORIES,
  CATEGORY_COLORS,
  type Category,
  type Term,
} from '@/lib/dict';

// ---------------------------------------------------------------------------
// Data-layer tests
// ---------------------------------------------------------------------------

describe('ALL_TERMS data integrity', () => {
  it('has 235 terms', () => {
    // Dynamic import so we only pay the cost once
    return import('@/lib/dict').then((mod) => {
      const terms: Term[] = (mod as any).ALL_TERMS;
      expect(terms.length).toBe(235);
    });
  });

  it('every term has term, category, and definition', () => {
    return import('@/lib/dict').then((mod) => {
      const terms: Term[] = (mod as any).ALL_TERMS;
      for (const t of terms) {
        expect(typeof t.term).toBe('string');
        expect(t.term.length).toBeGreaterThan(0);
        expect(typeof t.category).toBe('string');
        expect(CATEGORIES.includes(t.category as Category)).toBe(true);
        expect(typeof t.definition).toBe('string');
        expect(t.definition.length).toBeGreaterThan(0);
      }
    });
  });

  it('every example is a string when present', () => {
    return import('@/lib/dict').then((mod) => {
      const terms: Term[] = (mod as any).ALL_TERMS;
      for (const t of terms) {
        if (t.example !== undefined) {
          expect(typeof t.example).toBe('string');
        }
      }
    });
  });

  it('term names are unique (no duplicate term strings)', () => {
    return import('@/lib/dict').then((mod) => {
      const terms: Term[] = (mod as any).ALL_TERMS;
      const names = terms.map((t) => t.term);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });
});

// ---------------------------------------------------------------------------
// Lookup / filter logic
// ---------------------------------------------------------------------------

describe('filterTerms', () => {
  // Shared term set built from the exported ALL_TERMS
  let allTerms: Term[] = [];

  beforeAll(async () => {
    const mod = await import('@/lib/dict');
    allTerms = (mod as any).ALL_TERMS as Term[];
  });

  it('returns all terms when search is empty and category is "All"', () => {
    const result = filterTerms(allTerms, '', 'All');
    expect(result.length).toBe(allTerms.length);
  });

  it('filters by term name (case-insensitive)', () => {
    const result = filterTerms(allTerms, 'rag', 'All');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.term.toLowerCase().includes('rag'))).toBe(true);
  });

  it('filters by definition text (case-insensitive)', () => {
    // "neural network" appears in definitions but not term names
    const result = filterTerms(allTerms, 'neural network', 'All');
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by example text when present and matching', () => {
    // "sign up" appears only in examples
    const result = filterTerms(allTerms, 'sign up', 'All');
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (t) =>
          t.term.toLowerCase().includes('sign up') ||
          t.definition.toLowerCase().includes('sign up') ||
          (t.example?.toLowerCase().includes('sign up') ?? false)
      )
    ).toBe(true);
  });

  it('finds a term by exact term name', () => {
    const result = filterTerms(allTerms, 'RAG', 'All');
    expect(result.some((t) => t.term.toLowerCase() === 'rag')).toBe(true);
  });

  it('returns empty array when no terms match', () => {
    const result = filterTerms(allTerms, 'xyznonexistent123', 'All');
    expect(result.length).toBe(0);
  });

  it('filters by category alone (no search)', () => {
    const result = filterTerms(allTerms, '', 'LLM Concepts');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.category === 'LLM Concepts')).toBe(true);
  });

  it('filters by category and search together', () => {
    const result = filterTerms(allTerms, 'token', 'LLM Concepts');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.category === 'LLM Concepts')).toBe(true);
    expect(
      result.every(
        (t) =>
          t.term.toLowerCase().includes('token') ||
          t.definition.toLowerCase().includes('token') ||
          (t.example?.toLowerCase().includes('token') ?? false)
      )
    ).toBe(true);
  });

  it('trims whitespace from search query', () => {
    const result = filterTerms(allTerms, '  prompt  ', 'All');
    expect(result.length).toBeGreaterThan(0);
  });

  it('treats empty-string search as "no filter" (show all in category)', () => {
    const r1 = filterTerms(allTerms, '', 'All');
    const r2 = filterTerms(allTerms, '         ', 'All');
    expect(r1.length).toBe(r2.length);
  });
});

// ---------------------------------------------------------------------------
// Grouping logic
// ---------------------------------------------------------------------------

describe('groupTermsByCategory', () => {
  let allTerms: Term[] = [];

  beforeAll(async () => {
    const mod = await import('@/lib/dict');
    allTerms = (mod as any).ALL_TERMS as Term[];
  });

  it('groups all 235 terms under "All" filter', () => {
    const filtered = filterTerms(allTerms, '', 'All');
    const grouped = groupTermsByCategory(filtered, 'All');
    const total = Object.values(grouped).flat().length;
    expect(total).toBe(235);
  });

  it('returns null when category is not "All"', () => {
    const filtered = filterTerms(allTerms, '', 'LLM Concepts');
    const grouped = groupTermsByCategory(filtered, 'LLM Concepts');
    expect(grouped).toBeNull();
  });

  it('includes every category key that has terms', () => {
    const filtered = filterTerms(allTerms, '', 'All');
    const grouped = groupTermsByCategory(filtered, 'All');
    for (const key of Object.keys(grouped!)) {
      expect(grouped![key as Category]?.length).toBeGreaterThan(0);
    }
  });

  it('never duplicates a term across categories', () => {
    const filtered = filterTerms(allTerms, '', 'All');
    const grouped = groupTermsByCategory(filtered, 'All');
    const allFlat = Object.values(grouped as Partial<Record<string, Term[]>>).flat();
    const unique = new Set(allFlat.map((t) => t.term));
    expect(unique.size).toBe(allFlat.length);
  });

  it('returns an empty object for an empty term list', () => {
    const grouped = groupTermsByCategory([], 'All');
    expect(Object.keys(grouped!).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Category constants
// ---------------------------------------------------------------------------

describe('CATEGORIES', () => {
  it('has exactly 10 categories', () => {
    expect(CATEGORIES).toHaveLength(10);
  });

  it('contains expected categories', () => {
    expect(CATEGORIES).toContain('AI & ML Fundamentals');
    expect(CATEGORIES).toContain('Prompt Engineering');
    expect(CATEGORIES).toContain('LLM Concepts');
    expect(CATEGORIES).toContain('Business Strategy');
    expect(CATEGORIES).toContain('AI Safety & Ethics');
  });
});

describe('CATEGORY_COLORS', () => {
  it('has a color entry for every category', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_COLORS[cat]).toBeDefined();
      expect(typeof CATEGORY_COLORS[cat]).toBe('string');
    }
  });

  it('every color entry is a non-empty string', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_COLORS[cat]!.length).toBeGreaterThan(0);
    }
  });
});
