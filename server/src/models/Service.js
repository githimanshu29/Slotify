// ─────────────────────────────────────────────────────────────
//  Service Model
//  Represents what the business offers: Dentist, Massage, etc.
//  Admin creates these → chatbot references them during booking
//
//  Why this exists: When a user says "book dentist", the system
//  does Service.findOne({ name: /dentist/i }) to resolve the
//  service name from natural language to a real DB record.
//  Without predefined services, we'd have no idea what "dentist"
//  maps to — no duration, no availability templates, nothing.
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
      // e.g., "Dentist", "Massage", "Physiotherapy"
    },

    description: {
      type: String,
      default: '',
    },

    duration: {
      type: Number,
      default: 30,
      // Slot length in minutes — used by slotGenerator
      // to divide the day into bookable chunks
    },

    isActive: {
      type: Boolean,
      default: true,
      // Soft delete — admin can deactivate without
      // destroying existing appointment references
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

const Service = mongoose.model('Service', serviceSchema);
export default Service;
