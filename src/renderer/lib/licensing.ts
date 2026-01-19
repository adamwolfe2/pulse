// Licensing & Payment System
// Manages license validation, trials, and feature gating

export type LicenseType = "trial" | "personal" | "pro" | "team"
export type LicenseStatus = "active" | "expired" | "invalid" | "none"

export interface License {
  key: string
  type: LicenseType
  email: string
  name?: string
  activatedAt: number
  expiresAt: number | null // null = lifetime
  maxDevices: number
  features: LicenseFeature[]
}

export type LicenseFeature =
  | "unlimited_conversations"
  | "conversation_history"
  | "custom_commands"
  | "priority_models"
  | "export_data"
  | "team_sharing"
  | "custom_branding"
  | "api_access"

// Feature sets by license type
const FEATURE_SETS: Record<LicenseType, LicenseFeature[]> = {
  trial: ["conversation_history"],
  personal: [
    "unlimited_conversations",
    "conversation_history",
    "custom_commands",
    "export_data"
  ],
  pro: [
    "unlimited_conversations",
    "conversation_history",
    "custom_commands",
    "priority_models",
    "export_data",
    "api_access"
  ],
  team: [
    "unlimited_conversations",
    "conversation_history",
    "custom_commands",
    "priority_models",
    "export_data",
    "team_sharing",
    "custom_branding",
    "api_access"
  ]
}

// Limits by license type
const LIMITS: Record<LicenseType, { conversations: number; messagesPerDay: number }> = {
  trial: { conversations: 10, messagesPerDay: 50 },
  personal: { conversations: -1, messagesPerDay: -1 }, // -1 = unlimited
  pro: { conversations: -1, messagesPerDay: -1 },
  team: { conversations: -1, messagesPerDay: -1 }
}

const LICENSE_STORAGE_KEY = "pulse_license"
const TRIAL_STORAGE_KEY = "pulse_trial"
const USAGE_STORAGE_KEY = "pulse_usage"

const TRIAL_DAYS = 7

// Initialize trial if needed
export function initializeTrial(): void {
  const existing = getTrialInfo()
  if (!existing) {
    const trial = {
      startedAt: Date.now(),
      expiresAt: Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000
    }
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial))
  }
}

// Get trial info
export function getTrialInfo(): { startedAt: number; expiresAt: number } | null {
  try {
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Check if trial is active
export function isTrialActive(): boolean {
  const trial = getTrialInfo()
  if (!trial) return false
  return Date.now() < trial.expiresAt
}

// Get trial days remaining
export function getTrialDaysRemaining(): number {
  const trial = getTrialInfo()
  if (!trial) return 0
  const remaining = trial.expiresAt - Date.now()
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}

// Get stored license
export function getStoredLicense(): License | null {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Store license
export function storeLicense(license: License): void {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license))
}

// Remove license
export function removeLicense(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY)
}

// Validate license key format (basic validation)
export function validateLicenseKeyFormat(key: string): boolean {
  // Format: PULSE-XXXX-XXXX-XXXX-XXXX
  return /^PULSE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(key)
}

// Activate license (mock implementation - replace with real API)
export async function activateLicense(key: string, email: string): Promise<{ success: boolean; license?: License; error?: string }> {
  // Validate format
  if (!validateLicenseKeyFormat(key)) {
    return { success: false, error: "Invalid license key format" }
  }

  // In production, this would call your license server
  // For now, we'll accept any valid format and create a personal license

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Determine license type from key prefix (mock logic)
  let type: LicenseType = "personal"
  if (key.includes("PRO")) type = "pro"
  if (key.includes("TEAM")) type = "team"

  const license: License = {
    key,
    type,
    email,
    activatedAt: Date.now(),
    expiresAt: null, // Lifetime for demo
    maxDevices: type === "team" ? 10 : 3,
    features: FEATURE_SETS[type]
  }

  storeLicense(license)
  return { success: true, license }
}

// Deactivate license
export async function deactivateLicense(): Promise<boolean> {
  const license = getStoredLicense()
  if (!license) return false

  // In production, call API to release the device slot
  await new Promise(resolve => setTimeout(resolve, 500))

  removeLicense()
  return true
}

// Get current license status
export function getLicenseStatus(): { status: LicenseStatus; license: License | null; type: LicenseType } {
  const license = getStoredLicense()

  if (license) {
    // Check if expired
    if (license.expiresAt && Date.now() > license.expiresAt) {
      return { status: "expired", license, type: license.type }
    }
    return { status: "active", license, type: license.type }
  }

  // Check trial
  if (isTrialActive()) {
    return {
      status: "active",
      license: null,
      type: "trial"
    }
  }

  return { status: "none", license: null, type: "trial" }
}

// Check if feature is available
export function hasFeature(feature: LicenseFeature): boolean {
  const { status, type } = getLicenseStatus()

  if (status !== "active") return false

  return FEATURE_SETS[type].includes(feature)
}

// Get usage limits
export function getUsageLimits(): { conversations: number; messagesPerDay: number } {
  const { type } = getLicenseStatus()
  return LIMITS[type]
}

// Track usage
interface UsageData {
  date: string
  conversationCount: number
  messageCount: number
}

export function getUsageData(): UsageData {
  const today = new Date().toISOString().split("T")[0]

  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as UsageData
      if (data.date === today) {
        return data
      }
    }
  } catch {
    // Ignore
  }

  // Reset for new day
  return { date: today, conversationCount: 0, messageCount: 0 }
}

export function incrementUsage(type: "conversation" | "message"): void {
  const usage = getUsageData()

  if (type === "conversation") {
    usage.conversationCount++
  } else {
    usage.messageCount++
  }

  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage))
}

// Check if action is allowed
export function canPerformAction(action: "send_message" | "create_conversation"): { allowed: boolean; reason?: string } {
  const { status } = getLicenseStatus()

  if (status === "none") {
    return { allowed: false, reason: "Trial expired. Please activate a license to continue." }
  }

  if (status === "expired") {
    return { allowed: false, reason: "License expired. Please renew to continue." }
  }

  const limits = getUsageLimits()
  const usage = getUsageData()

  if (action === "send_message" && limits.messagesPerDay > 0) {
    if (usage.messageCount >= limits.messagesPerDay) {
      return { allowed: false, reason: `Daily message limit reached (${limits.messagesPerDay}). Upgrade for unlimited messages.` }
    }
  }

  if (action === "create_conversation" && limits.conversations > 0) {
    if (usage.conversationCount >= limits.conversations) {
      return { allowed: false, reason: `Conversation limit reached (${limits.conversations}). Upgrade for unlimited conversations.` }
    }
  }

  return { allowed: true }
}

// Generate purchase URL
export function getPurchaseUrl(type: LicenseType = "personal"): string {
  // Replace with your actual purchase page
  return `https://pulse.app/purchase?plan=${type}`
}

// Price information
export const PRICING = {
  personal: {
    monthly: 9.99,
    yearly: 79.99,
    lifetime: 199
  },
  pro: {
    monthly: 19.99,
    yearly: 159.99,
    lifetime: 399
  },
  team: {
    monthly: 49.99, // per seat
    yearly: 399.99 // per seat
  }
}
