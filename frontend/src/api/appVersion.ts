import api from "./index";

export interface AppVersionItem {
  id: number;
  version: string;
  title: string;
  content: string;
  apkUrl: string;
  forceUpdate: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateVersionPayload {
  version: string;
  title: string;
  content: string;
  apkUrl: string;
  forceUpdate: boolean;
}

export function getVersions(): Promise<AppVersionItem[]> {
  return api.get<AppVersionItem[]>("/admin/app-versions").then((r) => r.data);
}

export function createVersion(payload: CreateVersionPayload): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>("/admin/app-versions", payload).then((r) => r.data);
}

export function deleteVersion(id: number): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>("/admin/app-versions/" + id).then((r) => r.data);
}