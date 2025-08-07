// This wrapper selects the appropriate database based on runtime
let db, initDB, dbLogger;

if (typeof Bun !== 'undefined') {
    // Use Bun-optimized database
    const bunDb = await import('./database-bun.js');
    db = bunDb.db;
    initDB = bunDb.initDB;
    dbLogger = bunDb.dbLogger;
} else {
    // Use Node.js database
    const nodeDb = await import('./database.js');
    db = nodeDb.db;
    initDB = nodeDb.initDB;
    dbLogger = nodeDb.dbLogger;
}

export { db, initDB, dbLogger };