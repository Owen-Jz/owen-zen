import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Plus, Trash2, Calendar, Layout, AlertCircle, Circle, AlignLeft, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskPriority, SubTask, Board } from "@/types";
import { DatePicker } from "./DatePicker";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface AddTaskModalProps {
    initialTitle?: string;
    boards: Board[];
    defaultBoardId: string | null;
    onClose: () => void;
    onSave: (title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate: string | undefined, boardId: string | null, isMIT: boolean) => void;
}

export const AddTaskModal = ({
    initialTitle = "",
    boards = [],
    defaultBoardId,
    onClose,
    onSave,
}: AddTaskModalProps) => {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [subtasks, setSubtasks] = useState<SubTask[]>([]);
    const [dueDate, setDueDate] = useState<string>("");
    const [newSubtask, setNewSubtask] = useState("");
    const [isMIT, setIsMIT] = useState(false);
    const [boardId, setBoardId] = useState<string | null>(defaultBoardId);

    const addSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtask.trim()) return;
        setSubtasks([...subtasks, { title: newSubtask, completed: false }]);
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

    const handleSave = () => {
        if (!title.trim()) return;
        onSave(title, description, priority, subtasks, dueDate || undefined, boardId, isMIT);
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
                <div className="flex items-start justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex-1 mr-8">
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task Title (Required)"
                            className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none border-none p-0 focus:ring-0"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        />
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
                                className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none border-none p-0 focus:ring-0 min-h-[100px] resize-none leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                            />
                        </div>

                        {/* Subtasks Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                    <CheckCircle2 size={14} /> Subtasks
                                </div>
                                <span className="text-xs text-gray-500 font-mono">
                                    {subtasks.filter(s => s.completed).length}/{subtasks.length} Done
                                </span>
                            </div>

                            <div className="space-y-2 mb-3">
                                {subtasks.map((st, i) => (
                                    <div key={i} className="flex items-center gap-3 group bg-surface hover:bg-surface-hover p-3 rounded-xl border border-border transition-all">
                                        <button
                                            type="button"
                                            onClick={() => toggleSubtask(i)}
                                            className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                                                st.completed ? "bg-primary border-primary text-white" : "border-gray-600 hover:border-primary/50"
                                            )}
                                        >
                                            {st.completed && <Check size={12} />}
                                        </button>
                                        <input
                                            type="text"
                                            value={st.title}
                                            onChange={(e) => {
                                                const updated = [...subtasks];
                                                updated[i].title = e.target.value;
                                                setSubtasks(updated);
                                            }}
                                            className={cn(
                                                "flex-1 bg-transparent outline-none border-none text-sm focus:ring-0 p-0",
                                                st.completed && "text-gray-500 line-through decoration-gray-600"
                                            )}
                                        />
                                        <button type="button" onClick={() => removeSubtask(i)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <Trash2 size={14} />
                                        </button>
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
                                            type="button"
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={cn(
                                                "px-2 py-2 rounded-lg text-xs font-bold border transition-all capitalize flex flex-col items-center gap-1",
                                                priority === p
                                                    ? p === 'high' ? "bg-red-500/20 border-red-500 text-red-500" : p === 'medium' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "bg-blue-500/20 border-blue-500 text-blue-500"
                                                    : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full",
                                                p === 'high' ? "bg-red-500" : p === 'medium' ? "bg-yellow-500" : "bg-blue-500"
                                            )} />
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Board Selector */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Board</label>
                                <div className="relative">
                                    <select
                                        value={boardId || ""}
                                        onChange={(e) => setBoardId(e.target.value || null)}
                                        className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-300 focus:border-primary outline-none transition-colors cursor-pointer hover:bg-black/30"
                                    >
                                        <option value="">All Tasks (No Board)</option>
                                        {boards.map(b => (
                                            <option key={b._id} value={b._id}>{b.title}</option>
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
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!title.trim()}
                        onClick={handleSave}
                        className="disabled:opacity-50 disabled:cursor-not-allowed px-8 py-2.5 rounded-xl bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-sm font-bold flex items-center gap-2"
                    >
                        <Plus size={16} /> Create Task
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
