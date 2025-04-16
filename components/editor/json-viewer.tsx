"use client"

import { useState } from "react"
import { LcarsButton } from "@/components/lcars/lcars-button"
import type { Episode, Campaign } from "@/types/schema"
import { Copy, Check, Download } from "lucide-react"

interface JsonViewerProps {
  episode?: Episode
  campaign?: Campaign
  onExport?: () => void
  isExporting?: boolean
}

export function JsonViewer({ episode, campaign, onExport, isExporting = false }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)
  const [format, setFormat] = useState<"pretty" | "minified" | "raw">("pretty")

  const data = episode || campaign

  if (!data) {
    return <div className="text-lcars-text">No data available for JSON view</div>
  }

  const getFormattedJson = () => {
    switch (format) {
      case "pretty":
        return JSON.stringify(data, null, 2)
      case "minified":
        return JSON.stringify(data)
      case "raw":
        // Remove internal fields for export
        const { lastModified, ...exportData } = data
        return JSON.stringify(exportData, null, 2)
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getFormattedJson())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const json = getFormattedJson()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <LcarsButton
            size="sm"
            variant={format === "pretty" ? "primary" : "tertiary"}
            onClick={() => setFormat("pretty")}
          >
            PRETTY
          </LcarsButton>
          <LcarsButton
            size="sm"
            variant={format === "minified" ? "primary" : "tertiary"}
            onClick={() => setFormat("minified")}
          >
            MINIFIED
          </LcarsButton>
          <LcarsButton size="sm" variant={format === "raw" ? "primary" : "tertiary"} onClick={() => setFormat("raw")}>
            RAW
          </LcarsButton>
        </div>
        <div className="flex space-x-2">
          <LcarsButton
            size="sm"
            variant="secondary"
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "COPIED" : "COPY"}
          </LcarsButton>
          <LcarsButton size="sm" variant="secondary" onClick={handleDownload} className="flex items-center gap-1">
            <Download size={14} />
            DOWNLOAD
          </LcarsButton>
          {onExport && (
            <LcarsButton
              size="sm"
              variant="primary"
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <Download size={14} />
              {isExporting ? "EXPORTING..." : "EXPORT"}
            </LcarsButton>
          )}
        </div>
      </div>

      <div className="border-2 border-lcars-blue rounded-lg p-4 bg-lcars-black/50">
        <pre className="text-lcars-text text-sm overflow-auto h-[calc(100vh-350px)]">{getFormattedJson()}</pre>
      </div>

      <div className="text-sm text-lcars-text/70">
        <p>
          This is a read-only view of your {episode ? "episode" : "campaign"} in JSON format. You can copy it to the
          clipboard or download it as a file.
        </p>
        <p className="mt-2">
          <span className="text-lcars-orange font-bold">Pretty:</span> Formatted JSON with indentation
          <br />
          <span className="text-lcars-orange font-bold">Minified:</span> Compact JSON without whitespace
          <br />
          <span className="text-lcars-orange font-bold">Raw:</span> Export-ready JSON without internal fields
        </p>
      </div>
    </div>
  )
}
