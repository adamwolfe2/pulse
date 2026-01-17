import type { PageContext, TriggerType } from "~/types"
import { TRIGGER_PATTERNS } from "./constants"

export function detectTriggerType(url: string): TriggerType {
  for (const [type, patterns] of Object.entries(TRIGGER_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return type as TriggerType
      }
    }
  }

  // Check for long content as fallback
  const wordCount = document.body?.innerText?.split(/\s+/).length || 0
  if (wordCount > 1000) {
    return "long_article"
  }

  return "idle"
}

export function extractPageContext(): PageContext {
  const url = window.location.href
  const domain = window.location.hostname
  const title = document.title

  // Extract meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  const description = metaDescription?.getAttribute("content") || undefined

  // Extract headings
  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent?.trim())
    .filter((h): h is string => !!h)
    .slice(0, 10)

  // Extract main content
  const mainContent = extractMainContent()

  // Extract code blocks
  const codeBlocks = Array.from(document.querySelectorAll("pre, code"))
    .map((el) => el.textContent?.trim())
    .filter((c): c is string => !!c && c.length > 20)
    .slice(0, 5)

  // Extract links
  const links = Array.from(document.querySelectorAll("a[href]"))
    .map((a) => a.getAttribute("href"))
    .filter((h): h is string => !!h && h.startsWith("http"))
    .slice(0, 20)

  // Extract metadata
  const metadata = extractMetadata()

  // Calculate reading time
  const wordCount = mainContent.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200) // 200 WPM average

  // Detect language
  const htmlLang = document.documentElement.lang
  const language = htmlLang || "en"

  const contentType = detectTriggerType(url)

  return {
    url,
    domain,
    title,
    description,
    contentType,
    extractedContent: {
      headings,
      mainText: mainContent,
      codeBlocks,
      links,
      metadata
    },
    readingTime,
    language
  }
}

function extractMainContent(): string {
  // Try common content selectors
  const contentSelectors = [
    "article",
    "[role='main']",
    "main",
    ".post-content",
    ".article-content",
    ".entry-content",
    "#content",
    ".content",
    ".readme",
    ".markdown-body"
  ]

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector)
    if (element && element.textContent) {
      return cleanText(element.textContent)
    }
  }

  // Fallback to body content
  const body = document.body
  if (body) {
    // Remove script and style content
    const clone = body.cloneNode(true) as HTMLElement
    clone.querySelectorAll("script, style, nav, footer, header, aside").forEach((el) => el.remove())
    return cleanText(clone.textContent || "")
  }

  return ""
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim()
    .slice(0, 5000)
}

function extractMetadata(): Record<string, string> {
  const metadata: Record<string, string> = {}

  // Open Graph
  const ogTags = document.querySelectorAll('meta[property^="og:"]')
  ogTags.forEach((tag) => {
    const property = tag.getAttribute("property")?.replace("og:", "")
    const content = tag.getAttribute("content")
    if (property && content) {
      metadata[`og_${property}`] = content
    }
  })

  // Twitter Cards
  const twitterTags = document.querySelectorAll('meta[name^="twitter:"]')
  twitterTags.forEach((tag) => {
    const name = tag.getAttribute("name")?.replace("twitter:", "")
    const content = tag.getAttribute("content")
    if (name && content) {
      metadata[`twitter_${name}`] = content
    }
  })

  // Schema.org JSON-LD
  const jsonLd = document.querySelector('script[type="application/ld+json"]')
  if (jsonLd?.textContent) {
    try {
      const data = JSON.parse(jsonLd.textContent)
      if (data["@type"]) {
        metadata["schema_type"] = data["@type"]
      }
    } catch {
      // Ignore parse errors
    }
  }

  return metadata
}

// GitHub-specific extractor
export function extractGitHubContext(): Record<string, string> {
  const result: Record<string, string> = {}

  // Repository name
  const repoName = document.querySelector('[itemprop="name"] a')
  if (repoName) {
    result.repoName = repoName.textContent?.trim() || ""
  }

  // Description
  const description = document.querySelector('[itemprop="about"]')
  if (description) {
    result.description = description.textContent?.trim() || ""
  }

  // Stars
  const stars = document.querySelector("#repo-stars-counter-star")
  if (stars) {
    result.stars = stars.textContent?.trim() || "0"
  }

  // Language
  const language = document.querySelector('[itemprop="programmingLanguage"]')
  if (language) {
    result.language = language.textContent?.trim() || ""
  }

  return result
}
