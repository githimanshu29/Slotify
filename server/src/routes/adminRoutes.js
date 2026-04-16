// ─────────────────────────────────────────────────────────────
//  Admin Routes
//  Double-protected: authMiddleware (JWT) + adminAuth (API key)
//
//  Both layers required:
//    1. Authorization: Bearer <accessToken>  → proves identity
//    2. x-admin-key: <ADMIN_KEY>             → proves admin access
//
//  Three resource groups:
//    /api/admin/appointments  — view + cancel bookings
//    /api/admin/services      — CRUD for service types
//    /api/admin/availability  — weekly schedule configuration
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
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

// ── All admin routes require JWT + admin key ──
router.use(authMiddleware);
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
