import type { Message, MessageResponse } from "~/types"

// Service worker initialization
console.log("GhostBar background service worker initialized")

// Handle extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("GhostBar installed")
    // Could open onboarding tab here if needed
  }
})

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      })

    // Return true to indicate async response
    return true
  }
)

async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  switch (message.type) {
    case "EXECUTE_ACTION":
      return handleExecuteAction(
        message.payload as { handler: string; payload?: Record<string, unknown> },
        sender.tab?.id
      )

    case "GET_CLIPBOARD":
      return handleGetClipboard()

    case "ANALYTICS_EVENT":
      return handleAnalytics(message.payload)

    default:
      return { success: false, error: "Unknown message type" }
  }
}

async function handleExecuteAction(
  payload: { handler: string; payload?: Record<string, unknown> },
  tabId?: number
): Promise<MessageResponse> {
  const { handler, payload: actionPayload } = payload

  switch (handler) {
    case "open_url":
      if (actionPayload?.url) {
        await chrome.tabs.create({ url: actionPayload.url as string })
      }
      break

    case "copy_text":
      if (tabId && actionPayload?.text) {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (text: string) => navigator.clipboard.writeText(text),
          args: [actionPayload.text as string]
        })
      }
      break

    case "summarize":
      // Could trigger summarization in content script
      if (tabId) {
        await chrome.tabs.sendMessage(tabId, { type: "SUMMARIZE_PAGE" })
      }
      break

    case "save_bookmark":
      if (actionPayload?.url && actionPayload?.title) {
        await chrome.bookmarks.create({
          title: actionPayload.title as string,
          url: actionPayload.url as string
        })
      }
      break

    default:
      console.log("Unknown action handler:", handler)
  }

  return { success: true }
}

async function handleGetClipboard(): Promise<MessageResponse> {
  // Note: Clipboard access from background is limited
  // Most clipboard operations should happen in content scripts
  return {
    success: false,
    error: "Clipboard access should be requested from content script"
  }
}

async function handleAnalytics(payload: unknown): Promise<MessageResponse> {
  // Placeholder for analytics handling
  console.log("Analytics event:", payload)
  return { success: true }
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle_visibility") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_VISIBILITY" })
    }
  }
})

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ghostbar-analyze",
    title: "Analyze with GhostBar",
    contexts: ["selection", "page"]
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ghostbar-analyze" && tab?.id) {
    await chrome.tabs.sendMessage(tab.id, {
      type: "ANALYZE_SELECTION",
      payload: { text: info.selectionText }
    })
  }
})
