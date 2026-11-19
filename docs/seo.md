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
