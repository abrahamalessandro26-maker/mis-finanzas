// Puerta de acceso: la app (index.html) solo se entrega con una sesión válida.
import { leerSesion, getCodigo, estadoDe } from '../lib/auth.js';

const PUBLICOS = new Set([
  '/activar', '/activar.html', '/vencido', '/vencido.html', '/admin', '/admin.html',
  '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-touch-icon.png', '/favicon.ico'
]);

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (PUBLICOS.has(url.pathname) || url.pathname.startsWith('/api/')) return context.next();

  const ses = await leerSesion(request, env);
  let rec = null, estado = 'inactivo';
  if (ses) {
    rec = await getCodigo(env, ses.code);
    estado = estadoDe(rec);
    if (rec && !(rec.devices || []).some((d) => d.id === ses.did)) { rec = null; estado = 'inactivo'; }
  }

  if (rec && (estado === 'prueba' || estado === 'pago')) {
    const res = await context.next();
    const h = new Headers(res.headers);
    h.set('Cache-Control', 'private, no-store');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }
  if (rec && estado === 'vencido') {
    const r = await env.ASSETS.fetch(new URL('/vencido.html', url));
    const h = new Headers(r.headers); h.set('Cache-Control', 'no-store');
    return new Response(r.body, { status: 200, headers: h });
  }
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    return new Response(null, { status: 302, headers: { Location: '/activar.html', 'Cache-Control': 'no-store' } });
  }
  return new Response('Acceso no autorizado', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}
