// JWT implementation using Web Crypto API (Cloudflare Workers native)
// Algorithm: HS256 (HMAC-SHA256)

const JWT_SECRET = "eda-cloud-jwt-secret-key-2026";

interface JwtPayload {
  id: number;
  username: string;
  role: string;
  exp?: number;
}

function base64urlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(data: string): string {
  const padded = data.padEnd(data.length + ((4 - (data.length % 4)) % 4), "=");
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

async function hmacSha256(key: string, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, messageData);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload & { iat: number } = {
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(fullPayload));
  const signatureBuf = await hmacSha256(JWT_SECRET, `${headerB64}.${payloadB64}`);
  const signatureB64 = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signatureBuf))
  );

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const expectedSigBuf = await hmacSha256(JWT_SECRET, `${headerB64}.${payloadB64}`);
    const expectedSig = base64urlEncode(
      String.fromCharCode(...new Uint8Array(expectedSigBuf))
    );

    if (expectedSig !== signatureB64) return null;

    // Decode payload
    const payload: JwtPayload & { iat: number; exp: number } = JSON.parse(
      base64urlDecode(payloadB64)
    );

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
