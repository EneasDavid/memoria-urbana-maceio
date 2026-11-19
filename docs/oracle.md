# Hospedagem na Oracle Cloud (Always Free)

Guia para tirar o site da Vercel e rodar numa VM grátis da Oracle. Tasks: KAN-105 a KAN-109 (épico KAN-82).

## O que é grátis (novembro de 2026)

- **VM Arm Ampere A1:** até 2 OCPUs e 12 GB de RAM no total. Em junho de 2026 a Oracle reduziu de 4 OCPUs e 24 GB.
- **Disco:** 200 GB de bloco no total, contando o disco de boot.
- **Duas VMs AMD pequenas** (1/8 OCPU e 1 GB). Servem de reserva se faltar capacidade Arm.
- **Cuidados:**
  - O cadastro pede cartão de crédito ou débito, só para verificação.
  - A Oracle pode recuperar uma conta parada por mais de 30 dias. O deploy contínuo mantém a conta em uso.
  - Se, no fim do trial, as VMs A1 passarem de 2 OCPUs e 12 GB somados, **todas** são desligadas. Crie a VM já dentro do limite.

## Arquitetura

```
navegador ──HTTPS──> Caddy (443, certificado automático)
                       ├── /api/*  → Node 22 (127.0.0.1:3001) · server/api-server.mjs → mesmos handlers de api/auth/*.ts
                       └── resto   → /srv/memoria-urbana/current/dist (HTML pré-renderizado + spa.html)
```

- Os cabeçalhos de segurança (CSP, HSTS, COOP) são os mesmos de `vercel.json`. `tests/oracle.test.mjs` falha se divergirem.
- Cada deploy vira uma pasta em `releases/<commit>`. O link `current` é trocado de uma vez, e os 5 últimos releases ficam guardados para voltar rápido.

## Passo a passo

### 1. Criar a conta (dono do projeto)

Acesse https://signup.cloud.oracle.com. Na **Home Region**, escolha **Brazil East (São Paulo)**: ela não muda depois, e o Always Free só vale nela.

### 2. Criar a VM

Caminho: Compute → Instances → Create instance.

- **Image:** Canonical Ubuntu 24.04.
- **Shape:** Ampere → `VM.Standard.A1.Flex`, com **1 OCPU e 6 GB**. Sobra metade do limite grátis para o backend (Render/Firebase hoje, talvez a VM no futuro).
- **Networking:** VCN padrão com IP público.
- **SSH:** "Generate a key pair" e baixe a chave privada, ou cole a sua chave pública.
- Se aparecer "Out of capacity", tente outro Availability Domain ou espere algumas horas.

### 3. Abrir as portas 80 e 443

Caminho: Networking → Virtual cloud networks → sua VCN → Security Lists → Default.

Adicione duas Ingress Rules:
- 0.0.0.0/0, TCP, porta 80;
- 0.0.0.0/0, TCP, porta 443.

### 4. Domínio

Aponte um registro **A** do domínio para o IP público da VM. Sem domínio, dá para testar com `<IP-com-traços>.sslip.io`, por exemplo `129-1-2-3.sslip.io`. O Caddy consegue certificado para esse endereço.

### 5. Preparar a VM

```bash
ssh ubuntu@<IP>
curl -fsSLO https://raw.githubusercontent.com/EneasDavid/memoria-urbana-maceio/main/infra/oracle/setup.sh
less setup.sh
sudo SITE_DOMAIN=<dominio> ACME_EMAIL=<seu-email> bash setup.sh
```

O script faz o seguinte:
- instala Node 22 e Caddy;
- abre 80/443 no iptables (as imagens Ubuntu da Oracle bloqueiam essas portas mesmo com a Security List liberada);
- cria o usuário `deploy`, o serviço `memoria-urbana-api` e o arquivo `/etc/memoria-urbana/api.env` com `SESSION_SECRET` aleatório;
- liga as atualizações automáticas de segurança.

Depois gere uma chave **só para o deploy**, no seu computador e não na VM:

```bash
ssh-keygen -t ed25519 -f oracle_deploy -C "deploy memoria-urbana" -N ""
ssh ubuntu@<IP> "sudo tee -a /home/deploy/.ssh/authorized_keys" < oracle_deploy.pub
ssh-keyscan -t ed25519 <IP>   # saída vai para ORACLE_KNOWN_HOSTS
```

### 6. Ligar o deploy no GitHub (dono do repositório)

Caminho: Settings → Secrets and variables → Actions.

| Tipo | Nome | Valor |
|---|---|---|
| Variable | `ORACLE_HOST` | IP ou domínio da VM |
| Variable | `SITE_URL` | `https://<dominio>` (vai para canonical, sitemap e robots) |
| Secret | `ORACLE_SSH_KEY` | conteúdo de `oracle_deploy` (a chave privada) |
| Secret | `ORACLE_KNOWN_HOSTS` | saída do `ssh-keyscan` |

Depois rode **Actions → Deploy Oracle → Run workflow**. A partir daí, todo push na `main` com CI verde publica sozinho. O último passo do workflow confere `/`, um monumento, `robots.txt`, `sitemap.xml` e `/api/auth/me`.

### 7. Login com Google na VM

Quando o cliente OAuth existir (KAN-59):
- preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GESTOR_EMAILS` em `/etc/memoria-urbana/api.env`;
- adicione `https://<dominio>/api/auth/callback` nas URIs de redirecionamento do Google;
- rode `sudo systemctl restart memoria-urbana-api`.

### 8. Virada

A Vercel continua no ar como reserva. Quando o domínio novo estiver estável:
- troque `SITE_URL`;
- envie o novo sitemap no Search Console (`docs/seo.md`);
- só então desligue o projeto na Vercel.

## Operação

- **Logs:**
  - `journalctl -u memoria-urbana-api -f`
  - `sudo tail -f /var/log/caddy/memoria-urbana.log`
- **Voltar um release:**
  ```bash
  ln -sfn /srv/memoria-urbana/releases/<commit> /srv/memoria-urbana/current && sudo systemctl restart memoria-urbana-api
  ```
- **Atualizar o Caddyfile:** rode o `setup.sh` de novo. Ele é idempotente.
