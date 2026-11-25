// Servidor das rotas /api/auth/* fora da Vercel (servidor Oracle Cloud).
// Usa os mesmos handlers Web Request/Response de api/auth/*.ts, compilados para server/build/api
// com `pnpm build:server`. O Caddy entrega os arquivos estáticos e repassa só /api/* para cá.
import http from 'node:http'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const PORT = Number(process.env.API_PORT || 3001)
const HOST = process.env.API_HOST || '127.0.0.1' // só o Caddy, na mesma máquina, fala com o Node
const BUILD = path.resolve(import.meta.dirname, 'build/api')

const ROUTES = {
  'GET /api/auth/firebase-config': ['auth/firebase-config.js', 'GET'],
  'POST /api/auth/session': ['auth/session.js', 'POST'],
  'GET /api/auth/me': ['auth/me.js', 'GET'],
  'POST /api/auth/logout': ['auth/logout.js', 'POST'],
  'GET /api/progress': ['progress.js', 'GET'],
  'PUT /api/progress': ['progress.js', 'PUT'],
}
const cache = new Map()
async function handler(file, method) {
  if (!cache.has(file)) cache.set(file, await import(pathToFileURL(path.join(BUILD, file)).href))
  return cache.get(file)[method]
}

async function toRequest(req) {
  // O Caddy informa o protocolo e o host originais; sem isso o cookie Secure e a conferência de origem (CSRF) sairiam errados.
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
  const host = req.headers['x-forwarded-host'] || req.headers.host || `127.0.0.1:${PORT}`
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await new Promise((ok) => { const c = []; let n = 0; req.on('data', (d) => { n += d.length; if (n > 65_536) req.destroy(); else c.push(d) }); req.on('end', () => ok(Buffer.concat(c))) })
  return new Request(`${proto}://${host}${req.url}`, { method: req.method, headers, body })
}

async function send(res, response) {
  const headers = {}
  response.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v })
  const cookies = response.headers.getSetCookie?.() ?? []
  if (cookies.length) headers['set-cookie'] = cookies
  headers['cache-control'] ??= 'no-store'
  res.writeHead(response.status, headers)
  res.end(Buffer.from(await response.arrayBuffer()))
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const route = ROUTES[`${req.method} ${(req.url || '/').split('?')[0]}`]
    try {
      if (!route) return send(res, Response.json({ error: 'não encontrado' }, { status: 404 }))
      const fn = await handler(...route)
      await send(res, await fn(await toRequest(req)))
    } catch (e) {
      console.error(new Date().toISOString(), req.method, req.url, e)
      await send(res, Response.json({ error: 'erro interno' }, { status: 500 }))
    }
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer().listen(PORT, HOST, () => console.log(`API em http://${HOST}:${PORT}`))
}
