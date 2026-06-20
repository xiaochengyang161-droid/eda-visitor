import { corsHeaders } from "../middleware/cors";
import { authenticate } from "../middleware/auth";
import { logOperation, getClientIP } from "../utils/logger";

type ReservationStatus = "pending" | "approved" | "rejected" | "completed";

interface CreateReservationBody {
  deviceId: number;
  userName: string;
  purpose: string;
}

interface UpdateReservationBody {
  status: ReservationStatus;
}

export async function handleReservations(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  let authUser: { id: number; username: string } | null = null;
  try {
    const result = await authenticate(request);
    if (!(result instanceof Response)) authUser = result;
  } catch { /* no auth */ }

  const idMatch = url.pathname.match(/^\/reservations\/(\d+)$/);

  if (idMatch) {
    const id = parseInt(idMatch[1], 10);

    if (method === "GET") {
      const reservation = await env.eda_db
        .prepare("SELECT * FROM reservations WHERE id = ?")
        .bind(id).first();
      if (!reservation) {
        return new Response(JSON.stringify({ error: "预约不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify(reservation), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (method === "PUT") {
      const body: UpdateReservationBody = await request.json();
      if (!["pending", "approved", "rejected", "completed"].includes(body.status)) {
        return new Response(JSON.stringify({ error: "无效的状态值" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const reservation = await env.eda_db
        .prepare("SELECT * FROM reservations WHERE id = ?")
        .bind(id)
        .first<{ id: number; device_id: number; user_name: string; status: string }>();

      if (!reservation) {
        return new Response(JSON.stringify({ success: false, error: "预约不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await env.eda_db.prepare("UPDATE reservations SET status = ? WHERE id = ?").bind(body.status, id).run();

      if (body.status === "approved") {
        const device = await env.eda_db
          .prepare("SELECT * FROM devices WHERE id = ?").bind(reservation.device_id)
          .first<{ id: number; status: string }>();
        if (!device || device.status !== "available") {
          return new Response(JSON.stringify({ success: false, error: "设备当前不可用" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        await env.eda_db.prepare("UPDATE devices SET status = 'borrowed' WHERE id = ?").bind(reservation.device_id).run();
        await env.eda_db.prepare("INSERT INTO borrow_records (device_id, borrower_name, status) VALUES (?1, ?2, 'borrowed')")
          .bind(reservation.device_id, reservation.user_name).run();

        await logOperation(env, authUser, "APPROVE_RESERVATION", "reservation", id, reservation.user_name, ip);
      } else if (body.status === "rejected") {
        await logOperation(env, authUser, "REJECT_RESERVATION", "reservation", id, reservation.user_name, ip);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (method === "DELETE") {
      await logOperation(env, authUser, "DELETE_RESERVATION", "reservation", id, null, ip);
      await env.eda_db.prepare("DELETE FROM reservations WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  // GET /reservations
  if (method === "GET" && url.pathname === "/reservations") {
    const result = await env.eda_db
      .prepare("SELECT * FROM reservations ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // POST /reservations
  if (method === "POST" && url.pathname === "/reservations") {
    const body: CreateReservationBody = await request.json();
    if (!body.deviceId || !body.userName) {
      return new Response(JSON.stringify({ error: "设备ID和用户姓名不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    await env.eda_db
      .prepare("INSERT INTO reservations (device_id, user_name, purpose, status) VALUES (?1, ?2, ?3, 'pending')")
      .bind(body.deviceId, body.userName, body.purpose ?? null).run();

    await logOperation(env, authUser, "CREATE_RESERVATION", "reservation", null, body.userName, ip);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
