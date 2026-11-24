# Memória Urbana Maceió

[![CI](https://github.com/EneasDavid/memoria-urbana-maceio/actions/workflows/ci.yml/badge.svg)](https://github.com/EneasDavid/memoria-urbana-maceio/actions/workflows/ci.yml)

**O monumento como convite.** Cada estátua e praça de Maceió ganha uma placa com QR/NFC. Quem aproxima o celular lê a bio do homenageado, ouve a narração ou a audiodescrição e recebe um convite para o museu mais próximo que aprofunda a história. Tudo isso é gratuito e sem login. A conta Google só entra para pontuar na trilha e liberar o modo 3D.

## Artefatos

| Artefato | Link |
|---|---|
| Sistema online (Vercel) | https://memoria-urbana-maceio.vercel.app |
| Protótipo publicado (Figma Make) | https://rotacultural.figma.site |
| Arquivo do Figma Make | https://www.figma.com/make/1aEK440GM9tIze8UfG7usz/Sem-t%C3%ADtulo |
| Apresentação (Canva) | https://www.canva.com/design/DAHaJGuZ0zs/eP23D5eJfYwAb0mdKRQgLQ/edit |
| Backlog e sprints (Jira, projeto KAN) | https://ic-team-yrsngn10.atlassian.net/jira/software/projects/KAN/boards/1 |
| Issues e sprints no GitHub (espelho do Jira) | https://github.com/EneasDavid/memoria-urbana-maceio/milestones |

## Rotas

| URL | Quem acessa | O que é |
|---|---|---|
| `/` | todos, sem login | Lista de monumentos (cada card abre em nova aba) |
| `/monumento/:id` | todos, sem login | Página do monumento, aberta pelo QR/NFC da placa: bio, narração, audiodescrição, convite ao museu e relato de dano. Sem menus nem botão voltar |
| `/entrar` | todos | Login com Google (OAuth 2.0 + PKCE) |
| `/app` | conta (participante) | Trilha Cultural: Explorar, Trilha, Passaporte e leitura da placa (telas do protótipo do Figma) |
| `/painel` | papel gestor | Painel da prefeitura |
| `/prototipo` | todos | Protótipo navegável do Figma Make, para apresentação |
| `/privacidade` `/termos` `/cookies` `/acessibilidade` `/creditos` `/sobre` | todos | Páginas legais, linkadas no rodapé de toda página pública |

## Trilhas, grafo e progresso sem login

- **Trilhas temáticas** na página inicial (Bronze, Escritores, Fé, Porto, República, Memória do Bebedouro), calculadas a partir do material, do tema e do bairro de cada obra (`src/features/trails/trails.ts`).
- **Grafo de personalidades** (`src/graph.ts`): cada homenageado liga o monumento a outros lugares em Maceió e em Alagoas. Na página do monumento, **“+ Mais sobre [pessoa]”** gera a **Trilha [pessoa]** na hora.
- **Local-first:** o progresso fica no aparelho (`mu_progress`), sem conta. Um aviso não bloqueante pergunta se a pessoa quer sincronizar na nuvem (Google) ou salvar só ali.
- **Dados abertos:** 10 dos 25 monumentos vieram do Wikidata, OpenStreetMap e Wikimedia Commons (`scripts/import-public-data.mjs`, [docs/ingestao-de-dados.md](docs/ingestao-de-dados.md)).

## Arquitetura

A arquitetura completa (FastAPI, Celery + Redis, Firebase, OAuth, níveis de acesso, APIs e fases por sprint) está em [`docs/arquitetura.md`](docs/arquitetura.md). O esqueleto do backend está em [`backend/`](backend/).

## Problema

As estátuas da orla e das praças do Centro viraram paisagem. Elas são vistas todos os dias, mas pouca gente sabe quem foram os homenageados ou por que estão ali. Algumas já foram alvo de deboche e de vandalismo. Os museus que guardam essa memória ficam a poucos quarteirões e recebem pouca visita. O caso Braskem tornou o tema mais urgente: ruas, praças e igrejas de bairros inteiros (Pinheiro, Bebedouro, Mutange) foram esvaziadas e hoje só existem na memória.

## Solução

- **Na placa:** a pessoa lê pelo QR/NFC e cai direto na página do monumento, sem instalar app e sem cadastro.
- **Bio, narração e audiodescrição** escritas com fontes jornalísticas e acadêmicas.
- **Convite ao museu** em toda página, com endereço, horário e o motivo da visita.
- **Trilha e pontos (opcional)** para quem entra com Google: carimbos, níveis e modo 3D.
- **Painel da prefeitura:** cadastro de monumentos, relatos de problemas e visitas agregadas e anônimas.

## Metodologia

- Scrum com sprints **semanais por tema: 4 dias de desenvolvimento + 1 de review, retro e planning** da próxima sprint. O fluxo vai de problema → épico → backlog → user story → issue, tudo no Jira.
- Estimativa em story points (planning poker), burndown por sprint, dailies e retrospectiva.
- Programação em par, baixo acoplamento e alta coesão: telas, dados (`src/data.ts`) e fluxo do celular ficam separados.
- Testes servem para **achar falhas** (falta → erro → falha) antes que elas cheguem à placa.

### Sprints

Sprints semanais, cada uma com um tema (back → front → segurança → usabilidade → LGPD → acervo → entrega → validação).

| Sprint | Período | O que foi entregue e como foi testado | Estado |
|---|---|---|---|
| Sprint 1 · Backend e dados | 01/10 – 07/10 | Esqueleto da API FastAPI com níveis de acesso (RBAC), regras do Firestore fechadas, login Google com PKCE em funções serverless e documento de arquitetura. Teste: pytest de RBAC e API (fakeredis), testes de sessão, PKCE e claims. | concluída |
| Sprint 2 · Front e acesso na placa | 08/10 – 14/10 | Página do monumento aberta por QR/NFC sem login, bio e audiodescrição, narração sincronizada e convite ao museu em toda página. Teste: integridade dos dados, smoke do build servido e testes da narração. | concluída |
| Sprint 3 · Segurança | 15/10 – 21/10 | Cabeçalhos HTTP, CSP, CSRF, limite de relatos, anexos seguros e os 14 ataques comuns (admin, IDOR, chaves, fraudes de pontos, XSS, segredos, banco). Teste: suítes de segurança, mídia e ataques no Node e no pytest. | concluída |
| Sprint 4 · Usabilidade | 22/10 – 28/10 | Teste de usabilidade com moradores e correções que saíram dele; leis de UX (Fitts, Hick, Miller, Jakob, Postel), animação e responsividade. Teste: Playwright com regras de UX, responsivo de 320 a 1440 px e Core Web Vitals. | concluída |
| Sprint 5 · LGPD e conformidade | 29/10 – 04/11 | Aviso de cookies, créditos e licença das fotos, fontes de dados citadas, aviso antes de câmera e localização, termos, privacidade e acessibilidade WCAG AA. Teste: 17 regras legais e axe-core no claro e no escuro. | concluída |
| Sprint 6 · Back 2: acervo, ingestão noturna e trilhas | 05/11 – 11/11 | Segunda sprint de backend: rotina noturna no Celery que busca os dados abertos dos monumentos de 00h às 4h, em lotes idempotentes; novos monumentos, trilhas temáticas, grafo de personalidades, Trilha Cultural, relato de dano e painel. Teste: pytest da janela de horário, idempotência e lotes; dados, trilhas e grafo. | concluída |
| Sprint 7 · Qualidade e entrega contínua | 12/11 – 18/11 | Repositório, GitHub Actions, deploy contínuo na Vercel, SEO com páginas pré-renderizadas, servidor próprio na Oracle e espelho Jira ↔ GitHub. Teste: CI com 3 jobs a cada push; SEO e servidor Oracle. | concluída |
| Sprint 8 · Validação e apresentação | 19/11 – 24/11 | Progresso sem login (local-first), ingestão semanal idempotente, documentação de arquitetura, relatório e apresentação com demonstração ao vivo. Teste: suíte completa no CI e roteiro de demo com QR reais. | em andamento |
| Backlog pós-disciplina | 25/11 – 31/12 | Redis e Celery em produção, narração na nuvem, API de parceiros, exclusão de conta, teste de carga e piloto com placas físicas. | planejada |

O último dia de cada sprint é de review (demo do incremento), retrospectiva e planning (planning poker em story points).

### Jira ↔ GitHub

- O backlog do Jira é exportado para `.github/jira-backlog.json` a cada planning. O workflow `jira-sync.yml` cria ou atualiza uma issue por task, com a chave no título (`[KAN-23] …`), milestone da sprint e labels de épico, tipo e status. Task concluída no Jira vira issue fechada.
- Cada task no Jira tem um link para a issue correspondente no GitHub.
- Convenção: branch, commit e título de PR começam com a chave (`KAN-23 cache dos lugares visitados`). Use `Closes #30` no PR para fechar a issue ao fazer merge.

## CI/CD

| Etapa | Onde | O que faz |
|---|---|---|
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Em todo push ou PR na `main`: instala, checa tipos (`tsc`), gera o build, roda os testes de dados e de integração e audita dependências |
| CD | Vercel (integração Git) | Todo push na `main` publica em https://memoria-urbana-maceio.vercel.app. PRs ganham uma URL de preview |
| Backlog | GitHub Actions (`.github/workflows/jira-sync.yml`) | Espelha o backlog do Jira em Issues e milestones |
| CD Oracle | GitHub Actions (`.github/workflows/deploy-oracle.yml`) | Depois do CI verde, publica na VM Oracle Cloud via SSH (Caddy + Node). Fica desligado até existirem as variáveis `ORACLE_HOST` e `SITE_URL`. Guia em [docs/oracle.md](docs/oracle.md) |

### Testes

```bash
pnpm install
pnpm build
node --experimental-strip-types --test tests/data.test.mjs   # integridade do conteúdo
node --experimental-strip-types --test tests/smoke.test.mjs  # integração: sobe o build e verifica rotas, assets e logo
node --experimental-strip-types --test tests/auth.test.mjs   # login: sessão assinada, PKCE, claims, open redirect
node --experimental-strip-types --test tests/compliance.test.mjs  # 17 regras legais e LGPD
node --experimental-strip-types --test tests/a11y.test.mjs        # axe-core WCAG 2.1 AA + teclado (precisa do Chromium do Playwright)
cd backend && pytest                                          # RBAC, cache, relatos com rate limit
```

- `tests/data.test.mjs` cobre o conteúdo: ids e placas únicos, coordenadas dentro de Maceió, bio preenchida, **convite ao museu presente em todos os monumentos** e fontes em HTTPS.
- `tests/smoke.test.mjs` sobe o build com `vite preview` e confere a página inicial, todos os JS/CSS, a logo e o favicon. Também garante que não há sourcemap inline nem segredos no bundle.
- Camada OWASP: `pnpm audit` (A06, componentes vulneráveis) e cabeçalhos de segurança em `vercel.json` (nosniff, frame-options, referrer, permissions e HSTS).

## Acesso de demonstração (sem Google)

Em `/entrar`, os botões **Como visitante** e **Como gestor** abrem a Trilha e o painel sem conta Google.

- Não há senha e o usuário é fictício.
- A sessão (`mu_demo`) dura 2 horas e nada é salvo.
- O backend não aceita esse cookie para dados reais.
- Para desligar, defina `DEMO_LOGIN=off`.
- Na demonstração, a Trilha mantém as simulações do protótipo (caminhada, leitura da placa, amigos por perto) para testar sem ir à rua. Na conta Google nada é simulado: só QR e NFC reais e check-in por GPS com a localização verdadeira.

## Segurança e auditoria

- `SECURITY.md`: como relatar falhas.
- `docs/conformidade-40.md`: matriz dos 40 requisitos. O CI publica o relatório no resumo de cada execução.
- `tests/security.test.mjs`: cabeçalhos, segredos, XSS, CSRF, injeção e controle de acesso.
- [`docs/seguranca-14-ataques.md`](docs/seguranca-14-ataques.md): os 14 ataques mais comuns (digitar /admin, trocar o ID na URL, chave no navegador, mudar o preço, comprar −1, Pix falso, cupom 100×, premium sem pagar, admin no cadastro, adivinhar o código, mandar a IA ignorar, script no usuário, senhas no GitHub, abrir o banco), cada um com teste em `tests/abuse.test.mjs` e `backend/tests/test_ataques.py`.

## Conformidade legal, LGPD e acessibilidade

O job **Conformidade** do CI barra o merge quando algum destes 17 itens quebra:

| # | Item | Onde está | Verificação |
|---|---|---|---|
| 1 | Política de privacidade | `/privacidade` | seções obrigatórias (controlador, dados, base legal, direitos, encarregado) |
| 2 | Termos de serviço | `/termos` | seções obrigatórias e foro |
| 3 | Aviso de cookies | `CookieNotice` + `/cookies` | aviso montado; todo cookie usado está na tabela |
| 4 | Política de reembolso | Termos, "Uso gratuito" | nenhum código de pagamento em `src/` e `api/` |
| 5 | Formulários na LGPD | formulário de relato | link para a política em todo formulário |
| 6 | Só dados necessários | relato e login | nenhum campo de nome, e-mail, telefone ou CPF; escopo `openid email profile` |
| 7 | Scripts de tracking | `vercel.json` (CSP) | nenhum rastreador no bundle; CSP só com origens declaradas |
| 8 | Acessibilidade | `/acessibilidade` | `lang="pt-BR"`, axe-core sem violações graves em 12 rotas, claro e escuro |
| 9 | Alt nas imagens | todo `<img>` | `alt` obrigatório (texto ou vazio decorativo) |
| 10 | Contraste corrigido | cores das páginas públicas | regra `color-contrast` do axe (AA 4,5:1) |
| 11 | Navegação por teclado | link "Pular para o conteúdo", foco visível, diálogo com Esc | testes de teclado no Playwright |
| 12 | Sem avaliações falsas | todo o site | nenhuma nota ou depoimento; dados de demonstração marcados |
| 13 | Sem promessas falsas | textos públicos | nada de "100% seguro" ou "oficial"; relato diz que fica salvo no aparelho |
| 14 | Copyright das imagens | `/creditos` | toda foto com crédito, fonte e licença |
| 15 | Dados da empresa | `/sobre` + `src/legal/org.ts` | responsável, natureza, contato e aviso de que não há CNPJ |
| 16 | Conformidade LGPD | `docs/lgpd.md` | registro das operações, base legal, retenção, direitos, incidente |
| 17 | Riscos jurídicos | `docs/riscos-juridicos.md` | matriz com probabilidade, impacto, mitigação e dono |

O que falta, e está no Jira: autorização das fotos de terceiros, e-mail do encarregado, revisão jurídica pelo orientador e acessibilidade do `/prototipo`.

## SEO

O build gera HTML próprio para cada monumento (título, descrição, canonical, texto e JSON-LD `TouristAttraction`), além de `robots.txt` e `sitemap.xml` (`scripts/prerender.mjs`). Contas, painel e protótipo ficam com `noindex`. `tests/seo.test.mjs` impede que a indexação volte a ser bloqueada. O passo a passo do Search Console está em [docs/seo.md](docs/seo.md).

## Rodar localmente

```bash
pnpm install
pnpm dev      # http://localhost:8443
```

Stack: React 19, Vite 8, Tailwind 4 e TypeScript. O código foi gerado e editado no Figma Make e é sincronizado com este repositório.

## Artigos e matérias que fundamentam a ideia

**Estátuas da orla**
- TNH1: [Orla de Pajuçara ganha esculturas de Graciliano Ramos e Aurélio Buarque](https://www.tnh1.com.br/noticia/nid/orla-de-pajucara-ganha-esculturas-de-graciliano-ramos-e-aurelio-buarque/) (28/11/2015)
- TNH1: [Homenagens a Graciliano Ramos e Aurélio Buarque agora estão na orla](https://www.tnh1.com.br/noticia/nid/homenagens-graciliano-ramos-e-aurelio-buarque-agora-estao-na-orla-de-maceio/) (30/11/2015)
- 082 Notícias: [Um monumento à ignorância](https://082noticias.com/cultura/um-monumento-a-ignorancia/)
- TNH1: [Deboche com estátua de Aurélio Buarque viraliza e causa revolta](https://www.tnh1.com.br/noticia/nid/video-deboche-com-estatua-de-aurelio-buarque-na-orla-de-maceio-viraliza-e-causa-revolta/) (15/03/2021)
- Cada Minuto: [Prefeitura inaugura escultura em homenagem ao ator Paulo Gracindo](https://www.cadaminuto.com.br/noticia/2017/07/14/prefeitura-inaugura-escultura-em-homenagem-ao-ator-paulo-gracindo-na-pajucara) (14/07/2017)
- TNH1: [Paulo Gracindo ganha estátua em Maceió](https://www.tnh1.com.br/noticia/nid/video-paulo-gracindo-ganha-estatua-em-maceio-foi-aqui-que-ele-morou-e-e-onde-sera-homenageado-diz-filho/) (14/07/2017)
- Tribuna Hoje: [Maceió vai ganhar escultura do ator Paulo Gracindo](https://tribunahoje.com/noticias/cidades/2017/07/12/68845-maceio-vai-ganhar-escultura-do-ator-paulo-gracindo) (12/07/2017)
- TNH1/Secom: [Prefeito inaugura escultura de Nise da Silveira](https://www.tnh1.com.br/noticia/nid/prefeito-inaugura-escultura-de-nise-da-silveira-no-vera-arruda/) (30/07/2019)
- TNH1: [Estátua de Lêdo Ivo é inaugurada no Posto 7](https://www.tnh1.com.br/noticia/nid/estatua-de-ledo-ivo-e-inaugurada-no-calcadao-do-posto-7-em-maceio/) (03/09/2019)
- TNH1/Secom: [Prefeitura inaugura mais uma estátua na orla](https://www.tnh1.com.br/noticia/nid/prefeitura-inaugura-mais-uma-estatua-na-orla-nesta-terca-feira/) (02/09/2019)
- Assembleia Legislativa de AL: [Projeto Rodovia Graciliano Ramos](https://sapl.al.al.leg.br/media/sapl/public/materialegislativa/2015/55/55_texto_integral.pdf) (2015)

**Praças do Centro e revitalizações**
- Prefeitura de Maceió: [Praça Emílio de Maya revitalizada](https://maceio.al.gov.br/noticias/iplan/prefeitura-de-maceio-entrega-praca-emilio-de-maya-revitalizada) (08/02/2025)
- Prefeitura de Maceió/Iplan: [Emílio Eliseu de Maya](https://maceio.al.gov.br/p/iplan/emilio-eliseu-de-maya)
- Prefeitura de Maceió: [Entrega da revitalização da Praça Montepio dos Artistas](https://maceio.al.gov.br/noticias/gp/prefeitura-de-maceio-entrega-revitalizacao-da-praca-montepio-dos-artistas) (23/01/2025)
- Prefeitura de Maceió/Iplan: [Praça Montepio volta a ser ponto de convivência](https://maceio.al.gov.br/noticias/iplan/praca-montepio-dos-artistas-volta-a-ser-ponto-de-convivencia-no-centro-de-maceio) (23/01/2025)
- Tribuna do Sertão: [Revitalização da Praça Marechal Floriano](https://www.tribunadosertao.com.br/alagoas/2023/05/03/498583-governador-inaugura-revitalizacao-da-praca-marechal-floriano-nesta-quinta-5) (03/05/2023)
- Tribuna do Sertão: [Paulo Dantas inaugura revitalização da Praça Floriano Peixoto](https://www.tribunadosertao.com.br/alagoas/2023/05/04/498764-paulo-dantas-inaugura-revitalizacao-da-praca-floriano-peixoto) (04/05/2023)
- TNH1/Secom: [Praça Sinimbu é revitalizada](https://www.tnh1.com.br/noticia/nid/tradicional-praca-sinimbu-em-maceio-e-revitalizada-veja-fotos-de-como-ficou/) (18/12/2020)
- TNH1: [Academia Alagoana de Letras, Casa Jorge de Lima](https://www.tnh1.com.br/noticia/nid/jurista-fabio-lins-da-palestra-hoje-na-academia-alagoana-de-letras/)
- IBGE Biblioteca: [Cartão postal "Praça Dom Pedro II: Maceió, AL"](https://biblioteca.ibge.gov.br/index.php/biblioteca-catalogo?view=detalhes&id=436593)

**Patrimônio afetado pelo caso Braskem**
- MPF: [Visita técnica aos bairros afetados pela Braskem](https://www.mpf.mp.br/o-mpf/unidades/pr-al/noticias/membros-do-mpf-de-alagoas-e-da-5a-regiao-realizam-visita-tecnica-a-bairros-afetados-pela-braskem-em-maceio)
- TNH1: [Relatório identifica obras arquitetônicas afetadas por afundamento de solo](https://www.tnh1.com.br/noticia/nid/relatorio-identifica-obras-arquitetonicas-afetadas-por-afundamento-de-solo/)
- TNH1: [Caso Braskem: recuperação de prédios históricos](https://www.tnh1.com.br/noticia/nid/caso-braskem-esqueceram-de-tombar-o-hospital-sanatorio/) (03/12/2024)
- TNH1: [História e cultura sendo recuperados no Pinheiro e região](https://www.tnh1.com.br/conteudo/noticia/nid/como-fica-maceio-historia-e-cultura-estao-sendo-recuperados-no-pinheiro-e-regiao/)
- Tribuna do Sertão: [Natal em Bebedouro](https://www.tribunadosertao.com.br/cidades/2025/12/28/837446-natal-em-bebedouro-a-luz-da-fe-no-epicentro-do-descaso) (28/12/2025)
- TNH1/Secom: [Ordem de serviço para reforma da Praça Lucena Maranhão](https://www.tnh1.com.br/noticia/nid/prefeito-assina-ordem-de-servico-para-reforma-da-praca-lucena-maranhao/) (18/06/2016)

**Academia e outros marcos**
- Psicologia USP (Redalyc): [Maceió é uma cidade mítica](https://www.redalyc.org/pdf/3051/305123717006.pdf) (2007)
- USP: [Seminário Nise da Silveira](https://edisciplinas.usp.br/pluginfile.php/5838326/mod_resource/content/1/Seminario%20Nise.pdf)
- Marinha do Brasil: [Farol de Maceió recebe alunos](https://www.marinha.mil.br/com3dn/node/600) (19/05/2016) e [Visita ao Farol de Maceió](https://www.marinha.mil.br/com3dn/node/1650)
- Tribuna do Sertão: [Projeto Circularte na Ufal](https://tribunadosertao.com.br/noticias/2025/08/19/710967-projeto-circularte-promove-atividades-de-danca-e-musica-na-ufal) (19/08/2025) e [Vozes da Rua no CIC da Ufal](https://www.tribunadosertao.com.br/alagoas/2026/05/26/908434-evento-vozes-da-rua-arte-resistencia-e-expressao-promove-encontro-entre-arte-urbana-cultura-e-universidade) (26/05/2026)
