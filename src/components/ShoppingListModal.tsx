import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, Trash2, ShoppingCart } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface ShoppingItem {
    _id: string;
    title: string;
    completed: boolean;
}

export const ShoppingListModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItemText, setNewItemText] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/shopping");
            const json = await res.json();
            if (json.success) {
                setItems(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        try {
            const tempItem = { _id: crypto.randomUUID(), title: newItemText, completed: false };
            setItems([tempItem, ...items]);
            setNewItemText("");

            const res = await fetch("/api/shopping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: tempItem.title })
            });
            const json = await res.json();
            if (json.success) {
                setItems(prev => prev.map(item => item._id === tempItem._id ? json.data : item));
            } else {
                fetchItems(); // rollback
            }
        } catch (e) {
            console.error(e);
            fetchItems(); // rollback
        }
    };

    const toggleItem = async (id: string, completed: boolean) => {
        setItems(items.map(item => item._id === id ? { ...item, completed: !completed } : item));
        try {
            await fetch(`/api/shopping/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: !completed })
            });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteItem = async (id: string) => {
        setItems(items.filter(item => item._id !== id));
        try {
            await fetch(`/api/shopping/${id}`, {
                method: "DELETE",
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                                <span className="p-2 bg-primary/20 text-primary rounded-xl">
                                    <ShoppingCart size={18} />
                                </span>
                                Shopping List
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                type="button"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto min-h-[300px]">
                            <form onSubmit={addItem} className="relative mb-6">
                                <input
                                    type="text"
                                    autoFocus
                                    value={newItemText}
                                    onChange={e => setNewItemText(e.target.value)}
                                    placeholder="Need to buy..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:border-primary/50 outline-none transition-all placeholder-gray-500 text-gray-200 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!newItemText.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </form>

                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <span className="text-gray-500 text-sm font-medium">Loading list...</span>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center">
                                    <ShoppingCart size={40} className="text-gray-600 mb-4 opacity-50" />
                                    <span className="text-gray-400 text-sm font-medium block">
                                        Your shopping list is empty!
                                    </span>
                                    <span className="text-gray-600 text-xs mt-1 block">
                                        Add items above to start tracking.
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            key={item._id}
                                            className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-hover/30 hover:bg-surface-hover/60 border border-white/5 transition-all gap-3 overflow-hidden relative"
                                        >
                                            <button
                                                onClick={() => toggleItem(item._id, item.completed)}
                                                className={cn(
                                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 z-10",
                                                    item.completed ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(var(--primary),0.3)]" : "border-gray-500 hover:border-primary/80 bg-black/20"
                                                )}
                                            >
                                                {item.completed && <Check size={12} strokeWidth={3} />}
                                            </button>

                                            <span className={cn(
                                                "flex-1 text-sm font-medium transition-all break-words z-10",
                                                item.completed ? "text-gray-500 line-through" : "text-gray-200 group-hover:text-white"
                                            )}>
                                                {item.title}
                                            </span>

                                            <button
                                                onClick={() => deleteItem(item._id)}
                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg z-10"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            {/* Cool strike-through visual effect */}
                                            {item.completed && (
                                                <div className="absolute left-0 right-0 top-0 bottom-0 bg-black/20 pointer-events-none z-0" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
