interface LogUser {
  id: number;
  username: string;
}

export async function logOperation(
  env: Env,
  user: LogUser | null,
  action: string,
  targetType: string | null,
  targetId: number | null,
  detail: string | null,
  ip: string | null
): Promise<void> {
  await env.eda_db
    .prepare(
      `INSERT INTO operation_logs (user_id, username, action, target_type, target_id, detail, ip)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(
      user?.id ?? null,
      user?.username ?? null,
      action,
      targetType,
      targetId,
      detail,
      ip
    )
    .run();
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = request.headers.get("X-Real-IP");
  if (realIP) return realIP;
  return "127.0.0.1";
}
