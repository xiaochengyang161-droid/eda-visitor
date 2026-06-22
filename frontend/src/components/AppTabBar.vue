<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { House, Document, SwitchButton, Setting } from "@element-plus/icons-vue"
const route = useRoute(); const router = useRouter()
const tabs = [
  { path: "/", label: "首页", icon: House },
  { path: "/history", label: "历史", icon: Document },
  { path: "/leave", label: "离开", icon: SwitchButton },
  { path: "/about", label: "关于", icon: Setting },
]
</script>

<template>
  <div class="tab-bar">
    <div v-for="tab in tabs" :key="tab.path" :class="['tab-item', { active: route.path === tab.path }]" @click="router.push(tab.path)">
      <el-icon :size="24"><component :is="tab.icon" /></el-icon>
      <span class="tab-label">{{ tab.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  position: fixed; bottom: 0; left: 0; right: 0; height: 68px;
  display: flex; align-items: center; justify-content: space-around;
  background: #fff; border-top: 1px solid #e4e7ed; z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.tab-item { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 4px 16px; cursor: pointer; color: #808080; transition: color 0.2s; -webkit-tap-highlight-color: transparent; }
.tab-item.active { color: #409eff; }
.tab-label { font-size: 13px; margin-top: 2px; line-height: 1; }
</style>