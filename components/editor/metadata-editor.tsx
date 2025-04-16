"use client"

import { useState, useEffect } from "react"
import { LcarsInput } from "@/components/lcars/lcars-input"
import { LcarsTextarea } from "@/components/lcars/lcars-textarea"
import type { Episode } from "@/types/schema"
import { validateShipName } from "@/lib/utils"

interface MetadataEditorProps {
  episode: Episode
  onChange: (updatedMetadata: Partial<Episode>) => void
}

export function MetadataEditor({ episode, onChange }: MetadataEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof Episode, value: string) => {
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    onChange({ [field]: value })
  }

  const validateFields = () => {
    const newErrors: Record<string, string> = {}

    if (!episode.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!episode.author.trim()) {
      newErrors.author = "Author is required"
    }

    if (!episode.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!episode.stardate.trim()) {
      newErrors.stardate = "Stardate is required"
    }

    if (!episode.shipName.trim()) {
      newErrors.shipName = "Ship name is required"
    } else if (!validateShipName(episode.shipName)) {
      newErrors.shipName = "Ship name must follow format: USS Name NCC-####"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate on initial load and when episode changes
  useEffect(() => {
    validateFields()
  }, [episode])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LcarsInput
          label="Episode ID"
          value={episode.id}
          onChange={(e) => handleChange("id", e.target.value)}
          disabled
          error={errors.id}
        />

        <LcarsInput
          label="Episode Title"
          value={episode.title}
          onChange={(e) => handleChange("title", e.target.value)}
          error={errors.title}
        />

        <LcarsInput
          label="Author"
          value={episode.author}
          onChange={(e) => handleChange("author", e.target.value)}
          error={errors.author}
        />

        <LcarsInput
          label="Stardate"
          value={episode.stardate}
          onChange={(e) => handleChange("stardate", e.target.value)}
          error={errors.stardate}
        />

        <LcarsInput
          label="Ship Name (format: USS Name NCC-####)"
          value={episode.shipName}
          onChange={(e) => handleChange("shipName", e.target.value)}
          error={errors.shipName}
        />
      </div>

      <LcarsTextarea
        label="Episode Description"
        value={episode.description}
        onChange={(e) => handleChange("description", e.target.value)}
        rows={4}
        error={errors.description}
      />

      <div className="bg-lcars-black/50 border-2 border-lcars-orange rounded-lg p-4 mt-6">
        <h3 className="text-lcars-orange font-bold mb-2">Episode Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-lcars-text text-sm font-bold">Title:</p>
            <p className="text-lcars-orange">{episode.title || "Untitled Episode"}</p>
          </div>
          <div>
            <p className="text-lcars-text text-sm font-bold">Author:</p>
            <p className="text-lcars-blue">{episode.author || "Unknown"}</p>
          </div>
          <div>
            <p className="text-lcars-text text-sm font-bold">Stardate:</p>
            <p className="text-lcars-purple">{episode.stardate || "Unknown"}</p>
          </div>
          <div>
            <p className="text-lcars-text text-sm font-bold">Ship:</p>
            <p className="text-lcars-gold">{episode.shipName || "Unknown"}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-lcars-text text-sm font-bold">Description:</p>
          <p className="text-lcars-text">{episode.description || "No description provided."}</p>
        </div>
      </div>
    </div>
  )
}
