import React, { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Image, FileText, File, X, AlertCircle } from "lucide-react"

export interface DroppedFile {
  id: string
  file: File
  type: "image" | "text" | "code" | "document" | "other"
  preview?: string
  content?: string
  error?: string
}

interface DropZoneProps {
  onFilesDropped: (files: DroppedFile[]) => void
  onFileRemoved?: (fileId: string) => void
  files?: DroppedFile[]
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
  children?: React.ReactNode
}

// File type detection
const FILE_TYPE_MAP: Record<string, DroppedFile["type"]> = {
  // Images
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "image",

  // Text/Code
  "text/plain": "text",
  "text/markdown": "text",
  "text/html": "code",
  "text/css": "code",
  "text/javascript": "code",
  "application/javascript": "code",
  "application/typescript": "code",
  "application/json": "code",
  "application/xml": "code",

  // Documents
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document"
}

// File extension to type mapping
const EXTENSION_TYPE_MAP: Record<string, DroppedFile["type"]> = {
  // Code files
  ".js": "code",
  ".ts": "code",
  ".tsx": "code",
  ".jsx": "code",
  ".py": "code",
  ".rb": "code",
  ".go": "code",
  ".rs": "code",
  ".java": "code",
  ".c": "code",
  ".cpp": "code",
  ".h": "code",
  ".css": "code",
  ".scss": "code",
  ".html": "code",
  ".vue": "code",
  ".svelte": "code",
  ".json": "code",
  ".yaml": "code",
  ".yml": "code",
  ".xml": "code",
  ".sql": "code",
  ".sh": "code",
  ".bash": "code",
  ".zsh": "code",

  // Text files
  ".txt": "text",
  ".md": "text",
  ".markdown": "text",
  ".rst": "text",
  ".log": "text",

  // Images
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".gif": "image",
  ".webp": "image",
  ".svg": "image",
  ".ico": "image",

  // Documents
  ".pdf": "document",
  ".doc": "document",
  ".docx": "document"
}

function getFileType(file: File): DroppedFile["type"] {
  // Check MIME type first
  if (FILE_TYPE_MAP[file.type]) {
    return FILE_TYPE_MAP[file.type]
  }

  // Check extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (ext && EXTENSION_TYPE_MAP[ext]) {
    return EXTENSION_TYPE_MAP[ext]
  }

  return "other"
}

async function processFile(file: File): Promise<DroppedFile> {
  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const type = getFileType(file)

  const droppedFile: DroppedFile = {
    id,
    file,
    type
  }

  try {
    if (type === "image") {
      // Create preview URL for images
      droppedFile.preview = URL.createObjectURL(file)
    } else if (type === "text" || type === "code") {
      // Read text content
      const text = await file.text()
      droppedFile.content = text
      // Preview first 500 chars
      droppedFile.preview = text.slice(0, 500) + (text.length > 500 ? "..." : "")
    }
  } catch (error) {
    droppedFile.error = "Failed to read file"
  }

  return droppedFile
}

export function DropZone({
  onFilesDropped,
  onFileRemoved,
  files = [],
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes,
  className = "",
  children
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)
  const dragCounter = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview && f.type === "image") {
          URL.revokeObjectURL(f.preview)
        }
      })
    }
  }, [files])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`
      }

      if (acceptedTypes && acceptedTypes.length > 0) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase()
        const isAccepted =
          acceptedTypes.includes(file.type) ||
          acceptedTypes.includes(ext || "")

        if (!isAccepted) {
          return "File type not supported"
        }
      }

      return null
    },
    [maxFileSize, acceptedTypes]
  )

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const filesArray = Array.from(fileList)
      const remainingSlots = maxFiles - files.length

      if (filesArray.length > remainingSlots) {
        setDragError(`Can only add ${remainingSlots} more file(s)`)
        setTimeout(() => setDragError(null), 3000)
        return
      }

      const processedFiles: DroppedFile[] = []

      for (const file of filesArray) {
        const error = validateFile(file)
        if (error) {
          setDragError(error)
          setTimeout(() => setDragError(null), 3000)
          continue
        }

        const processed = await processFile(file)
        processedFiles.push(processed)
      }

      if (processedFiles.length > 0) {
        onFilesDropped(processedFiles)
      }
    },
    [files.length, maxFiles, validateFile, onFilesDropped]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounter.current = 0

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
        e.target.value = "" // Reset input
      }
    },
    [handleFiles]
  )

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        accept={acceptedTypes?.join(",")}
        className="hidden"
      />

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center
                       bg-indigo-500/10 border-2 border-dashed border-indigo-500/50 rounded-2xl"
          >
            <div className="text-center">
              <Upload className="mx-auto mb-2 text-indigo-400" size={32} />
              <p className="text-white font-medium">Drop files here</p>
              <p className="text-white/50 text-sm">Images, text, or code files</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 z-50 p-2"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-sm text-red-400">{dragError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children (the actual content) */}
      {children}

      {/* File preview area */}
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => onFileRemoved?.(file.id)}
            />
          ))}
        </div>
      )}

      {/* Add file button (when children exist) */}
      {files.length < maxFiles && (
        <button
          onClick={openFilePicker}
          className="mt-2 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/70
                     bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} />
          Add file
        </button>
      )}
    </div>
  )
}

// Individual file preview component
function FilePreview({
  file,
  onRemove
}: {
  file: DroppedFile
  onRemove: () => void
}) {
  const icons = {
    image: <Image size={16} className="text-green-400" />,
    text: <FileText size={16} className="text-blue-400" />,
    code: <FileText size={16} className="text-purple-400" />,
    document: <File size={16} className="text-orange-400" />,
    other: <File size={16} className="text-white/50" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      {file.type === "image" && file.preview ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
          <img
            src={file.preview}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          {icons[file.type]}
          <div className="max-w-[120px]">
            <p className="text-xs text-white truncate">{file.file.name}</p>
            <p className="text-[10px] text-white/40">
              {formatFileSize(file.file.size)}
            </p>
          </div>
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500/80 text-white
                   opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
      >
        <X size={10} />
      </button>

      {/* Error indicator */}
      {file.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400" />
        </div>
      )}
    </motion.div>
  )
}

// Utility function
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB"
  return (bytes / 1024 / 1024).toFixed(1) + " MB"
}

// Hook for easy integration
export function useDropZone(options: {
  maxFiles?: number
  maxFileSize?: number
  onFilesAdded?: (files: DroppedFile[]) => void
}) {
  const [files, setFiles] = useState<DroppedFile[]>([])

  const addFiles = useCallback(
    (newFiles: DroppedFile[]) => {
      setFiles((prev) => {
        const updated = [...prev, ...newFiles].slice(0, options.maxFiles || 5)
        options.onFilesAdded?.(updated)
        return updated
      })
    },
    [options]
  )

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview && file.type === "image") {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }, [])

  const clearFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.preview && f.type === "image") {
        URL.revokeObjectURL(f.preview)
      }
    })
    setFiles([])
  }, [files])

  return {
    files,
    addFiles,
    removeFile,
    clearFiles
  }
}

// Format dropped files for API context
export function formatFilesForContext(files: DroppedFile[]): string {
  if (files.length === 0) return ""

  const parts: string[] = []

  for (const file of files) {
    if (file.type === "text" || file.type === "code") {
      const lang = file.file.name.split(".").pop() || "text"
      parts.push(`File: ${file.file.name}\n\`\`\`${lang}\n${file.content}\n\`\`\``)
    } else if (file.type === "image") {
      parts.push(`[Image attached: ${file.file.name}]`)
    } else {
      parts.push(`[File attached: ${file.file.name}]`)
    }
  }

  return parts.join("\n\n")
}
