"use client"

import type React from "react"

import { useState, useRef } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import {
  importEpisodeFromJSON,
  importCampaignFromJSON,
  backupAllData,
  exportEpisodeToJSON,
  exportCampaignToJSON,
} from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, Database, AlertTriangle } from "lucide-react"

interface ImportExportPanelProps {
  onImportSuccess: () => void
  selectedEpisodeId?: string | null
  selectedCampaignId?: string | null
}

export function ImportExportPanel({ onImportSuccess, selectedEpisodeId, selectedCampaignId }: ImportExportPanelProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backupFileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      const fileContent = await readFileAsText(file)
      const jsonData = JSON.parse(fileContent)

      // Determine if it's an episode or campaign based on structure
      if (jsonData.scenes) {
        await importEpisodeFromJSON(fileContent)
        toast({
          title: "Episode imported",
          description: `Successfully imported episode: ${jsonData.title}`,
        })
      } else if (jsonData.episodes) {
        await importCampaignFromJSON(fileContent)
        toast({
          title: "Campaign imported",
          description: `Successfully imported campaign: ${jsonData.title}`,
        })
      } else {
        throw new Error("Invalid JSON format. Must be an episode or campaign.")
      }

      onImportSuccess()
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: (error as Error).message || "Failed to import file. Please check the format.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleExportEpisode = async () => {
    if (!selectedEpisodeId) {
      toast({
        title: "No episode selected",
        description: "Please select an episode to export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const jsonData = await exportEpisodeToJSON(selectedEpisodeId)

      // Create a download link
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `episode-${selectedEpisodeId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Episode exported",
        description: "Your episode has been successfully exported.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: (error as Error).message || "Failed to export episode.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCampaign = async () => {
    if (!selectedCampaignId) {
      toast({
        title: "No campaign selected",
        description: "Please select a campaign to export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const jsonData = await exportCampaignToJSON(selectedCampaignId)

      // Create a download link
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campaign-${selectedCampaignId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Campaign exported",
        description: "Your campaign has been successfully exported.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: (error as Error).message || "Failed to export campaign.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleBackupClick = async () => {
    setIsExporting(true)
    try {
      const backupData = await backupAllData()

      // Create a download link
      const blob = new Blob([backupData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lcars-fiction-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Backup created",
        description: "Your data has been successfully backed up.",
      })
    } catch (error) {
      console.error("Backup error:", error)
      toast({
        title: "Backup failed",
        description: (error as Error).message || "Failed to create backup.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRestoreClick = () => {
    backupFileInputRef.current?.click()
  }

  const handleBackupFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      const fileContent = await readFileAsText(file)

      // Validate backup format
      const backupData = JSON.parse(fileContent)
      if (!backupData.episodes || !backupData.campaigns) {
        throw new Error("Invalid backup format")
      }

      // Confirm restore
      if (
        !window.confirm(
          `This will restore ${backupData.episodes.length} episodes and ${backupData.campaigns.length} campaigns. ` +
            `Existing data with the same IDs will be overwritten. Continue?`,
        )
      ) {
        setIsImporting(false)
        return
      }

      // Import all episodes
      for (const episode of backupData.episodes) {
        await importEpisodeFromJSON(JSON.stringify(episode))
      }

      // Import all campaigns
      for (const campaign of backupData.campaigns) {
        await importCampaignFromJSON(JSON.stringify(campaign))
      }

      toast({
        title: "Restore complete",
        description: `Restored ${backupData.episodes.length} episodes and ${backupData.campaigns.length} campaigns.`,
      })

      onImportSuccess()
    } catch (error) {
      console.error("Restore error:", error)
      toast({
        title: "Restore failed",
        description: (error as Error).message || "Failed to restore from backup.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (backupFileInputRef.current) {
        backupFileInputRef.current.value = ""
      }
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      reader.onerror = () => reject(new Error("File read error"))
      reader.readAsText(file)
    })
  }

  return (
    <LcarsPanel title="IMPORT / EXPORT" color="purple">
      <div className="space-y-6">
        <div>
          <h3 className="text-lcars-purple font-bold mb-2">Import JSON</h3>
          <p className="text-lcars-text text-sm mb-4">Import episodes or campaigns from JSON files.</p>
          <LcarsButton
            variant="tertiary"
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {isImporting ? "IMPORTING..." : "IMPORT JSON FILE"}
          </LcarsButton>
          <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />
        </div>

        <div>
          <h3 className="text-lcars-gold font-bold mb-2">Export Options</h3>
          <p className="text-lcars-text text-sm mb-4">Export your episodes or campaigns to JSON files.</p>
          <LcarsButton
            variant="secondary"
            onClick={handleExportEpisode}
            disabled={!selectedEpisodeId || isExporting}
            className="w-full flex items-center justify-center gap-2 mb-2"
          >
            <Download size={16} />
            {isExporting ? "EXPORTING..." : "EXPORT SELECTED EPISODE"}
          </LcarsButton>
          <LcarsButton
            variant="secondary"
            onClick={handleExportCampaign}
            disabled={!selectedCampaignId || isExporting}
            className="w-full flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {isExporting ? "EXPORTING..." : "EXPORT SELECTED CAMPAIGN"}
          </LcarsButton>
        </div>

        <div>
          <h3 className="text-lcars-teal font-bold mb-2">Backup & Restore</h3>
          <p className="text-lcars-text text-sm mb-4">Create backups of all your data or restore from a backup.</p>
          <div className="flex items-center text-lcars-gold mb-4">
            <AlertTriangle size={16} className="mr-2" />
            <p className="text-xs">Restoring from backup will overwrite existing data with the same IDs.</p>
          </div>
          <LcarsButton
            variant="secondary"
            onClick={handleBackupClick}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 mb-2"
          >
            <Database size={16} />
            {isExporting ? "CREATING BACKUP..." : "BACKUP ALL DATA"}
          </LcarsButton>
          <LcarsButton
            variant="secondary"
            onClick={handleRestoreClick}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {isImporting ? "RESTORING..." : "RESTORE FROM BACKUP"}
          </LcarsButton>
          <input
            type="file"
            ref={backupFileInputRef}
            accept=".json"
            onChange={handleBackupFileChange}
            className="hidden"
          />
        </div>
      </div>
    </LcarsPanel>
  )
}
