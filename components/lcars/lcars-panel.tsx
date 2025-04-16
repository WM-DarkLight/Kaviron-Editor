import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface LcarsPanelProps {
  children: ReactNode
  className?: string
  title?: string
  color?: "orange" | "blue" | "purple" | "gold" | "teal"
}

export function LcarsPanel({ children, className, title, color = "orange" }: LcarsPanelProps) {
  const colorClasses = {
    orange: "border-lcars-orange",
    blue: "border-lcars-blue",
    purple: "border-lcars-purple",
    gold: "border-lcars-gold",
    teal: "border-lcars-teal",
  }

  const headerColorClasses = {
    orange: "bg-lcars-orange text-lcars-black",
    blue: "bg-lcars-blue text-lcars-black",
    purple: "bg-lcars-purple text-lcars-black",
    gold: "bg-lcars-gold text-lcars-black",
    teal: "bg-lcars-teal text-lcars-black",
  }

  return (
    <div className={cn("rounded-lg border-2 overflow-hidden", colorClasses[color], className)}>
      {title && <div className={cn("px-4 py-2 font-bold", headerColorClasses[color])}>{title}</div>}
      <div className="p-4 bg-lcars-black/80">{children}</div>
    </div>
  )
}
