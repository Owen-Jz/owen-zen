import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4 w-full",
        className
      )}
    >
      {children}
    </div>
  );
}

// Span helpers
export function span(cols: number) {
  return `col-span-2 md:col-span-${Math.min(cols, 6)} lg:col-span-${Math.min(cols, 12)}`;
}
