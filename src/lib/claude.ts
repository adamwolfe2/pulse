import Anthropic from "@anthropic-ai/sdk"
import type { PageContext, Suggestion, TriggerType } from "~/types"

let anthropicClient: Anthropic | null = null

export function initializeClient(apiKey: string): void {
  anthropicClient = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true  // Required for browser extension context
  })
}

export function getClient(): Anthropic {
  if (!anthropicClient) {
    throw new Error("Anthropic client not initialized. Call initializeClient first.")
  }
  return anthropicClient
}

interface SuggestionPromptParams {
  context: PageContext
  triggerType: TriggerType
  userInterests?: string[]
  userName?: string
}

function buildSystemPrompt(params: SuggestionPromptParams): string {
  const { triggerType, userName } = params

  const basePrompt = `You are GhostBar, a helpful AI browser companion. Generate brief, actionable suggestions based on the current webpage context.

RULES:
- Headline must be under 80 characters
- Be specific and contextual, never generic
- Suggest ONE primary action
- ${userName ? `Address the user as ${userName}` : "Be friendly but professional"}
- Tone: Helpful but not intrusive

OUTPUT FORMAT (JSON only, no markdown):
{
  "icon": "emoji",
  "headline": "main message under 80 chars",
  "detail": "optional expanded info under 150 chars",
  "actions": [
    { "label": "button text", "type": "primary", "handler": "action_name" }
  ],
  "confidence": 0.0-1.0
}`

  const typeSpecificPrompts: Record<TriggerType, string> = {
    github_repo: "Focus on: README summary, key features, getting started tips, star count, recent activity",
    long_article: "Focus on: Key takeaways, estimated read time, TL;DR summary",
    shopping: "Focus on: Price insights, review summary, alternative suggestions",
    clipboard_code: "Focus on: Code explanation, potential improvements, documentation links",
    clipboard_text: "Focus on: Summary, key points, related resources",
    documentation: "Focus on: Quick reference, related sections, example code",
    social_media: "Focus on: Thread summary, key discussion points, engagement stats",
    video: "Focus on: Content summary, key timestamps, channel info",
    news: "Focus on: Article summary, related coverage, key facts",
    recipe: "Focus on: Ingredient summary, cooking tips, nutritional info",
    idle: "Focus on: Productivity tips, interesting page insights"
  }

  return `${basePrompt}\n\nContext type: ${triggerType}\n${typeSpecificPrompts[triggerType]}`
}

function buildUserPrompt(context: PageContext): string {
  return `Current page analysis:
URL: ${context.url}
Title: ${context.title}
Description: ${context.description || "Not available"}
Page Type: ${context.contentType}

Main content (truncated):
${context.extractedContent.mainText.slice(0, 2000)}

Headings: ${context.extractedContent.headings.slice(0, 5).join(", ")}
${context.extractedContent.codeBlocks.length > 0 ? `Code blocks found: ${context.extractedContent.codeBlocks.length}` : ""}

Generate a brief, helpful suggestion for this page. Return ONLY valid JSON, no markdown.`
}

export async function generateSuggestion(
  params: SuggestionPromptParams
): Promise<Suggestion> {
  const client = getClient()

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: buildSystemPrompt(params),
    messages: [
      {
        role: "user",
        content: buildUserPrompt(params.context)
      }
    ]
  })

  const content = response.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude")
  }

  try {
    // Clean up potential markdown code blocks
    let jsonText = content.text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7)
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    const parsed = JSON.parse(jsonText)

    return {
      id: crypto.randomUUID(),
      type: params.triggerType,
      title: parsed.headline || parsed.title,
      description: parsed.detail || parsed.description || "",
      actions: (parsed.actions || []).map((action: { label: string; icon?: string; handler?: string; type?: string; primary?: boolean; payload?: Record<string, unknown> }) => ({
        id: crypto.randomUUID(),
        label: action.label,
        icon: action.icon || parsed.icon || "💡",
        handler: action.handler || "default",
        primary: action.type === "primary" || action.primary || false,
        payload: action.payload
      })),
      confidence: parsed.confidence || 0.8,
      context: params.context,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error("Failed to parse Claude response:", content.text)
    // Return a fallback suggestion
    return {
      id: crypto.randomUUID(),
      type: params.triggerType,
      title: "Interesting page detected",
      description: "Click to learn more about this content",
      actions: [
        {
          id: crypto.randomUUID(),
          label: "Analyze",
          icon: "🔍",
          handler: "analyze",
          primary: true
        }
      ],
      confidence: 0.5,
      context: params.context,
      timestamp: Date.now()
    }
  }
}

export async function explainContent(
  content: string,
  type: "code" | "text"
): Promise<string> {
  const client = getClient()

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Briefly explain this ${type} in 2-3 sentences:\n\n${content.slice(0, 1500)}`
      }
    ]
  })

  const textContent = response.content[0]
  if (textContent.type !== "text") {
    throw new Error("Unexpected response type")
  }

  return textContent.text
}
