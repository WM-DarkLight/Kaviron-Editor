"use client"

import { useState, useEffect } from "react"
import { LcarsPanel } from "@/components/lcars/lcars-panel"
import { LcarsButton } from "@/components/lcars/lcars-button"
import { LcarsTextarea } from "@/components/lcars/lcars-textarea"
import { isIndexedDBSupported, checkDatabaseConnection } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, RefreshCw, Download, Database } from "lucide-react"

interface DebugPanelProps {
  onBack: () => void
}

export function DebugPanel({ onBack }: DebugPanelProps) {
  const [dbStatus, setDbStatus] = useState<"checking" | "available" | "unavailable">("checking")
  const [dbInfo, setDbInfo] = useState<Record<string, any>>({})
  const [browserInfo, setBrowserInfo] = useState<Record<string, any>>({})
  const [storageInfo, setStorageInfo] = useState<Record<string, any>>({})
  const [logMessages, setLogMessages] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Check database status
    const checkDb = async () => {
      try {
        const isSupported = isIndexedDBSupported()
        if (!isSupported) {
          setDbStatus("unavailable")
          addLog("IndexedDB is not supported in this browser")
          return
        }

        const isConnected = await checkDatabaseConnection()
        setDbStatus(isConnected ? "available" : "unavailable")
        addLog(`Database connection test: ${isConnected ? "Successful" : "Failed"}`)

        // Get database info
        const dbInfo = {
          name: "lcarsInteractiveFiction",
          version: 1,
          stores: ["episodes", "campaigns", "snapshots", "settings"],
          supported: isSupported,
          connected: isConnected,
        }
        setDbInfo(dbInfo)
      } catch (error) {
        console.error("Database check error:", error)
        setDbStatus("unavailable")
        addLog(`Database error: ${(error as Error).message}`)
      }
    }

    // Get browser info
    const getBrowserInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        doNotTrack: navigator.doNotTrack,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio,
        localStorage: typeof localStorage !== "undefined",
        sessionStorage: typeof sessionStorage !== "undefined",
        indexedDB: typeof indexedDB !== "undefined",
      }
      setBrowserInfo(info)
    }

    // Get storage info
    const getStorageInfo = () => {
      try {
        const info: Record<string, any> = {}

        // Check localStorage
        try {
          const testKey = "lcars_test"
          localStorage.setItem(testKey, "test")
          localStorage.removeItem(testKey)
          info.localStorage = "Available"
        } catch (e) {
          info.localStorage = `Error: ${(e as Error).message}`
        }

        // Check sessionStorage
        try {
          const testKey = "lcars_test"
          sessionStorage.setItem(testKey, "test")
          sessionStorage.removeItem(testKey)
          info.sessionStorage = "Available"
        } catch (e) {
          info.sessionStorage = `Error: ${(e as Error).message}`
        }

        // Estimate storage usage
        try {
          let totalSize = 0
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || ""
            const value = localStorage.getItem(key) || ""
            totalSize += key.length + value.length
          }
          info.localStorageUsage = `${Math.round(totalSize / 1024)} KB`
        } catch (e) {
          info.localStorageUsage = `Error: ${(e as Error).message}`
        }

        setStorageInfo(info)
      } catch (error) {
        console.error("Storage info error:", error)
        setStorageInfo({ error: (error as Error).message })
      }
    }

    checkDb()
    getBrowserInfo()
    getStorageInfo()

    // Override console methods to capture logs
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    console.log = (...args) => {
      addLog(`LOG: ${args.map((arg) => formatArg(arg)).join(" ")}`)
      originalConsoleLog.apply(console, args)
    }

    console.error = (...args) => {
      addLog(`ERROR: ${args.map((arg) => formatArg(arg)).join(" ")}`)
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args) => {
      addLog(`WARN: ${args.map((arg) => formatArg(arg)).join(" ")}`)
      originalConsoleWarn.apply(console, args)
    }

    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }, [])

  const formatArg = (arg: any): string => {
    if (arg === null) return "null"
    if (arg === undefined) return "undefined"
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg)
      } catch (e) {
        return Object.prototype.toString.call(arg)
      }
    }
    return String(arg)
  }

  const addLog = (message: string) => {
    setLogMessages((prev) => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  const handleRefreshStatus = async () => {
    setDbStatus("checking")
    addLog("Refreshing database status...")

    try {
      const isSupported = isIndexedDBSupported()
      if (!isSupported) {
        setDbStatus("unavailable")
        addLog("IndexedDB is not supported in this browser")
        return
      }

      const isConnected = await checkDatabaseConnection()
      setDbStatus(isConnected ? "available" : "unavailable")
      addLog(`Database connection test: ${isConnected ? "Successful" : "Failed"}`)

      toast({
        title: isConnected ? "Database Available" : "Database Unavailable",
        description: isConnected ? "Connection to IndexedDB successful" : "Failed to connect to IndexedDB",
        variant: isConnected ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Database check error:", error)
      setDbStatus("unavailable")
      addLog(`Database error: ${(error as Error).message}`)

      toast({
        title: "Database Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleDownloadLogs = () => {
    try {
      const logContent = logMessages.join("\n")
      const blob = new Blob([logContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lcars-debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Logs Downloaded",
        description: "Debug logs have been downloaded successfully",
      })
    } catch (error) {
      console.error("Download logs error:", error)
      toast({
        title: "Download Failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lcars-red text-2xl font-bold">Debug Panel</h2>
        <div className="flex space-x-2">
          <LcarsButton onClick={handleRefreshStatus} variant="secondary" className="flex items-center gap-2">
            <RefreshCw size={16} />
            REFRESH STATUS
          </LcarsButton>
          <LcarsButton onClick={onBack} variant="tertiary" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            BACK
          </LcarsButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LcarsPanel title="DATABASE STATUS" color="red">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-4 h-4 rounded-full ${
                  dbStatus === "checking"
                    ? "bg-lcars-gold"
                    : dbStatus === "available"
                      ? "bg-lcars-blue"
                      : "bg-lcars-red"
                }`}
              ></div>
              <span className="text-lcars-text font-bold">
                {dbStatus === "checking"
                  ? "Checking..."
                  : dbStatus === "available"
                    ? "Database Available"
                    : "Database Unavailable"}
              </span>
            </div>

            <div className="bg-lcars-black/50 p-3 rounded-lg">
              <h3 className="text-lcars-blue font-bold mb-2">Database Information</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(dbInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-lcars-text/70">{key}:</span>
                    <span className="text-lcars-text">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <LcarsButton
                onClick={() => window.location.reload()}
                variant="danger"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                RELOAD APPLICATION
              </LcarsButton>
            </div>
          </div>
        </LcarsPanel>

        <LcarsPanel title="BROWSER INFORMATION" color="blue">
          <div className="space-y-4">
            <div className="bg-lcars-black/50 p-3 rounded-lg max-h-60 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {Object.entries(browserInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-lcars-text/70">{key}:</span>
                    <span className="text-lcars-text">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-lcars-black/50 p-3 rounded-lg">
              <h3 className="text-lcars-blue font-bold mb-2">Storage Information</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(storageInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-lcars-text/70">{key}:</span>
                    <span className="text-lcars-text">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LcarsPanel>
      </div>

      <LcarsPanel title="DEBUG LOGS" color="purple">
        <div className="space-y-4">
          <LcarsTextarea value={logMessages.join("\n")} readOnly rows={10} className="font-mono text-xs" />

          <div className="flex justify-end">
            <LcarsButton onClick={handleDownloadLogs} variant="secondary" className="flex items-center gap-2">
              <Download size={16} />
              DOWNLOAD LOGS
            </LcarsButton>
          </div>
        </div>
      </LcarsPanel>

      <LcarsPanel title="DATABASE TOOLS" color="gold">
        <div className="space-y-4">
          <p className="text-lcars-text">
            Use these tools to help diagnose and fix database issues. These operations can affect your data.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LcarsButton
              variant="secondary"
              className="flex items-center justify-center gap-2"
              onClick={() => {
                addLog("Manual database connection test initiated")
                handleRefreshStatus()
              }}
            >
              <Database size={16} />
              TEST DATABASE CONNECTION
            </LcarsButton>

            <LcarsButton
              variant="tertiary"
              className="flex items-center justify-center gap-2"
              onClick={() => {
                try {
                  indexedDB.deleteDatabase("lcarsInteractiveFiction")
                  addLog("Database deletion requested")
                  toast({
                    title: "Database Deletion Requested",
                    description: "Reload the application to complete the process",
                  })
                } catch (error) {
                  console.error("Database deletion error:", error)
                  addLog(`Database deletion error: ${(error as Error).message}`)
                  toast({
                    title: "Database Deletion Failed",
                    description: (error as Error).message,
                    variant: "destructive",
                  })
                }
              }}
            >
              <Database size={16} />
              RESET DATABASE
            </LcarsButton>
          </div>
        </div>
      </LcarsPanel>
    </div>
  )
}
