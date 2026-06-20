<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

interface NavItem { path: string; label: string; }

const navItems: NavItem[] = [
  { path: "/register", label: "首页" },
  { path: "/history", label: "历史记录" },
  { path: "/leave", label: "离开登记" },
];

function isActive(path: string): boolean {
  return route.path === path;
}

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="visitor-nav">
    <div class="nav-brand" @click="navigate('/register')">电子设计协会 · 访客登记</div>
    <div class="nav-links">
      <span
        v-for="item in navItems"
        :key="item.path"
        :class="['nav-item', { active: isActive(item.path) }]"
        @click="navigate(item.path)"
      >{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.visitor-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-brand {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  cursor: pointer;
  white-space: nowrap;
}
.nav-links {
  display: flex;
  gap: 4px;
}
.nav-item {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-item:hover {
  background: #ecf5ff;
  color: #409eff;
}
.nav-item.active {
  background: #409eff;
  color: #fff;
}

@media (max-width: 480px) {
  .visitor-nav {
    padding: 0 12px;
    height: 48px;
  }
  .nav-brand {
    font-size: 14px;
  }
  .nav-item {
    padding: 4px 10px;
    font-size: 13px;
  }
}
</style>
