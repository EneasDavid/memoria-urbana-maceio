// Variáveis de ambiente sem depender dos tipos do Node (o compilador da Vercel não acha @types/node com TypeScript 7)
const processEnv: Record<string, string | undefined> = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
// Acesso ao Google Cloud SEM chave: Workload Identity Federation com o token OIDC da Vercel.
// 1. A Vercel entrega a cada requisição um JWT curto que prova "sou o projeto memoria-urbana-maceio"
//    (cabeçalho x-vercel-oidc-token; em `vercel dev`, a variável VERCEL_OIDC_TOKEN).
// 2. O STS do Google troca esse JWT por um token federado (o pool "vercel" só aceita este time e projeto).
// 3. O token federado se passa pela conta de serviço api-progresso, que só tem o papel Cloud Datastore User.
// Nada de segredo guardado: se o token vazar, vale minutos e só para o Firestore deste projeto.
//
// Variáveis (não são segredos):
//   GCP_WORKLOAD_IDENTITY_PROVIDER = projects/<número>/locations/global/workloadIdentityPools/vercel/providers/vercel
//   GCP_SERVICE_ACCOUNT            = api-progresso@<projeto>.iam.gserviceaccount.com

export interface OidcFederation { provider: string; serviceAccount: string }

export function oidcFederation(env: Record<string, string | undefined> = processEnv): OidcFederation | null {
  const provider = env.GCP_WORKLOAD_IDENTITY_PROVIDER?.trim()
  const serviceAccount = env.GCP_SERVICE_ACCOUNT?.trim()
  return provider && serviceAccount ? { provider, serviceAccount } : null
}

/** Token OIDC da Vercel desta requisição (cabeçalho em produção; variável em desenvolvimento). */
export function vercelOidcToken(req?: Request, env: Record<string, string | undefined> = processEnv): string | null {
  return req?.headers.get('x-vercel-oidc-token') || env.VERCEL_OIDC_TOKEN || null
}

const SCOPE = 'https://www.googleapis.com/auth/datastore'
let cached: { token: string; until: number; sa: string } | null = null

export function resetOidcCache(): void { cached = null }

/** Token de acesso da conta de serviço (válido 1 h), obtido sem chave. Reaproveitado enquanto vale. */
export async function federatedAccessToken(fed: OidcFederation, oidc: string, fetcher: typeof fetch = fetch, now = Date.now()): Promise<string> {
  if (cached && cached.sa === fed.serviceAccount && cached.until > now + 60_000) return cached.token

  const sts = await fetcher('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience: `//iam.googleapis.com/${fed.provider}`,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      subject_token: oidc,
    }),
  })
  if (!sts.ok) throw new Error(`Troca do token da Vercel recusada (${sts.status})`)
  const { access_token: federated } = (await sts.json()) as { access_token: string }

  const gen = await fetcher(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(fed.serviceAccount)}:generateAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${federated}` },
    body: JSON.stringify({ scope: [SCOPE], lifetime: '3600s' }),
  })
  if (!gen.ok) throw new Error(`Conta de serviço recusou a federação (${gen.status})`)
  const { accessToken, expireTime } = (await gen.json()) as { accessToken: string; expireTime: string }
  cached = { token: accessToken, until: Date.parse(expireTime) || now + 3_000_000, sa: fed.serviceAccount }
  return accessToken
}
