import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
        secondary: "bg-[var(--color-secondary)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-secondary-hover)]",
        ghost: "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]",
        destructive: "bg-[var(--color-error-muted)] text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error)] hover:text-white",
        link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
        outline: "border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)]",
      },
      size: {
        sm: "h-8 gap-1.5 px-2.5 text-[0.8rem]",
        md: "h-10 gap-1.5 px-4",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
