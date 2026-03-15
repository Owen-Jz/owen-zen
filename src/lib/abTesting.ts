"use client";

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-1, probability of being selected
}

export interface ABTestEngagement {
  testId: string;
  variantId: string;
  event: 'view' | 'hover' | 'filter' | 'export' | 'click';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  views: number;
  engagements: number;
  avgHoverTime: number;
}

// Simple hash function for deterministic assignment
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

class ABTestingManager {
  private storageKey = 'zen_ab_tests';
  private engagementKey = 'zen_ab_engagement';

  // Get or create test assignments
  getVariant(testId: string, variants: ABTestVariant[]): string {
    if (typeof window === 'undefined') return variants[0]?.id || 'control';

    const storage = this.getStorage();

    // Check if user already has an assignment
    if (storage[testId]) {
      return storage[testId];
    }

    // Assign new variant based on hash
    const userId = this.getUserId();
    const hash = hashString(`${testId}-${userId}`);
    const random = hash / 2147483647; // Normalize to 0-1

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        storage[testId] = variant.id;
        this.setStorage(storage);
        this.trackEngagement(testId, variant.id, 'view');
        return variant.id;
      }
    }

    // Fallback to first variant
    storage[testId] = variants[0]?.id || 'control';
    this.setStorage(storage);
    this.trackEngagement(testId, storage[testId], 'view');
    return storage[testId];
  }

  private getUserId(): string {
    if (typeof window === 'undefined') return 'server';

    let userId = localStorage.getItem('zen_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('zen_user_id', userId);
    }
    return userId;
  }

  private getStorage(): Record<string, string> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setStorage(data: Record<string, string>) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Storage not available
    }
  }

  // Track engagement events
  trackEngagement(
    testId: string,
    variantId: string,
    event: ABTestEngagement['event'],
    metadata?: Record<string, any>
  ) {
    if (typeof window === 'undefined') return;

    const storage = this.getEngagementStorage();
    const key = `${testId}-${variantId}`;

    if (!storage[key]) {
      storage[key] = {
        testId,
        variantId,
        events: [],
        hoverStartTime: 0,
        totalHoverTime: 0
      };
    }

    const entry = storage[key];

    if (event === 'hover') {
      entry.hoverStartTime = Date.now();
    } else if (event === 'view' && entry.hoverStartTime > 0) {
      entry.totalHoverTime += Date.now() - entry.hoverStartTime;
      entry.hoverStartTime = 0;
    }

    entry.events.push({
      event,
      timestamp: Date.now(),
      metadata
    } as ABTestEngagement);

    this.setEngagementStorage(storage);
  }

  private getEngagementStorage(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.engagementKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private setEngagementStorage(data: Record<string, any>) {
    try {
      localStorage.setItem(this.engagementKey, JSON.stringify(data));
    } catch {
      // Storage not available
    }
  }

  // Get analytics for a test
  getTestResults(testId: string): ABTestResult[] {
    const storage = this.getEngagementStorage();
    const results: ABTestResult[] = [];

    Object.values(storage).forEach((entry: any) => {
      if (entry.testId === testId) {
        const events = entry.events || [];
        const views = events.filter((e: any) => e.event === 'view').length;
        const engagements = events.filter((e: any) =>
          ['hover', 'filter', 'export', 'click'].includes(e.event)
        ).length;

        results.push({
          testId: entry.testId,
          variantId: entry.variantId,
          views,
          engagements,
          avgHoverTime: entry.totalHoverTime / Math.max(1, views)
        });
      }
    });

    return results;
  }

  // Clear all test data
  clearTests() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.engagementKey);
  }
}

// Singleton instance
export const abTesting = new ABTestingManager();

// Predefined tests
export const analyticsTests = {
  chartLayout: {
    id: 'chart_layout',
    name: 'Chart Layout',
    variants: [
      { id: 'stacked', name: 'Stacked Cards', weight: 0.5 },
      { id: 'grid', name: 'Grid Layout', weight: 0.5 }
    ]
  },
  heatmapStyle: {
    id: 'heatmap_style',
    name: 'Heatmap Style',
    variants: [
      { id: 'github', name: 'GitHub Style', weight: 0.5 },
      { id: 'calendar', name: 'Calendar View', weight: 0.5 }
    ]
  }
};
