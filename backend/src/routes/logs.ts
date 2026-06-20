import { corsHeaders } from "../middleware/cors";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export async function handleLogs(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method !== "GET" || url.pathname !== "/logs") {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const userOrError = await authenticate(request);
  if (userOrError instanceof Response) return userOrError;

  const forbidden = requireRole(["admin"])(userOrError);
  if (forbidden) return forbidden;

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));
  const actionFilter = url.searchParams.get("action");
  const usernameFilter = url.searchParams.get("username");

  let countSQL = "SELECT COUNT(*) AS total FROM operation_logs";
  let dataSQL = "SELECT * FROM operation_logs";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (actionFilter) {
    conditions.push("action = ?");
    params.push(actionFilter);
  }
  if (usernameFilter) {
    conditions.push("username LIKE ?");
    params.push(`%${usernameFilter}%`);
  }

  if (conditions.length > 0) {
    const where = " WHERE " + conditions.join(" AND ");
    countSQL += where;
    dataSQL += where;
  }

  dataSQL += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

  const [countResult, dataResult] = await Promise.all([
    env.eda_db.prepare(countSQL).bind(...params).first<{ total: number }>(),
    env.eda_db.prepare(dataSQL).bind(...params, pageSize, (page - 1) * pageSize).all(),
  ]);

  return new Response(
    JSON.stringify({
      total: countResult?.total ?? 0,
      page,
      pageSize,
      items: dataResult.results,
    }),
    {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=5", ...corsHeaders },
    }
  );
}
