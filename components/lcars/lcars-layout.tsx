"use client"

import type { ReactNode } from "react"
import { LcarsNavbar } from "./lcars-navbar"
import { LcarsHeader } from "./lcars-header"
import { cn } from "@/lib/utils"

interface LcarsLayoutProps {
  children: ReactNode
  activeView: "dashboard" | "episode-editor" | "campaign-editor" | "tester" | "settings" | "debug"
  onNavigate: (view: "dashboard" | "episode-editor" | "campaign-editor" | "tester" | "settings" | "debug") => void
  onBackToDashboard: () => void
  onOpenSettings?: () => void
  onOpenDebug?: () => void
  debugMode?: boolean
}

export function LcarsLayout({
  children,
  activeView,
  onNavigate,
  onBackToDashboard,
  onOpenSettings,
  onOpenDebug,
  debugMode = false,
}: LcarsLayoutProps) {
  return (
    <div className="min-h-screen bg-lcars-black text-lcars-text flex">
      <LcarsNavbar activeView={activeView} onNavigate={onNavigate} debugMode={debugMode} />
      <div className="flex-1 flex flex-col">
        <LcarsHeader
          title={getTitle(activeView)}
          onBackToDashboard={onBackToDashboard}
          onOpenSettings={onOpenSettings}
          onOpenDebug={onOpenDebug}
          debugMode={debugMode}
        />
        <main
          className={cn(
            "flex-1 p-4 overflow-auto",
            "bg-lcars-black rounded-tl-3xl border-l-4 border-t-4 border-lcars-orange",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

function getTitle(view: "dashboard" | "episode-editor" | "campaign-editor" | "tester" | "settings" | "debug"): string {
  switch (view) {
    case "dashboard":
      return "LCARS FICTION EDITOR - PROJECT DASHBOARD"
    case "episode-editor":
      return "LCARS FICTION EDITOR - EPISODE EDITOR"
    case "campaign-editor":
      return "LCARS FICTION EDITOR - CAMPAIGN EDITOR"
    case "tester":
      return "LCARS FICTION EDITOR - STORY TESTER"
    case "settings":
      return "LCARS FICTION EDITOR - SETTINGS"
    case "debug":
      return "LCARS FICTION EDITOR - DEBUG PANEL"
    default:
      return "LCARS FICTION EDITOR"
  }
}
