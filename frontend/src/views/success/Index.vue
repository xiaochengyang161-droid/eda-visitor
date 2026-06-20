<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import VisitorNav from "../../components/VisitorNav.vue";

const route = useRoute();
const router = useRouter();

const name = (route.query.name as string) ?? "";
const studentId = (route.query.studentId as string) ?? "";
const visitTime = (route.query.visitTime as string) ?? "";
const expectedLeave = (route.query.expectedLeave as string) ?? "";

function goHistory() { router.push("/history"); }
function goHome() { router.push("/register"); }
</script>

<template>
  <div style="min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
    <VisitorNav />
    <div style="padding:40px 20px;display:flex;align-items:center;justify-content:center">
      <el-card style="max-width:440px;width:100%;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">🎉</div>
        <h2 style="margin:0 0 4px;color:#303133">登记成功</h2>
        <p style="color:#909399;margin:0 0 24px">欢迎来到电子设计协会</p>

        <el-descriptions :column="1" border size="small" style="margin-bottom:20px">
          <el-descriptions-item label="姓名">{{ name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ studentId }}</el-descriptions-item>
          <el-descriptions-item label="到访时间">{{ visitTime }}</el-descriptions-item>
          <el-descriptions-item label="预计离开">{{ expectedLeave }}</el-descriptions-item>
        </el-descriptions>

        <el-alert type="info" :closable="false" show-icon style="margin-bottom:24px;text-align:left">
          <template #title>请在离开协会时进行离开登记</template>
        </el-alert>

        <el-space direction="vertical" :size="12" style="width:100%">
          <el-button type="primary" size="large" style="width:100%" @click="goHistory">查看我的记录</el-button>
          <el-button size="large" style="width:100%" @click="goHome">返回首页</el-button>
        </el-space>
      </el-card>
    </div>
  </div>
</template>
