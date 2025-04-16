"use client"

import type React from "react"

import { useState } from "react"
import { LcarsButton } from "@/components/lcars/lcars-button"
import type { Episode } from "@/types/schema"
import { deleteEpisode } from "@/lib/db"
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
import { Edit, Play, Trash2, Check } from "lucide-react"

interface EpisodeListProps {
  episodes: Episode[]
  isLoading: boolean
  onOpenEpisode: (episodeId: string) => void
  onTestEpisode: (episodeId: string) => void
  onEpisodeDeleted: (episodeId: string) => void
  selectedEpisodeId: string | null
  onEpisodeSelect: (episodeId: string) => void
}

export function EpisodeList({
  episodes,
  isLoading,
  onOpenEpisode,
  onTestEpisode,
  onEpisodeDeleted,
  selectedEpisodeId,
  onEpisodeSelect,
}: EpisodeListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [episodeToDelete, setEpisodeToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteClick = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selection when clicking delete
    setEpisodeToDelete(episodeId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!episodeToDelete) return

    try {
      await deleteEpisode(episodeToDelete)
      onEpisodeDeleted(episodeToDelete)
      toast({
        title: "Episode deleted",
        description: "The episode has been successfully deleted.",
      })
    } catch (error) {
      console.error("Failed to delete episode:", error)
      toast({
        title: "Error",
        description: "Failed to delete episode. Please try again.",
        variant: "destructive",
      })
    }

    setDeleteDialogOpen(false)
    setEpisodeToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lcars-orange text-xl">Loading episodes...</div>
      </div>
    )
  }

  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lcars-text text-xl">No episodes found</div>
        <div className="text-lcars-text text-sm">Create a new episode or import one to get started.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <div
          key={episode.id}
          className={`
            border-2 rounded-lg p-4 transition-colors cursor-pointer
            ${
              selectedEpisodeId === episode.id
                ? "border-lcars-orange bg-lcars-black/70"
                : "border-lcars-blue bg-lcars-black/50 hover:bg-lcars-black/70"
            }
          `}
          onClick={() => onEpisodeSelect(episode.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2">
              {selectedEpisodeId === episode.id && (
                <div className="mt-1 text-lcars-orange">
                  <Check size={18} />
                </div>
              )}
              <div>
                <h3 className="text-lcars-orange text-lg font-bold">{episode.title}</h3>
                <p className="text-lcars-text text-sm mt-1">{episode.description}</p>
                <div className="flex mt-2 space-x-4 text-xs text-lcars-text/70">
                  <div>Author: {episode.author}</div>
                  <div>Stardate: {episode.stardate}</div>
                  <div>Ship: {episode.shipName}</div>
                </div>
                <div className="text-xs text-lcars-text/70 mt-1">Scenes: {Object.keys(episode.scenes).length}</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <LcarsButton
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenEpisode(episode.id)
                }}
                className="flex items-center gap-1"
              >
                <Edit size={14} />
                EDIT
              </LcarsButton>

              <LcarsButton
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  onTestEpisode(episode.id)
                }}
                className="flex items-center gap-1"
              >
                <Play size={14} />
                TEST
              </LcarsButton>

              <LcarsButton
                size="sm"
                variant="danger"
                onClick={(e) => handleDeleteClick(episode.id, e)}
                className="flex items-center gap-1"
              >
                <Trash2 size={14} />
                DELETE
              </LcarsButton>
            </div>
          </div>

          {episode.lastModified && (
            <div className="text-xs text-lcars-text/70 mt-2">
              Last modified: {new Date(episode.lastModified).toLocaleString()}
            </div>
          )}
        </div>
      ))}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-lcars-black border-2 border-lcars-red">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lcars-red">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-lcars-text">
              Are you sure you want to delete this episode? This action cannot be undone.
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
