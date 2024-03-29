import crypto from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const pathToKey = path.join(path.resolve(), 'keys', 'id_rsa_priv.pem');
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');

const pathToKeyRefresh = path.join(path.resolve(), 'keys', 'id_rsa_priv_refresh.pem');
const PRIV_KEY_REFRESH = fs.readFileSync(pathToKeyRefresh, 'utf8');

/**
 *
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 *
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
export function validPassword(password, hash, salt) {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

/**
 *
 * @param {*} password - The password string that the user inputs
 * to the password field in the register form
 *
 * This function takes a plain text password and creates a salt and hash out of it.
 * Instead of storing the plaintext password in the database,
 * the salt and hash are stored for security
 *
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm
 * to make a hash of the plain text password.
 * You would then store the hashed password in the database
 * and then re-hash it to verify later (similar to what we do here)
 */
export function genPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

  return {
    salt,
    hash,
  };
}

/**
 * @param {*} userid - The user object.
 * We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
export function issueJWT(userid, expiresIn = '15m', key = 1) {
  const payload = {
    sub: userid,
    iat: Date.now(),
  };
  let signedToken;
  if (key === 1) {
    signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { expiresIn, algorithm: 'RS256' });
  } else {
    signedToken = jsonwebtoken.sign(payload, PRIV_KEY_REFRESH, { expiresIn, algorithm: 'RS256' });
  }

  return {
    // token: `Bearer ${signedToken}`,
    token: signedToken,
    expires: expiresIn,
  };
}
