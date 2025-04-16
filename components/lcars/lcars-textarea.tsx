import { type TextareaHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface LcarsTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const LcarsTextarea = forwardRef<HTMLTextAreaElement, LcarsTextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-lcars-blue">{label}</label>}
        <textarea
          className={cn(
            "w-full px-4 py-2 bg-lcars-black border-2 border-lcars-blue rounded-md",
            "text-lcars-text placeholder:text-lcars-text/50",
            "focus:outline-none focus:ring-2 focus:ring-lcars-orange focus:border-transparent",
            error && "border-lcars-red focus:ring-lcars-red",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-lcars-red mt-1">{error}</p>}
      </div>
    )
  },
)

LcarsTextarea.displayName = "LcarsTextarea"
