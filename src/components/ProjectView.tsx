import { useState, useEffect } from "react";
import { Project, ProjectDeliverable, ProjectLink } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, ExternalLink, Filter, CheckCircle2, Circle, Clock, Target, CalendarDays, MoreVertical, LayoutTemplate, X, Check } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export const ProjectView = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

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
                                    ? "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                    : "bg-surface border border-border text-gray-400 hover:text-white"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all font-bold"
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
                <div className="text-center py-20 bg-surface/50 border border-dashed border-white/10 rounded-3xl flex flex-col items-center max-w-2xl mx-auto">
                    <LayoutTemplate size={48} className="text-gray-600 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-6 max-w-sm">Capture all your major initiatives and track their progress from start to finish.</p>
                    <button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
                    >
                        <Plus size={18} /> Create your first Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                                onDelete={deleteProject}
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
                                setProjects(projects.map(p => p._id === newProject._id ? newProject : p));
                            } else {
                                setProjects([newProject, ...projects]);
                            }
                            setIsModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ProjectCard = ({ project, onEdit, onDelete }: { project: Project, onEdit: (p: Project) => void, onDelete: (id: string) => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-all group flex flex-col"
        >
            <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-100 group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
                    <div className="flex gap-2 mt-2">
                        <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                            project.category === "design" ? "border-pink-500/30 text-pink-400 bg-pink-500/10" :
                                project.category === "development" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                    project.category === "business" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                                        "border-purple-500/30 text-purple-400 bg-purple-500/10" // personal
                        )}>
                            {project.category}
                        </span>
                        <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                            project.status === "completed" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                                project.status === "active" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                                    project.status === "paused" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
                                        "border-gray-500/30 text-gray-400 bg-gray-500/10" // planning
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
                            project.progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
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
                    {project.links?.length > 0 && (
                        <span className="flex items-center gap-1.5 text-gray-400">
                            <ExternalLink size={12} /> {project.links.length}
                        </span>
                    )}
                </div>

                {(project.dueDate || project.startDate) && (
                    <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} />
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) :
                            project.startDate ? `Started ${new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                    </span>
                )}
            </div>
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
    const [newDeliverable, setNewDeliverable] = useState("");
    const [newLinkTitle, setNewLinkTitle] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-calculate progress based on deliverables if progress hasn't been manually set and there are deliverables
    useEffect(() => {
        if (deliverables.length > 0) {
            const completed = deliverables.filter(d => d.completed).length;
            const newProgress = Math.round((completed / deliverables.length) * 100);
            setProgress(newProgress);
        }
    }, [deliverables]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);

        const payload = {
            title, description, category, status, priority, progress, startDate, dueDate, deliverables, links
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
        setDeliverables([...deliverables, { title: newDeliverable, completed: false }]);
        setNewDeliverable("");
    };

    const addLink = () => {
        if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
        setLinks([...links, { title: newLinkTitle, url: newLinkUrl }]);
        setNewLinkTitle("");
        setNewLinkUrl("");
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
                className="relative w-full max-w-4xl bg-surface border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden"
            >
                {/* Left Side: Form */}
                <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto border-r border-white/5 flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold">{project ? "Edit Project" : "New Project"}</h2>
                        <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-white"><X size={20} /></button>
                    </div>

                    <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Project Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white placeholder-gray-600"
                                placeholder="Next Gen Platform Rewrite"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-24 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white placeholder-gray-600 resize-none"
                                placeholder="High-level overview of the goals..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value as any)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white appearance-none"
                                >
                                    <option value="development">Development</option>
                                    <option value="design">Design</option>
                                    <option value="business">Business</option>
                                    <option value="personal">Personal</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Status</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value as any)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white appearance-none"
                                >
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
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
                                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Overall Progress ({progress}%)</label>
                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={progress}
                                    onChange={e => setProgress(Number(e.target.value))}
                                    className="w-full mt-3 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white appearance-none custom-date-input"
                                />
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
                </div>

                {/* Right Side: Extras (Deliverables & Links) */}
                <div className="w-full md:w-1/2 bg-black/20 p-6 md:p-8 overflow-y-auto flex flex-col">
                    <button onClick={onClose} className="hidden md:block absolute top-6 right-6 p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"><X size={20} /></button>

                    <div className="mb-8 mt-8 md:mt-0">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Key Deliverables
                        </h4>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newDeliverable}
                                onChange={e => setNewDeliverable(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
                                placeholder="e.g. Design System Phase 1"
                                className="flex-1 bg-surface border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={addDeliverable}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {deliverables.length === 0 && <p className="text-xs text-gray-600">No deliverables added yet.</p>}
                            {deliverables.map((d, i) => (
                                <div key={i} className="flex items-center gap-3 bg-surface/50 p-2.5 rounded-lg border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newD = [...deliverables];
                                            newD[i].completed = !newD[i].completed;
                                            setDeliverables(newD);
                                        }}
                                        className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                            d.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500"
                                        )}
                                    >
                                        {d.completed && <Check size={12} strokeWidth={3} />}
                                    </button>
                                    <span className={cn("text-sm flex-1", d.completed && "text-gray-500 line-through")}>{d.title}</span>
                                    <button
                                        type="button"
                                        onClick={() => setDeliverables(deliverables.filter((_, idx) => idx !== i))}
                                        className="text-gray-500 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <ExternalLink size={16} className="text-blue-500" /> Important Links
                        </h4>

                        <div className="flex flex-col gap-2 mb-4 p-3 bg-surface/30 rounded-xl border border-white/5">
                            <input
                                type="text"
                                value={newLinkTitle}
                                onChange={e => setNewLinkTitle(e.target.value)}
                                placeholder="Label (e.g. Figma Design)"
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-all text-sm"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={newLinkUrl}
                                    onChange={e => setNewLinkUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                    placeholder="https://..."
                                    className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-all text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addLink}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {links.length === 0 && <p className="text-xs text-gray-600">No links added yet.</p>}
                            {links.map((link, i) => (
                                <div key={i} className="flex items-center gap-3 bg-surface/50 p-2.5 rounded-lg border border-white/5">
                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        <span className="text-sm font-medium truncate text-gray-200">{link.title}</span>
                                        <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{link.url}</a>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                                        className="text-gray-500 hover:text-red-500 p-2"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="project-form"
                            disabled={isSubmitting}
                            className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(var(--primary),0.5)] font-bold transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Project"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
