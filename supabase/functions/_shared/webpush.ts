// Web Push with nothing but WebCrypto: VAPID signing (RFC 8292) and payload
// encryption with aes128gcm (RFC 8291). Runs the same in Deno (Edge
// Functions) and Node 22 (tests).

const enc = new TextEncoder();

export interface PushTarget {
  endpoint: string;
  /** Browser public key, base64url (65 bytes uncompressed P-256). */
  p256dh: string;
  /** Browser auth secret, base64url (16 bytes). */
  auth: string;
}

export interface VapidKeys {
  /** Uncompressed public key, base64url. Goes to the browser as applicationServerKey. */
  publicKey: string;
  /** Private scalar d, base64url. Never leaves the server. */
  privateKey: string;
}

export function b64u(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function unb64u(s: string) {
  const b64 = (s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8));
}

export async function generateVapidKeys(): Promise<VapidKeys> {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { publicKey: b64u(raw), privateKey: jwk.d as string };
}

function signingKey(keys: VapidKeys) {
  const pub = unb64u(keys.publicKey);
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), d: keys.privateKey, ext: true };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

/** Authorization header for one push service (the JWT audience is the endpoint's origin). */
export async function vapidAuth(endpoint: string, keys: VapidKeys, subject: string, now = Date.now()) {
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await signingKey(keys), enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${keys.publicKey}`;
}

/** Encrypts a message for one browser (single record, aes128gcm). */
export async function encrypt(message: Uint8Array, target: Pick<PushTarget, "p256dh" | "auth">, fixed?: { salt: Uint8Array; server: CryptoKeyPair }) {
  const ua = unb64u(target.p256dh);
  const secret = unb64u(target.auth);
  const server = fixed?.server ?? (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", server.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, server.privateKey, 256));
  const ikm = await hkdf(secret, shared, concat(enc.encode("WebPush: info\0"), ua, asPub), 32);
  const salt = fixed?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // One record: the message, then the delimiter 0x02 (last record, no padding).
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(message, new Uint8Array([2]))));
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

/** Sends one message. 404 and 410 mean the subscription is gone for good. */
export async function sendPush(target: PushTarget, data: unknown, keys: VapidKeys, subject: string, ttl = 3600) {
  const body = await encrypt(enc.encode(JSON.stringify(data)), target);
  const res = await fetch(target.endpoint, {
    method: "POST",
    headers: {
      TTL: String(ttl),
      Urgency: "high",
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: await vapidAuth(target.endpoint, keys, subject),
    },
    body,
  });
  await res.body?.cancel().catch(() => undefined);
  return { status: res.status, ok: res.status >= 200 && res.status < 300, gone: res.status === 404 || res.status === 410 };
}
