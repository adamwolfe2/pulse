/**
 * Task Store - Zustand state management for tasks and sprints
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type Task,
  type FocusSprint,
  type TaskSource,
  type TaskContext,
  type TaskStats,
  createTask,
  createSprint,
  calculateTaskStats,
  sortTasks,
  processTaskContent,
} from '../lib/tasks'

interface TaskState {
  // State
  tasks: Task[]
  sprints: FocusSprint[]
  activeSprint: FocusSprint | null
  taskListVisible: boolean
  taskListPosition: { x: number; y: number } | null

  // Task Actions
  addTask: (content: string, source: TaskSource, context?: TaskContext) => Task
  toggleTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  reorderTasks: (taskIds: string[]) => void
  clearCompleted: () => void
  clearAll: () => void

  // Sprint Actions
  startSprint: (name?: string, goal?: string) => FocusSprint
  endSprint: (sprintId: string) => void
  addTaskToSprint: (taskId: string, sprintId: string) => void
  removeTaskFromSprint: (taskId: string) => void

  // UI Actions
  setTaskListVisible: (visible: boolean) => void
  toggleTaskList: () => void
  setTaskListPosition: (position: { x: number; y: number }) => void

  // Computed
  getStats: () => TaskStats
  getPendingTasks: () => Task[]
  getSprintTasks: (sprintId: string) => Task[]
  getVisibleTasks: () => Task[]
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: [],
      sprints: [],
      activeSprint: null,
      taskListVisible: false,
      taskListPosition: null,

      // Task Actions
      addTask: (content, source, context) => {
        // Process content to extract priority and tags
        const processed = processTaskContent(content)

        const task = createTask(processed.content, source, {
          priority: processed.priority,
          tags: processed.tags,
          context,
          sprintId: get().activeSprint?.id,
        })

        set(state => {
          const newTasks = [task, ...state.tasks]

          // If there's an active sprint, add the task to it
          let newSprints = state.sprints
          let newActiveSprint = state.activeSprint

          if (state.activeSprint) {
            newSprints = state.sprints.map(s =>
              s.id === state.activeSprint!.id
                ? { ...s, taskIds: [...s.taskIds, task.id] }
                : s
            )
            newActiveSprint = {
              ...state.activeSprint,
              taskIds: [...state.activeSprint.taskIds, task.id]
            }
          }

          return {
            tasks: newTasks,
            sprints: newSprints,
            activeSprint: newActiveSprint,
          }
        })

        // Notify main process about new task
        window.pulse?.tasks?.notifyTaskAdded?.(task)

        return task
      },

      toggleTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? Date.now() : undefined
                }
              : t
          )
        }))
      },

      deleteTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
          sprints: state.sprints.map(s => ({
            ...s,
            taskIds: s.taskIds.filter(id => id !== taskId)
          })),
          activeSprint: state.activeSprint
            ? {
                ...state.activeSprint,
                taskIds: state.activeSprint.taskIds.filter(id => id !== taskId)
              }
            : null
        }))
      },

      updateTask: (taskId, updates) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
          )
        }))
      },

      reorderTasks: (taskIds) => {
        set(state => {
          const taskMap = new Map(state.tasks.map(t => [t.id, t]))
          const reorderedTasks = taskIds
            .map(id => taskMap.get(id))
            .filter((t): t is Task => t !== undefined)

          // Add any tasks not in the new order to the end
          const remainingTasks = state.tasks.filter(t => !taskIds.includes(t.id))

          return { tasks: [...reorderedTasks, ...remainingTasks] }
        })
      },

      clearCompleted: () => {
        set(state => {
          const completedIds = state.tasks.filter(t => t.completed).map(t => t.id)
          return {
            tasks: state.tasks.filter(t => !t.completed),
            sprints: state.sprints.map(s => ({
              ...s,
              taskIds: s.taskIds.filter(id => !completedIds.includes(id))
            })),
            activeSprint: state.activeSprint
              ? {
                  ...state.activeSprint,
                  taskIds: state.activeSprint.taskIds.filter(id => !completedIds.includes(id))
                }
              : null
          }
        })
      },

      clearAll: () => {
        set({ tasks: [], sprints: [], activeSprint: null })
      },

      // Sprint Actions
      startSprint: (name, goal) => {
        // End any active sprint first
        const currentActive = get().activeSprint
        if (currentActive) {
          get().endSprint(currentActive.id)
        }

        const sprint = createSprint(name, goal)

        set(state => ({
          sprints: [...state.sprints, sprint],
          activeSprint: sprint,
        }))

        return sprint
      },

      endSprint: (sprintId) => {
        set(state => ({
          sprints: state.sprints.map(s =>
            s.id === sprintId
              ? { ...s, isActive: false, endedAt: Date.now() }
              : s
          ),
          activeSprint: state.activeSprint?.id === sprintId
            ? null
            : state.activeSprint
        }))
      },

      addTaskToSprint: (taskId, sprintId) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, sprintId } : t
          ),
          sprints: state.sprints.map(s =>
            s.id === sprintId
              ? { ...s, taskIds: [...s.taskIds, taskId] }
              : s
          ),
          activeSprint: state.activeSprint?.id === sprintId
            ? { ...state.activeSprint, taskIds: [...state.activeSprint.taskIds, taskId] }
            : state.activeSprint
        }))
      },

      removeTaskFromSprint: (taskId) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, sprintId: undefined } : t
          ),
          sprints: state.sprints.map(s => ({
            ...s,
            taskIds: s.taskIds.filter(id => id !== taskId)
          })),
          activeSprint: state.activeSprint
            ? {
                ...state.activeSprint,
                taskIds: state.activeSprint.taskIds.filter(id => id !== taskId)
              }
            : null
        }))
      },

      // UI Actions
      setTaskListVisible: (visible) => {
        set({ taskListVisible: visible })
        window.pulse?.tasks?.setWindowVisible?.(visible)
      },

      toggleTaskList: () => {
        const newVisible = !get().taskListVisible
        set({ taskListVisible: newVisible })
        window.pulse?.tasks?.setWindowVisible?.(newVisible)
      },

      setTaskListPosition: (position) => {
        set({ taskListPosition: position })
      },

      // Computed
      getStats: () => {
        return calculateTaskStats(get().tasks)
      },

      getPendingTasks: () => {
        return sortTasks(get().tasks.filter(t => !t.completed))
      },

      getSprintTasks: (sprintId) => {
        return sortTasks(get().tasks.filter(t => t.sprintId === sprintId))
      },

      getVisibleTasks: () => {
        const state = get()
        if (state.activeSprint) {
          return sortTasks(state.tasks.filter(t => t.sprintId === state.activeSprint!.id))
        }
        return sortTasks(state.tasks.filter(t => !t.completed))
      },
    }),
    {
      name: 'pulse-tasks',
      partialize: (state) => ({
        tasks: state.tasks,
        sprints: state.sprints,
        activeSprint: state.activeSprint,
        taskListPosition: state.taskListPosition,
      }),
    }
  )
)

// Type declarations for window.pulse.tasks
declare global {
  interface Window {
    pulse?: {
      tasks?: {
        notifyTaskAdded?: (task: Task) => void
        setWindowVisible?: (visible: boolean) => void
        getWindowPosition?: () => Promise<{ x: number; y: number } | null>
      }
    } & Window['pulse']
  }
}
