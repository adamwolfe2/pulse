/**
 * Floating Task List - Draggable task widget
 * Displays tasks in a compact, always-on-top window
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  Plus,
  X,
  Minus,
  Check,
  Trash2,
  GripVertical,
  Mic,
  Sparkles,
  Target,
  CheckCircle2,
  MoreHorizontal,
  Flag
} from 'lucide-react'
import { useTaskStore } from './stores/taskStore'
import type { Task } from './lib/tasks'

// Animation configs
const springSmooth = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1
}

const springBouncy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
  mass: 1
}

export function FloatingTaskList() {
  const {
    tasks,
    activeSprint,
    addTask,
    toggleTask,
    deleteTask,
    reorderTasks,
    clearCompleted,
    getVisibleTasks,
    getStats,
  } = useTaskStore()

  const [inputValue, setInputValue] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Get visible tasks (either sprint tasks or all pending)
  const visibleTasks = getVisibleTasks()
  const stats = getStats()

  // Focus input when adding task
  useEffect(() => {
    if (isAddingTask) {
      inputRef.current?.focus()
    }
  }, [isAddingTask])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddTask = () => {
    if (inputValue.trim()) {
      addTask(inputValue.trim(), 'keyboard')
      setInputValue('')
      setIsAddingTask(false)
    }
  }

  const handleReorder = (newOrder: Task[]) => {
    reorderTasks(newOrder.map(t => t.id))
  }

  const handleMinimize = () => {
    window.pulse?.taskWindow?.minimize?.()
  }

  const handleClose = () => {
    window.pulse?.taskWindow?.hide?.()
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,20,0.97) 0%, rgba(10,10,15,0.98) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)'
      }}
    >
      {/* Header with drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b border-white/5"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-indigo-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <h2 className="text-white text-sm font-semibold">
            {activeSprint ? activeSprint.name : 'Tasks'}
          </h2>
          {activeSprint && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400">
              Sprint
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-0.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <span className="text-white/40 text-xs mr-2">
            {visibleTasks.filter(t => !t.completed).length} left
          </span>

          {/* Menu button */}
          <div className="relative" ref={menuRef}>
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={14} />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 z-50 min-w-[160px] py-1
                           bg-[#1a1a1f] border border-white/10 rounded-xl shadow-xl"
                >
                  <button
                    onClick={() => { clearCompleted(); setShowMenu(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Clear completed
                  </button>
                  <button
                    onClick={() => { window.pulse?.taskWindow?.newSprint?.(); setShowMenu(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    New sprint...
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handleMinimize}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Minus size={12} />
          </motion.button>
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={12} />
          </motion.button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {visibleTasks.length === 0 ? (
          <motion.div
            className="text-center py-8 text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">All done!</p>
            <p className="text-xs mt-1">Add a task to get started</p>
          </motion.div>
        ) : (
          <Reorder.Group
            axis="y"
            values={visibleTasks}
            onReorder={handleReorder}
            className="space-y-1"
          >
            <AnimatePresence mode="popLayout">
              {visibleTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* Quick add input */}
      <div className="p-2 border-t border-white/5">
        <AnimatePresence mode="wait">
          {isAddingTask ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask()
                  if (e.key === 'Escape') {
                    setIsAddingTask(false)
                    setInputValue('')
                  }
                }}
                onBlur={() => {
                  if (!inputValue.trim()) {
                    setIsAddingTask(false)
                  }
                }}
                placeholder="What needs to be done?"
                className="flex-1 bg-white/5 text-white placeholder-white/30 rounded-lg
                         px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                         border border-white/10"
              />
              <motion.button
                onClick={handleAddTask}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!inputValue.trim()}
                className="p-2 rounded-lg bg-indigo-500 text-white
                         disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                       text-white/40 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              <Plus size={16} />
              <span>Add task...</span>
              <kbd className="ml-auto px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/30">
                ⌘⇧T
              </kbd>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Stats footer */}
      {stats.totalTasks > 0 && (
        <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
          <span>{stats.completedToday} completed today</span>
          <span>{Math.round(stats.completionRate)}% done</span>
        </div>
      )}
    </div>
  )
}

// Individual task item
function TaskItem({
  task,
  index,
  onToggle,
  onDelete
}: {
  task: Task
  index: number
  onToggle: () => void
  onDelete: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  const getSourceIcon = () => {
    switch (task.source) {
      case 'voice':
        return <Mic size={10} className="text-white/30" />
      case 'ai-suggested':
        return <Sparkles size={10} className="text-indigo-400" />
      default:
        return null
    }
  }

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'text-red-400'
      case 'low':
        return 'text-white/20'
      default:
        return 'text-white/40'
    }
  }

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ ...springSmooth, delay: index * 0.02 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing
                hover:bg-white/5 transition-colors ${task.completed ? 'opacity-50' : ''}`}
    >
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
        <GripVertical size={12} className="text-white/30" />
      </div>

      {/* Checkbox */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center
                  transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-white/30 hover:border-indigo-500'
                  }`}
      >
        {task.completed && <Check size={10} className="text-white" />}
      </motion.button>

      {/* Content */}
      <span className={`flex-1 text-sm truncate ${
        task.completed ? 'line-through text-white/40' : 'text-white'
      }`}>
        {task.content}
      </span>

      {/* Indicators */}
      <div className="flex items-center gap-1">
        {task.priority !== 'medium' && (
          <Flag size={10} className={getPriorityColor()} />
        )}
        {getSourceIcon()}
      </div>

      {/* Delete button */}
      <AnimatePresence>
        {isHovered && !task.completed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            whileHover={{ scale: 1.1 }}
            className="p-1 rounded text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </motion.button>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

// Type declarations
declare global {
  interface Window {
    pulse?: {
      taskWindow?: {
        hide?: () => void
        minimize?: () => void
        newSprint?: () => void
      }
    } & Window['pulse']
  }
}
