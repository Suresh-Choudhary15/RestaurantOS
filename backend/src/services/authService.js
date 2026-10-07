// Auth service: credential verification and profile shaping.
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const prisma = require('../lib/prisma');

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
};

/**
 * Validate credentials and return { user, token } or throw with .code.
 */
async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Constant-time-ish response regardless of which check failed
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');

  if (!user || !passwordMatches) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated');
    err.code = 'ACCOUNT_DISABLED';
    throw err;
  }

  const token = generateToken({
    sub: user.id,
    role: user.role,
  });

  const { passwordHash, ...publicUser } = user;
  return { user: publicUser, token };
}

async function me(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_FIELDS,
  });
}

module.exports = { login, me };
