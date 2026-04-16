// ─────────────────────────────────────────────────────────────
//  User Model
//  Stores registered users with hashed passwords
//
//  Auth flow:
//    Register → hash password → save user
//    Login → compare password → issue access + refresh tokens
//    Refresh → verify refresh token → issue new pair
//    Logout → clear refresh token from DB
//
//  The refreshToken is stored in DB so we can:
//    1. Invalidate it on logout (set to null)
//    2. Detect token reuse (stolen refresh tokens)
//
//  Role field enables future admin-via-JWT if needed,
//  but currently admin uses x-admin-key for simplicity
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    refreshToken: {
      type: String,
      default: null,
      select: false, // Don't expose in normal queries
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save hook: hash password before storing ──
// Only runs when password is new or modified (not on every save)
// Note: Mongoose 9 async hooks don't use next() — just return
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare candidate password with stored hash ──
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
