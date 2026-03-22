"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, Play, Film, Link2, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Video {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  category: VideoCategory;
}

type VideoCategory = "tutorial" | "entertainment" | "documentary" | "music" | "podcast" | "other";

const VIDEO_CATEGORY_CONFIG: Record<VideoCategory, { label: string; color: string }> = {
  tutorial: { label: "Tutorial", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  entertainment: { label: "Entertainment", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  documentary: { label: "Documentary", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  music: { label: "Music", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  podcast: { label: "Podcast", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  other: { label: "Other", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
};

type MovieStatus = "want" | "watching" | "watched";

interface Movie {
  id: string;
  title: string;
  url?: string;
  note?: string;
  status: MovieStatus;
  addedAt: string;
  thumbnail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const STATUS_CONFIG: Record<MovieStatus, { label: string; color: string }> = {
  want: { label: "Want to Watch", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  watching: { label: "Watching", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  watched: { label: "Watched", color: "bg-green-500/15 text-green-400 border-green-500/30" },
};

// ─── Movie Card ───────────────────────────────────────────────────────────────

const MovieCard = ({
  movie,
  onDelete,
  onStatusChange,
}: {
  movie: Movie;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MovieStatus) => void;
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const cfg = STATUS_CONFIG[movie.status];

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-background">
        {movie.thumbnail ? (
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`bg-primary/10 flex items-center justify-center ${movie.thumbnail ? "hidden" : ""}`}>
          <Film size={24} className="text-primary" />
        </div>
        {movie.url && (
          <a
            href={movie.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="p-3 bg-primary rounded-full">
              <ExternalLink size={18} className="text-white" />
            </div>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{movie.title}</h3>
            {movie.url && (
              <a
                href={movie.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500 hover:text-primary transition-colors"
              >
                <Link2 size={11} />
                {getDomain(movie.url)}
              </a>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() => onDelete(movie.id)}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Note */}
        {movie.note && (
          <p className="text-xs text-gray-500 leading-relaxed">{movie.note}</p>
        )}

        {/* Status pill */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${cfg.color}`}
          >
            {cfg.label}
            <ChevronDown size={12} className={`transition-transform ${showStatusMenu ? "rotate-180" : ""}`} />
          </button>

          {showStatusMenu && (
            <div className="absolute left-0 bottom-full mb-1 bg-surface border border-border rounded-xl overflow-hidden shadow-xl z-10 min-w-[160px]">
            {(Object.entries(STATUS_CONFIG) as [MovieStatus, typeof STATUS_CONFIG[MovieStatus]][]).map(([key, val]) => (
              <button
                key={key}
                onClick={() => {
                  onStatusChange(movie.id, key);
                  setShowStatusMenu(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-colors ${
                  movie.status === key ? "text-primary" : "text-gray-400"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

// ─── Movies Section ───────────────────────────────────────────────────────────

const MoviesSection = () => {
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: "1",
      title: "Interstellar",
      url: "https://www.netflix.com",
      note: "Rewatch — masterpiece",
      status: "want",
      addedAt: new Date().toISOString(),
    },
  ]);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [filter, setFilter] = useState<MovieStatus | "all">("all");

  const addMovie = () => {
    if (!title.trim()) return;
    const movie: Movie = {
      id: Date.now().toString(),
      title: title.trim(),
      url: url.trim() || undefined,
      note: note.trim() || undefined,
      status: "want",
      addedAt: new Date().toISOString(),
      thumbnail: thumbnail.trim() || undefined,
    };
    setMovies([movie, ...movies]);
    setTitle("");
    setUrl("");
    setNote("");
    setThumbnail("");
  };

  const deleteMovie = (id: string) => setMovies(movies.filter((m) => m.id !== id));

  const updateStatus = (id: string, status: MovieStatus) =>
    setMovies(movies.map((m) => (m.id === id ? { ...m, status } : m)));

  const filtered = filter === "all" ? movies : movies.filter((m) => m.status === filter);

  const counts = {
    all: movies.length,
    want: movies.filter((m) => m.status === "want").length,
    watching: movies.filter((m) => m.status === "watching").length,
    watched: movies.filter((m) => m.status === "watched").length,
  };

  return (
    <div>
      {/* Add movie form */}
      <div className="mb-8 bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Film size={16} className="text-primary" /> Add Movie
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMovie()}
              placeholder="Movie title..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
            <button
              onClick={addMovie}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-2 font-medium text-sm shrink-0"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link (Netflix, Letterboxd, anywhere)... optional"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note... optional"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
          </div>
          <input
            type="text"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="Poster/Thumbnail URL... optional (Paste an image URL for the movie poster)"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "want", "watching", "watched"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "border-border text-gray-400 hover:text-white hover:border-primary/40"
            }`}
          >
            {f === "all" ? "All" : STATUS_CONFIG[f].label}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onDelete={deleteMovie}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Film size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg mb-2">No movies here</p>
          <p className="text-gray-600 text-sm">Add a title above to start your watchlist</p>
        </div>
      )}
    </div>
  );
};

// ─── Videos Section ───────────────────────────────────────────────────────────

const VideoCard = ({
  video,
  onDelete,
  onCategoryChange,
}: {
  video: Video;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: VideoCategory) => void;
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const videoId = extractVideoId(video.url);
  const cfg = VIDEO_CATEGORY_CONFIG[video.category];

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-background">
        <img
          src={video.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "")}
          alt={video.title || "Video thumbnail"}
          className="w-full h-full object-cover"
          onError={(e) => {
            if (videoId) e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-gray-400 line-clamp-2 flex-1">
            {video.title || "YouTube Video"}
          </p>
          <div className="flex gap-2 shrink-0">
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
              onClick={() => onDelete(video.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Category selector */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${cfg.color}`}
          >
            {cfg.label}
            <ChevronDown size={12} className={`transition-transform ${showCategoryMenu ? "rotate-180" : ""}`} />
          </button>

          {showCategoryMenu && (
            <div className="absolute left-0 bottom-full mb-1 bg-surface border border-border rounded-xl overflow-hidden shadow-xl z-10 min-w-[140px]">
              {(Object.entries(VIDEO_CATEGORY_CONFIG) as [VideoCategory, typeof VIDEO_CATEGORY_CONFIG[VideoCategory]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => {
                    onCategoryChange(video.id, key);
                    setShowCategoryMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-white/5 transition-colors ${
                    video.category === key ? "text-primary" : "text-gray-400"
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideosSection = () => {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      url: "https://www.youtube.com/watch?v=KmXfxcGhJDE",
      title: "Added Video",
      thumbnail: "https://img.youtube.com/vi/KmXfxcGhJDE/maxresdefault.jpg",
      category: "tutorial",
    },
    {
      id: "2",
      url: "https://youtu.be/MeDzw7FKfZk?si=rZQBIlyqTOXAPzJi",
      title: "Watch: High-Value Video",
      thumbnail: "https://img.youtube.com/vi/MeDzw7FKfZk/maxresdefault.jpg",
      category: "entertainment",
    },
  ]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoCategory, setNewVideoCategory] = useState<VideoCategory>("other");
  const [filter, setFilter] = useState<VideoCategory | "all">("all");

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
      title: newVideoTitle.trim() || undefined,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      category: newVideoCategory,
    };
    setVideos([newVideo, ...videos]);
    setNewVideoUrl("");
    setNewVideoTitle("");
    setNewVideoCategory("other");
  };

  const deleteVideo = (id: string) => setVideos(videos.filter((v) => v.id !== id));

  const updateCategory = (id: string, category: VideoCategory) =>
    setVideos(videos.map((v) => (v.id === id ? { ...v, category } : v)));

  const filtered = filter === "all" ? videos : videos.filter((v) => v.category === filter);

  const counts: Record<VideoCategory | "all", number> = {
    all: videos.length,
    tutorial: videos.filter((v) => v.category === "tutorial").length,
    entertainment: videos.filter((v) => v.category === "entertainment").length,
    documentary: videos.filter((v) => v.category === "documentary").length,
    music: videos.filter((v) => v.category === "music").length,
    podcast: videos.filter((v) => v.category === "podcast").length,
    other: videos.filter((v) => v.category === "other").length,
  };

  return (
    <div>
      {/* Add video */}
      <div className="mb-8 bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Play size={16} className="text-primary" /> Add YouTube Video
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVideo()}
              placeholder="Paste YouTube URL..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
            <button
              onClick={addVideo}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-2 font-medium text-sm"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              placeholder="Video title... optional"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
            />
            <select
              value={newVideoCategory}
              onChange={(e) => setNewVideoCategory(e.target.value as VideoCategory)}
              className="bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none text-gray-300"
            >
              {(Object.entries(VIDEO_CATEGORY_CONFIG) as [VideoCategory, typeof VIDEO_CATEGORY_CONFIG[VideoCategory]][]).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "tutorial", "entertainment", "documentary", "music", "podcast", "other"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "border-border text-gray-400 hover:text-white hover:border-primary/40 bg-surface"
            }`}
          >
            {f === "all" ? "All" : VIDEO_CATEGORY_CONFIG[f].label}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={deleteVideo}
              onCategoryChange={updateCategory}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg mb-2">No videos here</p>
          <p className="text-gray-600 text-sm">Add YouTube videos to watch later</p>
        </div>
      )}
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

type WatchTab = "movies" | "videos";

export const WatchLaterView = () => {
  const [activeTab, setActiveTab] = useState<WatchTab>("movies");

  const tabs: { id: WatchTab; label: string; icon: React.ReactNode }[] = [
    { id: "movies", label: "Movies", icon: <Film size={15} /> },
    { id: "videos", label: "Videos", icon: <Play size={15} /> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Inner tab bar */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              activeTab === tab.id
                ? "bg-primary text-white border-primary"
                : "border-border text-gray-400 hover:text-white hover:border-primary/40 bg-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "movies" && <MoviesSection />}
      {activeTab === "videos" && <VideosSection />}
    </div>
  );
};
