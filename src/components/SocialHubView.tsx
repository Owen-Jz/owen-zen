"use client";

import { useState, useEffect } from "react";
import { Twitter, Linkedin, Instagram, Image as ImageIcon, Lightbulb, Trash2, Edit2, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface Post {
  _id: string;
  content: string;
  platforms: string | string[]; // Can be single string or array
  status: string;
  imageIdea?: string;
  strategy?: string;
}

export const SocialHubView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "twitter": return <Twitter size={16} className="text-blue-400" />;
      case "linkedin": return <Linkedin size={16} className="text-blue-600" />;
      case "instagram": return <Instagram size={16} className="text-pink-500" />;
      default: return <div className="text-xs font-bold text-gray-500">{platform}</div>;
    }
  };

  const deletePost = async (id: string) => {
      if(!confirm("Delete this draft?")) return;
      // Optimistic update
      setPosts(posts.filter(p => p._id !== id));
      try {
          await fetch(`/api/posts/${id}`, { method: "DELETE" }); // Assuming this endpoint exists, if not we need to create it
      } catch (e) {
          console.error("Failed to delete", e);
          fetchPosts(); // Revert
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white">Social Command Center</h2>
            <p className="text-gray-400 text-sm">Draft, schedule, and strategize your personal brand.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all text-sm font-medium">
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
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg border border-border">
                    {/* Handle array or string platform */}
                    {Array.isArray(post.platforms) 
                        ? post.platforms.map(p => <span key={p} className="mr-1">{getPlatformIcon(p)}</span>)
                        : getPlatformIcon(post.platforms)
                    }
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 border border-gray-700/50 px-2 py-0.5 rounded-full">
                    {post.status}
                  </span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={() => deletePost(post._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-background rounded-lg p-4 border border-border/50 text-sm text-gray-300 whitespace-pre-wrap mb-4 flex-grow font-medium leading-relaxed">
                {post.content}
              </div>

              {/* Strategy & Image */}
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
                {post.imageIdea && (
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
    </div>
  );
};
