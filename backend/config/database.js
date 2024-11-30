const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ensure the 'db' directory exists
const dbDir = path.join(__dirname, '../db');
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to SQLite database:', err);
    } else {
        console.log('Connected to SQLite database.');
    }
});

module.exports = db;