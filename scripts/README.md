# scripts

- `prerender.mjs`: roda depois do `vite build` (`pnpm build`). Gera HTML próprio por rota pública (título, descrição, canonical, Open Graph, JSON-LD e texto), `robots.txt`, `sitemap.xml` e `spa.html` (fallback com noindex). Detalhes em [docs/seo.md](../docs/seo.md).
