<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getLogs } from "../../api/logs";
import type { LogItem } from "../../api/logs";
import { formatDateTime } from "../../utils/datetime";

const items = ref<LogItem[]>([]);
const total = ref(0);
const loading = ref(false);

const filters = reactive({
  username: "",
  action: "",
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
});

const actionOptions = [
  "LOGIN", "LOGOUT",
  "CREATE_USER", "UPDATE_USER", "DELETE_USER",
  "CREATE_DEVICE", "UPDATE_DEVICE", "DELETE_DEVICE",
  "CREATE_RESERVATION", "APPROVE_RESERVATION", "REJECT_RESERVATION", "DELETE_RESERVATION",
  "BORROW_DEVICE", "RETURN_DEVICE",
];

function actionTagType(action: string): "" | "success" | "danger" | "primary" | "warning" | "info" {
  if (action.includes("LOGIN") || action.includes("LOGOUT")) return "success";
  if (action.includes("DELETE")) return "danger";
  if (action.includes("CREATE")) return "primary";
  if (action.includes("APPROVE")) return "success";
  if (action.includes("REJECT")) return "danger";
  if (action.includes("RETURN")) return "warning";
  return "info";
}

async function loadLogs() {
  loading.value = true;
  try {
    const res = await getLogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      action: filters.action || undefined,
      username: filters.username || undefined,
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadLogs();
}

function handlePageChange(page: number) {
  pagination.page = page;
  loadLogs();
}

function handleSizeChange(size: number) {
  pagination.pageSize = size;
  pagination.page = 1;
  loadLogs();
}

onMounted(() => loadLogs());
</script>

<template>
  <div>
    <el-card>
      <template #header>
        <span>审计日志</span>
      </template>

      <el-form :inline="true" style="margin-bottom: 16px">
        <el-form-item label="用户名">
          <el-input v-model="filters.username" placeholder="搜索用户名" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="动作">
          <el-select v-model="filters.action" placeholder="全部动作" clearable style="width:200px">
            <el-option v-for="a in actionOptions" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="items" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户" width="100">
          <template #default="{ row }">{{ row.username ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="动作" width="180">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)" size="small">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_type" label="对象类型" width="100">
          <template #default="{ row }">{{ row.target_type ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="target_id" label="对象ID" width="80">
          <template #default="{ row }">{{ row.target_id ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="120">
          <template #default="{ row }">{{ row.detail ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column label="时间" width="160"><template #default="{ row }">{{ formatDateTime(row.created_at) }}</template></el-table-column>
      </el-table>

      <div style="margin-top: 16px; display: flex; justify-content: flex-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>
