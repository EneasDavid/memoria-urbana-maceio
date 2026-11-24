# Ingestão, governança e atualidade dos dados do acervo

## Fontes

| Fonte | O que traz | Licença | Como é lida |
|---|---|---|---|
| **Wikidata** | Bens de Maceió (`P131+ Q168888`): igrejas, palácios, museus, praças, faróis, memoriais; coordenadas (`P625`); foto (`P18`) | CC0 1.0 | SPARQL em `query.wikidata.org` |
| **OpenStreetMap** | Estátuas, memoriais, monumentos e museus mapeados (`historic=*`, `tourism=artwork|museum`); tag `wikidata` quando existe | ODbL 1.0 (atribuição) | Overpass API |
| **Wikimedia Commons** | Arquivo da foto, autor e licença de cada imagem | Licença de cada arquivo (CC BY, CC BY-SA, domínio público) | API `imageinfo` + `extmetadata` |
| **Curadoria** | Bio, audiodescrição, convite ao museu, fatos | Textos próprios, com fontes oficiais e jornalísticas citadas | Escrita em `src/data.ts` |

O Google Maps **não** é fonte de dados: os termos dele não permitem copiar lugares para outra base. Ele aparece só no botão "Como chegar", como link.

## Pipeline (ELT com revisão humana)

```
Wikidata ─┐
OSM ──────┼─► scripts/import-public-data.mjs ─► data/public-sources.json ─► PR semanal ─► curadoria ─► src/data.ts ─► CI ─► Vercel
Commons ──┘        (extrai e normaliza)            (área de preparação)      (revisão)     (texto)      (testes)
```

1. **Extract:** o script consulta as três fontes (`.github/workflows/ingest.yml`, toda segunda às 6h, ou manual).
2. **Load:** grava os candidatos em `data/public-sources.json` (preparação), com `fetchedAt`.
3. **Transform (curadoria):** só entra no site o que alguém revisou: texto escrito, museu convidado, foto e licença conferidas. Cada monumento importado guarda a linhagem em `origin: { dataset, id, importedAt }`.
4. **Validar:** `tests/data.test.mjs` barra id ou placa duplicada, coordenada fora de Maceió, bio curta, falta de convite ao museu e fonte sem HTTPS. `tests/trails.test.mjs` barra ligação quebrada no grafo.
5. **Publicar:** merge na `main` → Vercel.

## Idempotência e sem duplicidade

- **Chave estável:** QID do Wikidata (`Q67176290`) e `tipo/id` do OSM (`node/123`). Mesmos itens, mesma chave.
- **Deduplicação:** itens repetidos na consulta (o Wikidata devolve uma linha por coordenada/tipo) são unidos pela chave.
- **Resolução de entidades OSM ↔ Wikidata:** quando o OSM tem tag `wikidata`, o item recebe `sameAs` com o QID, e a curadoria usa um só registro.
- **Ordem fixa e escrita condicional:** a saída é ordenada pela chave; se nada mudou na fonte, o arquivo não é regravado (rodar duas vezes = mesmo resultado).
- **Falha não apaga dado:** se uma fonte cair, o script mantém a última leitura boa dela.
- **No site:** `id` e `plate` únicos (teste); o `origin.id` impede importar o mesmo bem duas vezes.

## Atualidade (freshness)

| Camada | Atualização | Onde ver |
|---|---|---|
| Candidatos das bases abertas | Semanal, automática | `fetchedAt` em `data/public-sources.json` |
| Acervo publicado | A cada merge revisado | `origin.importedAt` de cada monumento; data do commit |
| Horários dos museus e textos | Revisão da curadoria a cada sprint | Fontes citadas na página |

Leitura em 24/11/2026: 36 bens no Wikidata (19 com foto livre) e 28 itens no OSM; 10 viraram placas novas (25 no total).

## Governança

- **Dono do dado:** a curadoria (hoje, o autor do projeto); papel `curador` no RBAC quando o backend estiver no ar.
- **Revisão em duas etapas:** PR automático → revisão humana → CI verde → merge.
- **Licenças:** cada foto mostra autor e licença na página e em `/creditos`; dados do OSM com atribuição.
- **Correção pelo público:** o relato "Informação errada" chega ao painel do gestor.
