import { corsHeaders, handleCors } from "./middleware/cors";
import { handleDashboardStats } from "./routes/dashboard";
import { handleAuth } from "./routes/auth";
import { handleUsers } from "./routes/users";
import { handleLogs } from "./routes/logs";
import { handleVisitors } from "./routes/visitors";
import { handleVisitorAdmin } from "./routes/visitor-admin";
import { handleUpload } from "./routes/upload";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    const url = new URL(request.url);

    // Public endpoints
    if (url.pathname.startsWith("/visitor/")) {
      return handleVisitors(request, env);
    }

    if (url.pathname === "/upload") {
      return handleUpload(request, env);
    }

    // Admin endpoints
    if (url.pathname.startsWith("/admin/")) {
      return handleVisitorAdmin(request, env);
    }

    if (url.pathname === "/users" || url.pathname.startsWith("/users/")) {
      return handleUsers(request, env);
    }

    if (url.pathname === "/logs" || url.pathname.startsWith("/logs/")) {
      return handleLogs(request, env);
    }

    if (url.pathname.startsWith("/auth/")) {
      return handleAuth(request, env);
    }

    switch (url.pathname) {
      case "/dashboard/stats":
        return handleDashboardStats(env);

      default:
        return new Response("EDA Visitor System API", { headers: corsHeaders });
    }
  },
} satisfies ExportedHandler<Env>;
