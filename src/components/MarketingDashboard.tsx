"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import MarketingGuide from "./MarketingGuide";
import {
  Megaphone,
  Lightbulb,
  FileText,
  BarChart3,
  Image,
  Mail,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ExternalLink,
  DollarSign,
  Users,
  Eye,
  MousePointerClick,
  X,
  Calendar,
  Zap,
  Target,
  Archive,
  Send,
  Twitter,
  Linkedin,
  Instagram,
  Loader2,
  ArrowRight,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Types
interface Campaign {
  _id: string;
  name: string;
  description: string;
  platform: "email" | "ads" | "social";
  status: "planning" | "active" | "completed" | "paused";
  startDate: string;
  endDate?: string;
  budget: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
}

interface BrandAsset {
  _id: string;
  name: string;
  type: "guidelines" | "logo" | "template" | "swipe";
  url: string;
  notes: string;
}

interface EmailCampaign {
  _id: string;
  name: string;
  type: "newsletter" | "automated";
  status: "draft" | "active" | "completed";
  subscriberCount: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
}

interface SEOEntry {
  _id: string;
  type: "blog" | "keyword" | "backlink";
  title: string;
  url: string;
  status: "idea" | "in_progress" | "published" | "ranking";
  metrics: {
    ranking?: number;
    traffic?: number;
    backlinks?: number;
  };
}

interface PipelinePost {
  _id: string;
  content: string;
  platforms: string | string[];
  type: "idea" | "draft";
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor?: string;
  createdAt: string;
}

type SubTab = "dashboard" | "pipeline" | "campaigns" | "analytics" | "brand" | "email" | "seo";
type PlatformFilter = "all" | "twitter" | "linkedin" | "instagram";

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  instagram: "#E4405F",
};

const PLATFORM_BG: Record<string, string> = {
  twitter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  linkedin: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  instagram: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  twitter: <Twitter size={11} />,
  linkedin: <Linkedin size={11} />,
  instagram: <Instagram size={11} />,
};

// Stats card component
const StatCard = ({ label, value, icon: Icon, trend, trendUp }: { label: string; value: string | number; icon: any; trend?: string; trendUp?: boolean }) => (
  <div className="bg-surface border border-white/5 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <Icon size={16} className="text-gray-500" />
    </div>
    <div className="text-2xl font-bold mb-1">{value}</div>
    {trend && (
      <div className={clsx("flex items-center gap-1 text-xs", trendUp ? "text-green-400" : "text-red-400")}>
        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend}
      </div>
    )}
  </div>
);

// Quick create button
const QuickCreateBtn = ({ label, icon: Icon, onClick, color }: { label: string; icon: any; onClick: () => void; color: string }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-sm"
  >
    <Icon size={16} style={{ color }} />
    {label}
  </button>
);

// Pipeline board component
interface PipelineBoardProps {
  posts: PipelinePost[];
  loading: boolean;
  platformFilter: PlatformFilter;
  onMove: (postId: string, updates: { type?: string; status?: string; scheduledFor?: string | null }) => void;
  onSchedule: (post: PipelinePost) => void;
  onDelete: (postId: string) => void;
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function PipelineBoard({ posts, loading, platformFilter, onMove, onSchedule, onDelete }: PipelineBoardProps) {
  const filtered = posts.filter(p => {
    if (platformFilter === "all") return true;
    const platforms = Array.isArray(p.platforms) ? p.platforms : [p.platforms];
    return platforms.includes(platformFilter);
  });

  const ideas = filtered.filter(p => p.type === "idea" && !p.scheduledFor);
  const drafts = filtered.filter(p => p.type === "draft" && !p.scheduledFor);
  const scheduled = filtered.filter(p => p.scheduledFor && p.status !== "published");
  const published = filtered.filter(p => p.status === "published");

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 size={24} className="animate-spin" /></div>;
  }

  const SectionHeader = ({ label, count, open, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="flex items-center gap-1.5 mb-3 group w-full">
      {open ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
      <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-gray-500 px-1.5 py-0.5 rounded">{count}</span>
    </button>
  );

  const PostCard = ({ post }: { post: PipelinePost }) => {
    const platforms = Array.isArray(post.platforms) ? post.platforms : [post.platforms];
    return (
      <div className="bg-surface border border-white/5 rounded-lg p-3 hover:border-white/20 transition-all group">
        <p className="text-sm font-medium mb-2 line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {platforms.map(p => (
            <span key={p} className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", PLATFORM_BG[p] || "bg-white/10 text-gray-400")}>
              {PLATFORM_ICON[p]} <span className="capitalize">{p}</span>
            </span>
          ))}
          <span className="text-[10px] text-gray-600 ml-auto">{getTimeAgo(post.createdAt)}</span>
        </div>
        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {post.type === "idea" && (
            <button onClick={() => onMove(post._id, { type: "draft" })} className="flex-1 py-1 rounded bg-white/5 text-[10px] text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-1">
              <ArrowRight size={10} /> Draft
            </button>
          )}
          {post.type === "draft" && !post.scheduledFor && (
            <>
              <button onClick={() => onSchedule(post)} className="flex-1 py-1 rounded bg-white/5 text-[10px] text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all flex items-center justify-center gap-1">
                <CalendarPlus size={10} /> Schedule
              </button>
              <button onClick={() => onMove(post._id, { status: "published" })} className="flex-1 py-1 rounded bg-white/5 text-[10px] text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all flex items-center justify-center gap-1">
                <ArrowRight size={10} /> Publish
              </button>
            </>
          )}
          {post.scheduledFor && post.status !== "published" && (
            <>
              <button onClick={() => onMove(post._id, { status: "published" })} className="flex-1 py-1 rounded bg-white/5 text-[10px] text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all flex items-center justify-center gap-1">
                <ArrowRight size={10} /> Publish
              </button>
              <button onClick={() => onMove(post._id, { scheduledFor: null, status: "draft" })} className="flex-1 py-1 rounded bg-white/5 text-[10px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1">
                Unschedule
              </button>
            </>
          )}
          {post.status === "published" && (
            <button onClick={() => onMove(post._id, { type: "draft", status: "draft" })} className="flex-1 py-1 rounded bg-white/5 text-[10px] text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-1">
              <ArrowRight size={10} /> Move to Draft
            </button>
          )}
          <button onClick={() => onDelete(post._id)} className="py-1 px-1.5 rounded bg-white/5 text-[10px] text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Ideas */}
      <div className="bg-white/2 rounded-xl p-4 min-h-[300px]">
        <SectionHeader label="Ideas" count={ideas.length} open={true} onToggle={() => {}} />
        <div className="space-y-2">
          {ideas.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No ideas yet</p>}
          {ideas.map(post => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
      {/* Drafts */}
      <div className="bg-white/2 rounded-xl p-4 min-h-[300px]">
        <SectionHeader label="Drafts" count={drafts.length} open={true} onToggle={() => {}} />
        <div className="space-y-2">
          {drafts.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No drafts yet</p>}
          {drafts.map(post => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
      {/* Scheduled */}
      <div className="bg-white/2 rounded-xl p-4 min-h-[300px]">
        <SectionHeader label="Scheduled" count={scheduled.length} open={true} onToggle={() => {}} />
        <div className="space-y-2">
          {scheduled.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Nothing scheduled</p>}
          {scheduled.map(post => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
      {/* Published */}
      <div className="bg-white/2 rounded-xl p-4 min-h-[300px]">
        <SectionHeader label="Published" count={published.length} open={true} onToggle={() => {}} />
        <div className="space-y-2">
          {published.length === 0 && <p className="text-xs text-gray-600 text-center py-4">Nothing published</p>}
          {published.map(post => <PostCard key={post._id} post={post} />)}
        </div>
      </div>
    </div>
  );
}

export default function MarketingDashboard() {
  const [subTab, setSubTab] = useState<SubTab>("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [seoEntries, setSeoEntries] = useState<SEOEntry[]>([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Pipeline state
  const [pipelinePosts, setPipelinePosts] = useState<PipelinePost[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState<PipelinePost | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduling, setScheduling] = useState(false);
  const [newIdeaContent, setNewIdeaContent] = useState("");
  const [newIdeaPlatform, setNewIdeaPlatform] = useState<string[]>(["twitter"]);
  const [creatingIdea, setCreatingIdea] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(true);
  const [draftsOpen, setDraftsOpen] = useState(true);
  const [scheduledOpen, setScheduledOpen] = useState(true);
  const [publishedOpen, setPublishedOpen] = useState(true);

  // Fetch data
  useEffect(() => {
    fetchCampaigns();
    fetchBrandAssets();
    fetchEmailCampaigns();
    fetchSEOEntries();
    fetchPipelinePosts();
  }, []);

  const fetchPipelinePosts = async () => {
    try {
      setPipelineLoading(true);
      const res = await fetch("/api/posts");
      const json = await res.json();
      if (json.success) setPipelinePosts(json.data);
    } catch (e) { console.error(e); }
    finally { setPipelineLoading(false); }
  };

  const movePost = async (postId: string, updates: { type?: string; status?: string; scheduledFor?: string | null }) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setPipelinePosts(posts => posts.map(p => {
          if (p._id !== postId) return p;
          return {
            ...p,
            ...updates,
            type: (updates.type as "idea" | "draft") ?? p.type,
            status: (updates.status as "draft" | "published" | "scheduled" | "failed") ?? p.status,
            scheduledFor: updates.scheduledFor === null ? undefined : updates.scheduledFor ?? p.scheduledFor,
          } as PipelinePost;
        }));
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateIdea = async () => {
    if (!newIdeaContent.trim()) return;
    setCreatingIdea(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newIdeaContent.trim(), platforms: newIdeaPlatform, type: "idea", status: "draft" }),
      });
      const json = await res.json();
      if (json.success) {
        setPipelinePosts(posts => [json.data, ...posts]);
        setNewIdeaContent("");
        setIsNewIdeaModalOpen(false);
      }
    } catch (e) { console.error(e); }
    finally { setCreatingIdea(false); }
  };

  const handleSchedule = async () => {
    if (!schedulingPost || !scheduleDate || !scheduleTime) return;
    setScheduling(true);
    try {
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      const dt = new Date(scheduleDate);
      dt.setHours(hours, minutes, 0, 0);
      const res = await fetch(`/api/posts/${schedulingPost._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: dt.toISOString(), status: "scheduled" }),
      });
      if (res.ok) {
        setPipelinePosts(posts => posts.map(p => p._id === schedulingPost._id ? { ...p, scheduledFor: dt.toISOString(), status: "scheduled" } : p));
        setSchedulingPost(null);
      }
    } catch (e) { console.error(e); }
    finally { setScheduling(false); }
  };

  const deletePipelinePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      setPipelinePosts(posts => posts.filter(p => p._id !== postId));
    } catch (e) { console.error(e); }
  };

  const togglePlatformFilter = (p: PlatformFilter) => {
    setPlatformFilter(prev => prev === p ? "all" : p);
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/marketing/campaigns");
      const json = await res.json();
      if (json.success) setCampaigns(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchBrandAssets = async () => {
    try {
      const res = await fetch("/api/marketing/brand-assets");
      const json = await res.json();
      if (json.success) setBrandAssets(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchEmailCampaigns = async () => {
    try {
      const res = await fetch("/api/marketing/email");
      const json = await res.json();
      if (json.success) setEmailCampaigns(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchSEOEntries = async () => {
    try {
      const res = await fetch("/api/marketing/seo");
      const json = await res.json();
      if (json.success) setSeoEntries(json.data);
    } catch (e) { console.error(e); }
  };

  const tabs: { id: SubTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: Megaphone },
    { id: "pipeline", label: "Content", icon: Lightbulb },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "brand", label: "Brand", icon: Image },
    { id: "email", label: "Email", icon: Mail },
    { id: "seo", label: "SEO", icon: Search },
  ];

  const platformColors = {
    email: "#22c55e",
    ads: "#f59e0b",
    social: "#3b82f6",
  };

  const statusColors = {
    planning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    paused: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Marketing Department</h1>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/30 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            How To Use This
          </button>
        </div>
        <p className="text-gray-400">Manage all your marketing activities in one place</p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              subTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-surface border border-white/5 text-gray-400 hover:text-white hover:border-white/20"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* DASHBOARD */}
        {subTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Active Campaigns" value={campaigns.filter(c => c.status === "active").length} icon={Target} />
              <StatCard label="Email Subscribers" value={emailCampaigns.reduce((sum, e) => sum + e.subscriberCount, 0)} icon={Users} trend="+12%" trendUp />
              <StatCard label="Total Impressions" value={(campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0) / 1000).toFixed(1) + "K"} icon={Eye} />
              <StatCard label="Avg. ROI" value={campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.metrics.roi, 0) / campaigns.length).toFixed(0) + "%" : "0%"} icon={TrendingUp} />
            </div>

            {/* Quick Actions */}
            <div className="bg-surface border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Create</h3>
              <div className="flex flex-wrap gap-3">
                <QuickCreateBtn label="New Idea" icon={Lightbulb} onClick={() => setSubTab("pipeline")} color="#f59e0b" />
                <QuickCreateBtn label="New Campaign" icon={Target} onClick={() => { setSubTab("campaigns"); setIsCampaignModalOpen(true); }} color="#ef4444" />
                <QuickCreateBtn label="New Email" icon={Mail} onClick={() => setSubTab("email")} color="#22c55e" />
                <QuickCreateBtn label="New SEO Entry" icon={Search} onClick={() => setSubTab("seo")} color="#8b5cf6" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Active Campaigns</h3>
                <div className="space-y-3">
                  {campaigns.filter(c => c.status === "active").slice(0, 5).map(c => (
                    <div key={c._id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{c.platform}</p>
                      </div>
                      <span className={clsx("px-2 py-0.5 rounded text-xs border", statusColors[c.status])}>{c.status}</span>
                    </div>
                  ))}
                  {campaigns.filter(c => c.status === "active").length === 0 && (
                    <p className="text-sm text-gray-500">No active campaigns</p>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">SEO Status</h3>
                <div className="space-y-3">
                  {seoEntries.filter(s => s.status === "ranking").slice(0, 5).map(s => (
                    <div key={s._id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{s.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{s.type}</p>
                      </div>
                      <span className="text-green-400 text-sm font-mono">#{s.metrics.ranking || "-"}</span>
                    </div>
                  ))}
                  {seoEntries.filter(s => s.status === "ranking").length === 0 && (
                    <p className="text-sm text-gray-500">No ranking entries</p>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Brand Assets</h3>
                <div className="space-y-3">
                  {brandAssets.slice(0, 5).map(a => (
                    <div key={a._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                          <Image size={14} className="text-gray-400" />
                        </div>
                        <p className="font-medium text-sm truncate max-w-[120px]">{a.name}</p>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{a.type}</span>
                    </div>
                  ))}
                  {brandAssets.length === 0 && (
                    <p className="text-sm text-gray-500">No brand assets</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONTENT PIPELINE */}
        {subTab === "pipeline" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="bg-surface border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Content Pipeline</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsNewIdeaModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm hover:brightness-110 transition-all"
                  >
                    <Plus size={14} /> New Idea
                  </button>
                </div>
              </div>

              {/* Platform filters */}
              <div className="flex gap-2 mb-6">
                {(["all", "twitter", "linkedin", "instagram"] as PlatformFilter[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize",
                      platformFilter === p
                        ? PLATFORM_BG[p] || "bg-white/20 text-white border border-white/20"
                        : "bg-white/5 hover:bg-white/10 text-gray-400"
                    )}
                  >
                    {p === "all" ? "All" : PLATFORM_ICON[p]}
                    {p !== "all" && <span className="capitalize">{p}</span>}
                  </button>
                ))}
              </div>

              {/* Pipeline stages */}
              <PipelineBoard
                posts={pipelinePosts}
                loading={pipelineLoading}
                platformFilter={platformFilter}
                onMove={movePost}
                onSchedule={(post) => {
                  setSchedulingPost(post);
                  const today = new Date().toISOString().split("T")[0];
                  setScheduleDate(today);
                  setScheduleTime("09:00");
                }}
                onDelete={deletePipelinePost}
              />
            </div>
          </motion.div>
        )}

        {/* CAMPAIGNS */}
        {subTab === "campaigns" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Marketing Campaigns</h3>
              <button
                onClick={() => setIsCampaignModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
              >
                <Plus size={16} /> New Campaign
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(campaign => (
                <div key={campaign._id} className="bg-surface border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold mb-1">{campaign.name}</h4>
                      <p className="text-xs text-gray-500 capitalize">{campaign.platform}</p>
                    </div>
                    <span className={clsx("px-2 py-0.5 rounded text-xs border", statusColors[campaign.status])}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{campaign.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Impressions</p>
                      <p className="font-bold text-sm">{campaign.metrics.impressions.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Clicks</p>
                      <p className="font-bold text-sm">{campaign.metrics.clicks.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Conv.</p>
                      <p className="font-bold text-sm">{campaign.metrics.conversions}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-gray-500">ROI</p>
                      <p className={clsx("font-bold text-sm", campaign.metrics.roi > 0 ? "text-green-400" : "text-red-400")}>
                        {campaign.metrics.roi}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-1.5 rounded-lg bg-white/5 text-xs hover:bg-white/10 transition-all">
                      <Edit2 size={12} className="inline mr-1" /> Edit
                    </button>
                    <button className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all">
                      <Trash2 size={12} className="inline mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}

              {campaigns.length === 0 && (
                <div className="col-span-full bg-surface border border-white/5 rounded-xl p-12 text-center">
                  <Target size={48} className="mx-auto text-gray-600 mb-4" />
                  <h4 className="font-bold mb-2">No campaigns yet</h4>
                  <p className="text-sm text-gray-500 mb-4">Create your first marketing campaign to start tracking</p>
                  <button
                    onClick={() => setIsCampaignModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
                  >
                    <Plus size={16} className="inline mr-2" /> Create Campaign
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ANALYTICS */}
        {subTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <h3 className="text-lg font-bold">Marketing Analytics</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h4 className="font-bold mb-4">Campaign Performance</h4>
                <div className="space-y-4">
                  {campaigns.map(c => (
                    <div key={c._id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-gray-500">{c.metrics.impressions.toLocaleString()} impressions</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((c.metrics.clicks / c.metrics.impressions) * 100, 100)}%`,
                            background: platformColors[c.platform],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No campaign data yet</p>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h4 className="font-bold mb-4">Email Performance</h4>
                <div className="space-y-4">
                  {emailCampaigns.map(e => (
                    <div key={e._id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{e.name}</span>
                        <span className="text-gray-500">{e.sentCount} sent</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-xs text-gray-500">Open Rate</p>
                          <p className="font-bold text-sm text-green-400">{e.openRate}%</p>
                        </div>
                        <div className="bg-white/5 rounded p-2">
                          <p className="text-xs text-gray-500">Click Rate</p>
                          <p className="font-bold text-sm text-blue-400">{e.clickRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {emailCampaigns.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No email campaign data yet</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* BRAND ASSETS */}
        {subTab === "brand" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Brand Assets</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all">
                <Plus size={16} /> Add Asset
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {brandAssets.map(asset => (
                <div key={asset._id} className="bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all group">
                  <div className="aspect-video bg-white/5 flex items-center justify-center">
                    <Image size={32} className="text-gray-600" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                      <span className="text-xs text-gray-500 capitalize ml-2">{asset.type}</span>
                    </div>
                    {asset.notes && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{asset.notes}</p>}
                    <div className="flex gap-2">
                      <a href={asset.url} target="_blank" className="flex-1 py-1.5 rounded-lg bg-white/5 text-xs text-center hover:bg-white/10 transition-all">
                        <ExternalLink size={12} className="inline mr-1" /> Open
                      </a>
                      <button className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all">
                        <Trash2 size={12} className="inline mr-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {brandAssets.length === 0 && (
                <div className="col-span-full bg-surface border border-white/5 rounded-xl p-12 text-center">
                  <Image size={48} className="mx-auto text-gray-600 mb-4" />
                  <h4 className="font-bold mb-2">No brand assets yet</h4>
                  <p className="text-sm text-gray-500 mb-4">Add your brand guidelines, logos, and templates</p>
                  <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all">
                    <Plus size={16} className="inline mr-2" /> Add First Asset
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* EMAIL MARKETING */}
        {subTab === "email" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Email Marketing</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all">
                <Plus size={16} /> New Email Campaign
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Subscribers" value={emailCampaigns.reduce((sum, e) => sum + e.subscriberCount, 0)} icon={Users} />
              <StatCard label="Emails Sent" value={emailCampaigns.reduce((sum, e) => sum + e.sentCount, 0)} icon={Send} />
              <StatCard label="Avg. Open Rate" value={emailCampaigns.length > 0 ? (emailCampaigns.reduce((sum, e) => sum + e.openRate, 0) / emailCampaigns.length).toFixed(1) + "%" : "0%"} icon={Mail} />
            </div>

            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Campaign</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Type</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Subscribers</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Sent</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Open Rate</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {emailCampaigns.map(e => (
                    <tr key={e._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="p-4 font-medium">{e.name}</td>
                      <td className="p-4 text-gray-400 capitalize">{e.type}</td>
                      <td className="p-4">
                        <span className={clsx("px-2 py-0.5 rounded text-xs border",
                          e.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          e.status === "completed" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        )}>{e.status}</span>
                      </td>
                      <td className="p-4">{e.subscriberCount.toLocaleString()}</td>
                      <td className="p-4">{e.sentCount.toLocaleString()}</td>
                      <td className="p-4 text-green-400 font-mono">{e.openRate}%</td>
                      <td className="p-4 text-blue-400 font-mono">{e.clickRate}%</td>
                    </tr>
                  ))}
                  {emailCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-500">
                        No email campaigns yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* SEO */}
        {subTab === "seo" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">SEO & Content</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all">
                <Plus size={16} /> Add Entry
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <StatCard label="Blog Posts" value={seoEntries.filter(s => s.type === "blog").length} icon={FileText} />
              <StatCard label="Keywords Tracking" value={seoEntries.filter(s => s.type === "keyword").length} icon={Search} />
              <StatCard label="Backlinks" value={seoEntries.reduce((sum, s) => sum + (s.metrics.backlinks || 0), 0)} icon={ExternalLink} />
            </div>

            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Title</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Type</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Ranking</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Traffic</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider p-4">Backlinks</th>
                  </tr>
                </thead>
                <tbody>
                  {seoEntries.map(entry => (
                    <tr key={entry._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <a href={entry.url} target="_blank" className="hover:text-primary transition-all">
                            {entry.title}
                          </a>
                          <ExternalLink size={12} className="text-gray-500" />
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 capitalize">{entry.type}</td>
                      <td className="p-4">
                        <span className={clsx("px-2 py-0.5 rounded text-xs border capitalize",
                          entry.status === "published" || entry.status === "ranking" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          entry.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        )}>{entry.status.replace("_", " ")}</span>
                      </td>
                      <td className="p-4 font-mono">{entry.metrics.ranking ? `#${entry.metrics.ranking}` : "-"}</td>
                      <td className="p-4 font-mono">{entry.metrics.traffic ? entry.metrics.traffic.toLocaleString() : "-"}</td>
                      <td className="p-4 font-mono">{entry.metrics.backlinks || "-"}</td>
                    </tr>
                  ))}
                  {seoEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        No SEO entries yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Modal */}
      <MarketingGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* New Idea Modal */}
      <AnimatePresence>
        {isNewIdeaModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">New Idea</h3>
                <button onClick={() => setIsNewIdeaModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Platforms</label>
                  <div className="flex gap-2">
                    {["twitter", "linkedin", "instagram"].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewIdeaPlatform(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                        className={clsx(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                          newIdeaPlatform.includes(p)
                            ? "bg-purple-500/20 border-purple-500 text-purple-400"
                            : "bg-background border-border text-gray-400 hover:text-gray-200"
                        )}
                      >
                        {PLATFORM_ICON[p]} <span className="capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Idea / Hook / Notes</label>
                  <textarea
                    value={newIdeaContent}
                    onChange={e => setNewIdeaContent(e.target.value)}
                    placeholder="Start with a hook, a link, a one-liner..."
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:border-purple-500 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleCreateIdea}
                  disabled={creatingIdea || !newIdeaContent.trim()}
                  className="w-full py-3 bg-primary hover:brightness-110 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                >
                  {creatingIdea ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Add to Ideas</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {schedulingPost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Schedule Post</h3>
                <button onClick={() => setSchedulingPost(null)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-400 bg-background p-3 rounded-lg line-clamp-2">{schedulingPost.content}</p>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Time</label>
                  <select
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                  >
                    {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleSchedule}
                  disabled={scheduling || !scheduleDate}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                >
                  {scheduling ? <><Loader2 size={16} className="animate-spin" /> Scheduling...</> : <><CalendarPlus size={16} /> Schedule</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
