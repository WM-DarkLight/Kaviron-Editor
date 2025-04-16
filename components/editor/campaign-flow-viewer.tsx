"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Campaign, Episode } from "@/types/schema"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface CampaignFlowViewerProps {
  campaign: Campaign
  availableEpisodes: Episode[]
}

interface NodePosition {
  x: number
  y: number
}

export function CampaignFlowViewer({ campaign, availableEpisodes }: CampaignFlowViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Initialize node positions
  useEffect(() => {
    const episodeIds = campaign.episodes.map((ep) => ep.episodeId)
    const newPositions: Record<string, NodePosition> = {}

    // Position nodes in a tree-like layout
    const startingEpisodes = campaign.episodes.filter((ep) => !ep.condition?.previousEpisodeId)
    const remainingEpisodes = campaign.episodes.filter((ep) => ep.condition?.previousEpisodeId)

    // Place starting episodes in a row at the top
    const startSpacing = 200
    startingEpisodes.forEach((episode, index) => {
      newPositions[episode.episodeId] = {
        x: index * startSpacing + 100,
        y: 80,
      }
    })

    // Place remaining episodes based on their dependencies
    let currentY = 250
    const placedEpisodes = new Set(startingEpisodes.map((ep) => ep.episodeId))

    // Keep trying to place episodes until all are placed or we can't place any more
    while (remainingEpisodes.length > 0 && placedEpisodes.size < campaign.episodes.length) {
      const episodesToPlace = remainingEpisodes.filter(
        (ep) => ep.condition?.previousEpisodeId && placedEpisodes.has(ep.condition.previousEpisodeId),
      )

      if (episodesToPlace.length === 0) break

      // Group episodes by their previous episode
      const groupedByPrevious: Record<string, typeof episodesToPlace> = {}
      episodesToPlace.forEach((ep) => {
        const prevId = ep.condition?.previousEpisodeId || ""
        if (!groupedByPrevious[prevId]) groupedByPrevious[prevId] = []
        groupedByPrevious[prevId].push(ep)
      })

      // Place each group
      Object.entries(groupedByPrevious).forEach(([prevId, episodes]) => {
        const prevPos = newPositions[prevId]
        if (!prevPos) return

        const groupWidth = episodes.length * startSpacing
        const startX = prevPos.x - groupWidth / 2 + startSpacing / 2

        episodes.forEach((episode, index) => {
          newPositions[episode.episodeId] = {
            x: startX + index * startSpacing,
            y: currentY,
          }

          // Remove from remaining episodes
          const idx = remainingEpisodes.findIndex((ep) => ep.episodeId === episode.episodeId)
          if (idx >= 0) remainingEpisodes.splice(idx, 1)

          placedEpisodes.add(episode.episodeId)
        })
      })

      currentY += 170
    }

    // Place any remaining episodes in a row at the bottom
    if (remainingEpisodes.length > 0) {
      remainingEpisodes.forEach((episode, index) => {
        newPositions[episode.episodeId] = {
          x: index * startSpacing + 100,
          y: currentY,
        }
      })
    }

    setPositions(newPositions)
  }, [campaign.episodes])

  // Draw the flow chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const container = containerRef.current
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply scaling
    ctx.save()
    ctx.scale(scale, scale)

    // Draw connections first (so they appear behind nodes)
    campaign.episodes.forEach((episode) => {
      if (!episode.condition?.previousEpisodeId) return

      const sourcePos = positions[episode.condition.previousEpisodeId]
      const targetPos = positions[episode.episodeId]

      if (!sourcePos || !targetPos) return

      // Draw connection line
      ctx.beginPath()
      ctx.moveTo(sourcePos.x + 75, sourcePos.y + 80) // Bottom of source node

      // Create a curved line
      const midX = (sourcePos.x + targetPos.x) / 2
      const midY = (sourcePos.y + targetPos.y) / 2 + 30
      ctx.quadraticCurveTo(midX, midY, targetPos.x + 75, targetPos.y) // Top of target node

      // Set line style
      ctx.lineWidth = 2
      ctx.strokeStyle = "#99CCFF" // lcars-blue

      // If there are flag conditions, use a different style
      if (episode.condition.flags && Object.keys(episode.condition.flags).length > 0) {
        ctx.strokeStyle = "#CC99CC" // lcars-purple
        ctx.setLineDash([5, 3]) // Dashed line for conditional paths
      } else {
        ctx.setLineDash([])
      }

      ctx.stroke()

      // Draw arrow at the end of the line
      const arrowSize = 8
      const angle = Math.atan2(targetPos.y - midY, targetPos.x + 75 - midX)

      ctx.beginPath()
      ctx.moveTo(targetPos.x + 75, targetPos.y)
      ctx.lineTo(
        targetPos.x + 75 - arrowSize * Math.cos(angle - Math.PI / 6),
        targetPos.y - arrowSize * Math.sin(angle - Math.PI / 6),
      )
      ctx.lineTo(
        targetPos.x + 75 - arrowSize * Math.cos(angle + Math.PI / 6),
        targetPos.y - arrowSize * Math.sin(angle + Math.PI / 6),
      )
      ctx.closePath()
      ctx.fillStyle =
        episode.condition.flags && Object.keys(episode.condition.flags).length > 0
          ? "#CC99CC" // lcars-purple
          : "#99CCFF" // lcars-blue
      ctx.fill()

      // If there are flag conditions, draw them
      if (episode.condition.flags && Object.keys(episode.condition.flags).length > 0) {
        ctx.font = "12px LCARS"
        ctx.fillStyle = "#F1DF6F" // lcars-text
        ctx.textAlign = "center"

        const flagText = Object.entries(episode.condition.flags)
          .map(([name, value]) => `${name}: ${value ? "true" : "false"}`)
          .join(", ")

        ctx.fillText(flagText, midX, midY - 10)
      }
    })

    // Draw nodes
    campaign.episodes.forEach((episode) => {
      const pos = positions[episode.episodeId]
      if (!pos) return

      // Find the full episode details
      const episodeDetails = availableEpisodes.find((ep) => ep.id === episode.episodeId)

      // Determine node color based on status
      const bgColor = "#000000" // lcars-black
      let borderColor = "#99CCFF" // lcars-blue

      // Starting episodes (no previous episode requirement)
      if (!episode.condition?.previousEpisodeId) {
        borderColor = "#FF9900" // lcars-orange
      }

      // Episodes with flag conditions
      if (episode.condition?.flags && Object.keys(episode.condition.flags).length > 0) {
        borderColor = "#CC99CC" // lcars-purple
      }

      // Episodes with initial state
      if (episode.initialState?.flags && Object.keys(episode.initialState.flags).length > 0) {
        borderColor = "#FFCC66" // lcars-gold
      }

      // Draw node background
      ctx.fillStyle = bgColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 3

      // Rounded rectangle
      const width = 150
      const height = 80
      const radius = 10

      ctx.beginPath()
      ctx.moveTo(pos.x + radius, pos.y)
      ctx.lineTo(pos.x + width - radius, pos.y)
      ctx.quadraticCurveTo(pos.x + width, pos.y, pos.x + width, pos.y + radius)
      ctx.lineTo(pos.x + width, pos.y + height - radius)
      ctx.quadraticCurveTo(pos.x + width, pos.y + height, pos.x + width - radius, pos.y + height)
      ctx.lineTo(pos.x + radius, pos.y + height)
      ctx.quadraticCurveTo(pos.x, pos.y + height, pos.x, pos.y + height - radius)
      ctx.lineTo(pos.x, pos.y + radius)
      ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y)
      ctx.closePath()

      ctx.fill()
      ctx.stroke()

      // Draw episode order number in a circle
      ctx.beginPath()
      ctx.arc(pos.x + 20, pos.y + 20, 15, 0, Math.PI * 2)
      ctx.fillStyle = borderColor
      ctx.fill()

      ctx.font = "bold 14px LCARS"
      ctx.fillStyle = "#000000" // lcars-black
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(episode.order.toString(), pos.x + 20, pos.y + 20)

      // Draw episode title
      ctx.font = "bold 14px LCARS"
      ctx.fillStyle = borderColor
      ctx.textAlign = "center"
      ctx.textBaseline = "top"

      // Truncate long titles
      let title = episode.title
      if (title.length > 15) {
        title = title.substring(0, 15) + "..."
      }

      ctx.fillText(title, pos.x + width / 2, pos.y + 15)

      // Draw episode ID
      ctx.font = "10px LCARS"
      ctx.fillStyle = "#F1DF6F" // lcars-text
      ctx.fillText(episode.episodeId.substring(0, 10) + "...", pos.x + width / 2, pos.y + 40)

      // Draw condition/state indicators
      const indicators = []

      if (episode.condition?.previousEpisodeId) {
        indicators.push("Req. Previous")
      }

      if (episode.condition?.flags && Object.keys(episode.condition.flags).length > 0) {
        indicators.push("Flags Req.")
      }

      if (episode.initialState?.flags && Object.keys(episode.initialState.flags).length > 0) {
        indicators.push("Sets Flags")
      }

      if (indicators.length > 0) {
        ctx.font = "10px LCARS"
        ctx.fillStyle = "#F1DF6F" // lcars-text
        ctx.fillText(indicators.join(" • "), pos.x + width / 2, pos.y + 60)
      }
    })

    ctx.restore()
  }, [campaign.episodes, positions, scale, availableEpisodes])

  // Handle mouse events for dragging nodes
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) / scale
    const mouseY = (e.clientY - rect.top) / scale

    // Check if mouse is over any node
    for (const [episodeId, pos] of Object.entries(positions)) {
      if (mouseX >= pos.x && mouseX <= pos.x + 150 && mouseY >= pos.y && mouseY <= pos.y + 80) {
        setDragging(episodeId)
        setOffset({
          x: mouseX - pos.x,
          y: mouseY - pos.y,
        })
        break
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) / scale
    const mouseY = (e.clientY - rect.top) / scale

    setPositions((prev) => ({
      ...prev,
      [dragging]: {
        x: mouseX - offset.x,
        y: mouseY - offset.y,
      },
    }))
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleReset = () => {
    setScale(1)

    // Reset positions by triggering the useEffect
    setPositions({})
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lcars-gold font-bold">Campaign Flow Chart</h3>
          <p className="text-sm text-lcars-text/70">
            Drag nodes to rearrange. Purple lines indicate conditional paths.
          </p>
        </div>
        <div className="flex space-x-2">
          <LcarsButton onClick={handleZoomIn} size="sm" variant="secondary" className="flex items-center gap-1">
            <ZoomIn size={14} />
            ZOOM IN
          </LcarsButton>
          <LcarsButton onClick={handleZoomOut} size="sm" variant="secondary" className="flex items-center gap-1">
            <ZoomOut size={14} />
            ZOOM OUT
          </LcarsButton>
          <LcarsButton onClick={handleReset} size="sm" variant="tertiary" className="flex items-center gap-1">
            <RotateCcw size={14} />
            RESET
          </LcarsButton>
        </div>
      </div>

      <div
        ref={containerRef}
        className="border-2 border-lcars-gold rounded-lg bg-lcars-black/50 h-[calc(100vh-350px)] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="flex justify-between text-sm text-lcars-text/70">
        <div>Episodes: {campaign.episodes.length}</div>
        <div>Starting Episodes: {campaign.episodes.filter((ep) => !ep.condition?.previousEpisodeId).length}</div>
        <div>
          Conditional Paths:{" "}
          {campaign.episodes.filter((ep) => ep.condition?.flags && Object.keys(ep.condition.flags).length > 0).length}
        </div>
        <div>Scale: {Math.round(scale * 100)}%</div>
      </div>
    </div>
  )
}
