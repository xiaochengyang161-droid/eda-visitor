import { verifyToken } from "../utils/jwt";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export async function authenticate(request: Request): Promise<AuthUser | Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return user;
}
