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

              // Safe column migration for existing user databases
              try {
                dbInstance.exec("ALTER TABLE biometric_fingerprints ADD COLUMN image_data TEXT NULL;");
              } catch (colErr) {
                // Column already exists, safe to ignore
              }
              try {
                dbInstance.exec("ALTER TABLE child_locations ADD COLUMN address TEXT NULL;");
              } catch (e) { }
              try {
                dbInstance.exec("ALTER TABLE child_locations ADD COLUMN lat REAL NULL;");
              } catch (e) { }
              try {
                dbInstance.exec("ALTER TABLE child_locations ADD COLUMN lng REAL NULL;");
              } catch (e) { }

              await saveDB();
            }
          }
        } catch (migrationError) {
          // Silent fail for migration errors (device may be offline)
        }
      } else {
        dbInstance = new SQL.Database();

        // Fetch schema from public directory
        const schemaRes = await fetch(`${baseUrl}SQLite_SYS_Database.sqlite.txt`);

        if (!schemaRes.ok) {
          throw new Error('Failed to load database initialization script.');
        }

        const schemaSql = await schemaRes.text();

        // Check if response is HTML (starts with '<'), which means rewrite rules returned the SPA index.html
        if (schemaSql.trim().startsWith('<')) {
          throw new Error('Database initialization scripts returned HTML instead of SQL. Please ensure SQLite_SYS_Database.sqlite.txt exists in the public directory.');
        }

        // Execute schema ONLY (no seed script to preserve patient data)
        dbInstance.exec(schemaSql);

        // Save fresh database state
        await saveDB();
      }

      isInitializing = false;
      return dbInstance;
    } catch (error) {
      isInitializing = false;
      initPromise = null; // Reset promise on failure to allow retry
      throw error;
    }
  })();

  return initPromise;
}

let saveTimer = null;

// Export and save current database state to IndexedDB with debouncing option
export async function saveDB(immediate = false) {
  if (!dbInstance) return;

  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  const performSave = async () => {
    if (!dbInstance) return;
    const binaryArray = dbInstance.export();
    await saveDbBuffer(binaryArray);
  };

  if (immediate) {
    await performSave();
  } else {
    saveTimer = setTimeout(async () => {
      try {
        await performSave();
      } catch (err) {
        console.warn('Debounced saveDB failed:', err);
      }
    }, 250);
  }
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