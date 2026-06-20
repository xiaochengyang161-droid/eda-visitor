<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

interface MenuItem { index: string; title: string; icon: string; roles: string[]; }

const allMenuItems: MenuItem[] = [
  { index: "/admin/dashboard", title: "首页", icon: "HomeFilled", roles: ["admin", "manager"] },
  { index: "/admin/visitors", title: "访客管理", icon: "User", roles: ["admin", "manager"] },
  { index: "/admin/visits", title: "来访记录", icon: "List", roles: ["admin", "manager"] },
  { index: "/admin/users", title: "用户管理", icon: "User", roles: ["admin"] },
  { index: "/admin/settings", title: "系统设置", icon: "Setting", roles: ["admin"] },
];

const menuItems = computed(() => allMenuItems.filter((item) => item.roles.includes(auth.userRole)));

function handleSelect(index: string) { router.push(index); }
function handleLogout() { auth.logout(); router.push("/login"); }
</script>

<template>
  <el-container style="height: 100vh">
    <el-aside width="220px">
      <el-menu :default-active="route.path" background-color="#304156" text-color="#bfcbd9" active-text-color="#409EFF" @select="handleSelect">
        <div style="height:60px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:bold;border-bottom:1px solid #1f2d3d">访客登记管理系统</div>
        <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff;border-bottom:1px solid #e6e6e6;display:flex;align-items:center;justify-content:space-between;font-size:16px;color:#303133">
        <span>电子设计协会 · 访客管理系统</span>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:14px;color:#606266">{{ auth.user?.username ?? "" }}<el-tag size="small" style="margin-left:6px">{{ auth.userRole }}</el-tag></span>
          <el-button type="danger" link @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main style="background:#f0f2f5"><router-view /></el-main>
    </el-container>
  </el-container>
</template>
