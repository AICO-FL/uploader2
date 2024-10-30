import type { File } from "@/types/database"

interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFiles(
  files: File[],
  options: {
    maxFiles?: number
    maxSize?: number
    isAuthenticated?: boolean
  }
): ValidationResult {
  const {
    maxFiles = 5,
    maxSize = 100 * 1024 * 1024, // 100MB default for guests
    isAuthenticated = false,
  } = options

  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Maximum ${maxFiles} files allowed`,
    }
  }

  const oversizedFiles = files.filter((file) => file.size > maxSize)
  if (oversizedFiles.length > 0) {
    return {
      valid: false,
      error: `Maximum file size is ${formatBytes(maxSize)}`,
    }
  }

  return { valid: true }
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}