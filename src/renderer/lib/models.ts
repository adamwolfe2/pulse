// Multi-Model Support
// Configure and manage AI model options

export interface AIModel {
  id: string
  name: string
  provider: "anthropic" | "openai" | "local"
  description: string
  contextWindow: number
  maxOutput: number
  capabilities: ModelCapability[]
  costTier: "free" | "low" | "medium" | "high"
  speed: "fast" | "medium" | "slow"
  default?: boolean
}

export type ModelCapability =
  | "chat"
  | "vision"
  | "code"
  | "analysis"
  | "creative"
  | "reasoning"

// Available models
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "Best balance of intelligence and speed",
    contextWindow: 200000,
    maxOutput: 8192,
    capabilities: ["chat", "vision", "code", "analysis", "creative", "reasoning"],
    costTier: "medium",
    speed: "fast",
    default: true
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Previous generation, still excellent",
    contextWindow: 200000,
    maxOutput: 8192,
    capabilities: ["chat", "vision", "code", "analysis", "creative", "reasoning"],
    costTier: "medium",
    speed: "fast"
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    description: "Fastest and most affordable",
    contextWindow: 200000,
    maxOutput: 4096,
    capabilities: ["chat", "vision", "code"],
    costTier: "low",
    speed: "fast"
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "Most powerful for complex tasks",
    contextWindow: 200000,
    maxOutput: 4096,
    capabilities: ["chat", "vision", "code", "analysis", "creative", "reasoning"],
    costTier: "high",
    speed: "slow"
  }
]

// Get default model
export function getDefaultModel(): AIModel {
  return AVAILABLE_MODELS.find(m => m.default) || AVAILABLE_MODELS[0]
}

// Get model by ID
export function getModelById(id: string): AIModel | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id)
}

// Get models by provider
export function getModelsByProvider(provider: AIModel["provider"]): AIModel[] {
  return AVAILABLE_MODELS.filter(m => m.provider === provider)
}

// Get models by capability
export function getModelsByCapability(capability: ModelCapability): AIModel[] {
  return AVAILABLE_MODELS.filter(m => m.capabilities.includes(capability))
}

// Store selected model
const MODEL_STORAGE_KEY = "pulse_selected_model"

export function getStoredModelId(): string {
  try {
    return localStorage.getItem(MODEL_STORAGE_KEY) || getDefaultModel().id
  } catch {
    return getDefaultModel().id
  }
}

export function setStoredModelId(modelId: string): void {
  try {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId)
  } catch {
    // Ignore storage errors
  }
}

// Get human-readable cost tier
export function getCostTierLabel(tier: AIModel["costTier"]): string {
  switch (tier) {
    case "free": return "Free"
    case "low": return "$"
    case "medium": return "$$"
    case "high": return "$$$"
    default: return ""
  }
}

// Get human-readable speed label
export function getSpeedLabel(speed: AIModel["speed"]): string {
  switch (speed) {
    case "fast": return "Fast"
    case "medium": return "Medium"
    case "slow": return "Slower"
    default: return ""
  }
}

// Calculate rough token count for text
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4)
}

// Check if message fits in context window
export function fitsInContext(messages: { content: string }[], model: AIModel): boolean {
  const totalTokens = messages.reduce((sum, m) => sum + estimateTokenCount(m.content), 0)
  // Leave room for response
  return totalTokens < model.contextWindow - model.maxOutput
}
