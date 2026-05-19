# Instagram Post Scraper Design

## Overview

A standalone Node.js script that uses Playwright to log into Instagram with session cookies, scrape all post permalinks from the public profile `closetfullofcoco_`, and write them to a CSV file.

## Architecture

- **Script location:** `scripts/instagram-scraper.ts`
- **Output file:** `instagram-posts.csv` (single column: `post_url`)
- **Browser:** Headless Chromium via Playwright

## Authentication

Inject the following cookies via Playwright before navigating to the profile:

| Cookie Name | Value (from user session) |
|---|---|
| `sessionid` | `54003903307%3AJdz6NWVSESaxos%3A29%3AAYg0wCNPvWI2zhF93SkQCmFnzIAjzZ5BHlP9MjCm3A` |
| `csrftoken` | `xWAxQhvHf4rNuWUEoUstC7DDozTP0xsm` |
| `ds_user_id` | `54003903307` |

If the session is expired, the script exits with a clear error message.

## Flow

1. Launch headless Chromium
2. Navigate to `https://www.instagram.com/closetfullofcoco_/`
3. Inject session cookies
4. Wait for profile grid to load
5. Scroll to bottom repeatedly — infinite scroll loads more posts
6. After scrolling stabilizes, extract all post URLs from the grid
7. Deduplicate URLs
8. Write to `instagram-posts.csv`

## Scrolling Logic

- Scroll down until no new posts load for 3 consecutive scroll attempts
- Random delay (300–800ms) between scroll iterations to avoid bot detection
- Max scroll attempts: 100 (configurable via `MAX_SCROLLS` constant)
- Detect "end of content" via absence of new DOM nodes after scroll

## Post URL Extraction

Each post in the grid is an `<a>` tag with href matching `/\/p\/[A-Za-z0-9_-]+\//`. Collect all unique hrefs and prepend `https://www.instagram.com`.

## Output

`instagram-posts.csv`:
```
post_url
https://www.instagram.com/p/ABC123DEF/
https://www.instagram.com/p/GHI456JKL/
...
```

## Error Handling

| Scenario | Behavior |
|---|---|
| Session expired | Exit with message "Session expired. Please refresh Instagram cookies." |
| Profile not found (404) | Exit with message "Profile not found." |
| Network error | Retry up to 3 times with exponential backoff, then exit with error |
| Scroll timeout | After MAX_SCROLLS attempts, stop and export what was collected |

## Dependencies

- `playwright` (for browser automation)
- Standard Node.js `fs` module for CSV output
- No external HTTP clients needed — Playwright handles all requests