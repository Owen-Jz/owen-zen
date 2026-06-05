import { useState, useEffect } from "react";
import { Project, ProjectDeliverable, ProjectLink, ProjectTag, Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, ExternalLink, Filter, CheckCircle2, Circle, Clock, Target, CalendarDays, MoreVertical, LayoutTemplate, X, Check, ChevronDown, ChevronUp, ListTodo, FileText, Copy, Link2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { EditTaskModal } from "./EditTaskModal";
import { TaskPriority, SubTask } from "@/types";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";

export const ProjectView = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/projects");
            const json = await res.json();
            if (json.success) {
                setProjects(json.data);
            }
        } catch (e) {
            console.error("Failed to fetch projects", e);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteProject = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            setProjects(projects.filter((p) => p._id !== id));
            await fetch(`/api/projects/${id}`, { method: "DELETE" });
        } catch (e) {
            console.error("Failed to delete project", e);
        }
    };

    const handleEditTaskSave = async (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string, quadrant?: "q1" | "q2" | "q3" | "q4" | null, images?: string[]) => {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, priority, subtasks, dueDate, category, quadrant, images })
            });
            setEditingTask(null);
            fetchProjects();
        } catch (e) {
            console.error("Failed to save task", e);
        }
    };

    const handleEditTaskToggleMIT = async (id: string, isMIT: boolean) => {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isMIT })
            });
            fetchProjects();
        } catch (e) {
            console.error("Failed to toggle MIT", e);
        }
    };

    const handleEditTaskArchive = async (id: string) => {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isArchived: true })
            });
            setEditingTask(null);
            fetchProjects();
        } catch (e) {
            console.error("Failed to archive task", e);
        }
    };

    const handleEditTaskDelete = async (id: string) => {
        if (!confirm("Delete this task?")) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: "DELETE" });
            setEditingTask(null);
            fetchProjects();
        } catch (e) {
            console.error("Failed to delete task", e);
        }
    };

    const filteredProjects = activeCategory === "all"
        ? projects
        : projects.filter(p => p.category === activeCategory);

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header & Categories */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex flex-wrap gap-2">
                    {["all", "design", "development", "business", "personal"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                                activeCategory === cat
                                    ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                                    : "bg-surface border border-border text-gray-400 hover:text-white"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:bg-primary/90 transition-all font-bold"
                >
                    <Plus size={18} className="stroke-[3px]" /> New Project
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Loading projects...
                </div>
            ) : filteredProjects.length === 0 ? (
                <EmptyState
                    icon={LayoutTemplate}
                    title="No projects found"
                    description="Capture all your major initiatives and track their progress from start to finish."
                    actionLabel="Create your first Project"
                    onAction={() => { setEditingProject(null); setIsModalOpen(true); }}
                  />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                isExpanded={expandedProjectId === project._id}
                                onToggleExpand={() => setExpandedProjectId(expandedProjectId === project._id ? null : project._id)}
                                onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                                onDelete={deleteProject}
                                onAddTask={() => { setTaskProjectId(project._id); setIsTaskModalOpen(true); }}
                                onRefreshProjects={fetchProjects}
                                editingTask={editingTask}
                                onEditTask={(task) => setEditingTask(task)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Project Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <ProjectModal
                        project={editingProject}
                        onClose={() => setIsModalOpen(false)}
                        onSave={(newProject) => {
                            if (editingProject) {
                                setProjects(prev => prev.map(p => p._id === newProject._id ? newProject : p));
                            } else {
                                setProjects(prev => [newProject, ...prev]);
                            }
                            setIsModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Add Task Modal */}
            <AnimatePresence>
                {isTaskModalOpen && (
                    <AddTaskToProjectModal
                        projectId={taskProjectId}
                        onClose={() => { setIsTaskModalOpen(false); setTaskProjectId(null); }}
                        onSave={() => { setIsTaskModalOpen(false); setTaskProjectId(null); fetchProjects(); }}
                    />
                )}
            </AnimatePresence>

            {/* Edit Task Modal */}
            <AnimatePresence>
                {editingTask && (
                    <EditTaskModal
                        task={editingTask}
                        onClose={() => setEditingTask(null)}
                        onSave={handleEditTaskSave}
                        onStartTimer={() => {}}
                        onStopTimer={() => {}}
                        onPauseTimer={() => {}}
                        onResumeTimer={() => {}}
                        onDeleteTimeLog={() => {}}
                        onAddManualTimeLog={() => {}}
                        onToggleMIT={handleEditTaskToggleMIT}
                        onArchive={handleEditTaskArchive}
                        onDelete={handleEditTaskDelete}
                        onPromoteSubtask={() => {}}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ProjectCard = ({ project, isExpanded, onToggleExpand, onEdit, onDelete, onAddTask, onRefreshProjects, editingTask, onEditTask }: {
    project: Project, isExpanded: boolean, onToggleExpand: () => void, onEdit: (p: Project) => void, onDelete: (id: string) => void, onAddTask: () => void, onRefreshProjects: () => void, editingTask: Task | null, onEditTask: (task: Task) => void
}) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    useEffect(() => {
        if (isExpanded) {
            fetchTasks();
        }
    }, [isExpanded, project._id]);

    const fetchTasks = async () => {
        setIsLoadingTasks(true);
        try {
            const res = await fetch(`/api/projects/${project._id}/tasks`);
            const json = await res.json();
            if (json.success) {
                setTasks(json.data);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, projectId: project._id })
            });
            // Refresh tasks and update project progress
            await fetchTasks();
            onRefreshProjects();
        } catch (e) {
            console.error("Failed to toggle task", e);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm("Delete this task?")) return;
        try {
            await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
            await fetchTasks();
            onRefreshProjects();
        } catch (e) {
            console.error("Failed to delete task", e);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface/60 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-primary/30 transition-all group flex flex-col"
        >
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-100 group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
                        <div className="flex gap-2 mt-2">
                            <span className={cn(
                                "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                                project.category === "design" ? "border-pink-500/30 text-pink-400 bg-pink-500/10" :
                                    project.category === "development" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                        project.category === "business" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                                            "border-purple-500/30 text-purple-400 bg-purple-500/10"
                            )}>
                                {project.category}
                            </span>
                            <span className={cn(
                                "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                                project.status === "completed" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                                    project.status === "active" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                        project.status === "paused" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
                                            "border-gray-500/30 text-gray-400 bg-gray-500/10"
                            )}>
                                {project.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(project)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete(project._id)} className="p-2 bg-red-500/5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {project.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-6 flex-1">
                        {project.description}
                    </p>
                )}

                {/* Progress */}
                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                        <span className="flex items-center gap-1.5"><Target size={12} className="text-primary" /> Progress</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full transition-colors duration-500",
                                project.progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                            )}
                        />
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-5 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                    <div className="flex items-center gap-4">
                        {project.deliverables?.length > 0 && (
                            <span className="flex items-center gap-1.5 text-gray-400">
                                <CheckCircle2 size={12} className={project.deliverables.every(d => d.completed) ? "text-emerald-500" : ""} />
                                {project.deliverables.filter(d => d.completed).length} / {project.deliverables.length}
                            </span>
                        )}
                        {(project.taskCount !== undefined && project.taskCount > 0) && (
                            <span className="flex items-center gap-1.5 text-gray-400">
                                <ListTodo size={12} className={project.completedTaskCount === project.taskCount ? "text-emerald-500" : ""} />
                                {project.completedTaskCount || 0} / {project.taskCount}
                            </span>
                        )}
                        {project.links?.length > 0 && (
                            <span className="flex items-center gap-1.5 text-gray-400">
                                <ExternalLink size={12} /> {project.links.length}
                            </span>
                        )}
                        {project.notes && project.notes.length > 0 && (
                            <span className="flex items-center gap-1.5 text-gray-400">
                                <FileText size={12} /> {project.notes.length}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {(project.dueDate || project.startDate) && (
                            <span className="flex items-center gap-1.5">
                                <CalendarDays size={12} />
                                {project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) :
                                    project.startDate ? `Started ${new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                            </span>
                        )}
                        <button
                            onClick={onToggleExpand}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Task List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 overflow-hidden"
                    >
                        <div className="p-4 bg-black/20 space-y-2 max-h-[300px] overflow-y-auto">
                            {/* Add Task Button */}
                            <button
                                onClick={onAddTask}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all border border-dashed border-white/10 hover:border-white/20"
                            >
                                <Plus size={14} /> Add Task
                            </button>

                            {isLoadingTasks ? (
                                <div className="text-center py-6 text-gray-500 text-sm">Loading tasks...</div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-6 text-gray-600 text-sm">No tasks yet. Add one above.</div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task._id} className="flex items-center gap-3 bg-surface/50 p-3 rounded-xl border border-white/5 group/task cursor-pointer hover:bg-surface/70 transition-colors" onClick={() => onEditTask(task)}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task._id, task.status); }}
                                            className={cn(
                                                "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                task.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500 hover:border-primary"
                                            )}
                                        >
                                            {task.status === 'completed' && <Check size={12} strokeWidth={3} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <span className={cn("text-sm block truncate", task.status === 'completed' && "line-through text-gray-500")}>{task.title}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-bold",
                                                    task.priority === 'high' ? "border-red-500/30 text-red-400 bg-red-500/10" :
                                                        task.priority === 'medium' ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                                                            "border-gray-500/30 text-gray-400 bg-gray-500/10"
                                                )}>
                                                    {task.priority}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTask(task._id); }}
                                            className="p-1.5 text-gray-500 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Modal for Create/Edit Project
const ProjectModal = ({ project, onClose, onSave }: { project: Project | null, onClose: () => void, onSave: (p: Project) => void }) => {
    const [title, setTitle] = useState(project?.title || "");
    const [description, setDescription] = useState(project?.description || "");
    const [category, setCategory] = useState<Project["category"]>(project?.category || "development");
    const [status, setStatus] = useState<Project["status"]>(project?.status || "planning");
    const [priority, setPriority] = useState<Project["priority"]>(project?.priority || "medium");
    const [progress, setProgress] = useState(project?.progress || 0);
    const [startDate, setStartDate] = useState(project?.startDate || "");
    const [dueDate, setDueDate] = useState(project?.dueDate || "");
    const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>(project?.deliverables || []);
    const [links, setLinks] = useState<ProjectLink[]>(project?.links || []);
    const [notes, setNotes] = useState<string[]>(project?.notes || []);
    const [newDeliverable, setNewDeliverable] = useState("");
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tags, setTags] = useState<ProjectTag[]>(project?.tags || []);
    const [estimatedHours, setEstimatedHours] = useState(project?.estimatedHours || 0);
    const [teamMembers, setTeamMembers] = useState(project?.teamMembers?.join(", ") || "");
    const [quadrant, setQuadrant] = useState<"q1" | "q2" | "q3" | "q4" | null>(project?.quadrant || null);
    const [selectedTagColor, setSelectedTagColor] = useState("#ef4444");
    const [newTagName, setNewTagName] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

    const handleCopyLink = async (url: string, index: number) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLinkIndex(index);
            setTimeout(() => setCopiedLinkIndex(null), 1500);
        } catch {
            /* clipboard unavailable — no-op */
        }
    };

    // Auto-calculate progress based on deliverables
    useEffect(() => {
        if (deliverables.length > 0) {
            const completed = deliverables.filter(d => d.completed).length;
            const newProgress = Math.round((completed / deliverables.length) * 100);
            setProgress(newProgress);
        }
    }, [deliverables]);

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: "Goals, context, decisions, learnings..." }),
        ],
        content: project?.notesRichText || "",
        onUpdate: () => {
            setIsDirty(true);
        },
    });

    // Auto-save effect (visual indicator only - actual save on form submit)
    useEffect(() => {
        if (!isDirty) return;
        const timer = setTimeout(() => {
            setAutoSaveStatus("saving");
            setTimeout(() => setAutoSaveStatus("saved"), 600);
        }, 1500);
        return () => clearTimeout(timer);
    }, [isDirty]);

    // Cmd+Enter to submit
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                const form = document.getElementById("project-form") as HTMLFormElement;
                form?.requestSubmit();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);

        const payload = {
            title, description, category, status, priority, progress, startDate, dueDate,
            deliverables, links, notes, tags, estimatedHours,
            teamMembers: teamMembers.split(",").map(s => s.trim()).filter(Boolean),
            quadrant, notesRichText: editor?.getHTML() || ""
        };

        try {
            const url = project ? `/api/projects/${project._id}` : "/api/projects";
            const method = project ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                onSave(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addDeliverable = () => {
        if (!newDeliverable.trim()) return;
        setDeliverables(prev => [...prev, { title: newDeliverable, completed: false }]);
        setNewDeliverable("");
        setIsDirty(true);
    };

    const addLink = () => {
        if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
        setLinks(prev => [...prev, { title: newLinkTitle, url: newLinkUrl }]);
        setNewLinkTitle("");
        setNewLinkUrl("");
        setIsDirty(true);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[1320px] bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: "90vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold">{project ? "Edit Project" : "New Project"}</h2>
                        {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes" />}
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors">
                            Cancel
                        </button>
                        <button type="submit" form="project-form" disabled={isSubmitting}
                            className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                            {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {isSubmitting ? "Saving..." : "Save Project"}
                        </button>
                    </div>
                </div>

                {/* Body: 3-column grid (Details · Notes · Deliverables & Links) */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Col 1: Details (core settings + metadata) */}
                    <div className="w-[32%] border-r border-white/5 p-6 overflow-y-auto">
                        <div className="flex flex-col gap-5">
                            {/* Title */}
                            <input
                                type="text"
                                value={title}
                                onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
                                autoFocus
                                className="w-full text-xl font-bold bg-transparent border-b border-white/10 focus:border-primary pb-2 focus:outline-none transition-all text-white placeholder-gray-600"
                                placeholder="Next Gen Platform Rewrite"
                                required
                            />

                            {/* Category */}
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Category</label>
                                <div className="flex gap-2 flex-wrap">
                                    {(["development","design","business","personal"] as const).map(cat => (
                                        <button key={cat} type="button" onClick={() => { setCategory(cat); setIsDirty(true); }}
                                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                                                category === cat ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Status</label>
                                <div className="flex gap-2 flex-wrap">
                                    {(["planning","active","paused","completed"] as const).map(s => (
                                        <button key={s} type="button" onClick={() => { setStatus(s); setIsDirty(true); }}
                                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                                                status === s ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Priority</label>
                                <div className="flex gap-2">
                                    {(["high","medium","low"] as const).map(p => (
                                        <button key={p} type="button" onClick={() => { setPriority(p); setIsDirty(true); }}
                                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize",
                                                priority === p ? p === "high" ? "bg-red-500/20 border-red-500 text-red-400" :
                                                    p === "medium" ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" :
                                                        "bg-gray-500/20 border-gray-500 text-gray-400"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            )}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Start</label>
                                    <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setIsDirty(true); }}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary transition-all text-white text-sm appearance-none custom-date-input" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Due</label>
                                    <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setIsDirty(true); }}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary transition-all text-white text-sm appearance-none custom-date-input" />
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Progress</label>
                                    <span className="text-xs font-bold text-primary">{progress}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={progress} onChange={e => { setProgress(Number(e.target.value)); setIsDirty(true); }}
                                    className="w-full cursor-pointer accent-primary" />
                                {deliverables.length > 0 && (
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        {deliverables.filter(d => d.completed).length} of {deliverables.length} deliverables
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/5 my-1" />

                            {/* Tags */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tags</h4>

                                {/* Color swatches */}
                                <div className="flex gap-1.5 mb-3 flex-wrap">
                                    {[
                                        { color: "#ef4444", label: "Red" },
                                        { color: "#f97316", label: "Orange" },
                                        { color: "#eab308", label: "Yellow" },
                                        { color: "#22c55e", label: "Green" },
                                        { color: "#14b8a6", label: "Teal" },
                                        { color: "#3b82f6", label: "Blue" },
                                        { color: "#a855f7", label: "Purple" },
                                        { color: "#ec4899", label: "Pink" },
                                    ].map(c => (
                                        <button key={c.color} type="button"
                                            onClick={() => { setSelectedTagColor(c.color); setIsDirty(true); }}
                                            title={c.label}
                                            className={cn("w-5 h-5 rounded-full border-2 transition-all",
                                                selectedTagColor === c.color ? "border-white scale-125" : "border-transparent opacity-60 hover:opacity-100"
                                            )}
                                            style={{ backgroundColor: c.color }} />
                                    ))}
                                </div>

                                {/* New tag input */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newTagName}
                                        onChange={e => setNewTagName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                if (!newTagName.trim()) return;
                                                setTags(prev => [...prev, { name: newTagName.trim(), color: selectedTagColor }]);
                                                setNewTagName("");
                                                setIsDirty(true);
                                            }
                                        }}
                                        placeholder="Tag name... press Enter"
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-600"
                                    />
                                    <button type="button" onClick={() => {
                                        if (!newTagName.trim()) return;
                                        setTags(prev => [...prev, { name: newTagName.trim(), color: selectedTagColor }]);
                                        setNewTagName("");
                                        setIsDirty(true);
                                    }}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors">
                                        Add
                                    </button>
                                </div>

                                {/* Tag chips */}
                                <div className="flex gap-2 flex-wrap">
                                    {tags.map((tag, i) => (
                                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-white/10 bg-black/20 group/tag">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                            <span className="text-gray-200">{tag.name}</span>
                                            <button type="button" onClick={() => { setTags(prev => prev.filter((_, idx) => idx !== i)); setIsDirty(true); }}
                                                className="text-gray-500 hover:text-red-400 ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Estimated hours */}
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Estimated Hours</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={estimatedHours}
                                            onChange={e => { setEstimatedHours(Number(e.target.value)); setIsDirty(true); }}
                                            placeholder="0"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-primary transition-all text-white text-sm placeholder-gray-600"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">h</span>
                                    </div>
                                </div>

                                {/* Team members */}
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 block tracking-wider">Team Members</label>
                                    <input
                                        type="text"
                                        value={teamMembers}
                                        onChange={e => { setTeamMembers(e.target.value); setIsDirty(true); }}
                                        placeholder="Sarah, Mike..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-all text-white text-sm placeholder-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Quadrant */}
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold mb-2 block tracking-wider">Quadrant</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { q: "q1", label: "Q1", sub: "Urgent + Important", color: "#ef4444" },
                                        { q: "q2", label: "Q2", sub: "Not Urgent + Important", color: "#3b82f6" },
                                        { q: "q3", label: "Q3", sub: "Urgent + Not Important", color: "#f97316" },
                                        { q: "q4", label: "Q4", sub: "Not Urgent + Not Important", color: "#6b7280" },
                                    ].map(item => (
                                        <button key={item.q} type="button"
                                            onClick={() => { setQuadrant(quadrant === item.q ? null : item.q as any); setIsDirty(true); }}
                                            className={cn(
                                                "p-2 rounded-lg border text-left transition-all",
                                                quadrant === item.q
                                                    ? "border-current text-white"
                                                    : "border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
                                            )}
                                            style={{ borderColor: quadrant === item.q ? item.color : undefined }}>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                                                <span className="text-xs font-bold">{item.label}</span>
                                            </div>
                                            <p className="text-[9px] mt-0.5 opacity-70">{item.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Rich Notes */}
                    <div className="w-[36%] border-r border-white/5 p-6 overflow-y-auto flex flex-col">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Notes</h4>
                                <span className={cn(
                                    "text-[10px] font-medium transition-all",
                                    autoSaveStatus === "saving" ? "text-yellow-500" :
                                        autoSaveStatus === "saved" ? "text-emerald-500" : "text-gray-600"
                                )}>
                                    {autoSaveStatus === "saving" ? "Saving..." : autoSaveStatus === "saved" ? "Saved" : ""}
                                </span>
                            </div>

                            {/* Toolbar */}
                            <div className="flex gap-1 mb-2 flex-wrap shrink-0">
                                {[
                                    { label: "B", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold"), title: "Bold" },
                                    { label: "I", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic"), title: "Italic" },
                                    { label: "U", action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline"), title: "Underline" },
                                    { label: "S", action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive("strike"), title: "Strikethrough" },
                                    { label: "H1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }), title: "Heading 1" },
                                    { label: "H2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }), title: "Heading 2" },
                                    { label: "H3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }), title: "Heading 3" },
                                    { label: "•", action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList"), title: "Bullet List" },
                                    { label: "1.", action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList"), title: "Ordered List" },
                                    { label: "<>", action: () => editor?.chain().focus().toggleCode().run(), active: editor?.isActive("code"), title: "Inline Code" },
                                    { label: "❝", action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote"), title: "Blockquote" },
                                    { label: "🔗", action: () => {
                                        const url = window.prompt("URL:");
                                        if (url) editor?.chain().focus().setLink({ href: url }).run();
                                    }, active: editor?.isActive("link"), title: "Link" },
                                ].map((btn, i) => (
                                    <button key={i} type="button" onClick={btn.action} title={btn.title}
                                        className={cn("w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all",
                                            btn.active ? "bg-primary/30 text-primary" : "text-gray-500 hover:bg-white/10 hover:text-white"
                                        )}>
                                        {btn.label}
                                    </button>
                                ))}
                            </div>

                            {/* Editor */}
                            <div className="flex-1 overflow-y-auto">
                                <style jsx global>{`
                                    .tiptap-editor .ProseMirror {
                                        min-height: 300px;
                                        padding: 12px;
                                        outline: none;
                                        color: #e5e7eb;
                                        font-size: 14px;
                                        line-height: 1.7;
                                    }
                                    .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
                                        content: attr(data-placeholder);
                                        color: #4b5563;
                                        pointer-events: none;
                                        float: left;
                                        height: 0;
                                    }
                                    .tiptap-editor .ProseMirror h1 { font-size: 1.4em; font-weight: bold; color: #f3f4f6; margin: 1em 0 0.5em; }
                                    .tiptap-editor .ProseMirror h2 { font-size: 1.2em; font-weight: bold; color: #f3f4f6; margin: 0.8em 0 0.4em; }
                                    .tiptap-editor .ProseMirror h3 { font-size: 1.05em; font-weight: bold; color: #f3f4f6; margin: 0.6em 0 0.3em; }
                                    .tiptap-editor .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
                                    .tiptap-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
                                    .tiptap-editor .ProseMirror code { background: rgba(255,255,255,0.1); padding: 0.1em 0.3em; border-radius: 3px; font-family: monospace; }
                                    .tiptap-editor .ProseMirror blockquote { border-left: 3px solid rgba(var(--primary-rgb), 0.5); padding-left: 1em; color: #9ca3af; margin: 0.5em 0; }
                                    .tiptap-editor .ProseMirror a { color: #60a5fa; text-decoration: underline; }
                                    .tiptap-editor .ProseMirror p { margin: 0.4em 0; }
                                `}</style>
                                <div className="tiptap-editor bg-black/20 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-all">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Deliverables & Links */}
                    <div className="w-[32%] p-6 overflow-y-auto">
                        <div className="flex flex-col gap-6">
                            {/* Deliverables */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Deliverables
                                    {deliverables.length > 0 && (
                                        <span className="ml-auto text-[10px] font-bold text-gray-500 normal-case tracking-normal">
                                            {deliverables.filter(d => d.completed).length}/{deliverables.length}
                                        </span>
                                    )}
                                </h4>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newDeliverable}
                                        onChange={e => setNewDeliverable(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDeliverable(); }}}
                                        placeholder="e.g. Phase 1 MVP"
                                        className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-all"
                                    />
                                    <button type="button" onClick={addDeliverable}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">Add</button>
                                </div>
                                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                    {deliverables.length === 0 && <p className="text-xs text-gray-600">No deliverables yet.</p>}
                                    {deliverables.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-surface/50 p-2 rounded-lg border border-white/5 group">
                                            <button type="button" onClick={() => {
                                                const updated = [...deliverables];
                                                updated[i].completed = !updated[i].completed;
                                                setDeliverables(updated);
                                                setIsDirty(true);
                                            }}
                                                className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                    d.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500")}>
                                                {d.completed && <Check size={10} strokeWidth={3} />}
                                            </button>
                                            <span className={cn("text-xs flex-1", d.completed && "line-through text-gray-500")}>{d.title}</span>
                                            <button type="button" onClick={() => { setDeliverables(prev => prev.filter((_, idx) => idx !== i)); setIsDirty(true); }}
                                                className="text-gray-600 hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Links */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                    <Link2 size={14} className="text-blue-500" /> Links
                                    {links.length > 0 && (
                                        <span className="ml-auto text-[10px] font-bold text-gray-500 normal-case tracking-normal">{links.length}</span>
                                    )}
                                </h4>
                                <div className="space-y-2 mb-3">
                                    <input type="text" value={newLinkTitle}
                                        onChange={e => setNewLinkTitle(e.target.value)}
                                        placeholder="Label (e.g. Figma)"
                                        className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-all" />
                                    <div className="flex gap-2">
                                        <input type="url" value={newLinkUrl}
                                            onChange={e => setNewLinkUrl(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); }}}
                                            placeholder="https://..."
                                            className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-all" />
                                        <button type="button" onClick={addLink}
                                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">Add</button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                                    {links.length === 0 && <p className="text-xs text-gray-600">No links yet.</p>}
                                    {links.map((link, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-surface/50 hover:bg-surface p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <Link2 size={13} className="text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-100 truncate flex-1" title={link.title}>{link.title}</span>
                                                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                        <a href={link.url} target="_blank" rel="noreferrer" title="Open link"
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-white/10 transition-colors">
                                                            <ExternalLink size={13} />
                                                        </a>
                                                        <button type="button" onClick={() => handleCopyLink(link.url, i)} title="Copy URL"
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-400 hover:bg-white/10 transition-colors">
                                                            {copiedLinkIndex === i ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                                        </button>
                                                        <button type="button" onClick={() => { setLinks(prev => prev.filter((_, idx) => idx !== i)); setIsDirty(true); }} title="Remove link"
                                                            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <a href={link.url} target="_blank" rel="noreferrer"
                                                    className="text-xs text-primary/80 hover:text-primary hover:underline break-all block mt-0.5 leading-snug">
                                                    {link.url}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-2 border-t border-white/5 text-[10px] text-gray-600 text-right shrink-0">
                    Esc to close · Cmd+Enter to save
                </div>

                {/* Hidden form for submit */}
                <form id="project-form" onSubmit={handleSubmit} />
            </motion.div>
        </div>
    );
};

// Modal for adding a task to a project
const AddTaskToProjectModal = ({ projectId, onClose, onSave }: { projectId: string | null, onClose: () => void, onSave: () => void }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
    const [dueDate, setDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !projectId) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    dueDate: dueDate || undefined,
                    projectId,
                    status: "pending"
                })
            });
            const json = await res.json();
            if (json.success) {
                onSave();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Add Task to Project</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white placeholder-gray-600"
                            placeholder="What needs to be done?"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full h-20 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white placeholder-gray-600 resize-none"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as any)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white appearance-none"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white appearance-none custom-date-input"
                            />
                        </div>
                    </div>
                </form>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="task-form"
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] font-bold transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
