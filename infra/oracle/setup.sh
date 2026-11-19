#!/usr/bin/env bash
# Prepara uma VM Ubuntu 24.04 (Ampere A1, Oracle Cloud Always Free) para o Memória Urbana Maceió.
# Uso, na VM, como usuário com sudo:
#   curl -fsSLO https://raw.githubusercontent.com/EneasDavid/memoria-urbana-maceio/main/infra/oracle/setup.sh
#   less setup.sh   # leia antes de rodar
#   sudo SITE_DOMAIN=seu.dominio.com.br ACME_EMAIL=voce@exemplo.com bash setup.sh
# Idempotente: pode rodar de novo para atualizar a configuração.
set -euo pipefail

: "${SITE_DOMAIN:?defina SITE_DOMAIN (ex.: memoriaurbana.com.br ou <ip>.sslip.io)}"
: "${ACME_EMAIL:?defina ACME_EMAIL (aviso de expiração do certificado)}"
APP=/srv/memoria-urbana
ETC=/etc/memoria-urbana

echo "==> Pacotes base e atualizações automáticas de segurança"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y curl gnupg rsync ufw unattended-upgrades iptables-persistent debian-keyring debian-archive-keyring apt-transport-https
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Node.js 22 (NodeSource)"
if ! node --version 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> Caddy (repositório oficial)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "==> Firewall: as imagens Ubuntu da Oracle bloqueiam 80/443 no iptables mesmo com a security list aberta"
for port in 80 443; do
  iptables -C INPUT -p tcp --dport $port -m state --state NEW -j ACCEPT 2>/dev/null || iptables -I INPUT 6 -p tcp --dport $port -m state --state NEW -j ACCEPT
done
netfilter-persistent save

echo "==> Usuário de deploy (só envia arquivos e reinicia a API)"
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
install -d -o deploy -g deploy -m 755 $APP $APP/releases
install -d -m 750 -o root -g deploy $ETC
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys && chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
cat > /etc/sudoers.d/memoria-urbana <<'SUDO'
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart memoria-urbana-api, /usr/bin/systemctl reload caddy
SUDO
chmod 440 /etc/sudoers.d/memoria-urbana

echo "==> Segredos do login (preencha depois; nunca vão para o Git)"
if [ ! -f $ETC/api.env ]; then
  cat > $ETC/api.env <<ENV
# OAuth Google (KAN-59). Sem estes valores, /api/auth/me responde configured:false e o site segue funcionando.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')
GESTOR_EMAILS=
API_PORT=3001
ENV
  chown root:deploy $ETC/api.env && chmod 640 $ETC/api.env
fi
printf 'SITE_DOMAIN=%s\nACME_EMAIL=%s\n' "$SITE_DOMAIN" "$ACME_EMAIL" > $ETC/caddy.env

echo "==> Serviço da API (systemd, usuário sem privilégios)"
cat > /etc/systemd/system/memoria-urbana-api.service <<UNIT
[Unit]
Description=Memória Urbana Maceió · API de login
After=network-online.target

[Service]
User=deploy
WorkingDirectory=$APP/current
EnvironmentFile=$ETC/api.env
ExecStart=/usr/bin/node server/api-server.mjs
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadOnlyPaths=$APP

[Install]
WantedBy=multi-user.target
UNIT

echo "==> Caddy"
install -d /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironmentFile=%s/caddy.env\n' "$ETC" > /etc/systemd/system/caddy.service.d/env.conf
install -d -o caddy -g caddy /var/log/caddy
if [ -f $APP/current/infra/oracle/Caddyfile ]; then cp $APP/current/infra/oracle/Caddyfile /etc/caddy/Caddyfile
else curl -fsSL https://raw.githubusercontent.com/EneasDavid/memoria-urbana-maceio/main/infra/oracle/Caddyfile -o /etc/caddy/Caddyfile; fi
systemctl daemon-reload
systemctl enable memoria-urbana-api caddy
systemctl restart caddy
[ -d $APP/current ] && systemctl restart memoria-urbana-api || true

echo
echo "Pronto. Falta:"
echo " 1. Colar a chave pública de deploy em /home/deploy/.ssh/authorized_keys (docs/oracle.md, passo 5)"
echo " 2. Rodar o workflow 'Deploy Oracle' no GitHub para publicar o primeiro release"
echo " 3. Apontar o DNS de $SITE_DOMAIN para o IP público desta VM"
