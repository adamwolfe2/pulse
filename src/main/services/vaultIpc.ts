/**
 * Vault IPC Handlers
 *
 * Exposes secure key vault operations to the renderer process via IPC.
 */

import { ipcMain } from "electron"
import {
  keyVault,
  getSecureValue,
  setSecureValue,
  deleteSecureValue,
  isVaultSecure,
} from "./keyVault"

/**
 * Register all vault IPC handlers
 */
export function registerVaultHandlers(): void {
  // Get a value from the vault
  ipcMain.handle("vault:get", (_, key: string) => {
    return getSecureValue(key)
  })

  // Set a value in the vault
  ipcMain.handle("vault:set", (_, key: string, value: string) => {
    setSecureValue(key, value)
    return true
  })

  // Delete a value from the vault
  ipcMain.handle("vault:delete", (_, key: string) => {
    return deleteSecureValue(key)
  })

  // Check if a key exists
  ipcMain.handle("vault:has", (_, key: string) => {
    return keyVault.has(key)
  })

  // Check if vault is using secure encryption
  ipcMain.handle("vault:isSecure", () => {
    return isVaultSecure()
  })

  // Migrate legacy data from localStorage
  ipcMain.handle("vault:migrate", (_, legacyData: Record<string, string>) => {
    keyVault.migrateFromLegacy(legacyData)
    return true
  })

  console.log("[IPC] Vault handlers registered")
}
