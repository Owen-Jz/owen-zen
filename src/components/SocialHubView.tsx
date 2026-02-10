"use client";

import { useState, useEffect } from "react";
import { Twitter, Linkedin, Instagram, Image as ImageIcon, Lightbulb, Trash2, Edit2, Plus, X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Post {
  _id: string;
  content: string;
  platforms: string | string[];
  status: string;
  imageIdea?: string;
  strategy?: string;
  imageUrl?: string;
}

export const SocialHubView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form State
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["twitter"]);
  const [strategy, setStrategy] = useState("");
  const [imageIdea, setImageIdea] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Simplified for now (URL input)
  
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setContent(post.content);
      setPlatforms(Array.isArray(post.platforms) ? post.platforms : [post.platforms]);
      setStrategy(post.strategy || "");
      setImageIdea(post.imageIdea || "");
      setImageUrl(post.imageUrl || "");
    } else {
      setEditingPost(null);
      setContent("");
      setPlatforms(["twitter"]);
      setStrategy("");
      setImageIdea("");
      setImageUrl("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { content, platforms, strategy, imageIdea, imageUrl, status: "draft" };
    
    try {
      if (editingPost) {
        // Update
        const res = await fetch(`/api/posts/${editingPost._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) fetchPosts();
      } else {
        // Create
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
    if (!confirm("Delete this draft?")) return;
    setPosts(posts.filter(p => p._id !== id));
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete", e);
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

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "twitter": return <Twitter size={16} className="text-blue-400" />;
      case "linkedin": return <Linkedin size={16} className="text-blue-600" />;
      case "instagram": return <Instagram size={16} className="text-pink-500" />;
      default: return <div className="text-xs font-bold text-gray-500">{platform}</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Social Command Center</h2>
          <p className="text-gray-400 text-sm">Draft, schedule, and strategize your personal brand.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all text-sm font-medium"
        >
          <Plus size={16} /> New Draft
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading Content Engine...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border border-dashed border-border rounded-xl">
          No drafts found. Start creating!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {posts.map((post) => (
            <motion.div
              key={post._id}
              layout
              className="bg-surface border border-border rounded-xl p-6 hover:border-primary/30 transition-all group flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 p-2 bg-background rounded-lg border border-border">
                    {Array.isArray(post.platforms) 
                      ? post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)
                      : getPlatformIcon(post.platforms)
                    }
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 border border-gray-700/50 px-2 py-0.5 rounded-full">
                    {post.status}
                  </span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(post)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                  <button onClick={() => deletePost(post._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Image Preview if available */}
              {post.imageUrl && (
                <div className="mb-4 relative w-full h-48 bg-black/50 rounded-lg overflow-hidden border border-border/50">
                  <img src={post.imageUrl} alt="Post visual" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              <div className="bg-background rounded-lg p-4 border border-border/50 text-sm text-gray-300 whitespace-pre-wrap mb-4 flex-grow font-medium leading-relaxed">
                {post.content}
              </div>

              <div className="space-y-3 mt-auto">
                {post.strategy && (
                  <div className="flex gap-3 text-xs bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg">
                    <Lightbulb size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-400 block mb-0.5">Strategy</span>
                      <span className="text-blue-200/80">{post.strategy}</span>
                    </div>
                  </div>
                )}
                {post.imageIdea && !post.imageUrl && (
                  <div className="flex gap-3 text-xs bg-purple-500/5 border border-purple-500/10 p-3 rounded-lg">
                    <ImageIcon size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-400 block mb-0.5">Visual Concept</span>
                      <span className="text-purple-200/80">{post.imageIdea}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
                <h3 className="text-lg font-bold text-white">{editingPost ? "Edit Draft" : "New Social Draft"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={20} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                {/* Platforms */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Platforms</label>
                  <div className="flex gap-2">
                    {["twitter", "linkedin", "instagram"].map(p => (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          platforms.includes(p) 
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
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Content</label>
                  <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm text-white focus:border-primary outline-none resize-none"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">{content.length} chars</div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Image URL (Optional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                    />
                  </div>
                  {imageUrl && (
                    <div className="mt-2 h-32 bg-black/50 rounded-lg overflow-hidden border border-border">
                       <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
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
                    <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Visual Concept</label>
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
                  {editingPost ? "Save Changes" : "Create Draft"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
