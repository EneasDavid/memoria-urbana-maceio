# Firebase: login com Google e progresso online, sem chave guardada

Quem entra com Google tem selos, pontos e passaporte salvos online (Firestore). A pessoa pode sair, trocar de celular ou limpar o navegador sem perder nada.

O site continua hospedado na Vercel. O Firebase cuida de duas coisas:

- **Login (Firebase Authentication):** o navegador abre o login do Google pelo Firebase (popup). O ID token vai **uma vez** para o servidor (`POST /api/auth/session`), que confere a assinatura e cria o cookie de sessão próprio (HttpOnly, assinado, 7 dias). O navegador não guarda token nenhum.
- **Banco (Cloud Firestore):** só a API lê e grava. O acesso é **sem chave**: a Vercel prova quem é com um token OIDC de curta duração, trocado no Google por um acesso temporário à conta de serviço `api-progresso` (Workload Identity Federation).

Projeto do Firebase/Google Cloud: `memoria-urbana-maceio` (número `503211513071`).

## O que já está configurado

| Onde | O quê |
|---|---|
| Firestore | Banco `(default)` em `southamerica-east1` (São Paulo, dados no Brasil), plano Spark. Regras de [`firebase/firestore.rules`](../firebase/firestore.rules): tudo negado ao navegador |
| Authentication | Provedor **Google** ativado. Nome exibido no login: "Memória Urbana Maceió" |
| App da Web | App `site` registrado (fornece a chave web pública) |
| Conta de serviço | `api-progresso@memoria-urbana-maceio.iam.gserviceaccount.com`, só com o papel **Cloud Datastore User**. **Sem chave** |
| Workload Identity Federation | Pool `vercel`, provedor OIDC `vercel` com emissor `https://oidc.vercel.com/eneasdavids-projects`, audiência `https://vercel.com/eneasdavids-projects` e condição `assertion.owner=='eneasdavids-projects' && assertion.project=='memoria-urbana-maceio'`. Só esse projeto da Vercel pode usar a conta de serviço (`roles/iam.workloadIdentityUser`) |
| Vercel | OIDC Federation em modo **Team** (Settings → Security) |

## Variáveis na Vercel

| Variável | Segredo? | Valor |
|---|---|---|
| `SESSION_SECRET` | sim | 32+ caracteres aleatórios (já existe) |
| `FIREBASE_WEB_API_KEY` | não (identificador público) | Firebase → ⚙️ Configurações do projeto → Seus apps → `site` → `apiKey` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | não | `projects/503211513071/locations/global/workloadIdentityPools/vercel/providers/vercel` |
| `GCP_SERVICE_ACCOUNT` | não | `api-progresso@memoria-urbana-maceio.iam.gserviceaccount.com` |
| `GESTOR_EMAILS` | não | (opcional) e-mails que abrem o painel da prefeitura |
| `FIREBASE_PROJECT_ID` | não | (opcional) padrão `memoria-urbana-maceio` |

Marque **Production** e **Preview** e faça **Redeploy**: variáveis só valem para deploys novos.

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `FIREBASE_SERVICE_ACCOUNT` não são mais usados na Vercel e podem ser apagados.

> A chave web do Firebase não é segredo (ela sempre vai para o navegador), mas não entra no bundle: o site só a busca em `/api/auth/firebase-config` na hora do login. No Google Cloud (APIs e serviços → Credenciais → chave do navegador), deixe-a restrita aos sites `https://mumcz.vercel.app/*`, `https://memoria-urbana-maceio.vercel.app/*` e `https://memoria-urbana-maceio.firebaseapp.com/*`, e às APIs **Identity Toolkit** e **Token Service**.

## Domínios autorizados para login

Firebase → Authentication → Configurações → Domínios autorizados. Além dos padrões (`localhost`, `memoria-urbana-maceio.firebaseapp.com` e `.web.app`), adicione os endereços do site:

- `mumcz.vercel.app`
- `memoria-urbana-maceio.vercel.app`
- endereços de preview que forem testados (ex.: `memoria-urbana-maceio-git-<branch>-eneasdavids-projects.vercel.app`)

Sem isso, o popup mostra `auth/unauthorized-domain`.

## Segurança

- **Navegador nunca toca no banco:** regras do Firestore negam tudo. A API confere a sessão e a prova de dono de cada selo antes de gravar.
- **ID token conferido no servidor** (`api/_lib/firebaseToken.ts`): assinatura RS256 com as chaves públicas do Google, `aud`/`iss` do projeto, validade, login feito há no máximo 5 minutos, provedor `google.com` e e-mail verificado.
- **A conta é o id do Google** (`firebase.identities["google.com"]`), o mesmo do login antigo: ninguém perde selos na troca.
- **CSP estrita no site todo.** Só a página `/entrar` libera `apis.google.com` (script do login), `identitytoolkit`/`securetoken` (conexão) e o frame de `memoria-urbana-maceio.firebaseapp.com`, com `Cross-Origin-Opener-Policy: same-origin-allow-popups` para o popup funcionar. `tests/security.test.mjs` impede que essa exceção cresça.
- **Sem chave de conta de serviço:** o token OIDC da Vercel vale minutos e o pool só aceita este time e projeto. O acesso gerado tem só o escopo do Firestore.

## Conferir se funcionou

1. `https://mumcz.vercel.app/api/auth/me` deve mostrar `"configured":true`.
2. Em `/entrar`, **Continuar com Google** abre o popup; ao voltar, o app abre já com a sua foto.
3. Leia uma placa (ou abra `/monumento/nise?via=qr`), confira o selo no Passaporte, saia e entre de novo (ou em outro celular): o selo continua lá.
4. Firebase → Firestore → coleção `progresso`: um documento por conta. O id é um hash e não revela quem é a pessoa.
5. Firebase → Authentication → Usuários: aparece a conta Google que entrou.

Se o login funciona mas o progresso não vai para a nuvem, confira `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT` e se o OIDC da Vercel está em modo Team.

## Fora da Vercel (servidor Oracle e testes)

- O servidor Oracle não tem o token OIDC da Vercel. Lá o Firestore usa `FIREBASE_SERVICE_ACCOUNT` (JSON da conta de serviço, inteiro ou em base64) ou a pasta `PROGRESS_DIR`.
- Emulador local: `FIRESTORE_EMULATOR_HOST=localhost:8080` dispensa credenciais (`firebase emulators:start` na pasta `firebase/`).
- Em `vercel dev`, o token OIDC vem de `VERCEL_OIDC_TOKEN` (`vercel env pull`).

## Como funciona (resumo técnico)

- `src/features/auth/firebaseLogin.ts`: baixa o SDK do Firebase só no clique, faz `signInWithPopup` com persistência em memória, manda o ID token para `/api/auth/session` e encerra o login do Firebase.
- `api/auth/session.ts`: confere o token e grava o cookie `mu_session`. `api/auth/me.ts` e `api/auth/logout.ts` seguem iguais.
- `api/_lib/gcpOidc.ts`: troca o token da Vercel no STS e gera o acesso da conta de serviço (cache de 1 hora).
- `api/_lib/firestore.ts`: API REST do Firestore, sem SDK. Ordem: emulador → OIDC da Vercel → `FIREBASE_SERVICE_ACCOUNT`.
- `api/progress.ts`: `GET` e `PUT /api/progress`, só com sessão Google. Junta o que veio com o que está salvo, sem perder nada, e dá a cada selo uma prova de dono (HMAC com `SESSION_SECRET`).

## Hospedagem no Firebase (avaliada e não adotada)

O Firebase Hosting gratuito só serve páginas estáticas. A API (login e progresso) precisaria de Cloud Functions ou App Hosting, que exigem o plano pago Blaze. Como a Vercel já faz tudo isso de graça, a hospedagem ficou na Vercel. Existe um site `memoria-urbana-maceio-48435.web.app` vazio, criado no registro do app, que pode ser apagado.
