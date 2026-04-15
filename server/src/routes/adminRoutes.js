// ─────────────────────────────────────────────────────────────
//  Admin Routes
//  All routes protected by adminAuth middleware
//  Header required: x-admin-key: <ADMIN_KEY from .env>
//
//  Three resource groups:
//    /api/admin/appointments  — view + cancel bookings
//    /api/admin/services      — CRUD for service types
//    /api/admin/availability  — weekly schedule configuration
//
//  Step 8 of system design:
//    GET  /api/admin/appointments     → paginated list
//    GET  /api/admin/appointments/:id → single appointment
//    PATCH /api/admin/appointments/:id → cancel appointment
//    + services and availability CRUD
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  getAppointments,
  getAppointmentById,
  updateAppointment,
  getServices,
  createService,
  updateService,
  deleteService,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from '../controllers/adminController.js';

const router = Router();

// ── All admin routes require the x-admin-key header ──
router.use(adminAuth);

// ── Appointments ──
router.get('/appointments', getAppointments);
router.get('/appointments/:id', getAppointmentById);
router.patch('/appointments/:id', updateAppointment);

// ── Services ──
router.get('/services', getServices);
router.post('/services', createService);
router.patch('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// ── Availability Templates ──
router.get('/availability/:serviceId', getAvailability);
router.post('/availability', createAvailability);
router.put('/availability/:id', updateAvailability);
router.delete('/availability/:id', deleteAvailability);

export default router;
