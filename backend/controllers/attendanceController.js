// controllers/attendanceController.js

const crypto = require('crypto');
const Member = require('../models/Member'); // Ensure this path is correct

/**
 * Marks attendance based on encrypted QR code data.
 * Expects encryptedData as a JSON string containing iv, tag, and data.
 */
const markAttendance = (req, res) => {
    const { encryptedData } = req.body;

    if (!encryptedData) {
        return res.status(400).json({ message: 'No QR code data provided.', success: false });
    }

    try {
        // Define the encryption algorithm and key
        const algorithm = 'aes-256-gcm';
        const secretKey = process.env.QR_SECRET_KEY;

        // Validate the secret key
        if (!secretKey || secretKey.length !== 64) { // 32 bytes = 256 bits in hex
            throw new Error('Invalid QR_SECRET_KEY. It must be a 64-character hexadecimal string.');
        }

        // Parse the encrypted data payload
        const payload = JSON.parse(encryptedData);
        const iv = Buffer.from(payload.iv, 'hex');
        const tag = Buffer.from(payload.tag, 'hex');
        const encryptedText = Buffer.from(payload.data, 'hex');

        // Create the decipher
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
        decipher.setAuthTag(tag);

        // Decrypt the data
        let decrypted = decipher.update(encryptedText, undefined, 'utf8');
        decrypted += decipher.final('utf8');

        // The decrypted data (e.g., member number)
        const number = decrypted;

        // Update attendance for the member in the database
        Member.updateAttendance(number, (err, changes) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Error marking attendance. Please try again later.', success: false });
            }
            if (changes === 0) {
                return res.status(404).json({ message: 'Member not found or already marked present.', success: false });
            }
            res.json({ message: `Attendance marked for member: ${number}`, success: true });
        });
    } catch (err) {
        console.error('Error decrypting QR code data:', err);
        res.status(400).json({ message: 'Invalid QR code or data format.', success: false });
    }
};

module.exports = { markAttendance };