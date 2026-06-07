import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, error, id, ...props }, ref) => {
    // useId must be called unconditionally (rules of hooks); fall back to it only if no id/name.
    const generatedId = React.useId()
    const inputId = id || props.name || generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground transition-colors",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-input/50",
            error && "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {(helperText || error) && (
          <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }