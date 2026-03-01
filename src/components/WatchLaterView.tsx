"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink, Play, Film, Link2, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Video {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
}

type MovieStatus = "want" | "watching" | "watched";

interface Movie {
  id: string;
  title: string;
  url?: string;
  note?: string;
  status: MovieStatus;
  addedAt: string;
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
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-all group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        {/* Film icon + title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Film size={18} className="text-primary" />
          </div>
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {movie.url && (
            <a
              href={movie.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-primary transition-colors"
              title="Open link"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            onClick={() => onDelete(movie.id)}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Note */}
      {movie.note && (
        <p className="text-xs text-gray-500 leading-relaxed border-t border-border pt-3">
          {movie.note}
        </p>
      )}

      {/* Status pill (bottom) */}
      <div className="relative mt-auto">
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
    };
    setMovies([movie, ...movies]);
    setTitle("");
    setUrl("");
    setNote("");
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

// ─── Videos Section (existing) ────────────────────────────────────────────────

const VideosSection = () => {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      url: "https://www.youtube.com/watch?v=KmXfxcGhJDE",
      title: "Added Video",
      thumbnail: "https://img.youtube.com/vi/KmXfxcGhJDE/maxresdefault.jpg",
    },
    {
      id: "2",
      url: "https://youtu.be/MeDzw7FKfZk?si=rZQBIlyqTOXAPzJi",
      title: "Watch: High-Value Video",
      thumbnail: "https://img.youtube.com/vi/MeDzw7FKfZk/maxresdefault.jpg",
    },
  ]);
  const [newVideoUrl, setNewVideoUrl] = useState("");

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
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
    setVideos([...videos, newVideo]);
    setNewVideoUrl("");
  };

  const deleteVideo = (id: string) => setVideos(videos.filter((v) => v.id !== id));

  return (
    <div>
      {/* Add video */}
      <div className="mb-8 bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Play size={16} className="text-primary" /> Add YouTube Video
        </h2>
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
      </div>

      {/* Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const videoId = extractVideoId(video.url);
            return (
              <div
                key={video.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all group"
              >
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
                <div className="p-4">
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
      ) : (
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
