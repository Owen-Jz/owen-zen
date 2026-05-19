#!/usr/bin/env node
/**
 * Instagram Post Scraper — using instagram-private-api library
 *
 * Uses Instagram's private API via the ig-api library, which is more
 * resistant to blocks than web-scraping approaches.
 *
 * Usage:
 *   node scripts/instagram-scraper-ipa.js
 *
 * Environment variables (optional — defaults below):
 *   INSTAGRAM_USERNAME  - account to scrape (default: closetfullofcoco_)
 *   INSTAGRAM_SESSIONID - sessionid cookie value
 */

const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || 'closetfullofcoco_';
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID || '54003903307%3AJdz6NWVSESaxos%3A29%3AAYher7eD_nqkQiDUyyWgXQYGyhqMOJ-t5Z8k5XpJVw';
const OUTPUT_FILE = 'instagram-posts.csv';

const ANTI_BAN = {
  REQUEST_DELAY_MS_MIN: 2500,
  REQUEST_DELAY_MS_MAX: 6000,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function randomDelay() {
  const delay = randomBetween(ANTI_BAN.REQUEST_DELAY_MS_MIN, ANTI_BAN.REQUEST_DELAY_MS_MAX);
  console.log(`  Waiting ${delay}ms...`);
  await sleep(delay);
}

async function main() {
  const ig = new IgApiClient();

  // Device setup (required by the library)
  ig.state.generateDevice(INSTAGRAM_USERNAME);

  // Inject session cookie via cookieJar
  console.log('Injecting session cookie...');
  const sessionCookie = `sessionid=${SESSION_ID}; Domain=.instagram.com; Path=/; HttpOnly; Secure`;
  try {
    ig.state.cookieJar.setCookie(sessionCookie, 'https://www.instagram.com');
  } catch (err) {
    console.error(`Failed to inject session cookie: ${err.message}`);
    process.exit(1);
  }

  // Verify session by fetching account info
  console.log('Verifying session...');
  let userId;
  try {
    userId = await ig.user.getIdByUsername(INSTAGRAM_USERNAME);
    const userInfo = await ig.user.info(userId);
    console.log(`Session valid. Username: ${userInfo.username}`);
    console.log(`Full name: ${userInfo.full_name}`);
    console.log(`Media count: ${userInfo.media_count}`);
    console.log(`Followers: ${userInfo.follower_count}`);
  } catch (err) {
    console.error(`Session verification failed: ${err.message}`);
    console.error('Your session cookies may have expired. Please refresh them.');
    process.exit(1);
  }

  // Scrape posts using user feed with cursor pagination
  const allPostUrls = [];
  let nextMaxId = null;
  let page = 1;
  const MAX_PAGES = 500;

  console.log(`\nScraping posts for: @${INSTAGRAM_USERNAME}\n`);

  while (page <= MAX_PAGES) {
    await randomDelay();

    console.log(`Page ${page}: Fetching...`);
    let feed;
    try {
      feed = ig.feed.user(userId, nextMaxId);
      await feed.request(); // actually fetches the feed
    } catch (err) {
      console.error(`Failed to fetch page ${page}: ${err.message}`);

      // Retry once with longer delay
      console.log('Retrying with 15s delay...');
      await sleep(15000);
      try {
        feed = ig.feed.user(userId, nextMaxId);
        await feed.request();
      } catch (retryErr) {
        console.error(`Retry failed: ${retryErr.message}. Stopping.`);
        break;
      }
    }

    const items = feed.items();
    if (!items || items.length === 0) {
      console.log(`No more posts on page ${page}. Stopping.`);
      break;
    }

    const prevCount = allPostUrls.length;
    for (const item of items) {
      if (item.code) {
        allPostUrls.push(`https://www.instagram.com/p/${item.code}/`);
      }
    }

    console.log(`  Got ${items.length} posts (total: ${allPostUrls.length}, +${allPostUrls.length - prevCount} new)`);

    // Get cursor for next page
    nextMaxId = feed.getCursor();
    if (!nextMaxId) {
      console.log('End of feed (no cursor for next page).');
      break;
    }

    page++;
  }

  // Write results
  if (allPostUrls.length === 0) {
    console.error('ERROR: No posts collected.');
    process.exit(1);
  }

  const uniqueUrls = [...new Set(allPostUrls)];
  const csvContent = ['post_url', ...uniqueUrls.sort()].join('\n');
  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.writeFileSync(outputPath, csvContent, 'utf8');

  console.log(`\nDone! Extracted ${uniqueUrls.length} unique post URLs.`);
  console.log(`Written to: ${outputPath}`);
}

main().catch(err => {
  console.error('Unhandled error:', err.message);
  process.exit(1);
});