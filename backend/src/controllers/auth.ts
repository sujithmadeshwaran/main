import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload
} from '../utils/jwt';
import { generateOTP, sendSMS, sendEmail } from '../utils/otp';

// Auxiliary helper to log audit actions
const logAudit = async (userId: string | null, action: string, details?: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ message: 'Name, password, and at least email or phone are required.' });
    }

    // Check if user already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }
    }
    if (phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        return res.status(400).json({ message: 'A user with this phone number already exists.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default first user or admin email to ADMIN role
    const isFirstUser = (await prisma.user.count()) === 0;
    const isAdminEmail = email?.toLowerCase() === 'admin@skillforge.com';
    const role = (isFirstUser || isAdminEmail) ? 'ADMIN' : 'STUDENT';

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        passwordHash,
        role,
      },
    });

    await logAudit(user.id, 'USER_REGISTER', `Registered user as ${role}`);

    // Send Welcome Email
    if (email) {
      await sendEmail(
        email,
        'Welcome to SkillForge LMS!',
        `<h1>Welcome ${name}!</h1><p>Thank you for registering at SkillForge LMS. Start learning today!</p>`
      );
    }

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: 'Provide email or phone and your password.' });
    }

    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or account is suspended.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'This account uses OTP login. Please log in via OTP.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await logAudit(user.id, 'USER_LOGIN', 'Logged in with password');

    return res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

export const requestOTP = async (req: Request, res: Response) => {
  try {
    const { phoneOrEmail } = req.body;

    if (!phoneOrEmail) {
      return res.status(400).json({ message: 'Phone number or email is required.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Store in DB
    await prisma.oTP.create({
      data: {
        phoneOrEmail,
        code,
        expiresAt,
        type: 'LOGIN',
      },
    });

    const isEmail = phoneOrEmail.includes('@');
    let sent = false;

    if (isEmail) {
      sent = await sendEmail(
        phoneOrEmail,
        'Your SkillForge LMS Login OTP',
        `<h3>SkillForge OTP Verification</h3><p>Your one-time login verification code is: <strong>${code}</strong>. Valid for 5 minutes.</p>`
      );
    } else {
      sent = await sendSMS(phoneOrEmail, code);
    }

    if (!sent) {
      return res.status(500).json({ message: 'Failed to dispatch verification code.' });
    }

    return res.json({ message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error('[REQUEST OTP ERROR]', error);
    return res.status(500).json({ message: 'Server error requesting OTP.' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneOrEmail, code } = req.body;

    if (!phoneOrEmail || !code) {
      return res.status(400).json({ message: 'Phone/Email and code are required.' });
    }

    // Check valid non-expired OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phoneOrEmail,
        code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP code.' });
    }

    // Mark as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    const isEmail = phoneOrEmail.includes('@');
    
    // Find or create user
    let user = isEmail
      ? await prisma.user.findUnique({ where: { email: phoneOrEmail } })
      : await prisma.user.findUnique({ where: { phone: phoneOrEmail } });

    if (!user) {
      // Create user auto-registration
      const isFirstUser = (await prisma.user.count()) === 0;
      const isAdminEmail = isEmail && phoneOrEmail.toLowerCase() === 'admin@skillforge.com';
      const role = (isFirstUser || isAdminEmail) ? 'ADMIN' : 'STUDENT';

      user = await prisma.user.create({
        data: {
          name: isEmail ? phoneOrEmail.split('@')[0] : `Student-${phoneOrEmail.slice(-4)}`,
          email: isEmail ? phoneOrEmail : null,
          phone: isEmail ? null : phoneOrEmail,
          role,
        },
      });

      await logAudit(user.id, 'USER_REGISTER_OTP', 'Auto-registered via OTP');

      // Send welcome if email
      if (isEmail) {
        await sendEmail(
          phoneOrEmail,
          'Welcome to SkillForge LMS!',
          `<h1>Welcome!</h1><p>Your account was auto-registered via OTP at SkillForge LMS. Start learning today!</p>`
        );
      }
    } else {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Your account is suspended.' });
      }
      await logAudit(user.id, 'USER_LOGIN_OTP', 'Logged in via OTP');
    }

    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      message: 'Verification successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[VERIFY OTP ERROR]', error);
    return res.status(500).json({ message: 'Server error verifying OTP.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    // Check in database
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiresAt < new Date() || !dbToken.user.isActive) {
      return res.status(401).json({ message: 'Invalid, expired, or revoked refresh token.' });
    }

    // Verify token JWT structure
    const payload = verifyRefreshToken(refreshToken);

    const tokenPayload: TokenPayload = {
      id: dbToken.user.id,
      email: dbToken.user.email,
      phone: dbToken.user.phone,
      role: dbToken.user.role,
    };

    // Rotate tokens (generate new access, keep or rotate refresh)
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Delete old, save new
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: dbToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('[REFRESH TOKEN ERROR]', error);
    return res.status(401).json({ message: 'Authentication refresh failed.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    return res.status(500).json({ message: 'Server error during logout.' });
  }
};
