import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const pathToKey = path.join(path.resolve(), 'keys', 'id_rsa_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

export default (req, res, next) => {
  if (!req.cookies.token) return res.redirect('/api/auth/refresh');
  try {
    if (jwt.verify(req.cookies.token, PUB_KEY, { algorithms: ['RS256'] })) {
      next();
    } else {
      return res.redirect('/api/auth/refresh');
    }
  } catch (e) {
    return res.json({ success: false, msg: 'malformed token' });
  }
};
