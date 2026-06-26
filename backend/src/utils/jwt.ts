import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skillforge_jwt_access_secret_key_2026_super_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'skillforge_jwt_refresh_secret_key_2026_super_secure';

export interface TokenPayload {
  id: string;
  email: string | null;
  phone: string | null;
  role: 'STUDENT' | 'ADMIN';
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
