import { ElMessageBox, ElMessage } from "element-plus"

export function compareVersion(v1: string, v2: string): number {
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
  shareCode: string
  forceUpdate: boolean
}

export async function checkUpdate(): Promise<void> {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ""
  const versionUrl = apiBase + "/app/version"

  try {
    let currentVersion = "1.0.1"
    try {
      const { getVersion } = await import("@tauri-apps/api/app")
      currentVersion = await getVersion()
    } catch {
      // Not in Tauri environment
    }

    const response = await fetch(versionUrl)
    if (!response.ok) {
      ElMessage.warning("无法获取最新版本信息")
      return
    }

    const latest: VersionInfo = await response.json()

    if (compareVersion(latest.version, currentVersion) <= 0) {
      ElMessage.success("当前已是最新版本 V" + currentVersion)
      return
    }

    // New version available
    const message = [
      `当前版本：V${currentVersion}`,
      `最新版本：V${latest.version}`,
      "",
      `更新内容：`,
      latest.content || "无",
      "",
      `下载方式：OpenList`,
      latest.shareCode ? `分享码：${latest.shareCode}` : "",
    ].filter(Boolean).join("\n")

    if (latest.forceUpdate) {
      await ElMessageBox.alert(message, "发现新版本 - V" + latest.version, {
        confirmButtonText: "立即更新",
        type: "warning",
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
      })
      openDownloadUrl(latest)
    } else {
      try {
        await ElMessageBox.confirm(message, "发现新版本 - V" + latest.version, {
          confirmButtonText: "立即更新",
          cancelButtonText: "稍后再说",
          type: "info",
        })
        openDownloadUrl(latest)
      } catch {
        // User dismissed
      }
    }
  } catch (err) {
    console.error("[UPDATE] check failed:", err)
    ElMessage.error("版本检查失败，请稍后重试")
  }
}

async function openDownloadUrl(info: VersionInfo) {
  const url = info.apkUrl || "https://openlist.yangspace.cn/@s/EDAVisitor"
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener")
    await openUrl(url)
  } catch {
    window.open(url, "_blank")
  }
}