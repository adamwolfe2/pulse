/**
 * Task System - Data Models and Types
 * Supports quick task capture, voice input, AI suggestions, and focus sprints
 */

export interface Task {
  id: string
  content: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  createdAt: number
  completedAt?: number
  dueDate?: number
  source: TaskSource
  context?: TaskContext
  sprintId?: string
  tags?: string[]
}

export type TaskSource = 'voice' | 'keyboard' | 'ai-suggested' | 'context-extracted' | 'imported'

export interface TaskContext {
  application?: string
  windowTitle?: string
  screenshot?: string
  extractedFrom?: string
  url?: string
}

export interface FocusSprint {
  id: string
  name: string
  startedAt: number
  endedAt?: number
  taskIds: string[]
  isActive: boolean
  goal?: string
}

export interface TaskStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  tasksToday: number
  completedToday: number
}

// Voice patterns for task detection
export const VOICE_TASK_PATTERNS: RegExp[] = [
  /^(?:add\s+)?task[:\s]+(.+)$/i,
  /^(?:remind\s+me\s+to\s+)(.+)$/i,
  /^(?:todo[:\s]+)(.+)$/i,
  /^(?:i\s+need\s+to\s+)(.+)$/i,
  /^(?:don't\s+forget\s+to\s+)(.+)$/i,
  /^(?:remember\s+to\s+)(.+)$/i,
  /^(?:note[:\s]+)(.+)$/i,
  /^(?:add\s+to\s+(?:my\s+)?list[:\s]+)(.+)$/i,
]

/**
 * Parse voice input for task content
 */
export function parseVoiceForTask(transcript: string): { isTask: boolean; content: string } {
  const trimmed = transcript.trim()

  for (const pattern of VOICE_TASK_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      return { isTask: true, content: match[1].trim() }
    }
  }

  return { isTask: false, content: '' }
}

/**
 * Generate a unique task ID
 */
export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Generate a unique sprint ID
 */
export function generateSprintId(): string {
  return `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Create a new task object
 */
export function createTask(
  content: string,
  source: TaskSource,
  options?: {
    priority?: Task['priority']
    context?: TaskContext
    sprintId?: string
    tags?: string[]
    dueDate?: number
  }
): Task {
  return {
    id: generateTaskId(),
    content,
    completed: false,
    priority: options?.priority ?? 'medium',
    createdAt: Date.now(),
    source,
    context: options?.context,
    sprintId: options?.sprintId,
    tags: options?.tags,
    dueDate: options?.dueDate,
  }
}

/**
 * Create a new focus sprint
 */
export function createSprint(name?: string, goal?: string): FocusSprint {
  const now = new Date()
  const defaultName = `${now.toLocaleDateString('en-US', { weekday: 'short' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`

  return {
    id: generateSprintId(),
    name: name || defaultName,
    startedAt: Date.now(),
    taskIds: [],
    isActive: true,
    goal,
  }
}

/**
 * Calculate task statistics
 */
export function calculateTaskStats(tasks: Task[]): TaskStats {
  const now = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)

  const completedTasks = tasks.filter(t => t.completed)
  const pendingTasks = tasks.filter(t => !t.completed)
  const tasksToday = tasks.filter(t => t.createdAt >= todayStart)
  const completedToday = tasks.filter(t => t.completed && t.completedAt && t.completedAt >= todayStart)

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
    tasksToday: tasksToday.length,
    completedToday: completedToday.length,
  }
}

/**
 * Sort tasks by priority and completion status
 */
export function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }

  return [...tasks].sort((a, b) => {
    // Completed tasks go to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    // Sort by priority
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }

    // Sort by creation date (newest first for pending, oldest first for completed)
    return a.completed ? a.completedAt! - b.completedAt! : b.createdAt - a.createdAt
  })
}

/**
 * Filter tasks for a specific sprint
 */
export function getSprintTasks(tasks: Task[], sprintId: string): Task[] {
  return tasks.filter(t => t.sprintId === sprintId)
}

/**
 * Get uncompleted tasks
 */
export function getPendingTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => !t.completed)
}

/**
 * Extract priority from task content (e.g., "!important" or "!!!")
 */
export function extractPriorityFromContent(content: string): { cleanContent: string; priority: Task['priority'] } {
  // Check for priority markers
  if (content.includes('!!!') || content.toLowerCase().includes('!urgent')) {
    return {
      cleanContent: content.replace(/!!!/g, '').replace(/!urgent/gi, '').trim(),
      priority: 'high'
    }
  }

  if (content.includes('!!') || content.toLowerCase().includes('!important')) {
    return {
      cleanContent: content.replace(/!!/g, '').replace(/!important/gi, '').trim(),
      priority: 'high'
    }
  }

  if (content.includes('!low') || content.toLowerCase().includes('!later')) {
    return {
      cleanContent: content.replace(/!low/gi, '').replace(/!later/gi, '').trim(),
      priority: 'low'
    }
  }

  return { cleanContent: content, priority: 'medium' }
}

/**
 * Extract tags from task content (e.g., "#work" or "#personal")
 */
export function extractTagsFromContent(content: string): { cleanContent: string; tags: string[] } {
  const tagPattern = /#(\w+)/g
  const tags: string[] = []
  let match

  while ((match = tagPattern.exec(content)) !== null) {
    tags.push(match[1].toLowerCase())
  }

  const cleanContent = content.replace(tagPattern, '').trim()

  return { cleanContent, tags }
}

/**
 * Process task content to extract priority and tags
 */
export function processTaskContent(content: string): {
  content: string
  priority: Task['priority']
  tags: string[]
} {
  const { cleanContent: afterPriority, priority } = extractPriorityFromContent(content)
  const { cleanContent, tags } = extractTagsFromContent(afterPriority)

  return {
    content: cleanContent,
    priority,
    tags,
  }
}
