"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Scene } from "@/types/schema"
import { findBrokenLinks, findUnreachableScenes } from "@/lib/utils"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface FlowChartProps {
  scenes: Record<string, Scene>
}

interface NodePosition {
  x: number
  y: number
}

export function FlowChart({ scenes }: FlowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [brokenLinks, setBrokenLinks] = useState<{ sceneId: string; choiceIndex: number }[]>([])
  const [unreachableScenes, setUnreachableScenes] = useState<string[]>([])

  // Calculate broken links and unreachable scenes
  useEffect(() => {
    setBrokenLinks(findBrokenLinks(scenes))
    setUnreachableScenes(findUnreachableScenes(scenes))
  }, [scenes])

  // Initialize node positions
  useEffect(() => {
    const sceneIds = Object.keys(scenes)
    const newPositions: Record<string, NodePosition> = {}

    // Position nodes in a grid layout
    const cols = Math.ceil(Math.sqrt(sceneIds.length))
    const spacing = 180

    sceneIds.forEach((id, index) => {
      // Start scene is always at the top center
      if (id === "start") {
        newPositions[id] = { x: (cols * spacing) / 2, y: 80 }
      } else {
        const row = Math.floor(index / cols)
        const col = index % cols
        newPositions[id] = { x: col * spacing + 100, y: row * spacing + 200 }
      }
    })

    setPositions(newPositions)
  }, [scenes])

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
    Object.entries(scenes).forEach(([sceneId, scene]) => {
      const sourcePos = positions[sceneId]
      if (!sourcePos) return

      scene.choices.forEach((choice, choiceIndex) => {
        const targetPos = positions[choice.nextScene]
        if (!targetPos) return

        // Check if this is a broken link
        const isBroken = brokenLinks.some((link) => link.sceneId === sceneId && link.choiceIndex === choiceIndex)

        // Draw connection line
        ctx.beginPath()
        ctx.moveTo(sourcePos.x + 75, sourcePos.y + 40) // Bottom of source node

        // Create a curved line
        const midX = (sourcePos.x + targetPos.x) / 2
        const midY = (sourcePos.y + targetPos.y) / 2 + 50
        ctx.quadraticCurveTo(midX, midY, targetPos.x + 75, targetPos.y) // Top of target node

        // Set line style
        ctx.lineWidth = 2
        if (isBroken) {
          ctx.strokeStyle = "#CC6666" // lcars-red
          ctx.setLineDash([5, 3]) // Dashed line for broken links
        } else {
          ctx.strokeStyle = "#99CCFF" // lcars-blue
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
        ctx.fillStyle = isBroken ? "#CC6666" : "#99CCFF"
        ctx.fill()

        // Draw choice text
        ctx.font = "12px LCARS"
        ctx.fillStyle = "#F1DF6F" // lcars-text
        ctx.textAlign = "center"

        // Truncate long choice text
        let choiceText = choice.text
        if (choiceText.length > 20) {
          choiceText = choiceText.substring(0, 20) + "..."
        }

        ctx.fillText(choiceText, midX, midY - 10)
      })
    })

    // Draw nodes
    Object.entries(scenes).forEach(([sceneId, scene]) => {
      const pos = positions[sceneId]
      if (!pos) return

      // Determine node color based on status
      const bgColor = "#000000" // lcars-black
      let borderColor = "#FF9900" // lcars-orange

      if (sceneId === "start") {
        borderColor = "#FFCC66" // lcars-gold
      } else if (unreachableScenes.includes(sceneId)) {
        borderColor = "#CC6666" // lcars-red
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

      // Draw node title
      ctx.font = "bold 14px LCARS"
      ctx.fillStyle = borderColor
      ctx.textAlign = "center"
      ctx.fillText(scene.title, pos.x + width / 2, pos.y + 20)

      // Draw scene ID
      ctx.font = "12px LCARS"
      ctx.fillStyle = "#F1DF6F" // lcars-text
      ctx.fillText(sceneId, pos.x + width / 2, pos.y + 40)

      // Draw choices count
      ctx.fillText(`${scene.choices.length} choices`, pos.x + width / 2, pos.y + 60)

      // Draw status indicator for unreachable scenes
      if (unreachableScenes.includes(sceneId) && sceneId !== "start") {
        ctx.font = "bold 10px LCARS"
        ctx.fillStyle = "#CC6666" // lcars-red
        ctx.fillText("UNREACHABLE", pos.x + width / 2, pos.y - 10)
      }
    })

    ctx.restore()
  }, [scenes, positions, scale, brokenLinks, unreachableScenes])

  // Handle mouse events for dragging nodes
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) / scale
    const mouseY = (e.clientY - rect.top) / scale

    // Check if mouse is over any node
    for (const [sceneId, pos] of Object.entries(positions)) {
      if (mouseX >= pos.x && mouseX <= pos.x + 150 && mouseY >= pos.y && mouseY <= pos.y + 80) {
        setDragging(sceneId)
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

    // Reset positions
    const sceneIds = Object.keys(scenes)
    const newPositions: Record<string, NodePosition> = {}

    const cols = Math.ceil(Math.sqrt(sceneIds.length))
    const spacing = 180

    sceneIds.forEach((id, index) => {
      if (id === "start") {
        newPositions[id] = { x: (cols * spacing) / 2, y: 80 }
      } else {
        const row = Math.floor(index / cols)
        const col = index % cols
        newPositions[id] = { x: col * spacing + 100, y: row * spacing + 200 }
      }
    })

    setPositions(newPositions)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lcars-gold font-bold">Scene Flow Chart</h3>
          <p className="text-sm text-lcars-text/70">Drag nodes to rearrange. Broken links are shown in red.</p>
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
        <div>Scenes: {Object.keys(scenes).length}</div>
        <div>
          {unreachableScenes.length > 0 ? (
            <span className="text-lcars-red">
              {unreachableScenes.length} unreachable {unreachableScenes.length === 1 ? "scene" : "scenes"}
            </span>
          ) : (
            <span className="text-lcars-blue">All scenes reachable</span>
          )}
        </div>
        <div>
          {brokenLinks.length > 0 ? (
            <span className="text-lcars-red">
              {brokenLinks.length} broken {brokenLinks.length === 1 ? "link" : "links"}
            </span>
          ) : (
            <span className="text-lcars-blue">No broken links</span>
          )}
        </div>
        <div>Scale: {Math.round(scale * 100)}%</div>
      </div>
    </div>
  )
}
