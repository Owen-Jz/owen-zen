"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink, Play, Film, Link2, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Video {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  category: VideoCategory;
  topics?: string[];
}

// API response video type (uses _id from MongoDB)
interface ApiVideo {
  _id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  format: VideoCategory;
  topics?: string[];
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

const TOPIC_CONFIG: Record<string, { label: string; color: string }> = {
  technology: { label: "Technology", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  business: { label: "Business", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  communication: { label: "Communication", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
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
  onTopicsChange: _onTopicsChange,
  topicConfig,
}: {
  video: Video;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, category: VideoCategory) => void;
  onTopicsChange: (id: string, topics: string[]) => void;
  topicConfig: Record<string, { label: string; color: string }>;
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

        {/* Topic pills */}
        {(video.topics?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.topics?.map((topic: string) => {
              const cfg = topicConfig[topic] ?? { label: topic, color: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
              return (
                <span key={topic} className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const VideosSection = () => {
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['watch-later-videos'],
    queryFn: async () => {
      const res = await fetch('/api/watch-later');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const addVideoMutation = useMutation({
    mutationFn: async (data: { url: string; title?: string; format: VideoCategory; topics?: string[] }) => {
      const res = await fetch('/api/watch-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-later-videos'] }),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watch-later/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-later-videos'] }),
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; format?: VideoCategory; topics?: string[]; title?: string }) => {
      const res = await fetch(`/api/watch-later/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watch-later-videos'] }),
  });

  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoCategory, setNewVideoCategory] = useState<VideoCategory>("other");
  const [newVideoTopics, setNewVideoTopics] = useState<string[]>([]);
  const [formatFilter, setFormatFilter] = useState<VideoCategory | "all">("all");
  const [topicFilter, setTopicFilter] = useState<string[]>([]);

  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    const videoId = extractVideoId(newVideoUrl);
    if (!videoId) { alert("Invalid YouTube URL"); return; }
    addVideoMutation.mutate({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: newVideoTitle.trim() || undefined,
      format: newVideoCategory,
      topics: newVideoTopics,
    });
    setNewVideoUrl("");
    setNewVideoTitle("");
    setNewVideoCategory("other");
    setNewVideoTopics([]);
  };

  const deleteVideo = (id: string) => deleteVideoMutation.mutate(id);
  const updateFormat = (id: string, format: VideoCategory) => updateVideoMutation.mutate({ id, format });
  const updateTopics = (id: string, topics: string[]) => updateVideoMutation.mutate({ id, topics });

  const toggleTopicFilter = (topic: string) => {
    setTopicFilter((prev) => prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]);
  };

  // AND filter: format + topic
  const filtered = videos.filter((v: ApiVideo) => {
    const formatMatch = formatFilter === "all" || v.format === formatFilter;
    const topicMatch = topicFilter.length === 0 || topicFilter.every((t) => v.topics?.includes(t));
    return formatMatch && topicMatch;
  });

  const counts = { all: videos.length, tutorial: 0, entertainment: 0, documentary: 0, music: 0, podcast: 0, other: 0 };
  videos.forEach((v: ApiVideo) => { if (v.format in counts) counts[v.format as keyof typeof counts]++; });

  const topicCounts = { technology: 0, business: 0, communication: 0 };
  videos.forEach((v: ApiVideo) => { v.topics?.forEach((t: string) => { if (t in topicCounts) topicCounts[t as keyof typeof topicCounts]++; }); });

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
          {/* Topic selector */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 mr-1">Topics:</span>
            {Object.entries(TOPIC_CONFIG).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setNewVideoTopics((prev) =>
                  prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                )}
                className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full border transition-all ${
                  newVideoTopics.includes(key) ? val.color : "bg-transparent border-border text-gray-500"
                }`}
              >
                {newVideoTopics.includes(key) ? "✓ " : ""}{val.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Format filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "tutorial", "entertainment", "documentary", "music", "podcast", "other"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormatFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
              formatFilter === f
                ? "bg-primary text-white border-primary"
                : "border-border text-gray-400 hover:text-white hover:border-primary/40 bg-surface"
            }`}
          >
            {f === "all" ? "All" : VIDEO_CATEGORY_CONFIG[f].label}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="text-xs text-gray-500 mr-1">Topic:</span>
        {Object.entries(TOPIC_CONFIG).map(([key, val]) => (
          <button
            key={key}
            onClick={() => toggleTopicFilter(key)}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              topicFilter.includes(key) ? val.color : "border-border text-gray-500 hover:border-primary/40"
            }`}
          >
            {topicFilter.includes(key) ? "✓ " : ""}{val.label}
            <span className="opacity-60">({topicCounts[key as keyof typeof topicCounts]})</span>
          </button>
        ))}
        {topicFilter.length > 0 && (
          <button onClick={() => setTopicFilter([])} className="text-xs text-gray-500 hover:text-white px-2 py-1 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Play size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400">Loading videos...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video: ApiVideo) => (
            <VideoCard
              key={video._id}
              video={{ ...video, id: video._id, category: video.format }}
              onDelete={deleteVideo}
              onCategoryChange={updateFormat}
              onTopicsChange={updateTopics}
              topicConfig={TOPIC_CONFIG}
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
