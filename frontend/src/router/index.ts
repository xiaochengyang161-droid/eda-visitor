import { createRouter, createWebHistory } from "vue-router";
import AdminLayout from "../layouts/AdminLayout.vue";
import MobileLayout from "../layouts/MobileLayout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: MobileLayout,
      children: [
        { path: "", name: "Register", component: () => import("../views/register/Index.vue") },
        { path: "history", name: "History", component: () => import("../views/history/Index.vue") },
        { path: "leave", name: "Leave", component: () => import("../views/leave/Index.vue") },
        { path: "about", name: "About", component: () => import("../views/AboutView.vue") },
      ],
    },
    { path: "/success", name: "Success", component: () => import("../views/success/Index.vue") },
    { path: "/login", name: "Login", component: () => import("../views/login/Index.vue") },
    {
      path: "/admin", component: AdminLayout, redirect: "/admin/dashboard",
      children: [
        { path: "dashboard", name: "Dashboard", component: () => import("../views/dashboard/Index.vue") },
        { path: "visitors", name: "AdminVisitors", component: () => import("../views/admin-visitors/Index.vue") },
        { path: "visits", name: "AdminVisits", component: () => import("../views/admin-visits/Index.vue") },
        { path: "users", name: "Users", component: () => import("../views/users/Index.vue") },
        { path: "settings", name: "Settings", component: () => import("../views/settings/Index.vue") },
        { path: "app-version", name: "AppVersion", component: () => import("../views/app-version/Index.vue") },
      ],
    },
  ],
});

const PUBLIC_PATHS = ["/", "/history", "/leave", "/about", "/success", "/login"];

router.beforeEach(async (to, _from, next) => {
  if (PUBLIC_PATHS.includes(to.path)) {
    next();
    return;
  }

  const { useAuthStore } = await import("../stores/auth");
  const auth = useAuthStore();

  if (!auth.isLoggedIn) {
    next("/login");
    return;
  }

  auth.fetchUser();
  next();
});

export default router;