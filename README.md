# Memória Urbana Maceió

[![CI](https://github.com/EneasDavid/memoria-urbana-maceio/actions/workflows/ci.yml/badge.svg)](https://github.com/EneasDavid/memoria-urbana-maceio/actions/workflows/ci.yml)

**O monumento como convite.** Cada estátua e praça de Maceió ganha uma placa com QR/NFC. Quem aproxima o celular lê a bio do homenageado, ouve a narração ou a audiodescrição e recebe um convite para o museu mais próximo que aprofunda a história. Tudo isso é gratuito e sem login. A conta Google só entra para levar os carimbos e o progresso da trilha para a nuvem.

## Artefatos

| Artefato | Link |
|---|---|
| Sistema online (Vercel) | https://mumcz.vercel.app (o endereço antigo https://memoria-urbana-maceio.vercel.app continua no ar) |
| Protótipo publicado (Figma Make) | https://rotacultural.figma.site |
| Arquivo do Figma Make | https://www.figma.com/make/1aEK440GM9tIze8UfG7usz/Sem-t%C3%ADtulo |
| Apresentação (Canva) | https://www.canva.com/design/DAHaJGuZ0zs/eP23D5eJfYwAb0mdKRQgLQ/edit |
| Backlog e sprints (Jira, projeto KAN) | https://ic-team-yrsngn10.atlassian.net/jira/software/projects/KAN/boards/1 |
| Issues e sprints no GitHub (espelho do Jira) | https://github.com/EneasDavid/memoria-urbana-maceio/milestones |

## Rotas

| URL | Quem acessa | O que é |
|---|---|---|
| `/` | todos, sem login | Apresentação do projeto, como funciona, destaques e trilhas |
| `/galeria` | todos, sem login | Todos os monumentos por região (ver pela galeria não dá selo) |
| `/monumento/:id` | todos, sem login | Página do monumento, aberta pelo QR/NFC da placa: bio, narração, audiodescrição, convite ao museu e relato de dano. Sem menus nem botão voltar |
| `/entrar` | todos | Login com Google (Firebase Authentication, sessão em cookie do servidor) ou continuar sem conta, salvando no aparelho |
| `/app` | conta (participante) | Trilha Cultural: Explorar, Trilha, Passaporte e leitura da placa (telas do protótipo do Figma) |
| `/painel` | papel gestor | Painel da prefeitura |
| `/prototipo` | todos | Protótipo navegável do Figma Make, para apresentação |
| `/privacidade` `/termos` `/cookies` `/acessibilidade` `/creditos` `/sobre` | todos | Páginas legais, linkadas no rodapé de toda página pública |

## Trilhas, grafo e progresso sem login

- **Trilhas temáticas** na página inicial (Bronze, Escritores, Fé, Porto, República, Memória do Bebedouro), calculadas a partir do material, do tema e do bairro de cada obra (`src/features/trails/trails.ts`).
- **Grafo de personalidades** (`src/graph.ts`): cada homenageado liga o monumento a outros lugares em Maceió e em Alagoas. Na página do monumento, **“+ Mais sobre [pessoa]”** gera a **Trilha [pessoa]** na hora.
- **Local-first:** o progresso fica no aparelho (`mu_progress`), sem conta. Um aviso não bloqueante pergunta se a pessoa quer sincronizar na nuvem (Google) ou salvar só ali.
- **Dados abertos:** 10 dos 25 monumentos vieram do Wikidata, OpenStreetMap e Wikimedia Commons (`scripts/import-public-data.mjs`, [docs/ingestao-de-dados.md](docs/ingestao-de-dados.md)).

## Selos, permissões e sessão

- **Selo pela placa:** o QR/NFC grava `/monumento/<id>?via=qr`. Abrir pela câmera do celular já dá o selo (uma vez por obra) e, com conta, abre o app na obra. A galeria nunca dá selo.
- **Scanner do site:** lê QR de verdade no Android (BarcodeDetector) e no iPhone (jsQR).
- **Permissões:** no primeiro acesso, o aviso oferece localização e câmera (opcionais, resposta guardada em `mu_perms`); a galeria de fotos só é pedida ao anexar; o **microfone nunca** é usado.
- **Sessão igual em todas as páginas:** com conta, toda página mostra a foto do Google e a barra de abas do app; sem conta, o botão Entrar.
- **3D e realidade aumentada:** saíram da interface; ficam como funcionalidade futura.
- Testes de usabilidade: [docs/usabilidade.md](docs/usabilidade.md).

## Arquitetura

A arquitetura completa (FastAPI, Celery + Redis, Firebase, OAuth, níveis de acesso, APIs e fases por sprint) está em [`docs/arquitetura.md`](docs/arquitetura.md). O esqueleto do backend está em [`backend/`](backend/).

## Problema

As estátuas da orla e das praças do Centro viraram paisagem. Elas são vistas todos os dias, mas pouca gente sabe quem foram os homenageados ou por que estão ali. Algumas já foram alvo de deboche e de vandalismo. Os museus que guardam essa memória ficam a poucos quarteirões e recebem pouca visita. O caso Braskem tornou o tema mais urgente: ruas, praças e igrejas de bairros inteiros (Pinheiro, Bebedouro, Mutange) foram esvaziadas e hoje só existem na memória.

## Solução

- **Na placa:** a pessoa lê pelo QR/NFC e cai direto na página do monumento, sem instalar app e sem cadastro.
- **Bio, narração e audiodescrição** escritas com fontes jornalísticas e acadêmicas.
- **Convite ao museu** em toda página, com endereço, horário e o motivo da visita.
- **Trilha e pontos (opcional)** para quem entra com Google: carimbos e níveis.
- **Painel da prefeitura:** cadastro de monumentos, relatos de problemas e visitas agregadas e anônimas.

## Metodologia

- Scrum com sprints **curtas por tema: 4 dias úteis, sendo 3 de desenvolvimento + 1 de review, retro e planning** da próxima sprint. O fluxo vai de problema → épico → backlog → user story → issue, tudo no Jira.
- Estimativa em story points (planning poker), burndown por sprint, dailies e retrospectiva.
- Programação em par, baixo acoplamento e alta coesão: telas, dados (`src/data.ts`) e fluxo do celular ficam separados.
- Testes servem para **achar falhas** (falta → erro → falha) antes que elas cheguem à placa.

### Sprints

As sprints são as do Jira (projeto KAN), cada uma com um tema: placa → conteúdo e museu → trilha → preservação e testes → qualidade e CI/CD → backend → dados e filas → processamento assíncrono → APIs abertas e piloto. Hoje o Jira tem 15 épicos e 137 tarefas concluídas (301 story points).

| Sprint | Período | O que foi entregue e como foi validado | Estado |
|---|---|---|---|
| Sprint 1 · Acesso na placa | 26/10 – 29/10 | Leitura da placa por NFC e QR, página aberta do monumento, bio em linguagem simples e protótipo navegável no Figma Make. Validação: review com demo do fluxo placa → página. | concluída |
| Sprint 2 · Conteúdo e convite ao museu | 30/10 – 04/11 | Abas Bio e Audiodescrição e card "Como chegar" ao museu em todas as páginas. Validação: review com demo no protótipo. | concluída |
| Sprint 3 · Trilha e engajamento | 05/11 – 10/11 | Mapa da Trilha Cultural, rota até o museu, carimbos e passaporte, login Google opcional. Validação: review com demo no protótipo. | concluída |
| Sprint 4 · Preservação, correções e teste com usuários | 11/11 – 16/11 | Relato de dano em 2 toques, painel da prefeitura e 5 correções na Trilha e no Passaporte que saíram do teste de usabilidade com moradores. | concluída |
| Sprint 5 · Qualidade, conteúdo e CI/CD | 17/11 – 20/11 | Repositório, GitHub Actions, deploy na Vercel e espelho Jira ↔ GitHub; OAuth + PKCE; esqueleto do backend FastAPI; 17 regras legais; SEO; segurança (CSRF, anexos, 14 ataques); UX e design fino; trilhas temáticas, grafo de personalidades, dados abertos e progresso sem login. Teste: CI com 3 jobs a cada push. 118 de 130 tarefas concluídas. | ativa |
| Sprint 6 · Fundação do backend e segurança | 23/11 – 26/11 | Firebase e regras, cliente OAuth no ar, Docker Compose, deploy do backend, OWASP e proteção da main. | planejada |
| Sprint 7 · Dados, sessões e filas | 27/11 – 02/12 | Redis e Celery em produção, login na API com sessão no Redis, níveis de acesso em todas as rotas, APIs de monumentos e relatos, fotos no Storage. | planejada |
| Sprint 8 · Processamento assíncrono e painel | 03/12 – 08/12 | Narração TTS, aviso de relatos, contagem de visitas, painel lendo a API, gestão de papéis com auditoria e curadoria no CMS. | planejada |
| Sprint 9 · APIs abertas, LGPD e piloto | 09/12 – 14/12 | API de parceiros, mescla do progresso do aparelho, exclusão de dados, ZAP e teste de carga, conversão rua → museu e piloto com placas físicas. | planejada |

Parte do que está na Sprint 5 (trilhas temáticas, grafo, rotina noturna no Celery, home e galeria, selo pelo QR, permissões) foi entregue em 24–25/11, com a sprint ainda ativa, e registrada no Jira depois da entrega (KAN-198 a KAN-213). A visualização 3D e a realidade aumentada ficaram no backlog (KAN-214).

O último dia de cada sprint é de review (demo do incremento), retrospectiva e planning (planning poker em story points).

### Jira ↔ GitHub

- O backlog do Jira é exportado para `.github/jira-backlog.json` a cada planning. O workflow `jira-sync.yml` cria ou atualiza uma issue por task, com a chave no título (`[KAN-23] …`), milestone da sprint e labels de épico, tipo e status. Task concluída no Jira vira issue fechada.
- Cada task no Jira tem um link para a issue correspondente no GitHub.
- Convenção: branch, commit e título de PR começam com a chave (`KAN-23 cache dos lugares visitados`). Use `Closes #30` no PR para fechar a issue ao fazer merge.

## CI/CD

| Etapa | Onde | O que faz |
|---|---|---|
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Em todo push ou PR na `main`: instala, checa tipos (`tsc`), gera o build, roda os testes de dados e de integração e audita dependências |
| CD | Vercel (integração Git) | Todo push na `main` publica em https://mumcz.vercel.app (e no antigo memoria-urbana-maceio.vercel.app). PRs ganham uma URL de preview |
| Backlog | GitHub Actions (`.github/workflows/jira-sync.yml`) | Espelha o backlog do Jira em Issues e milestones |
| CD Oracle | GitHub Actions (`.github/workflows/deploy-oracle.yml`) | Depois do CI verde, publica na VM Oracle Cloud via SSH (Caddy + Node). Fica desligado até existirem as variáveis `ORACLE_HOST` e `SITE_URL`. Guia em [docs/oracle.md](docs/oracle.md) |

### Testes

```bash
pnpm install
pnpm build
node --experimental-strip-types --test tests/data.test.mjs   # integridade do conteúdo
node --experimental-strip-types --test tests/smoke.test.mjs  # integração: sobe o build e verifica rotas, assets e logo
node --experimental-strip-types --test tests/auth.test.mjs   # login: sessão assinada, token do Firebase, acesso sem chave, open redirect
node --experimental-strip-types --test tests/compliance.test.mjs  # 17 regras legais e LGPD
node --experimental-strip-types --test tests/a11y.test.mjs        # axe-core WCAG 2.1 AA + teclado (precisa do Chromium do Playwright)
cd backend && pytest                                          # RBAC, cache, relatos com rate limit
```

- `tests/data.test.mjs` cobre o conteúdo: ids e placas únicos, coordenadas dentro de Maceió, bio preenchida, **convite ao museu presente em todos os monumentos** e fontes em HTTPS.
- `tests/smoke.test.mjs` sobe o build com `vite preview` e confere a página inicial, todos os JS/CSS, a logo e o favicon. Também garante que não há sourcemap inline nem segredos no bundle.
- Camada OWASP: `pnpm audit` (A06, componentes vulneráveis) e cabeçalhos de segurança em `vercel.json` (nosniff, frame-options, referrer, permissions e HSTS).

## Entrar: Google ou só neste aparelho

Em `/entrar` há duas opções reais, sem usuários fictícios:

- **Continuar com Google** (Firebase Authentication): sincroniza o progresso na nuvem. O login abre num popup do Google; o servidor confere o token do Firebase e cria um cookie de sessão próprio (HttpOnly, 7 dias), sem guardar token no navegador. Selos e pontos ficam no **Firestore**, acessado **sem chave**: a Vercel se identifica por OIDC e usa a conta de serviço `api-progresso`, que só tem acesso ao Firestore. Variáveis e passo a passo em [`docs/firebase.md`](docs/firebase.md). Alternativas: Upstash Redis (`KV_REST_API_URL`/`KV_REST_API_TOKEN`) ou a pasta `PROGRESS_DIR` no servidor Oracle. Sem isso, o progresso fica só no aparelho, que **não é apagado ao sair**.
- **Continuar sem conta, salvando neste aparelho**: o progresso (monumentos vistos e trilhas) fica no `localStorage` do celular; nada vai para o servidor.

O antigo acesso de demonstração (visitante/gestor fictícios) foi removido. O painel só abre para e-mails listados em `GESTOR_EMAILS`.

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
