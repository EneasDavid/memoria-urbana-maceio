# server

API de login para rodar fora da Vercel (VM Oracle Cloud).

- `api-server.mjs`: servidor `node:http` que expõe `/api/auth/login`, `callback`, `me` e `logout` com os mesmos handlers de `api/auth/*.ts`.
- `pnpm build:server` compila `api/` para `server/build/api` (ignorado pelo Git).
- `pnpm start:api` sobe em `127.0.0.1:3001`; o Caddy repassa `/api/*` para cá.

Guia completo em [docs/oracle.md](../docs/oracle.md).
