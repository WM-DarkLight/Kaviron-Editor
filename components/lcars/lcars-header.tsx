"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, Settings, Bug } from "lucide-react"

interface LcarsHeaderProps {
  title: string
  onBackToDashboard: () => void
  onOpenSettings?: () => void
  onOpenDebug?: () => void
  debugMode?: boolean
}

export function LcarsHeader({
  title,
  onBackToDashboard,
  onOpenSettings,
  onOpenDebug,
  debugMode = false,
}: LcarsHeaderProps) {
  return (
    <header className="h-16 bg-lcars-black flex items-center px-4 border-b-4 border-lcars-orange">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBackToDashboard}
        className="mr-4 text-lcars-orange hover:text-lcars-orange hover:bg-lcars-black/20"
      >
        <ChevronLeft size={24} />
        <span className="sr-only">Back to Dashboard</span>
      </Button>

      <div className="flex-1 flex items-center">
        <div className="h-8 w-32 bg-lcars-orange rounded-l-full rounded-r-full mr-4"></div>
        <h1 className="text-lcars-orange text-xl font-bold tracking-wider">{title}</h1>
        <div className="h-8 w-16 bg-lcars-blue rounded-l-full rounded-r-full ml-4"></div>
        <div className="h-8 w-8 bg-lcars-purple rounded-full ml-2"></div>
      </div>

      <div className="flex items-center space-x-2">
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="text-lcars-blue hover:text-lcars-blue hover:bg-lcars-black/20"
            title="Settings"
          >
            <Settings size={20} />
            <span className="sr-only">Settings</span>
          </Button>
        )}

        {debugMode && onOpenDebug && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenDebug}
            className="text-lcars-red hover:text-lcars-red hover:bg-lcars-black/20"
            title="Debug Panel"
          >
            <Bug size={20} />
            <span className="sr-only">Debug Panel</span>
          </Button>
        )}
      </div>
    </header>
  )
}
