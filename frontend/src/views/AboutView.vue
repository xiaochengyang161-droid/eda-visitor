<script setup lang="ts">
import { ref, onMounted } from "vue"
import { checkUpdate } from "../utils/update"

const appVersion = ref("")
const checking = ref(false)

async function loadVersion() {
  try {
    const { getVersion } = await import("@tauri-apps/api/app")
    appVersion.value = await getVersion()
  } catch {
    appVersion.value = import.meta.env.VITE_APP_VERSION || "1.0.1"
  }
}

async function handleCheckUpdate() {
  checking.value = true
  await checkUpdate()
  checking.value = false
}

onMounted(loadVersion)
</script>

<template>
  <div class="page-container">
    <h2 class="title">关于</h2>
    <el-card class="card">
      <img src="/logo.png" alt="logo" class="logo-img" />
      <h3>电子设计协会访客管理系统</h3>
      <p class="sub">EDA Visitor System</p>
      <el-descriptions :column="1" border size="small" style="margin-top:16px">
        <el-descriptions-item label="版本">
          <el-tag type="primary">{{ appVersion ? "V" + appVersion : "..." }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="前端">Vue 3 + TypeScript</el-descriptions-item>
        <el-descriptions-item label="后端">Cloudflare Workers</el-descriptions-item>
        <el-descriptions-item label="数据库">Cloudflare D1</el-descriptions-item>
        <el-descriptions-item label="客户端">Tauri 2 (Android)</el-descriptions-item>
        <el-descriptions-item label="开发团队">EDA 技术组</el-descriptions-item>
      </el-descriptions>

      <el-card shadow="never" class="info-card">
        <div class="info-title">图片上传说明</div>
        <div class="info-item">支持格式：JPG、PNG、WebP</div>
        <div class="info-item">单文件最大：10MB</div>
        <div class="info-item">建议上传：今日校园主页截图</div>
        <div class="info-item">上传过程显示实时进度</div>
      </el-card>

      <div class="act">
        <el-button type="primary" :loading="checking" block @click="handleCheckUpdate">
          检查更新
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { max-width: 520px; margin: 0 auto; width: 100%; padding-bottom: 12px; }
.title { margin-top: 12px; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #303133; }
.card { border-radius: 12px; text-align: center; }
.logo-img { width: 72px; height: 72px; border-radius: 16px; object-fit: cover; margin-bottom: 12px; }
h3 { margin: 0; font-size: 18px; color: #303133; }
.sub { font-size: 13px; color: #909399; margin: 4px 0 0; }
.act { margin-top: 12px; }
.info-card { margin-top: 12px; text-align: left; background: #f5f7fa; }
.info-title { font-weight: 600; font-size: 13px; color: #303133; margin-bottom: 8px; }
.info-item { font-size: 12px; color: #606266; line-height: 1.8; }
</style>