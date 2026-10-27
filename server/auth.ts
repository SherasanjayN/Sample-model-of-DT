import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'magalir_kuzhu_secure_jwt_token_secret_key_2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      groupId: user.group_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User not found or account deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function requireRole(...roles: Array<'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. You do not have permission for this action.' });
      return;
    }

    next();
  };
}

export function validateRegistration(data: any): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Name ≥ 3 letters
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 letters.';
  }

  // Phone exactly 10 digits
  const phoneClean = (data.phone || '').toString().trim();
  if (!/^\d{10}$/.test(phoneClean)) {
    errors.phone = 'Phone number must be exactly 10 digits.';
  }

  // Email regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  // Area & District mandatory
  if (!data.area || typeof data.area !== 'string' || !data.area.trim()) {
    errors.area = 'Area is required.';
  }

  if (!data.district || typeof data.district !== 'string' || !data.district.trim()) {
    errors.district = 'District is required.';
  }

  // Password ≥ 6 characters alphanumeric
  const password = data.password || '';
  if (
    typeof password !== 'string' ||
    password.length < 6 ||
    !/[a-zA-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password = 'Password must be at least 6 characters and contain both letters and numbers.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function sanitizeUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash, ...rest } = user;
  return rest;
}

export { bcrypt };
