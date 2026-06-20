import { corsHeaders } from "../middleware/cors";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { generateSalt, hashPassword } from "../utils/password";
import { logOperation, getClientIP } from "../utils/logger";

interface CreateUserBody {
  username: string;
  password: string;
  realName?: string;
  role?: string;
}

interface UpdateUserBody {
  real_name?: string;
  phone?: string;
  role?: string;
}

export async function handleUsers(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  const userOrError = await authenticate(request);
  if (userOrError instanceof Response) return userOrError;

  const forbidden = requireRole(["admin"])(userOrError);
  if (forbidden) return forbidden;

  const idMatch = url.pathname.match(/^\/users\/(\d+)$/);

  if (idMatch) {
    const id = parseInt(idMatch[1], 10);

    if (method === "PUT") {
      const body: UpdateUserBody = await request.json();
      const updates: string[] = [];
      const params: (string | number | null)[] = [];

      if (body.real_name !== undefined) { updates.push("real_name = ?"); params.push(body.real_name); }
      if (body.phone !== undefined) { updates.push("phone = ?"); params.push(body.phone); }
      if (body.role !== undefined) { updates.push("role = ?"); params.push(body.role); }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: "没有要更新的字段" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      params.push(id);
      await env.eda_db
        .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
        .bind(...params.map((p) => p ?? null))
        .run();

      await logOperation(env, userOrError, "UPDATE_USER", "user", id, null, ip);

      const updated = await env.eda_db
        .prepare("SELECT id, username, role, real_name, phone, created_at FROM users WHERE id = ?")
        .bind(id)
        .first();
      return new Response(JSON.stringify(updated), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (method === "DELETE") {
      const targetUser = await env.eda_db
        .prepare("SELECT id, username, role FROM users WHERE id = ?")
        .bind(id)
        .first<{ id: number; username: string; role: string }>();

      if (!targetUser) {
        return new Response(JSON.stringify({ error: "用户不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (targetUser.id === userOrError.id) {
        return new Response(JSON.stringify({ error: "不能删除自己" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await env.eda_db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      await logOperation(env, userOrError, "DELETE_USER", "user", id, targetUser.username, ip);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  // GET /users
  if (method === "GET" && url.pathname === "/users") {
    const result = await env.eda_db
      .prepare("SELECT id, username, role, real_name, phone, created_at FROM users ORDER BY id ASC")
      .all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // POST /users
  if (method === "POST" && url.pathname === "/users") {
    const body: CreateUserBody = await request.json();

    if (!body.username || !body.password) {
      return new Response(JSON.stringify({ error: "用户名和密码不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const existing = await env.eda_db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(body.username)
      .first();
    if (existing) {
      return new Response(JSON.stringify({ error: "用户名已存在" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const salt = generateSalt();
    const hash = await hashPassword(body.password, salt);

    await env.eda_db
      .prepare("INSERT INTO users (username, password_hash, salt, real_name, role) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(body.username, hash, salt, body.realName ?? null, body.role ?? "user")
      .run();

    await logOperation(env, userOrError, "CREATE_USER", "user", null, body.username, ip);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
