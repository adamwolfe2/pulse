import React, { useState, useEffect, useCallback } from "react"
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
  ChevronLeft
} from "lucide-react"

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

  // Load conversations
  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await window.pulse?.db?.conversations?.list({
        includeArchived: showArchived,
        pinnedFirst: true,
        search: searchQuery || undefined
      })
      setConversations(result || [])
    } catch (error) {
      console.error("Failed to load conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, showArchived])

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
  }, [searchQuery])

  const handlePin = async (id: string, currentPinned: boolean) => {
    try {
      await window.pulse?.db?.conversations?.update(id, { pinned: !currentPinned })
      loadConversations()
    } catch (error) {
      console.error("Failed to pin conversation:", error)
    }
    setMenuOpenFor(null)
  }

  const handleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await window.pulse?.db?.conversations?.update(id, { archived: !currentArchived })
      loadConversations()
    } catch (error) {
      console.error("Failed to archive conversation:", error)
    }
    setMenuOpenFor(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await window.pulse?.db?.conversations?.delete(id)
      if (currentConversationId === id) {
        onNewConversation()
      }
      loadConversations()
    } catch (error) {
      console.error("Failed to delete conversation:", error)
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-[300px] z-50 flex flex-col"
            style={{
              background: "rgba(20, 20, 25, 0.95)",
              backdropFilter: "blur(40px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Conversations</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-white/30 text-sm
                           focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              {/* New conversation button */}
              <button
                onClick={() => {
                  onNewConversation()
                  onClose()
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium text-sm
                         hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                New Conversation
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full"
                  />
                </div>
              ) : groupedConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare size={32} className="mx-auto text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                groupedConversations.map(group => (
                  <div key={group.label} className="mb-2">
                    <div className="px-4 py-1.5">
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {group.conversations.map(conv => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === currentConversationId}
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
                      />
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors
                  ${showArchived ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70 hover:bg-white/5"}`}
              >
                <Archive size={16} />
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
  menuOpen,
  onSelect,
  onMenuToggle,
  onPin,
  onArchive,
  onDelete,
  formatDate
}: {
  conversation: Conversation
  isActive: boolean
  menuOpen: boolean
  onSelect: () => void
  onMenuToggle: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
  formatDate: (timestamp: number) => string
}) {
  return (
    <div className="relative px-2">
      <button
        onClick={onSelect}
        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
          ${isActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
      >
        <MessageSquare size={16} className="flex-shrink-0 mt-0.5 text-white/40" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate flex-1">
              {conversation.title}
            </span>
            {conversation.pinned && (
              <Pin size={12} className="flex-shrink-0 text-indigo-400" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={10} className="text-white/30" />
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
          className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
      </button>

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-4 top-full mt-1 z-10 py-1 rounded-lg min-w-[140px]"
            style={{
              background: "rgba(30, 30, 35, 0.98)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)"
            }}
          >
            <button
              onClick={onPin}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Pin size={14} />
              {conversation.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={onArchive}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Archive size={14} />
              {conversation.archived ? "Unarchive" : "Archive"}
            </button>
            <div className="my-1 border-t border-white/5" />
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
