const db = require('../config/database');

const Member = {
    initialize: () => {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        number TEXT UNIQUE,
        qr_code TEXT,
        attendance INTEGER DEFAULT 0
      )
    `;
        db.run(createTableQuery, (err) => {
            if (err) console.error('Error creating members table:', err);
        });
    },
    create: (memberData, callback) => {
        const { name, number, qr_code } = memberData;
        const query = `INSERT INTO members (name, number, qr_code) VALUES (?, ?, ?)`;
        db.run(query, [name, number, qr_code], function(err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID, ...memberData });
        });
    },
    findAll: (callback) => {
        const query = `SELECT * FROM members ORDER BY name ASC`;
        db.all(query, [], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        });
    },
    findById: (id, callback) => {
        const query = `SELECT * FROM members WHERE id = ?`;
        db.get(query, [id], (err, row) => {
            if (err) return callback(err);
            callback(null, row);
        });
    },
    search: (queryText, callback) => {
        const query = `SELECT * FROM members WHERE name LIKE ? OR number LIKE ? ORDER BY name ASC`;
        const searchText = `%${queryText}%`;
        db.all(query, [searchText, searchText], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        });
    },
    updateAttendance: (number, callback) => {
        const query = `UPDATE members SET attendance = 1 WHERE number = ?`;
        db.run(query, [number], function(err) {
            if (err) return callback(err);
            callback(null, this.changes);
        });
    },
    getAttendanceByDate: (date, callback) => {
        const query = `
            SELECT m.*,
                CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END AS attendance
            FROM members m
            LEFT JOIN attendance a ON m.id = a.member_id AND a.date = ?
            ORDER BY m.name ASC
        `;
        db.all(query, [date], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        });
    },
};

module.exports = Member;