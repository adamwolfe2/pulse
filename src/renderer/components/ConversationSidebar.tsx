/**
 * Conversation Sidebar Component
 *
 * Displays a list of conversations with search, grouping, and management features.
 *
 * Accessibility: Implements WCAG 2.1 AA compliance with focus trapping,
 * keyboard navigation, ARIA labels, and screen reader support.
 */

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Clock,
  ChevronLeft,
  X
} from "lucide-react"
import { useReducedMotion, useEscapeKey, useAnnounce } from "../hooks/useAccessibility"
import { ANIMATIONS } from "../../shared/constants"

interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
  messageCount?: number
  lastMessage?: string
}

interface ConversationSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

export function ConversationSidebar({
  isOpen,
  onClose,
  currentConversationId,
  onSelectConversation,
  onNewConversation
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const prefersReducedMotion = useReducedMotion()
  const { announce } = useAnnounce()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Close on Escape key
  useEscapeKey(onClose, isOpen)

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus search input when opening
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      // Restore focus when closing
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Load conversations
  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await window.pulse?.db?.conversations?.list({
        includeArchived: showArchived,
        pinnedFirst: true,
        search: searchQuery || undefined
      })
      const convs = result || []
      setConversations(convs)
      announce(`${convs.length} conversation${convs.length !== 1 ? 's' : ''} found`)
    } catch (error) {
      console.error("Failed to load conversations:", error)
      announce("Failed to load conversations")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, showArchived, announce])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen, loadConversations])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) loadConversations()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, loadConversations])

  const handlePin = async (id: string, currentPinned: boolean) => {
    try {
      await window.pulse?.db?.conversations?.update(id, { pinned: !currentPinned })
      announce(currentPinned ? "Conversation unpinned" : "Conversation pinned")
      loadConversations()
    } catch (error) {
      console.error("Failed to pin conversation:", error)
      announce("Failed to update conversation")
    }
    setMenuOpenFor(null)
  }

  const handleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await window.pulse?.db?.conversations?.update(id, { archived: !currentArchived })
      announce(currentArchived ? "Conversation restored" : "Conversation archived")
      loadConversations()
    } catch (error) {
      console.error("Failed to archive conversation:", error)
      announce("Failed to update conversation")
    }
    setMenuOpenFor(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await window.pulse?.db?.conversations?.delete(id)
      announce("Conversation deleted")
      if (currentConversationId === id) {
        onNewConversation()
      }
      loadConversations()
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      announce("Failed to delete conversation")
    }
    setMenuOpenFor(null)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Flatten conversations for keyboard navigation
  const flatConversations = React.useMemo(() => {
    return conversations
  }, [conversations])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (flatConversations.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, flatConversations.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case "Enter":
        if (focusedIndex >= 0 && focusedIndex < flatConversations.length) {
          onSelectConversation(flatConversations[focusedIndex].id)
          onClose()
        }
        break
      case "Home":
        e.preventDefault()
        setFocusedIndex(0)
        break
      case "End":
        e.preventDefault()
        setFocusedIndex(flatConversations.length - 1)
        break
    }
  }, [flatConversations, focusedIndex, onSelectConversation, onClose])

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const groups: { label: string; conversations: Conversation[] }[] = []
    const pinned: Conversation[] = []
    const today: Conversation[] = []
    const yesterday: Conversation[] = []
    const thisWeek: Conversation[] = []
    const older: Conversation[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

    conversations.forEach(conv => {
      if (conv.pinned) {
        pinned.push(conv)
      } else if (conv.updatedAt >= todayStart) {
        today.push(conv)
      } else if (conv.updatedAt >= yesterdayStart) {
        yesterday.push(conv)
      } else if (conv.updatedAt >= weekStart) {
        thisWeek.push(conv)
      } else {
        older.push(conv)
      }
    })

    if (pinned.length) groups.push({ label: "Pinned", conversations: pinned })
    if (today.length) groups.push({ label: "Today", conversations: today })
    if (yesterday.length) groups.push({ label: "Yesterday", conversations: yesterday })
    if (thisWeek.length) groups.push({ label: "This Week", conversations: thisWeek })
    if (older.length) groups.push({ label: "Older", conversations: older })

    return groups
  }, [conversations])

  // Animation config
  const sidebarAnimation = prefersReducedMotion
    ? {}
    : { type: "spring" as const, damping: 25, stiffness: 300 }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : ANIMATIONS.DURATION.FAST }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={prefersReducedMotion ? { opacity: 0 } : { x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: -300, opacity: 0 }}
            transition={sidebarAnimation}
            className="fixed left-0 top-0 h-full w-[300px] z-50 flex flex-col"
            style={{
              background: "rgba(20, 20, 25, 0.95)",
              backdropFilter: "blur(40px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)"
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Conversations"
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 id="sidebar-title" className="text-white font-semibold">
                  Conversations
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Close sidebar"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-white/30 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  aria-label="Search conversations"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-white/40 hover:text-white/70 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* New conversation button */}
              <button
                onClick={() => {
                  onNewConversation()
                  onClose()
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm
                         hover:opacity-90 transition-opacity
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#14141a]"
                aria-label="Start new conversation"
              >
                <Plus size={16} aria-hidden="true" />
                New Conversation
              </button>
            </div>

            {/* Conversation list */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto py-2"
              role="listbox"
              aria-label="Conversation list"
              aria-activedescendant={focusedIndex >= 0 ? `conv-${flatConversations[focusedIndex]?.id}` : undefined}
            >
              {isLoading ? (
                <div className="space-y-2 px-4" role="status" aria-label="Loading conversations">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse">
                      <div
                        className="h-16 rounded-lg"
                        style={{ background: "rgba(255, 255, 255, 0.05)" }}
                      />
                    </div>
                  ))}
                  <span className="sr-only">Loading conversations...</span>
                </div>
              ) : groupedConversations.length === 0 ? (
                <div
                  className="text-center py-8 px-4"
                  role="status"
                  aria-label={searchQuery ? "No conversations found" : "No conversations yet"}
                >
                  <MessageSquare size={32} className="mx-auto text-white/20 mb-3" aria-hidden="true" />
                  <p className="text-white/40 text-sm">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                groupedConversations.map(group => (
                  <div key={group.label} className="mb-2" role="group" aria-label={group.label}>
                    <div className="px-4 py-1.5">
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {group.conversations.map(conv => {
                      const globalIndex = flatConversations.findIndex(c => c.id === conv.id)
                      return (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={conv.id === currentConversationId}
                          isFocused={globalIndex === focusedIndex}
                          menuOpen={menuOpenFor === conv.id}
                          onSelect={() => {
                            onSelectConversation(conv.id)
                            onClose()
                          }}
                          onMenuToggle={() => setMenuOpenFor(menuOpenFor === conv.id ? null : conv.id)}
                          onPin={() => handlePin(conv.id, conv.pinned)}
                          onArchive={() => handleArchive(conv.id, conv.archived)}
                          onDelete={() => handleDelete(conv.id)}
                          formatDate={formatDate}
                          prefersReducedMotion={prefersReducedMotion}
                        />
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${showArchived ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70 hover:bg-white/5"}`}
                aria-pressed={showArchived}
              >
                <Archive size={16} aria-hidden="true" />
                {showArchived ? "Hide Archived" : "Show Archived"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ConversationItem({
  conversation,
  isActive,
  isFocused,
  menuOpen,
  onSelect,
  onMenuToggle,
  onPin,
  onArchive,
  onDelete,
  formatDate,
  prefersReducedMotion
}: {
  conversation: Conversation
  isActive: boolean
  isFocused: boolean
  menuOpen: boolean
  onSelect: () => void
  onMenuToggle: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
  formatDate: (timestamp: number) => string
  prefersReducedMotion: boolean
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuToggle()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen, onMenuToggle])

  return (
    <div className="relative px-2" ref={menuRef}>
      <button
        id={`conv-${conversation.id}`}
        onClick={onSelect}
        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                   focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500
          ${isActive
            ? "bg-white/10 text-white"
            : isFocused
              ? "bg-white/5 text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        role="option"
        aria-selected={isActive}
        aria-label={`${conversation.title}${conversation.pinned ? ", pinned" : ""}${conversation.archived ? ", archived" : ""}, ${formatDate(conversation.updatedAt)}`}
      >
        <MessageSquare size={16} className="flex-shrink-0 mt-0.5 text-white/40" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate flex-1">
              {conversation.title}
            </span>
            {conversation.pinned && (
              <Pin size={12} className="flex-shrink-0 text-indigo-400" aria-hidden="true" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={10} className="text-white/30" aria-hidden="true" />
            <span className="text-xs text-white/40">
              {formatDate(conversation.updatedAt)}
            </span>
            {conversation.messageCount !== undefined && (
              <span className="text-xs text-white/30">
                · {conversation.messageCount} msg{conversation.messageCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMenuToggle()
          }}
          className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Conversation options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <MoreHorizontal size={14} aria-hidden="true" />
        </button>
      </button>

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.1 }}
            className="absolute right-4 top-full mt-1 z-10 py-1 rounded-lg min-w-[140px]"
            style={{
              background: "rgba(30, 30, 35, 0.98)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
            }}
            role="menu"
            aria-label="Conversation actions"
          >
            <button
              onClick={onPin}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors
                       focus:outline-none focus:bg-white/10"
              role="menuitem"
            >
              <Pin size={14} aria-hidden="true" />
              {conversation.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={onArchive}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors
                       focus:outline-none focus:bg-white/10"
              role="menuitem"
            >
              <Archive size={14} aria-hidden="true" />
              {conversation.archived ? "Unarchive" : "Archive"}
            </button>
            <div className="my-1 border-t border-white/5" role="separator" />
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors
                       focus:outline-none focus:bg-red-500/10"
              role="menuitem"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
