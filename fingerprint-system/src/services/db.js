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

// ============================================
// MIGRATION FUNCTIONS
// ============================================

const migrateServicesTable = async (db) => {
  try {
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='services_rendered'");
    
    if (tableCheck.length === 0 || tableCheck[0].values.length === 0) {
      return;
    }
    
    const result = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='services_rendered'");
    const createSQL = result[0]?.values?.[0]?.[0] || '';
    
    if (!createSQL.includes("'procedure'")) {
      try {
        db.run("BEGIN TRANSACTION");
        
        db.run(`
          CREATE TABLE services_rendered_new (
            id TEXT PRIMARY KEY NOT NULL,
            child_id TEXT NOT NULL,
            service_type TEXT NOT NULL CHECK(service_type IN ('medical', 'social', 'education', 'procedure')),
            services_list TEXT NOT NULL,
            date TEXT NOT NULL,
            recorded_by TEXT NULL,
            recorded_by_name TEXT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            is_dirty INTEGER NOT NULL DEFAULT 0,
            sync_status TEXT NOT NULL DEFAULT 'synced' CHECK(sync_status IN ('local_created', 'synced', 'local_updated')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_modified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (child_id) REFERENCES children_profiles (id) ON DELETE CASCADE
          )
        `);
        
        db.run(`INSERT INTO services_rendered_new SELECT * FROM services_rendered`);
        db.run(`DROP TABLE services_rendered`);
        db.run(`ALTER TABLE services_rendered_new RENAME TO services_rendered`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_services_child_id ON services_rendered (child_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_services_service_type ON services_rendered (service_type)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_services_date ON services_rendered (date)`);
        
        db.run("COMMIT");
        await saveDB(true);
      } catch (error) {
        db.run("ROLLBACK");
      }
    }
  } catch (error) {
    // Silent fail
  }
};

const migrateAddIsDirtyColumns = async (db) => {
  const tables = [
    'medical_baselines',
    'child_vitals', 
    'medications_given',
    'laboratory_tests',
    'symptoms_recorded',
    'clothing_provisions'
  ];
  
  for (const table of tables) {
    try {
      const result = db.exec(`PRAGMA table_info(${table})`);
      const columns = result[0]?.values?.map(row => row[1]) || [];
      
      if (!columns.includes('is_dirty')) {
        db.run(`ALTER TABLE ${table} ADD COLUMN is_dirty INTEGER NOT NULL DEFAULT 0`);
      }
    } catch (error) {
      // Table might not exist yet, ignore
    }
  }
};

// ============================================
// MAIN DATABASE INITIALIZATION
// ============================================

export async function getDB() {
  if (dbInstance) return dbInstance;
  if (isInitializing) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      SQL = await initSqlJs({
        locateFile: (file) => `${baseUrl}sql-wasm.wasm`,
      });

      const cachedBuffer = await getCachedDbBuffer();

      if (cachedBuffer) {
        dbInstance = new SQL.Database(new Uint8Array(cachedBuffer));

        try {
          const schemaRes = await fetch(`${baseUrl}SQLite_SYS_Database.sqlite.txt`);
          if (schemaRes.ok) {
            const schemaSql = await schemaRes.text();
            if (!schemaSql.trim().startsWith('<')) {
              dbInstance.exec(schemaSql);

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

              await migrateServicesTable(dbInstance);
              await migrateAddIsDirtyColumns(dbInstance);

              await saveDB(true);
            }
          }
        } catch (migrationError) {
          // Silent fail
        }
      } else {
        dbInstance = new SQL.Database();

        const schemaRes = await fetch(`${baseUrl}SQLite_SYS_Database.sqlite.txt`);

        if (!schemaRes.ok) {
          throw new Error('Failed to load database initialization script.');
        }

        const schemaSql = await schemaRes.text();

        if (schemaSql.trim().startsWith('<')) {
          throw new Error('Database initialization scripts returned HTML instead of SQL. Please ensure SQLite_SYS_Database.sqlite.txt exists in the public directory.');
        }

        dbInstance.exec(schemaSql);

        await migrateServicesTable(dbInstance);
        await migrateAddIsDirtyColumns(dbInstance);

        await saveDB(true);
      }

      isInitializing = false;
      return dbInstance;
    } catch (error) {
      isInitializing = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

let saveTimer = null;

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
        // Silent fail
      }
    }, 250);
  }
}

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

export async function executeBatch(sql) {
  const db = await getDB();
  try {
    db.exec(sql);
    await saveDB();
  } catch (error) {
    throw error;
  }
}

export async function resetDatabase() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([IDB_STORE], 'readwrite');
    const store = transaction.objectStore(IDB_STORE);
    store.clear();
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = reject;
    });
    
    dbInstance = null;
    isInitializing = false;
    initPromise = null;
  } catch (error) {
    throw error;
  }
}

export async function isDatabaseReady() {
  try {
    const db = await getDB();
    return db !== null;
  } catch {
    return false;
  }
}