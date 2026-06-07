"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, Search, Twitter, Linkedin, Instagram, Loader2, Inbox, CalendarPlus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

interface Post {
  _id: string;
  content: string;
  platforms: string | string[];
  status: string;
  type: 'idea' | 'draft';
  source?: 'manual' | 'ai_curator';
  imageIdea?: string;
  imageUrl?: string;
  scheduledFor?: string;
  strategy?: string;
  createdAt: string;
}

type FilterType = 'all' | 'idea' | 'draft';

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

export const PostBucketView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [schedulingPost, setSchedulingPost] = useState<Post | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(true);
  const [draftsOpen, setDraftsOpen] = useState(true);

  // Form state
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["twitter"]);
  const [strategy, setStrategy] = useState("");
  const [imageIdea, setImageIdea] = useState("");
  const [postType, setPostType] = useState<'idea' | 'draft'>('idea');

  // Scheduling state
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduling, setScheduling] = useState(false);

  // Quick-add state
  const [quickContent, setQuickContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      if (json.success) {
        const unscheduled = json.data.filter((p: Post) => !p.scheduledFor);
        setPosts(unscheduled);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.type === filter;
    const matchesSearch = post.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const ideas = filteredPosts.filter(p => p.type === 'idea');
  const drafts = filteredPosts.filter(p => p.type === 'draft');

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setContent(post.content);
      setPlatforms(Array.isArray(post.platforms) ? post.platforms : [post.platforms]);
      setStrategy(post.strategy || "");
      setImageIdea(post.imageIdea || "");
      setPostType(post.type);
    } else {
      setEditingPost(null);
      setContent("");
      setPlatforms(["twitter"]);
      setStrategy("");
      setImageIdea("");
      setPostType('idea');
    }
    setIsModalOpen(true);
  };

  const openScheduleModal = (post: Post) => {
    setSchedulingPost(post);
    const today = new Date().toISOString().split('T')[0];
    setScheduleDate(today);
    setScheduleTime("09:00");
    setIsScheduleModalOpen(true);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) return;
    setIsAdding(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: quickContent.trim(), platforms: ["twitter"], type: "idea", status: "draft" }),
      });
      setQuickContent("");
      fetchPosts();
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { content, platforms, strategy, imageIdea, type: postType, status: "draft" };
    try {
      if (editingPost) {
        await fetch(`/api/posts/${editingPost._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Failed to save post", error);
    }
  };

  const handleSchedule = async () => {
    if (!schedulingPost || !scheduleDate || !scheduleTime) return;
    setScheduling(true);
    try {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const dt = new Date(scheduleDate);
      dt.setHours(hours, minutes, 0, 0);
      await fetch(`/api/posts/${schedulingPost._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: dt.toISOString(), status: 'scheduled' }),
      });
      setIsScheduleModalOpen(false);
      setSchedulingPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Failed to schedule post", error);
    } finally {
      setScheduling(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setPosts(posts.filter(p => p._id !== id));
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch (e) {
      fetchPosts();
    }
  };

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.length > 1 ? platforms.filter(plat => plat !== p) : []);
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "twitter": return <Twitter size={13} className="text-blue-400" />;
      case "linkedin": return <Linkedin size={13} className="text-blue-600" />;
      case "instagram": return <Instagram size={13} className="text-pink-500" />;
      default: return <div className="text-[10px] font-bold text-gray-500">{platform}</div>;
    }
  };

  const PostRow = ({ post }: { post: Post }) => (
    <div className="flex items-start gap-4 p-4 bg-surface border border-white/5 hover:border-white/10 rounded-xl group transition-all">
      {/* Platforms */}
      <div className="flex gap-1.5 pt-0.5 shrink-0">
        {Array.isArray(post.platforms)
          ? post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)
          : getPlatformIcon(post.platforms)
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 leading-relaxed">{post.content}</p>
        {post.strategy && (
          <p className="text-xs text-gray-600 mt-1 truncate">{post.strategy}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openScheduleModal(post)} className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-purple-400 rounded" title="Schedule">
          <CalendarPlus size={13} />
        </button>
        <button onClick={() => openModal(post)} className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-white rounded" title="Edit">
          <Edit2 size={13} />
        </button>
        <button onClick={() => deletePost(post._id)} className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );

  const SectionHeader = ({ label, count, open, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="flex items-center gap-2 mb-3 group">
      {open ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
      <span className="text-[10px] font-mono bg-surface border border-border text-gray-600 px-1.5 py-0.5 rounded">{count}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] animate-in fade-in duration-500 flex flex-col pt-6">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
          <Inbox size={22} className="text-purple-400" />
          Post Bucket
        </h2>
        <p className="text-gray-500 text-sm">Pick an idea, turn it into a draft, schedule it.</p>
      </div>

      {/* Quick Capture */}
      <form onSubmit={handleQuickAdd} className="mb-8 shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            placeholder="Quick capture — paste an idea, thought, or hook..."
            className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickContent.trim() || isAdding}
            className="px-5 py-3 bg-primary hover:brightness-110 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0"
          >
            <Plus size={16} /> Capture
          </button>
        </div>
      </form>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(['all', 'idea', 'draft'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                filter === f
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-surface border border-white/10 text-gray-500 hover:text-white"
              )}
            >
              {f === 'all' ? 'All' : f + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Posts — two sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        {filteredPosts.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="Nothing here yet"
            description="Capture a content idea above to get started."
            actionLabel="Add First Idea"
            onAction={() => {
              const input = document.querySelector('input[placeholder^="Quick capture"]') as HTMLInputElement | null;
              if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }}
          />
        )}

        {/* Ideas Section */}
        {ideas.length > 0 && (
          <div>
            <SectionHeader label="Ideas" count={ideas.length} open={ideasOpen} onToggle={() => setIdeasOpen(v => !v)} />
            <AnimatePresence>
              {ideasOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2 overflow-hidden">
                  {ideas.map(post => <PostRow key={post._id} post={post} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Drafts Section */}
        {drafts.length > 0 && (
          <div>
            <SectionHeader label="Drafts" count={drafts.length} open={draftsOpen} onToggle={() => setDraftsOpen(v => !v)} />
            <AnimatePresence>
              {draftsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2 overflow-hidden">
                  {drafts.map(post => <PostRow key={post._id} post={post} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => openModal()}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary rounded-full shadow-[0_4px_20px_rgba(220,38,38,0.4)] flex items-center justify-center hover:brightness-110 transition-all z-50"
        title="Add post"
      >
        <Plus size={20} className="text-white" />
      </button>

      {/* Post Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">{editingPost ? "Edit Post" : "New Post"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Type Toggle */}
                <div className="flex gap-2 p-1 bg-background rounded-xl border border-border">
                  <button type="button" onClick={() => setPostType('idea')} className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", postType === 'idea' ? "bg-purple-500 text-white" : "text-gray-500 hover:text-white")}>
                    Idea
                  </button>
                  <button type="button" onClick={() => setPostType('draft')} className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", postType === 'draft' ? "bg-primary text-white" : "text-gray-500 hover:text-white")}>
                    Draft
                  </button>
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Platforms</label>
                  <div className="flex gap-2">
                    {["twitter", "linkedin", "instagram"].map(p => (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all", platforms.includes(p) ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-background border-border text-gray-400 hover:text-gray-200")}>
                        {getPlatformIcon(p)} <span className="capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">
                    {postType === 'idea' ? 'Rough Notes / Hook' : 'Post Content'}
                  </label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={postType === 'idea' ? "Start with a hook, a link, a one-liner..." : "What's on your mind?"} className="w-full h-40 bg-background border border-border rounded-xl p-4 text-sm text-white focus:border-purple-500 outline-none resize-none" required />
                </div>

                {/* Optional fields — only show for drafts */}
                <AnimatePresence>
                  {postType === 'draft' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                      <div>
                        <label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Strategy / Goal <span className="text-gray-600 font-normal">(optional)</span></label>
                        <input type="text" value={strategy} onChange={e => setStrategy(e.target.value)} placeholder="e.g. Authority Building, Viral Hook" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Visual Concept <span className="text-gray-600 font-normal">(optional)</span></label>
                        <input type="text" value={imageIdea} onChange={e => setImageIdea(e.target.value)} placeholder="e.g. Screenshot of dashboard with arrows" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all text-sm">
                  {editingPost ? "Save Changes" : "Add to Bucket"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && schedulingPost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Schedule Post</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-400 bg-background p-3 rounded-lg line-clamp-2">{schedulingPost.content}</p>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Date</label>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-1.5 block">Time</label>
                  <select value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none">
                    {TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <button onClick={handleSchedule} disabled={scheduling || !scheduleDate} className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                  {scheduling ? <><Loader2 size={16} className="animate-spin" /> Scheduling...</> : <><CalendarPlus size={16} /> Schedule</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
