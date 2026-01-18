/**
 * Key Vault Service
 *
 * Provides secure storage for sensitive data like API keys
 * using Electron's safeStorage API for OS-level encryption.
 */

import { safeStorage, app } from "electron"
import * as fs from "fs"
import * as path from "path"

interface VaultData {
  [key: string]: string
}

class KeyVaultService {
  private vaultPath: string
  private cache: VaultData = {}
  private initialized = false

  constructor() {
    this.vaultPath = path.join(app.getPath("userData"), "vault.enc")
  }

  /**
   * Initialize the vault, loading existing data
   */
  initialize(): void {
    if (this.initialized) return

    if (!safeStorage.isEncryptionAvailable()) {
      console.warn("[KeyVault] Encryption not available, using fallback storage")
    }

    this.loadVault()
    this.initialized = true
    console.log("[KeyVault] Initialized")
  }

  /**
   * Check if encryption is available
   */
  isSecure(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  /**
   * Store a key-value pair securely
   */
  set(key: string, value: string): void {
    this.ensureInitialized()
    this.cache[key] = value
    this.saveVault()
  }

  /**
   * Retrieve a value by key
   */
  get(key: string): string | null {
    this.ensureInitialized()
    return this.cache[key] || null
  }

  /**
   * Delete a key
   */
  delete(key: string): boolean {
    this.ensureInitialized()
    if (key in this.cache) {
      delete this.cache[key]
      this.saveVault()
      return true
    }
    return false
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    this.ensureInitialized()
    return key in this.cache
  }

  /**
   * Get all keys (not values)
   */
  keys(): string[] {
    this.ensureInitialized()
    return Object.keys(this.cache)
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.ensureInitialized()
    this.cache = {}
    this.saveVault()
  }

  /**
   * Load vault from disk
   */
  private loadVault(): void {
    try {
      if (!fs.existsSync(this.vaultPath)) {
        this.cache = {}
        return
      }

      const encryptedData = fs.readFileSync(this.vaultPath)

      if (safeStorage.isEncryptionAvailable()) {
        const decrypted = safeStorage.decryptString(encryptedData)
        this.cache = JSON.parse(decrypted)
      } else {
        // Fallback: data is stored as base64 (not secure, but functional)
        const decoded = Buffer.from(encryptedData.toString(), "base64").toString("utf8")
        this.cache = JSON.parse(decoded)
      }
    } catch (error) {
      console.error("[KeyVault] Failed to load vault:", error)
      this.cache = {}
    }
  }

  /**
   * Save vault to disk
   */
  private saveVault(): void {
    try {
      const jsonData = JSON.stringify(this.cache)

      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(jsonData)
        fs.writeFileSync(this.vaultPath, encrypted)
      } else {
        // Fallback: store as base64 (not secure, but functional)
        const encoded = Buffer.from(jsonData).toString("base64")
        fs.writeFileSync(this.vaultPath, encoded)
      }
    } catch (error) {
      console.error("[KeyVault] Failed to save vault:", error)
    }
  }

  /**
   * Ensure the vault is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize()
    }
  }

  /**
   * Migrate data from localStorage (one-time migration)
   * Call this on first run to migrate existing API keys
   */
  migrateFromLegacy(legacyData: Record<string, string>): void {
    this.ensureInitialized()
    let migrated = false

    for (const [key, value] of Object.entries(legacyData)) {
      if (value && !this.has(key)) {
        this.cache[key] = value
        migrated = true
        console.log(`[KeyVault] Migrated key: ${key}`)
      }
    }

    if (migrated) {
      this.saveVault()
    }
  }
}

// Singleton instance
export const keyVault = new KeyVaultService()

// Convenience functions
export function initializeKeyVault(): void {
  keyVault.initialize()
}

export function getSecureValue(key: string): string | null {
  return keyVault.get(key)
}

export function setSecureValue(key: string, value: string): void {
  keyVault.set(key, value)
}

export function deleteSecureValue(key: string): boolean {
  return keyVault.delete(key)
}

export function isVaultSecure(): boolean {
  return keyVault.isSecure()
}
