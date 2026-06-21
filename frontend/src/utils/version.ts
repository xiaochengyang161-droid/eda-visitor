import { ElMessageBox } from "element-plus"

/**
 * Compare two semantic version strings.
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareVersion(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number)
  const parts2 = v2.split(".").map(Number)
  const len = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < len; i++) {
    const a = parts1[i] ?? 0
    const b = parts2[i] ?? 0
    if (a > b) return 1
    if (a < b) return -1
  }
  return 0
}

export interface VersionInfo {
  version: string
  title: string
  content: string
  apkUrl: string
  forceUpdate: boolean
}

/**
 * Check for app update. Only works inside Tauri environment.
 * Compares current app version against the server's latest version.
 * Shows ElMessageBox if a newer version is available.
 */
export async function checkUpdate(): Promise<void> {
  try {
    const { getVersion } = await import("@tauri-apps/api/app")
    const currentVersion = await getVersion()

    const response = await fetch(
      "https://eda-visitor-api.dzsjxh526.workers.dev/app/version"
    )

    if (!response.ok) {
      console.warn("Version check failed:", response.status)
      return
    }

    const latest: VersionInfo = await response.json()

    // Only show update dialog if server version is strictly greater
    if (compareVersion(latest.version, currentVersion) <= 0) {
      return
    }

    const contentText = Array.isArray(latest.content)
      ? latest.content.join("\n")
      : latest.content

    if (latest.forceUpdate) {
      // Force update: cannot be dismissed
      await ElMessageBox.alert(
        contentText || "A required update is available.",
        "Update Required - " + latest.version,
        {
          confirmButtonText: "Update Now",
          type: "warning",
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
        }
      )
      window.open(latest.apkUrl, "_blank")
    } else {
      // Optional update
      try {
        await ElMessageBox.confirm(
          contentText || "A new version is available.",
          "New Version - " + latest.version,
          {
            confirmButtonText: "Update Now",
            cancelButtonText: "Remind Later",
            type: "info",
          }
        )
        window.open(latest.apkUrl, "_blank")
      } catch {
        // User chose "Remind Later"
      }
    }
  } catch (err) {
    console.warn("Version check failed:", err)
  }
}

export { compareVersion }