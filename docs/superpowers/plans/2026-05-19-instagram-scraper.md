# Instagram Post Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scrape all Instagram post permalinks from `closetfullofcoco_`'s public profile using Playwright and save them to `instagram-posts.csv`.

**Architecture:** A standalone Node.js script (`scripts/instagram-scraper.js`) that launches a headless Chromium browser, authenticates via Instagram session cookies, scrolls through the profile's infinite-scroll post grid, and extracts every post permalink to a CSV file.

**Tech Stack:** Node.js (CommonJS), Playwright v1.59.1 (Chromium), built-in `fs`/`csv-writer` for output.

---

## File Structure

```
scripts/
  instagram-scraper.js     # Main scraper script

instagram-posts.csv       # Output file (created by script)
```

No changes to `src/`, `package.json` (scripts section), or any existing project files.

---

## Task 1: Create the Instagram scraper script

**Files:**
- Create: `scripts/instagram-scraper.js`

- [ ] **Step 1: Write the full scraper script**

```javascript
#!/usr/bin/env node
/**
 * Instagram Post Scraper for Owen Zen
 *
 * Scrapes all post permalinks from a public Instagram profile using
 * Playwright with session cookie authentication.
 *
 * Usage:
 *   node scripts/instagram-scraper.js
 *
 * Environment Variables (optional — can also edit COOKIES const below):
 *   INSTAGRAM_SESSIONID   - Instagram sessionid cookie value
 *   INSTAGRAM_CSRFTOKEN  - Instagram csrftoken cookie value
 *   INSTAGRAM_DS_USER_ID - Instagram ds_user_id cookie value
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const INSTAGRAM_USERNAME = 'closetfullofcoco_';
const INSTAGRAM_BASE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

// Cookies from the user's active Instagram session
// These can also be overridden by environment variables
const COOKIES = {
  sessionid: process.env.INSTAGRAM_SESSIONID || '54003903307%3AJdz6NWVSESaxos%3A29%3AAYg0wCNPvWI2zhF93SkQCmFnzIAjzZ5BHlP9MjCm3A',
  csrftoken: process.env.INSTAGRAM_CSRFTOKEN || 'xWAxQhvHf4rNuWUEoUstC7DDozTP0xsm',
  ds_user_id: process.env.INSTAGRAM_DS_USER_ID || '54003903307',
};

const MAX_SCROLLS = 100;
const SCROLL_DELAY_MS_MIN = 300;
const SCROLL_DELAY_MS_MAX = 800;
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

const OUTPUT_FILE = path.join(__dirname, '..', 'instagram-posts.csv');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function error(message) {
  log(message, 'ERROR');
}

function success(message) {
  log(message, 'SUCCESS');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  const ms = Math.floor(Math.random() * (SCROLL_DELAY_MS_MAX - SCROLL_DELAY_MS_MIN)) + SCROLL_DELAY_MS_MIN;
  return sleep(ms);
}

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === RETRY_COUNT) {
        throw new Error(`${label} failed after ${RETRY_COUNT} attempts: ${err.message}`);
      }
      log(`Retry ${attempt}/${RETRY_COUNT} for "${label}" due to: ${err.message}`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

// ─── CSV Writing ──────────────────────────────────────────────────────────────

async function writeCsv(postUrls) {
  const uniqueUrls = [...new Set(postUrls)];
  // CSV header
  const header = 'post_url\n';
  const rows = uniqueUrls.map((url) => `${url}\n`).join('');
  const content = header + rows;

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  return uniqueUrls.length;
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────

async function scrapeInstagramPosts() {
  log(`Starting Instagram scraper for profile: ${INSTAGRAM_USERNAME}`);

  const browser = await withRetry(
    () => chromium.launch({ headless: true }),
    'Browser launch'
  );

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // ── Inject cookies to authenticate the session ────────────────────────────
  log('Injecting session cookies...');
  await page.context().addCookies([
    {
      name: 'sessionid',
      value: COOKIES.sessionid,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'csrftoken',
      value: COOKIES.csrftoken,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'ds_user_id',
      value: COOKIES.ds_user_id,
      domain: '.instagram.com',
      path: '/',
    },
  ]);

  // ── Navigate to profile ──────────────────────────────────────────────────
  log(`Navigating to ${INSTAGRAM_BASE_URL}...`);
  let response;
  try {
    response = await withRetry(
      () => page.goto(INSTAGRAM_BASE_URL, { waitUntil: 'networkidle', timeout: 30000 }),
      'Profile navigation'
    );
  } catch (navErr) {
    await browser.close();
    if (navErr.message.includes('net::ERR_')) {
      error('Network error while loading Instagram. Check your connection.');
    } else {
      error(`Failed to load profile: ${navErr.message}`);
    }
    throw navErr;
  }

  if (response && response.status() === 404) {
    await browser.close();
    error(`Profile "${INSTAGRAM_USERNAME}" not found (404).`);
    process.exit(1);
  }

  // ── Check for session validity ──────────────────────────────────────────
  // If Instagram redirects to login page, session is invalid
  const currentUrl = page.url();
  if (currentUrl.includes('/accounts/login/')) {
    await browser.close();
    error('Session expired. Please refresh your Instagram session cookies.');
    process.exit(1);
  }

  log(`Profile loaded. URL: ${currentUrl}`);

  // ── Wait for post grid to appear ────────────────────────────────────────
  try {
    await page.waitForSelector('a[href*="/p/"]', { timeout: 15000 });
    log('Post grid detected.');
  } catch {
    await browser.close();
    error('Post grid not found. The profile may be private or session is invalid.');
    process.exit(1);
  }

  // ── Infinite scroll loop ─────────────────────────────────────────────────
  log('Scrolling through posts...');
  let lastPostCount = 0;
  let noNewPostsConsecutive = 0;

  for (let scrollNum = 1; scrollNum <= MAX_SCROLLS; scrollNum++) {
    // Scroll to bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(600); // Wait for content to load

    // Also try scrolling within the main content area (Instagram uses a lazy-loaded grid)
    await page.evaluate(() => {
      const mainContent = document.querySelector('main') || document.body;
      mainContent.scrollTop = mainContent.scrollHeight;
    });
    await randomDelay();

    // Count current post links visible
    const postLinks = await page.$$eval('a[href*="/p/"]', (anchors) =>
      anchors
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && !href.includes('/p/') || href.match(/\/p\/[A-Za-z0-9_-]+\/\?__a=/))
        .map((href) => {
          // Normalize to full URL without query params
          const match = href.match(/\/p\/([A-Za-z0-9_-]+)\//);
          return match ? `https://www.instagram.com/p/${match[1]}/` : null;
        })
        .filter(Boolean)
    );

    const currentPostCount = postLinks.length;

    if (currentPostCount > lastPostCount) {
      lastPostCount = currentPostCount;
      noNewPostsConsecutive = 0;
      log(`Scroll ${scrollNum}: ${currentPostCount} posts loaded...`);
    } else {
      noNewPostsConsecutive++;
      log(`Scroll ${scrollNum}: No new posts (${noNewPostsConsecutive}/3)...`);
      if (noNewPostsConsecutive >= 3) {
        log('No new posts for 3 consecutive scrolls. Done scrolling.');
        break;
      }
    }

    // Safety break if we stop seeing growth but haven't hit the no-new-posts threshold
    if (scrollNum === MAX_SCROLLS) {
      log(`Reached max scroll limit (${MAX_SCROLLS}).`);
    }
  }

  // ── Final extraction of all post URLs ────────────────────────────────────
  log('Extracting final post URLs...');

  // Re-query all post links after scrolling is complete
  const allPostHrefs = await page.$$eval('a[href*="/p/"]', (anchors) => {
    return anchors
      .map((a) => a.getAttribute('href'))
      .filter((href) => href && href.match(/\/p\/[A-Za-z0-9_-]+\//))
      .map((href) => {
        const match = href.match(/(\/p\/[A-Za-z0-9_-]+)\/?/);
        return match ? `https://www.instagram.com${match[1]}/` : null;
      })
      .filter(Boolean);
  });

  await browser.close();

  // ── Write to CSV ────────────────────────────────────────────────────────
  if (allPostHrefs.length === 0) {
    error('No posts found. The profile may be empty or private.');
    process.exit(1);
  }

  const uniqueCount = await writeCsv(allPostHrefs);
  success(`Done! Scraped ${uniqueCount} unique post URLs.`);
  console.log(`Output saved to: ${OUTPUT_FILE}`);
}

// ─── Entry Point ────────────────────────────────────────────────────────────────

if (require.main === module) {
  scrapeInstagramPosts()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      error(err.message);
      process.exit(1);
    });
}

module.exports = { scrapeInstagramPosts };
```

- [ ] **Step 2: Verify the script has correct syntax**

Run: `node --check scripts/instagram-scraper.js`
Expected: No output (exit code 0)

- [ ] **Step 3: Add the npm script to package.json**

Modify `package.json` scripts section — add:
```json
"instagram:scrape": "node scripts/instagram-scraper.js"
```

- [ ] **Step 4: Run the scraper and verify it works**

Run: `npm run instagram:scrape`
Expected: Logs showing scroll progress, final count of posts, and "Done!" message with CSV written to `instagram-posts.csv`

- [ ] **Step 5: Verify the CSV output**

Run: `head -5 instagram-posts.csv`
Expected: A CSV with `post_url` header and valid Instagram post URLs

- [ ] **Step 6: Commit**

```bash
git add scripts/instagram-scraper.js package.json
git commit -m "$(cat <<'EOF'
feat(instagram): add post scraper for closetfullofcoco_

Scrapes all Instagram post permalinks using Playwright with
session cookie authentication. Outputs to instagram-posts.csv.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Harden scraper with anti-ban measures

**Files:**
- Modify: `scripts/instagram-scraper.js` (overwrite with anti-ban version)
- Modify: `package.json` (no changes needed — same script name)

- [ ] **Step 1: Rewrite the scraper with full anti-ban hardening**

The current `scripts/instagram-scraper.js` was implemented without proper anti-ban measures. Overwrite it completely with an anti-ban hardened version that includes ALL of the following:

**A. WebDriver Stealth (mandatory — without this Instagram detects headless Chrome immediately)**

```javascript
// Execute before any page interaction — hide automation flags
await page.addInitScript(() => {
  // Hide navigator.webdriver
  Object.defineProperty(navigator, 'webdriver', { get: () => false });

  // Fake Chrome runtime object
  window.chrome = {
    runtime: { onConnect: { addListener: () => {} } },
    loadTimes: () => {},
   .csi: () => {},
  };

  // Randomize navigator.plugins (make it look like a real browser)
  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaejoof' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' },
    ],
  });

  // Randomize languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en', 'en-GB'],
  });

  // Remove automation-controlled permission
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) =>
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(parameters);

  // Clear automation-related getters
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
});
```

**B. Realistic Request Headers**

```javascript
await page.setExtraHTTPHeaders({
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
});
```

**C. Human-like Scroll Behavior (variable, not fixed)**

```javascript
async function humanScroll(page) {
  // Scroll in steps with variable speed, mimicking human behavior
  const scrollSteps = 5 + Math.floor(Math.random() * 5); // 5-10 steps per scroll
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);

  for (let i = 1; i <= scrollSteps; i++) {
    const progress = i / scrollSteps;
    // Ease out — fast start, slow end (human scrolling)
    const eased = 1 - Math.pow(1 - progress, 3);
    const targetY = Math.floor(totalHeight * 0.3 * eased + viewportHeight * (1 - eased * 0.3));
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    // Random pause between scroll steps (100-400ms)
    await sleep(100 + Math.floor(Math.random() * 300));
  }
  // Brief pause at bottom before next scroll cycle
  await sleep(200 + Math.floor(Math.random() * 400));
}
```

**D. Variable Delay Between Scrolls**

```javascript
// Between each scroll cycle — 4-8 seconds randomly
const scrollDelay = 4000 + Math.floor(Math.random() * 4000);
await sleep(scrollDelay);
```

**E. Staggered Startup Delays**

```javascript
// After cookie injection, wait before navigating (mimics human typing URL)
await sleep(1500 + Math.floor(Math.random() * 2000));

// After page load, wait before first scroll
await sleep(2500 + Math.floor(Math.random() * 2000));
```

**F. Respectful Rate Limiting**

```javascript
// If we hit a rate limit signal, stop and back off
const bodyText = await page.textContent('body').catch(() => '');
if (bodyText.includes('Too Many Requests') || bodyText.includes('Please wait a few minutes')) {
  await browser.close();
  error('Rate limited by Instagram. Stopping to protect your account. Try again in a few hours.');
  process.exit(1);
}
```

**G. Randomized Viewport**

```javascript
const viewportWidth = 1280 + Math.floor(Math.random() * 200 - 100); // 1180-1380
const viewportHeight = 800 + Math.floor(Math.random() * 200 - 100); // 700-900
const context = await browser.newContext({
  viewport: { width: viewportWidth, height: viewportHeight },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});
```

**H. Anti-ban delay constants (all values configurable at top)**

```javascript
const ANTI_BAN = {
  WEBDRIVER_STEALTH: true,         // Hide automation flags
  MIN_SCROLL_DELAY_MS: 4000,       // Minimum delay BETWEEN scroll cycles
  MAX_SCROLL_DELAY_MS: 8000,       // Maximum delay BETWEEN scroll cycles
  MIN_SCROLL_STEPS: 5,             // Human-like scroll: number of steps
  MAX_SCROLL_STEPS: 10,
  POST_NAVIGATE_DELAY_MS: 2500,    // After page load before first scroll
  COOKIE_TO_NAVIGATE_DELAY_MS: 1500, // After cookie injection before navigation
  MAX_SCROLLS: 100,
  MAX_CONSECUTIVE_EMPTY_SCROLLS: 3,
};
```

**Full anti-ban script structure:**

```
scripts/instagram-scraper.js
  ├── ANTI_BAN config constants
  ├── WebDriver stealth (addInitScript)
  ├── Realistic headers
  ├── Randomized viewport dimensions
  ├── Cookie injection + delayed navigation (1500-3500ms random)
  ├── Wait for grid + delayed first scroll (2500-4500ms random)
  ├── humanScroll() — stepped, eased, variable speed
  ├── Variable scroll delay (4-8s random between cycles)
  ├── Rate limit detection (page text check)
  ├── 3-empty-scroll stop condition
  ├── Final extraction + CSV write
  └── Full error handling (session expiry, 404, empty, network)
```

- [ ] **Step 2: Verify syntax**

Run: `node --check scripts/instagram-scraper.js`
Expected: No output (exit code 0)

- [ ] **Step 3: Run the hardened scraper**

Run: `npm run instagram:scrape`
Expected: Same output (213 posts) but with visible variable delays between scrolls (logs should show different millisecond values each scroll)

- [ ] **Step 4: Verify CSV output**

Run: `head -5 instagram-posts.csv` and `wc -l instagram-posts.csv`
Expected: Valid URLs + same 213 posts (or more if any were missed due to the new scroll behavior)

- [ ] **Step 5: Commit**

```bash
git add scripts/instagram-scraper.js
git commit -m "$(cat <<'EOF'
feat(instagram): harden scraper with anti-ban measures

- WebDriver stealth to hide automation flags
- Human-like stepped scroll with variable speed and easing
- Randomized 4-8s delays between scroll cycles
- Staggered startup delays after cookie injection and page load
- Randomized viewport dimensions
- Rate limit detection with safe exit
- Realistic HTTP headers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every requirement in `docs/superpowers/specs/2026-05-19-instagram-scraper-design.md` is implemented in the script
- [ ] **No placeholders:** No TBD, TODO, "add appropriate error handling" — all branches have concrete code
- [ ] **Cookie values:** Hardcoded values match what the user provided; environment variable override is available
- [ ] **Output format:** CSV with `post_url` header, deduplicated URLs
- [ ] **Error handling:** Session expired, profile not found, network errors, empty profile, rate limiting all covered
- [ ] **Scrolling logic:** Infinite scroll with consecutive-failure detection (3 strikes) and max scroll cap
- [ ] **Post URL normalization:** Extracts `/p/[ID]/` from hrefs and deduplicates
- [ ] **Anti-ban:** WebDriver stealth, human-like scroll, variable delays, rate limit detection, randomized viewport
