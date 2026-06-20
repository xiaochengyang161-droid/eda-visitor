<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { registerVisitor, uploadImage } from "../../api/visitor";
import { formatDateTime } from "../../utils/datetime";
import VisitorNav from "../../components/VisitorNav.vue";

const router = useRouter();
const CACHE_KEY = "eda_visitor_profile";

interface CachedProfile {
  name: string; studentId: string; college: string; className: string; phone: string;
  campusProfileImage?: string;
}

const formRef = ref<FormInstance>();
const submitting = ref(false);
const imageUrl = ref<string>("");
const uploadingImage = ref(false);
const previewVisible = ref(false);
const uploadRef = ref();
const currentTime = ref(formatDateTime(new Date().toISOString()));
let timer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  name: "", studentId: "", college: "", className: "", phone: "",
  expectedLeaveTime: "",
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  studentId: [{ required: true, message: "请输入学号", trigger: "blur" }],
  college: [{ required: true, message: "请输入学院", trigger: "blur" }],
  className: [{ required: true, message: "请输入班级", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }, { pattern: /^1\d{10}$/, message: "手机号格式不正确", trigger: "blur" }],
  expectedLeaveTime: [
    { required: true, message: "请选择预计离开时间", trigger: "blur" },
    { validator: validateLeaveTime, trigger: "blur" },
  ],
};

function saveProfile() {
  const p: CachedProfile = {
    name: form.name, studentId: form.studentId, college: form.college, className: form.className, phone: form.phone,
    campusProfileImage: imageUrl.value || undefined,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(p));
}

function loadCachedProfile() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const p: CachedProfile = JSON.parse(cached);
      form.name = p.name;
      form.studentId = p.studentId;
      form.college = p.college;
      form.className = p.className;
      form.phone = p.phone;
      if (p.campusProfileImage) {
        imageUrl.value = p.campusProfileImage;
      }
    } catch { /* ignore */ }
  }
}

function disabledDate(time: Date): boolean {
  const now = new Date();
  const max = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return time.getTime() <= now.getTime() || time.getTime() > max.getTime();
}

function validateLeaveTime(_rule: unknown, value: string, callback: (e?: Error) => void) {
  if (!value) { callback(new Error("请选择预计离开时间")); return; }
  const t = new Date(value).getTime();
  const now = Date.now();
  const max = now + 24 * 60 * 60 * 1000;
  if (t <= now) { callback(new Error("预计离开时间必须晚于当前时间")); return; }
  if (t > max) { callback(new Error("预计离开时间不能超过24小时")); return; }
  callback();
}

async function handleImageUpload(file: File) {
  console.log("upload called", file.name, file.size, file.type);
  uploadingImage.value = true;
  try {
    const res = await uploadImage(file);
    if (res.url) {
      imageUrl.value = res.url;
      saveProfile();
      ElMessage.success("截图上传成功");
      uploadRef.value?.clearFiles();
    } else {
      ElMessage.error("上传返回空地址");
    }
  } catch { ElMessage.error("截图上传失败"); }
  finally { uploadingImage.value = false; }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (!form.expectedLeaveTime) { ElMessage.warning("请选择预计离开时间"); return; }
  const leaveTime = new Date(form.expectedLeaveTime).getTime();
  const now = Date.now();
  if (leaveTime <= now) { ElMessage.warning("预计离开时间必须晚于当前时间"); return; }
  if (leaveTime > now + 24 * 60 * 60 * 1000) { ElMessage.warning("预计离开时间不能超过24小时"); return; }
  submitting.value = true;
  try {
    const visitTime = new Date().toISOString();
    await registerVisitor({
      name: form.name, studentId: form.studentId, college: form.college, className: form.className, phone: form.phone,
      campusProfileImage: imageUrl.value || undefined,
      visitTime: visitTime, expectedLeaveTime: form.expectedLeaveTime,
    });
    saveProfile();
    router.push({
      path: "/success",
      query: {
        name: form.name,
        studentId: form.studentId,
        visitTime: visitTime,
        expectedLeave: form.expectedLeaveTime,
      },
    });
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
    ElMessage.error(msg ?? "登记失败");
  } finally { submitting.value = false; }
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
      <el-card style="max-width:560px;margin:0 auto">
        <template #header><div style="text-align:center;font-size:20px;font-weight:bold">电子设计协会 · 访客登记</div></template>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-form-item label="姓名" prop="name"><el-input v-model="form.name" placeholder="请输入姓名" /></el-form-item>
          <el-form-item label="学号" prop="studentId"><el-input v-model="form.studentId" placeholder="请输入学号" /></el-form-item>
          <el-form-item label="学院" prop="college"><el-input v-model="form.college" placeholder="请输入学院" /></el-form-item>
          <el-form-item label="班级" prop="className"><el-input v-model="form.className" placeholder="请输入班级" /></el-form-item>
          <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" placeholder="请输入手机号" /></el-form-item>
          <el-form-item label="身份截图">
            <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">
              <el-image
                v-if="imageUrl"
                :src="imageUrl"
                style="width:200px;height:auto;border-radius:6px;cursor:pointer;border:1px solid #e4e7ed"
                fit="contain"
                @click="previewVisible = true"
              />
              <div style="display:flex;flex-direction:column;gap:8px;justify-content:center">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :show-file-list="false"
                  @change="(file: any) => { if (file?.raw) handleImageUpload(file.raw as File); }"
                  accept="image/*"
                >
                  <el-button :loading="uploadingImage">
                    <el-icon><Upload /></el-icon>{{ imageUrl ? "重新上传" : "上传今日校园截图" }}
                  </el-button>
                </el-upload>
                <span v-if="!imageUrl" style="font-size:12px;color:#909399">请上传今日校园主页截图作为身份验证</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="到访时间">
            <el-input :model-value="currentTime" readonly style="width:100%">
              <template #prefix><el-icon><Clock /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item label="预计离开">
            <el-date-picker v-model="form.expectedLeaveTime" type="datetime" placeholder="选择预计离开时间" style="width:100%" :disabled-date="disabledDate" />
          </el-form-item>
          <el-form-item><el-button type="primary" :loading="submitting" size="large" style="width:100%" @click="handleSubmit">登记来访</el-button></el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-dialog v-model="previewVisible" title="身份截图预览" width="90%" :style="{ maxWidth: '720px' }">
      <el-image :src="imageUrl" style="width:100%" fit="contain" />
    </el-dialog>
  </div>
</template>
