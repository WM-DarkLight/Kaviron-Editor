"use client"

import { useState, useEffect } from "react"
import { LcarsInput } from "@/components/lcars/lcars-input"
import { LcarsTextarea } from "@/components/lcars/lcars-textarea"
import type { Campaign } from "@/types/schema"

interface CampaignMetadataEditorProps {
  campaign: Campaign
  onChange: (updatedMetadata: Partial<Campaign>) => void
}

export function CampaignMetadataEditor({ campaign, onChange }: CampaignMetadataEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof Campaign, value: string) => {
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

    if (!campaign.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!campaign.author.trim()) {
      newErrors.author = "Author is required"
    }

    if (!campaign.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!campaign.version.trim()) {
      newErrors.version = "Version is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate on initial load and when campaign changes
  useEffect(() => {
    validateFields()
  }, [campaign])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LcarsInput
          label="Campaign ID"
          value={campaign.id}
          onChange={(e) => handleChange("id", e.target.value)}
          disabled
          error={errors.id}
        />

        <LcarsInput
          label="Campaign Title"
          value={campaign.title}
          onChange={(e) => handleChange("title", e.target.value)}
          error={errors.title}
        />

        <LcarsInput
          label="Author"
          value={campaign.author}
          onChange={(e) => handleChange("author", e.target.value)}
          error={errors.author}
        />

        <LcarsInput
          label="Version"
          value={campaign.version}
          onChange={(e) => handleChange("version", e.target.value)}
          error={errors.version}
          placeholder="1.0"
        />
      </div>

      <LcarsTextarea
        label="Campaign Description"
        value={campaign.description}
        onChange={(e) => handleChange("description", e.target.value)}
        rows={4}
        error={errors.description}
      />

      <div className="bg-lcars-black/50 border-2 border-lcars-blue rounded-lg p-4 mt-6">
        <h3 className="text-lcars-blue font-bold mb-2">Campaign Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-lcars-text text-sm font-bold">Title:</p>
            <p className="text-lcars-blue">{campaign.title || "Untitled Campaign"}</p>
          </div>
          <div>
            <p className="text-lcars-text text-sm font-bold">Author:</p>
            <p className="text-lcars-purple">{campaign.author || "Unknown"}</p>
          </div>
          <div>
            <p className="text-lcars-text text-sm font-bold">Version:</p>
            <p className="text-lcars-gold">{campaign.version || "1.0"}</p>
          </div>
          <div>
            <p className="text-lcars-text text-sm font-bold">Episodes:</p>
            <p className="text-lcars-teal">{campaign.episodes.length}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-lcars-text text-sm font-bold">Description:</p>
          <p className="text-lcars-text">{campaign.description || "No description provided."}</p>
        </div>
      </div>
    </div>
  )
}
