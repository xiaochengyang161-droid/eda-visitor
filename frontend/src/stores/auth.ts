import { defineStore } from "pinia";
import api from "../api/index";

export interface UserInfo {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
}

function loadUser(): UserInfo | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw) as UserInfo; } catch { return null; }
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => {
    const token = localStorage.getItem("token");
    const user = loadUser();
    if (token) {
      api.defaults.headers.common["Authorization"] = "Bearer " + token;
    }
    return { token, user };
  },

  getters: {
    isLoggedIn: (state): boolean => !!state.token && !!state.user,
    userRole: (state): string => state.user?.role ?? "visitor",
  },

  actions: {
    async login(username: string, password: string) {
      const res = await api.post<{ token: string; user: UserInfo }>("/auth/login", { username, password });
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      api.defaults.headers.common["Authorization"] = "Bearer " + this.token;
    },

    async fetchUser() {
      if (!this.token) return;
      try {
        const res = await api.get<UserInfo>("/auth/me", {
          headers: { Authorization: "Bearer " + this.token },
        });
        this.user = res.data;
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch {
        // Silently keep cached user; token validation failure doesn't destroy session
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
    },
  },
});
