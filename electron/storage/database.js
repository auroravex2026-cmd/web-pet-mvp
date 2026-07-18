const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

function openDatabase(userDataPath) {
    const databasePath = path.join(userDataPath, "lilia.db");

    const database = new DatabaseSync(databasePath);

    database.exec(`
        CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        due_at TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
        );
    `);

    return database;
}

module.exports = {
    openDatabase
};
