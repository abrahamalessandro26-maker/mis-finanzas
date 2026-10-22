import { norm, getCodigo, putCodigo, leerSesion, firmar, cookieSesion, nuevoId, estadoDe, json, DAY } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'Solicitud no válida.' }, 400); }
  const code = norm(body.code);
  if (code.length !== 8) return json({ ok: false, error: 'El código debe tener 8 letras y números.' }, 400);

  // límite simple de intentos por IP (15 min)
  const ip = request.headers.get('CF-Connecting-IP') || 'x';
  const kf = 'fail:' + ip;
  const fails = parseInt((await env.CODES.get(kf)) || '0', 10);
  if (fails >= 10) return json({ ok: false, error: 'Demasiados intentos. Espera 15 minutos.' }, 429);

  const rec = await getCodigo(env, code);
  if (!rec) {
    await env.CODES.put(kf, String(fails + 1), { expirationTtl: 900 });
    return json({ ok: false, error: 'Código incorrecto.' }, 404);
  }
  if (rec.active === false) return json({ ok: false, error: 'Este código está desactivado.' }, 403);

  const ahora = Date.now();
  if (!rec.expiresAt) { rec.expiresAt = ahora + (rec.days || 3) * DAY; rec.firstAt = ahora; }
  if (estadoDe(rec, ahora) === 'vencido') return json({ ok: false, error: 'Tu prueba o plan ya terminó. Contacta a quien te dio el acceso.' }, 403);

  rec.devices = rec.devices || [];
  const ses = await leerSesion(request, env);
  let did = ses && ses.code === code && rec.devices.some((d) => d.id === ses.did) ? ses.did : null;
  if (!did) {
    if (rec.devices.length >= (rec.max || 2)) return json({ ok: false, error: 'Este código ya se usa en ' + (rec.max || 2) + ' dispositivos. Pide que te lo reinicien.' }, 403);
    did = nuevoId();
    rec.devices.push({ id: did, at: ahora, ua: (request.headers.get('User-Agent') || '').slice(0, 120) });
  }
  await putCodigo(env, code, rec);
  return json({ ok: true }, 200, { 'Set-Cookie': cookieSesion(await firmar(env, code, did)) });
}
