import api from "./index";

export interface LogItem {
  id: number; user_id: number | null; username: string | null; action: string;
  target_type: string | null; target_id: number | null; detail: string | null;
  ip: string | null; created_at: string;
}

export interface LogResponse { total: number; page: number; pageSize: number; items: LogItem[]; }

export async function getLogs(params: {
  page?: number; pageSize?: number; action?: string; username?: string;
}): Promise<LogResponse> {
  const res = await api.get<LogResponse>("/logs", { params });
  return res.data;
}
