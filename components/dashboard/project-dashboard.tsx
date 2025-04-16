"use client"

import { useState, useEffect } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { EpisodeList } from "./episode-list"
import { CampaignList } from "./campaign-list"
import { ImportExportPanel } from "./import-export-panel"
import { getAllEpisodes, getAllCampaigns } from "@/lib/db"
import type { Episode, Campaign } from "@/types/schema"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface ProjectDashboardProps {
  onOpenEpisode: (episodeId: string) => void
  onCreateNewEpisode: () => void
  onOpenCampaign: (campaignId: string) => void
  onCreateNewCampaign: () => void
  onTestEpisode: (episodeId: string) => void
  debugMode?: boolean
}

export function ProjectDashboard({
  onOpenEpisode,
  onCreateNewEpisode,
  onOpenCampaign,
  onCreateNewCampaign,
  onTestEpisode,
  debugMode = false,
}: ProjectDashboardProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("episodes")
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [episodesData, campaignsData] = await Promise.all([getAllEpisodes(), getAllCampaigns()])

        setEpisodes(episodesData)
        setCampaigns(campaignsData)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleEpisodeDeleted = (deletedId: string) => {
    setEpisodes(episodes.filter((episode) => episode.id !== deletedId))
    if (selectedEpisodeId === deletedId) {
      setSelectedEpisodeId(null)
    }
  }

  const handleCampaignDeleted = (deletedId: string) => {
    setCampaigns(campaigns.filter((campaign) => campaign.id !== deletedId))
    if (selectedCampaignId === deletedId) {
      setSelectedCampaignId(null)
    }
  }

  const handleImportSuccess = async () => {
    // Reload data after import
    try {
      const [episodesData, campaignsData] = await Promise.all([getAllEpisodes(), getAllCampaigns()])

      setEpisodes(episodesData)
      setCampaigns(campaignsData)
    } catch (error) {
      console.error("Failed to reload projects after import:", error)
    }
  }

  const handleEpisodeSelect = (episodeId: string) => {
    setSelectedEpisodeId(episodeId === selectedEpisodeId ? null : episodeId)
  }

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId === selectedCampaignId ? null : campaignId)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-lcars-black border-2 border-lcars-orange rounded-full mb-4">
            <TabsTrigger
              value="episodes"
              className="data-[state=active]:bg-lcars-orange data-[state=active]:text-lcars-black rounded-full px-6"
            >
              Episodes
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="data-[state=active]:bg-lcars-blue data-[state=active]:text-lcars-black rounded-full px-6"
            >
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="episodes">
            <LcarsPanel title="EPISODES" color="orange" className="h-[calc(100vh-220px)]">
              <div className="flex justify-end mb-4">
                <LcarsButton onClick={onCreateNewEpisode}>CREATE NEW EPISODE</LcarsButton>
              </div>

              <EpisodeList
                episodes={episodes}
                isLoading={isLoading}
                onOpenEpisode={onOpenEpisode}
                onTestEpisode={onTestEpisode}
                onEpisodeDeleted={handleEpisodeDeleted}
                selectedEpisodeId={selectedEpisodeId}
                onEpisodeSelect={handleEpisodeSelect}
              />
            </LcarsPanel>
          </TabsContent>

          <TabsContent value="campaigns">
            <LcarsPanel title="CAMPAIGNS" color="blue" className="h-[calc(100vh-220px)]">
              <div className="flex justify-end mb-4">
                <LcarsButton variant="secondary" onClick={onCreateNewCampaign}>
                  CREATE NEW CAMPAIGN
                </LcarsButton>
              </div>

              <CampaignList
                campaigns={campaigns}
                isLoading={isLoading}
                onOpenCampaign={onOpenCampaign}
                onCampaignDeleted={handleCampaignDeleted}
                selectedCampaignId={selectedCampaignId}
                onCampaignSelect={handleCampaignSelect}
              />
            </LcarsPanel>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <ImportExportPanel
          onImportSuccess={handleImportSuccess}
          selectedEpisodeId={selectedEpisodeId}
          selectedCampaignId={selectedCampaignId}
        />
      </div>
    </div>
  )
}
