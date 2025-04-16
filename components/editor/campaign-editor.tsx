"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { CampaignMetadataEditor } from "./campaign-metadata-editor"
import { CampaignEpisodeManager } from "./campaign-episode-manager"
import { CampaignFlowViewer } from "./campaign-flow-viewer"
import { JsonViewer } from "./json-viewer"
import { getCampaign, saveCampaign, getAllEpisodes, exportCampaignToJSON } from "@/lib/db"
import { createNewCampaignTemplate, debounce } from "@/lib/utils"
import type { Campaign, Episode } from "@/types/schema"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Download, Check } from "lucide-react"

interface CampaignEditorProps {
  campaignId: string | null
  onSave: () => void
  debugMode?: boolean
}

export function CampaignEditor({ campaignId, onSave, debugMode = false }: CampaignEditorProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [availableEpisodes, setAvailableEpisodes] = useState<Episode[]>([])
  const [activeTab, setActiveTab] = useState("metadata")
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { toast } = useToast()

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load campaign and available episodes
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all episodes first
        const episodes = await getAllEpisodes()
        if (isMounted.current) {
          setAvailableEpisodes(episodes)
        }

        // Then load or create campaign
        if (campaignId) {
          const loadedCampaign = await getCampaign(campaignId)
          if (loadedCampaign && isMounted.current) {
            setCampaign(loadedCampaign)
            validateCampaign(loadedCampaign, episodes)
          } else if (isMounted.current) {
            // Campaign not found, create a new one
            const newCampaign = createNewCampaignTemplate()
            setCampaign(newCampaign)
            validateCampaign(newCampaign, episodes)
          }
        } else if (isMounted.current) {
          // Create a new campaign
          const newCampaign = createNewCampaignTemplate()
          setCampaign(newCampaign)
          validateCampaign(newCampaign, episodes)
        }
      } catch (error) {
        console.error("Failed to load campaign data:", error)
        if (isMounted.current) {
          toast({
            title: "Error",
            description: "Failed to load campaign data. Please try again.",
            variant: "destructive",
          })
        }
      }
    }

    loadData()
  }, [campaignId, toast])

  const validateCampaign = (camp: Campaign, episodes: Episode[]) => {
    const errors: string[] = []

    // Basic validation
    if (!camp.title || camp.title.trim() === "") {
      errors.push("Campaign title is required")
    }

    if (!camp.author || camp.author.trim() === "") {
      errors.push("Author name is required")
    }

    if (!camp.description || camp.description.trim() === "") {
      errors.push("Campaign description is required")
    }

    // Episode validation
    if (!camp.episodes || camp.episodes.length === 0) {
      errors.push("Campaign must have at least one episode")
    } else {
      // Check if referenced episodes exist
      const episodeIds = new Set(episodes.map((ep) => ep.id))

      camp.episodes.forEach((episode, index) => {
        if (episode.episodeId && !episodeIds.has(episode.episodeId)) {
          errors.push(`Episode at position ${index + 1} references a non-existent episode`)
        }

        // Check if previous episode references exist
        if (
          episode.condition?.previousEpisodeId &&
          !camp.episodes.some((ep) => ep.episodeId === episode.condition?.previousEpisodeId)
        ) {
          errors.push(`Episode at position ${index + 1} references a non-existent previous episode`)
        }
      })
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!campaign) return

    // Validate campaign before saving
    if (!validateCampaign(campaign, availableEpisodes)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await saveCampaign(campaign)

      toast({
        title: "Campaign saved",
        description: "Your campaign has been saved successfully.",
      })
      onSave()
    } catch (error) {
      console.error("Failed to save campaign:", error)
      toast({
        title: "Error",
        description: `Failed to save campaign: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      if (isMounted.current) {
        setIsSaving(false)
      }
    }
  }

  const handleExport = async () => {
    if (!campaign) return

    // Validate campaign before exporting
    if (!validateCampaign(campaign, availableEpisodes)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before exporting.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const jsonData = await exportCampaignToJSON(campaign.id)

      // Create a download link
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campaign-${campaign.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Campaign exported",
        description: "Your campaign has been successfully exported as JSON.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: `Failed to export campaign: ${(error as Error).message}`,
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
    debounce(async (campaignToSave: Campaign) => {
      if (!isMounted.current) return

      try {
        setIsAutoSaving(true)
        await saveCampaign(campaignToSave)
        console.log("Auto-saved campaign")

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

  // Trigger auto-save when campaign changes
  useEffect(() => {
    if (campaign) {
      debouncedSave(campaign)
    }
  }, [campaign, debouncedSave])

  const handleMetadataChange = (updatedMetadata: Partial<Campaign>) => {
    if (!campaign) return
    const updatedCampaign = { ...campaign, ...updatedMetadata }
    setCampaign(updatedCampaign)
    validateCampaign(updatedCampaign, availableEpisodes)
  }

  const handleEpisodesChange = (updatedEpisodes: Campaign["episodes"]) => {
    if (!campaign) return
    const updatedCampaign = { ...campaign, episodes: updatedEpisodes }
    setCampaign(updatedCampaign)
    validateCampaign(updatedCampaign, availableEpisodes)
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lcars-blue text-xl">Loading campaign editor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lcars-blue text-2xl font-bold">{campaignId ? "Edit Campaign" : "Create New Campaign"}</h2>
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
          <LcarsButton
            onClick={handleExport}
            variant="secondary"
            disabled={isExporting || validationErrors.length > 0}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? "EXPORTING..." : "EXPORT JSON"}
          </LcarsButton>
          <LcarsButton
            onClick={handleSave}
            disabled={isSaving || validationErrors.length > 0}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? "SAVING..." : "SAVE CAMPAIGN"}
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
        <TabsList className="bg-lcars-black border-2 border-lcars-blue rounded-full mb-4">
          <TabsTrigger
            value="metadata"
            className="data-[state=active]:bg-lcars-blue data-[state=active]:text-lcars-black rounded-full px-6"
          >
            Metadata
          </TabsTrigger>
          <TabsTrigger
            value="episodes"
            className="data-[state=active]:bg-lcars-purple data-[state=active]:text-lcars-black rounded-full px-6"
          >
            Episodes
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            className="data-[state=active]:bg-lcars-gold data-[state=active]:text-lcars-black rounded-full px-6"
          >
            Flow Chart
          </TabsTrigger>
          <TabsTrigger
            value="json"
            className="data-[state=active]:bg-lcars-teal data-[state=active]:text-lcars-black rounded-full px-6"
          >
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <LcarsPanel title="CAMPAIGN METADATA" color="blue">
            <CampaignMetadataEditor campaign={campaign} onChange={handleMetadataChange} />
          </LcarsPanel>
        </TabsContent>

        <TabsContent value="episodes">
          <LcarsPanel title="CAMPAIGN EPISODES" color="purple">
            <CampaignEpisodeManager
              campaignEpisodes={campaign.episodes}
              availableEpisodes={availableEpisodes}
              onChange={handleEpisodesChange}
            />
          </LcarsPanel>
        </TabsContent>

        <TabsContent value="flow">
          <LcarsPanel title="CAMPAIGN FLOW" color="gold">
            <CampaignFlowViewer campaign={campaign} availableEpisodes={availableEpisodes} />
          </LcarsPanel>
        </TabsContent>

        <TabsContent value="json">
          <LcarsPanel title="JSON VIEWER" color="teal">
            <JsonViewer campaign={campaign} onExport={handleExport} isExporting={isExporting} />
          </LcarsPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
