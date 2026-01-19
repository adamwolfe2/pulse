// Smart Context Awareness
// Time-based greetings, productivity insights, and contextual suggestions

export interface TimeContext {
  hour: number
  minute: number
  period: "morning" | "afternoon" | "evening" | "night" | "late_night"
  dayOfWeek: string
  isWeekend: boolean
  greeting: string
  suggestion: string
  productivity: ProductivityContext
}

export interface ProductivityContext {
  sessionDuration: number // minutes since first interaction today
  messageCount: number
  isDeepWork: boolean // Been focused for >30min
  breakSuggestion: boolean // Suggest a break after >2hrs
}

// Session tracking
let sessionStart: number | null = null
let messageCountToday = 0
let lastInteraction = Date.now()

// Get current time context
export function getTimeContext(): TimeContext {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayOfWeek = days[now.getDay()]
  const isWeekend = now.getDay() === 0 || now.getDay() === 6

  // Determine period
  let period: TimeContext["period"]
  if (hour >= 5 && hour < 12) period = "morning"
  else if (hour >= 12 && hour < 17) period = "afternoon"
  else if (hour >= 17 && hour < 21) period = "evening"
  else if (hour >= 21 || hour < 2) period = "night"
  else period = "late_night"

  // Initialize session if needed
  if (!sessionStart) {
    sessionStart = Date.now()
  }

  const sessionDuration = Math.floor((Date.now() - sessionStart) / 60000)
  const isDeepWork = sessionDuration >= 30
  const breakSuggestion = sessionDuration >= 120

  return {
    hour,
    minute,
    period,
    dayOfWeek,
    isWeekend,
    greeting: getGreeting(period, dayOfWeek, isWeekend),
    suggestion: getContextualSuggestion(period, isWeekend, sessionDuration),
    productivity: {
      sessionDuration,
      messageCount: messageCountToday,
      isDeepWork,
      breakSuggestion
    }
  }
}

// Get time-appropriate greeting
function getGreeting(
  period: TimeContext["period"],
  dayOfWeek: string,
  isWeekend: boolean
): string {
  const greetings: Record<TimeContext["period"], string[]> = {
    morning: [
      "Good morning! Ready to tackle the day?",
      "Morning! What can I help you with?",
      "Rise and shine! How can I assist?",
      "Good morning! Let's make today productive."
    ],
    afternoon: [
      "Good afternoon! How's your day going?",
      "Afternoon! What are you working on?",
      "Hey there! Need a hand with something?",
      "Good afternoon! Ready to help."
    ],
    evening: [
      "Good evening! Wrapping up for the day?",
      "Evening! What can I help you with?",
      "Hey! Still going strong?",
      "Good evening! How can I assist?"
    ],
    night: [
      "Working late? I'm here to help.",
      "Burning the midnight oil? Let's get it done.",
      "Night owl mode activated!",
      "Late night session? I've got you covered."
    ],
    late_night: [
      "You're up late! Everything okay?",
      "Can't sleep? I'm here if you need help.",
      "Late night thoughts? Let's chat.",
      "Midnight productivity? I'm with you."
    ]
  }

  // Add weekend-specific greetings
  if (isWeekend && period === "morning") {
    return `Happy ${dayOfWeek}! Enjoying the weekend?`
  }

  if (dayOfWeek === "Monday" && period === "morning") {
    return "Happy Monday! Let's start the week strong."
  }

  if (dayOfWeek === "Friday" && period === "afternoon") {
    return "Friday afternoon! Almost there. How can I help?"
  }

  const options = greetings[period]
  return options[Math.floor(Math.random() * options.length)]
}

// Get contextual suggestion based on time
function getContextualSuggestion(
  period: TimeContext["period"],
  isWeekend: boolean,
  sessionDuration: number
): string {
  // Break suggestion takes priority
  if (sessionDuration >= 120) {
    return "You've been working for over 2 hours. Consider taking a short break!"
  }

  if (sessionDuration >= 60) {
    return "Great focus session! Remember to stretch."
  }

  // Time-based suggestions
  const suggestions: Record<TimeContext["period"], string[]> = {
    morning: [
      "Morning is great for creative work. What's on your mind?",
      "Plan your day with me - what are your priorities?",
      "Start with your hardest task while you're fresh."
    ],
    afternoon: [
      "Afternoon slump? Let's work through it together.",
      "Good time to tackle that task you've been putting off.",
      "Need help organizing your thoughts?"
    ],
    evening: [
      "Wrapping up? I can help you summarize today's work.",
      "Planning for tomorrow? Let's outline your tasks.",
      "Good time to review what you've accomplished."
    ],
    night: [
      "Quick task or deep work session?",
      "I can help you brainstorm while it's quiet.",
      "Night sessions can be productive. What's the goal?"
    ],
    late_night: [
      "Keep it simple - what's the one thing you need?",
      "Sometimes the best ideas come late at night.",
      "Quick help before you call it a night?"
    ]
  }

  if (isWeekend) {
    return "Weekend mode! Working on a passion project or catching up?"
  }

  const options = suggestions[period]
  return options[Math.floor(Math.random() * options.length)]
}

// Track interaction
export function trackInteraction(): void {
  lastInteraction = Date.now()
  messageCountToday++

  // Reset daily count at midnight
  const today = new Date().toDateString()
  const stored = localStorage.getItem("pulse_interaction_date")
  if (stored !== today) {
    messageCountToday = 1
    sessionStart = Date.now()
    localStorage.setItem("pulse_interaction_date", today)
  }
}

// Get productivity stats
export function getProductivityStats(): {
  todayMessages: number
  sessionMinutes: number
  averageResponseTime: number
} {
  const sessionMinutes = sessionStart
    ? Math.floor((Date.now() - sessionStart) / 60000)
    : 0

  return {
    todayMessages: messageCountToday,
    sessionMinutes,
    averageResponseTime: 2.5 // Mock - would calculate from actual response times
  }
}

// Get smart quick actions based on context
export function getContextualQuickActions(): { label: string; icon: string; prompt: string }[] {
  const { period, isWeekend, productivity } = getTimeContext()

  const baseActions = [
    { label: "What's on my screen?", icon: "👀", prompt: "" },
    { label: "Voice mode", icon: "🎤", prompt: "" }
  ]

  // Add contextual actions
  if (period === "morning" && !isWeekend) {
    baseActions.push(
      { label: "Plan my day", icon: "📋", prompt: "Help me plan my day. What should I focus on?" },
      { label: "Morning briefing", icon: "☀️", prompt: "Give me a quick morning briefing - what should I know today?" }
    )
  }

  if (period === "afternoon") {
    baseActions.push(
      { label: "Quick summary", icon: "📝", prompt: "Help me summarize what I'm working on" }
    )
  }

  if (period === "evening" || period === "night") {
    baseActions.push(
      { label: "Wrap up notes", icon: "📓", prompt: "Help me write quick notes about what I accomplished today" }
    )
  }

  if (productivity.breakSuggestion) {
    baseActions.push(
      { label: "Take a break", icon: "☕", prompt: "I need a break. Suggest something quick and refreshing." }
    )
  }

  if (isWeekend) {
    baseActions.push(
      { label: "Fun project", icon: "🎨", prompt: "I want to work on something fun. Give me some creative project ideas." }
    )
  }

  return baseActions.slice(0, 4) // Max 4 actions
}

// Get system prompt enhancement based on context
export function getContextSystemPrompt(): string {
  const { period, dayOfWeek, isWeekend, productivity } = getTimeContext()

  let contextInfo = `
Current context:
- Time: ${new Date().toLocaleTimeString()} on ${dayOfWeek}
- Session duration: ${productivity.sessionDuration} minutes
- Messages this session: ${productivity.messageCount}
`

  if (productivity.isDeepWork) {
    contextInfo += "- User has been in a focused work session\n"
  }

  if (productivity.breakSuggestion) {
    contextInfo += "- Consider gently suggesting a break if appropriate\n"
  }

  if (isWeekend) {
    contextInfo += "- It's the weekend - user might prefer a more relaxed tone\n"
  }

  if (period === "late_night") {
    contextInfo += "- It's late - keep responses concise unless detail is needed\n"
  }

  return contextInfo
}
