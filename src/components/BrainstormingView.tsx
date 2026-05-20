"use client";

import { useState, useEffect } from "react";
import { Play, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, Bookmark, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

export const BrainstormingView = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", url: "", platform: "", notes: "" });
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editNotes, setEditNotes] = useState("");

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

  const updateNotes = async (id: string, notes: string) => {
    await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setEditingCourse(null);
    fetchCourses();
  };

  const watching = courses.filter(c => c.status === "watching");
  const completed = courses.filter(c => c.status === "completed");
  const paused = courses.filter(c => c.status === "paused");

  const statusBadgeColors = {
    watching: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    completed: "bg-green-500/15 text-green-400 border-green-500/30",
    paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  };

  const statusIconColors = {
    watching: "text-indigo-400",
    completed: "text-green-400",
    paused: "text-yellow-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
            <Play className="w-6 h-6 text-indigo-400 fill-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Brainstorming</h2>
            <p className="text-sm text-gray-400">Courses I'm watching</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-xl font-bold text-sm transition-all"
        >
          <Plus size={16} />
          Add Course
        </button>
      </div>

      {/* Add Course Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addCourse}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Course title"
              value={newCourse.title}
              onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="url"
                placeholder="Course URL"
                value={newCourse.url}
                onChange={e => setNewCourse({ ...newCourse, url: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Platform (e.g. Udemy, YouTube)"
                value={newCourse.platform}
                onChange={e => setNewCourse({ ...newCourse, platform: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <textarea
              placeholder="Notes..."
              value={newCourse.notes}
              onChange={e => setNewCourse({ ...newCourse, notes: e.target.value })}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading courses...</div>
      ) : (
        <>
          {/* Watching Section */}
          {watching.length > 0 && (
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Play size={12} className="text-indigo-400 fill-indigo-400" />
                Currently Watching ({watching.length})
              </h3>
              <div className="space-y-3">
                {watching.map(course => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    expandedNotes={expandedNotes}
                    setExpandedNotes={setExpandedNotes}
                    editingCourse={editingCourse}
                    editNotes={editNotes}
                    setEditingCourse={setEditingCourse}
                    setEditNotes={setEditNotes}
                    onDelete={deleteCourse}
                    onUpdateProgress={updateProgress}
                    onToggleStatus={toggleStatus}
                    onUpdateNotes={updateNotes}
                    statusBadgeColors={statusBadgeColors}
                    statusIconColors={statusIconColors}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Section */}
          {completed.length > 0 && (
            <section>
              <h3 className="text-xs font-black text-green-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Bookmark size={12} />
                Completed ({completed.length})
              </h3>
              <div className="space-y-3">
                {completed.map(course => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    expandedNotes={expandedNotes}
                    setExpandedNotes={setExpandedNotes}
                    editingCourse={editingCourse}
                    editNotes={editNotes}
                    setEditingCourse={setEditingCourse}
                    setEditNotes={setEditNotes}
                    onDelete={deleteCourse}
                    onUpdateProgress={updateProgress}
                    onToggleStatus={toggleStatus}
                    onUpdateNotes={updateNotes}
                    statusBadgeColors={statusBadgeColors}
                    statusIconColors={statusIconColors}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paused Section */}
          {paused.length > 0 && (
            <section>
              <h3 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ChevronUp size={12} />
                Paused ({paused.length})
              </h3>
              <div className="space-y-3">
                {paused.map(course => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    expandedNotes={expandedNotes}
                    setExpandedNotes={setExpandedNotes}
                    editingCourse={editingCourse}
                    editNotes={editNotes}
                    setEditingCourse={setEditingCourse}
                    setEditNotes={setEditNotes}
                    onDelete={deleteCourse}
                    onUpdateProgress={updateProgress}
                    onToggleStatus={toggleStatus}
                    onUpdateNotes={updateNotes}
                    statusBadgeColors={statusBadgeColors}
                    statusIconColors={statusIconColors}
                  />
                ))}
              </div>
            </section>
          )}

          {courses.length === 0 && (
            <div className="text-center py-16 text-gray-500 border border-dashed border-white/10 rounded-2xl">
              <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No courses yet. Add your first course above.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function CourseCard({
  course,
  expandedNotes,
  setExpandedNotes,
  editingCourse,
  editNotes,
  setEditingCourse,
  setEditNotes,
  onDelete,
  onUpdateProgress,
  onToggleStatus,
  onUpdateNotes,
  statusBadgeColors,
  statusIconColors,
}: {
  course: Course;
  expandedNotes: string | null;
  setExpandedNotes: (id: string | null) => void;
  editingCourse: Course | null;
  editNotes: string;
  setEditingCourse: (course: Course | null) => void;
  setEditNotes: (notes: string) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleStatus: (id: string, status: Course["status"]) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  statusBadgeColors: Record<string, string>;
  statusIconColors: Record<string, string>;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta Row */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadgeColors[course.status]}`}>
              {course.status}
            </span>
            {course.platform && (
              <span className="text-[10px] text-gray-500">{course.platform}</span>
            )}
            {course.url && (
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={10} />
                Open
              </a>
            )}
          </div>

          {/* Title */}
          <h4 className="text-white font-semibold text-sm leading-tight mb-3">{course.title}</h4>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-10 text-right">{course.progress}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={course.progress}
              onChange={e => onUpdateProgress(course._id, parseInt(e.target.value))}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Notes Row */}
          <div className="flex items-center gap-2">
            {course.notes ? (
              <button
                onClick={() => setExpandedNotes(expandedNotes === course._id ? null : course._id)}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                {expandedNotes === course._id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {expandedNotes === course._id ? "Hide Notes" : "Show Notes"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingCourse(course);
                  setEditNotes(course.notes || "");
                }}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
              >
                <Edit2 size={10} />
                Add Notes
              </button>
            )}

            {/* Status Toggle */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => onToggleStatus(course._id, course.status === "watching" ? "paused" : course.status === "paused" ? "completed" : "watching")}
                className="text-[10px] text-gray-500 hover:text-white px-2 py-0.5 rounded transition-colors"
                title="Change status"
              >
                ⟳ Status
              </button>
            </div>
          </div>

          {/* Expanded Notes */}
          {expandedNotes === course._id && course.notes && (
            <p className="mt-3 text-xs text-gray-300 bg-white/5 rounded-lg p-3 border border-white/5 leading-relaxed">
              {course.notes}
            </p>
          )}

          {/* Edit Notes Form */}
          {editingCourse?._id === course._id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about this course..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateNotes(course._id, editNotes)}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-bold transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(course._id)}
          className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}