# infra/oracle

Servidor Oracle Cloud Always Free (Ubuntu 24.04, Ampere A1).

- `setup.sh`: prepara a VM (Node 22, Caddy, iptables 80/443, usuário `deploy`, serviço systemd, atualizações automáticas).
- `Caddyfile`: HTTPS automático, arquivos estáticos com HTML pré-renderizado, `/api/*` para o Node e os mesmos cabeçalhos de segurança da Vercel.

Passo a passo em [docs/oracle.md](../../docs/oracle.md).
