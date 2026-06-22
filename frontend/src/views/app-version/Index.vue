<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getVersions,
  createVersion,
  deleteVersion,
  type AppVersionItem,
  type CreateVersionPayload,
} from "../../api/appVersion";

const versions = ref<AppVersionItem[]>([]);
const loading = ref(false);

const form = ref<CreateVersionPayload>({
  version: "",
  title: "",
  content: "",
  apkUrl: "https://openlist.yangspace.cn/@s/EDAVisitor",
  shareCode: "ah76h",
  forceUpdate: false,
});

const currentActive = ref<AppVersionItem | null>(null);

async function loadVersions() {
  loading.value = true;
  try {
    versions.value = await getVersions();
    currentActive.value = versions.value.find((v) => v.isActive) ?? null;
  } catch {
    ElMessage.error("Failed to load versions");
  } finally {
    loading.value = false;
  }
}

async function handlePublish() {
  if (!form.value.version.trim() || !form.value.title.trim() || !form.value.apkUrl.trim()) {
    ElMessage.warning("Please fill in version, title, and APK URL");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "Publish version " + form.value.version + "? This will deactivate the current active version.",
      "Confirm Publish",
      { confirmButtonText: "Publish", cancelButtonText: "Cancel", type: "warning" }
    );
  } catch {
    return;
  }

  try {
    await createVersion({ ...form.value });
    ElMessage.success("Version published");
    form.value = { version: "", title: "", content: "", apkUrl: "https://openlist.yangspace.cn/@s/EDAVisitor", shareCode: "ah76h", forceUpdate: false };
    await loadVersions();
  } catch {
    ElMessage.error("Failed to publish version");
  }
}

async function handleDelete(row: AppVersionItem) {
  try {
    await ElMessageBox.confirm("Delete version " + row.version + "?", "Confirm Delete", {
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      type: "warning",
    });
  } catch {
    return;
  }

  try {
    await deleteVersion(row.id);
    ElMessage.success("Deleted");
    await loadVersions();
  } catch {
    ElMessage.error("Failed to delete");
  }
}

onMounted(() => {
  loadVersions();
});
</script>

<template>
  <div>
    <h2 style="margin-bottom: 20px">APP Version Management</h2>

    <!-- Current Active Version -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span style="font-weight: bold">Current Release</span>
        <el-tag v-if="currentActive" type="success" style="margin-left: 12px">
          {{ currentActive.version }}
        </el-tag>
        <el-tag v-else type="info" style="margin-left: 12px">None</el-tag>
      </template>
      <template v-if="currentActive">
        <p><strong>Title:</strong> {{ currentActive.title }}</p>
        <p><strong>Content:</strong> {{ currentActive.content }}</p>
        <p><strong>Force Update:</strong> {{ currentActive.forceUpdate ? "Yes" : "No" }}</p>
        <p><strong>APK URL:</strong> {{ currentActive.apkUrl }}</p>
        <p><strong>Share Code:</strong> {{ currentActive.shareCode || "-" }}</p>
      </template>
      <p v-else style="color: #909399">No active version. Publish one below.</p>
    </el-card>

    <!-- Publish New Version -->
    <el-card style="margin-bottom: 20px">
      <template #header><span style="font-weight: bold">Publish New Version</span></template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="Version">
          <el-input v-model="form.version" placeholder="e.g. 1.0.2" style="width: 300px" />
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="form.title" placeholder="e.g. V1.0.2" style="width: 300px" />
        </el-form-item>
        <el-form-item label="Content">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="Update notes" style="width: 500px" />
        </el-form-item>
        <el-form-item label="APK URL">
          <el-input v-model="form.apkUrl" placeholder="https://openlist.yangspace.cn/@s/EDAVisitor" style="width: 500px" />
        </el-form-item>
        <el-form-item label="Share Code">
          <el-input v-model="form.shareCode" placeholder="ah76h" style="width: 200px" />
        </el-form-item>
        <el-form-item label="Force Update">
          <el-checkbox v-model="form.forceUpdate" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlePublish">Publish Version</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Version History -->
    <el-card>
      <template #header><span style="font-weight: bold">Version History</span></template>
      <el-table :data="versions" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="version" label="Version" width="120" />
        <el-table-column prop="title" label="Title" width="150" />
        <el-table-column prop="content" label="Content" min-width="200" />
        <el-table-column label="Active" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? "Yes" : "No" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Force" width="80">
          <template #default="{ row }">
            <el-tag :type="row.forceUpdate ? 'danger' : 'info'" size="small">
              {{ row.forceUpdate ? "Yes" : "No" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Created" width="180" />
        <el-table-column label="Actions" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>