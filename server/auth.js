const jwt = require('jsonwebtoken');
const { createHash } = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || (process.env.DATABASE_URL
  ? createHash('sha256').update(`skillbank:jwt:${process.env.DATABASE_URL}`).digest('hex')
  : (process.env.NODE_ENV === 'production' ? '' : 'skillbank-local-development-only'));
if (!JWT_SECRET) throw new Error('Set JWT_SECRET or DATABASE_URL before starting in production');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.userId = jwt.verify(header.split(' ')[1], JWT_SECRET).userId;
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { authMiddleware, generateToken };
