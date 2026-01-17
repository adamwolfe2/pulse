export interface Action {
  id: string
  label: string
  icon?: string
  primary?: boolean
}

export interface ThumbnailConfig {
  type: "image" | "icon" | "map" | "avatar"
  url?: string
  icon?: string
}

export interface MetaItem {
  text: string
  icon?: string
}

export interface DetailConfig {
  title: string
  subtitle?: string
  description?: string
  meta?: MetaItem[]
  inlineAction?: Action
  sideAction?: Action
}

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  detail?: DetailConfig
  thumbnail?: ThumbnailConfig
  actions?: Action[]
  hint?: string
  timestamp: number
}

export type SuggestionType =
  | "music"
  | "memory"
  | "rideshare"
  | "contact"
  | "reminder"
  | "preference"
  | "belonging"
  | "general"

// Example suggestions matching the screenshots
export const EXAMPLE_SUGGESTIONS: Suggestion[] = [
  {
    id: "music-1",
    type: "music",
    title: "Would you mind if I play the perfect track for this view?",
    thumbnail: {
      type: "image",
      url: "/placeholder-album.jpg"
    },
    detail: {
      subtitle: "Aven",
      title: "Above the Clouds",
      description: "0:00",
      meta: [{ text: "3:12" }],
      sideAction: {
        id: "play",
        label: "Play",
        icon: "▶"
      }
    },
    hint: '"Play" to start',
    timestamp: Date.now()
  },
  {
    id: "memory-1",
    type: "memory",
    title: "Wait, don't throw it away!",
    detail: {
      subtitle: "5+ memories related",
      title: "Mrs. Rabbit - Tanya's old favorite"
    },
    timestamp: Date.now()
  },
  {
    id: "rideshare-1",
    type: "rideshare",
    title: "Call rideshare?",
    thumbnail: {
      type: "map"
    },
    detail: {
      title: "San Francisco int...",
      subtitle: "DoubleTree by Hilt...",
      description: "36 minutes",
      meta: [
        { text: "$57.49" },
        { text: "4", icon: "👤" }
      ]
    },
    hint: "Yes to action",
    timestamp: Date.now()
  },
  {
    id: "contact-1",
    type: "contact",
    title: "Should we call Theo?\nHe'll be here somewhere.",
    thumbnail: {
      type: "avatar",
      url: "/placeholder-avatar.jpg"
    },
    detail: {
      title: "Theo Kang",
      subtitle: "Mobile",
      description: "(465) 193-4002",
      sideAction: {
        id: "call",
        label: "Call",
        icon: "📞"
      }
    },
    hint: "Yes to action",
    timestamp: Date.now()
  }
]
