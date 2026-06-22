<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getVisitorHistory } from "../../api/visitor";
import { formatDateTime } from "../../utils/datetime";
import type { VisitHistoryItem } from "../../api/visitor";
interface CachedProfile { name: string; studentId: string; college: string; className: string; phone: string; }
const router = useRouter(); const CACHE_KEY = "eda_visitor_profile"; const searchId = ref(""); const searchPhone = ref(""); const records = ref<VisitHistoryItem[]>([]); const loading = ref(false); const hasSearched = ref(false);
function loadCachedProfile() { const c = localStorage.getItem(CACHE_KEY); if (c) { try { const p: CachedProfile = JSON.parse(c); searchId.value = p.studentId; searchPhone.value = p.phone; handleSearch(); } catch {} } }
async function handleSearch() { if (!searchId.value.trim() || !searchPhone.value.trim()) { ElMessage.warning("请输入学号和手机号"); return; } loading.value = true; hasSearched.value = true; try { records.value = await getVisitorHistory(searchId.value.trim()); if (records.value.length === 0) ElMessage.info("未找到记录"); } catch { ElMessage.error("查询失败"); } finally { loading.value = false; } }
onMounted(loadCachedProfile);
</script>

<template>
  <div class="page-container">
    <h2 class="title">我的来访记录</h2>
    <el-card class="search-card">
      <el-form :inline="true" size="small">
        <el-form-item label="学号"><el-input v-model="searchId" placeholder="输入学号" clearable style="width:140px" @keyup.enter="handleSearch" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="searchPhone" placeholder="输入手机号" clearable style="width:140px" @keyup.enter="handleSearch" /></el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <div v-loading="loading" class="list">
      <div v-if="!loading && !hasSearched && records.length === 0" class="empty">
        <div class="empty-icon">&#128196;</div>
        <p class="empty-text">暂无来访记录</p>
        <p class="empty-hint">请先完成访客登记</p>
        <el-button type="primary" @click="router.push('/')">前往登记</el-button>
      </div>
      <el-empty v-else-if="!loading && records.length === 0" description="暂无记录" />
      <el-card v-for="row in records" :key="row.id" class="rec" shadow="hover">
        <div class="row"><div><div class="t">{{ formatDateTime(row.visit_time) }}</div><div class="s">预计离开 {{ formatDateTime(row.expected_leave_time) }}</div></div><el-tag :type="row.actual_leave_time ? 'info' : 'success'" size="small">{{ row.actual_leave_time ? "已离开" : "在场" }}</el-tag></div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 520px; margin: 0 auto; width: 100%; padding-bottom: 12px; }
.title { margin-top: 12px; margin-bottom: 24px; font-size: 30px; font-weight: 700; color: #303133; }
.search-card { margin-bottom: 16px; border-radius: 12px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.rec { border-radius: 10px; }
.row { display: flex; align-items: center; justify-content: space-between; }
.t { font-size: 15px; font-weight: 600; color: #303133; }
.s { font-size: 13px; color: #909399; margin-top: 2px; }
.empty { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 16px; color: #303133; margin: 0 0 4px; }
.empty-hint { font-size: 13px; color: #909399; margin: 0 0 16px; }
</style>