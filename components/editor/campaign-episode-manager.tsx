"use client"

import { useState } from "react"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { LcarsInput } from "@/components/lcars/lcars-input"
import { LcarsTextarea } from "@/components/lcars/lcars-textarea"
import type { Campaign, Episode, CampaignEpisode } from "@/types/schema"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CampaignEpisodeManagerProps {
  campaignEpisodes: Campaign["episodes"]
  availableEpisodes: Episode[]
  onChange: (updatedEpisodes: Campaign["episodes"]) => void
}

export function CampaignEpisodeManager({ campaignEpisodes, availableEpisodes, onChange }: CampaignEpisodeManagerProps) {
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState<number | null>(null)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleAddEpisode = () => {
    setEpisodeDialogOpen(true)
  }

  const handleSelectEpisode = (episodeId: string) => {
    // Find the episode details
    const episode = availableEpisodes.find((ep) => ep.id === episodeId)
    if (!episode) return

    // Create a new campaign episode
    const newCampaignEpisode: CampaignEpisode = {
      episodeId: episode.id,
      title: episode.title,
      description: episode.description,
      order: campaignEpisodes.length + 1,
    }

    // Add to campaign episodes
    const updatedEpisodes = [...campaignEpisodes, newCampaignEpisode]
    onChange(updatedEpisodes)
    setEpisodeDialogOpen(false)

    // Set as active episode
    setActiveEpisodeIndex(updatedEpisodes.length - 1)

    toast({
      title: "Episode added",
      description: `"${episode.title}" has been added to the campaign.`,
    })
  }

  const handleRemoveEpisode = (index: number) => {
    const updatedEpisodes = [...campaignEpisodes]
    updatedEpisodes.splice(index, 1)

    // Update order numbers
    updatedEpisodes.forEach((episode, idx) => {
      episode.order = idx + 1
    })

    onChange(updatedEpisodes)

    if (activeEpisodeIndex === index) {
      setActiveEpisodeIndex(null)
    } else if (activeEpisodeIndex !== null && activeEpisodeIndex > index) {
      setActiveEpisodeIndex(activeEpisodeIndex - 1)
    }

    toast({
      title: "Episode removed",
      description: "The episode has been removed from the campaign.",
    })
  }

  const handleMoveEpisode = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === campaignEpisodes.length - 1)) {
      return
    }

    const updatedEpisodes = [...campaignEpisodes]
    const newIndex = direction === "up" ? index - 1 : index + 1

    // Swap episodes
    const temp = updatedEpisodes[index]
    updatedEpisodes[index] = updatedEpisodes[newIndex]
    updatedEpisodes[newIndex] = temp

    // Update order numbers
    updatedEpisodes.forEach((episode, idx) => {
      episode.order = idx + 1
    })

    onChange(updatedEpisodes)

    // Update active episode index if needed
    if (activeEpisodeIndex === index) {
      setActiveEpisodeIndex(newIndex)
    } else if (activeEpisodeIndex === newIndex) {
      setActiveEpisodeIndex(index)
    }
  }

  const handleEpisodeChange = (index: number, field: keyof CampaignEpisode, value: any) => {
    const updatedEpisodes = [...campaignEpisodes]
    updatedEpisodes[index] = { ...updatedEpisodes[index], [field]: value }
    onChange(updatedEpisodes)
  }

  const handleConditionChange = (index: number, field: string, value: any) => {
    const updatedEpisodes = [...campaignEpisodes]
    const episode = updatedEpisodes[index]

    // Initialize condition object if it doesn't exist
    if (!episode.condition) {
      episode.condition = {}
    }

    // Update the field
    episode.condition = { ...episode.condition, [field]: value }

    // If all condition fields are empty, remove the condition object
    if (Object.values(episode.condition).every((v) => !v)) {
      delete episode.condition
    }

    onChange(updatedEpisodes)
  }

  const handleFlagChange = (index: number, flagName: string, value: boolean) => {
    const updatedEpisodes = [...campaignEpisodes]
    const episode = updatedEpisodes[index]

    // Initialize condition and flags objects if they don't exist
    if (!episode.condition) {
      episode.condition = {}
    }
    if (!episode.condition.flags) {
      episode.condition.flags = {}
    }

    // Update the flag
    episode.condition.flags = { ...episode.condition.flags, [flagName]: value }

    // If all flags are removed, clean up the objects
    if (Object.keys(episode.condition.flags).length === 0) {
      delete episode.condition.flags
      if (Object.keys(episode.condition).length === 0) {
        delete episode.condition
      }
    }

    onChange(updatedEpisodes)
  }

  const handleInitialStateChange = (index: number, flagName: string, value: boolean) => {
    const updatedEpisodes = [...campaignEpisodes]
    const episode = updatedEpisodes[index]

    // Initialize initialState and flags objects if they don't exist
    if (!episode.initialState) {
      episode.initialState = {}
    }
    if (!episode.initialState.flags) {
      episode.initialState.flags = {}
    }

    // Update the flag
    episode.initialState.flags = { ...episode.initialState.flags, [flagName]: value }

    // If all flags are removed, clean up the objects
    if (Object.keys(episode.initialState.flags).length === 0) {
      delete episode.initialState.flags
      if (Object.keys(episode.initialState).length === 0) {
        delete episode.initialState
      }
    }

    onChange(updatedEpisodes)
  }

  const handleAddFlag = (index: number, type: "condition" | "initialState") => {
    // Generate a unique flag name
    const flagName = `flag${Math.floor(Math.random() * 1000)}`

    if (type === "condition") {
      handleFlagChange(index, flagName, true)
    } else {
      handleInitialStateChange(index, flagName, true)
    }
  }

  const handleRemoveFlag = (index: number, type: "condition" | "initialState", flagName: string) => {
    const updatedEpisodes = [...campaignEpisodes]
    const episode = updatedEpisodes[index]

    if (type === "condition" && episode.condition?.flags) {
      const { [flagName]: _, ...remainingFlags } = episode.condition.flags
      episode.condition.flags = remainingFlags

      // Clean up if empty
      if (Object.keys(episode.condition.flags).length === 0) {
        delete episode.condition.flags
        if (Object.keys(episode.condition).length === 0) {
          delete episode.condition
        }
      }
    } else if (type === "initialState" && episode.initialState?.flags) {
      const { [flagName]: _, ...remainingFlags } = episode.initialState.flags
      episode.initialState.flags = remainingFlags

      // Clean up if empty
      if (Object.keys(episode.initialState.flags).length === 0) {
        delete episode.initialState.flags
        if (Object.keys(episode.initialState).length === 0) {
          delete episode.initialState
        }
      }
    }

    onChange(updatedEpisodes)
  }

  const getAvailableEpisodesForSelection = () => {
    // Filter out episodes that are already in the campaign
    const usedEpisodeIds = new Set(campaignEpisodes.map((ep) => ep.episodeId))
    return availableEpisodes.filter((ep) => !usedEpisodeIds.has(ep.id))
  }

  const renderEpisodeList = () => {
    if (campaignEpisodes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-lcars-purple/30 rounded-lg">
          <div className="text-center">
            <p className="text-lcars-text">No episodes in this campaign</p>
            <p className="text-lcars-text/70 text-sm mt-2">Add episodes to create your campaign storyline</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {campaignEpisodes.map((episode, index) => (
          <div
            key={index}
            className={`
              p-3 mb-2 rounded-lg cursor-pointer transition-colors
              ${activeEpisodeIndex === index ? "bg-lcars-purple text-lcars-black" : "bg-lcars-black/50 hover:bg-lcars-black/70"}
            `}
            onClick={() => setActiveEpisodeIndex(activeEpisodeIndex === index ? null : index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-lcars-blue flex items-center justify-center text-lcars-black font-bold mr-3">
                  {episode.order}
                </div>
                <div>
                  <div className="font-bold">{episode.title}</div>
                  <div className="text-xs opacity-70 truncate max-w-xs">{episode.description}</div>
                </div>
              </div>
              <div className="flex space-x-1">
                <LcarsButton
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveEpisode(index, "up")
                  }}
                  disabled={index === 0}
                  className="w-8 h-8 p-0 flex items-center justify-center"
                >
                  <ArrowUp size={14} />
                  <span className="sr-only">Move Up</span>
                </LcarsButton>
                <LcarsButton
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveEpisode(index, "down")
                  }}
                  disabled={index === campaignEpisodes.length - 1}
                  className="w-8 h-8 p-0 flex items-center justify-center"
                >
                  <ArrowDown size={14} />
                  <span className="sr-only">Move Down</span>
                </LcarsButton>
                <LcarsButton
                  size="sm"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveEpisode(index)
                  }}
                  className="w-8 h-8 p-0 flex items-center justify-center"
                >
                  <Trash2 size={14} />
                  <span className="sr-only">Remove</span>
                </LcarsButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderEpisodeEditor = () => {
    if (activeEpisodeIndex === null || !campaignEpisodes[activeEpisodeIndex]) {
      return (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-lcars-purple/50 rounded-lg">
          <div className="text-lcars-text text-center">
            <p>No episode selected</p>
            <p className="text-sm mt-2">Select an episode from the list or add a new one</p>
          </div>
        </div>
      )
    }

    const episode = campaignEpisodes[activeEpisodeIndex]
    const episodeDetails = availableEpisodes.find((ep) => ep.id === episode.episodeId)

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lcars-purple text-xl font-bold">Editing Episode: {episode.title}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LcarsInput label="Episode ID" value={episode.episodeId} disabled />

          <LcarsInput
            label="Order"
            type="number"
            value={episode.order.toString()}
            onChange={(e) => handleEpisodeChange(activeEpisodeIndex, "order", Number.parseInt(e.target.value) || 1)}
          />
        </div>

        <LcarsInput
          label="Title"
          value={episode.title}
          onChange={(e) => handleEpisodeChange(activeEpisodeIndex, "title", e.target.value)}
        />

        <LcarsTextarea
          label="Description"
          value={episode.description}
          onChange={(e) => handleEpisodeChange(activeEpisodeIndex, "description", e.target.value)}
          rows={3}
        />

        <div className="bg-lcars-black/50 border-2 border-lcars-blue/30 rounded-lg p-4">
          <h4 className="text-lcars-blue font-bold mb-3">Episode Conditions</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-lcars-blue mb-2">Previous Episode Requirement</label>
              <select
                value={episode.condition?.previousEpisodeId || ""}
                onChange={(e) =>
                  handleConditionChange(activeEpisodeIndex, "previousEpisodeId", e.target.value || undefined)
                }
                className="w-full px-4 py-2 bg-lcars-black border-2 border-lcars-blue rounded-md text-lcars-text"
              >
                <option value="">None (Available from start)</option>
                {campaignEpisodes
                  .filter((ep, idx) => idx < activeEpisodeIndex)
                  .map((ep, idx) => (
                    <option key={idx} value={ep.episodeId}>
                      {ep.order}. {ep.title}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-lcars-text/70 mt-1">
                If selected, this episode will only be available after completing the specified episode
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-lcars-blue">Required Flags</label>
                <LcarsButton
                  size="sm"
                  variant="tertiary"
                  onClick={() => handleAddFlag(activeEpisodeIndex, "condition")}
                  className="flex items-center gap-1"
                >
                  <Plus size={12} />
                  ADD FLAG
                </LcarsButton>
              </div>

              {!episode.condition?.flags || Object.keys(episode.condition.flags).length === 0 ? (
                <div className="text-xs text-lcars-text/70 italic">
                  No flag conditions set. This episode will be available based only on previous episode completion.
                </div>
              ) : (
                <div className="space-y-2 bg-lcars-black/30 p-3 rounded-lg">
                  {Object.entries(episode.condition.flags).map(([flagName, value]) => (
                    <div key={flagName} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <LcarsInput
                          value={flagName}
                          onChange={(e) => {
                            // Remove old flag and add with new name
                            const oldValue = episode.condition?.flags?.[flagName]
                            handleRemoveFlag(activeEpisodeIndex, "condition", flagName)
                            handleFlagChange(activeEpisodeIndex, e.target.value, oldValue as boolean)
                          }}
                          className="w-40"
                        />
                        <Switch
                          id={`flag-${flagName}`}
                          checked={value as boolean}
                          onCheckedChange={(checked) => handleFlagChange(activeEpisodeIndex, flagName, checked)}
                        />
                        <Label htmlFor={`flag-${flagName}`} className="text-lcars-text">
                          {value ? "True" : "False"}
                        </Label>
                      </div>
                      <LcarsButton
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveFlag(activeEpisodeIndex, "condition", flagName)}
                        className="w-8 h-8 p-0 flex items-center justify-center"
                      >
                        <X size={14} />
                      </LcarsButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-lcars-black/50 border-2 border-lcars-gold/30 rounded-lg p-4">
          <h4 className="text-lcars-gold font-bold mb-3">Initial State</h4>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-lcars-gold">Initial Flags</label>
              <LcarsButton
                size="sm"
                variant="tertiary"
                onClick={() => handleAddFlag(activeEpisodeIndex, "initialState")}
                className="flex items-center gap-1"
              >
                <Plus size={12} />
                ADD FLAG
              </LcarsButton>
            </div>

            {!episode.initialState?.flags || Object.keys(episode.initialState.flags).length === 0 ? (
              <div className="text-xs text-lcars-text/70 italic">
                No initial flags set. This episode will start with default state.
              </div>
            ) : (
              <div className="space-y-2 bg-lcars-black/30 p-3 rounded-lg">
                {Object.entries(episode.initialState.flags).map(([flagName, value]) => (
                  <div key={flagName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LcarsInput
                        value={flagName}
                        onChange={(e) => {
                          // Remove old flag and add with new name
                          const oldValue = episode.initialState?.flags?.[flagName]
                          handleRemoveFlag(activeEpisodeIndex, "initialState", flagName)
                          handleInitialStateChange(activeEpisodeIndex, e.target.value, oldValue as boolean)
                        }}
                        className="w-40"
                      />
                      <Switch
                        id={`initial-${flagName}`}
                        checked={value as boolean}
                        onCheckedChange={(checked) => handleInitialStateChange(activeEpisodeIndex, flagName, checked)}
                      />
                      <Label htmlFor={`initial-${flagName}`} className="text-lcars-text">
                        {value ? "True" : "False"}
                      </Label>
                    </div>
                    <LcarsButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveFlag(activeEpisodeIndex, "initialState", flagName)}
                      className="w-8 h-8 p-0 flex items-center justify-center"
                    >
                      <X size={14} />
                    </LcarsButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {episodeDetails && (
          <div className="bg-lcars-black/50 border-2 border-lcars-teal/30 rounded-lg p-4">
            <h4 className="text-lcars-teal font-bold mb-3">Episode Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-lcars-text text-sm font-bold">Author:</p>
                <p className="text-lcars-text">{episodeDetails.author}</p>
              </div>
              <div>
                <p className="text-lcars-text text-sm font-bold">Stardate:</p>
                <p className="text-lcars-text">{episodeDetails.stardate}</p>
              </div>
              <div>
                <p className="text-lcars-text text-sm font-bold">Ship:</p>
                <p className="text-lcars-text">{episodeDetails.shipName}</p>
              </div>
              <div>
                <p className="text-lcars-text text-sm font-bold">Scenes:</p>
                <p className="text-lcars-text">{Object.keys(episodeDetails.scenes).length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lcars-purple font-bold">Episode List</h3>
          <LcarsButton size="sm" variant="tertiary" onClick={handleAddEpisode} className="flex items-center gap-1">
            <Plus size={14} />
            ADD EPISODE
          </LcarsButton>
        </div>

        <div className="border-2 border-lcars-purple rounded-lg p-3 h-[calc(100vh-350px)] overflow-y-auto">
          {renderEpisodeList()}
        </div>

        <div className="mt-4">
          <div className="text-sm text-lcars-text/70 mb-2">Campaign Statistics:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-lcars-black/50 p-2 rounded-lg">
              <div className="text-lcars-blue font-bold">Total Episodes</div>
              <div>{campaignEpisodes.length}</div>
            </div>
            <div className="bg-lcars-black/50 p-2 rounded-lg">
              <div className="text-lcars-purple font-bold">Branching Paths</div>
              <div>
                {
                  campaignEpisodes.filter((ep) => ep.condition?.flags && Object.keys(ep.condition.flags).length > 0)
                    .length
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">{renderEpisodeEditor()}</div>

      <Dialog open={episodeDialogOpen} onOpenChange={setEpisodeDialogOpen}>
        <DialogContent className="bg-lcars-black border-2 border-lcars-purple max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lcars-purple text-xl">Select Episode</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {getAvailableEpisodesForSelection().length === 0 ? (
              <div className="text-center p-6">
                <p className="text-lcars-text">No available episodes to add</p>
                <p className="text-lcars-text/70 text-sm mt-2">
                  All episodes are already included in this campaign or no episodes exist.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getAvailableEpisodesForSelection().map((episode) => (
                  <div
                    key={episode.id}
                    className="border-2 border-lcars-blue/50 rounded-lg p-3 hover:bg-lcars-black/50 cursor-pointer"
                    onClick={() => handleSelectEpisode(episode.id)}
                  >
                    <h4 className="text-lcars-blue font-bold">{episode.title}</h4>
                    <p className="text-lcars-text text-sm mt-1">{episode.description}</p>
                    <div className="flex mt-2 space-x-4 text-xs text-lcars-text/70">
                      <div>Author: {episode.author}</div>
                      <div>Stardate: {episode.stardate}</div>
                      <div>Scenes: {Object.keys(episode.scenes).length}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
