"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { MetadataEditor } from "./metadata-editor"
import { SceneBuilder } from "./scene-builder"
import { JsonViewer } from "./json-viewer"
import { FlowChart } from "./flow-chart"
import { getEpisode, saveEpisode, createManualSnapshot, exportEpisodeToJSON } from "@/lib/db"
import { createNewEpisodeTemplate, debounce } from "@/lib/utils"
import type { Episode } from "@/types/schema"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Play, History, Check, Download } from "lucide-react"
import { RecoveryPanel } from "./recovery-panel"

interface EpisodeEditorProps {
  episodeId: string | null
  onSave: () => void
  onTest: (episodeId: string) => void
  debugMode?: boolean
}

export function EpisodeEditor({ episodeId, onSave, onTest, debugMode = false }: EpisodeEditorProps) {
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [activeTab, setActiveTab] = useState("metadata")
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { toast } = useToast()

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const loadEpisode = async () => {
      try {
        if (episodeId) {
          const loadedEpisode = await getEpisode(episodeId)
          if (loadedEpisode) {
            if (isMounted.current) {
              setEpisode(loadedEpisode)
              validateEpisode(loadedEpisode)
            }
          } else {
            // Episode not found, create a new one
            const newEpisode = createNewEpisodeTemplate()
            if (isMounted.current) {
              setEpisode(newEpisode)
              validateEpisode(newEpisode)
            }
          }
        } else {
          // Create a new episode
          const newEpisode = createNewEpisodeTemplate()
          if (isMounted.current) {
            setEpisode(newEpisode)
            validateEpisode(newEpisode)
          }
        }
      } catch (error) {
        console.error("Failed to load episode:", error)
        if (isMounted.current) {
          toast({
            title: "Error",
            description: "Failed to load episode. Please try again.",
            variant: "destructive",
          })
        }
      }
    }

    loadEpisode()
  }, [episodeId, toast])

  const validateEpisode = (ep: Episode) => {
    const errors: string[] = []

    // Basic validation
    if (!ep.title || ep.title.trim() === "") {
      errors.push("Episode title is required")
    }

    if (!ep.author || ep.author.trim() === "") {
      errors.push("Author name is required")
    }

    if (!ep.description || ep.description.trim() === "") {
      errors.push("Episode description is required")
    }

    // Scene validation
    if (!ep.scenes || Object.keys(ep.scenes).length === 0) {
      errors.push("Episode must have at least one scene")
    } else {
      if (!ep.scenes.start) {
        errors.push("Episode must have a 'start' scene")
      }

      // Check for broken links
      const sceneIds = new Set(Object.keys(ep.scenes))
      let brokenLinks = false

      Object.entries(ep.scenes).forEach(([sceneId, scene]) => {
        scene.choices.forEach((choice) => {
          if (!sceneIds.has(choice.nextScene)) {
            brokenLinks = true
          }
        })
      })

      if (brokenLinks) {
        errors.push("Episode contains broken scene links")
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!episode) return

    // Validate episode before saving
    if (!validateEpisode(episode)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await saveEpisode(episode)

      // Create a manual snapshot
      await createManualSnapshot(episode.id)

      toast({
        title: "Episode saved",
        description: "Your episode has been saved successfully.",
      })
      onSave()
    } catch (error) {
      console.error("Failed to save episode:", error)
      toast({
        title: "Error",
        description: `Failed to save episode: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      if (isMounted.current) {
        setIsSaving(false)
      }
    }
  }

  const handleExport = async () => {
    if (!episode) return

    // Validate episode before exporting
    if (!validateEpisode(episode)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before exporting.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const jsonData = await exportEpisodeToJSON(episode.id)

      // Create a download link
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `episode-${episode.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Episode exported",
        description: "Your episode has been successfully exported as JSON.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: `Failed to export episode: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      if (isMounted.current) {
        setIsExporting(false)
      }
    }
  }

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce(async (episodeToSave: Episode) => {
      if (!isMounted.current) return

      try {
        setIsAutoSaving(true)
        await saveEpisode(episodeToSave)
        console.log("Auto-saved episode")

        // Show auto-save indicator briefly
        setTimeout(() => {
          if (isMounted.current) {
            setIsAutoSaving(false)
          }
        }, 1500)
      } catch (error) {
        console.error("Auto-save failed:", error)
        if (isMounted.current) {
          setIsAutoSaving(false)
        }
      }
    }, 10000),
    [],
  )

  // Trigger auto-save when episode changes
  useEffect(() => {
    if (episode) {
      debouncedSave(episode)
    }
  }, [episode, debouncedSave])

  const handleMetadataChange = (updatedMetadata: Partial<Episode>) => {
    if (!episode) return
    const updatedEpisode = { ...episode, ...updatedMetadata }
    setEpisode(updatedEpisode)
    validateEpisode(updatedEpisode)
  }

  const handleScenesChange = (updatedScenes: Record<string, any>) => {
    if (!episode) return
    const updatedEpisode = { ...episode, scenes: updatedScenes }
    setEpisode(updatedEpisode)
    validateEpisode(updatedEpisode)
  }

  const handleTestClick = () => {
    if (!episode) return

    // Validate episode before testing
    if (!validateEpisode(episode)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before testing.",
        variant: "destructive",
      })
      return
    }

    onTest(episode.id)
  }

  const handleRecoveryComplete = (recoveredEpisode: Episode) => {
    setEpisode(recoveredEpisode)
    validateEpisode(recoveredEpisode)
    setShowRecovery(false)

    toast({
      title: "Recovery Complete",
      description: "Episode has been restored from snapshot.",
    })
  }

  if (!episode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lcars-orange text-xl">Loading episode editor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showRecovery ? (
        <RecoveryPanel
          episodeId={episode.id}
          onRestore={handleRecoveryComplete}
          onCancel={() => setShowRecovery(false)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lcars-orange text-2xl font-bold">
                {episodeId ? "Edit Episode" : "Create New Episode"}
              </h2>
              {validationErrors.length > 0 && (
                <div className="text-lcars-red text-sm mt-1">
                  {validationErrors.length} validation {validationErrors.length === 1 ? "error" : "errors"} found
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isAutoSaving && (
                <div className="flex items-center text-lcars-blue text-sm">
                  <Check size={16} className="mr-1" />
                  Auto-saving...
                </div>
              )}
              <LcarsButton onClick={() => setShowRecovery(true)} variant="tertiary" className="flex items-center gap-2">
                <History size={16} />
                RECOVERY
              </LcarsButton>
              <LcarsButton
                onClick={handleExport}
                variant="secondary"
                disabled={isExporting || validationErrors.length > 0}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                {isExporting ? "EXPORTING..." : "EXPORT JSON"}
              </LcarsButton>
              <LcarsButton onClick={handleTestClick} variant="secondary" className="flex items-center gap-2">
                <Play size={16} />
                TEST EPISODE
              </LcarsButton>
              <LcarsButton
                onClick={handleSave}
                disabled={isSaving || validationErrors.length > 0}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                {isSaving ? "SAVING..." : "SAVE EPISODE"}
              </LcarsButton>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-lcars-red/20 border-2 border-lcars-red rounded-lg p-4 mb-4">
              <h3 className="text-lcars-red font-bold mb-2">Validation Errors</h3>
              <ul className="list-disc pl-5 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-lcars-text">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-lcars-black border-2 border-lcars-orange rounded-full mb-4">
              <TabsTrigger
                value="metadata"
                className="data-[state=active]:bg-lcars-orange data-[state=active]:text-lcars-black rounded-full px-6"
              >
                Metadata
              </TabsTrigger>
              <TabsTrigger
                value="scenes"
                className="data-[state=active]:bg-lcars-purple data-[state=active]:text-lcars-black rounded-full px-6"
              >
                Scenes
              </TabsTrigger>
              <TabsTrigger
                value="flowchart"
                className="data-[state=active]:bg-lcars-gold data-[state=active]:text-lcars-black rounded-full px-6"
              >
                Flow Chart
              </TabsTrigger>
              <TabsTrigger
                value="json"
                className="data-[state=active]:bg-lcars-blue data-[state=active]:text-lcars-black rounded-full px-6"
              >
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metadata">
              <LcarsPanel title="EPISODE METADATA" color="orange">
                <MetadataEditor episode={episode} onChange={handleMetadataChange} />
              </LcarsPanel>
            </TabsContent>

            <TabsContent value="scenes">
              <LcarsPanel title="SCENE BUILDER" color="purple">
                <SceneBuilder scenes={episode.scenes} onChange={handleScenesChange} />
              </LcarsPanel>
            </TabsContent>

            <TabsContent value="flowchart">
              <LcarsPanel title="FLOW CHART" color="gold">
                <FlowChart scenes={episode.scenes} />
              </LcarsPanel>
            </TabsContent>

            <TabsContent value="json">
              <LcarsPanel title="JSON VIEWER" color="blue">
                <JsonViewer episode={episode} onExport={handleExport} isExporting={isExporting} />
              </LcarsPanel>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
