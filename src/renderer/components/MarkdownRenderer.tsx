import React, { useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import { Check, Copy, Terminal } from "lucide-react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  java: "Java",
  cpp: "C++",
  c: "C",
  cs: "C#",
  csharp: "C#",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  xml: "XML",
  md: "Markdown",
  markdown: "Markdown",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  powershell: "PowerShell",
  dockerfile: "Dockerfile",
  graphql: "GraphQL",
  regex: "Regex",
}

function CodeBlock({
  code,
  language
}: {
  code: string
  language: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [code])

  const displayLanguage = LANGUAGE_NAMES[language] || language || "Code"

  return (
    <div className="group relative my-3 rounded-xl overflow-hidden bg-[#1e1e2e] border border-white/5">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-white/40" />
          <span className="text-xs text-white/50 font-medium">{displayLanguage}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all
            ${copied
              ? "bg-green-500/20 text-green-400"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
            }`}
        >
          {copied ? (
            <>
              <Check size={12} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <Highlight
        theme={themes.vsDark}
        code={code.trim()}
        language={language || "text"}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto p-4 text-sm leading-relaxed`}
            style={{ ...style, background: "transparent", margin: 0 }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell pr-4 text-right text-white/20 select-none text-xs">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-white/10 text-pink-300 text-sm font-mono">
      {children}
    </code>
  )
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const code = String(children).replace(/\n$/, "")

            if (!inline && (match || code.includes("\n"))) {
              return <CodeBlock code={code} language={match ? match[1] : ""} />
            }

            return <InlineCode {...props}>{children}</InlineCode>
          },

          // Paragraphs
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          },

          // Headings
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
          },
          h4({ children }) {
            return <h4 className="text-sm font-semibold mb-2 mt-3 first:mt-0">{children}</h4>
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-white/20 pl-4 my-3 text-white/70 italic">
                {children}
              </blockquote>
            )
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
              >
                {children}
              </a>
            )
          },

          // Bold and italic
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>
          },
          em({ children }) {
            return <em className="italic">{children}</em>
          },

          // Horizontal rule
          hr() {
            return <hr className="my-4 border-white/10" />
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className="border-b border-white/20">{children}</thead>
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>
          },
          tr({ children }) {
            return <tr className="border-b border-white/5">{children}</tr>
          },
          th({ children }) {
            return (
              <th className="text-left px-3 py-2 font-semibold text-white/80">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="px-3 py-2 text-white/70">{children}</td>
          },

          // Images
          img({ src, alt }) {
            return (
              <img
                src={src}
                alt={alt}
                className="max-w-full rounded-lg my-3"
                loading="lazy"
              />
            )
          },

          // Strikethrough
          del({ children }) {
            return <del className="line-through text-white/50">{children}</del>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
