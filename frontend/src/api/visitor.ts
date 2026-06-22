import api from "./index";

export interface RegisterPayload {
  name: string; studentId: string; college: string; className: string;
  phone: string; campusProfileImage?: string; visitTime: string; expectedLeaveTime: string;
}

export interface VisitorProfile {
  name: string; college: string; class_name: string; phone: string; campus_profile_image: string | null;
}

export interface VisitHistoryItem {
  id: number;
  visit_time: string; expected_leave_time: string; actual_leave_time: string | null;
}

export interface AdminVisitItem {
  id: number; profile_id: number; name: string; student_id: string; college: string;
  class_name: string; phone: string; campus_profile_image: string | null;
  visit_time: string; expected_leave_time: string; actual_leave_time: string | null; created_at: string;
}

export interface AdminVisitsResponse { total: number; page: number; pageSize: number; items: AdminVisitItem[]; }

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export async function registerVisitor(payload: RegisterPayload): Promise<{ success: boolean }> {
  const res = await api.post<{ success: boolean }>("/visitor/register", payload);
  return res.data;
}

export async function getVisitorProfile(studentId: string): Promise<VisitorProfile | null> {
  const res = await api.get<VisitorProfile | null>("/visitor/profile", { params: { studentId } });
  return res.data;
}

export async function getVisitorHistory(studentId: string): Promise<VisitHistoryItem[]> {
  const res = await api.get<VisitHistoryItem[]>("/visitor/history", { params: { studentId } });
  return res.data;
}

export async function getAdminVisits(params: {
  page?: number; pageSize?: number; name?: string; studentId?: string; startDate?: string; endDate?: string;
}): Promise<AdminVisitsResponse> {
  const res = await api.get<AdminVisitsResponse>("/admin/visits", { params });
  return res.data;
}

export async function uploadImage(file: File, options?: UploadOptions): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<{ url: string }>("/upload", formData, {
    timeout: 30000,
    signal: options?.signal,
    onUploadProgress: (e) => {
      if (e.total && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return res.data;
}