// IndexedDB de lo que se guarda para usar la app sin señal. Se usa en lugar del
// service worker de workbox porque en Capacitor iOS (WKWebView) no es fiable.
//   tiles  · mosaicos vectoriales por z/x/y, sin la versión que rota en la URL
//   assets · estilos, TileJSON, sprites y fuentes, por URL
//   routes · rutas descargadas con su spot y los mosaicos que necesitan

const DB_NAME = 'manzaspots-offline'
const DB_VERSION = 1

let dbPromise = null

export function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('tiles').createIndex('savedAt', 'savedAt')
      db.createObjectStore('assets')
      db.createObjectStore('routes', { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })
  return dbPromise
}

const done = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

async function store(name, mode = 'readonly') {
  const db = await openDb()
  return db.transaction(name, mode).objectStore(name)
}

export async function dbGet(name, key) {
  return done((await store(name)).get(key))
}

export async function dbPut(name, value, key) {
  return done((await store(name, 'readwrite')).put(value, key))
}

export async function dbDelete(name, key) {
  return done((await store(name, 'readwrite')).delete(key))
}

export async function dbGetAll(name) {
  return done((await store(name)).getAll())
}

export async function dbCount(name) {
  return done((await store(name)).count())
}

/** Borra las claves `keys` de `name` en una sola transacción. */
export async function dbDeleteMany(name, keys) {
  if (!keys.length) return
  const db = await openDb()
  const tx = db.transaction(name, 'readwrite')
  const os = tx.objectStore(name)
  keys.forEach((key) => os.delete(key))
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

/** Claves de `name` ordenadas por `savedAt`, de la más vieja a la más nueva. */
export async function dbKeysByAge(name) {
  const index = (await store(name)).index('savedAt')
  return done(index.getAllKeys())
}
