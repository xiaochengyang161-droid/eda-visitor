<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import api from "../../api/index";
import { formatDateTime } from "../../utils/datetime";

interface VisitorProfile {
  id: number;
  name: string;
  student_id: string;
  college: string;
  class_name: string;
  phone: string;
  campus_profile_image: string | null;
  created_at: string;
}

interface VisitorDetail {
  profile: VisitorProfile;
  visitCount: number;
  lastVisit: string | null;
  lastExpectedLeave: string | null;
  lastActualLeave: string | null;
  currentInside: boolean;
}

const items = ref<VisitorProfile[]>([]);
const loading = ref(false);
const previewVisible = ref(false);
const previewUrl = ref("");

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<VisitorDetail | null>(null);

const filters = reactive({ name: "", studentId: "" });

async function loadData() {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (filters.name) params.name = filters.name;
    if (filters.studentId) params.studentId = filters.studentId;
    const res = await api.get<VisitorProfile[]>("/admin/visitors", { params });
    items.value = res.data;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { loadData(); }
function handlePreview(url: string) { previewUrl.value = url; previewVisible.value = true; }

async function handleDetail(id: number) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const res = await api.get<VisitorDetail>("/admin/visitors/" + id);
    detail.value = res.data;
  } catch {
    detail.value = null;
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <el-card>
      <template #header><span>访客管理</span></template>

      <el-form :inline="true" style="margin-bottom:16px">
        <el-form-item label="姓名">
          <el-input v-model="filters.name" placeholder="搜索姓名" clearable style="width:160px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="filters.studentId" placeholder="搜索学号" clearable style="width:180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="items" stripe v-loading="loading" empty-text="暂无访客">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="student_id" label="学号" width="130" />
        <el-table-column prop="college" label="学院" min-width="140" />
        <el-table-column prop="class_name" label="班级" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="身份截图" width="100">
          <template #default="{ row }">
            <el-button v-if="row.campus_profile_image" type="primary" link @click="handlePreview(row.campus_profile_image!)">查看</el-button>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="首次登记" width="160"><template #default="{ row }">{{ formatDateTime(row.created_at) }}</template></el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Image Preview Dialog -->
    <el-dialog v-model="previewVisible" title="身份截图" width="90%" :style="{ maxWidth: '720px' }">
      <el-image :src="previewUrl" style="width:100%" fit="contain" />
    </el-dialog>

    <!-- Visitor Detail Dialog -->
    <el-dialog v-model="detailVisible" title="访客详情" width="560px" :close-on-click-modal="false">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="姓名" :span="1">{{ detail.profile.name }}</el-descriptions-item>
            <el-descriptions-item label="学号" :span="1">{{ detail.profile.student_id }}</el-descriptions-item>
            <el-descriptions-item label="学院" :span="2">{{ detail.profile.college }}</el-descriptions-item>
            <el-descriptions-item label="班级" :span="1">{{ detail.profile.class_name }}</el-descriptions-item>
            <el-descriptions-item label="手机号" :span="1">{{ detail.profile.phone }}</el-descriptions-item>
            <el-descriptions-item label="累计来访" :span="1">{{ detail.visitCount }} 次</el-descriptions-item>
            <el-descriptions-item label="当前状态" :span="1">
              <el-tag :type="detail.currentInside ? 'success' : 'info'" size="small">{{ detail.currentInside ? "在场" : "已离开" }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最近来访" :span="1">{{ detail.lastVisit ? formatDateTime(detail.lastVisit) : "暂无记录" }}</el-descriptions-item>
            <el-descriptions-item label="预计离开" :span="1">{{ detail.lastExpectedLeave ? formatDateTime(detail.lastExpectedLeave) : "-" }}</el-descriptions-item>
            <el-descriptions-item label="实际离开" :span="1">{{ detail.lastActualLeave ? formatDateTime(detail.lastActualLeave) : "未离开" }}</el-descriptions-item>
            <el-descriptions-item label="首次登记" :span="2">{{ formatDateTime(detail.profile.created_at) }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="detail.profile.campus_profile_image" style="margin-top:16px">
            <div style="font-size:14px;color:#606266;margin-bottom:8px">身份截图</div>
            <el-image :src="detail.profile.campus_profile_image" style="width:100%;max-height:300px;border-radius:6px" fit="contain" />
          </div>
        </template>
        <el-empty v-else description="加载失败" />
      </div>
    </el-dialog>
  </div>
</template>
