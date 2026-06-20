import { corsHeaders } from "../middleware/cors";
import { logOperation, getClientIP } from "../utils/logger";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method === "POST" && url.pathname === "/upload") {
    try {
      const contentType = request.headers.get("Content-Type") ?? "";
      if (!contentType.includes("multipart/form-data")) {
        return new Response(JSON.stringify({ error: "请使用 multipart/form-data 上传" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "未找到上传文件" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return new Response(JSON.stringify({ error: "仅支持 JPG、PNG、WebP 格式" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (file.size > MAX_SIZE) {
        return new Response(JSON.stringify({ error: "文件大小不能超过 5MB" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const bytes = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const publicUrl = "data:" + file.type + ";base64," + base64;

      const ip = getClientIP(request);
      await logOperation(env, null, "UPLOAD_CAMPUS_IMAGE", "upload", null, "base64-data-url", ip);

      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err: unknown) {
      return new Response(JSON.stringify({ error: "上传失败: " + (err as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}