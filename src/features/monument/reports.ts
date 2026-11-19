import type { Report } from '../../data'

// Relatos de dano feitos na página pública. Sem login e sem dado pessoal.
// Enquanto a API de relatos não existe (KAN-67 → backend), eles ficam numa fila local do aparelho
// e serão enviados quando /api/v1/reports estiver no ar. O texto vai para o localStorage; a foto ou o
// vídeo (já validados e, no caso da foto, recodificados sem EXIF) vão para o IndexedDB "mu_reports_media".
const KEY = 'mu_reports_pending'
const DB = 'mu_reports_media'

function saveMedia(id: number, blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => req.result.createObjectStore('media')
      req.onsuccess = () => {
        const tx = req.result.transaction('media', 'readwrite')
        tx.objectStore('media').put(blob, id)
        tx.oncomplete = () => { req.result.close(); resolve() }
        tx.onerror = () => resolve()
      }
      req.onerror = () => resolve()
    } catch { resolve() }
  })
}

export function queueReport(r: Omit<Report, 'id' | 'at' | 'status'>, media?: Blob): void {
  const at = Date.now()
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown[]
    list.push({ ...r, at })
    localStorage.setItem(KEY, JSON.stringify(list.slice(-20)))
  } catch {
    /* armazenamento indisponível (aba anônima/Safari): o relato se perde, a página segue funcionando */
  }
  if (media) void saveMedia(at, media)
}
