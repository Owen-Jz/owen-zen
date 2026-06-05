import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { X, Check, Plus, Trash2, Calendar, Clock, Activity, Layout, AlertCircle, Circle, ArrowRightCircle, CheckCircle2, Pin, AlignLeft, ArrowUpToLine, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { TimeTracker } from "./TimeTracker";
import { TaskImageUploader } from "./TaskImageUploader";
import { Task, TaskPriority, SubTask, TaskStatus } from "@/types";
import { DatePicker } from "./DatePicker";
import { useSoundContext } from "./SoundEffects";
import { cn } from "@/lib/utils";

function AutoResizeTextarea({ value, onChange, className }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    className?: string;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, [value]);
    return (
        <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            rows={1}
            className={className}
        />
    );
}

interface EditTaskModalProps {
    task: Task | null;
    onClose: () => void;
    onSave: (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string, quadrant?: "q1" | "q2" | "q3" | "q4" | null, images?: string[]) => void;
    onStartTimer: (id: string, sessionTitle?: string) => void;
    onStopTimer: (id: string, note?: string) => void;
    onPauseTimer?: (id: string) => void;
    onResumeTimer?: (id: string) => void;
    onDeleteTimeLog: (id: string, logIndex: number) => void;
    onAddManualTimeLog: (id: string, duration: number, note: string) => void;
    onToggleMIT: (id: string, isMIT: boolean) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
    onPromoteSubtask?: (taskId: string, subtaskIndex: number) => void;
}

export const EditTaskModal = ({
    task,
    onClose,
    onSave,
    onStartTimer,
    onStopTimer,
    onPauseTimer,
    onResumeTimer,
    onDeleteTimeLog,
    onAddManualTimeLog,
    onToggleMIT,
    onArchive,
    onDelete,
    onPromoteSubtask
}: EditTaskModalProps) => {
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
    const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks || []);
    const [dueDate, setDueDate] = useState<string>(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    const [newSubtask, setNewSubtask] = useState("");
    const [isMIT, setIsMIT] = useState(task?.isMIT || false);
    const [category, setCategory] = useState(task?.category || "Other");
    const [quadrant, setQuadrant] = useState<"q1" | "q2" | "q3" | "q4" | null>(task?.quadrant ?? null);
    const [images, setImages] = useState<string[]>(task?.images || []);
    const [decomposingSubtasks, setDecomposingSubtasks] = useState<SubTask[] | null>(null);

    const decomposeMutation = useMutation({
        mutationFn: async (description: string) => {
            const res = await fetch("/api/tasks/decompose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);
            return json.data.subtasks as SubTask[];
        },
        onSuccess: (subtasks) => {
            setDecomposingSubtasks(subtasks);
        },
        onError: (error: any) => {
            alert(error.message);
        },
    });

    const { playSound } = useSoundContext();

    const handleAcceptDecomposed = () => {
        if (decomposingSubtasks) {
            setSubtasks([...subtasks, ...decomposingSubtasks.filter(st => st.title.trim())]);
        }
        setDecomposingSubtasks(null);
    };

    const handleCancelDecomposed = () => {
        setDecomposingSubtasks(null);
    };

    useEffect(() => {
        playSound('TASK_MODAL_OPENED');
    }, [playSound]);

    // Play close sound on unmount (when task becomes null and modal exits)
    useEffect(() => {
        return () => {
            playSound('TASK_MODAL_CLOSED');
        };
    }, [playSound]);

    if (!task) return null;

    const addSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtask.trim()) return;
        setSubtasks([...subtasks, { title: newSubtask, completed: false, description: "" }]);
        setNewSubtask("");
    };

    const toggleSubtask = (index: number) => {
        const updated = [...subtasks];
        updated[index].completed = !updated[index].completed;
        setSubtasks(updated);
    };

    const removeSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const moveSubtaskUp = (index: number) => {
        if (index === 0) return;
        const updated = [...subtasks];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        setSubtasks(updated);
    };

    const moveSubtaskDown = (index: number) => {
        if (index === subtasks.length - 1) return;
        const updated = [...subtasks];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        setSubtasks(updated);
    };

    const handleSave = () => {
        onSave(task._id, title, description, priority, subtasks, dueDate || undefined, category, quadrant, images);
        // Also save MIT status if changed
        if (isMIT !== task.isMIT) {
            onToggleMIT(task._id, isMIT);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-4xl bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
                    <div className="flex-1 mr-8">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task Title"
                            className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none border-none p-0 focus:ring-0 focus:placeholder-gray-600 transition-colors"
                        />
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            {task.status && (
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full uppercase font-bold tracking-wider text-[10px]",
                                    task.status === "completed" ? "bg-green-500/20 text-green-500" :
                                        task.status === "in-progress" ? "bg-blue-500/20 text-blue-500" :
                                            task.status === "pinned" ? "bg-purple-500/20 text-purple-500" :
                                                "bg-gray-500/20 text-gray-400"
                                )}>
                                    {task.status.replace("-", " ")}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - 2 Columns */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content (Left) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Description Section */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 transition-colors hover:bg-black/30 group">
                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-400 uppercase tracking-wider group-focus-within:text-primary transition-colors">
                                <AlignLeft size={14} /> Description
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add more details to this task..."
                                className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none border-none p-0 focus:ring-0 min-h-[300px] resize-none leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                            />
                        </div>

                        {/* Images Section */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <TaskImageUploader
                                images={images}
                                onAdd={(url) => setImages((prev) => [...prev, url])}
                                onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                            />
                        </div>

                        {/* Time Tracking Section */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                <Clock size={14} /> Time Tracking
                            </div>
                            <TimeTracker
                                taskId={task._id}
                                activeTimer={task.activeTimer}
                                totalTimeSpent={task.totalTimeSpent || 0}
                                timeLogs={task.timeLogs}
                                onStart={(sessionTitle) => onStartTimer(task._id, sessionTitle)}
                                onStop={(note) => onStopTimer(task._id, note)}
                                onPause={() => onPauseTimer && onPauseTimer(task._id)}
                                onResume={() => onResumeTimer && onResumeTimer(task._id)}
                                onDeleteLog={(logIndex) => onDeleteTimeLog(task._id, logIndex)}
                                onAddManualLog={(duration, note) => onAddManualTimeLog(task._id, duration, note)}
                            />
                        </div>

                        {/* Subtasks Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    <CheckCircle2 size={14} /> Subtasks
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 font-mono">
                                        {subtasks.filter(s => s.completed).length}/{subtasks.length} Done
                                    </span>
                                    <button
                                        onClick={() => decomposeMutation.mutate(description)}
                                        disabled={description.trim().split(/\s+/).length < 3 || decomposeMutation.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30 hover:border-primary/50"
                                        title="Auto-decompose description into subtasks"
                                    >
                                        {decomposeMutation.isPending ? (
                                            <Sparkles size={14} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={14} />
                                        )}
                                        Auto-Decompose
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-3">
                                {subtasks.map((st, i) => (
                                    <div key={i} className="flex flex-col gap-2 group bg-surface hover:bg-surface-hover p-3 rounded-xl border border-border transition-all">
    <div className="flex items-center gap-3">
        <button
            onClick={() => toggleSubtask(i)}
            className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                st.completed ? "bg-primary border-primary text-white" : "border-gray-600 hover:border-primary/50"
            )}
        >
            {st.completed && <Check size={12} />}
        </button>
        <AutoResizeTextarea
            value={st.title}
            onChange={(e) => {
                const updated = [...subtasks];
                updated[i].title = e.target.value;
                setSubtasks(updated);
            }}
            className={cn(
                "flex-1 bg-transparent outline-none border-none text-sm focus:ring-0 p-0 resize-none overflow-hidden min-w-0 break-words leading-snug",
                st.completed && "text-gray-500 line-through decoration-gray-600"
            )}
        />
        {onPromoteSubtask && (
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onPromoteSubtask(task._id, i);
                    setSubtasks(subtasks.filter((_, idx) => idx !== i));
                }}
                className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Promote to main task"
            >
                <ArrowUpToLine size={14} />
            </button>
        )}
        <button
            onClick={() => moveSubtaskUp(i)}
            className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Move up"
            disabled={i === 0}
        >
            <ArrowUp size={14} />
        </button>
        <button
            onClick={() => moveSubtaskDown(i)}
            className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Move down"
            disabled={i === subtasks.length - 1}
        >
            <ArrowDown size={14} />
        </button>
        <button onClick={() => removeSubtask(i)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
            <Trash2 size={14} />
        </button>
    </div>
    {/* Description input — visible by default */}
    <div className="ml-7">
        <input
            type="text"
            value={st.description || ""}
            onChange={(e) => {
                const updated = [...subtasks];
                updated[i].description = e.target.value;
                setSubtasks(updated);
            }}
            placeholder="Description (optional)"
            className="w-full bg-transparent/50 outline-none border-none text-xs text-gray-400 placeholder-gray-600 focus:ring-0 p-0 leading-relaxed"
        />
    </div>
</div>
                                ))}
                            </div>

                            <form onSubmit={addSubtask} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        placeholder="Add a new subtask..."
                                        className="w-full bg-surface-hover/50 border border-transparent rounded-xl pl-9 pr-3 py-3 text-sm focus:border-primary/50 focus:bg-surface-hover outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newSubtask.trim()}
                                    className="px-4 bg-surface hover:bg-white/10 rounded-xl border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                                >
                                    Add
                                </button>
                            </form>
                        </div>

                    </div>

                    {/* Sidebar (Right) */}
                    <div className="space-y-6">

                        {/* Properties Panel */}
                        <div className="space-y-6 bg-surface/30 p-5 rounded-xl border border-white/5">

                            {/* Due Date */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Due Date</label>
                                <div className="relative">
                                    <DatePicker value={dueDate} onChange={setDueDate} />
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Priority</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['high', 'medium', 'low'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={cn(
                                                "px-2 py-3 rounded-lg text-xs font-bold border transition-all capitalize flex flex-col items-center gap-2 relative overflow-hidden",
                                                priority === p
                                                    ? p === 'high' ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : p === 'medium' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "bg-blue-500/20 border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                                    : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            {priority === p && (
                                                <motion.div
                                                    layoutId="priority-glow"
                                                    className={cn("absolute inset-0 opacity-20",
                                                        p === 'high' ? "bg-red-500" : p === 'medium' ? "bg-yellow-500" : "bg-blue-500"
                                                    )}
                                                />
                                            )}
                                            <div className={cn("w-2.5 h-2.5 rounded-full relative z-10",
                                                p === 'high' ? "bg-red-500" : p === 'medium' ? "bg-yellow-500" : "bg-blue-500"
                                            )} />
                                            <span className="relative z-10">{p}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Selector */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Category</label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:border-primary outline-none transition-colors cursor-pointer hover:bg-black/30"
                                    >
                                        {['Work', 'Personal', 'Health', 'Finance', 'Other'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <Layout size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* MIT Toggle */}
                            <div>
                                <label className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-3 rounded-xl cursor-pointer hover:bg-primary/20 transition-colors group">
                                    <input
                                        type="checkbox"
                                        checked={isMIT}
                                        onChange={(e) => setIsMIT(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-500 text-primary focus:ring-primary accent-primary"
                                    />
                                    <div>
                                        <span className="block font-bold text-sm text-primary-light group-hover:text-primary transition-colors">Daily MIT</span>
                                        <span className="text-[10px] text-gray-400 leading-tight">Most Important Task</span>
                                    </div>
                                    <AlertCircle size={16} className={cn("ml-auto transition-colors", isMIT ? "text-primary" : "text-gray-600")} />
                                </label>
                            </div>

                            {/* Quadrant Selector */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Eisenhower Quadrant</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        { id: "q1", label: "Do First", color: "red" },
                                        { id: "q2", label: "Schedule", color: "blue" },
                                        { id: "q3", label: "Delegate", color: "yellow" },
                                        { id: "q4", label: "Eliminate", color: "gray" },
                                    ] as const).map((q) => (
                                        <button
                                            type="button"
                                            key={q.id}
                                            onClick={() => setQuadrant(quadrant === q.id ? null : q.id)}
                                            className={cn(
                                                "px-2 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1",
                                                quadrant === q.id
                                                    ? q.color === 'red' ? "bg-red-500/20 border-red-500 text-red-500" :
                                                      q.color === 'blue' ? "bg-blue-500/20 border-blue-500 text-blue-500" :
                                                      q.color === 'yellow' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" :
                                                      "bg-gray-500/20 border-gray-500 text-gray-400"
                                                    : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full",
                                                q.color === 'red' ? "bg-red-500" : q.color === 'blue' ? "bg-blue-500" : q.color === 'yellow' ? "bg-yellow-500" : "bg-gray-500"
                                            )} />
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={() => onArchive(task._id)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-yellow-500 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20 transition-all text-sm font-medium"
                            >
                                <Pin size={16} /> Archive Task
                            </button>
                            <button
                                onClick={() => onDelete(task._id)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-sm font-medium"
                            >
                                <Trash2 size={16} /> Delete Task
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 rounded-xl bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-sm font-bold flex items-center gap-2"
                    >
                        <Check size={16} /> Save Changes
                    </button>
                </div>

            </motion.div>

            {/* Auto-Decompose Preview Modal */}
            <AnimatePresence>
                {decomposingSubtasks && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={handleCancelDecomposed}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative w-full max-w-md bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                                <div className="flex items-center gap-2 text-base font-bold text-white">
                                    <Sparkles size={18} className="text-primary" />
                                    Auto-Decompose — Review Steps
                                </div>
                                <button
                                    onClick={handleCancelDecomposed}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 max-h-[60vh] overflow-y-auto">
                                <p className="text-xs text-gray-400 mb-4">Edit the suggested subtasks before accepting. You can modify or remove any step.</p>
                                <div className="space-y-2">
                                    {decomposingSubtasks.map((st, i) => (
                                        <div key={i} className="flex items-center gap-2 group bg-surface hover:bg-surface-hover p-3 rounded-xl border border-border transition-all">
                                            <div className="w-5 h-5 rounded-md border border-gray-600 flex items-center justify-center shrink-0">
                                                <Circle size={12} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                value={st.title}
                                                onChange={(e) => {
                                                    const updated = [...decomposingSubtasks];
                                                    updated[i].title = e.target.value;
                                                    setDecomposingSubtasks(updated);
                                                }}
                                                className="flex-1 bg-transparent outline-none border-none text-sm text-gray-200 focus:ring-0 p-0"
                                            />
                                            <button
                                                onClick={() => {
                                                    setDecomposingSubtasks(decomposingSubtasks.filter((_, idx) => idx !== i));
                                                }}
                                                className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                                <button
                                    onClick={handleCancelDecomposed}
                                    className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAcceptDecomposed}
                                    className="px-6 py-2.5 rounded-xl bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-sm font-bold flex items-center gap-2"
                                >
                                    <Check size={16} /> Accept All
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
