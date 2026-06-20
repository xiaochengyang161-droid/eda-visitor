<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import api from "../../api/index";
import { formatDateTime } from "../../utils/datetime";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

interface UserRecord {
  id: number; username: string; role: string; real_name: string | null; phone: string | null; created_at: string;
}

const users = ref<UserRecord[]>([]);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const submitting = ref(false);
const previewImgVisible = ref(false);
const previewImgUrl = ref("");

const form = reactive({ username: "", password: "", realName: "", role: "user" });

const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

async function loadUsers() { const res = await api.get<UserRecord[]>("/users"); users.value = res.data; }

function handlePreview(url: string) { previewImgUrl.value = url; previewImgVisible.value = true; }

function handleAdd() { form.username = ""; form.password = ""; form.realName = ""; form.role = "user"; dialogVisible.value = true; }

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try { await api.post("/users", form); ElMessage.success("创建成功"); dialogVisible.value = false; await loadUsers(); }
  catch (err: unknown) { const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error; ElMessage.error(msg ?? "创建失败"); }
  finally { submitting.value = false; }
}

async function handleDelete(row: UserRecord) {
  try {
    await ElMessageBox.confirm('确定删除用户 "' + row.username + '" 吗？', "删除确认", { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" });
    await api.delete('/users/' + row.id); ElMessage.success("删除成功"); await loadUsers();
  } catch { /* cancelled */ }
}

onMounted(() => loadUsers());
</script>

<template>
  <div>
    <el-card>
      <template #header><div style="display:flex;justify-content:space-between;align-items:center"><span>用户管理</span><el-button type="primary" @click="handleAdd">新增用户</el-button></div></template>
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="姓名" width="100"><template #default="{ row }">{{ row.real_name ?? "-" }}</template></el-table-column>
        <el-table-column prop="phone" label="电话" width="130"><template #default="{ row }">{{ row.phone ?? "-" }}</template></el-table-column>
        <el-table-column prop="role" label="角色" width="100"><template #default="{ row }"><el-tag :type="row.role==='admin'?'danger':'info'" size="small">{{ row.role }}</el-tag></template></el-table-column>
        <el-table-column label="创建时间" width="160"><template #default="{ row }">{{ formatDateTime(row.created_at) }}</template></el-table-column>
        <el-table-column label="身份截图" width="100">
          <template #default="{ row }">
            <el-button v-if="(row as Record<string,unknown>).campus_profile_image" type="primary" link @click="handlePreview((row as Record<string,unknown>).campus_profile_image as string)">查看</el-button>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button type="danger" link @click="handleDelete(row)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增用户" width="480px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username"><el-input v-model="form.username" placeholder="请输入用户名" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" placeholder="请输入密码" show-password /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" placeholder="请输入真实姓名" /></el-form-item>
        <el-form-item label="角色"><el-select v-model="form.role" style="width:100%"><el-option label="管理员 (admin)" value="admin" /><el-option label="经理 (manager)" value="manager" /><el-option label="用户 (user)" value="user" /><el-option label="访客 (visitor)" value="visitor" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="previewImgVisible" title="身份截图" width="600px">
      <el-image :src="previewImgUrl" style="width:100%" fit="contain" />
    </el-dialog>
  </div>
</template>
