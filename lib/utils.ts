import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique ID
export function generateId(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

// Validate ship name (NCC-#### pattern)
export function validateShipName(name: string): boolean {
  return /^USS .+ NCC-\d{4}$/.test(name)
}

// Replace the splitIntoParagraphs function with this improved version
// Split text into paragraphs while preserving formatting
export function splitIntoParagraphs(text: string): string[] {
  if (!text) return []

  // Simply split by double newlines without trimming or filtering
  // This preserves spaces and single line breaks within paragraphs
  return text.split(/\n\n+/)
}

// Define Episode, Campaign, and Scene types
interface Episode {
  id: string
  title: string
  author: string
  description: string
  stardate: string
  shipName: string
  scenes: Record<string, Scene>
}

interface Campaign {
  id: string
  title: string
  author: string
  description: string
  version: string
  episodes: {
    episodeId: string
    title: string
    description: string
    order: number
  }[]
}

interface Scene {
  id: string
  title: string
  text: string[]
  choices: {
    text: string
    nextScene: string
  }[]
}

// Create a new episode template
export function createNewEpisodeTemplate(): Episode {
  const id = generateId("ep-")
  return {
    id,
    title: "New Episode",
    author: "Your Name",
    description: "A brief description of your episode.",
    stardate: "12345.6",
    shipName: "USS Enterprise NCC-1701",
    scenes: {
      start: {
        id: "start",
        title: "Starting Location",
        text: [
          "This is the first paragraph of your episode.",
          "This is the second paragraph. You can add as many as you need.",
        ],
        choices: [
          {
            text: "This is the first choice the player can make.",
            nextScene: "scene-two",
          },
        ],
      },
      "scene-two": {
        id: "scene-two",
        title: "Second Scene",
        text: ["This is the content of your second scene."],
        choices: [
          {
            text: "Go back to start",
            nextScene: "start",
          },
        ],
      },
    },
  }
}

// Create a new campaign template
export function createNewCampaignTemplate(): Campaign {
  const id = generateId("camp-")
  return {
    id,
    title: "New Campaign",
    author: "Your Name",
    description: "A brief description of your campaign.",
    version: "1.0",
    episodes: [
      {
        episodeId: "",
        title: "First Episode",
        description: "The first episode in your campaign.",
        order: 1,
      },
    ],
  }
}

// Check if a scene is reachable from the start scene
export function isSceneReachable(scenes: Record<string, Scene>, sceneId: string): boolean {
  if (sceneId === "start") return true

  const visited = new Set<string>()
  const queue: string[] = ["start"]

  while (queue.length > 0) {
    const currentSceneId = queue.shift()!

    if (visited.has(currentSceneId)) continue
    visited.add(currentSceneId)

    const currentScene = scenes[currentSceneId]
    if (!currentScene) continue

    for (const choice of currentScene.choices) {
      if (choice.nextScene === sceneId) return true
      if (!visited.has(choice.nextScene)) {
        queue.push(choice.nextScene)
      }
    }
  }

  return false
}

// Find broken links in scenes
export function findBrokenLinks(scenes: Record<string, Scene>): { sceneId: string; choiceIndex: number }[] {
  const brokenLinks: { sceneId: string; choiceIndex: number }[] = []

  Object.entries(scenes).forEach(([sceneId, scene]) => {
    scene.choices.forEach((choice, index) => {
      if (!scenes[choice.nextScene]) {
        brokenLinks.push({ sceneId, choiceIndex: index })
      }
    })
  })

  return brokenLinks
}

// Find unreachable scenes
export function findUnreachableScenes(scenes: Record<string, Scene>): string[] {
  return Object.keys(scenes).filter((sceneId) => !isSceneReachable(scenes, sceneId))
}

// Auto-save helper
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}
