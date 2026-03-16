import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  calculatePercentageChange,
  calculateDailyAverage,
  calculateWeeklyAverage,
  calculateBudgetVariance,
  detectSpendingSpikes,
  projectMonthEnd,
  calculateAverageTransactionSize,
  exportToCSV,
} from '@/lib/financeAnalytics';

describe('financeAnalytics', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toContain('1,000');
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate positive change', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it('should calculate negative change', () => {
      expect(calculatePercentageChange(75, 100)).toBe(-25);
    });

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
    });
  });

  describe('calculateDailyAverage', () => {
    it('should calculate daily average correctly', () => {
      expect(calculateDailyAverage(300, 10)).toBe(30);
    });

    it('should return 0 for zero days', () => {
      expect(calculateDailyAverage(300, 0)).toBe(0);
    });
  });

  describe('calculateWeeklyAverage', () => {
    it('should calculate weekly average from daily', () => {
      expect(calculateWeeklyAverage(30)).toBe(210);
    });
  });

  describe('calculateBudgetVariance', () => {
    it('should calculate under budget correctly', () => {
      const result = calculateBudgetVariance(800, 1000);
      expect(result.isOverBudget).toBe(false);
      expect(result.remaining).toBe(200);
      expect(result.percentageUsed).toBe(80);
    });

    it('should calculate over budget correctly', () => {
      const result = calculateBudgetVariance(1200, 1000);
      expect(result.isOverBudget).toBe(true);
      expect(result.isWarning).toBe(true);
      expect(result.percentageUsed).toBe(120);
    });

    it('should set warning at 80% threshold', () => {
      const result = calculateBudgetVariance(805, 1000);
      expect(result.isWarning).toBe(true);
    });
  });

  describe('detectSpendingSpikes', () => {
    it('should detect spikes above threshold', () => {
      const expenses = [100, 100, 100, 500, 100, 100];
      const result = detectSpendingSpikes(expenses, 1.5);
      expect(result[3].isSpike).toBe(true);
    });

    it('should not flag normal expenses', () => {
      const expenses = [100, 110, 90, 100];
      const result = detectSpendingSpikes(expenses, 1.5);
      expect(result.every(r => !r.isSpike)).toBe(true);
    });
  });

  describe('projectMonthEnd', () => {
    it('should project month end correctly', () => {
      const result = projectMonthEnd(500, 15, 30);
      expect(result.estimatedTotal).toBeCloseTo(1000);
      expect(result.confidenceLevel).toBe('high');
    });

    it('should handle low confidence for early month', () => {
      const result = projectMonthEnd(100, 3, 30);
      expect(result.confidenceLevel).toBe('low');
    });
  });

  describe('calculateAverageTransactionSize', () => {
    it('should calculate average correctly', () => {
      const expenses = [
        { _id: '1', amount: 100, categoryId: {} as any, date: new Date(), createdAt: new Date() },
        { _id: '2', amount: 200, categoryId: {} as any, date: new Date(), createdAt: new Date() },
        { _id: '3', amount: 300, categoryId: {} as any, date: new Date(), createdAt: new Date() },
      ];
      expect(calculateAverageTransactionSize(expenses)).toBe(200);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAverageTransactionSize([])).toBe(0);
    });
  });

  describe('exportToCSV', () => {
    it('should generate valid CSV', () => {
      const expenses = [
        {
          _id: '1',
          amount: 100,
          categoryId: { _id: 'cat1', name: 'Food', color: '#f00', icon: '🍔' },
          date: '2024-01-15',
          note: 'Lunch',
          createdAt: new Date(),
        },
      ];
      const csv = exportToCSV(expenses);
      expect(csv).toContain('Date,Amount,Category,Note');
      expect(csv).toContain('100');
      expect(csv).toContain('Food');
    });
  });
});
