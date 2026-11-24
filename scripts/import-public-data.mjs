// Importa candidatos a monumento de bases públicas e abertas, para curadoria.
// Fontes: Wikidata (CC0) via SPARQL, OpenStreetMap (ODbL) via Overpass e Wikimedia Commons (autor e licença de cada foto).
// Uso: node scripts/import-public-data.mjs  → grava data/public-sources.json
// O resultado NÃO entra direto no site: a curadoria escreve bio, audiodescrição e convite ao museu em src/data.ts,
// a partir de fontes oficiais e jornalísticas, e copia daqui só coordenadas, foto, crédito e licença.
import { writeFileSync } from 'node:fs'

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

const [wd, os] = await Promise.all([wikidata(), osm().catch(() => [])])
for (const item of wd) if (item.image) item.photo = await commons(item.image).catch(() => null)
const out = { generatedAt: new Date().toISOString(), licenses: { wikidata: 'CC0 1.0', osm: '© OpenStreetMap contributors, ODbL 1.0', commons: 'licença de cada arquivo (ver photo.license)' }, wikidata: wd, osm: os }
writeFileSync('data/public-sources.json', JSON.stringify(out, null, 2) + '\n')
console.log(`Wikidata: ${wd.length} · com foto: ${wd.filter((i) => i.photo).length} · OSM: ${os.length}`)
