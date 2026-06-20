import { corsHeaders } from "../middleware/cors";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export async function handleVisitorAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  const userOrError = await authenticate(request);
  if (userOrError instanceof Response) return userOrError;

  const forbidden = requireRole(["admin", "manager"])(userOrError);
  if (forbidden) return forbidden;

  // GET /admin/visitors
  if (method === "GET" && url.pathname === "/admin/visitors") {
    const name = url.searchParams.get("name");
    const studentId = url.searchParams.get("studentId");

    let sql = "SELECT id, name, student_id, college, class_name, phone, campus_profile_image, created_at FROM visitor_profiles";
    const conditions: string[] = [];
    const params: string[] = [];

    if (name) { conditions.push("name LIKE ?"); params.push("%" + name + "%"); }
    if (studentId) { conditions.push("student_id LIKE ?"); params.push("%" + studentId + "%"); }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY created_at DESC";

    const result = await env.eda_db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=10", ...corsHeaders },
    });
  }

  // GET /admin/visits
  if (method === "GET" && url.pathname === "/admin/visits") {
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));
    const name = url.searchParams.get("name");
    const studentId = url.searchParams.get("studentId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let countSQL = `SELECT COUNT(*) AS total FROM visit_records vr
                    JOIN visitor_profiles vp ON vr.profile_id = vp.id`;
    let dataSQL = `SELECT vr.*, vp.name, vp.student_id, vp.college, vp.class_name, vp.phone, vp.campus_profile_image
                   FROM visit_records vr JOIN visitor_profiles vp ON vr.profile_id = vp.id`;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (name) { conditions.push("vp.name LIKE ?"); params.push(`%${name}%`); }
    if (studentId) { conditions.push("vp.student_id LIKE ?"); params.push(`%${studentId}%`); }
    if (startDate) { conditions.push("vr.visit_time >= ?"); params.push(startDate); }
    if (endDate) { conditions.push("vr.visit_time <= ?"); params.push(endDate + " 23:59:59"); }

    if (conditions.length > 0) {
      const where = " WHERE " + conditions.join(" AND ");
      countSQL += where;
      dataSQL += where;
    }

    dataSQL += " ORDER BY vr.visit_time DESC LIMIT ? OFFSET ?";

    const [countResult, dataResult] = await Promise.all([
      env.eda_db.prepare(countSQL).bind(...params).first<{ total: number }>(),
      env.eda_db.prepare(dataSQL).bind(...params, pageSize, (page - 1) * pageSize).all(),
    ]);

    return new Response(JSON.stringify({ total: countResult?.total ?? 0, page, pageSize, items: dataResult.results }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=5", ...corsHeaders },
    });
  }

  // GET /admin/visitors/:id — visitor detail with stats
  const detailMatch = url.pathname.match(/^\/admin\/visitors\/(\d+)$/);
  if (detailMatch && method === "GET") {
    const profileId = parseInt(detailMatch[1], 10);

    const profile = await env.eda_db
      .prepare("SELECT id, name, student_id, college, class_name, phone, campus_profile_image, created_at FROM visitor_profiles WHERE id = ?")
      .bind(profileId)
      .first<{ id: number; name: string; student_id: string; college: string; class_name: string; phone: string; campus_profile_image: string | null; created_at: string }>();

    if (!profile) {
      return new Response(JSON.stringify({ error: "访客不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const [countResult, lastVisitResult, insideResult] = await Promise.all([
      env.eda_db.prepare("SELECT COUNT(*) AS cnt FROM visit_records WHERE profile_id = ?").bind(profileId).first<{ cnt: number }>(),
      env.eda_db.prepare("SELECT visit_time, expected_leave_time, actual_leave_time FROM visit_records WHERE profile_id = ? ORDER BY visit_time DESC LIMIT 1").bind(profileId).first<{ visit_time: string; expected_leave_time: string | null; actual_leave_time: string | null }>(),
      env.eda_db.prepare("SELECT COUNT(*) AS cnt FROM visit_records WHERE profile_id = ? AND actual_leave_time IS NULL").bind(profileId).first<{ cnt: number }>(),
    ]);

    return new Response(JSON.stringify({
      profile,
      visitCount: countResult?.cnt ?? 0,
      lastVisit: lastVisitResult?.visit_time ?? null,
      lastExpectedLeave: lastVisitResult?.expected_leave_time ?? null,
      lastActualLeave: lastVisitResult?.actual_leave_time ?? null,
      currentInside: (insideResult?.cnt ?? 0) > 0,
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
