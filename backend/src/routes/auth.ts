import { corsHeaders } from "../middleware/cors";
import { signToken } from "../utils/jwt";
import { verifyPassword } from "../utils/password";
import { authenticate } from "../middleware/auth";
import { logOperation, getClientIP } from "../utils/logger";

interface LoginBody {
  username: string;
  password: string;
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  // POST /auth/login
  if (method === "POST" && url.pathname === "/auth/login") {
    const body: LoginBody = await request.json();

    if (!body.username || !body.password) {
      return new Response(JSON.stringify({ error: "用户名和密码不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const user = await env.eda_db
      .prepare("SELECT id, username, password_hash, salt, role FROM users WHERE username = ?")
      .bind(body.username)
      .first<{ id: number; username: string; password_hash: string; salt: string; role: string }>();

    if (!user) {
      return new Response(JSON.stringify({ error: "用户名或密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const valid = await verifyPassword(body.password, user.password_hash, user.salt);
    if (!valid) {
      return new Response(JSON.stringify({ error: "用户名或密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await logOperation(env, { id: user.id, username: user.username }, "LOGIN", null, null, "登录成功", ip);

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return new Response(
      JSON.stringify({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // GET /auth/me
  if (method === "GET" && url.pathname === "/auth/me") {
    const userOrError = await authenticate(request);
    if (userOrError instanceof Response) return userOrError;

    const user = await env.eda_db
      .prepare("SELECT id, username, role, real_name FROM users WHERE id = ?")
      .bind(userOrError.id)
      .first<{ id: number; username: string; role: string; real_name: string | null }>();

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // POST /auth/logout
  if (method === "POST" && url.pathname === "/auth/logout") {
    const userOrError = await authenticate(request);
    if (!(userOrError instanceof Response)) {
      await logOperation(env, userOrError, "LOGOUT", null, null, null, ip);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
