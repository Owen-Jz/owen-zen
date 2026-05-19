#!/usr/bin/env node
/**
 * Instagram Post Scraper — JSON API approach
 *
 * Uses Instagram's public JSON endpoint (/[username]/?__a=1) which is much faster
 * than Playwright and doesn't require a browser.
 *
 * Since this endpoint only returns the first ~12 posts, we use the "end cursor"
 * pagination token to page through all posts.
 *
 * Usage:
 *   node scripts/instagram-scraper-json.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'closetfullofcoco_';
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID || '54003903307%3AJdz6NWVSESaxos%3A29%3AAYher7eD_nqkQiDUyyWgXQYGyhqMOJ-t5Z8k5XpJVw';
const OUTPUT_FILE = 'instagram-posts.csv';

// Anti-ban: be respectful with delays between page requests
const REQUEST_DELAY_MS_MIN = 2000;
const REQUEST_DELAY_MS_MAX = 5000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.instagram.com/${INSTAGRAM_USERNAME}/`,
        'Cookie': `sessionid=${SESSION_ID}`,
        ...headers,
      },
    };
    mod.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          reject(new Error(`Failed to parse JSON response (status ${res.statusCode}). Body: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchWithRetry(url, headers = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await httpsGet(url, headers);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = randomBetween(1000 * attempt, 3000 * attempt);
      console.log(`Request failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

async function scrapeAllPosts() {
  console.log(`Scraping posts for: ${INSTAGRAM_USERNAME}`);
  const allPostUrls = [];
  let endCursor = null;
  let page = 1;
  const maxPages = 500; // safety limit (500 pages × ~12 posts = 6000 posts max)

  while (page <= maxPages) {
    const delay = randomBetween(REQUEST_DELAY_MS_MIN, REQUEST_DELAY_MS_MAX);
    console.log(`Page ${page}: Fetching... (waiting ${delay}ms before request)`);
    await sleep(delay);

    let url;
    if (page === 1) {
      url = `https://www.instagram.com/${INSTAGRAM_USERNAME}/?__a=1`;
    } else {
      url = `https://www.instagram.com/${INSTAGRAM_USERNAME}/?__a=1&cursor=${endCursor}`;
    }

    let res;
    try {
      res = await fetchWithRetry(url);
    } catch (err) {
      console.error(`ERROR: Failed to fetch page ${page} after 3 attempts: ${err.message}`);
      break;
    }

    // Handle Instagram error responses
    if (res.status === 429) {
      console.error('ERROR: Rate limited by Instagram (429). Stopping to protect your account.');
      break;
    }
    if (res.status === 404) {
      console.error(`ERROR: Profile not found (404): "${INSTAGRAM_USERNAME}"`);
      break;
    }
    if (res.status !== 200) {
      console.error(`ERROR: Unexpected status code ${res.status}. Body: ${JSON.stringify(res.data).slice(0, 200)}`);
      break;
    }

    const json = res.data;

    // Check for rate limit or entry error
    if (json.require_user_login || json.status === 'fail') {
      console.error(`ERROR: Instagram returned login required or fail status. Session may be invalid or expired.`);
      break;
    }

    // Extract user data (different structure on first page vs subsequent)
    const user = json.graphql?.user || json.data?.user;
    if (!user) {
      console.error(`ERROR: Could not find user data in response. Response: ${JSON.stringify(json).slice(0, 300)}`);
      break;
    }

    // Extract posts on first page
    const edges = user.edge_owner_to_timeline_media?.edges || user.media?.edges || [];
    if (edges.length === 0 && page === 1) {
      console.error(`ERROR: No posts found. Profile may be private or empty.`);
      break;
    }

    console.log(`  Found ${edges.length} posts on this page (total so far: ${allPostUrls.length + edges.length})`);

    for (const edge of edges) {
      const shortcode = edge.node?.shortcode || edge.node?.code;
      if (shortcode) {
        allPostUrls.push(`https://www.instagram.com/p/${shortcode}/`);
      }
    }

    // Get pagination cursor for next page
    const pageInfo = user.edge_owner_to_timeline_media?.page_info || user.media?.page_info;
    endCursor = pageInfo?.end_cursor;
    const hasNextPage = pageInfo?.has_next_page;

    if (!hasNextPage || !endCursor) {
      console.log(`Reached the last page. Total posts collected: ${allPostUrls.length}`);
      break;
    }

    page++;
  }

  return allPostUrls;
}

async function main() {
  try {
    const postUrls = await scrapeAllPosts();

    if (postUrls.length === 0) {
      console.error('ERROR: No posts were collected.');
      process.exit(1);
    }

    const uniqueUrls = [...new Set(postUrls)];
    const csvContent = ['post_url', ...uniqueUrls.sort()].join('\n');
    const outputPath = path.join(process.cwd(), OUTPUT_FILE);
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`\nDone! Extracted ${uniqueUrls.length} unique post URLs.`);
    console.log(`Written to: ${outputPath}`);
  } catch (err) {
    console.error('Unhandled error:', err.message);
    process.exit(1);
  }
}

main();