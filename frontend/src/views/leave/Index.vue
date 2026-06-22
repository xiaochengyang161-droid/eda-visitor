<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { getVisitorHistory } from "../../api/visitor";
import type { VisitHistoryItem } from "../../api/visitor";
import api from "../../api/index";
import { formatDateTime } from "../../utils/datetime";
interface CachedProfile { name: string; studentId: string; college: string; className: string; phone: string; }
const CACHE_KEY = "eda_visitor_profile"; const loading = ref(false); const records = ref<VisitHistoryItem[]>([]); const leavingId = ref<number | null>(null); const leavingLoading = ref(false); const currentTime = ref(formatDateTime(new Date().toISOString())); let timer: ReturnType<typeof setInterval> | null = null; const form = reactive({ studentId: "", phone: "" });
function loadCachedProfile() { const c = localStorage.getItem(CACHE_KEY); if (c) { try { const p: CachedProfile = JSON.parse(c); form.studentId = p.studentId; form.phone = p.phone; handleQuery(); } catch {} } }
async function handleQuery() { if (!form.studentId.trim() || !form.phone.trim()) { ElMessage.warning("请输入学号和手机号"); return; } loading.value = true; try { records.value = (await getVisitorHistory(form.studentId.trim())).filter(r => !r.actual_leave_time); if (records.value.length === 0) ElMessage.info("没有待离开的来访记录"); } catch { ElMessage.error("查询失败"); } finally { loading.value = false; } }
async function handleLeave(record: VisitHistoryItem) { leavingId.value = record.id; leavingLoading.value = true; try { await api.put("/visitor/leave/" + record.id); ElMessage.success("离开登记成功"); await handleQuery(); } catch (err: unknown) { const m = (err as {response?:{data?:{error?:string}}})?.response?.data?.error; ElMessage.error(m ?? "离开登记失败"); } finally { leavingId.value = null; leavingLoading.value = false; } }
onMounted(() => { loadCachedProfile(); timer = setInterval(() => { currentTime.value = formatDateTime(new Date().toISOString()); }, 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="page-container">
    <h2 class="title">离开登记</h2>
    <div class="clock">{{ currentTime }}</div>
    <el-card class="search-card">
      <el-form :inline="true" size="small">
        <el-form-item label="学号"><el-input v-model="form.studentId" placeholder="输入学号" clearable style="width:140px" @keyup.enter="handleQuery" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" placeholder="输入手机号" clearable style="width:140px" @keyup.enter="handleQuery" /></el-form-item>
        <el-form-item><el-button type="primary" @click="handleQuery">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <div v-loading="loading" class="list">
      <el-empty v-if="!loading && records.length === 0" description="暂无待离开记录" />
      <el-card v-for="row in records" :key="row.id" class="rec" shadow="hover">
        <div class="row"><div><div class="t">到访 {{ formatDateTime(row.visit_time) }}</div><div class="s">预计离开 {{ formatDateTime(row.expected_leave_time) }}</div></div><el-button type="danger" :loading="leavingId === row.id && leavingLoading" @click="handleLeave(row)">确认离开</el-button></div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 520px; margin: 0 auto; width: 100%; }
.title { margin-top: 12px; margin-bottom: 12px; font-size: 20px; font-weight: 700; color: #303133; }
.clock { text-align: center; font-size: 32px; font-family: monospace; color: #303133; margin-bottom: 16px; font-weight: 600; }
.search-card { margin-bottom: 16px; border-radius: 12px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.rec { border-radius: 10px; }
.row { display: flex; align-items: center; justify-content: space-between; }
.t { font-size: 15px; font-weight: 600; color: #303133; }
.s { font-size: 13px; color: #909399; margin-top: 2px; }
</style>