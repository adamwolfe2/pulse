import React, { memo, useRef, useEffect, useCallback, forwardRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  screenshot?: string
  timestamp: number
}

interface MessageListProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
}

// Memoized individual message component
const MessageBubble = memo(function MessageBubble({
  message
}: {
  message: Message
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.role === "user"
            ? "bg-blue-500/30 text-white"
            : "bg-white/10 text-white/90"
        }`}
      >
        {message.screenshot && (
          <img
            src={message.screenshot}
            alt="Screenshot"
            className="rounded-lg mb-2 max-h-32 object-contain"
            loading="lazy"
          />
        )}
        {message.role === "assistant" ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - messages are immutable so we just compare IDs
  return prevProps.message.id === nextProps.message.id
})

// Streaming indicator component
const StreamingBubble = memo(function StreamingBubble({
  content
}: {
  content: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/10 text-white/90">
        <MarkdownRenderer content={content} />
        <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1" />
      </div>
    </motion.div>
  )
})

// Loading indicator component
const LoadingIndicator = memo(function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="rounded-2xl px-4 py-3 bg-white/10">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </motion.div>
  )
})

// Main MessageList component
export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList({ messages, streamingContent, isLoading }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isAutoScrollingRef = useRef(true)

    // Handle scroll to detect if user has scrolled up
    const handleScroll = useCallback(() => {
      if (!containerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100

      isAutoScrollingRef.current = isAtBottom
    }, [])

    // Auto-scroll to bottom when new content arrives
    useEffect(() => {
      if (isAutoScrollingRef.current && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }, [messages, streamingContent])

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* Streaming response */}
        {streamingContent && <StreamingBubble content={streamingContent} />}

        {/* Loading indicator */}
        {isLoading && !streamingContent && <LoadingIndicator />}

        {/* Scroll anchor */}
        <div ref={ref} />
      </div>
    )
  }
)

// Export individual components for flexibility
export { MessageBubble, StreamingBubble, LoadingIndicator }
