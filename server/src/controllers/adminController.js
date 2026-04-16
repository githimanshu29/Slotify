

import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import AvailabilityTemplate from '../models/AvailabilityTemplate.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import logger from '../utils/Logger.js';

// ═══════════════════════════════════════════════════════════
//  APPOINTMENTS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/admin/appointments
 * List all appointments — paginated, filterable by status/date/service
 *
 * Query params:
 *   page (default 1), limit (default 20)
 *   status: CONFIRMED | CANCELLED
 *   date: ISO date string (filter by specific day)
 *   serviceId: filter by service
 */
export async function getAppointments(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      date,
      serviceId,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (serviceId) filter.serviceId = serviceId;
    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      filter.bookedFor = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('serviceId', 'name')
        .sort({ bookedFor: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get appointments error', { error: error.message });
    return sendError(res, 'Failed to fetch appointments');
  }
}

/**
 * GET /api/admin/appointments/:id
 */
export async function getAppointmentById(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('serviceId', 'name duration');

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    return sendSuccess(res, appointment);
  } catch (error) {
    logger.error('Get appointment error', { error: error.message });
    return sendError(res, 'Failed to fetch appointment');
  }
}

/**
 * PATCH /api/admin/appointments/:id
 * Update appointment status (primarily for cancellation)
 * Body: { status: "CANCELLED" }
 */
export async function updateAppointment(req, res) {
  try {
    const { status } = req.body;

    if (!status || !['CONFIRMED', 'CANCELLED'].includes(status)) {
      return sendError(res, 'Invalid status. Must be CONFIRMED or CANCELLED', 400);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('serviceId', 'name');

    if (!appointment) {
      return sendError(res, 'Appointment not found', 404);
    }

    logger.info('Appointment updated by admin', {
      id: appointment._id,
      refCode: appointment.refCode,
      status,
    });

    return sendSuccess(res, appointment);
  } catch (error) {
    logger.error('Update appointment error', { error: error.message });
    return sendError(res, 'Failed to update appointment');
  }
}

// ═══════════════════════════════════════════════════════════
//  SERVICES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/admin/services
 * List all services (including inactive)
 */
export async function getServices(req, res) {
  try {
    const services = await Service.find().sort({ name: 1 });
    return sendSuccess(res, services);
  } catch (error) {
    logger.error('Get services error', { error: error.message });
    return sendError(res, 'Failed to fetch services');
  }
}

/**
 * POST /api/admin/services
 * Create a new service
 * Body: { name: "Dentist", description: "...", duration: 30 }
 */
export async function createService(req, res) {
  try {
    const { name, description, duration } = req.body;

    if (!name) {
      return sendError(res, 'Service name is required', 400);
    }

    // Check for duplicate name
    const existing = await Service.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return sendError(res, `Service "${name}" already exists`, 409);
    }

    const service = await Service.create({
      name,
      description: description || '',
      duration: duration || 30,
    });

    logger.info('Service created by admin', { name: service.name, id: service._id });

    return sendSuccess(res, service, 201);
  } catch (error) {
    logger.error('Create service error', { error: error.message });
    return sendError(res, 'Failed to create service');
  }
}

/**
 * PATCH /api/admin/services/:id
 * Update a service
 * Body: { name?, description?, duration?, isActive? }
 */
export async function updateService(req, res) {
  try {
    const updates = {};
    const { name, description, duration, isActive } = req.body;

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duration = duration;
    if (isActive !== undefined) updates.isActive = isActive;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!service) {
      return sendError(res, 'Service not found', 404);
    }

    logger.info('Service updated by admin', { id: service._id, updates });

    return sendSuccess(res, service);
  } catch (error) {
    logger.error('Update service error', { error: error.message });
    return sendError(res, 'Failed to update service');
  }
}

/**
 * DELETE /api/admin/services/:id
 * Soft-delete (sets isActive = false)
 * Existing appointments are NOT affected
 */
export async function deleteService(req, res) {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return sendError(res, 'Service not found', 404);
    }

    logger.info('Service deactivated by admin', { id: service._id, name: service.name });

    return sendSuccess(res, { message: `Service "${service.name}" deactivated` });
  } catch (error) {
    logger.error('Delete service error', { error: error.message });
    return sendError(res, 'Failed to delete service');
  }
}

// ═══════════════════════════════════════════════════════════
//  AVAILABILITY TEMPLATES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/admin/availability/:serviceId
 * Get all availability templates for a service (one per day of week)
 */
export async function getAvailability(req, res) {
  try {
    const templates = await AvailabilityTemplate.find({
      serviceId: req.params.serviceId,
    })
      .populate('serviceId', 'name')
      .sort({ dayOfWeek: 1 });

    return sendSuccess(res, templates);
  } catch (error) {
    logger.error('Get availability error', { error: error.message });
    return sendError(res, 'Failed to fetch availability');
  }
}

/**
 * POST /api/admin/availability
 * Create an availability template
 * Body: { serviceId, dayOfWeek, startTime, endTime, slotDuration }
 */
export async function createAvailability(req, res) {
  try {
    const { serviceId, dayOfWeek, startTime, endTime, slotDuration } = req.body;

    if (!serviceId || dayOfWeek === undefined || !startTime || !endTime) {
      return sendError(res, 'serviceId, dayOfWeek, startTime, and endTime are required', 400);
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return sendError(res, 'Service not found', 404);
    }

    // Check for duplicate (same service + same day)
    const existing = await AvailabilityTemplate.findOne({ serviceId, dayOfWeek });
    if (existing) {
      return sendError(
        res,
        `Availability already configured for ${service.name} on day ${dayOfWeek}. Use PUT to update.`,
        409
      );
    }

    const template = await AvailabilityTemplate.create({
      serviceId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration: slotDuration || 30,
    });

    logger.info('Availability template created', {
      service: service.name,
      dayOfWeek,
      startTime,
      endTime,
    });

    return sendSuccess(res, template, 201);
  } catch (error) {
    logger.error('Create availability error', { error: error.message });
    return sendError(res, 'Failed to create availability template');
  }
}

/**
 * PUT /api/admin/availability/:id
 * Update an existing availability template
 */
export async function updateAvailability(req, res) {
  try {
    const updates = {};
    const { startTime, endTime, slotDuration } = req.body;

    if (startTime) updates.startTime = startTime;
    if (endTime) updates.endTime = endTime;
    if (slotDuration) updates.slotDuration = slotDuration;

    const template = await AvailabilityTemplate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!template) {
      return sendError(res, 'Availability template not found', 404);
    }

    return sendSuccess(res, template);
  } catch (error) {
    logger.error('Update availability error', { error: error.message });
    return sendError(res, 'Failed to update availability template');
  }
}

/**
 * DELETE /api/admin/availability/:id
 * Delete an availability template (hard delete — no bookings reference this)
 */
export async function deleteAvailability(req, res) {
  try {
    const template = await AvailabilityTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return sendError(res, 'Availability template not found', 404);
    }

    return sendSuccess(res, { message: 'Availability template deleted' });
  } catch (error) {
    logger.error('Delete availability error', { error: error.message });
    return sendError(res, 'Failed to delete availability template');
  }
}
