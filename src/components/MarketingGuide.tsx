"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  BookOpen,
  ChevronRight,
  X,
  ExternalLink,
  Lightbulb,
  Target,
  BarChart3,
  Image,
  Mail,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  MousePointerClick,
  Eye,
  Zap,
  FileText,
  Link2,
  Star,
  Send,
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  subsections: {
    title: string;
    content: string;
    tips?: string[];
    example?: string;
  }[];
}

const guideSections: GuideSection[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    icon: BarChart3,
    color: "#dc2626",
    description: "Your marketing command center. Get a bird's eye view of everything marketing at a glance.",
    subsections: [
      {
        title: "What You're Seeing",
        content: "The dashboard shows live stats from all your marketing activities. Active campaign count, email subscribers, total impressions across all campaigns, and your average ROI. This is your north star view — check here daily to understand your marketing health.",
        tips: [
          "Check this first every morning to see what's moving",
          "Watch the ROI number — it tells you if your spend is worth it",
          "Active campaigns count shows how many things are running simultaneously",
        ],
      },
      {
        title: "Quick Create Buttons",
        content: "The four quick create buttons let you jump straight to creating new marketing assets without navigating manually. Use these when you have a sudden burst of inspiration or need to capture an idea immediately.",
        tips: [
          "New Idea → When you have a content thought but aren't ready to write",
          "New Campaign → When you're planning a focused marketing push",
          "New Email → When you want to build an email sequence",
          "New SEO Entry → When you discover a keyword or blog topic",
        ],
      },
    ],
  },
  {
    id: "pipeline",
    title: "Content Pipeline",
    icon: Lightbulb,
    color: "#f59e0b",
    description: "Where your content ideas flow from raw thoughts to published posts. Think of it as your content assembly line.",
    subsections: [
      {
        title: "The Four Stages Explained",
        content: "IDEAS: Raw content thoughts — you might only have a topic or a rough angle. DRAFTS: Content you're actively working on — you have a working version. SCHEDULED: Content that's been approved and is queued to go live. PUBLISHED: Content that's already gone live and is being tracked.",
        tips: [
          "Don't skip stages — move ideas through gradually as you develop them",
          "Scheduled content should have a specific publish date",
          "Published content still lives here for reference and tracking",
        ],
      },
      {
        title: "Platform Tags",
        content: "Every piece of content is tagged by platform (Twitter/X, LinkedIn, Instagram). This helps you maintain a balanced content mix and ensures you're not over-posting to one platform while neglecting others.",
        tips: [
          "Twitter/X: Short-form ideas, threads, quick takes, engagement posts",
          "LinkedIn: Long-form professional content, business insights, personal brand posts",
          "Instagram: Visual-first content, stories, reels, aesthetic posts",
        ],
      },
      {
        title: "AI Suggestions Button",
        content: "The AI Suggestions button (when connected) analyzes your existing content and suggests new ideas based on what's performing well, trending topics in your niche, and gaps in your content calendar.",
        tips: [
          "Use AI suggestions as inspiration, not verbatim content",
          "Mix AI suggestions with your own original ideas",
          "Review suggestions weekly to stay ahead of trends",
        ],
      },
      {
        title: "How To Use This Daily",
        content: "Morning: Check scheduled content to see what's going out today. Mid-week: Review drafts and move ideas forward. Anytime: Add new ideas the moment they strike you. Before posting: Move content through stages until it's ready.",
        example: "You wake up with a thought about 'morning routines for productivity'. Add it as an idea. Later, you flesh it out into a full LinkedIn post → move to Drafts. You schedule it for Thursday → move to Scheduled. Thursday arrives and you publish it → move to Published.",
      },
    ],
  },
  {
    id: "campaigns",
    title: "Campaigns",
    icon: Target,
    color: "#ef4444",
    description: "Run focused marketing initiatives with clear goals, budgets, and trackable results. A campaign is any coordinated marketing effort with a start and end date.",
    subsections: [
      {
        title: "What Makes Something a Campaign",
        content: "A campaign is NOT just posting content. It's a coordinated effort with a specific goal. Examples: 'Q1 Lead Generation Push', 'Product Launch - March', 'Summer Sale Email Sequence', 'Black Friday Ad Spend Campaign'. Regular daily posting is Content Pipeline. Focused efforts with goals and timelines are Campaigns.",
        tips: [
          "Every campaign should have a clear goal: leads, sales, brand awareness, engagement",
          "Set a budget upfront — know how much you're willing to spend",
          "Define success metrics before you start — how will you know if it worked?",
        ],
      },
      {
        title: "Platform Selection",
        content: "Choose the primary platform for your campaign. EMAIL: Newsletter campaigns, automated sequences, promotional emails. ADS: Paid advertising on any platform (Facebook Ads, Google Ads, LinkedIn Ads). SOCIAL: Organic or boosted social media campaigns.",
        tips: [
          "You can run multi-platform campaigns by creating separate campaign entries",
          "Start with one platform until you learn what works",
          "Email campaigns typically have the highest ROI for solopreneurs",
        ],
      },
      {
        title: "Status Explained",
        content: "PLANNING: You're setting it up but haven't launched yet. ACTIVE: Campaign is live and running. COMPLETED: Campaign finished its run. PAUSED: You stopped it mid-way (and should note why).",
        tips: [
          "Update status manually as campaigns evolve",
          "Paused campaigns should have a note explaining why",
          "Completed campaigns are your data — review what worked",
        ],
      },
      {
        title: "Metrics Explained",
        content: "IMPRESSIONS: How many times your content was displayed (includes repeats). CLICKS: How many people actually engaged and clicked something. CONVERSIONS: The desired action you wanted (sign up, buy, subscribe). ROI: Return on Investment — how much revenue you generated vs. how much you spent.",
        tips: [
          "Impressions without clicks = awareness but no engagement",
          "Clicks without conversions = interest but no action — maybe your offer needs work",
          "Good ROI varies: email typically 30-50x, ads typically 2-5x",
        ],
      },
      {
        title: "How To Plan Your First Campaign",
        content: "1. Define the goal (what success looks like). 2. Choose your platform (where is your audience?). 3. Set a timeline (start and end date). 4. Allocate budget (even if it's $0 for organic). 5. Create the campaign here. 6. Execute and track metrics. 7. Review and learn when complete.",
        example: "Goal: Get 50 new email subscribers in 30 days. Platform: Social (Instagram + LinkedIn). Timeline: April 1-30. Budget: $100 for boosted posts. Execute: Post daily content driving to lead magnet. Track: Watch subscriber count climb.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: TrendingUp,
    color: "#8b5cf6",
    description: "Understand what's working and what isn't. Data-driven decisions beat gut feelings every time.",
    subsections: [
      {
        title: "Campaign Performance View",
        content: "See all your campaigns side-by-side with their metrics. The bar charts show CTR (click-through rate) — higher bars mean people are engaging. Use this to identify your top performers and double down on what works.",
        tips: [
          "Compare campaigns against each other — which platform performed best?",
          "Look at CTR, not just impressions — engaged views matter more",
          "If a campaign has high impressions but zero clicks, the creative is the problem",
        ],
      },
      {
        title: "Email Performance",
        content: "Track how your email campaigns are performing. OPEN RATE: Percentage of recipients who opened (good is 20-40%). CLICK RATE: Percentage who clicked a link (good is 2-5%). These tell you if your subject lines and content are resonating.",
        tips: [
          "Low open rate = subject line problem or sent at wrong time",
          "Low click rate = content doesn't match the subject line promise",
          "A/B test subject lines to improve open rates over time",
        ],
      },
      {
        title: "What Numbers To Chase",
        content: "Don't optimize for vanity metrics (followers, likes). Focus on: CONVERSIONS — actual revenue or leads. EMAIL SUBSCRIBERS — owned audience growth. ENGAGEMENT RATE — percentage of audience actually interacting. WEBSITE TRAFFIC — where are people going after seeing your content?",
        tips: [
          "Set up conversion tracking on your website (Google Analytics goals)",
          "Track UTM parameters on all links to see which content drives traffic",
          "Review analytics weekly, not daily — daily fluctuations are noise",
        ],
      },
    ],
  },
  {
    id: "brand",
    title: "Brand Assets",
    icon: Image,
    color: "#ec4899",
    description: "Your brand resources in one place. Quick access to everything that makes your brand... your brand.",
    subsections: [
      {
        title: "Asset Types Explained",
        content: "GUIDELINES: Your brand book — colors, fonts, voice, logo usage rules. LOGO: All versions of your logo (dark, light, icon, full). TEMPLATES: Pre-made designs for posts, stories, emails — maintains consistency. SWIPE FILES: Examples of marketing you admire — for inspiration and benchmarking.",
        tips: [
          "Store the actual links/URLs here, not the files themselves (links are searchable)",
          "Use Figma or Canva for collaborative template creation",
          "Swipe files help when you're in a creative rut",
        ],
      },
      {
        title: "Building Your Brand Kit",
        content: "1. BRAND GUIDELINES: Create a doc with your mission, voice, colors, typography. Tools: Notion, Google Docs, or specialized brand books. 2. LOGOS: Export from Figma/Canva in multiple formats (PNG, SVG). Upload to Cloudinary and save the URLs here. 3. TEMPLATES: Create 5-10 starting templates in Canva. 4. SWIPE FILES: Bookmark inspiring marketing and note WHY it works.",
        tips: [
          "Consistency builds recognition — use the same colors and fonts everywhere",
          "Update this section when you rebrand or refresh your look",
          "Share this with any contractors so they match your brand",
        ],
      },
    ],
  },
  {
    id: "email",
    title: "Email Marketing",
    icon: Mail,
    color: "#22c55e",
    description: "Build and manage your email list, track campaigns, and nurture subscribers into customers.",
    subsections: [
      {
        title: "Why Email Marketing First",
        content: "Social media followers don't belong to you — algorithms change and you can lose access. Email subscribers ARE your audience. You own them. Email has the highest ROI of any marketing channel because you're speaking directly to people who've already raised their hand and said 'yes, talk to me.'",
        tips: [
          "Every piece of content should drive toward email capture",
          "Your email list is worth more than any follower count",
          "Aim for quality subscribers who actually engage, not just volume",
        ],
      },
      {
        title: "Newsletter vs Automated",
        content: "NEWSLETTER: Regular content sent on a schedule (weekly, biweekly, monthly). Keeps you top of mind. Examples: industry news, personal updates, curated content. AUTOMATED: Email sequences triggered by actions (welcome series, abandoned cart, post-purchase follow-up). Works while you sleep.",
        tips: [
          "Start with ONE newsletter people actually want to receive",
          "Build one automated sequence before creating more",
          "Welcome sequence is the minimum — every new subscriber should get it",
        ],
      },
      {
        title: "Building Your Sequence",
        content: "A basic welcome sequence: Email 1 (Day 0): Welcome + what to expect from you. Email 2 (Day 2): Share your best content or a lead magnet. Email 3 (Day 5): Introduce your product/service softly. Email 4 (Day 7): Direct pitch or special offer. Emails 5+ (ongoing): Value-first content mixed with occasional pitches.",
        tips: [
          "Space emails 2-5 days apart",
          "Every email should provide value, even if it's also selling",
          "Track which emails in your sequence drive the most replies",
        ],
      },
      {
        title: "Metrics To Watch",
        content: "SUBSCRIBERS: Is your list growing? If not, fix the capture. SENT: Total emails delivered. OPEN RATE: 20%+ is good — below 15% means subject lines need work. CLICK RATE: 2-5% is solid — below 2% means content doesn't match subject line. UNSUBSCRIBE RATE: Below 0.5% is normal — if higher, you're sending too often or content disappoints.",
        tips: [
          "Segment your list — engaged subscribers get different content than new ones",
          "Re-engage inactive subscribers before removing them",
          "Always be growing — stagnant lists shrink from natural attrition",
        ],
      },
    ],
  },
  {
    id: "seo",
    title: "SEO & Content",
    icon: Search,
    color: "#3b82f6",
    description: "Track your search engine optimization and content marketing efforts. SEO is a long game but worth playing.",
    subsections: [
      {
        title: "Why SEO Matters",
        content: "When someone searches 'how to [solve problem]' and your blog post is there, you get free, targeted traffic. Unlike ads which stop when you stop paying, good SEO content compounds over time. One blog post can drive traffic for years.",
        tips: [
          "SEO is a 6-12 month investment before you see significant results",
          "Start with low-competition long-tail keywords",
          "One great post on the right keyword beats ten mediocre posts",
        ],
      },
      {
        title: "Entry Types Explained",
        content: "BLOG: Actual articles on your website. Track them here to monitor their performance. KEYWORD: Keywords you're targeting or want to target. Track their ranking over time. BACKLINK: External websites linking to you. More backlinks = more authority = higher rankings.",
        tips: [
          "Track 5-10 primary keywords you're targeting",
          "Check keyword rankings monthly — not daily",
          "Backlinks from high-authority sites in your niche are most valuable",
        ],
      },
      {
        title: "Status Workflow",
        content: "IDEA: You thought of a topic but haven't started. IN_PROGRESS: You're actively writing or researching. PUBLISHED: Live on your website. RANKING: Appearing in search results for your target keyword (this is the goal).",
        tips: [
          "Focus on getting to 'Ranking' status — that's when SEO pays off",
          "Track your ranking position for target keywords weekly",
          "Top 3 positions get 60%+ of clicks — aim for position 1",
        ],
      },
      {
        title: "Quick SEO Wins",
        content: "1. Write one 1,500+ word blog post targeting one specific keyword. 2. Optimize your title and meta description with the keyword. 3. Internal link from your existing content to the new post. 4. Share it on social to get initial backlinks. 5. Reach out to one site asking for a guest post or link exchange.",
        tips: [
          "Long-tail keywords (4+ words) are easier to rank for",
          "Update old posts with new info to keep them ranking",
          "Use tools like Ubersuggest or Ahrefs for keyword research",
        ],
      },
    ],
  },
];

interface MarketingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketingGuide({ isOpen, onClose }: MarketingGuideProps) {
  const [activeSection, setActiveSection] = useState(guideSections[0].id);

  const currentSection = guideSections.find(s => s.id === activeSection)!;

  return (
    <>
      {/* Guide Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <BookOpen size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Marketing Guide</h2>
                    <p className="text-sm text-gray-500">Learn how to use each section effectively</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-white/5 p-4 overflow-y-auto">
                  <nav className="space-y-1">
                    {guideSections.map(section => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={clsx(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                            activeSection === section.id
                              ? "bg-white/10 text-white"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${section.color}20` }}
                          >
                            <Icon size={16} style={{ color: section.color }} />
                          </div>
                          <span className="text-sm font-medium">{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${currentSection.color}20` }}
                      >
                        <currentSection.icon size={24} style={{ color: currentSection.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{currentSection.title}</h3>
                        <p className="text-gray-400 text-sm">{currentSection.description}</p>
                      </div>
                    </div>

                    {/* Subsections */}
                    <div className="space-y-8">
                      {currentSection.subsections.map((sub, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="bg-white/3 rounded-xl p-5 border border-white/5"
                        >
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                              {i + 1}
                            </span>
                            {sub.title}
                          </h4>
                          <p className="text-gray-300 leading-relaxed mb-4">{sub.content}</p>

                          {sub.tips && sub.tips.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pro Tips</h5>
                              <ul className="space-y-2">
                                {sub.tips.map((tip, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                                    <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {sub.example && (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                              <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Example</h5>
                              <p className="text-sm text-gray-300 italic">{sub.example}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                      <button
                        onClick={() => {
                          const idx = guideSections.findIndex(s => s.id === activeSection);
                          if (idx > 0) setActiveSection(guideSections[idx - 1].id);
                        }}
                        disabled={activeSection === guideSections[0].id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-sm hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs text-gray-500">
                        {guideSections.findIndex(s => s.id === activeSection) + 1} of {guideSections.length}
                      </span>
                      <button
                        onClick={() => {
                          const idx = guideSections.findIndex(s => s.id === activeSection);
                          if (idx < guideSections.length - 1) setActiveSection(guideSections[idx + 1].id);
                        }}
                        disabled={activeSection === guideSections[guideSections.length - 1].id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Next Section →
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
