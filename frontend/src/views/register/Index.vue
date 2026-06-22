<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { registerVisitor, uploadImage } from "../../api/visitor"

const router = useRouter()
const CACHE_KEY = "eda_visitor_profile"

interface CachedProfile {
  name: string; studentId: string; college: string; className: string; phone: string
  campusProfileImage?: string
}

const formRef = ref<FormInstance>()
const submitting = ref(false)

const imageUrl = ref<string>("")
const uploadState = ref<"idle" | "compressing" | "uploading" | "done" | "error">("idle")
const uploadProgress = ref(0)
const uploadedFileName = ref("")
const compressedInfo = ref("")
let abortController: AbortController | null = null

const form = reactive({
  name: "", studentId: "", college: "", className: "", phone: "",
  expectedLeaveTime: "",
})

const rules: FormRules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  studentId: [
    { required: true, message: "请输入学号", trigger: "blur" },
    { pattern: /^\d{12}$/, message: "学号必须为12位数字", trigger: ["blur", "change"] },
  ],
  college: [{ required: true, message: "请输入学院", trigger: "blur" }],
  className: [{ required: true, message: "请输入班级", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1\d{10}$/, message: "手机号格式不正确", trigger: ["blur", "change"] },
  ],
  expectedLeaveTime: [
    { required: true, message: "请选择预计离开时间", trigger: "blur" },
    { validator: validateLeaveTime, trigger: "blur" },
  ],
}

function saveProfile() {
  const p: CachedProfile = {
    name: form.name, studentId: form.studentId, college: form.college,
    className: form.className, phone: form.phone,
    campusProfileImage: imageUrl.value || undefined,
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(p))
}

function loadCachedProfile() {
  const c = localStorage.getItem(CACHE_KEY)
  if (!c) return
  try {
    const p: CachedProfile = JSON.parse(c)
    form.name = p.name; form.studentId = p.studentId
    form.college = p.college; form.className = p.className
    form.phone = p.phone
    if (p.campusProfileImage) imageUrl.value = p.campusProfileImage
  } catch { /* ignore */ }
}

function disabledDate(time: Date): boolean {
  const n = new Date()
  const m = new Date(n.getTime() + 24 * 60 * 60 * 1000)
  return time.getTime() <= n.getTime() || time.getTime() > m.getTime()
}

function validateLeaveTime(_: unknown, v: string, cb: (e?: Error) => void) {
  if (!v) { cb(new Error("请选择预计离开时间")); return }
  const t = new Date(v).getTime()
  const n = Date.now()
  if (t <= n) { cb(new Error("预计离开时间必须晚于当前时间")); return }
  if (t > n + 24 * 60 * 60 * 1000) { cb(new Error("预计离开时间不能超过24小时")); return }
  cb()
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxW = 1280
      let w = img.width, h = img.height
      if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW }
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return }
        const ext = file.type === "image/png" ? "png" : "jpg"
        const name = file.name.replace(/\.[^.]+$/, "." + ext)
        const compressed = new File([blob], name, { type: "image/" + ext })
        const sz = compressed.size
        compressedInfo.value = sz > 1024 * 1024
          ? (sz / 1024 / 1024).toFixed(1) + "MB"
          : Math.round(sz / 1024) + "KB"
        const pct = Math.round((1 - sz / file.size) * 100)
        if (pct > 0) compressedInfo.value += " (-" + pct + "%)"
        resolve(compressed)
      }, "image/jpeg", 0.8)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

async function handleImageUpload(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    ElMessage.error("仅支持 JPG、PNG、WebP 格式"); return
  }
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error("图片过大，请选择 10MB 以内的图片"); return
  }
  uploadedFileName.value = file.name
  uploadState.value = "compressing"
  uploadProgress.value = 0
  compressedInfo.value = ""
  try {
    const compressed = await compressImage(file)
    uploadState.value = "uploading"
    abortController = new AbortController()
    const res = await uploadImage(compressed, {
      onProgress: (p) => { uploadProgress.value = p },
      signal: abortController.signal,
    })
    if (res.url) {
      imageUrl.value = res.url
      uploadState.value = "done"
      saveProfile()
      ElMessage.success("截图上传成功")
    } else {
      uploadState.value = "error"
      ElMessage.error("上传返回空地址")
    }
  } catch (err: unknown) {
    const e = err as Error
    if (e?.name === "AbortError" || e?.name === "CanceledError") {
      uploadState.value = "idle"; return
    }
    uploadState.value = "error"
    if (e?.message?.includes("timeout")) {
      ElMessage.error("上传超时，请检查网络后重试")
    } else {
      ElMessage.error("上传失败，请重试")
    }
  } finally {
    abortController = null
  }
}

function cancelUpload() {
  if (abortController) { abortController.abort(); abortController = null }
}

function resetUpload() {
  imageUrl.value = ""
  uploadState.value = "idle"
  uploadProgress.value = 0
  uploadedFileName.value = ""
  compressedInfo.value = ""
}

async function handleSubmit() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  const lt = new Date(form.expectedLeaveTime).getTime()
  const n = Date.now()
  if (lt <= n) { ElMessage.warning("预计离开时间必须晚于当前时间"); return }
  if (lt > n + 24 * 60 * 60 * 1000) { ElMessage.warning("预计离开时间不能超过24小时"); return }
  submitting.value = true
  try {
    const vt = new Date().toISOString()
    await registerVisitor({
      name: form.name, studentId: form.studentId, college: form.college,
      className: form.className, phone: form.phone,
      campusProfileImage: imageUrl.value || undefined,
      visitTime: vt, expectedLeaveTime: form.expectedLeaveTime,
    })
    saveProfile()
    router.push({
      path: "/success",
      query: { name: form.name, studentId: form.studentId, visitTime: vt, expectedLeave: form.expectedLeaveTime },
    })
  } catch (err: unknown) {
    const m = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
    ElMessage.error(m ?? "登记失败")
  } finally {
    submitting.value = false
  }
}

onMounted(loadCachedProfile)
</script>

<template>
  <div class="page-container">
    <div class="card">
      <div class="brand">
        <img src="/logo.png" alt="logo" class="logo-img" />
        <h2>电子设计协会</h2>
        <p>访客登记</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="form.studentId" placeholder="请输入12位学号" maxlength="12" />
        </el-form-item>
        <el-form-item label="学院" prop="college">
          <el-input v-model="form.college" placeholder="请输入学院" />
        </el-form-item>
        <el-form-item label="班级" prop="className">
          <el-input v-model="form.className" placeholder="请输入班级" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>

        <el-form-item label="身份截图">
          <!-- done -->
          <div v-if="uploadState === 'done' && imageUrl" class="upload-done">
            <el-image :src="imageUrl" class="preview-img" fit="contain" />
            <div class="upload-info">
              <span class="check">&#10003; 已上传</span>
              <span class="fname">{{ uploadedFileName }}</span>
              <span v-if="compressedInfo" class="fsize">{{ compressedInfo }}</span>
              <el-button size="small" text type="primary" @click="resetUpload">重新上传</el-button>
            </div>
          </div>
          <!-- uploading -->
          <div v-else-if="uploadState === 'compressing' || uploadState === 'uploading'" class="upload-progress">
            <span class="status-text">{{ uploadState === 'compressing' ? '压缩中...' : '上传中...' }}</span>
            <el-progress v-if="uploadState === 'uploading'" :percentage="uploadProgress" :stroke-width="6" />
            <span v-if="uploadedFileName" class="fname">{{ uploadedFileName }}</span>
            <el-button v-if="uploadState === 'uploading'" size="small" type="danger" text @click="cancelUpload">取消</el-button>
          </div>
          <!-- error -->
          <div v-else-if="uploadState === 'error'" class="upload-error">
            <span class="error-text">上传失败</span>
            <span v-if="uploadedFileName" class="fname">{{ uploadedFileName }}</span>
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/jpeg,image/png,image/webp" @change="(f: any) => { if (f?.raw) handleImageUpload(f.raw as File) }">
              <el-button size="small" type="primary">重新上传</el-button>
            </el-upload>
          </div>
          <!-- idle -->
          <div v-else class="upload-empty">
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/jpeg,image/png,image/webp" @change="(f: any) => { if (f?.raw) handleImageUpload(f.raw as File) }">
              <el-button size="small">上传今日校园截图</el-button>
            </el-upload>
            <span class="hint">请上传今日校园主页截图作为身份验证</span>
            <span class="hint2">支持 JPG、PNG、WebP，最大 10MB</span>
          </div>
        </el-form-item>

        <el-form-item label="预计离开" prop="expectedLeaveTime">
          <el-date-picker v-model="form.expectedLeaveTime" type="datetime" placeholder="选择预计离开时间" style="width:100%" :disabled-date="disabledDate" />
        </el-form-item>
        <el-button type="primary" :loading="submitting" size="large" style="width:100%" @click="handleSubmit">登记来访</el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 520px; margin: 0 auto; width: 100%; }
.card { background: #fff; border-radius: 24px; padding: 32px 24px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.brand { text-align: center; margin-bottom: 14px; }
.logo-img { width: 80px; height: 80px; border-radius: 18px; object-fit: cover; }
.brand h2 { margin: 10px 0 0; font-size: 20px; color: #303133; }
.brand p { margin: 2px 0 0; font-size: 13px; color: #909399; }
.upload-done { display: flex; align-items: flex-start; gap: 12px; }
.preview-img { width: 80px; height: 80px; border-radius: 8px; border: 1px solid #e4e7ed; cursor: pointer; }
.upload-info { display: flex; flex-direction: column; gap: 4px; }
.check { font-size: 14px; color: #67c23a; font-weight: 500; }
.fname { font-size: 12px; color: #909399; }
.fsize { font-size: 11px; color: #b0b3bb; }
.upload-progress { display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
.status-text { font-size: 14px; color: #409eff; }
.upload-error { display: flex; flex-direction: column; gap: 6px; padding: 4px 0; }
.error-text { font-size: 14px; color: #f56c6c; }
.upload-empty { display: flex; flex-direction: column; gap: 6px; }
.hint { font-size: 12px; color: #909399; }
.hint2 { font-size: 11px; color: #c0c4cc; }
</style>