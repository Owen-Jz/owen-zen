"use client";

import { useState, useEffect } from "react";
import { Play, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, Bookmark } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  url: string;
  platform: string;
  thumbnail: string;
  notes: string;
  progress: number;
  status: "watching" | "completed" | "paused";
  createdAt: string;
}

export default function BrainstormingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", url: "", platform: "", notes: "" });
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const json = await res.json();
      if (json.success) {
        setCourses(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourse),
    });
    setNewCourse({ title: "", url: "", platform: "", notes: "" });
    setShowAddForm(false);
    fetchCourses();
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    fetchCourses();
  };

  const updateProgress = async (id: string, progress: number) => {
    await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    fetchCourses();
  };

  const toggleStatus = async (id: string, status: Course["status"]) => {
    await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchCourses();
  };

  const watching = courses.filter(c => c.status === "watching");
  const completed = courses.filter(c => c.status === "completed");
  const paused = courses.filter(c => c.status === "paused");

  return (
    <main className="min-h-screen bg-[#020205] text-[#e2e8f0] font-sans selection:bg-indigo-500/30 overflow-x-hidden antialiased">
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent_70%)]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.3)]">
              <Play className="text-white w-7 h-7 fill-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase">
                Brainstorming
              </h1>
              <p className="text-gray-400 text-sm mt-1">Courses I'm watching</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all"
          >
            <Plus size={18} />
            Add Course
          </button>
        </header>

        {/* Add Course Form */}
        {showAddForm && (
          <form onSubmit={addCourse} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <input
              type="text"
              placeholder="Course title"
              value={newCourse.title}
              onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="url"
              placeholder="Course URL (e.g. Udemy, YouTube)"
              value={newCourse.url}
              onChange={e => setNewCourse({ ...newCourse, url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Platform (e.g. Udemy, YouTube, Coursera)"
              value={newCourse.platform}
              onChange={e => setNewCourse({ ...newCourse, platform: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <textarea
              placeholder="Notes (what I'm learning, key takeaways...)"
              value={newCourse.notes}
              onChange={e => setNewCourse({ ...newCourse, notes: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all"
              >
                Save Course
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading courses...</div>
        ) : (
          <>
            {/* Watching Section */}
            {watching.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Play size={14} className="text-indigo-400 fill-indigo-400" />
                  Currently Watching ({watching.length})
                </h2>
                <div className="space-y-4">
                  {watching.map(course => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      expandedNotes={expandedNotes}
                      setExpandedNotes={setExpandedNotes}
                      onDelete={deleteCourse}
                      onUpdateProgress={updateProgress}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Section */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-green-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Bookmark size={14} />
                  Completed ({completed.length})
                </h2>
                <div className="space-y-4">
                  {completed.map(course => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      expandedNotes={expandedNotes}
                      setExpandedNotes={setExpandedNotes}
                      onDelete={deleteCourse}
                      onUpdateProgress={updateProgress}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Paused Section */}
            {paused.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ChevronUp size={14} />
                  Paused ({paused.length})
                </h2>
                <div className="space-y-4">
                  {paused.map(course => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      expandedNotes={expandedNotes}
                      setExpandedNotes={setExpandedNotes}
                      onDelete={deleteCourse}
                      onUpdateProgress={updateProgress}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              </section>
            )}

            {courses.length === 0 && (
              <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No courses yet. Add your first course above.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function CourseCard({
  course,
  expandedNotes,
  setExpandedNotes,
  onDelete,
  onUpdateProgress,
  onToggleStatus,
}: {
  course: Course;
  expandedNotes: string | null;
  setExpandedNotes: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleStatus: (id: string, status: Course["status"]) => void;
}) {
  const statusColors = {
    watching: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    completed: "text-green-400 bg-green-500/10 border-green-500/30",
    paused: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusColors[course.status]}`}>
              {course.status}
            </span>
            {course.platform && (
              <span className="text-[10px] text-gray-500">{course.platform}</span>
            )}
          </div>
          <h3 className="text-white font-semibold text-base leading-tight mb-2">{course.title}</h3>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400">{course.progress}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={course.progress}
              onChange={e => onUpdateProgress(course._id, parseInt(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Notes Toggle */}
          {course.notes && (
            <button
              onClick={() => setExpandedNotes(expandedNotes === course._id ? null : course._id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {expandedNotes === course._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expandedNotes === course._id ? "Hide Notes" : "Show Notes"}
            </button>
          )}

          {/* Expanded Notes */}
          {expandedNotes === course._id && course.notes && (
            <p className="mt-3 text-sm text-gray-300 bg-white/5 rounded-xl p-3 border border-white/5">
              {course.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {course.url && (
            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-white transition-colors"
              title="Open course"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button
            onClick={() => onDelete(course._id)}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete course"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}