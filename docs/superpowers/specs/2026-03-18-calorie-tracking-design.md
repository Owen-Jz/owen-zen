# Calorie Tracking Feature Design

**Date:** 2026-03-18
**Feature:** Daily Calorie Tracking with AI Analysis

## Overview

A simple calorie tracking system where users can log food items throughout the day in free-form text, then analyze them with the Minimax AI API to get total calorie count.

## Data Model

```typescript
interface FoodEntry {
  _id: ObjectId
  date: Date // normalized to midnight
  items: string[] // raw food items user typed
  totalCalories: number | null // null = not yet analyzed
  analyzedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### POST /api/food
- **Purpose:** Save food entry for today
- **Body:** `{ items: string[] }`
- **Behavior:** Creates new entry or appends to today's existing entry

### POST /api/food/analyze
- **Purpose:** Analyze today's food with Minimax AI
- **Behavior:** Calls Minimax API with all items, stores total calories, returns result

### GET /api/food
- **Purpose:** Get today's food entry
- **Query:** `?date=YYYY-MM-DD` (defaults to today)

### DELETE /api/food/:id
- **Purpose:** Delete a food entry

## UI Components

### FoodTrackerView
- **Header:** Title with flame icon
- **Input Area:** Textarea for free-form entry (placeholder: "Breakfast: 2 eggs, toast...")
- **Add Button:** Saves entry to database
- **Items List:** Shows added items with delete (x) button
- **Analyze Button:** Calls AI to get total calories (disabled if no items)
- **Results Display:**
  - Large calorie number
  - Progress bar showing % of 2000 target
  - Color coding: green (<90%), yellow (90-110%), red (>110%)

## AI Integration

### Prompt Template
```
Analyze the following food items and estimate total calories. Return only the total number, nothing else.

Items: [comma-separated list]
```

### Response Handling
- Parse response as integer
- Store in `totalCalories`
- Set `analyzedAt` timestamp

## Visual Design

- **Color Palette:**
  - Primary: orange-500 (flame/calories theme)
  - Success: emerald-500 (under target)
  - Warning: yellow-500 (near target)
  - Danger: red-500 (over target)
- **Layout:** Single column, mobile-friendly
- **Animations:** Subtle fade-in for results

## Acceptance Criteria

1. User can add food items via free-form text
2. Items persist to MongoDB
3. User can delete individual items
4. "Analyze" button triggers Minimax API call
5. Total calories display with visual feedback (under/near/over 2000)
6. Works across multiple days (each day separate)
