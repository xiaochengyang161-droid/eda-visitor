import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    // Prompt user to refresh when new version available
    if (confirm("有新版本可用，是否刷新？")) {
      location.reload();
    }
  },
  onOfflineReady() {
    console.log("PWA: 离线就绪");
  },
});
