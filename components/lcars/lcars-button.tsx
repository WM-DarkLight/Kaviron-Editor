import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface LcarsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger"
  size?: "sm" | "md" | "lg"
  leftCap?: boolean
  rightCap?: boolean
}

export const LcarsButton = forwardRef<HTMLButtonElement, LcarsButtonProps>(
  ({ className, variant = "primary", size = "md", leftCap = true, rightCap = true, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative font-bold text-lcars-black border-0 transition-all",
          leftCap && "rounded-l-full",
          rightCap && "rounded-r-full",
          size === "sm" && "h-8 px-4 text-xs",
          size === "md" && "h-10 px-6 text-sm",
          size === "lg" && "h-12 px-8 text-base",
          variant === "primary" && "bg-lcars-orange hover:bg-lcars-orange/90",
          variant === "secondary" && "bg-lcars-blue hover:bg-lcars-blue/90",
          variant === "tertiary" && "bg-lcars-purple hover:bg-lcars-purple/90",
          variant === "danger" && "bg-lcars-red hover:bg-lcars-red/90",
          props.disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  },
)

LcarsButton.displayName = "LcarsButton"
