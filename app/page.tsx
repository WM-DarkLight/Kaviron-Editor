"use client"

import { useEffect, useState } from "react"
import { LcarsLayout } from "@/components/lcars/lcars-layout"
import { ProjectDashboard } from "@/components/dashboard/project-dashboard"
import { EpisodeEditor } from "@/components/editor/episode-editor"
import { CampaignEditor } from "@/components/editor/campaign-editor"
import { StoryTester } from "@/components/tester/story-tester"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { initializeDatabase, checkDatabaseConnection, isIndexedDBSupported } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { LcarsLoadingScreen } from "@/components/lcars/lcars-loading-screen"
import { ErrorBoundary } from "@/components/error-boundary"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { AlertCircle, Database } from "lucide-react"
import { DebugPanel } from "@/components/debug/debug-panel"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<
    "dashboard" | "episode-editor" | "campaign-editor" | "tester" | "settings" | "debug"
  >("dashboard")
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const { toast } = useToast()

  // Initialize database and check connection
  useEffect(() => {
    const setupDb = async () => {
      try {
        // First check if IndexedDB is supported
        if (!isIndexedDBSupported()) {
          throw new Error("IndexedDB is not supported in this browser")
        }

        await initializeDatabase()

        // Verify database connection
        const isConnected = await checkDatabaseConnection()
        if (!isConnected) {
          throw new Error("Database connection test failed")
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Database initialization error:", error)
        setDbError((error as Error).message || "Failed to initialize the database")
        setIsLoading(false)

        toast({
          title: "Database Error",
          description: "Failed to initialize the database. Please check browser storage permissions.",
          variant: "destructive",
        })
      }
    }

    setupDb()
  }, [toast])

  const handleOpenEpisode = (episodeId: string) => {
    setActiveEpisodeId(episodeId)
    setActiveCampaignId(null)
    setActiveView("episode-editor")
  }

  const handleCreateNewEpisode = () => {
    setActiveEpisodeId(null)
    setActiveCampaignId(null)
    setActiveView("episode-editor")
  }

  const handleOpenCampaign = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setActiveEpisodeId(null)
    setActiveView("campaign-editor")
  }

  const handleCreateNewCampaign = () => {
    setActiveCampaignId(null)
    setActiveEpisodeId(null)
    setActiveView("campaign-editor")
  }

  const handleTestEpisode = (episodeId: string) => {
    if (!episodeId) {
      toast({
        title: "Error",
        description: "No episode selected for testing",
        variant: "destructive",
      })
      return
    }

    setActiveEpisodeId(episodeId)
    setActiveCampaignId(null)
    setActiveView("tester")
  }

  const handleBackToDashboard = () => {
    setActiveView("dashboard")
    setActiveEpisodeId(null)
    setActiveCampaignId(null)
  }

  const handleOpenSettings = () => {
    setActiveView("settings")
  }

  const handleOpenDebug = () => {
    setActiveView("debug")
  }

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
    toast({
      title: debugMode ? "Debug Mode Disabled" : "Debug Mode Enabled",
      description: debugMode ? "Debug features have been turned off" : "Debug features are now available",
    })
  }

  // Handle database error state
  if (dbError) {
    return (
      <div className="min-h-screen bg-lcars-black flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-lcars-red flex items-center justify-center mb-6">
          <AlertCircle size={32} className="text-lcars-black" />
        </div>
        <h1 className="text-lcars-red text-2xl font-bold mb-4">Database Error</h1>
        <p className="text-lcars-text text-center mb-6 max-w-md">
          The application couldn't access the browser's storage. This may be due to:
        </p>
        <ul className="text-lcars-text mb-8 space-y-2 max-w-md">
          <li>• Private browsing mode</li>
          <li>• Storage permissions blocked</li>
          <li>• Browser storage is full</li>
          <li>• Browser doesn't support IndexedDB</li>
        </ul>
        <div className="space-y-4">
          <LcarsButton onClick={() => window.location.reload()} variant="primary" size="lg">
            RETRY
          </LcarsButton>

          <div className="flex justify-center">
            <LcarsButton onClick={handleOpenDebug} variant="secondary" className="flex items-center gap-2">
              <Database size={16} />
              OPEN DEBUG PANEL
            </LcarsButton>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LcarsLoadingScreen />
  }

  return (
    <ErrorBoundary>
      <LcarsLayout
        activeView={activeView}
        onNavigate={setActiveView}
        onBackToDashboard={handleBackToDashboard}
        onOpenSettings={handleOpenSettings}
        onOpenDebug={handleOpenDebug}
        debugMode={debugMode}
      >
        {activeView === "dashboard" && (
          <ProjectDashboard
            onOpenEpisode={handleOpenEpisode}
            onCreateNewEpisode={handleCreateNewEpisode}
            onOpenCampaign={handleOpenCampaign}
            onCreateNewCampaign={handleCreateNewCampaign}
            onTestEpisode={handleTestEpisode}
            debugMode={debugMode}
          />
        )}
        {activeView === "episode-editor" && (
          <EpisodeEditor
            episodeId={activeEpisodeId}
            onSave={() => setActiveView("dashboard")}
            onTest={(id) => handleTestEpisode(id)}
            debugMode={debugMode}
          />
        )}
        {activeView === "campaign-editor" && (
          <CampaignEditor
            campaignId={activeCampaignId}
            onSave={() => setActiveView("dashboard")}
            debugMode={debugMode}
          />
        )}
        {activeView === "tester" && activeEpisodeId ? (
          <StoryTester episodeId={activeEpisodeId} onExit={handleBackToDashboard} />
        ) : activeView === "tester" ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="text-lcars-red text-xl">No episode selected for testing</div>
            <LcarsButton onClick={handleBackToDashboard} variant="tertiary">
              BACK TO DASHBOARD
            </LcarsButton>
          </div>
        ) : null}
        {activeView === "settings" && (
          <SettingsPanel onBack={handleBackToDashboard} debugMode={debugMode} onToggleDebugMode={toggleDebugMode} />
        )}
        {activeView === "debug" && <DebugPanel onBack={handleBackToDashboard} />}
      </LcarsLayout>
    </ErrorBoundary>
  )
}
