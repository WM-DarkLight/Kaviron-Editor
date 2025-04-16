import type { Episode, Campaign, Snapshot } from "@/types/schema"

const DB_NAME = "lcarsInteractiveFiction"
const DB_VERSION = 1

// Store names
const EPISODES_STORE = "episodes"
const CAMPAIGNS_STORE = "campaigns"
const SNAPSHOTS_STORE = "snapshots"
const SETTINGS_STORE = "settings"

// Check if IndexedDB is supported
export function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window
}

// Initialize database
export async function initializeDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    throw new Error("IndexedDB is not supported in this browser")
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("Database error:", (event.target as IDBRequest).error)
        reject(new Error(`Database error: ${(event.target as IDBRequest).error?.message || "Unknown error"}`))
      }

      request.onblocked = (event) => {
        console.warn("Database blocked:", event)
        reject(new Error("Database blocked. Please close other tabs with this application open."))
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Set up error handler for the database
        db.onerror = (event) => {
          console.error("Database error:", (event.target as IDBRequest).error)
        }

        resolve(db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create episodes store
        if (!db.objectStoreNames.contains(EPISODES_STORE)) {
          const episodesStore = db.createObjectStore(EPISODES_STORE, { keyPath: "id" })
          episodesStore.createIndex("title", "title", { unique: false })
          episodesStore.createIndex("author", "author", { unique: false })
          episodesStore.createIndex("lastModified", "lastModified", { unique: false })
        }

        // Create campaigns store
        if (!db.objectStoreNames.contains(CAMPAIGNS_STORE)) {
          const campaignsStore = db.createObjectStore(CAMPAIGNS_STORE, { keyPath: "id" })
          campaignsStore.createIndex("title", "title", { unique: false })
        }

        // Create snapshots store
        if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
          const snapshotsStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: "id" })
          snapshotsStore.createIndex("episodeId", "episodeId", { unique: false })
          snapshotsStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: "id" })
        }
      }
    } catch (error) {
      console.error("Database initialization error:", error)
      reject(new Error(`Failed to initialize database: ${(error as Error).message}`))
    }
  })
}

// Check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!isIndexedDBSupported()) {
      console.error("IndexedDB is not supported")
      return false
    }

    // Try to open the database
    const db = await new Promise<IDBDatabase | null>((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onsuccess = (event) => {
          resolve((event.target as IDBOpenDBRequest).result)
        }

        request.onerror = (event) => {
          console.error("Database open error:", (event.target as IDBRequest).error)
          resolve(null)
        }

        request.onblocked = () => {
          console.error("Database blocked")
          resolve(null)
        }
      } catch (error) {
        console.error("Error in open request:", error)
        reject(error)
      }
    })

    if (!db) {
      return false
    }

    // Try a simple transaction to verify connection
    return new Promise<boolean>((resolve) => {
      try {
        const transaction = db.transaction(SETTINGS_STORE, "readwrite")
        const store = transaction.objectStore(SETTINGS_STORE)

        // Store a test value
        const testData = { id: "connection-test", timestamp: Date.now() }
        const request = store.put(testData)

        request.onsuccess = () => {
          resolve(true)
        }

        request.onerror = () => {
          console.error("Database connection test failed:", request.error)
          resolve(false)
        }

        transaction.onerror = () => {
          console.error("Database transaction error:", transaction.error)
          resolve(false)
        }
      } catch (error) {
        console.error("Error in transaction:", error)
        resolve(false)
      }
    })
  } catch (error) {
    console.error("Database connection check failed:", error)
    return false
  }
}

// Helper function to get database instance
async function getDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    throw new Error("IndexedDB is not supported in this browser")
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message || "Unknown error"}`))
      }

      request.onblocked = () => {
        reject(new Error("Database blocked. Please close other tabs with this application open."))
      }

      request.onsuccess = () => {
        const db = request.result

        // Set up error handler for the database
        db.onerror = (event) => {
          console.error("Database error:", (event.target as IDBRequest).error)
        }

        resolve(db)
      }
    } catch (error) {
      reject(new Error(`Failed to get database: ${(error as Error).message}`))
    }
  })
}

// Episode CRUD operations
export async function saveEpisode(episode: Episode): Promise<string> {
  if (!episode || !episode.id) {
    throw new Error("Invalid episode data: Missing ID")
  }

  try {
    validateEpisode(episode)
  } catch (error) {
    console.warn("Episode validation warning:", error)
    // Continue even with validation warnings
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([EPISODES_STORE, SNAPSHOTS_STORE], "readwrite")

      // Set up transaction error handler
      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const episodesStore = transaction.objectStore(EPISODES_STORE)
      const snapshotsStore = transaction.objectStore(SNAPSHOTS_STORE)

      // Add lastModified timestamp
      const episodeWithTimestamp = {
        ...episode,
        lastModified: new Date().toISOString(),
      }

      // Save the episode
      const request = episodesStore.put(episodeWithTimestamp)

      request.onsuccess = () => {
        // Create a snapshot
        const snapshotId = `${episode.id}-${Date.now()}`
        const snapshot: Snapshot = {
          id: snapshotId,
          episodeId: episode.id,
          data: JSON.stringify(episodeWithTimestamp),
          timestamp: new Date().toISOString(),
          type: "auto-save",
        }

        // Save the snapshot
        const snapshotRequest = snapshotsStore.add(snapshot)

        snapshotRequest.onsuccess = () => {
          // Clean up old snapshots (keep only the last 10)
          cleanupSnapshots(episode.id, snapshotsStore)
            .then(() => resolve(episode.id))
            .catch((error) => {
              console.warn("Snapshot cleanup warning:", error)
              // Still resolve even if cleanup fails
              resolve(episode.id)
            })
        }

        snapshotRequest.onerror = () => {
          console.warn("Snapshot creation warning:", snapshotRequest.error)
          // Still resolve even if snapshot creation fails
          resolve(episode.id)
        }
      }

      request.onerror = () => {
        reject(new Error(`Failed to save episode: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to save episode: ${(error as Error).message}`))
    }
  })
}

// Validate episode data
function validateEpisode(episode: Episode): void {
  if (!episode.title || episode.title.trim() === "") {
    throw new Error("Episode title is required")
  }

  if (!episode.scenes || Object.keys(episode.scenes).length === 0) {
    throw new Error("Episode must have at least one scene")
  }

  if (!episode.scenes.start) {
    throw new Error("Episode must have a 'start' scene")
  }

  // Validate each scene
  Object.entries(episode.scenes).forEach(([sceneId, scene]) => {
    if (!scene.id || scene.id.trim() === "") {
      throw new Error(`Scene ID is required for scene '${sceneId}'`)
    }

    if (!scene.title || scene.title.trim() === "") {
      throw new Error(`Scene title is required for scene '${sceneId}'`)
    }

    if (!Array.isArray(scene.text)) {
      throw new Error(`Scene text must be an array for scene '${sceneId}'`)
    }

    if (!Array.isArray(scene.choices)) {
      throw new Error(`Scene choices must be an array for scene '${sceneId}'`)
    }

    // Validate each choice
    scene.choices.forEach((choice, index) => {
      if (!choice.text || choice.text.trim() === "") {
        throw new Error(`Choice text is required for choice ${index} in scene '${sceneId}'`)
      }

      if (!choice.nextScene || choice.nextScene.trim() === "") {
        throw new Error(`Next scene is required for choice ${index} in scene '${sceneId}'`)
      }
    })
  })
}

async function cleanupSnapshots(episodeId: string, snapshotsStore: IDBObjectStore): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const index = snapshotsStore.index("episodeId")
      const request = index.openCursor(IDBKeyRange.only(episodeId))

      const snapshots: { id: string; timestamp: string; type: string }[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          snapshots.push({
            id: cursor.value.id,
            timestamp: cursor.value.timestamp,
            type: cursor.value.type || "auto-save",
          })
          cursor.continue()
        } else {
          try {
            // Sort snapshots by timestamp (newest first)
            snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

            // Group snapshots by type
            const autoSaves = snapshots.filter((s) => s.type === "auto-save")
            const manualSaves = snapshots.filter((s) => s.type === "manual-save")

            // Keep the last 10 auto-saves and all manual saves
            if (autoSaves.length > 10) {
              const toDelete = autoSaves.slice(10)
              toDelete.forEach((snapshot) => {
                snapshotsStore.delete(snapshot.id)
              })
            }

            resolve()
          } catch (error) {
            reject(error)
          }
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    } catch (error) {
      reject(error)
    }
  })
}

export async function createManualSnapshot(episodeId: string): Promise<string> {
  if (!episodeId) {
    throw new Error("Episode ID is required")
  }

  const episode = await getEpisode(episodeId)
  if (!episode) {
    throw new Error("Episode not found")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite")
      const snapshotsStore = transaction.objectStore(SNAPSHOTS_STORE)

      // Create a snapshot
      const snapshotId = `${episodeId}-manual-${Date.now()}`
      const snapshot: Snapshot = {
        id: snapshotId,
        episodeId: episodeId,
        data: JSON.stringify(episode),
        timestamp: new Date().toISOString(),
        type: "manual-save",
      }

      // Save the snapshot
      const request = snapshotsStore.add(snapshot)

      request.onsuccess = () => {
        resolve(snapshotId)
      }

      request.onerror = () => {
        reject(request.error)
      }
    } catch (error) {
      reject(new Error(`Failed to create manual snapshot: ${(error as Error).message}`))
    }
  })
}

export async function getEpisode(id: string): Promise<Episode | null> {
  if (!id) {
    throw new Error("Episode ID is required")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(EPISODES_STORE, "readonly")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(EPISODES_STORE)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(new Error(`Failed to get episode: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to get episode: ${(error as Error).message}`))
    }
  })
}

export async function getAllEpisodes(): Promise<Episode[]> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(EPISODES_STORE, "readonly")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(EPISODES_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(new Error(`Failed to get episodes: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to get episodes: ${(error as Error).message}`))
    }
  })
}

export async function deleteEpisode(id: string): Promise<void> {
  if (!id) {
    throw new Error("Episode ID is required")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([EPISODES_STORE, SNAPSHOTS_STORE], "readwrite")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const episodesStore = transaction.objectStore(EPISODES_STORE)
      const snapshotsStore = transaction.objectStore(SNAPSHOTS_STORE)

      // Delete the episode
      const request = episodesStore.delete(id)

      request.onsuccess = () => {
        // Delete all snapshots for this episode
        const index = snapshotsStore.index("episodeId")
        const snapshotsRequest = index.openCursor(IDBKeyRange.only(id))

        snapshotsRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            snapshotsStore.delete(cursor.value.id)
            cursor.continue()
          } else {
            resolve()
          }
        }

        snapshotsRequest.onerror = () => {
          // Still resolve even if snapshot deletion fails
          console.warn("Failed to delete some snapshots:", snapshotsRequest.error)
          resolve()
        }
      }

      request.onerror = () => {
        reject(new Error(`Failed to delete episode: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to delete episode: ${(error as Error).message}`))
    }
  })
}

// Campaign CRUD operations
export async function saveCampaign(campaign: Campaign): Promise<string> {
  if (!campaign || !campaign.id) {
    throw new Error("Invalid campaign data: Missing ID")
  }

  try {
    validateCampaign(campaign)
  } catch (error) {
    console.warn("Campaign validation warning:", error)
    // Continue even with validation warnings
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CAMPAIGNS_STORE, "readwrite")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(CAMPAIGNS_STORE)

      // Add lastModified timestamp
      const campaignWithTimestamp = {
        ...campaign,
        lastModified: new Date().toISOString(),
      }

      const request = store.put(campaignWithTimestamp)

      request.onsuccess = () => {
        resolve(campaign.id)
      }

      request.onerror = () => {
        reject(new Error(`Failed to save campaign: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to save campaign: ${(error as Error).message}`))
    }
  })
}

// Validate campaign data
function validateCampaign(campaign: Campaign): void {
  if (!campaign.title || campaign.title.trim() === "") {
    throw new Error("Campaign title is required")
  }

  if (!campaign.author || campaign.author.trim() === "") {
    throw new Error("Campaign author is required")
  }

  if (!campaign.description || campaign.description.trim() === "") {
    throw new Error("Campaign description is required")
  }

  if (!Array.isArray(campaign.episodes) || campaign.episodes.length === 0) {
    throw new Error("Campaign must have at least one episode")
  }

  // Validate each episode
  campaign.episodes.forEach((episode, index) => {
    if (!episode.title || episode.title.trim() === "") {
      throw new Error(`Episode title is required for episode ${index}`)
    }

    if (!episode.description || episode.description.trim() === "") {
      throw new Error(`Episode description is required for episode ${index}`)
    }

    if (typeof episode.order !== "number") {
      throw new Error(`Episode order must be a number for episode ${index}`)
    }
  })
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!id) {
    throw new Error("Campaign ID is required")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CAMPAIGNS_STORE, "readonly")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(CAMPAIGNS_STORE)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(new Error(`Failed to get campaign: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to get campaign: ${(error as Error).message}`))
    }
  })
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CAMPAIGNS_STORE, "readonly")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(CAMPAIGNS_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(new Error(`Failed to get campaigns: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to get campaigns: ${(error as Error).message}`))
    }
  })
}

export async function deleteCampaign(id: string): Promise<void> {
  if (!id) {
    throw new Error("Campaign ID is required")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(CAMPAIGNS_STORE, "readwrite")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(CAMPAIGNS_STORE)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error(`Failed to delete campaign: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to delete campaign: ${(error as Error).message}`))
    }
  })
}

// Import/Export functions
export async function importEpisodeFromJSON(jsonString: string): Promise<string> {
  try {
    const episode = JSON.parse(jsonString) as Episode

    // Validate the episode structure
    validateEpisode(episode)

    return await saveEpisode(episode)
  } catch (error) {
    console.error("Import error:", error)
    throw new Error("Failed to import episode: " + (error as Error).message)
  }
}

export async function importCampaignFromJSON(jsonString: string): Promise<string> {
  try {
    const campaign = JSON.parse(jsonString) as Campaign

    // Validate the campaign structure
    validateCampaign(campaign)

    return await saveCampaign(campaign)
  } catch (error) {
    console.error("Import error:", error)
    throw new Error("Failed to import campaign: " + (error as Error).message)
  }
}

export async function exportEpisodeToJSON(id: string): Promise<string> {
  if (!id) {
    throw new Error("Episode ID is required")
  }

  const episode = await getEpisode(id)
  if (!episode) {
    throw new Error("Episode not found")
  }

  // Remove internal fields for export
  const { lastModified, ...exportEpisode } = episode

  return JSON.stringify(exportEpisode, null, 2)
}

export async function exportCampaignToJSON(id: string): Promise<string> {
  if (!id) {
    throw new Error("Campaign ID is required")
  }

  const campaign = await getCampaign(id)
  if (!campaign) {
    throw new Error("Campaign not found")
  }

  // Remove internal fields for export
  const { lastModified, ...exportCampaign } = campaign

  return JSON.stringify(exportCampaign, null, 2)
}

// Recovery functions
export async function getEpisodeSnapshots(
  episodeId: string,
): Promise<{ id: string; timestamp: string; type: string }[]> {
  if (!episodeId) {
    throw new Error("Episode ID is required")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(SNAPSHOTS_STORE, "readonly")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const store = transaction.objectStore(SNAPSHOTS_STORE)
      const index = store.index("episodeId")
      const request = index.getAll(IDBKeyRange.only(episodeId))

      request.onsuccess = () => {
        const snapshots = request.result.map((snapshot) => ({
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          type: snapshot.type || "auto-save",
        }))

        // Sort by timestamp (newest first)
        snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        resolve(snapshots)
      }

      request.onerror = () => {
        reject(new Error(`Failed to get snapshots: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to get snapshots: ${(error as Error).message}`))
    }
  })
}

export async function restoreEpisodeFromSnapshot(snapshotId: string): Promise<string> {
  if (!snapshotId) {
    throw new Error("Snapshot ID is required")
  }

  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([SNAPSHOTS_STORE, EPISODES_STORE], "readwrite")

      transaction.onerror = () => {
        reject(new Error(`Transaction error: ${transaction.error?.message || "Unknown error"}`))
      }

      const snapshotsStore = transaction.objectStore(SNAPSHOTS_STORE)
      const episodesStore = transaction.objectStore(EPISODES_STORE)

      const request = snapshotsStore.get(snapshotId)

      request.onsuccess = () => {
        if (!request.result) {
          reject(new Error("Snapshot not found"))
          return
        }

        try {
          const episode = JSON.parse(request.result.data) as Episode

          // Add restoration note
          episode.lastModified = new Date().toISOString()

          const saveRequest = episodesStore.put(episode)

          saveRequest.onsuccess = () => {
            resolve(episode.id)
          }

          saveRequest.onerror = () => {
            reject(new Error(`Failed to restore episode: ${saveRequest.error?.message || "Unknown error"}`))
          }
        } catch (error) {
          reject(new Error("Failed to parse snapshot data"))
        }
      }

      request.onerror = () => {
        reject(new Error(`Failed to get snapshot: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to restore episode from snapshot: ${(error as Error).message}`))
    }
  })
}

// Database backup and restore
export async function backupAllData(): Promise<string> {
  try {
    const [episodes, campaigns] = await Promise.all([getAllEpisodes(), getAllCampaigns()])

    const backup = {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      episodes,
      campaigns,
    }

    return JSON.stringify(backup, null, 2)
  } catch (error) {
    console.error("Backup error:", error)
    throw new Error("Failed to backup data: " + (error as Error).message)
  }
}

export async function restoreFromBackup(backupJson: string): Promise<void> {
  try {
    const backup = JSON.parse(backupJson)

    // Validate backup format
    if (!backup.episodes || !backup.campaigns) {
      throw new Error("Invalid backup format")
    }

    // Restore episodes
    for (const episode of backup.episodes) {
      await saveEpisode(episode)
    }

    // Restore campaigns
    for (const campaign of backup.campaigns) {
      await saveCampaign(campaign)
    }
  } catch (error) {
    console.error("Restore error:", error)
    throw new Error("Failed to restore from backup: " + (error as Error).message)
  }
}

// Settings management
export async function saveSettings(settings: Record<string, any>): Promise<void> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(SETTINGS_STORE, "readwrite")
      const store = transaction.objectStore(SETTINGS_STORE)

      const settingsWithTimestamp = {
        id: "app-settings",
        ...settings,
        lastModified: new Date().toISOString(),
      }

      const request = store.put(settingsWithTimestamp)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error(`Failed to save settings: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to save settings: ${(error as Error).message}`))
    }
  })
}

export async function getSettings(): Promise<Record<string, any>> {
  const db = await getDatabase()
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(SETTINGS_STORE, "readonly")
      const store = transaction.objectStore(SETTINGS_STORE)

      const request = store.get("app-settings")

      request.onsuccess = () => {
        resolve(request.result || {})
      }

      request.onerror = () => {
        reject(new Error(`Failed to get settings: ${request.error?.message || "Unknown error"}`))
      }
    } catch (error) {
      reject(new Error(`Failed to get settings: ${(error as Error).message}`))
    }
  })
}
