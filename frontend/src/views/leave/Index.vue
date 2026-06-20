<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { getVisitorHistory } from "../../api/visitor";
import type { VisitHistoryItem } from "../../api/visitor";
import api from "../../api/index";
import VisitorNav from "../../components/VisitorNav.vue";
import { formatDateTime } from "../../utils/datetime";

interface CachedProfile {
  name: string; studentId: string; college: string; className: string; phone: string;
}

const CACHE_KEY = "eda_visitor_profile";

const loading = ref(false);
const records = ref<VisitHistoryItem[]>([]);
const leavingId = ref<number | null>(null);
const leavingLoading = ref(false);
const currentTime = ref(formatDateTime(new Date().toISOString()));
let timer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  studentId: "",
  phone: "",
});

const rules = {
  studentId: [{ required: true, message: "请输入学号", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
};

function loadCachedProfile() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const p: CachedProfile = JSON.parse(cached);
      form.studentId = p.studentId;
      form.phone = p.phone;
      handleQuery();
    } catch { /* ignore */ }
  }
}

async function handleQuery() {
  const id = form.studentId.trim();
  const phone = form.phone.trim();
  if (!id || !phone) { ElMessage.warning("请输入学号和手机号"); return; }
  loading.value = true;
  try {
    records.value = await getVisitorHistory(id);
    records.value = records.value.filter((r) => !r.actual_leave_time);
    if (records.value.length === 0) {
      ElMessage.info("没有待离开的来访记录");
    }
  } catch {
    ElMessage.error("查询失败");
  } finally {
    loading.value = false;
  }
}

async function handleLeave(record: VisitHistoryItem, _idx: number) {
  leavingId.value = _idx;
  leavingLoading.value = true;
  try {
    await api.put("/visitor/leave/" + record.id);
    ElMessage.success("离开登记成功，时间：" + formatDateTime(new Date().toISOString()));
    await handleQuery();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
    if (msg === "该记录已登记离开") {
      ElMessage.warning("该记录已登记离开");
      await handleQuery();
    } else {
      ElMessage.error(msg ?? "离开登记失败");
    }
  } finally {
    leavingId.value = null;
    leavingLoading.value = false;
  }
}

onMounted(() => {
  loadCachedProfile();
  timer = setInterval(() => { currentTime.value = formatDateTime(new Date().toISOString()); }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div style="min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
    <VisitorNav />
    <div style="padding:40px 20px">
      <el-card style="max-width:640px;margin:0 auto">
        <template #header>
          <div style="text-align:center;font-size:18px;font-weight:bold">离开登记</div>
        </template>

        <div style="text-align:center;margin-bottom:16px;font-size:28px;font-family:monospace;color:#303133">
          {{ currentTime }}
        </div>

        <el-form
          :model="form"
          :rules="rules"
          :inline="true"
          style="margin-bottom:16px"
        >
          <el-form-item label="学号" prop="studentId">
            <el-input
              v-model="form.studentId"
              placeholder="输入学号"
              clearable
              style="width:180px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="输入手机号"
              clearable
              style="width:180px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="records" stripe v-loading="loading" empty-text="暂无待离开记录">
          <el-table-column label="到访时间" width="170"><template #default="{ row }">{{ formatDateTime(row.visit_time) }}</template></el-table-column>
          <el-table-column label="预计离开" width="170"><template #default="{ row }">{{ formatDateTime(row.expected_leave_time) }}</template></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                :loading="leavingId === $index && leavingLoading"
                @click="handleLeave(records[$index], $index)"
              >
                确认离开
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>
