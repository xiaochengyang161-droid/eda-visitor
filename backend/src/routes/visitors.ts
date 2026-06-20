import { corsHeaders } from "../middleware/cors";
import { logOperation, getClientIP } from "../utils/logger";

interface RegisterBody {
  name: string;
  studentId: string;
  college: string;
  className: string;
  phone: string;
  campusProfileImage?: string;
  visitTime: string;
  expectedLeaveTime: string;
}

export async function handleVisitors(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  // POST /visitor/register
  if (method === "POST" && url.pathname === "/visitor/register") {
    const body: RegisterBody = await request.json();

    if (!body.name || !body.studentId || !body.college || !body.className || !body.phone) {
      return new Response(JSON.stringify({ error: "请填写所有必填字段" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate expected_leave_time
    if (!body.expectedLeaveTime) {
      return new Response(JSON.stringify({ error: "请选择预计离开时间" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const now = Date.now();
    const leaveTime = new Date(body.expectedLeaveTime).getTime();
    if (isNaN(leaveTime)) {
      return new Response(JSON.stringify({ error: "预计离开时间格式无效" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (leaveTime <= now) {
      return new Response(JSON.stringify({ error: "预计离开时间必须晚于到访时间" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (leaveTime > now + 24 * 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "预计离开时间不能超过24小时" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Upsert profile
    const existing = await env.eda_db
      .prepare("SELECT id FROM visitor_profiles WHERE student_id = ?")
      .bind(body.studentId)
      .first<{ id: number }>();

    let profileId: number;

    if (existing) {
      await env.eda_db
        .prepare("UPDATE visitor_profiles SET name=?, college=?, class_name=?, phone=?, campus_profile_image=? WHERE id=?")
        .bind(body.name, body.college, body.className, body.phone, body.campusProfileImage ?? null, existing.id)
        .run();
      profileId = existing.id;
    } else {
      const result = await env.eda_db
        .prepare("INSERT INTO visitor_profiles (student_id, name, college, class_name, phone, campus_profile_image) VALUES (?1,?2,?3,?4,?5,?6)")
        .bind(body.studentId, body.name, body.college, body.className, body.phone, body.campusProfileImage ?? null)
        .run();
      profileId = result.meta.last_row_id as number;
    }

    // Create visit record
    await env.eda_db
      .prepare("INSERT INTO visit_records (profile_id, visit_time, expected_leave_time) VALUES (?1,?2,?3)")
      .bind(profileId, new Date().toISOString(), body.expectedLeaveTime)
      .run();

    await logOperation(env, null, "VISITOR_REGISTER", "visit_record", profileId, body.name, ip);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // GET /visitor/history?studentId=xxx
  if (method === "GET" && url.pathname === "/visitor/history") {
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      return new Response(JSON.stringify({ error: "缺少 studentId 参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await env.eda_db
      .prepare(`SELECT vr.id, vr.visit_time, vr.expected_leave_time, vr.actual_leave_time
                FROM visit_records vr
                JOIN visitor_profiles vp ON vr.profile_id = vp.id
                WHERE vp.student_id = ?
                ORDER BY vr.visit_time DESC`)
      .bind(studentId)
      .all();

    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // GET /visitor/profile?studentId=xxx
  if (method === "GET" && url.pathname === "/visitor/profile") {
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      return new Response(JSON.stringify({ error: "缺少 studentId 参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const profile = await env.eda_db
      .prepare("SELECT name, college, class_name, phone, campus_profile_image FROM visitor_profiles WHERE student_id = ?")
      .bind(studentId)
      .first();

    if (!profile) {
      return new Response(JSON.stringify(null), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify(profile), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // PUT /visitor/leave/:id
  const leaveMatch = url.pathname.match(/^\/visitor\/leave\/(\d+)$/);
  if (leaveMatch && method === "PUT") {
    const id = parseInt(leaveMatch[1], 10);

    // Anti-duplicate: check if already left
    const existing = await env.eda_db
      .prepare("SELECT actual_leave_time FROM visit_records WHERE id = ?")
      .bind(id)
      .first<{ actual_leave_time: string | null }>();

    if (!existing) {
      return new Response(JSON.stringify({ error: "记录不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (existing.actual_leave_time) {
      return new Response(JSON.stringify({ error: "该记录已登记离开" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const leaveTime = new Date().toISOString();
    await env.eda_db
      .prepare("UPDATE visit_records SET actual_leave_time = ? WHERE id = ?")
      .bind(leaveTime, id)
      .run();

    await logOperation(env, null, "VISITOR_LEAVE", "visit_record", id, null, ip);

    return new Response(JSON.stringify({ success: true, leaveTime }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
