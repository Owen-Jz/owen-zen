# Marketing Department - Design Specification

## Overview
A comprehensive marketing hub on the Owen Zen dashboard that consolidates all marketing activities into one organized section with multiple sub-views.

## Sidebar Integration
- New sidebar section titled "Marketing"
- Icon: `TrendingUp` or `Megaphone`
- Sub-items: Dashboard, Content Pipeline, Campaigns, Analytics, Brand Assets, Email Marketing, SEO

## Subsection Structure

### 1. Marketing Dashboard (default view)
- Post ideas count from Post Bucket
- Drafts in progress count
- Scheduled posts this week
- Quick stats (engagement, follower growth)
- Quick-create buttons: New Idea, New Draft, New Campaign

### 2. Content Pipeline
- Kanban-style board with columns: Ideas → Drafts → Scheduled → Published
- Drag-and-drop between stages
- Platform tags per post (Twitter, LinkedIn, Instagram)
- AI content suggestion button
- Filter by platform

### 3. Campaigns
- Campaign cards with:
  - Name, description, platform (Email/Ads/Social)
  - Status: Planning → Active → Completed → Paused
  - Start/end dates
  - Budget tracking
  - Metrics: impressions, clicks, conversions, ROI

### 4. Analytics
- Social media metrics overview
- Engagement rate charts
- Follower growth tracking
- Campaign performance comparison
- Top performing content

### 5. Brand Assets
- Quick links panel with:
  - Brand guidelines link
  - Logo assets
  - Content templates
  - Swipe files / inspiration

### 6. Email Marketing
- Newsletter ideas list
- Automated sequence tracker
- Subscriber growth metric

### 7. SEO & Content
- Blog post ideas
- Keyword tracking
- Backlink monitoring

## Data Models

### Campaign
```
{
  _id, name, description, platform (email|ads|social),
  status (planning|active|completed|paused),
  startDate, endDate, budget,
  metrics: { impressions, clicks, conversions, roi }
}
```

### BrandAsset
```
{ _id, name, type (guidelines|logo|template|swipe), url, notes }
```

### EmailCampaign
```
{ _id, name, type (newsletter|automated), status, subscriberCount, metrics }
```

### SEOEntry
```
{ _id, type (blog|keyword|backlink), title, url, status, metrics }
```

## File Structure
- `src/components/marketing/MarketingDashboard.tsx` - Main container
- `src/components/marketing/ContentPipeline.tsx` - Kanban board
- `src/components/marketing/CampaignsView.tsx` - Campaign management
- `src/components/marketing/AnalyticsView.tsx` - Metrics
- `src/components/marketing/BrandAssetsView.tsx` - Asset links
- `src/components/marketing/EmailMarketingView.tsx` - Email tracking
- `src/components/marketing/SEOMarketingView.tsx` - SEO tracking
- `src/models/Campaign.ts`
- `src/models/BrandAsset.ts`
- `src/models/EmailCampaign.ts`
- `src/models/SEOEntry.ts`
- API routes: `/api/marketing/campaigns`, `/api/marketing/brand-assets`, `/api/marketing/email`, `/api/marketing/seo`

## Implementation Order
1. Add sidebar nav item
2. Create MarketingDashboard container with tabs
3. Build ContentPipeline (reuse existing posts/PostBucket data)
4. Build Campaigns CRUD
5. Build Analytics view
6. Build Brand Assets
7. Build Email Marketing
8. Build SEO view
