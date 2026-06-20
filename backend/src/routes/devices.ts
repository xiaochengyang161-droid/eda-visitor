import { corsHeaders } from "../middleware/cors";
import { authenticate } from "../middleware/auth";
import { logOperation, getClientIP } from "../utils/logger";

interface DeviceBody {
  name?: string;
  category?: string;
  description?: string;
  status?: string;
}

export async function handleDevices(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  // Optionally authenticate for logging
  let authUser: { id: number; username: string } | null = null;
  try {
    const result = await authenticate(request);
    if (!(result instanceof Response)) authUser = result;
  } catch { /* no auth — log without user */ }

  // /devices/:id
  const idMatch = url.pathname.match(/^\/devices\/(\d+)$/);

  if (idMatch) {
    const id = parseInt(idMatch[1], 10);

    if (method === "PUT") {
      const body: DeviceBody = await request.json();
      const updates: string[] = [];
      const params: (string | null)[] = [];

      if (body.name !== undefined) { updates.push("name = ?"); params.push(body.name); }
      if (body.category !== undefined) { updates.push("category = ?"); params.push(body.category); }
      if (body.description !== undefined) { updates.push("description = ?"); params.push(body.description); }
      if (body.status !== undefined) { updates.push("status = ?"); params.push(body.status); }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: "没有要更新的字段" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      params.push(String(id));
      await env.eda_db
        .prepare(`UPDATE devices SET ${updates.join(", ")} WHERE id = ?`)
        .bind(...params)
        .run();

      await logOperation(env, authUser, "UPDATE_DEVICE", "device", id, body.name ?? null, ip);

      const updated = await env.eda_db.prepare("SELECT * FROM devices WHERE id = ?").bind(id).first();
      return new Response(JSON.stringify(updated), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (method === "DELETE") {
      await logOperation(env, authUser, "DELETE_DEVICE", "device", id, null, ip);
      await env.eda_db.prepare("DELETE FROM devices WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (method === "GET") {
      const device = await env.eda_db.prepare("SELECT * FROM devices WHERE id = ?").bind(id).first();
      if (!device) {
        return new Response(JSON.stringify({ error: "设备不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify(device), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  // GET /devices
  if (method === "GET" && url.pathname === "/devices") {
    const result = await env.eda_db.prepare("SELECT * FROM devices ORDER BY id DESC").all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // POST /devices
  if (method === "POST" && url.pathname === "/devices") {
    const body: DeviceBody = await request.json();
    if (!body.name) {
      return new Response(JSON.stringify({ error: "设备名称不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await env.eda_db
      .prepare("INSERT INTO devices (name, category, description) VALUES (?1, ?2, ?3)")
      .bind(body.name, body.category ?? null, body.description ?? null)
      .run();

    await logOperation(env, authUser, "CREATE_DEVICE", "device", result.meta.last_row_id as number, body.name, ip);

    const created = await env.eda_db.prepare("SELECT * FROM devices WHERE id = ?").bind(result.meta.last_row_id).first();
    return new Response(JSON.stringify(created), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
