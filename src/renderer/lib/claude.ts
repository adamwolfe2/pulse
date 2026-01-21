import Anthropic from "@anthropic-ai/sdk"
import type { Suggestion, SuggestionType } from "../types"

// Analyze a screenshot using Claude Vision
export async function analyzeScreenWithVision(
  apiKey: string,
  screenshot: string,
  prompt: string
): Promise<string> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  // Extract base64 data from data URL
  const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "")

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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

// Default system prompt (used if no persona provided)
const DEFAULT_SYSTEM_PROMPT = `You are Pulse, a helpful AI desktop companion. You appear as a floating glassmorphic overlay on the user's screen.

You can see the user's screen when they share a screenshot, and you help them with:
- Answering questions about what's on their screen
- Providing quick information and assistance
- Helping with tasks they're working on
- Being a proactive, intelligent assistant

Be conversational, helpful, and concise. Your responses appear in a chat overlay, so keep them readable and not too long unless detail is needed.`

// Stream chat messages with optional screenshot context
export async function streamChat(
  apiKey: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  screenshot: string | null | undefined,
  onChunk: (chunk: string) => void,
  systemPrompt?: string,
  temperature?: number
): Promise<void> {
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
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt || DEFAULT_SYSTEM_PROMPT,
    messages: apiMessages
  }

  // Add temperature if specified (must be between 0 and 1)
  if (temperature !== undefined && temperature >= 0 && temperature <= 1) {
    streamOptions.temperature = temperature
  }

  const stream = await client.messages.stream(streamOptions)

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      onChunk(event.delta.text)
    }
  }
}

export async function generateContextualSuggestion(apiKey: string): Promise<Suggestion> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true
  })

  // Get current context (time of day, etc.)
  const context = getContextInfo()

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
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

  try {
    // Clean up response
    let jsonText = content.text.trim()
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
    console.error("Failed to parse AI response:", content.text)
    throw error
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
