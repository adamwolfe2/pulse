// Quick Commands System
// Supports /, @, and # prefix commands

export interface Command {
  id: string
  name: string
  description: string
  prefix: "/" | "@" | "#"
  aliases?: string[]
  action: (args: string) => CommandResult
}

export interface CommandResult {
  type: "prompt" | "action" | "insert"
  value: string
  clearInput?: boolean
}

// Built-in slash commands
export const slashCommands: Command[] = [
  {
    id: "help",
    name: "help",
    description: "Show available commands",
    prefix: "/",
    action: () => ({
      type: "prompt",
      value: "Show me a list of all available commands and what they do.",
      clearInput: true
    })
  },
  {
    id: "clear",
    name: "clear",
    description: "Clear current conversation",
    prefix: "/",
    action: () => ({
      type: "action",
      value: "CLEAR_CHAT",
      clearInput: true
    })
  },
  {
    id: "new",
    name: "new",
    description: "Start a new conversation",
    prefix: "/",
    action: () => ({
      type: "action",
      value: "NEW_CONVERSATION",
      clearInput: true
    })
  },
  {
    id: "history",
    name: "history",
    description: "View conversation history",
    prefix: "/",
    action: () => ({
      type: "action",
      value: "SHOW_HISTORY",
      clearInput: true
    })
  },
  {
    id: "settings",
    name: "settings",
    description: "Open settings panel",
    prefix: "/",
    action: () => ({
      type: "action",
      value: "OPEN_SETTINGS",
      clearInput: true
    })
  },
  {
    id: "screenshot",
    name: "screenshot",
    description: "Capture screen for context",
    prefix: "/",
    aliases: ["ss", "capture"],
    action: () => ({
      type: "action",
      value: "CAPTURE_SCREEN",
      clearInput: true
    })
  },
  {
    id: "voice",
    name: "voice",
    description: "Start voice input mode",
    prefix: "/",
    action: () => ({
      type: "action",
      value: "VOICE_MODE",
      clearInput: true
    })
  },
  {
    id: "code",
    name: "code",
    description: "Help write or explain code",
    prefix: "/",
    action: (args) => ({
      type: "prompt",
      value: args ? `Help me with this code: ${args}` : "I need help with code. What would you like me to help with?",
      clearInput: false
    })
  },
  {
    id: "explain",
    name: "explain",
    description: "Explain something in detail",
    prefix: "/",
    action: (args) => ({
      type: "prompt",
      value: args ? `Explain this in detail: ${args}` : "What would you like me to explain?",
      clearInput: false
    })
  },
  {
    id: "summarize",
    name: "summarize",
    description: "Summarize text or content",
    prefix: "/",
    aliases: ["sum", "tldr"],
    action: (args) => ({
      type: "prompt",
      value: args ? `Please summarize this: ${args}` : "What would you like me to summarize?",
      clearInput: false
    })
  },
  {
    id: "translate",
    name: "translate",
    description: "Translate text to another language",
    prefix: "/",
    action: (args) => ({
      type: "prompt",
      value: args ? `Translate this: ${args}` : "What would you like me to translate? Please specify the target language.",
      clearInput: false
    })
  },
  {
    id: "write",
    name: "write",
    description: "Help write content",
    prefix: "/",
    action: (args) => ({
      type: "prompt",
      value: args ? `Help me write: ${args}` : "What would you like me to help write?",
      clearInput: false
    })
  },
  {
    id: "fix",
    name: "fix",
    description: "Fix grammar or code issues",
    prefix: "/",
    action: (args) => ({
      type: "prompt",
      value: args ? `Please fix this: ${args}` : "What would you like me to fix?",
      clearInput: false
    })
  },
  {
    id: "brainstorm",
    name: "brainstorm",
    description: "Generate ideas on a topic",
    prefix: "/",
    aliases: ["ideas"],
    action: (args) => ({
      type: "prompt",
      value: args ? `Help me brainstorm ideas about: ${args}` : "What topic would you like to brainstorm about?",
      clearInput: false
    })
  }
]

// @ mentions for context injection
export const mentionCommands: Command[] = [
  {
    id: "screen",
    name: "screen",
    description: "Include current screen context",
    prefix: "@",
    action: () => ({
      type: "action",
      value: "INCLUDE_SCREEN",
      clearInput: false
    })
  },
  {
    id: "clipboard",
    name: "clipboard",
    description: "Include clipboard content",
    prefix: "@",
    action: () => ({
      type: "action",
      value: "INCLUDE_CLIPBOARD",
      clearInput: false
    })
  },
  {
    id: "time",
    name: "time",
    description: "Include current time context",
    prefix: "@",
    action: () => ({
      type: "insert",
      value: `[Current time: ${new Date().toLocaleString()}]`,
      clearInput: false
    })
  }
]

// # tags for response formatting
export const tagCommands: Command[] = [
  {
    id: "brief",
    name: "brief",
    description: "Get a brief, concise response",
    prefix: "#",
    action: () => ({
      type: "insert",
      value: "[Please keep your response brief and concise]",
      clearInput: false
    })
  },
  {
    id: "detailed",
    name: "detailed",
    description: "Get a detailed, comprehensive response",
    prefix: "#",
    action: () => ({
      type: "insert",
      value: "[Please provide a detailed, comprehensive response]",
      clearInput: false
    })
  },
  {
    id: "steps",
    name: "steps",
    description: "Get step-by-step instructions",
    prefix: "#",
    action: () => ({
      type: "insert",
      value: "[Please provide step-by-step instructions]",
      clearInput: false
    })
  },
  {
    id: "code",
    name: "code",
    description: "Focus on code examples",
    prefix: "#",
    action: () => ({
      type: "insert",
      value: "[Please include code examples in your response]",
      clearInput: false
    })
  },
  {
    id: "eli5",
    name: "eli5",
    description: "Explain like I'm 5",
    prefix: "#",
    action: () => ({
      type: "insert",
      value: "[Please explain this simply, like I'm 5 years old]",
      clearInput: false
    })
  }
]

// Get all commands
export function getAllCommands(): Command[] {
  return [...slashCommands, ...mentionCommands, ...tagCommands]
}

// Parse input for commands
export function parseCommand(input: string): { command: Command | null; args: string } {
  const trimmed = input.trim()

  // Check for slash commands
  if (trimmed.startsWith("/")) {
    const parts = trimmed.slice(1).split(/\s+/)
    const commandName = parts[0].toLowerCase()
    const args = parts.slice(1).join(" ")

    const command = slashCommands.find(
      c => c.name === commandName || c.aliases?.includes(commandName)
    )

    return { command: command || null, args }
  }

  // Check for @ mentions
  if (trimmed.startsWith("@")) {
    const parts = trimmed.slice(1).split(/\s+/)
    const commandName = parts[0].toLowerCase()
    const args = parts.slice(1).join(" ")

    const command = mentionCommands.find(c => c.name === commandName)
    return { command: command || null, args }
  }

  // Check for # tags
  if (trimmed.startsWith("#")) {
    const parts = trimmed.slice(1).split(/\s+/)
    const commandName = parts[0].toLowerCase()
    const args = parts.slice(1).join(" ")

    const command = tagCommands.find(c => c.name === commandName)
    return { command: command || null, args }
  }

  return { command: null, args: input }
}

// Get command suggestions based on partial input
export function getCommandSuggestions(input: string, limit = 5): Command[] {
  const trimmed = input.trim().toLowerCase()

  if (!trimmed) return []

  let commands: Command[] = []
  let search = ""

  if (trimmed.startsWith("/")) {
    commands = slashCommands
    search = trimmed.slice(1)
  } else if (trimmed.startsWith("@")) {
    commands = mentionCommands
    search = trimmed.slice(1)
  } else if (trimmed.startsWith("#")) {
    commands = tagCommands
    search = trimmed.slice(1)
  } else {
    return []
  }

  if (!search) {
    return commands.slice(0, limit)
  }

  return commands
    .filter(c =>
      c.name.startsWith(search) ||
      c.aliases?.some(a => a.startsWith(search)) ||
      c.description.toLowerCase().includes(search)
    )
    .slice(0, limit)
}

// Execute a command
export function executeCommand(command: Command, args: string): CommandResult {
  return command.action(args)
}
