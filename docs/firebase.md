# Firebase e login com Google: como gerar as credenciais

Com estes passos, quem entra com Google tem selos, pontos e passaporte salvos online (Firestore). A pessoa pode sair, trocar de celular ou limpar o navegador sem perder nada. Leva uns 15 minutos.

São **5 variáveis** na Vercel:

| Variável | Para quê | De onde vem |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Login com Google | Passo 4 |
| `GOOGLE_CLIENT_SECRET` | Login com Google | Passo 4 |
| `SESSION_SECRET` | Assinar a sessão e a prova de dono de cada selo | Passo 5 |
| `FIREBASE_SERVICE_ACCOUNT` | Gravar e ler o progresso no Firestore | Passo 3 |
| `GESTOR_EMAILS` | (opcional) e-mails que abrem o painel da prefeitura | Vocês |

> **Nunca** coloque o arquivo JSON nem os segredos no Git, no Jira, em slides ou no chat. O `.gitignore` já bloqueia `*-firebase-adminsdk-*.json` e `*service-account*.json`.

---

## 1. Criar o projeto no Firebase

1. Abra <https://console.firebase.google.com> e entre com a conta Google do time.
2. **Adicionar projeto** → nome `memoria-urbana-maceio` → pode desligar o Google Analytics (o site não usa) → **Criar projeto**.

O projeto do Firebase **é** um projeto do Google Cloud: o login com Google (passo 4) fica no mesmo lugar.

## 2. Criar o banco (Firestore)

1. No menu: **Criação** → **Firestore Database** → **Criar banco de dados**.
2. **Local:** `southamerica-east1 (São Paulo)`. Fica mais perto de Maceió, e os dados ficam no Brasil (LGPD). Não dá para mudar depois.
3. **Modo de produção** → **Criar**.
4. Aba **Regras**: apague o que estiver lá, cole o conteúdo de [`firebase/firestore.rules`](../firebase/firestore.rules) (tudo `if false`) e clique em **Publicar**.
   - Assim, **nenhum navegador** lê ou grava direto no banco. Só a nossa API faz isso, com a conta de serviço do passo 3, que já confere a sessão e a prova de dono dos selos.

## 3. Gerar a conta de serviço (credencial do servidor)

**Opção recomendada (mínimo de permissão):**

1. Abra <https://console.cloud.google.com/iam-admin/serviceaccounts> e escolha o projeto `memoria-urbana-maceio` no topo.
2. **Criar conta de serviço** → nome `api-progresso` → **Criar e continuar**.
3. **Papel:** procure **Cloud Datastore User** (é o que dá acesso ao Firestore) → **Continuar** → **Concluir**.
4. Clique na conta criada → aba **Chaves** → **Adicionar chave** → **Criar nova chave** → **JSON** → **Criar**. O arquivo é baixado (algo como `memoria-urbana-maceio-1a2b3c.json`).

**Opção rápida:** no Firebase, ⚙️ **Configurações do projeto** → **Contas de serviço** → **Gerar nova chave privada**. Funciona, mas essa conta tem acesso a tudo no projeto.

**Transformar o JSON em uma linha (base64)** para colar na Vercel:

```bash
base64 -w0 memoria-urbana-maceio-1a2b3c.json
```

No Mac (o `base64` do Mac não tem `-w0`):

```bash
base64 -i memoria-urbana-maceio-1a2b3c.json | tr -d '\n'
```

No Windows (PowerShell):

```bash
[Convert]::ToBase64String([IO.File]::ReadAllBytes("memoria-urbana-maceio-1a2b3c.json"))
```

O resultado (um texto longo) vai em `FIREBASE_SERVICE_ACCOUNT`. Também funciona colar o JSON inteiro, sem converter. Depois de configurar, **apague o arquivo** do computador ou guarde num cofre de senhas.

## 4. Criar o login com Google (OAuth)

Ainda em <https://console.cloud.google.com>, no mesmo projeto:

1. **APIs e serviços** → **Tela de permissão OAuth** (ou **Google Auth Platform**):
   - Tipo: **Externo**. Nome do app: `Memória Urbana Maceió`. E-mail de suporte: o do time.
   - Escopos: só `openid`, `email` e `profile` (o site não pede mais nada).
   - Enquanto estiver em **Teste**, só os e-mails cadastrados em "Usuários de teste" conseguem entrar. Para abrir a todos, clique em **Publicar app**.
2. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth** → tipo **Aplicativo da Web**.
   - **URIs de redirecionamento autorizados**, adicione exatamente:
     - `https://memoria-urbana-maceio.vercel.app/api/auth/callback`
     - (se usar o servidor Oracle) `https://SEU-DOMINIO/api/auth/callback`
     - (para testar localmente com `vercel dev`) `http://localhost:3000/api/auth/callback`
   - **Criar** → copie o **ID do cliente** (`GOOGLE_CLIENT_ID`, termina em `.apps.googleusercontent.com`) e a **Chave secreta do cliente** (`GOOGLE_CLIENT_SECRET`, começa com `GOCSPX-`).

> Erro `redirect_uri_mismatch` no login = o endereço do passo 4.2 está diferente do site (confira `https`, domínio e `/api/auth/callback`, sem barra no final).

## 5. Gerar o `SESSION_SECRET`

Precisa ter 32 caracteres ou mais, aleatórios:

```bash
openssl rand -base64 48
```

Sem `openssl`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Guarde bem: trocar esse valor desconecta todo mundo. Os selos não se perdem, porque o servidor assina de novo os que já estão no Firestore.

## 6. Colocar tudo na Vercel

1. <https://vercel.com/eneasdavids-projects/memoria-urbana-maceio> → **Settings** → **Environment Variables**.
2. Adicione as 5 variáveis da tabela do topo, marcando **Production** e **Preview**.
3. **Deployments** → no último deploy, **⋯** → **Redeploy**. As variáveis só valem para deploys novos.

No **servidor Oracle**, as mesmas variáveis vão em `/etc/memoria-urbana/api.env`, seguido de `sudo systemctl restart memoria-urbana-api`.

## 7. Conferir se funcionou

1. Abra `https://memoria-urbana-maceio.vercel.app/api/auth/me`: deve aparecer `"configured":true`.
2. Entre com Google, leia uma placa (ou abra `/monumento/nise?via=qr`) e confira o selo no Passaporte.
3. **Perfil → Sair da conta**, entre de novo, ou entre em **outro celular** com a mesma conta: o selo continua lá.
4. No Firebase → Firestore → coleção `progresso`: há um documento por conta. O id do documento é um hash e não revela quem é a pessoa. Os campos são `selos`, `pontos`, `atualizadoEm` e `progresso`.

Se o passo 1 mostrar `"configured":false`, falta `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ou `SESSION_SECRET` (que precisa ter 32+ caracteres), ou faltou o Redeploy. Se o login funciona mas o progresso não vai para a nuvem, confira `FIREBASE_SERVICE_ACCOUNT` e o papel **Cloud Datastore User** da conta de serviço.

## Como funciona (resumo técnico)

- `api/_lib/firestore.ts`: a API faz login como conta de serviço (JWT RS256 → token de acesso, renovado a cada hora) e usa a API REST do Firestore. Não precisa de SDK.
- `api/progress.ts`: `GET` e `PUT /api/progress`, só com sessão Google. O servidor junta o que veio com o que já está salvo, sem perder nada, e dá a cada selo uma prova de dono (HMAC com `SESSION_SECRET`). Selo com prova de outra conta é recusado.
- Sem Firestore configurado, a API tenta Upstash Redis (`KV_REST_API_URL`/`KV_REST_API_TOKEN`) ou a pasta `PROGRESS_DIR`. Sem nada, o progresso fica só no aparelho, que **não é apagado ao sair**.
- Emulador local: `FIRESTORE_EMULATOR_HOST=localhost:8080` dispensa credenciais (`firebase emulators:start` na pasta `firebase/`).
