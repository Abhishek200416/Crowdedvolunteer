const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const login = (req, res) => {
    const { username, password } = req.body;

    Admin.authenticate(username, password, (err, admin) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        // Ensure JWT_SECRET is available
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined in environment variables.');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const token = jwt.sign({ id: admin.id, username: admin.username }, jwtSecret, { expiresIn: '24h' });
        res.json({ token });
    });
};

module.exports = { login };