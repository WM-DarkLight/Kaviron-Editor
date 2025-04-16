"use client"

import { useState, useEffect } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { getEpisodeSnapshots, restoreEpisodeFromSnapshot, getEpisode } from "@/lib/db"
import type { Episode } from "@/types/schema"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, History, AlertTriangle } from "lucide-react"

interface RecoveryPanelProps {
  episodeId: string
  onRestore: (episode: Episode) => void
  onCancel: () => void
}

interface SnapshotInfo {
  id: string
  timestamp: string
  type: string
  formattedDate: string
}

export function RecoveryPanel({ episodeId, onRestore, onCancel }: RecoveryPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        const snapshotList = await getEpisodeSnapshots(episodeId)

        // Format dates for display
        const formattedSnapshots = snapshotList.map((snapshot) => ({
          ...snapshot,
          formattedDate: new Date(snapshot.timestamp).toLocaleString(),
        }))

        setSnapshots(formattedSnapshots)

        // Select the most recent snapshot by default
        if (formattedSnapshots.length > 0) {
          setSelectedSnapshotId(formattedSnapshots[0].id)
        }
      } catch (error) {
        console.error("Failed to load snapshots:", error)
        toast({
          title: "Error",
          description: "Failed to load episode snapshots.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSnapshots()
  }, [episodeId, toast])

  const handleRestore = async () => {
    if (!selectedSnapshotId) {
      toast({
        title: "Error",
        description: "Please select a snapshot to restore.",
        variant: "destructive",
      })
      return
    }

    setIsRestoring(true)
    try {
      await restoreEpisodeFromSnapshot(selectedSnapshotId)
      const restoredEpisode = await getEpisode(episodeId)

      if (!restoredEpisode) {
        throw new Error("Failed to load restored episode")
      }

      onRestore(restoredEpisode)
    } catch (error) {
      console.error("Failed to restore snapshot:", error)
      toast({
        title: "Error",
        description: `Failed to restore snapshot: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <LcarsPanel title="EPISODE RECOVERY" color="purple">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <History size={24} className="text-lcars-purple mr-2" />
            <h2 className="text-lcars-purple text-xl font-bold">Snapshot Recovery</h2>
          </div>
          <LcarsButton onClick={onCancel} variant="tertiary" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            BACK TO EDITOR
          </LcarsButton>
        </div>

        <div className="bg-lcars-black/50 border-2 border-lcars-purple rounded-lg p-4">
          <p className="text-lcars-text mb-4">
            Select a snapshot to restore your episode to a previous state. This will overwrite your current episode
            data.
          </p>

          <div className="flex items-center text-lcars-gold mb-4">
            <AlertTriangle size={16} className="mr-2" />
            <p className="text-sm">
              Warning: Restoring a snapshot cannot be undone. Consider saving your current work first.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-lcars-purple">Loading snapshots...</div>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex items-center justify-center h-40 border-2 border-dashed border-lcars-purple/30 rounded-lg">
              <div className="text-center">
                <p className="text-lcars-text">No snapshots found for this episode</p>
                <p className="text-lcars-text/70 text-sm mt-2">
                  Snapshots are created automatically when you save your episode
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-80 overflow-y-auto pr-2">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className={`
                      p-3 mb-2 rounded-lg cursor-pointer transition-colors
                      ${selectedSnapshotId === snapshot.id ? "bg-lcars-purple text-lcars-black" : "bg-lcars-black/50 hover:bg-lcars-black/70"}
                    `}
                    onClick={() => setSelectedSnapshotId(snapshot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{snapshot.type === "manual-save" ? "Manual Save" : "Auto Save"}</div>
                      <div className="text-sm">{snapshot.formattedDate}</div>
                    </div>
                    <div className="text-xs mt-1 opacity-70">ID: {snapshot.id}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <LcarsButton onClick={handleRestore} disabled={!selectedSnapshotId || isRestoring} variant="primary">
                  {isRestoring ? "RESTORING..." : "RESTORE SELECTED SNAPSHOT"}
                </LcarsButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </LcarsPanel>
  )
}
