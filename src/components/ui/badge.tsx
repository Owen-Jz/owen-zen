import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary-muted)] text-[var(--color-primary)] border-[var(--color-primary)]/20",
        success: "bg-[var(--color-success-muted)] text-[var(--color-success)] border-[var(--color-success)]/20",
        warning: "bg-[var(--color-warning-muted)] text-[var(--color-warning)] border-[var(--color-warning)]/20",
        error: "bg-[var(--color-error-muted)] text-[var(--color-error)] border-[var(--color-error)]/20",
        accent: "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]/20",
        muted: "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-transparent",
        outline: "border-[var(--color-border)] text-[var(--color-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }