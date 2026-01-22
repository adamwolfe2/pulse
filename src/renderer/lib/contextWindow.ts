// Context Window Management
// Handles token estimation and smart truncation to stay within API limits

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface ContextConfig {
  maxTokens: number
  reserveForResponse: number
  systemPromptTokens: number
}

// Approximate token counts for different models
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "claude-sonnet-4-20250514": 200000,
  "claude-3-5-sonnet-20241022": 200000,
  "claude-3-haiku-20240307": 200000,
  "claude-3-opus-20240229": 200000,
  "default": 100000
}

// Default configuration
const DEFAULT_CONFIG: ContextConfig = {
  maxTokens: 100000,
  reserveForResponse: 4096,
  systemPromptTokens: 1000
}

/**
 * Estimate token count for a string
 * Uses a simple heuristic: ~4 characters per token for English
 * This is an approximation - actual tokenization varies
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  // Count words and characters
  const words = text.split(/\s+/).filter(Boolean).length
  const chars = text.length

  // Heuristic: average of word-based and char-based estimates
  const wordBasedEstimate = words * 1.3 // ~1.3 tokens per word
  const charBasedEstimate = chars / 4 // ~4 chars per token

  return Math.ceil((wordBasedEstimate + charBasedEstimate) / 2)
}

/**
 * Estimate total tokens for a conversation
 */
export function estimateConversationTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    // Add overhead for message structure (~4 tokens per message)
    return total + estimateTokens(msg.content) + 4
  }, 0)
}

/**
 * Get context limit for a model
 */
export function getContextLimit(modelId: string): number {
  return MODEL_CONTEXT_LIMITS[modelId] || MODEL_CONTEXT_LIMITS.default
}

/**
 * Calculate available tokens for conversation
 */
export function getAvailableTokens(
  modelId: string,
  systemPrompt: string,
  reserveForResponse: number = DEFAULT_CONFIG.reserveForResponse
): number {
  const contextLimit = getContextLimit(modelId)
  const systemTokens = estimateTokens(systemPrompt)
  return contextLimit - systemTokens - reserveForResponse
}

/**
 * Truncation strategies
 */
export type TruncationStrategy =
  | "keep-recent"      // Keep most recent messages
  | "keep-first-last"  // Keep first message and recent messages
  | "summarize"        // Summarize older messages (requires API call)
  | "sliding-window"   // Keep last N messages

/**
 * Truncate messages to fit within token limit
 */
export function truncateMessages(
  messages: Message[],
  maxTokens: number,
  strategy: TruncationStrategy = "keep-recent"
): { messages: Message[]; truncated: boolean; removedCount: number } {
  const currentTokens = estimateConversationTokens(messages)

  if (currentTokens <= maxTokens) {
    return { messages, truncated: false, removedCount: 0 }
  }

  switch (strategy) {
    case "keep-recent":
      return truncateKeepRecent(messages, maxTokens)

    case "keep-first-last":
      return truncateKeepFirstLast(messages, maxTokens)

    case "sliding-window":
      return truncateSlidingWindow(messages, maxTokens, 20)

    case "summarize":
      // For now, fall back to keep-recent
      // Full summarization would require an API call
      return truncateKeepRecent(messages, maxTokens)

    default:
      return truncateKeepRecent(messages, maxTokens)
  }
}

/**
 * Keep most recent messages that fit
 */
function truncateKeepRecent(
  messages: Message[],
  maxTokens: number
): { messages: Message[]; truncated: boolean; removedCount: number } {
  const result: Message[] = []
  let totalTokens = 0
  let removedCount = 0

  // Process messages from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const msgTokens = estimateTokens(msg.content) + 4

    if (totalTokens + msgTokens <= maxTokens) {
      result.unshift(msg)
      totalTokens += msgTokens
    } else {
      removedCount++
    }
  }

  return {
    messages: result,
    truncated: removedCount > 0,
    removedCount
  }
}

/**
 * Keep first message (for context) and recent messages
 */
function truncateKeepFirstLast(
  messages: Message[],
  maxTokens: number
): { messages: Message[]; truncated: boolean; removedCount: number } {
  if (messages.length <= 2) {
    return { messages, truncated: false, removedCount: 0 }
  }

  const firstMessage = messages[0]
  const firstTokens = estimateTokens(firstMessage.content) + 4
  const remainingTokens = maxTokens - firstTokens

  // Get as many recent messages as we can fit
  const { messages: recentMessages, removedCount } = truncateKeepRecent(
    messages.slice(1),
    remainingTokens
  )

  // Add context marker if we truncated
  const result: Message[] = [firstMessage]

  if (removedCount > 0) {
    result.push({
      role: "system",
      content: `[${removedCount} earlier messages omitted for context length]`
    })
  }

  result.push(...recentMessages)

  return {
    messages: result,
    truncated: removedCount > 0,
    removedCount
  }
}

/**
 * Keep last N messages (sliding window)
 */
function truncateSlidingWindow(
  messages: Message[],
  maxTokens: number,
  windowSize: number
): { messages: Message[]; truncated: boolean; removedCount: number } {
  const windowed = messages.slice(-windowSize)
  const removedCount = messages.length - windowed.length

  // If windowed messages still exceed limit, truncate further
  if (estimateConversationTokens(windowed) > maxTokens) {
    const { messages: truncated, removedCount: additionalRemoved } =
      truncateKeepRecent(windowed, maxTokens)
    return {
      messages: truncated,
      truncated: true,
      removedCount: removedCount + additionalRemoved
    }
  }

  return {
    messages: windowed,
    truncated: removedCount > 0,
    removedCount
  }
}

/**
 * Create a summary of messages for context compression
 * This is a placeholder - real implementation would use the API
 */
export function createMessageSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === "user")
  const assistantMessages = messages.filter(m => m.role === "assistant")

  return `Previous conversation summary:
- User asked ${userMessages.length} questions
- Topics discussed: ${extractTopics(messages).join(", ") || "general conversation"}
- Last user message: "${userMessages[userMessages.length - 1]?.content.slice(0, 100)}..."`
}

/**
 * Extract topics from messages (simple keyword extraction)
 */
function extractTopics(messages: Message[]): string[] {
  const text = messages.map(m => m.content).join(" ").toLowerCase()
  const topics: string[] = []

  // Simple keyword detection
  const keywords = [
    { pattern: /\b(code|programming|function|variable|debug)\b/i, topic: "coding" },
    { pattern: /\b(write|writing|story|article|blog)\b/i, topic: "writing" },
    { pattern: /\b(explain|understand|learn|teach)\b/i, topic: "learning" },
    { pattern: /\b(help|assist|support)\b/i, topic: "assistance" },
    { pattern: /\b(create|build|make|design)\b/i, topic: "creation" },
    { pattern: /\b(analyze|research|data|study)\b/i, topic: "research" }
  ]

  for (const { pattern, topic } of keywords) {
    if (pattern.test(text) && !topics.includes(topic)) {
      topics.push(topic)
    }
  }

  return topics.slice(0, 3)
}

/**
 * Prepare messages for API call with context management
 */
export function prepareMessagesForAPI(
  messages: Message[],
  systemPrompt: string,
  modelId: string,
  options: {
    strategy?: TruncationStrategy
    reserveForResponse?: number
  } = {}
): {
  systemMessage: string
  messages: Message[]
  truncated: boolean
  originalCount: number
  finalCount: number
  estimatedTokens: number
} {
  const {
    strategy = "keep-first-last",
    reserveForResponse = DEFAULT_CONFIG.reserveForResponse
  } = options

  const availableTokens = getAvailableTokens(modelId, systemPrompt, reserveForResponse)
  const { messages: truncatedMessages, truncated, removedCount } = truncateMessages(
    messages,
    availableTokens,
    strategy
  )

  const estimatedTokens = estimateConversationTokens(truncatedMessages) +
    estimateTokens(systemPrompt)

  return {
    systemMessage: systemPrompt,
    messages: truncatedMessages,
    truncated,
    originalCount: messages.length,
    finalCount: truncatedMessages.length,
    estimatedTokens
  }
}

/**
 * Check if adding a message would exceed context limit
 */
export function wouldExceedLimit(
  currentMessages: Message[],
  newMessage: Message,
  modelId: string,
  systemPrompt: string
): boolean {
  const allMessages = [...currentMessages, newMessage]
  const availableTokens = getAvailableTokens(modelId, systemPrompt)
  const totalTokens = estimateConversationTokens(allMessages)

  return totalTokens > availableTokens
}

/**
 * Get context usage percentage
 */
export function getContextUsage(
  messages: Message[],
  modelId: string,
  systemPrompt: string
): {
  used: number
  available: number
  percentage: number
} {
  const contextLimit = getContextLimit(modelId)
  const systemTokens = estimateTokens(systemPrompt)
  const messageTokens = estimateConversationTokens(messages)
  const used = systemTokens + messageTokens
  const available = contextLimit

  return {
    used,
    available,
    percentage: Math.round((used / available) * 100)
  }
}
