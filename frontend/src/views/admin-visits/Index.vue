<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getAdminVisits } from "../../api/visitor";
import type { AdminVisitItem } from "../../api/visitor";
import { formatDateTime } from "../../utils/datetime";

const items = ref<AdminVisitItem[]>([]);
const total = ref(0);
const loading = ref(false);


const filters = reactive({ name: "", studentId: "", startDate: "", endDate: "" });
const pagination = reactive({ page: 1, pageSize: 20 });

async function loadData() {
  loading.value = true;
  try {
    const res = await getAdminVisits({
      page: pagination.page, pageSize: pagination.pageSize,
      name: filters.name || undefined, studentId: filters.studentId || undefined,
      startDate: filters.startDate || undefined, endDate: filters.endDate || undefined,
    });
    items.value = res.items;
    total.value = res.total;
  } finally { loading.value = false; }
}

function handleSearch() { pagination.page = 1; loadData(); }
function handlePageChange(p: number) { pagination.page = p; loadData(); }
function handleSizeChange(s: number) { pagination.pageSize = s; pagination.page = 1; loadData(); }


onMounted(() => loadData());
</script>

<template>
  <div>
    <el-card>
      <template #header><span>访客记录</span></template>
      <el-form :inline="true" style="margin-bottom:16px">
        <el-form-item label="姓名"><el-input v-model="filters.name" placeholder="搜索姓名" clearable style="width:140px" /></el-form-item>
        <el-form-item label="学号"><el-input v-model="filters.studentId" placeholder="搜索学号" clearable style="width:160px" /></el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="filters.startDate" type="date" placeholder="开始" style="width:150px" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="filters.endDate" type="date" placeholder="结束" style="width:150px" /></el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">查询</el-button></el-form-item>
      </el-form>

      <el-table :data="items" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="student_id" label="学号" width="130" />
        <el-table-column prop="college" label="学院" min-width="120" />
        <el-table-column prop="class_name" label="班级" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="到访时间" width="170"><template #default="{ row }">{{ formatDateTime(row.visit_time) }}</template></el-table-column>
        <el-table-column label="预计离开" width="170"><template #default="{ row }">{{ formatDateTime(row.expected_leave_time) }}</template></el-table-column>
        <el-table-column prop="actual_leave_time" label="实际离开" width="170">
          <template #default="{ row }"><el-tag :type="row.actual_leave_time?'success':'warning'" size="small">{{ row.actual_leave_time ? formatDateTime(row.actual_leave_time) : '未离开' }}</el-tag></template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>


  </div>
</template>
