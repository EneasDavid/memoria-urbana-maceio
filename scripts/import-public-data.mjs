// Importa candidatos a monumento de bases públicas e abertas, para curadoria.
// Fontes: Wikidata (CC0) via SPARQL, OpenStreetMap (ODbL) via Overpass e Wikimedia Commons (autor e licença de cada foto).
// Uso: node scripts/import-public-data.mjs  → grava data/public-sources.json
// O resultado NÃO entra direto no site: a curadoria escreve bio, audiodescrição e convite ao museu em src/data.ts,
// a partir de fontes oficiais e jornalísticas, e copia daqui só coordenadas, foto, crédito e licença.
import { writeFileSync, readFileSync, existsSync } from 'node:fs'

const UA = { 'User-Agent': 'MemoriaUrbanaMaceio/1.0 (projeto academico; https://github.com/EneasDavid/memoria-urbana-maceio)' }
const MACEIO = 'Q168888'

const sparql = `SELECT ?item ?itemLabel ?coord ?image (GROUP_CONCAT(DISTINCT ?typeLabel; separator=", ") AS ?types) WHERE {
  ?item wdt:P131+ wd:${MACEIO}; wdt:P625 ?coord.
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item wdt:P31 ?t. ?t rdfs:label ?typeLabel FILTER(lang(?typeLabel) = "pt") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
} GROUP BY ?item ?itemLabel ?coord ?image`

const overpass = `[out:json][timeout:90];area["name"="Maceió"]["boundary"="administrative"]->.a;
(nwr(area.a)["historic"~"monument|memorial|statue|bust"];nwr(area.a)["tourism"="artwork"];nwr(area.a)["tourism"="museum"];);out center tags;`

const KEEP = /monumento|memorial|estátua|escultura|igreja|catedral|museu|praça|farol|palácio|edifício histórico|estação|forte/i

async function wikidata() {
  const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql), { headers: UA })
  const rows = (await r.json()).results.bindings
  return rows
    .filter((b) => KEEP.test(b.types?.value || ''))
    .map((b) => {
      const [lng, lat] = b.coord.value.replace(/Point\(|\)/g, '').split(' ').map(Number)
      return { source: 'wikidata', id: b.item.value.split('/').pop(), name: b.itemLabel.value, types: b.types.value, lat, lng, image: b.image?.value || null }
    })
}

async function osm() {
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: UA, body: new URLSearchParams({ data: overpass }) })
  return (await r.json()).elements
    .filter((e) => e.tags?.name)
    .map((e) => ({ source: 'osm', id: `${e.type}/${e.id}`, name: e.tags.name, types: e.tags.historic || e.tags.tourism, lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon, wikidata: e.tags.wikidata || null }))
}

/** Autor, licença e página da foto no Commons. */
async function commons(fileUrl) {
  const title = 'File:' + decodeURIComponent(fileUrl.split('/Special:FilePath/')[1])
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&titles=${encodeURIComponent(title)}`
  const p = Object.values((await (await fetch(u, { headers: UA })).json()).query.pages)[0]
  const ii = p.imageinfo?.[0]
  if (!ii) return null
  const meta = ii.extmetadata || {}
  const strip = (s) => (s || '').replace(/<[^>]+>/g, '').trim()
  return { src: ii.thumburl || ii.url, page: ii.descriptionurl, author: strip(meta.Artist?.value), license: strip(meta.LicenseShortName?.value), licenseUrl: meta.LicenseUrl?.value || null }
}

const FILE = 'data/public-sources.json'
const prev = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null
// Fonte fora do ar não apaga dado: mantém a última leitura boa daquela fonte.
const [wdRaw, os] = await Promise.all([wikidata().catch(() => prev?.wikidata ?? []), osm().catch(() => { console.warn('OSM indisponível: mantendo a última leitura.'); return prev?.osm ?? [] })])

// Idempotência: chave estável (QID do Wikidata, tipo/id do OSM), sem duplicados e em ordem fixa.
// Rodar duas vezes sem mudança na fonte gera o mesmo arquivo, byte a byte; o arquivo só é regravado se o conteúdo mudar.
const dedupe = (items) => [...new Map(items.map((i) => [i.id, i])).values()].sort((a, b) => a.id.localeCompare(b.id, 'en'))
const wd = dedupe(wdRaw)
for (const item of wd) if (item.image) item.photo = await commons(item.image).catch(() => null)
// Resolução de entidades OSM ↔ Wikidata: o item do OSM com tag wikidata aponta para o mesmo QID.
const osmItems = dedupe(os).map((o) => ({ ...o, sameAs: o.wikidata && wd.some((w) => w.id === o.wikidata) ? o.wikidata : null }))

const body = { licenses: { wikidata: 'CC0 1.0', osm: '© OpenStreetMap contributors, ODbL 1.0', commons: 'licença de cada arquivo (ver photo.license)' }, wikidata: wd, osm: osmItems }
const same = prev && JSON.stringify({ ...prev, fetchedAt: undefined }) === JSON.stringify({ ...body, fetchedAt: undefined })
if (same) console.log('Sem mudanças nas fontes: arquivo mantido (freshness: ' + prev.fetchedAt + ').')
else {
  writeFileSync(FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), ...body }, null, 2) + '\n')
  console.log(`Atualizado. Wikidata: ${wd.length} · com foto: ${wd.filter((i) => i.photo).length} · OSM: ${osmItems.length}`)
}
