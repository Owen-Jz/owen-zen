"use client";

import React from 'react';
import { ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';

export const chartColors = {
  primary: '#dc2626',
  primaryLight: '#f87171',
  secondary: '#3b82f6',
  secondaryLight: '#60a5fa',
  tertiary: '#8b5cf6',
  quaternary: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export const cardGlassClass = "bg-surface/40 backdrop-blur-md border border-white/5 rounded-2xl p-6";

export const sectionTitleClass = "text-lg font-bold text-white flex items-center gap-2 mb-4";

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.name.includes('Rate') || entry.name.includes('rate') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const gridConfig = {
  strokeDasharray: "3 3",
  stroke: chartColors.gray[700]
};

export const axisConfig = {
  stroke: chartColors.gray[500],
  fontSize: 11,
  tickLine: false,
  axisLine: false
};

// Heatmap color scales
export const heatmapColors = [
  '#1f2937', // 0% - empty
  '#3b2626', // 25% - low
  '#7f1d1d', // 50% - medium
  '#dc2626', // 75% - high
  '#ef4444'  // 100% - perfect
];

export const getHeatmapColor = (value: number, max: number): string => {
  if (max === 0 || value === 0) return heatmapColors[0];
  const ratio = value / max;
  if (ratio <= 0.25) return heatmapColors[1];
  if (ratio <= 0.5) return heatmapColors[2];
  if (ratio <= 0.75) return heatmapColors[3];
  return heatmapColors[4];
};

// Category colors
export const categoryColors: Record<string, string> = {
  health: '#22c55e',
  work: '#3b82f6',
  learning: '#8b5cf6',
  mindset: '#f59e0b',
  other: '#6b7280'
};

// Trend indicator colors
export const trendColors = {
  up: '#22c55e',
  down: '#ef4444',
  stable: '#6b7280'
};

// Export helper
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Print helper for PDF export
export const printReport = (title: string = 'Habit Analytics Report') => {
  window.print();
};
