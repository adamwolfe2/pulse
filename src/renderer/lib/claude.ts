/**
 * Claude API Client
 *
 * Handles all interactions with the Claude API including streaming,
 * vision analysis, and contextual suggestions.
 */

import Anthropic from "@anthropic-ai/sdk"
import type { Suggestion, SuggestionType } from "../types"
import { API, TIMING } from "../../shared/constants"
import {
  withTimeout,
  withRetry,
  parseClaudeError,
  getUserFriendlyError,
  isOnline
} from "./apiUtils"

/**
 * Analyze a screenshot using Claude Vision with timeout and retry
 */
export async function analyzeScreenWithVision(
  apiKey: string,
  screenshot: string,
  prompt: string
): Promise<string> {
  // Check network status first
  if (!isOnline()) {
    throw new Error('No internet connection')
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  // Extract base64 data from data URL
  const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "")

  const apiCall = async () => {
    const response = await client.messages.create({
      model: API.CLAUDE.DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Data
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    return content.text
  }

  try {
    return await withRetry(
      () => withTimeout(apiCall(), TIMING.TIMEOUT.API_REQUEST, 'Vision analysis'),
      {
        maxAttempts: API.RETRY.MAX_ATTEMPTS,
        onRetry: (attempt, error) => {
          console.warn(`[Claude] Vision analysis retry ${attempt}:`, error.message)
        }
      }
    )
  } catch (error) {
    const parsedError = parseClaudeError(error)
    console.error('[Claude] Vision analysis failed:', parsedError)
    throw new Error(getUserFriendlyError(parsedError))
  }
}

// Default system prompt (used if no persona provided)
const DEFAULT_SYSTEM_PROMPT = `You are Pulse, a helpful AI desktop companion. You appear as a floating glassmorphic overlay on the user's screen.

You can see the user's screen when they share a screenshot, and you help them with:
- Answering questions about what's on their screen
- Providing quick information and assistance
- Helping with tasks they're working on
- Being a proactive, intelligent assistant

Be conversational, helpful, and concise. Your responses appear in a chat overlay, so keep them readable and not too long unless detail is needed.`

/**
 * Stream chat messages with optional screenshot context
 * Includes timeout handling and error recovery
 */
export async function streamChat(
  apiKey: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  screenshot: string | null | undefined,
  onChunk: (chunk: string) => void,
  systemPrompt?: string,
  temperature?: number,
  onError?: (error: Error) => void
): Promise<void> {
  // Check network status first
  if (!isOnline()) {
    const error = new Error('No internet connection')
    onError?.(error)
    throw error
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  // Build the messages array for the API
  const apiMessages: Anthropic.MessageParam[] = messages.slice(0, -1).map(m => ({
    role: m.role,
    content: m.content
  }))

  // Handle the last message specially if there's a screenshot
  const lastMessage = messages[messages.length - 1]
  if (screenshot && lastMessage.role === "user") {
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "")
    apiMessages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: base64Data
          }
        },
        {
          type: "text",
          text: lastMessage.content
        }
      ]
    })
  } else {
    apiMessages.push({
      role: lastMessage.role,
      content: lastMessage.content
    })
  }

  const streamOptions: Parameters<typeof client.messages.stream>[0] = {
    model: API.CLAUDE.DEFAULT_MODEL,
    max_tokens: API.CLAUDE.MAX_TOKENS,
    system: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    messages: apiMessages
  }

  // Add temperature if specified (must be between 0 and 1)
  if (temperature !== undefined && temperature >= 0 && temperature <= 1) {
    streamOptions.temperature = temperature
  } else {
    streamOptions.temperature = API.CLAUDE.DEFAULT_TEMPERATURE
  }

  try {
    const stream = await client.messages.stream(streamOptions)

    // Set up a timeout for streaming (longer than regular API calls)
    const streamTimeout = setTimeout(() => {
      stream.abort()
      const error = new Error('Response stream timed out')
      onError?.(error)
    }, TIMING.TIMEOUT.API_REQUEST * 2) // Double timeout for streaming

    try {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          onChunk(event.delta.text)
        }
      }
    } finally {
      clearTimeout(streamTimeout)
    }
  } catch (error) {
    const parsedError = parseClaudeError(error)
    console.error('[Claude] Stream chat failed:', parsedError)
    const friendlyError = new Error(getUserFriendlyError(parsedError))
    onError?.(friendlyError)
    throw friendlyError
  }
}

/**
 * Generate a contextual AI suggestion with timeout and retry
 */
export async function generateContextualSuggestion(apiKey: string): Promise<Suggestion> {
  // Check network status first
  if (!isOnline()) {
    throw new Error('No internet connection')
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  // Get current context (time of day, etc.)
  const context = getContextInfo()

  const apiCall = async () => {
    const response = await client.messages.create({
      model: API.CLAUDE.DEFAULT_MODEL,
      max_tokens: 500,
      system: `You are Pulse, a proactive AI desktop companion. You appear as a floating glassmorphic overlay to help users.

Generate a helpful, contextual suggestion based on the current time and context. Be friendly, proactive, and useful.

RULES:
- Title should be conversational, like talking to a friend (max 60 chars)
- Suggestions should feel natural and timely
- Include actionable next steps
- Be helpful but not intrusive

OUTPUT FORMAT (JSON only, no markdown):
{
  "type": "music|reminder|general|preference|belonging",
  "title": "conversational message",
  "detail": {
    "subtitle": "optional context",
    "title": "main detail heading",
    "description": "supporting text"
  },
  "thumbnail": {
    "type": "icon",
    "icon": "emoji"
  },
  "actions": [
    { "label": "button text", "icon": "emoji", "primary": true }
  ],
  "hint": "optional hint text"
}`,
      messages: [
        {
          role: "user",
          content: `Current context:
- Time: ${context.time}
- Day: ${context.day}
- Period: ${context.period}

Generate a single helpful suggestion appropriate for this moment.`
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    return content.text
  }

  try {
    const responseText = await withRetry(
      () => withTimeout(apiCall(), TIMING.TIMEOUT.API_REQUEST, 'Contextual suggestion'),
      {
        maxAttempts: 2, // Fewer retries for suggestions
        onRetry: (attempt, error) => {
          console.warn(`[Claude] Suggestion retry ${attempt}:`, error.message)
        }
      }
    )

    // Clean up response
    let jsonText = responseText.trim()
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
    jsonText = jsonText.trim()

    const parsed = JSON.parse(jsonText)

    return {
      id: `ai-${Date.now()}`,
      type: parsed.type as SuggestionType || "general",
      title: parsed.title,
      detail: parsed.detail ? {
        title: parsed.detail.title,
        subtitle: parsed.detail.subtitle,
        description: parsed.detail.description,
        meta: parsed.detail.meta,
        inlineAction: parsed.detail.inlineAction,
        sideAction: parsed.detail.sideAction
      } : undefined,
      thumbnail: parsed.thumbnail,
      actions: parsed.actions?.map((a: { label: string; icon?: string; primary?: boolean }, i: number) => ({
        id: `action-${i}`,
        label: a.label,
        icon: a.icon,
        primary: a.primary
      })),
      hint: parsed.hint,
      timestamp: Date.now()
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("[Claude] Failed to parse AI response as JSON")
      throw new Error('Failed to parse AI response')
    }
    const parsedError = parseClaudeError(error)
    console.error('[Claude] Contextual suggestion failed:', parsedError)
    throw new Error(getUserFriendlyError(parsedError))
  }
}

function getContextInfo() {
  const now = new Date()
  const hour = now.getHours()
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  let period: string
  if (hour < 6) period = "late night"
  else if (hour < 9) period = "early morning"
  else if (hour < 12) period = "morning"
  else if (hour < 14) period = "midday"
  else if (hour < 17) period = "afternoon"
  else if (hour < 20) period = "evening"
  else period = "night"

  return {
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    day: days[now.getDay()],
    period
  }
}
