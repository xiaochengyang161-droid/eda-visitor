<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getDashboardStats } from "../../api/dashboard";
import type { DashboardStats } from "../../api/dashboard";

const stats = ref<DashboardStats>({
  todayVisits: 0,
  currentInBuilding: 0,
  weekVisits: 0,
  monthVisits: 0,
  totalOperations: 0,
});

onMounted(async () => {
  stats.value = await getDashboardStats();
});
</script>

<template>
  <div>
    <el-row :gutter="20">
      <el-col :xs="12" :sm="6" style="margin-bottom:20px">
        <el-card shadow="hover"><el-statistic title="今日到访" :value="stats.todayVisits" /></el-card>
      </el-col>
      <el-col :xs="12" :sm="6" style="margin-bottom:20px">
        <el-card shadow="hover"><el-statistic title="当前在场" :value="stats.currentInBuilding"><template #suffix><el-tag type="warning" size="small">在场</el-tag></template></el-statistic></el-card>
      </el-col>
      <el-col :xs="12" :sm="6" style="margin-bottom:20px">
        <el-card shadow="hover"><el-statistic title="本周到访" :value="stats.weekVisits" /></el-card>
      </el-col>
      <el-col :xs="12" :sm="6" style="margin-bottom:20px">
        <el-card shadow="hover"><el-statistic title="本月到访" :value="stats.monthVisits" /></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover"><el-statistic title="操作次数" :value="stats.totalOperations" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>
