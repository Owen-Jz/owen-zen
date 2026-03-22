# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Owen Zen is a personal productivity dashboard built with Next.js 16 App Router. It integrates task management, habit tracking, finance tracking, gym sessions, content calendar, and various productivity widgets into a single minimal interface.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Vitest with React Testing Library (jsdom environment)
- **Styling**: Tailwind CSS v4 (CSS-based, no config file)
- **State**: React Query for server state, React Context for UI state
- **Animations**: Framer Motion
- **PWA**: Service worker for offline support

## Common Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run Vitest tests
npm run test:coverage # Run tests with coverage (requires 90% thresholds)
```

## Architecture

### API Routes (`src/app/api/`)

Next.js App Router route handlers following the pattern:
- `GET` - List/fetch resources
- `POST` - Create new resources
- `PUT` - Update/reorder resources (including batch updates)
- `DELETE` - Remove resources

Dynamic routes use `[id]` syntax (e.g., `api/tasks/[id]/route.ts`). Route handlers must be `async` and call `dbConnect()` before any database operation.

### Database Connection (`src/lib/db.ts`)

Singleton MongoDB connection using Mongoose with global caching to prevent connection growth during hot reloads. Always import and call `dbConnect()` at the start of route handlers.

### Mongoose Models (`src/models/`)

Each domain has its own model file. Models use the pattern:
```typescript
export default mongoose.models.ModelName || mongoose.model('ModelName', Schema);
```

Key models: `Task`, `Habit`, `Goal`, `Board`, `Project`, `GymSession`, `FinanceCategory`, `Budget`, `Expense`, `Income`, `FoodEntry`, `WeeklyGoal`, `Note`, `Prompt`, `ContentPost`, `InboxItem`, `BucketListItem`, `QuickLink`, `Lead`, `Notification`, `Calendar`, `Post`, `Integration`, `WeeklyHabit`, `PomodoroState`

### Test Setup (`src/test/setup.ts`)

Vitest setup file with mocks for:
- Next.js navigation hooks
- MongoDB connection (`@/lib/db`)
- localStorage
- matchMedia

Tests use `describe`, `it`, `expect` globals and import from `@testing-library/react`.

## Key Conventions

- **Path alias**: `@/` maps to `src/` (configured in `tsconfig.json` and `vitest.config.ts`)
- **Component imports**: Components use `clsx`/`tailwind-merge` for conditional classes
- **API responses**: Always return `{ success: boolean, data?: any, error?: any }` with appropriate HTTP status codes
- **Validation**: Mongoose schema validators with custom error messages
- **Timestamps**: Use `createdAt` auto-set, manually track `completedAt`, `scheduledDate`, `dueDate`
