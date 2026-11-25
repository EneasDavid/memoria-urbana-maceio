# Política de segurança

## Como relatar uma vulnerabilidade

Use o **relato privado de vulnerabilidade** do GitHub, em [Security → Report a vulnerability](https://github.com/EneasDavid/memoria-urbana-maceio/security/advisories/new). Não abra issue pública para falhas de segurança.

Inclua:
- o que encontrou;
- como reproduzir;
- o impacto que imagina.

Não acesse dados de outras pessoas e não faça testes que derrubem o serviço.

| Etapa | Prazo |
|---|---|
| Confirmação de recebimento | 3 dias úteis |
| Avaliação e plano | 10 dias |
| Correção de falha grave | assim que possível, com aviso a quem relatou |

Se a falha envolver dados pessoais, seguimos o plano de incidente de [`docs/lgpd.md`](docs/lgpd.md#incidente-de-segurança-art-48), com comunicação à ANPD e aos titulares quando houver risco relevante.

## O que já protege o projeto

| Proteção | Onde |
|---|---|
| Login com Google pelo Firebase Authentication; ID token conferido no servidor (RS256, projeto, login recente); sessão em cookie HttpOnly, Secure, SameSite=Lax; Firestore sem chave (OIDC) | `api/` |
| CSRF: rotas POST só aceitam a própria origem | `api/_lib/config.ts` |
| CSP sem script inline nem `eval`, HSTS de 2 anos, nosniff, `frame-ancestors` e Permissions-Policy | `vercel.json` e `infra/oracle/Caddyfile` |
| Anexos validados pelo conteúdo, com recusa de compactados, poliglotas, scripts e bombas de descompressão | `src/shared/media.ts` e `backend/app/core/media.py` |
| Controle de acesso por papéis (RBAC) e rate limit por hash de IP | `backend/app/core` |
| Varredura de segredos, cabeçalhos e padrões de injeção no CI | `tests/security.test.mjs` |
| Dependabot semanal, `pnpm audit` e `pip-audit` no CI | `.github/` |

## Versões suportadas

Só a versão em produção, ou seja, a branch `main`.
