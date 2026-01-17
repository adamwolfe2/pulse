import Anthropic from "@anthropic-ai/sdk"
import type { Suggestion, SuggestionType } from "../types"

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
    system: `You are GhostBar, a proactive AI desktop companion. You appear as a floating glassmorphic overlay to help users.

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
