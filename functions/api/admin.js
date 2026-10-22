import { norm, fmt, nuevoCodigo, getCodigo, putCodigo, estadoDe, diasRestantes, iguales, json, DAY } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'x';
  const kf = 'afail:' + ip;
  const fails = parseInt((await env.CODES.get(kf)) || '0', 10);
  if (fails >= 8) return json({ ok: false, error: 'Bloqueado 15 minutos por intentos fallidos.' }, 429);
  if (!env.ADMIN_KEY || !iguales(request.headers.get('x-admin-key') || '', env.ADMIN_KEY)) {
    await env.CODES.put(kf, String(fails + 1), { expirationTtl: 900 });
    return json({ ok: false, error: 'Clave incorrecta.' }, 401);
  }
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'Solicitud no válida.' }, 400); }
  const a = b.action, code = norm(b.code);

  if (a === 'list') {
    const out = [];
    let cursor;
    do {
      const l = await env.CODES.list({ prefix: 'code:', cursor });
      for (const k of l.keys) {
        const c8 = k.name.slice(5), rec = await getCodigo(env, c8);
        if (!rec) continue;
        out.push({ code: fmt(c8), name: rec.name || '', estado: estadoDe(rec), dias: diasRestantes(rec), activado: !!rec.expiresAt,
          expiresAt: rec.expiresAt || null, dispositivos: (rec.devices || []).length, max: rec.max || 2, paid: !!rec.paid, active: rec.active !== false, note: rec.note || '' });
      }
      cursor = l.list_complete ? null : l.cursor;
    } while (cursor);
    out.sort((x, y) => x.name.localeCompare(y.name));
    return json({ ok: true, items: out });
  }
  if (a === 'create') {
    let c8; do { c8 = nuevoCodigo(); } while (await getCodigo(env, c8));
    const days = Math.min(Math.max(parseInt(b.days, 10) || 3, 1), 365);
    await putCodigo(env, c8, { name: String(b.name || '').slice(0, 60), note: String(b.note || '').slice(0, 120), created: Date.now(), active: true, paid: false, days, max: 2, expiresAt: null, devices: [] });
    return json({ ok: true, code: fmt(c8) });
  }
  const rec = code.length === 8 ? await getCodigo(env, code) : null;
  if (!rec) return json({ ok: false, error: 'Código no encontrado.' }, 404);

  if (a === 'extend') {                       // marca como pagado y suma días
    const n = Math.min(Math.max(parseInt(b.days, 10) || 30, 1), 3650);
    if (rec.expiresAt) rec.expiresAt = Math.max(rec.expiresAt, Date.now()) + n * DAY; else rec.days = (rec.days || 0) + n;
    rec.paid = true; rec.active = true;
  } else if (a === 'toggle') rec.active = rec.active === false;
  else if (a === 'reset') rec.devices = [];
  else if (a === 'rename') { rec.name = String(b.name || '').slice(0, 60); }
  else if (a === 'delete') { await env.CODES.delete('code:' + code); return json({ ok: true }); }
  else return json({ ok: false, error: 'Acción desconocida.' }, 400);
  await putCodigo(env, code, rec);
  return json({ ok: true });
}
