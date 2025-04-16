"use client"

import type React from "react"

import { useState } from "react"
import { LcarsButton } from "@/components/lcars/lcars-button"
import type { Campaign } from "@/types/schema"
import { deleteCampaign } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Check } from "lucide-react"

interface CampaignListProps {
  campaigns: Campaign[]
  isLoading: boolean
  onOpenCampaign: (campaignId: string) => void
  onCampaignDeleted: (campaignId: string) => void
  selectedCampaignId: string | null
  onCampaignSelect: (campaignId: string) => void
}

export function CampaignList({
  campaigns,
  isLoading,
  onOpenCampaign,
  onCampaignDeleted,
  selectedCampaignId,
  onCampaignSelect,
}: CampaignListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteClick = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selection when clicking delete
    setCampaignToDelete(campaignId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return

    try {
      await deleteCampaign(campaignToDelete)
      onCampaignDeleted(campaignToDelete)
      toast({
        title: "Campaign deleted",
        description: "The campaign has been successfully deleted.",
      })
    } catch (error) {
      console.error("Failed to delete campaign:", error)
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      })
    }

    setDeleteDialogOpen(false)
    setCampaignToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lcars-blue text-xl">Loading campaigns...</div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lcars-text text-xl">No campaigns found</div>
        <div className="text-lcars-text text-sm">Create a new campaign or import one to get started.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className={`
            border-2 rounded-lg p-4 transition-colors cursor-pointer
            ${
              selectedCampaignId === campaign.id
                ? "border-lcars-blue bg-lcars-black/70"
                : "border-lcars-purple bg-lcars-black/50 hover:bg-lcars-black/70"
            }
          `}
          onClick={() => onCampaignSelect(campaign.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2">
              {selectedCampaignId === campaign.id && (
                <div className="mt-1 text-lcars-blue">
                  <Check size={18} />
                </div>
              )}
              <div>
                <h3 className="text-lcars-blue text-lg font-bold">{campaign.title}</h3>
                <p className="text-lcars-text text-sm mt-1">{campaign.description}</p>
                <div className="flex mt-2 space-x-4 text-xs text-lcars-text/70">
                  <div>Author: {campaign.author}</div>
                  <div>Version: {campaign.version}</div>
                </div>
                <div className="text-xs text-lcars-text/70 mt-1">Episodes: {campaign.episodes.length}</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <LcarsButton
                size="sm"
                variant="secondary"
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenCampaign(campaign.id)
                }}
              >
                <Edit size={14} />
                EDIT
              </LcarsButton>

              <LcarsButton
                size="sm"
                variant="danger"
                onClick={(e) => handleDeleteClick(campaign.id, e)}
                className="flex items-center gap-1"
              >
                <Trash2 size={14} />
                DELETE
              </LcarsButton>
            </div>
          </div>

          {campaign.lastModified && (
            <div className="text-xs text-lcars-text/70 mt-2">
              Last modified: {new Date(campaign.lastModified).toLocaleString()}
            </div>
          )}
        </div>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-lcars-black border-2 border-lcars-red">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lcars-red">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-lcars-text">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-lcars-blue text-lcars-black hover:bg-lcars-blue/90">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-lcars-red text-lcars-black hover:bg-lcars-red/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
