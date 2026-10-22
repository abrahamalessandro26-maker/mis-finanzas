// Utilidades compartidas del sistema de acceso (Cloudflare Pages Functions + KV)
const DAY = 86400000;
export const ALFABETO = 'ACDEFGHJKMNPQRTUVWXY34679'; // sin letras y números que se confunden (0 O 1 I L 5 S 8 B 2 Z)

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function norm(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}
export function fmt(c8) { return c8.slice(0, 4) + '-' + c8.slice(4); }
export function nuevoCodigo() {
  const r = crypto.getRandomValues(new Uint8Array(8));
  let s = ''; for (const x of r) s += ALFABETO[x % ALFABETO.length];
  return s;
}
export function nuevoId() { return b64u(crypto.getRandomValues(new Uint8Array(12))); }

async function hmac(secret, data) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
}
export function iguales(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
export async function firmar(env, code8, did) {
  const sig = await hmac(env.SESSION_SECRET, code8 + '.' + did);
  return code8 + '.' + did + '.' + sig;
}
export async function leerSesion(request, env) {
  const m = /(?:^|;\s*)ses=([^;]+)/.exec(request.headers.get('Cookie') || '');
  if (!m) return null;
  const p = m[1].split('.');
  if (p.length !== 3) return null;
  const esperado = await hmac(env.SESSION_SECRET, p[0] + '.' + p[1]);
  if (!iguales(esperado, p[2])) return null;
  return { code: p[0], did: p[1] };
}
export function cookieSesion(valor) {
  return 'ses=' + valor + '; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax';
}
export async function getCodigo(env, code8) {
  const raw = await env.CODES.get('code:' + code8);
  return raw ? JSON.parse(raw) : null;
}
export function putCodigo(env, code8, rec) { return env.CODES.put('code:' + code8, JSON.stringify(rec)); }

// estado: 'prueba' | 'pago' | 'vencido' | 'inactivo'
export function estadoDe(rec, ahora = Date.now()) {
  if (!rec || rec.active === false) return 'inactivo';
  if (rec.expiresAt && ahora > rec.expiresAt) return 'vencido';
  return rec.paid ? 'pago' : 'prueba';
}
export function diasRestantes(rec, ahora = Date.now()) {
  if (!rec.expiresAt) return rec.days || 0;
  return Math.max(0, Math.ceil((rec.expiresAt - ahora) / DAY));
}
export function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}
export { DAY };
