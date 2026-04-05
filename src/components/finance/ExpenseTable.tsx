"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpDown, Eye, Edit, Trash2
} from "lucide-react";
import { clsx } from "clsx";

interface Expense {
  _id: string;
  amount: number;
  categoryId: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  };
  date: string;
  note?: string;
  highlightedNote?: string;
}

interface ExpenseTableProps {
  expenses: Expense[];
  loading?: boolean;
  onView?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  onPageChange?: (page: number) => void;
}

type SortField = "date" | "amount" | "categoryId";
type SortOrder = "asc" | "desc";

export function ExpenseTable({
  expenses,
  loading = false,
  onView,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}: ExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortField === "categoryId") {
        comparison = (a.categoryId?.name || "").localeCompare(b.categoryId?.name || "");
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [expenses, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-600" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp size={14} className="text-primary" />
    ) : (
      <ChevronDown size={14} className="text-primary" />
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to escape HTML and prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const renderHighlightedNote = (note: string | undefined, highlighted: string | undefined) => {
    if (!note && !highlighted) return <span className="text-gray-500">-</span>;
    if (highlighted) {
      return (
        <span
          dangerouslySetInnerHTML={{ __html: escapeHtml(highlighted) }}
          className="text-gray-300"
        />
      );
    }
    return <span className="text-gray-300">{note}</span>;
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-white/5 border-b border-border" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-border/50 flex items-center px-4 gap-4">
              <div className="h-4 w-20 bg-white/5 rounded" />
              <div className="h-4 w-24 bg-white/5 rounded" />
              <div className="h-4 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-gray-500">No expenses found</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-white/5">
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-2">
                  Date <SortIcon field="date" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("categoryId")}
              >
                <div className="flex items-center gap-2">
                  Category <SortIcon field="categoryId" />
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-2">
                  Amount <SortIcon field="amount" />
                </div>
              </th>
              {(onView || onEdit || onDelete) && (
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedExpenses.map((expense, index) => (
                <motion.tr
                  key={expense._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border/50 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: expense.categoryId?.color || 'var(--gray-500)' }}
                      />
                      <span className="text-sm text-gray-300">
                        {expense.categoryId?.icon} {expense.categoryId?.name || "Uncategorized"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                    {renderHighlightedNote(expense.note, expense.highlightedNote)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-white whitespace-nowrap">
                    {formatAmount(expense.amount)}
                  </td>
                  {(onView || onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button
                            onClick={() => onView(expense)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(expense)}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(expense)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-white/5">
          <div className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-border text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="p-2 rounded-lg border border-border text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseTable;
