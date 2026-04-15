// ─────────────────────────────────────────────────────────────
//  AvailabilityTemplate Model
//  Defines weekly working hours for each service
//
//  Why this exists: Admin sets "Dentist works Mon-Fri, 10:00-18:00,
//  30-min slots". Without this, the chatbot can't generate available
//  time slots — it would have no idea when the dentist is free.
//
//  How it's used (Step 6 of system design):
//    const template = await AvailabilityTemplate.findOne({
//      serviceId: svc._id,
//      dayOfWeek: new Date(date).getDay()  // 0=Sun, 1=Mon, ...
//    });
//    const slots = generateSlots(template); // ['10:00','10:30',...]
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const availabilityTemplateSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },

    dayOfWeek: {
      type: Number,
      required: true,
      min: 0, // Sunday
      max: 6, // Saturday
    },

    startTime: {
      type: String,
      required: true,
      // "HH:MM" format, e.g., "09:00"
    },

    endTime: {
      type: String,
      required: true,
      // "HH:MM" format, e.g., "17:00"
    },

    slotDuration: {
      type: Number,
      required: true,
      default: 30,
      // Minutes per slot — matches Service.duration typically
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: fast lookup for "dentist on Monday"
// Also prevents duplicate templates for same service+day
availabilityTemplateSchema.index(
  { serviceId: 1, dayOfWeek: 1 },
  { unique: true }
);

const AvailabilityTemplate = mongoose.model(
  'AvailabilityTemplate',
  availabilityTemplateSchema
);

export default AvailabilityTemplate;
