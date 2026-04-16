// ─────────────────────────────────────────────────────────────
//  Auth Controller
//  Handles user registration, login, token refresh, and logout
//
//  Token strategy:
//    Access Token  → short-lived (15 min), used for API calls
//    Refresh Token → long-lived (7 days), used to get new access tokens
//
//  Why two tokens?
//    - If access token is stolen, damage is limited (15 min window)
//    - Refresh token is stored in DB, so we can invalidate it on logout
//    - Better UX: user stays logged in for 7 days without re-entering password
//
//  Flow:
//    Register → hash password → save user → issue tokens
//    Login    → verify password → issue tokens
//    Refresh  → verify refresh token → issue new pair
//    Logout   → clear refresh token from DB
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import logger from '../utils/Logger.js';

// ── Token generation helpers ──

/**
 * Generate a short-lived access token (15 minutes)
 * Contains: userId, email, role
 * Used in: Authorization: Bearer <accessToken>
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

/**
 * Generate a long-lived refresh token (7 days)
 * Contains: userId only (minimal payload)
 * Stored in DB for invalidation on logout
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

// ═══════════════════════════════════════════════════════════
//  REGISTER
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns: { user, accessToken, refreshToken }
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // ── Validate input ──
    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    // ── Check if user already exists ──
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'Email already registered', 409);
    }

    // ── Create user (password is hashed by pre-save hook) ──
    const user = await User.create({ name, email, password });

    // ── Generate token pair ──
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ── Store refresh token in DB ──
    user.refreshToken = refreshToken;
    await user.save();

    logger.info('User registered', { email: user.email, id: user._id });

    return sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    logger.error('Register error', { error: error.message });
    return sendError(res, 'Registration failed. Please try again.');
  }
}

// ═══════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { user, accessToken, refreshToken }
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // ── Find user with password field (excluded by default via select: false) ──
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +refreshToken'
    );

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // ── Compare password ──
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // ── Generate new token pair ──
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // ── Store new refresh token in DB ──
    user.refreshToken = refreshToken;
    await user.save();

    logger.info('User logged in', { email: user.email });

    return sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    return sendError(res, 'Login failed. Please try again.');
  }
}

// ═══════════════════════════════════════════════════════════
//  REFRESH TOKEN
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Returns: { accessToken, refreshToken }
 *
 * Issues a new access + refresh token pair.
 * The old refresh token is invalidated (replaced in DB).
 * This is called "refresh token rotation" — prevents reuse attacks.
 */
export async function refreshTokenHandler(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    // ── Verify the refresh token ──
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return sendError(res, 'Invalid or expired refresh token — please login again', 401);
    }

    // ── Find user and check if this refresh token matches the stored one ──
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      // Token reuse detected or user not found
      // Clear the stored refresh token as a safety measure
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
      return sendError(res, 'Invalid refresh token — please login again', 401);
    }

    // ── Rotate: generate new pair, store new refresh token ──
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    logger.debug('Token refreshed', { userId: user._id });

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error('Refresh token error', { error: error.message });
    return sendError(res, 'Token refresh failed', 500);
  }
}

// ═══════════════════════════════════════════════════════════
//  LOGOUT
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <accessToken>
 * Clears the refresh token from DB, effectively logging the user out
 */
export async function logout(req, res) {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.userId).select('+refreshToken');

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    logger.info('User logged out', { userId: req.user.userId });

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    return sendError(res, 'Logout failed');
  }
}

// ═══════════════════════════════════════════════════════════
//  GET CURRENT USER (profile)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <accessToken>
 * Returns the currently authenticated user's profile
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error('Get me error', { error: error.message });
    return sendError(res, 'Failed to fetch profile');
  }
}
