# Auditoria de conformidade: 40 requisitos

Matriz dos 40 requisitos para um app feito com IA não ser processado. O CI roda `scripts/audit-report.mjs` a cada push: ele confere que todo item tem status, que os arquivos citados como evidência existem e que nenhum item aplicável está sem task. O resultado sai no resumo da execução ("Relatório de conformidade").

**Legendas de status:**
- `ok`: atendido e verificado.
- `parcial`: atendido na fase atual, com complemento planejado.
- `pendente`: planejado.
- `n/a`: não se aplica, com a justificativa na linha.

| # | Requisito | Status | Evidência | Task |
|---|---|---|---|---|
| 1 | Autenticação segura | ok | Login Google pelo Firebase Authentication; ID token conferido no servidor (RS256, aud/iss, login recente); sessão HMAC em cookie HttpOnly. `api/auth/session.ts`, `api/_lib/firebaseToken.ts`, `tests/auth.test.mjs` | KAN-53, KAN-158 |
| 2 | Controle de acesso | ok | Papéis fechados (visitante, gestor, curador, admin) com `require()`. Sem acesso de demonstração: papel só pela lista do servidor. `backend/app/core/rbac.py`, `api/auth/session.ts` | KAN-65, KAN-164 |
| 3 | Criptografia de dados | parcial | TLS em tudo (HSTS de 2 anos); Firestore cifrado em repouso pelo Google; cookies assinados. Falta cifrar campos sensíveis e rotacionar segredos. `vercel.json` | KAN-182 |
| 4 | HTTPS/TLS | ok | HSTS com preload e `upgrade-insecure-requests`; Caddy com certificado automático na Oracle. `vercel.json`, `infra/oracle/Caddyfile` | KAN-109 |
| 5 | Hashing de senhas | n/a | Não há senha no projeto: o login é pelo Google e a demonstração não usa senha. O teste barra senha fixa no código. `tests/security.test.mjs` | — |
| 6 | SQL injection | ok | Sem SQL (Firestore via Admin SDK); entradas validadas com Pydantic; o teste barra SQL montado por string. `backend/app/api/v1/reports.py` | KAN-166 |
| 7 | XSS/CSRF | ok | CSP sem script inline nem `eval`, React escapando tudo, sem `dangerouslySetInnerHTML`; rotas POST conferem a Origem; SameSite=Lax. `api/_lib/config.ts` | KAN-165 |
| 8 | Rate limiting | ok | Relatos e anexos limitados por hash de IP com sal rotativo. `backend/app/core/ratelimit.py` | KAN-67 |
| 9 | Proteção de APIs | parcial | RBAC, validação, limite de tamanho em streaming e CORS fechado. A API de parceiros com chave está planejada. `backend/app/core/media.py` | KAN-74 |
| 10 | Auditoria de dependências | ok | `pnpm audit` e `pip-audit` no CI; Dependabot semanal. `.github/dependabot.yml` | KAN-167 |
| 11 | Política de privacidade | ok | Página `/privacidade`. `src/features/legal/LegalPages.tsx` | KAN-83 |
| 12 | Bases legais | ok | Base legal por operação. `docs/lgpd.md` | KAN-98 |
| 13 | Minimização de dados | ok | Sem nome nem contato no relato; foto sem EXIF; escopo `openid email profile`. `src/features/monument/attach.ts` | KAN-88 |
| 14 | Finalidades documentadas | ok | Registro das operações (art. 37). `docs/lgpd.md` | KAN-98 |
| 15 | Gestão de consentimento | parcial | Aviso de cookies, aviso de câmera/galeria e aceite dos termos no login. Falta registrar a versão aceita. `src/ReportSheet.tsx` | KAN-163, KAN-177 |
| 16 | Política de cookies | ok | Página `/cookies` com todos os cookies e armazenamentos; o CI confere. `tests/compliance.test.mjs` | KAN-85 |
| 17 | Direitos dos titulares | ok | Art. 18, canal e prazo de 15 dias. `docs/lgpd.md` | KAN-98 |
| 18 | Exclusão de dados | pendente | `DELETE /api/v1/me` planejado. Hoje não há conta guardada no servidor. `docs/lgpd.md` | KAN-76 |
| 19 | Retenção de dados | ok | Prazos por operação (relato 12 meses, sessão 7 dias, demonstração 2 horas). `docs/lgpd.md` | KAN-98 |
| 20 | Contratos com operadores | pendente | Operadores listados: Vercel, Google, Oracle. Falta anexar os DPAs. `docs/lgpd.md` | KAN-176 |
| 21 | Termos de uso | ok | Página `/termos`. `src/features/legal/LegalPages.tsx` | KAN-84 |
| 22 | Transparência de preços | ok | Serviço gratuito declarado nos termos. `src/features/legal/LegalPages.tsx` | KAN-86 |
| 23 | Cobranças transparentes | n/a | Não há cobrança; o CI barra código de pagamento. `tests/compliance.test.mjs` | KAN-86 |
| 24 | Cancelamento de assinaturas | n/a | Não há assinatura. A conta pode ser apagada (requisito 18). `src/features/legal/LegalPages.tsx` | KAN-76 |
| 25 | Política de reembolso | ok | Seção "Uso gratuito, pagamentos e reembolso" nos termos. `src/features/legal/LegalPages.tsx` | KAN-86 |
| 26 | Identificação do fornecedor | ok | Página `/sobre`, rodapé e aviso de que não há CNPJ. `src/legal/org.ts` | KAN-97 |
| 27 | Publicidade transparente | ok | Sem anúncios nem patrocínio, declarado em `/sobre`; o CI barra rastreadores. `tests/compliance.test.mjs` | KAN-89 |
| 28 | Depoimentos autênticos | ok | Não há depoimentos nem notas; números de demonstração marcados. `tests/compliance.test.mjs` | KAN-94 |
| 29 | Licenças de uso | parcial | Fotos com licença e crédito em `/creditos`; dependências com licença aberta. Falta escolher a licença do projeto. `src/data.ts` | KAN-96, KAN-175 |
| 30 | Transparência sobre IA | ok | Seção "Uso de inteligência artificial" em `/sobre`; a narração avisa que é voz sintetizada. `src/features/legal/LegalPages.tsx` | KAN-169 |
| 31 | Backups automatizados | pendente | O código está versionado no GitHub; falta o export diário do Firestore e do Storage. `docs/arquitetura.md` | KAN-179 |
| 32 | Logs seguros | parcial | O servidor Node não registra cookie, token nem corpo (o teste confere). Falta o log estruturado no backend. `server/api-server.mjs` | KAN-178 |
| 33 | Monitoramento de ameaças | pendente | Alertas de erro, 4xx/5xx e picos planejados. `docs/arquitetura.md` | KAN-180 |
| 34 | Resposta a incidentes | ok | Plano em 4 passos (conter, avaliar, comunicar, registrar). `docs/lgpd.md` | KAN-98 |
| 35 | Notificação de incidente | ok | Comunicação à ANPD e aos titulares (art. 48); canal privado em `SECURITY.md`. `SECURITY.md` | KAN-167 |
| 36 | Testes de segurança | ok | 14 ataques comuns em `tests/abuse.test.mjs` e `backend/tests/test_ataques.py` ([mapa](seguranca-14-ataques.md)); `tests/security.test.mjs`, `tests/media.test.mjs`, testes de anexo e OWASP ZAP planejado. `tests/security.test.mjs` | KAN-166, KAN-77 |
| 37 | Revisão de código | ok | CODEOWNERS e template de PR; proteção da `main` planejada. `.github/CODEOWNERS` | KAN-168, KAN-46 |
| 38 | Privilégios administrativos | parcial | Admin só por e-mail listado; sem acesso de demonstração. Falta 2FA obrigatório e revisão periódica. `api/auth/callback.ts` | KAN-181 |
| 39 | Gestão de vulnerabilidades | ok | `SECURITY.md` com prazos e Dependabot. `SECURITY.md` | KAN-167 |
| 40 | Auditoria de conformidade | ok | Esta matriz e o relatório gerado no CI. `scripts/audit-report.mjs` | KAN-170 |

**Leis consideradas:**
- LGPD (Lei 13.709/2018);
- Código de Defesa do Consumidor (Lei 8.078/1990);
- Marco Civil da Internet (Lei 12.965/2014), arts. 7º, 10 e 15, sobre guarda de registros e sigilo;
- Lei Brasileira de Inclusão (Lei 13.146/2015);
- Lei de Direitos Autorais (Lei 9.610/1998).

**Revisão humana:** esta matriz não substitui um parecer jurídico (KAN-103).
