<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { checkUpdate } from "./utils/version"

onMounted(() => {
  console.log("[APP] App mounted, starting update check...")
  checkUpdate(false)
})
</script>