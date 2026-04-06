// WARNING: THIS IS A SIMPLIFIED ENCRYPTION FOR DEMONSTRATION.
// FOR PRODUCTION, USE A ROBUST KEY MANAGEMENT SYSTEM AND KEK/DEK ENCRYPTION.
// Store encryption key securely (e.g., in environment variables, KMS).

const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; // AES 256 GCM is better for production but requires more setup

// Ensure ENCRYPTION_KEY is a 32-byte (256-bit) string
// Ensure IV_LENGTH is 16 bytes for AES-256-CBC
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
const IV_LENGTH = 16; // For AES-256-CBC

if (ENCRYPTION_KEY.length !== 64) { // 32 bytes = 64 hex characters
    console.warn('WARNING: ENCRYPTION_KEY length is not 64 hex characters (32 bytes). Encryption might fail or be insecure.');
}

function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return '';
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed. Check key, IV, or encrypted text format:', error.message);
        return null; // Or throw an error
    }
}

module.exports = {
    encrypt,
    decrypt,
};