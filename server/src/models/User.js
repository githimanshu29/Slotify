

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
