import { corsHeaders } from "../middleware/cors";

interface VisitorStats {
  todayVisits: number;
  currentInBuilding: number;
  weekVisits: number;
  monthVisits: number;
}

export async function handleDashboardStats(env: Env): Promise<Response> {
  const [todayVisits, currentInBuilding, weekVisits, monthVisits, logStats] = await Promise.all([
    env.eda_db
      .prepare("SELECT COUNT(*) AS count FROM visit_records WHERE DATE(visit_time) = DATE('now')")
      .first<{ count: number }>(),
    env.eda_db
      .prepare("SELECT COUNT(*) AS count FROM visit_records WHERE actual_leave_time IS NULL")
      .first<{ count: number }>(),
    env.eda_db
      .prepare("SELECT COUNT(*) AS count FROM visit_records WHERE visit_time >= DATE('now', '-7 days')")
      .first<{ count: number }>(),
    env.eda_db
      .prepare("SELECT COUNT(*) AS count FROM visit_records WHERE visit_time >= DATE('now', 'start of month')")
      .first<{ count: number }>(),
    env.eda_db
      .prepare("SELECT COUNT(*) AS count FROM operation_logs")
      .first<{ count: number }>(),
  ]);

  const body = JSON.stringify({
    todayVisits: todayVisits?.count ?? 0,
    currentInBuilding: currentInBuilding?.count ?? 0,
    weekVisits: weekVisits?.count ?? 0,
    monthVisits: monthVisits?.count ?? 0,
    totalOperations: logStats?.count ?? 0,
  });

  return new Response(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=10", ...corsHeaders },
  });
}
