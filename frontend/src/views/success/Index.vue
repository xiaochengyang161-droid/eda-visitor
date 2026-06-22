<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
const route = useRoute(); const router = useRouter();
const name = (route.query.name as string) ?? ""; const studentId = (route.query.studentId as string) ?? "";
const visitTime = (route.query.visitTime as string) ?? ""; const expectedLeave = (route.query.expectedLeave as string) ?? "";
</script>

<template>
  <div class="wrap">
    <div class="card">
      <div class="icon">&#10003;</div>
      <h2>登记成功</h2>
      <p class="sub">欢迎来到电子设计协会</p>
      <el-descriptions :column="1" border size="small" style="margin:20px 0">
        <el-descriptions-item label="姓名">{{ name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ studentId }}</el-descriptions-item>
        <el-descriptions-item label="到访时间">{{ visitTime }}</el-descriptions-item>
        <el-descriptions-item label="预计离开">{{ expectedLeave }}</el-descriptions-item>
      </el-descriptions>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:20px"><template #title>请在离开协会时进行离开登记</template></el-alert>
      <el-button size="large" block @click="router.push('/')">返回首页</el-button>
      <el-button type="primary" size="large" block style="margin-top:10px" @click="router.push('/history')">查看记录</el-button>
    </div>
  </div>
</template>

<style scoped>
.wrap { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
.card { max-width: 440px; width: 100%; background: #fff; border-radius: 16px; padding: 32px 24px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,.12); }
.icon { width: 56px; height: 56px; background: #67c23a; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 12px; }
h2 { margin: 0; color: #303133; font-size: 22px; }
.sub { color: #909399; margin: 4px 0 0; }
</style>