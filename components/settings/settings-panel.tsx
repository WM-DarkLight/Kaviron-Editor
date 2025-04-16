"use client"

import { useState, useEffect } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { LcarsInput } from "@/components/lcars/lcars-input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { saveSettings, getSettings } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

interface SettingsPanelProps {
  onBack: () => void
  debugMode: boolean
  onToggleDebugMode: () => void
}

export function SettingsPanel({ onBack, debugMode, onToggleDebugMode }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    authorName: "",
    defaultShipName: "USS Enterprise NCC-1701",
    autoSaveInterval: 10,
    darkMode: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await getSettings()
        if (Object.keys(savedSettings).length > 0) {
          setSettings({
            ...settings,
            ...savedSettings,
          })
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings. Using defaults.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings(settings)
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearLocalStorage = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all local storage? This will delete all settings but not your episodes or campaigns.",
      )
    ) {
      try {
        localStorage.clear()
        toast({
          title: "Local storage cleared",
          description: "All local storage has been cleared successfully.",
        })
      } catch (error) {
        console.error("Failed to clear local storage:", error)
        toast({
          title: "Error",
          description: "Failed to clear local storage. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lcars-orange text-xl">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lcars-orange text-2xl font-bold">Settings</h2>
        <div className="flex space-x-2">
          <LcarsButton onClick={onBack} variant="tertiary" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            BACK
          </LcarsButton>
          <LcarsButton onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save size={16} />
            {isSaving ? "SAVING..." : "SAVE SETTINGS"}
          </LcarsButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LcarsPanel title="USER PREFERENCES" color="blue">
          <div className="space-y-6">
            <LcarsInput
              label="Default Author Name"
              value={settings.authorName}
              onChange={(e) => setSettings({ ...settings, authorName: e.target.value })}
              placeholder="Enter your name"
            />

            <LcarsInput
              label="Default Ship Name"
              value={settings.defaultShipName}
              onChange={(e) => setSettings({ ...settings, defaultShipName: e.target.value })}
              placeholder="USS Enterprise NCC-1701"
            />

            <div>
              <Label className="text-sm font-medium text-lcars-blue mb-2 block">Auto-Save Interval (seconds)</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={settings.autoSaveInterval}
                  onChange={(e) => setSettings({ ...settings, autoSaveInterval: Number.parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-lcars-text w-8 text-center">{settings.autoSaveInterval}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
              />
              <Label htmlFor="dark-mode" className="text-lcars-text">
                Dark Mode
              </Label>
            </div>
          </div>
        </LcarsPanel>

        <div className="space-y-6">
          <LcarsPanel title="ADVANCED SETTINGS" color="purple">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lcars-purple font-bold">Debug Mode</h3>
                  <p className="text-sm text-lcars-text/70">Enable advanced debugging features</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="debug-mode" checked={debugMode} onCheckedChange={onToggleDebugMode} />
                  <Label htmlFor="debug-mode" className="text-lcars-text">
                    {debugMode ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </div>

              <div className="pt-4 border-t border-lcars-purple/30">
                <h3 className="text-lcars-red font-bold mb-2">Danger Zone</h3>
                <p className="text-sm text-lcars-text/70 mb-4">
                  These actions can cause data loss and cannot be undone.
                </p>
                <LcarsButton
                  variant="danger"
                  onClick={handleClearLocalStorage}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  CLEAR LOCAL STORAGE
                </LcarsButton>
              </div>
            </div>
          </LcarsPanel>

          <LcarsPanel title="ABOUT" color="gold">
            <div className="space-y-4">
              <div>
                <h3 className="text-lcars-gold font-bold">LCARS Fiction Editor</h3>
                <p className="text-sm text-lcars-text/70">Version 1.0.0</p>
              </div>
              <p className="text-lcars-text text-sm">
                An offline application for creating interactive fiction in JSON format, styled after Star Trek's LCARS
                interface.
              </p>
              <p className="text-lcars-text text-sm">All data is stored locally in your browser using IndexedDB.</p>
              <div className="pt-4 border-t border-lcars-gold/30">
                <p className="text-xs text-lcars-text/70">
                  LCARS and Star Trek are trademarks of CBS Studios Inc. This is a fan project and is not affiliated
                  with CBS Studios.
                </p>
              </div>
            </div>
          </LcarsPanel>
        </div>
      </div>
    </div>
  )
}
