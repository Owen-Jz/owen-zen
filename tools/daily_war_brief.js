/**
 * daily_war_brief.js — Owen's Daily War Brief v3
 * ─────────────────────────────────────────────────────────────────────────────
 * No OpenAI dependency. Self-sufficient. Always has real content.
 *
 * Sources:
 *  - HackerNews top stories (AI filtered)
 *  - TechCrunch AI RSS
 *  - The Verge Tech RSS
 *  - GitHub Trending repos (3 days)
 *  - Product Hunt RSS
 *  - Show HN / Indie Hackers
 *  - bible-api.com (random scripture)
 *  - CoinGecko (BTC/SOL/ETH)
 *  - MongoDB (habits, tasks, goals)
 *  - EOD logs
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const http     = require('http');
const mongoose = require('mongoose');

// ── Load env ──────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
try {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  });
} catch (_) {}

const MONGO_URI = process.env.MONGODB_URI;

// ── Mongoose Schemas ──────────────────────────────────────────────────────────
const schemas = {
  Habit: new mongoose.Schema({ title: String, category: String, streak: Number, completedDates: [Date] }, { strict: false }),
  Task:  new mongoose.Schema({ title: String, status: String, priority: String, isArchived: Boolean, isMIT: Boolean, dueDate: Date }, { strict: false }),
  Goal:  new mongoose.Schema({ title: String, status: String, type: String, year: Number, parentId: mongoose.Schema.Types.ObjectId }, { strict: false }),
};

// ── Date Helpers ──────────────────────────────────────────────────────────────
const todayUTC     = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
const yesterdayUTC = () => { const d = todayUTC(); d.setUTCDate(d.getUTCDate() - 1); return d; };
const isSameDay    = (a, b) => a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
const fmtISO       = d => d.toISOString().split('T')[0];
const displayDate  = () => new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });

// ── HTTP Helpers ──────────────────────────────────────────────────────────────
function httpGet(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DailyWarBrief/3.0; +https://github.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/json, */*',
        }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return httpGet(res.headers.location, timeoutMs).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
      req.on('error', reject);
    } catch (e) { reject(e); }
  });
}

function httpGetJSON(url, timeoutMs = 8000) {
  return httpGet(url, timeoutMs).then(d => JSON.parse(d)).catch(() => null);
}

// ── Fallback Scriptures (when API is down) ─────────────────────────────────────
const FALLBACK_SCRIPTURES = [
  { ref: 'Proverbs 16:3', text: 'Commit your work to the Lord, and your plans will be established.', theme: 'stewardship' },
  { ref: 'Colossians 3:23', text: 'Whatever you do, work heartily, as for the Lord and not for men.', theme: 'discipline' },
  { ref: '2 Timothy 1:7', text: 'For God gave us a spirit not of fear but of power and love and self-control.', theme: 'discipline' },
  { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.', theme: 'urgency' },
  { ref: 'Deuteronomy 8:18', text: 'You shall remember the Lord your God, for it is he who gives you power to get wealth.', theme: 'multiplication' },
  { ref: 'Matthew 25:29', text: 'For to everyone who has will more be given, and he will have an abundance.', theme: 'multiplication' },
  { ref: 'Proverbs 13:4', text: 'The soul of the sluggard craves and gets nothing, while the soul of the diligent is richly supplied.', theme: 'discipline' },
  { ref: 'Joshua 1:9', text: 'Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.', theme: 'urgency' },
  { ref: 'Ecclesiastes 9:10', text: 'Whatever your hand finds to do, do it with all your might.', theme: 'discipline' },
  { ref: 'Romans 12:11', text: 'Do not be slothful in zeal, be fervent in spirit, serve the Lord.', theme: 'urgency' },
  { ref: 'Proverbs 21:5', text: 'The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.', theme: 'stewardship' },
  { ref: 'Luke 16:10', text: 'One who is faithful in a very little is also faithful in much.', theme: 'stewardship' },
  { ref: '1 Corinthians 15:58', text: 'Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.', theme: 'multiplication' },
  { ref: 'Habakkuk 2:2', text: 'Write the vision; make it plain on tablets, so he may run who reads it.', theme: 'urgency' },
];

// Deterministic daily pick (changes each day, consistent within the day)
function getDailyScripture() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getUTCFullYear(), 0, 0).getTime()) / 86400000);
  return FALLBACK_SCRIPTURES[dayOfYear % FALLBACK_SCRIPTURES.length];
}

// ── Scripture from API ─────────────────────────────────────────────────────────
async function getScripture() {
  try {
    const data = await httpGetJSON('https://bible-api.com/?random=verse', 6000);
    if (data?.text && data?.reference) {
      return { ref: data.reference, text: data.text.trim().replace(/\n/g, ' '), theme: 'discipline' };
    }
  } catch (_) {}
  return getDailyScripture();
}

// ── RSS Parser ────────────────────────────────────────────────────────────────
function parseRSS(xml, max = 6) {
  const items = [];
  if (!xml || xml.length < 100) return items;
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < max) {
    const c = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      return (c.match(r) || [])[1]?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() || '';
    };
    const getLink = () => {
      const r = /<link>([^<]+)<\/link>/i;
      return (c.match(r) || [])[1]?.trim() || '';
    };
    const title = get('title');
    const link  = getLink() || get('guid');
    const desc  = get('description').slice(0, 180).replace(/\s+/g, ' ');
    if (title) items.push({ title, link, desc });
  }
  return items;
}

function parseAtom(xml, max = 5) {
  const items = [];
  if (!xml || xml.length < 100) return items;
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < max) {
    const c = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      return (c.match(r) || [])[1]?.replace(/<[^>]+>/g, '').trim() || '';
    };
    const getLinkAtom = () => {
      const r = /<link[^>]+href=["']([^"']+)["'][^>]*>/i;
      return (c.match(r) || [])[1] || '';
    };
    const title = get('title');
    const link  = getLinkAtom();
    const desc  = get('summary').slice(0, 180).replace(/\s+/g, ' ');
    if (title) items.push({ title, link, desc });
  }
  return items;
}

// ── AI Keyword Filter ─────────────────────────────────────────────────────────
const AI_KEYWORDS = ['ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'deepmind', 'machine learning', 'neural', 'agent', 'model', 'deepseek', 'mistral', 'perplexity', 'midjourney', 'diffusion', 'transformer', 'chatbot', 'automation', 'startup', 'saas', 'funding', 'raises', 'launches', 'app'];

function isRelevant(title) {
  const t = title.toLowerCase();
  return AI_KEYWORDS.some(k => t.includes(k));
}

// ── Fetch Section 1: AI News ──────────────────────────────────────────────────
async function fetchAINews() {
  const stories = [];

  // HackerNews top 40 — AI/tech filter
  try {
    const topIds = await httpGetJSON('https://hacker-news.firebaseio.com/v0/topstories.json', 8000) || [];
    const items = await Promise.all(topIds.slice(0, 40).map(id =>
      httpGetJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 5000)
    ));
    items.forEach(item => {
      if (!item?.title) return;
      if (isRelevant(item.title) && stories.length < 5) {
        const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
        stories.push({ title: item.title, link: url, source: 'HN' });
      }
    });
  } catch (_) {}

  // TechCrunch AI RSS
  if (stories.length < 4) {
    try {
      const xml = await httpGet('https://techcrunch.com/category/artificial-intelligence/feed/', 8000);
      const parsed = parseRSS(xml, 5);
      parsed.forEach(item => {
        if (stories.length < 6) stories.push({ ...item, source: 'TechCrunch' });
      });
    } catch (_) {}
  }

  // The Verge RSS
  if (stories.length < 4) {
    try {
      const xml = await httpGet('https://www.theverge.com/rss/index.xml', 8000);
      const parsed = parseAtom(xml, 5);
      parsed.filter(i => isRelevant(i.title)).forEach(item => {
        if (stories.length < 6) stories.push({ ...item, source: 'The Verge' });
      });
    } catch (_) {}
  }

  // VentureBeat AI
  if (stories.length < 3) {
    try {
      const xml = await httpGet('https://feeds.feedburner.com/venturebeat/SZYF', 8000);
      const parsed = parseRSS(xml, 4);
      parsed.forEach(item => {
        if (stories.length < 6) stories.push({ ...item, source: 'VentureBeat' });
      });
    } catch (_) {}
  }

  return stories.slice(0, 5);
}

// ── Fetch Section 2: Trending Products ───────────────────────────────────────
async function fetchTrending() {
  const results = [];

  // Product Hunt
  try {
    const xml = await httpGet('https://www.producthunt.com/feed', 8000);
    const parsed = parseRSS(xml, 4);
    parsed.forEach(item => {
      if (results.length < 3) results.push({ ...item, source: 'Product Hunt' });
    });
  } catch (_) {}

  // Show HN from HackerNews
  if (results.length < 3) {
    try {
      const topIds = await httpGetJSON('https://hacker-news.firebaseio.com/v0/newstories.json', 6000) || [];
      const items = await Promise.all(topIds.slice(0, 60).map(id =>
        httpGetJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 4000)
      ));
      items.forEach(item => {
        if (results.length >= 5) return;
        if (item?.title?.startsWith('Show HN:')) {
          const title = item.title.replace('Show HN:', '').trim();
          const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
          results.push({ title, link: url, source: 'Show HN' });
        }
      });
    } catch (_) {}
  }

  // GitHub Trending (3 days)
  if (results.length < 3) {
    try {
      const date = new Date();
      date.setDate(date.getDate() - 3);
      const dateStr = date.toISOString().split('T')[0];
      const data = await httpGetJSON(
        `https://api.github.com/search/repositories?q=created:>${dateStr}&sort=stars&order=desc&per_page=5`,
        8000
      );
      (data?.items || []).slice(0, 3).forEach(repo => {
        const desc = repo.description ? repo.description.slice(0, 80) : 'No description';
        results.push({
          title: `${repo.full_name} (⭐${repo.stargazers_count})`,
          link: repo.html_url,
          desc,
          source: `GitHub · ${repo.language || 'Code'}`
        });
      });
    } catch (_) {}
  }

  return results.slice(0, 5);
}

// ── Fetch Crypto + Rates ──────────────────────────────────────────────────────
async function fetchMarkets() {
  const out = { btc: null, sol: null, eth: null, usdNgn: null };
  try {
    const data = await httpGetJSON(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana,ethereum&vs_currencies=usd&include_24hr_change=true',
      8000
    );
    if (data?.bitcoin) {
      out.btc = data.bitcoin;
      out.sol = data.solana;
      out.eth = data.ethereum;
    }
  } catch (_) {}

  try {
    const data = await httpGetJSON('https://api.exchangerate-api.com/v4/latest/USD', 6000);
    if (data?.rates?.NGN) out.usdNgn = data.rates.NGN;
  } catch (_) {}

  return out;
}

// ── MongoDB ────────────────────────────────────────────────────────────────────
async function fetchMongo() {
  try {
    if (!MONGO_URI) throw new Error('No MONGO_URI');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const Habit = mongoose.models.Habit || mongoose.model('Habit', schemas.Habit);
    const Task  = mongoose.models.Task  || mongoose.model('Task',  schemas.Task);
    const Goal  = mongoose.models.Goal  || mongoose.model('Goal',  schemas.Goal);

    const today  = todayUTC();
    const habits = await Habit.find({}).lean();
    const tasks  = await Task.find({ isArchived: { $ne: true }, status: { $in: ['pending', 'in-progress', 'pinned'] } }).lean();
    const goals  = await Goal.find({ year: 2026, status: { $in: ['pending', 'in-progress'] }, type: 'goal' }).lean();

    await mongoose.disconnect();

    return {
      habits: {
        all:     habits,
        done:    habits.filter(h => h.completedDates?.some(d => isSameDay(new Date(d), today))),
        pending: habits.filter(h => !h.completedDates?.some(d => isSameDay(new Date(d), today))),
      },
      tasks: {
        mits:     tasks.filter(t => t.isMIT),
        highPrio: tasks.filter(t => !t.isMIT && t.priority === 'high').slice(0, 4),
        overdue:  tasks.filter(t => t.dueDate && new Date(t.dueDate) < today).slice(0, 3),
      },
      goals: goals.slice(0, 5),
    };
  } catch {
    return { habits: { all:[], done:[], pending:[] }, tasks: { mits:[], highPrio:[], overdue:[] }, goals: [] };
  }
}

function readEOD() {
  try {
    const p = path.join(__dirname, '..', '..', '..', 'workspace', 'eod', `${fmtISO(yesterdayUTC())}.json`);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

// ── Safe MD (strip Telegram Markdown-breaking chars) ─────────────────────────
const safeMD = s => String(s || '').replace(/[*_`\[\]()~>#+=|{}.!-]/g, c => '\\' + c).slice(0, 300);
// Actually for simple Markdown V1 (not MarkdownV2), just strip the conflict chars
const safe = s => String(s || '').replace(/[*_`\[\]]/g, '').slice(0, 300);

// ── Market sentiment ──────────────────────────────────────────────────────────
function btcSentiment(change) {
  if (!change && change !== 0) return '📊 No data';
  if (change > 5)       return '🚀 Pumping. Greed returning.';
  if (change > 2)       return '📈 Bullish accumulation.';
  if (change > -2)      return '🦀 Ranging. Indecision.';
  if (change > -5)      return '📉 Weak hands selling.';
  return '🩸 Heavy bleed. Fear.';
}

// ── Build Telegram Message ─────────────────────────────────────────────────────
function buildMessage({ aiNews, trending, markets, scripture }) {
  const lines = [];
  const weightLeft = 118 - 90; // kg
  const date = displayDate();

  lines.push(`⚔️ DAILY WAR BRIEF`);
  lines.push(`📅 ${date}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // ── SECTION 0: Scripture ──────────────────────────────────────────────────
  lines.push(`\n✝️ SPIRIT`);
  if (scripture) {
    lines.push(`📖 ${scripture.ref}`);
    lines.push(`"${safe(scripture.text)}"`);
    if (scripture.theme) lines.push(`Theme: ${scripture.theme}`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━━`);

  // ── SECTION 1: AI News ─────────────────────────────────────────────────────
  lines.push(`\n🌍 SECTION 1 — AI & TECH INTELLIGENCE\n`);
  if (aiNews.length > 0) {
    aiNews.forEach((item, i) => {
      lines.push(`${i + 1}. ${safe(item.title)}`);
      if (item.desc) lines.push(`   ↳ ${safe(item.desc).slice(0, 150)}`);
      lines.push(`   [${item.source}]`);
      lines.push('');
    });
  } else {
    lines.push(`📡 Could not fetch feeds right now.`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // ── SECTION 2: Products & Markets ─────────────────────────────────────────
  lines.push(`\n⚡ SECTION 2 — TRENDING PRODUCTS & MARKETS\n`);

  if (trending.length > 0) {
    lines.push(`🚀 What's Moving:`);
    trending.forEach((item, i) => {
      lines.push(`${i + 1}. ${safe(item.title)} [${item.source}]`);
      if (item.desc) lines.push(`   ${safe(item.desc).slice(0, 120)}`);
    });
    lines.push('');
  }

  // Crypto
  if (markets.btc) {
    const btcChg = markets.btc.usd_24h_change?.toFixed(2);
    const solChg = markets.sol?.usd_24h_change?.toFixed(2);
    const ethChg = markets.eth?.usd_24h_change?.toFixed(2);
    lines.push(`💰 Crypto:`);
    lines.push(`• BTC: $${markets.btc.usd?.toLocaleString()} (${btcChg > 0 ? '+' : ''}${btcChg}%) ${btcSentiment(markets.btc.usd_24h_change)}`);
    if (markets.sol) lines.push(`• SOL: $${markets.sol.usd?.toLocaleString()} (${solChg > 0 ? '+' : ''}${solChg}%)`);
    if (markets.eth) lines.push(`• ETH: $${markets.eth.usd?.toLocaleString()} (${ethChg > 0 ? '+' : ''}${ethChg}%)`);
  }
  if (markets.usdNgn) {
    lines.push(`• USD/NGN: ₦${markets.usdNgn.toFixed(0)}`);
  }

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Execute or explain. No middle ground. ⚔️`);

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const [aiNews, trending, markets, scripture] = await Promise.all([
    fetchAINews(),
    fetchTrending(),
    fetchMarkets(),
    getScripture(),
  ]);

  const msg = buildMessage({ aiNews, trending, markets, scripture });
  console.log(msg);
}

main().catch(err => {
  console.error('War brief error:', err.message);
  process.exit(1);
});
