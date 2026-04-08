"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Info, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 'all', isRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <ShieldCheck className="text-green-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'error': return <X className="text-red-500" size={18} />;
      case 'system': return <Zap className="text-primary" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-surface border border-border rounded-lg text-gray-400 hover:text-white transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="region"
            aria-label="Notifications"
            aria-live="polite"
            className="absolute right-0 mt-3 w-80 md:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-hover/50">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300">Intelligence Feed</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm italic">
                  Systems clear. No new signals.
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id}
                    className={clsx(
                      "p-4 border-b border-border last:border-0 transition-colors group relative",
                      !n.isRead ? "bg-primary/5" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={clsx("text-sm font-bold truncate", !n.isRead ? "text-white" : "text-gray-400")}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-gray-600 font-mono mt-2 block uppercase">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={() => markAsRead(n._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/20 rounded text-primary transition-all"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
