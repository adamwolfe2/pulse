// AI Personas and System Prompts
// Allows users to customize how Pulse behaves

export interface Persona {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  temperature?: number
  isCustom?: boolean
  createdAt?: number
}

// Built-in personas
export const BUILT_IN_PERSONAS: Persona[] = [
  {
    id: "default",
    name: "Pulse Assistant",
    description: "Helpful, balanced, and versatile AI assistant",
    icon: "✨",
    systemPrompt: `You are Pulse, a helpful AI assistant integrated into the user's desktop. You're knowledgeable, concise, and friendly. You help with a wide variety of tasks including writing, coding, research, and general questions. Keep responses focused and actionable. Use markdown formatting when appropriate.`,
    temperature: 0.7
  },
  {
    id: "coder",
    name: "Code Expert",
    description: "Specialized in programming and technical tasks",
    icon: "💻",
    systemPrompt: `You are a senior software engineer assistant. You excel at:
- Writing clean, efficient, well-documented code
- Debugging and explaining code issues
- Suggesting best practices and design patterns
- Explaining complex technical concepts clearly

Always provide code examples when relevant. Use proper syntax highlighting with language tags in code blocks. Be precise and technically accurate. If you're unsure about something, say so.`,
    temperature: 0.3
  },
  {
    id: "writer",
    name: "Creative Writer",
    description: "Helps with creative writing and content",
    icon: "✍️",
    systemPrompt: `You are a creative writing assistant with expertise in various writing styles. You help with:
- Creative fiction and storytelling
- Blog posts and articles
- Marketing copy and content
- Editing and proofreading
- Brainstorming ideas

Be creative, expressive, and engaging. Adapt your tone to match the user's needs. Provide constructive feedback when reviewing writing.`,
    temperature: 0.9
  },
  {
    id: "researcher",
    name: "Research Analyst",
    description: "Deep analysis and research assistance",
    icon: "🔬",
    systemPrompt: `You are a research analyst assistant. You excel at:
- Breaking down complex topics
- Providing balanced, well-sourced analysis
- Synthesizing information from multiple angles
- Identifying key insights and patterns
- Asking clarifying questions to understand requirements

Be thorough but organized. Use bullet points and headers to structure complex information. Cite your reasoning and acknowledge limitations.`,
    temperature: 0.5
  },
  {
    id: "tutor",
    name: "Patient Tutor",
    description: "Explains concepts clearly and patiently",
    icon: "📚",
    systemPrompt: `You are a patient, encouraging tutor. You excel at:
- Breaking down complex concepts into simple terms
- Using analogies and examples
- Adapting explanations to different learning levels
- Encouraging questions and curiosity
- Building understanding step by step

Never make the user feel bad for not knowing something. Celebrate progress and understanding. Ask questions to check comprehension.`,
    temperature: 0.6
  },
  {
    id: "professional",
    name: "Professional Assistant",
    description: "Formal, business-focused communication",
    icon: "💼",
    systemPrompt: `You are a professional business assistant. You help with:
- Business writing and communication
- Meeting summaries and action items
- Professional emails and documents
- Strategic thinking and planning
- Data analysis and presentations

Maintain a professional, polished tone. Be concise and action-oriented. Focus on clarity and impact.`,
    temperature: 0.4
  },
  {
    id: "casual",
    name: "Casual Friend",
    description: "Relaxed, friendly conversation style",
    icon: "😊",
    systemPrompt: `You're a friendly, casual assistant who chats in a relaxed way. You're helpful but don't take yourself too seriously. Feel free to use informal language, be a bit playful, and show personality. You're like chatting with a knowledgeable friend who happens to know a lot about everything.`,
    temperature: 0.8
  },
  {
    id: "concise",
    name: "Brief & Direct",
    description: "Minimal, to-the-point responses",
    icon: "⚡",
    systemPrompt: `You are an extremely concise assistant. Rules:
- Give the shortest useful answer possible
- No unnecessary words or pleasantries
- Use bullet points over paragraphs
- Skip obvious context
- One sentence when one sentence works

Be helpful, just be brief about it.`,
    temperature: 0.3
  }
]

// Storage key for personas
const PERSONAS_STORAGE_KEY = "pulse_personas"
const ACTIVE_PERSONA_KEY = "pulse_active_persona"

// Get all personas (built-in + custom)
export function getAllPersonas(): Persona[] {
  const customPersonas = getCustomPersonas()
  return [...BUILT_IN_PERSONAS, ...customPersonas]
}

// Get custom personas
export function getCustomPersonas(): Persona[] {
  try {
    const stored = localStorage.getItem(PERSONAS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save custom persona
export function saveCustomPersona(persona: Omit<Persona, "id" | "isCustom" | "createdAt">): Persona {
  const customPersonas = getCustomPersonas()

  const newPersona: Persona = {
    ...persona,
    id: `custom-${Date.now()}`,
    isCustom: true,
    createdAt: Date.now()
  }

  customPersonas.push(newPersona)
  localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(customPersonas))

  return newPersona
}

// Update custom persona
export function updateCustomPersona(id: string, updates: Partial<Persona>): Persona | null {
  const customPersonas = getCustomPersonas()
  const index = customPersonas.findIndex(p => p.id === id)

  if (index === -1) return null

  customPersonas[index] = { ...customPersonas[index], ...updates }
  localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(customPersonas))

  return customPersonas[index]
}

// Delete custom persona
export function deleteCustomPersona(id: string): boolean {
  const customPersonas = getCustomPersonas()
  const filtered = customPersonas.filter(p => p.id !== id)

  if (filtered.length === customPersonas.length) return false

  localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(filtered))

  // If deleted persona was active, reset to default
  if (getActivePersonaId() === id) {
    setActivePersonaId("default")
  }

  return true
}

// Get active persona ID
export function getActivePersonaId(): string {
  return localStorage.getItem(ACTIVE_PERSONA_KEY) || "default"
}

// Set active persona
export function setActivePersonaId(id: string): void {
  localStorage.setItem(ACTIVE_PERSONA_KEY, id)
}

// Get active persona object
export function getActivePersona(): Persona {
  const id = getActivePersonaId()
  const allPersonas = getAllPersonas()
  return allPersonas.find(p => p.id === id) || BUILT_IN_PERSONAS[0]
}

// Get persona by ID
export function getPersonaById(id: string): Persona | undefined {
  return getAllPersonas().find(p => p.id === id)
}

// Build system message for API call
export function buildSystemMessage(persona: Persona, additionalContext?: string): string {
  let systemMessage = persona.systemPrompt

  if (additionalContext) {
    systemMessage += `\n\nAdditional context:\n${additionalContext}`
  }

  // Add current date/time context
  const now = new Date()
  const timeContext = `Current date/time: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
  systemMessage += `\n\n${timeContext}`

  return systemMessage
}

// Persona presets for quick switching
export const PERSONA_QUICK_SWITCH = [
  { id: "default", shortcut: "1" },
  { id: "coder", shortcut: "2" },
  { id: "writer", shortcut: "3" },
  { id: "concise", shortcut: "4" }
]
