# SEO: fazer o Google achar o site

Tasks KAN-111, KAN-112 e KAN-110 (épico KAN-82).

## O que estava errado

O `.figma/make/site.json` tinha `"robots": { "index": false }`. Com isso, o build colocava `<meta name="robots" content="noindex, nofollow">` em todas as páginas e gerava um `robots.txt` com `Disallow: /`. O Google estava proibido de indexar o site. Além disso, o HTML chegava vazio (`<div id="root"></div>`), e o conteúdo só aparecia depois do JavaScript.

## O que o build faz agora (`scripts/prerender.mjs`)

| Arquivo | Conteúdo |
|---|---|
| `dist/index.html` | Lista dos 15 monumentos com links, JSON-LD `WebSite` e `ItemList` |
| `dist/monumento/<id>/index.html` | Título, descrição, canonical, Open Graph, bio, museu, fontes e JSON-LD `TouristAttraction` com endereço e coordenadas, mais `BreadcrumbList` |
| `dist/<página legal>/index.html` | Título e descrição próprios |
| `dist/entrar`, `app`, `painel`, `prototipo` | `noindex` |
| `dist/spa.html` | Fallback das rotas desconhecidas, `noindex` |
| `dist/robots.txt` | Libera o site, bloqueia `/api/` e as áreas de conta, aponta o sitemap |
| `dist/sitemap.xml` | 22 URLs públicas |

O React substitui o HTML estático ao carregar, então a página continua igual para quem visita.

**Variáveis do build:**
- `SITE_URL`: domínio usado em canonical, sitemap e robots. Padrão: a URL da Vercel.
- `GOOGLE_SITE_VERIFICATION`: código do Search Console. Quando definido, vira a meta tag de verificação.

`tests/seo.test.mjs` roda no CI e falha se:
- o `site.json` voltar a bloquear a indexação (o Figma Make pode reescrever esse arquivo);
- algum monumento sumir do sitemap;
- uma página pública ficar sem título, descrição, canonical ou conteúdo;
- uma rota privada ficar indexável.

## Search Console (dono do projeto)

1. Entre em https://search.google.com/search-console com a conta Google do projeto.
2. Clique em **Adicionar propriedade → Prefixo do URL** e informe `https://memoria-urbana-maceio.vercel.app/`, ou o domínio da Oracle depois da virada.
3. Escolha **Tag HTML** e copie só o valor de `content="…"`.
4. Cadastre esse valor como variável `GOOGLE_SITE_VERIFICATION`:
   - na Vercel: Settings → Environment Variables, depois faça um redeploy;
   - no GitHub: Settings → Variables, para o deploy da Oracle.
   - Ou mande o código para a equipe colocar no build.
5. Clique em **Verificar**.
6. Em **Sitemaps**, envie `sitemap.xml`.
7. Em **Inspeção de URL**, peça a indexação da página inicial e de 2 ou 3 monumentos.

A indexação leva de dias a algumas semanas. Links de fora ajudam: o site da universidade, perfis do projeto, matérias, e o QR das placas quando elas estiverem na rua.

## Checklist de SEO técnico (verificado no CI)

| Item | Situação | Onde |
|---|---|---|
| Sem tags noindex nas páginas públicas | ✅ | `tests/seo.test.mjs` |
| Meta titles únicos (15–90 caracteres) | ✅ | `scripts/prerender.mjs` |
| Meta descriptions (50–170 caracteres) | ✅ | idem |
| Texto alt nas imagens | ✅ | `tests/compliance.test.mjs`, axe-core |
| Core Web Vitals (LCP < 2,5 s, CLS < 0,1 no celular) | ✅ | `tests/guidelines.test.mjs` |
| sitemap.xml | ✅ | `dist/sitemap.xml` |
| Imagem OG 1200×630 | ✅ | `public/og.png` |
| Links quebrados (internos) | ✅ | `tests/seo.test.mjs` |
| Hierarquia de cabeçalhos e só 1 H1 por página | ✅ | `tests/seo.test.mjs` |
| Estratégia de backlinks | ⏳ KAN-183 | Ufal, museus, imprensa, perfis do projeto e o QR das placas |
| Slugs limpos | ✅ | `/monumento/<id>` em minúsculas, sem acento (o teste confere) |
| Links internos | ✅ | Seção "Perto daqui" com os 3 monumentos mais próximos |
| Tags canônicas | ✅ | `<link rel="canonical">` em cada página |
| HTTPS | ✅ | HSTS de 2 anos |
| Imagens compactadas | ✅ | Logo de 518 KB → 26 KB; fotos de terceiros servidas pela origem |
| Schema markup | ✅ | JSON-LD `TouristAttraction`, `BreadcrumbList`, `WebSite`, `ItemList` |
| Search Console | ⏳ KAN-110 | Depende da conta Google do projeto |
| robots.txt | ✅ | `dist/robots.txt` |
| Responsividade no celular | ✅ | Sem rolagem lateral em 320, 390 e 768 px (teste) |
