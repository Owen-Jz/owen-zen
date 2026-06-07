'use client';

import { WeeklyReviewView } from '@/components/WeeklyReviewView';

// The Weekly Review is also reachable as an in-app tab (?tab=weekly-review);
// this standalone route renders the same view for direct links/bookmarks.
export default function WeeklyReviewPage() {
    return <WeeklyReviewView />;
}
