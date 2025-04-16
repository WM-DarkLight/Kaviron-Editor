"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Edit, Play, Database, FileJson, Settings, Bug } from "lucide-react"

interface LcarsNavbarProps {
  activeView: "dashboard" | "episode-editor" | "campaign-editor" | "tester" | "settings" | "debug"
  onNavigate: (view: "dashboard" | "episode-editor" | "campaign-editor" | "tester" | "settings" | "debug") => void
  debugMode?: boolean
}

export function LcarsNavbar({ activeView, onNavigate, debugMode = false }: LcarsNavbarProps) {
  return (
    <nav className="w-20 bg-lcars-black flex flex-col items-center py-4 space-y-6">
      <div className="w-16 h-16 rounded-full bg-lcars-orange flex items-center justify-center">
        <span className="text-lcars-black font-bold text-xl">LCARS</span>
      </div>

      <div className="flex flex-col space-y-6 items-center mt-8">
        <NavButton
          icon={<LayoutDashboard size={24} />}
          label="Dashboard"
          isActive={activeView === "dashboard"}
          onClick={() => onNavigate("dashboard")}
          color="lcars-orange"
        />

        <NavButton
          icon={<Edit size={24} />}
          label="Editor"
          isActive={activeView === "episode-editor" || activeView === "campaign-editor"}
          onClick={() => {
            // Navigate to the appropriate editor based on what was last active
            if (activeView === "campaign-editor") {
              onNavigate("campaign-editor")
            } else {
              onNavigate("episode-editor")
            }
          }}
          color="lcars-purple"
        />

        <NavButton
          icon={<Play size={24} />}
          label="Tester"
          isActive={activeView === "tester"}
          onClick={() => onNavigate("tester")}
          color="lcars-blue"
        />

        <NavButton
          icon={<Database size={24} />}
          label="Database"
          isActive={false}
          onClick={() => {}}
          color="lcars-gold"
          disabled
        />

        <NavButton
          icon={<FileJson size={24} />}
          label="JSON"
          isActive={false}
          onClick={() => {}}
          color="lcars-teal"
          disabled
        />

        <NavButton
          icon={<Settings size={24} />}
          label="Settings"
          isActive={activeView === "settings"}
          onClick={() => onNavigate("settings")}
          color="lcars-blue"
        />

        {debugMode && (
          <NavButton
            icon={<Bug size={24} />}
            label="Debug"
            isActive={activeView === "debug"}
            onClick={() => onNavigate("debug")}
            color="lcars-red"
          />
        )}
      </div>
    </nav>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  color: string
  disabled?: boolean
}

function NavButton({ icon, label, isActive, onClick, color, disabled = false }: NavButtonProps) {
  return (
    <button
      className={cn(
        "w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all",
        `bg-${color}`,
        isActive ? "opacity-100" : "opacity-70 hover:opacity-90",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <div className="text-lcars-black">{icon}</div>
      <span className="text-xs mt-1 text-lcars-black font-bold">{label}</span>
    </button>
  )
}
