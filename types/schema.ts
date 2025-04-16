// Episode schema
export interface Episode extends EpisodeTemplate {
  lastModified?: string
}

export interface EpisodeTemplate {
  id: string
  title: string
  author: string
  description: string
  stardate: string
  shipName: string
  scenes: Record<string, Scene>
}

export interface Scene {
  id: string
  title: string
  text: string[]
  choices: Choice[]
}

export interface Choice {
  text: string
  nextScene: string
}

// Campaign schema
export interface Campaign {
  id: string
  title: string
  author: string
  description: string
  version: string
  episodes: CampaignEpisode[]
  lastModified?: string
}

export interface CampaignEpisode {
  episodeId: string
  title: string
  description: string
  order: number
  condition?: {
    previousEpisodeId?: string
    flags?: Record<string, boolean>
  }
  initialState?: {
    flags?: Record<string, boolean>
  }
}

// Snapshot schema
export interface Snapshot {
  id: string
  episodeId: string
  data: string // JSON string of the episode
  timestamp: string
  type: "auto-save" | "manual-save"
}
