// Attendance model file
const db = require('../config/database');

const Attendance = {
    initialize: () => {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        date TEXT,
        status TEXT DEFAULT 'Present',
        FOREIGN KEY(member_id) REFERENCES members(id)
      )
    `;
        db.run(createTableQuery, (err) => {
            if (err) console.error('Error creating attendance table:', err);
            else console.log('Attendance table created successfully.');
        });
    },
    markAttendance: (memberId, callback) => {
        const date = new Date().toISOString().split('T')[0];
        const query = `INSERT INTO attendance (member_id, date, status) VALUES (?, ?, 'Present')`;
        db.run(query, [memberId, date], function(err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID, memberId, date, status: 'Present' });
        });
    },
    getAttendance: (memberId, callback) => {
        const query = `SELECT * FROM attendance WHERE member_id = ? ORDER BY date DESC`;
        db.all(query, [memberId], (err, rows) => {
            if (err) return callback(err);
            callback(null, rows);
        });
    },
};

module.exports = Attendance;