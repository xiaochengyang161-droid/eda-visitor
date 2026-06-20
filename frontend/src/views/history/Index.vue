<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getVisitorHistory } from "../../api/visitor";
import { formatDateTime } from "../../utils/datetime";
import type { VisitHistoryItem } from "../../api/visitor";
import VisitorNav from "../../components/VisitorNav.vue";

interface CachedProfile {
  name: string; studentId: string; college: string; className: string; phone: string;
}

const CACHE_KEY = "eda_visitor_profile";

const searchId = ref("");
const searchPhone = ref("");
const records = ref<VisitHistoryItem[]>([]);
const loading = ref(false);

function loadCachedProfile() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const p: CachedProfile = JSON.parse(cached);
      searchId.value = p.studentId;
      searchPhone.value = p.phone;
      handleSearch();
    } catch { /* ignore */ }
  }
}

async function handleSearch() {
  const id = searchId.value.trim();
  const phone = searchPhone.value.trim();
  if (!id || !phone) { ElMessage.warning("请输入学号和手机号"); return; }
  loading.value = true;
  try {
    records.value = await getVisitorHistory(id);
    if (records.value.length === 0) ElMessage.info("未找到记录");
  } catch { ElMessage.error("查询失败"); }
  finally { loading.value = false; }
}

onMounted(loadCachedProfile);
</script>

<template>
  <div style="min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
    <VisitorNav />
    <div style="padding:40px 20px">
      <el-card style="max-width:640px;margin:0 auto">
        <template #header>
          <div style="text-align:center;font-size:18px;font-weight:bold">我的来访记录</div>
        </template>
        <el-form :inline="true" style="margin-bottom:16px">
          <el-form-item label="学号">
            <el-input v-model="searchId" placeholder="输入学号" clearable style="width:180px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="searchPhone" placeholder="输入手机号" clearable style="width:180px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="records" stripe v-loading="loading" empty-text="暂无记录">
          <el-table-column label="到访时间" width="170"><template #default="{ row }">{{ formatDateTime(row.visit_time) }}</template></el-table-column>
          <el-table-column label="预计离开" width="170"><template #default="{ row }">{{ formatDateTime(row.expected_leave_time) }}</template></el-table-column>
          <el-table-column prop="actual_leave_time" label="实际离开" width="170">
            <template #default="{ row }">{{ row.actual_leave_time ? formatDateTime(row.actual_leave_time) : "未离开" }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>
