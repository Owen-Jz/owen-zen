import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Plus, Trash2, Calendar, Layout, AlertCircle, Circle, AlignLeft, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskPriority, SubTask, Board } from "@/types";
import { DatePicker } from "./DatePicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface AddTaskModalProps {
    initialTitle?: string;
    boards: Board[];
    defaultBoardId: string | null;
    onClose: () => void;
    onSave: (title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate: string | undefined, boardId: string | null, isMIT: boolean, category: string) => void;
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
    const [category, setCategory] = useState("Other");

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
        onSave(title, description, priority, subtasks, dueDate || undefined, boardId, isMIT, category);
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
                        <Input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task Title (Required)"
                            className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 border-none shadow-none p-0 focus:ring-0 h-auto"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </Button>
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
                                    <Input
                                        type="text"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        placeholder="Add a new subtask..."
                                        className="pl-9"
                                    />
                                    <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                                <Button type="submit" variant="outline" disabled={!newSubtask.trim()}>
                                    Add
                                </Button>
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

                            {/* Category Selector */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Category</label>
                                <Select value={category} onValueChange={(v) => setCategory(v || "Other")}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Work', 'Personal', 'Health', 'Finance', 'Other'].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Board Selector */}
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Board</label>
                                <Select value={boardId || ""} onValueChange={(v) => setBoardId(v || null)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="No Board" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Tasks (No Board)</SelectItem>
                                        {boards.map(b => (
                                            <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* MIT Toggle */}
                            <div>
                                <label className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 p-3 rounded-xl cursor-pointer hover:bg-primary/20 transition-colors group">
                                    <Switch
                                        checked={isMIT}
                                        onCheckedChange={setIsMIT}
                                        className="data-[state=checked]:bg-primary"
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
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button disabled={!title.trim()} onClick={handleSave}>
                        <Plus size={16} className="mr-2" /> Create Task
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
