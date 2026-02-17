"use client";

import { useState, useEffect } from "react";
import { Twitter, Linkedin, Instagram, Image as ImageIcon, Lightbulb, Trash2, Edit2, Plus, X, Upload, ArrowRight, Sparkles, Database, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CldUploadWidget } from 'next-cloudinary';
import { clsx } from "clsx";

interface Post {
  _id: string;
  content: string;
  platforms: string | string[];
  status: string;
  type: 'idea' | 'draft';
  source?: 'manual' | 'ai_curator';
  imageIdea?: string;
  strategy?: string;
  imageUrl?: string;
}

export const SocialHubView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [linkedinName, setLinkedinName] = useState("");

  // Filtered Lists
  const ideas = posts.filter(p => p.type === 'idea');
  const drafts = posts.filter(p => p.type === 'draft');

  // Form State
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["twitter"]);
  const [strategy, setStrategy] = useState("");
  const [imageIdea, setImageIdea] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postType, setPostType] = useState<'idea' | 'draft'>('draft');
  const [isPosting, setIsPosting] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLinkedinStatus = async () => {
    try {
      const res = await fetch("/api/auth/linkedin/status");
      const data = await res.json();
      if (data.connected) {
        setLinkedinConnected(true);
        setLinkedinName(data.name);
      }
    } catch (e) {
      console.error("Failed to check LinkedIn status", e);
    }
  };

  useEffect(() => {
    fetchPosts();
    checkLinkedinStatus();
  }, []);

  const openModal = (post?: Post, defaultType: 'idea' | 'draft' = 'draft') => {
    if (post) {
      setEditingPost(post);
      setContent(post.content);
      setPlatforms(Array.isArray(post.platforms) ? post.platforms : [post.platforms]);
      setStrategy(post.strategy || "");
      setImageIdea(post.imageIdea || "");
      setImageUrl(post.imageUrl || "");
      setPostType(post.type);
    } else {
      setEditingPost(null);
      setContent("");
      setPlatforms(["twitter"]);
      setStrategy("");
      setImageIdea("");
      setImageUrl("");
      setPostType(defaultType);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      content,
      platforms,
      strategy,
      imageIdea,
      imageUrl,
      type: postType,
      status: "draft"
    };

    try {
      if (editingPost) {
        const res = await fetch(`/api/posts/${editingPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchPosts();
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchPosts();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save post", error);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setPosts(posts.filter(p => p._id !== id));
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete", e);
      fetchPosts();
    }
  };

  const convertToDraft = async (post: Post) => {
    // Optimistic update
    setPosts(posts.map(p => p._id === post._id ? { ...p, type: 'draft' } : p));

    try {
      await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'draft' })
      });
    } catch (e) {
      console.error("Failed to convert", e);
      fetchPosts();
    }
  };

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter(plat => plat !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const connectLinkedin = () => {
    window.location.href = "/api/auth/linkedin/login";
  };

  const postToTwitter = async (post: Post) => {
    if (!post.platforms.includes('twitter') && !post.platforms.includes('Twitter')) {
      alert("This post is not marked for Twitter.");
      return;
    }

    setIsPosting(post._id);
    try {
      const res = await fetch('/api/twitter/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          imageUrl: post.imageUrl
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('Tweet posted successfully!');
        // Update status to published locally and in DB
        setPosts(posts.map(p => p._id === post._id ? { ...p, status: 'published' } : p));
        await fetch(`/api/posts/${post._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' })
        });
      } else {
        alert('Failed to post tweet: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error posting tweet:", error);
      alert("Error posting tweet.");
    } finally {
      setIsPosting(null);
    }
  };

  const postToLinkedin = async (post: Post) => {
    if (!post.platforms.includes('linkedin') && !post.platforms.includes('Linkedin')) {
      alert("This post is not marked for LinkedIn.");
      return;
    }

    if (!linkedinConnected) {
      alert("Please connect LinkedIn first via the button at the top.");
      return;
    }

    setIsPosting(post._id);
    try {
      const res = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          imageUrl: post.imageUrl
        })
      });

      const data = await res.json();

      if (data.success) {
        alert('Posted to LinkedIn successfully!');
        // Update status if it's the only platform or handle multi-platform status logic
        // For now, mark as published if it was just for linkedin or if twitter is done too
        // Simple approach: just mark published
        setPosts(posts.map(p => p._id === post._id ? { ...p, status: 'published' } : p));
        await fetch(`/api/posts/${post._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' })
        });
      } else {
        alert('Failed to post to LinkedIn: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error posting to LinkedIn:", error);
      alert("Error posting to LinkedIn.");
    } finally {
      setIsPosting(null);
    }
  };

  const handlePost = async (post: Post) => {
    if (post.platforms.includes('twitter')) {
      await postToTwitter(post);
    }
    if (post.platforms.includes('linkedin') || post.platforms.includes('Linkedin')) {
      await postToLinkedin(post); // Sequential for now
    }
  };
  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "twitter": return <Twitter size={14} className="text-blue-400" />;
      case "linkedin": return <Linkedin size={14} className="text-blue-600" />;
      case "instagram": return <Instagram size={14} className="text-pink-500" />;
      default: return <div className="text-[10px] font-bold text-gray-500">{platform}</div>;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] animate-in fade-in duration-500 flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Social Engine <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">v1.0</span>
          </h2>
          <p className="text-gray-400 text-sm">Curate ideas and ship content.</p>
        </div>
        <div className="flex gap-3">
          {!linkedinConnected ? (
            <button
              onClick={connectLinkedin}
              className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/10 border border-[#0077b5]/30 text-[#0077b5] hover:bg-[#0077b5]/20 rounded-xl transition-all text-sm font-medium"
            >
              <Linkedin size={16} /> Connect LinkedIn
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/10 border border-[#0077b5]/30 text-[#0077b5] rounded-xl text-sm font-medium">
              <Linkedin size={16} /> {linkedinName || "Connected"}
            </div>
          )}
          <button
            onClick={() => openModal(undefined, 'idea')}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all text-sm font-medium"
          >
            <Lightbulb size={16} /> Add Idea
          </button>
          <button
            onClick={() => openModal(undefined, 'draft')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all text-sm font-medium"
          >
            <Edit2 size={16} /> New Draft
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full min-h-0">

        {/* --- LEFT: INSPIRATION BUCKET --- */}
        <div className="flex flex-col h-full bg-surface/30 border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-purple-400" />
              <h3 className="font-bold text-gray-200">Inspiration Bucket</h3>
              <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded text-xs">{ideas.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {ideas.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-border rounded-xl">
                <Sparkles size={24} className="mb-2 opacity-50" />
                <p className="text-sm">Bucket empty.</p>
                <p className="text-xs">AI Curator runs daily at 8am.</p>
              </div>
            ) : (
              ideas.map(post => (
                <motion.div
                  layout
                  key={post._id}
                  className="bg-background border border-border p-4 rounded-xl group hover:border-purple-500/30 transition-all relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      post.source === 'ai_curator' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-gray-800 border-gray-700 text-gray-400"
                    )}>
                      {post.source === 'ai_curator' ? 'AI Found' : 'Manual Idea'}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(post)} className="p-1.5 hover:bg-white/5 rounded text-gray-400"><Edit2 size={12} /></button>
                      <button onClick={() => deletePost(post._id)} className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3 mb-4 leading-relaxed">{post.content}</p>

                  {/* Strategy Tag */}
                  {post.strategy && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-surface p-2 rounded-lg">
                      <Lightbulb size={12} />
                      <span className="truncate">{post.strategy}</span>
                    </div>
                  )}

                  <button
                    onClick={() => convertToDraft(post)}
                    className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    Move to Drafts <ArrowRight size={12} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* --- RIGHT: DRAFTS PIPELINE --- */}
        <div className="flex flex-col h-full bg-surface/30 border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Edit2 size={18} className="text-primary" />
              <h3 className="font-bold text-gray-200">Production Pipeline</h3>
              <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded text-xs">{drafts.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {drafts.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-border rounded-xl">
                <p className="text-sm">No active drafts.</p>
              </div>
            ) : (
              drafts.map(post => (
                <motion.div
                  key={post._id}
                  layout
                  className="bg-background border border-border rounded-xl p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1 p-1.5 bg-surface rounded-lg border border-border">
                        {Array.isArray(post.platforms)
                          ? post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)
                          : getPlatformIcon(post.platforms)
                        }
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(post)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                      <button onClick={() => deletePost(post._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {post.imageUrl && (
                    <div className="mb-4 relative w-full h-40 bg-black/50 rounded-lg overflow-hidden border border-border/50">
                      <img src={post.imageUrl} alt="Post visual" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}

                  <div className="text-sm text-gray-200 whitespace-pre-wrap mb-4 font-medium leading-relaxed">
                    {post.content}
                  </div>

                  {post.imageIdea && !post.imageUrl && (
                    <div className="flex gap-3 text-xs bg-purple-500/5 border border-purple-500/10 p-3 rounded-lg mt-3">
                      <ImageIcon size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-400 block mb-0.5">Missing Visual</span>
                        <span className="text-purple-200/80">{post.imageIdea}</span>
                      </div>
                    </div>
                  )}

                  {/* Publish Action */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handlePost(post)}
                      disabled={isPosting === post._id || post.status === 'published'}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                        post.status === 'published'
                          ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                          : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                      )}
                    >
                      {isPosting === post._id ? (
                        <><Loader2 size={12} className="animate-spin" /> Posting...</>
                      ) : post.status === 'published' ? (
                        <>Published</>
                      ) : (
                        <><Send size={12} /> Post Now</>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Draft Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface sticky top-0">
                <h3 className="text-lg font-bold text-white">
                  {editingPost ? "Edit Item" : (postType === 'idea' ? "New Inspiration Idea" : "New Social Draft")}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                {/* Type Selector (Hidden if editing) */}
                {!editingPost && (
                  <div className="flex gap-2 p-1 bg-background rounded-xl border border-border">
                    <button
                      onClick={() => setPostType('idea')}
                      className={clsx("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", postType === 'idea' ? "bg-purple-500 text-white" : "text-gray-500 hover:text-white")}
                    >
                      Inspiration Idea
                    </button>
                    <button
                      onClick={() => setPostType('draft')}
                      className={clsx("flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all", postType === 'draft' ? "bg-primary text-white" : "text-gray-500 hover:text-white")}
                    >
                      Ready Draft
                    </button>
                  </div>
                )}

                {/* Platforms */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Platforms</label>
                  <div className="flex gap-2">
                    {["twitter", "linkedin", "instagram"].map(p => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${platforms.includes(p)
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-background border-border text-gray-400 hover:text-gray-200"
                          }`}
                      >
                        {getPlatformIcon(p)}
                        <span className="capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">
                    {postType === 'idea' ? 'Rough Notes / Idea' : 'Post Content'}
                  </label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={postType === 'idea' ? "Saw a cool trend about..." : "What's on your mind?"}
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm text-white focus:border-primary outline-none resize-none"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">{content.length} chars</div>
                </div>

                {/* Image Upload (Only for Drafts usually, but enabled for ideas too) */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Visuals</label>

                  {!imageUrl ? (
                    <CldUploadWidget
                      uploadPreset="social_hub_default"
                      onSuccess={(result: any) => {
                        setImageUrl(result.info.secure_url);
                      }}
                      options={{
                        sources: ['local', 'url', 'camera'],
                        multiple: false,
                        maxFiles: 1,
                        styles: {
                          palette: {
                            window: "#0A0A0A",
                            windowBorder: "#90A0B3",
                            tabIcon: "#0E73F6",
                            menuIcons: "#5A616A",
                            textDark: "#000000",
                            textLight: "#FFFFFF",
                            link: "#0E73F6",
                            action: "#FF620C",
                            inactiveTabIcon: "#0E2F5A",
                            error: "#F44235",
                            inProgress: "#0078FF",
                            complete: "#20B832",
                            sourceBg: "#E4EBF1"
                          }
                        }
                      }}
                    >
                      {({ open }) => {
                        return (
                          <button
                            onClick={() => open()}
                            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all"
                          >
                            <Upload size={24} className="mb-2" />
                            <span className="text-sm font-medium">Upload Image</span>
                          </button>
                        );
                      }}
                    </CldUploadWidget>
                  ) : (
                    <div className="relative w-full h-48 bg-black/50 rounded-lg overflow-hidden border border-border/50 group">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Strategy & Concept */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Strategy / Goal</label>
                    <input
                      type="text"
                      value={strategy}
                      onChange={e => setStrategy(e.target.value)}
                      placeholder="e.g. Viral Hook, Authority Building"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Visual Concept (Notes)</label>
                    <input
                      type="text"
                      value={imageIdea}
                      onChange={e => setImageIdea(e.target.value)}
                      placeholder="e.g. Screenshot of dashboard"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-surface sticky bottom-0">
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPost ? "Save Changes" : (postType === 'idea' ? "Save to Bucket" : "Create Draft")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
