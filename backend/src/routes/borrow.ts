import { corsHeaders } from "../middleware/cors";
import { authenticate } from "../middleware/auth";
import { logOperation, getClientIP } from "../utils/logger";

interface CreateBorrowBody {
  device_id: number;
  borrower_name: string;
  borrower_phone?: string;
  remark?: string;
}

export async function handleBorrow(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const ip = getClientIP(request);

  let authUser: { id: number; username: string } | null = null;
  try {
    const result = await authenticate(request);
    if (!(result instanceof Response)) authUser = result;
  } catch { /* no auth */ }

  // PUT /borrow/:id/return
  const returnMatch = url.pathname.match(/^\/borrow\/(\d+)\/return$/);
  if (returnMatch && method === "PUT") {
    const id = parseInt(returnMatch[1], 10);

    const record = await env.eda_db
      .prepare("SELECT * FROM borrow_records WHERE id = ?")
      .bind(id)
      .first<{ id: number; device_id: number; status: string }>();

    if (!record) {
      return new Response(JSON.stringify({ error: "借用记录不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (record.status !== "borrowed") {
      return new Response(JSON.stringify({ error: "该记录不是借出状态" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await env.eda_db
      .prepare("UPDATE borrow_records SET status = 'returned', return_time = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(id)
      .run();

    await env.eda_db
      .prepare("UPDATE devices SET status = 'available' WHERE id = ?")
      .bind(record.device_id)
      .run();

    await logOperation(env, authUser, "RETURN_DEVICE", "borrow", id, null, ip);

    const updated = await env.eda_db
      .prepare(`SELECT br.*, d.name AS device_name
                FROM borrow_records br LEFT JOIN devices d ON br.device_id = d.id WHERE br.id = ?`)
      .bind(id)
      .first();
    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // GET /borrow
  if (method === "GET" && url.pathname === "/borrow") {
    const result = await env.eda_db
      .prepare(`SELECT br.*, d.name AS device_name
                FROM borrow_records br LEFT JOIN devices d ON br.device_id = d.id ORDER BY br.id DESC`)
      .all();
    return new Response(JSON.stringify(result.results), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // POST /borrow
  if (method === "POST" && url.pathname === "/borrow") {
    const body: CreateBorrowBody = await request.json();
    if (!body.device_id || !body.borrower_name) {
      return new Response(JSON.stringify({ error: "设备ID和借用人姓名不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const device = await env.eda_db
      .prepare("SELECT * FROM devices WHERE id = ?")
      .bind(body.device_id)
      .first();
    if (!device) {
      return new Response(JSON.stringify({ error: "设备不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (device.status !== "available") {
      return new Response(JSON.stringify({ error: "设备当前不可借用" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await env.eda_db
      .prepare("INSERT INTO borrow_records (device_id, borrower_name, borrower_phone, remark) VALUES (?1, ?2, ?3, ?4)")
      .bind(body.device_id, body.borrower_name, body.borrower_phone ?? null, body.remark ?? null)
      .run();

    await env.eda_db
      .prepare("UPDATE devices SET status = 'borrowed' WHERE id = ?")
      .bind(body.device_id)
      .run();

    await logOperation(env, authUser, "BORROW_DEVICE", "borrow", result.meta.last_row_id as number, body.borrower_name, ip);

    const created = await env.eda_db
      .prepare(`SELECT br.*, d.name AS device_name
                FROM borrow_records br LEFT JOIN devices d ON br.device_id = d.id WHERE br.id = ?`)
      .bind(result.meta.last_row_id)
      .first();
    return new Response(JSON.stringify(created), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
