const db = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = {
    initialize: () => {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `;
        db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating admin table:', err);
                return;
            }
            console.log('Admin table ensured.');

            // Initialize default admin if not exists
            const username = 'Faithcenter';
            const password = 'Micah711';

            const checkAdminQuery = `SELECT * FROM admin WHERE username = ?`;
            db.get(checkAdminQuery, [username], (err, row) => {
                if (err) {
                    console.error('Error querying admin table:', err);
                    return;
                }
                if (!row) {
                    bcrypt.hash(password, 10, (err, hash) => {
                        if (err) {
                            console.error('Error hashing password:', err);
                            return;
                        }
                        const insertAdminQuery = `INSERT INTO admin (username, password) VALUES (?, ?)`;
                        db.run(insertAdminQuery, [username, hash], (err) => {
                            if (err) {
                                console.error('Error inserting admin:', err);
                            } else {
                                console.log('Default admin created.');
                            }
                        });
                    });
                } else {
                    console.log('Default admin already exists.');
                }
            });
        });
    },
    authenticate: (username, password, callback) => {
        const query = `SELECT * FROM admin WHERE username = ?`;
        db.get(query, [username], (err, admin) => {
            if (err) return callback(err);
            if (!admin) return callback(null, false);

            bcrypt.compare(password, admin.password, (err, isMatch) => {
                if (err) return callback(err);
                callback(null, isMatch ? admin : false);
            });
        });
    },
};

module.exports = Admin;