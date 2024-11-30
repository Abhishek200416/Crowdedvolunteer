// qrgenerator.js

const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generates a QR code containing encrypted data.
 * @param {string} text - The text to encrypt and encode in the QR code.
 * @param {Object} options - QR code customization options.
 * @returns {Promise<string>} - A data URL representing the QR code image.
 */
const generateQRCode = async(text, options = {}) => {
    try {
        // Use AES-256-GCM for encryption
        const algorithm = 'aes-256-gcm';
        const secretKey = process.env.QR_SECRET_KEY; // Ensure this is a 64-character hex string
        const iv = crypto.randomBytes(12); // 12-byte IV for GCM

        const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Combine IV, auth tag, and encrypted text into a single payload
        const payload = {
            iv: iv.toString('hex'),
            tag: authTag.toString('hex'),
            data: encrypted.toString('hex'),
        };
        const encryptedText = JSON.stringify(payload);

        // Generate QR code with customization options
        const qrOptions = {
            errorCorrectionLevel: options.errorCorrectionLevel || 'H',
            type: options.type || 'image/png',
            width: options.width || 500, // Default size
            margin: options.margin || 2,
            color: {
                dark: options.colorDark || '#000000', // Dark squares
                light: options.colorLight || '#FFFFFF', // Light squares
            },
            // Include additional options if needed
            // For example, to add a logo or change the shape of the dots
        };

        const qrData = await QRCode.toDataURL(encryptedText, qrOptions);
        return qrData;
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw err;
    }
};

module.exports = { generateQRCode };