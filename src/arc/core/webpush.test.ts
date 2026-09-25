import { test } from "node:test";
import assert from "node:assert/strict";
import { b64u, concat, encrypt, generateVapidKeys, hkdf, unb64u, vapidAuth } from "../../../supabase/functions/_shared/webpush.ts";

const enc = new TextEncoder();

/** What the browser does with a push message: undo the aes128gcm encryption. */
async function decrypt(body: Uint8Array, uaKeys: CryptoKeyPair, auth: Uint8Array) {
  const salt = body.slice(0, 16);
  const idlen = body[20];
  const asPub = body.slice(21, 21 + idlen);
  const ct = body.slice(21 + idlen);
  const uaPub = new Uint8Array(await crypto.subtle.exportKey("raw", uaKeys.publicKey));
  const asKey = await crypto.subtle.importKey("raw", asPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: asKey }, uaKeys.privateKey, 256));
  const ikm = await hkdf(auth, shared, concat(enc.encode("WebPush: info\0"), uaPub, asPub), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ct));
  assert.equal(plain[plain.length - 1], 2, "last-record delimiter");
  return { text: new TextDecoder().decode(plain.slice(0, -1)), rs: new DataView(body.buffer, body.byteOffset + 16, 4).getUint32(0) };
}

test("webpush: base64url round trip", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(65));
  assert.deepEqual(unb64u(b64u(bytes)), bytes);
  assert.doesNotMatch(b64u(bytes), /[+/=]/);
});

test("webpush: a browser can decrypt what we send", async () => {
  const ua = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const msg = JSON.stringify({ title: "In 30 Minuten: BJJ Gi", body: "19:00 Uhr. Deine Quest: Armbar." });
  const body = await encrypt(enc.encode(msg), { p256dh: b64u(await crypto.subtle.exportKey("raw", ua.publicKey)), auth: b64u(auth) });
  const out = await decrypt(body, ua, auth);
  assert.equal(out.text, msg);
  assert.equal(out.rs, 4096);
  assert.equal(body[20], 65);
});

test("webpush: byte-exact with the example in RFC 8291, Appendix A", async () => {
  const asPub = unb64u("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8");
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", x: b64u(asPub.slice(1, 33)), y: b64u(asPub.slice(33)), d: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw", ext: true };
  const server = {
    privateKey: await crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]),
    publicKey: await crypto.subtle.importKey("raw", asPub, { name: "ECDH", namedCurve: "P-256" }, true, []),
  };
  const body = await encrypt(
    enc.encode("When I grow up, I want to be a watermelon"),
    { p256dh: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4", auth: "BTBZMqHH6r4Tts7J_aSIgg" },
    { salt: unb64u("DGv6ra1nlYgDCS1FRnbzlw"), server },
  );
  assert.equal(
    b64u(body),
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
  );
});

test("webpush: VAPID token is signed with the published key", async () => {
  const keys = await generateVapidKeys();
  assert.equal(unb64u(keys.publicKey).length, 65);
  assert.equal(unb64u(keys.privateKey).length, 32);
  const now = Date.parse("2026-09-28T16:30:00Z");
  const header = await vapidAuth("https://fcm.googleapis.com/fcm/send/abc", keys, "https://rukawaanalytics.com/arc/", now);
  const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
  assert.ok(m, header);
  assert.equal(m[4], keys.publicKey);
  const claims = JSON.parse(new TextDecoder().decode(unb64u(m[2])));
  assert.equal(claims.aud, "https://fcm.googleapis.com");
  assert.equal(claims.exp, now / 1000 + 12 * 3600);
  const pub = await crypto.subtle.importKey("raw", unb64u(keys.publicKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, unb64u(m[3]), enc.encode(`${m[1]}.${m[2]}`));
  assert.ok(ok, "signature verifies");
});
