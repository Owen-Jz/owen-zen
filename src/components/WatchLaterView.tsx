"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, Play } from "lucide-react";

interface Video {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
}

export const WatchLaterView = () => {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      url: "https://www.youtube.com/watch?v=KmXfxcGhJDE",
      title: "Added Video",
      thumbnail: "https://img.youtube.com/vi/KmXfxcGhJDE/maxresdefault.jpg"
    },
    {
      id: "2",
      url: "https://youtu.be/MeDzw7FKfZk?si=rZQBIlyqTOXAPzJi",
      title: "Watch: High-Value Video",
      thumbnail: "https://img.youtube.com/vi/MeDzw7FKfZk/maxresdefault.jpg"
    }
  ]);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    
    const videoId = extractVideoId(newVideoUrl);
    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }

    const newVideo: Video = {
      id: Date.now().toString(),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };

    setVideos([...videos, newVideo]);
    setNewVideoUrl("");
  };

  const deleteVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Add Video Section */}
      <div className="mb-8 bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Add Video</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVideo()}
            placeholder="Paste YouTube URL..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:border-primary outline-none"
          />
          <button
            onClick={addVideo}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => {
          const videoId = extractVideoId(video.url);
          
          return (
            <div
              key={video.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-background">
                <img
                  src={video.thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-primary rounded-full hover:scale-110 transition-transform"
                  >
                    <Play size={24} className="text-white" fill="white" />
                  </a>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {video.title || "YouTube Video"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg mb-2">No videos yet</p>
          <p className="text-gray-600 text-sm">Add YouTube videos to watch later</p>
        </div>
      )}
    </div>
  );
};
