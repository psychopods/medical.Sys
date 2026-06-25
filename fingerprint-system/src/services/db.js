import initSqlJs from 'sql.js';

// IndexedDB Helper Functions
const IDB_NAME = 'mitz_hospital_db_store';
const IDB_STORE = 'db_store';
const IDB_KEY = 'sqlite_db';

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getCachedDbBuffer() {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDB_STORE], 'readonly');
    const store = transaction.objectStore(IDB_STORE);
    const request = store.get(IDB_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDbBuffer(buffer) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDB_STORE], 'readwrite');
    const store = transaction.objectStore(IDB_STORE);
    const request = store.put(buffer, IDB_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// SQLite Database state
let dbInstance = null;
let SQL = null;
let isInitializing = false;
let initPromise = null;

export async function getDB() {
  if (dbInstance) return dbInstance;
  if (isInitializing) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      // 1. Initialize sql.js WebAssembly
      const baseUrl = import.meta.env.BASE_URL || '/';
      SQL = await initSqlJs({
        locateFile: (file) => `${baseUrl}sql-wasm.wasm`,
      });

      // 2. Load cached database from IndexedDB
      const cachedBuffer = await getCachedDbBuffer();

      if (cachedBuffer) {
        dbInstance = new SQL.Database(new Uint8Array(cachedBuffer));
        
        // Dynamic migration: execute schema SQL to ensure any new/missing tables are created in the cached database
        try {
          const schemaRes = await fetch(`${baseUrl}SQLite_SYS_Database.sqlite.txt`);
          if (schemaRes.ok) {
            const schemaSql = await schemaRes.text();
            if (!schemaSql.trim().startsWith('<')) {
              dbInstance.exec(schemaSql);
              await saveDB();
            }
          }
        } catch (migrationError) {
          // Silent fail for migration errors (device may be offline)
        }
      } else {
        dbInstance = new SQL.Database();

        // Fetch schema and seeds from public directory
        const [schemaRes, seedRes] = await Promise.all([
          fetch(`${baseUrl}SQLite_SYS_Database.sqlite.txt`),
          fetch(`${baseUrl}sqliteSEED.sql.txt`),
        ]);

        if (!schemaRes.ok || !seedRes.ok) {
          throw new Error('Failed to load database initialization scripts.');
        }

        const schemaSql = await schemaRes.text();
        const seedSql = await seedRes.text();

        // Check if response is HTML (starts with '<'), which means rewrite rules returned the SPA index.html
        if (schemaSql.trim().startsWith('<') || seedSql.trim().startsWith('<')) {
          throw new Error('Database initialization scripts returned HTML instead of SQL. Please ensure SQLite_SYS_Database.sqlite.txt and sqliteSEED.sql.txt exist in the public directory and are not being intercepted by rewrite rules.');
        }

        // Execute schema and seed data
        dbInstance.exec(schemaSql);
        dbInstance.exec(seedSql);

        // Save fresh database state
        await saveDB();
      }

      isInitializing = false;
      return dbInstance;
    } catch (error) {
      isInitializing = false;
      throw error;
    }
  })();

  return initPromise;
}

// Export and save current database state to IndexedDB
export async function saveDB() {
  if (!dbInstance) return;
  const binaryArray = dbInstance.export();
  await saveDbBuffer(binaryArray);
}

// Query helper: returns an array of row objects
export async function executeQuery(sql, params = []) {
  const db = await getDB();
  let stmt;
  try {
    stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    return results;
  } catch (error) {
    throw error;
  } finally {
    if (stmt) stmt.free();
  }
}

// Run helper: executes update/insert queries and saves database state
export async function executeRun(sql, params = []) {
  const db = await getDB();
  try {
    db.run(sql, params);
    await saveDB();
    return {
      changes: db.getRowsModified(),
    };
  } catch (error) {
    throw error;
  }
}

// Run multiple statements (e.g. for batch migrations or sync delta application)
export async function executeBatch(sql) {
  const db = await getDB();
  try {
    db.exec(sql);
    await saveDB();
  } catch (error) {
    throw error;
  }
}