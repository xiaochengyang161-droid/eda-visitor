import type { AuthUser } from "./auth";

type Role = "admin" | "manager" | "user" | "visitor";

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  user: 2,
  visitor: 1,
};

export function requireRole(allowedRoles: Role[]) {
  return function checkRole(user: AuthUser): Response | null {
    const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const required = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));

    if (userLevel < required) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return null;
  };
}
