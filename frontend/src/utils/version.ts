import { ElMessageBox, ElMessage } from "element-plus"

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
 * When showLatestMessage is true, shows a success message if already up-to-date.
 * When showLatestMessage is false (default), silently returns if up-to-date.
 */
export async function checkUpdate(showLatestMessage = false): Promise<void> {
  console.log("[UPDATE] checkUpdate() called, showLatestMessage =", showLatestMessage)

  try {
    console.log("[UPDATE] importing @tauri-apps/api/app...")
    const appModule = await import("@tauri-apps/api/app")
    console.log("[UPDATE] app module loaded:", Object.keys(appModule))

    console.log("[UPDATE] calling getVersion()...")
    const currentVersion = await appModule.getVersion()
    console.log("[UPDATE] currentVersion =", currentVersion)

    const url = "https://eda-visitor-api.dzsjxh526.workers.dev/app/version"
    console.log("[UPDATE] fetching:", url)

    const response = await fetch(url)
    console.log("[UPDATE] response status:", response.status)

    if (!response.ok) {
      console.warn("[UPDATE] fetch failed with status:", response.status)
      if (showLatestMessage) {
        ElMessage.warning("Unable to check for updates")
      }
      return
    }

    const rawText = await response.text()
    const latest: VersionInfo = JSON.parse(rawText)
    console.log("[UPDATE] server version:", latest.version)
    console.log("[UPDATE] forceUpdate:", latest.forceUpdate)

    const cmp = compareVersion(latest.version, currentVersion)
    console.log("[UPDATE] compareVersion(latest, current) =", cmp)

    if (cmp <= 0) {
      console.log("[UPDATE] Already up-to-date. Server:", latest.version, "App:", currentVersion)
      if (showLatestMessage) {
        ElMessage.success("Already up to date")
      }
      return
    }

    console.log("[UPDATE] Newer version found! Server:", latest.version, "> App:", currentVersion)

    const contentText = Array.isArray(latest.content)
      ? latest.content.join("\n")
      : latest.content

    if (latest.forceUpdate) {
      console.log("[UPDATE] Force update triggered!")
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
      console.log("[UPDATE] User clicked update, opening URL:", latest.apkUrl)
      window.open(latest.apkUrl, "_blank")
    } else {
      console.log("[UPDATE] Optional update triggered")
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
        console.log("[UPDATE] User clicked update, opening URL:", latest.apkUrl)
        window.open(latest.apkUrl, "_blank")
      } catch {
        console.log("[UPDATE] User dismissed update dialog")
      }
    }

    console.log("[UPDATE] checkUpdate() complete")
  } catch (err) {
    console.error("[UPDATE] checkUpdate() FAILED:", err)
    if (err instanceof Error) {
      console.error("[UPDATE] Error name:", err.name)
      console.error("[UPDATE] Error message:", err.message)
    }
    if (showLatestMessage) {
      ElMessage.error("Version check failed")
    }
  }
}

export { compareVersion }