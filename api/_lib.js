// api/_lib.js
//
// Utilidades compartidas por las funciones serverless.
// Las funciones de Vercel pueden requerir archivos hermanos con require relativo;
// el prefijo "_" hace que Vercel NO lo trate como endpoint (no se monta como ruta).

/**
 * Escapa una cadena para inyectarla con seguridad dentro de HTML.
 * Convierte & < > " ' a sus entidades. Acepta cualquier tipo y stringifica.
 * Si la entrada es null/undefined devuelve cadena vacía.
 *
 * IMPORTANTE: úsalo en TODA interpolación de variables controladas por el
 * usuario (nombre, email, mensaje, servicio…) dentro de HTML de emails.
 * No usarlo permite que un cliente malicioso inyecte HTML arbitrario en los
 * emails que envías a tus propios clientes — un vector de XSS clásico.
 */
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

/**
 * Lee el token de admin del header Authorization: Bearer XXX.
 * Acepta también el legado ?token= y body.token mientras dure la transición,
 * para que un panel admin desactualizado no rompa de un día para otro.
 * Devuelve string vacío si no hay token.
 */
function readAdminToken(req) {
  // 1. Header Authorization: Bearer <token> (preferido)
  var auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (auth && typeof auth === 'string') {
    var m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  // 2. Legacy: query string (?token=) — para no romper deploys mixtos
  if (req.query && req.query.token) return String(req.query.token);
  // 3. Legacy: body.token
  if (req.body && req.body.token) return String(req.body.token);
  return '';
}

/**
 * Comprueba que el token coincide con la variable de entorno ADMIN_TOKEN.
 * Si no coincide, deja escrito un 401 en res y devuelve false.
 * El llamador debe hacer `if (!requireAdmin(req, res)) return;`
 */
function requireAdmin(req, res) {
  var token    = readAdminToken(req);
  var expected = process.env.ADMIN_TOKEN;
  if (!token || !expected || token !== expected) {
    res.status(401).json({ error: 'No autorizado' });
    return false;
  }
  return true;
}

/**
 * Configura cabeceras CORS según el tipo de endpoint.
 *
 *   setCors(res, req, { mode: 'public' })   → Allow-Origin: *
 *   setCors(res, req, { mode: 'admin'  })   → Allow-Origin restringido a sitalia.es
 *                                              y a previews de Vercel
 *
 * Cuando el origen no está permitido, igualmente devolvemos cabeceras (sin
 * Allow-Origin) para que el preflight no rompa, pero el navegador bloqueará
 * la petición real. Esto es lo correcto.
 */
var ADMIN_ALLOWED_ORIGINS = [
  'https://sitalia.es',
  'https://www.sitalia.es'
];

function setCors(res, req, opts) {
  opts = opts || {};
  var mode = opts.mode || 'public';

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', opts.methods || 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (mode === 'public') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return;
  }

  // mode === 'admin'
  var origin = req.headers && (req.headers.origin || req.headers.Origin) || '';

  // Permitir también previews del propio dominio en Vercel (.vercel.app)
  // y entornos locales en desarrollo (localhost).
  var allowed =
    ADMIN_ALLOWED_ORIGINS.indexOf(origin) !== -1 ||
    /^https:\/\/[a-z0-9-]+-sitalia.*\.vercel\.app$/i.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/i.test(origin);

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Si no está permitido, no enviamos Allow-Origin — el navegador bloquea.
}

module.exports = { esc, readAdminToken, requireAdmin, setCors };
