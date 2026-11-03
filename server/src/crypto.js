'use strict';

const crypto = require('crypto');

/**
 * AES-256-GCM for RU↔CN chat messages.
 * MESSAGE_KEY: 64 hex chars (=32 bytes) or any passphrase → SHA-256.
 * DB stores only ciphertext + iv + tag — never plaintext.
 */

function resolveKey() {
  const raw = process.env.MESSAGE_KEY || '';
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  if (!raw) {
    throw new Error('MESSAGE_KEY env is required (64 hex chars or passphrase)');
  }
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

let _key;
function getKey() {
  if (!_key) _key = resolveKey();
  return _key;
}

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

function decrypt({ ciphertext, iv, tag }) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt, resolveKey };
