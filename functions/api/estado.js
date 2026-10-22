import { leerSesion, getCodigo, estadoDe, diasRestantes, json } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  const ses = await leerSesion(request, env);
  if (!ses) return json({ ok: false, estado: 'inactivo' }, 401);
  const rec = await getCodigo(env, ses.code);
  if (!rec || !(rec.devices || []).some((d) => d.id === ses.did)) return json({ ok: false, estado: 'inactivo' }, 401);
  return json({ ok: true, estado: estadoDe(rec), dias: diasRestantes(rec), nombre: rec.name || '' });
}
