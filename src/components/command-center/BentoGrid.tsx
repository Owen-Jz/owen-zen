import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4 p-1",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: string;
}) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-5 flex flex-col justify-between h-full min-h-[180px] relative overflow-hidden",
        "bg-[var(--cc-card)] border-[var(--cc-border)]",
        "cursor-pointer group",
        colSpan
      )}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -12px rgba(212, 168, 83, 0.25)",
        borderColor: "var(--cc-accent)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0%, var(--cc-accent) 0%, transparent 70%)",
          opacity: 0.08,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}