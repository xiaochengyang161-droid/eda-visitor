<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { checkUpdate } from "./utils/version"

onMounted(() => {
  checkUpdate()
})
</script>