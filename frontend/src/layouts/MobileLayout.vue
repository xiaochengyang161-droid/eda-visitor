<script setup lang="ts">
import AppTabBar from "../components/AppTabBar.vue"
</script>

<template>
  <div class="mobile-layout">
    <main class="mobile-content">
      <router-view />
    </main>
    <AppTabBar />
  </div>
</template>

<style scoped>
.mobile-layout {
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column; overflow: hidden;
  background: #f5f7fa;
}
.mobile-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 120px;
  box-sizing: border-box;
}
</style>