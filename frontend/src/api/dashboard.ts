import api from "./index";

export interface DashboardStats {
  todayVisits: number;
  currentInBuilding: number;
  weekVisits: number;
  monthVisits: number;
  totalOperations: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>("/dashboard/stats");
  return res.data;
}
