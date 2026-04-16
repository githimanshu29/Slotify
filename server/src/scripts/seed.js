
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Service from '../models/Service.js';
import AvailabilityTemplate from '../models/AvailabilityTemplate.js';
import User from '../models/User.js';

// ── Service definitions ──
const services = [
  {
    name: 'Dentist',
    description: 'General dental checkup and cleaning',
    duration: 30,
  },
  {
    name: 'Massage',
    description: 'Relaxation and therapeutic massage',
    duration: 60,
  },
  {
    name: 'Physiotherapy',
    description: 'Physical therapy and rehabilitation',
    duration: 45,
  },
];

// ── Availability: Monday(1) through Friday(5) ──
const schedules = {
  Dentist: {
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
  },
  Massage: {
    days: [1, 2, 3, 4, 5, 6], // Mon-Sat
    startTime: '10:00',
    endTime: '20:00',
    slotDuration: 60,
  },
  Physiotherapy: {
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startTime: '08:00',
    endTime: '16:00',
    slotDuration: 45,
  },
};

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Starting seed...\n');

    // ── Clear existing data ──
    await Service.deleteMany({});
    await AvailabilityTemplate.deleteMany({});
    await User.deleteMany({});
    console.log('✓ Cleared existing services, templates, and users');

    // ── Create default users ──
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@slotify.com',
      password: 'admin123',
      role: 'admin',
    });

    const testUser = await User.create({
      name: 'Test User',
      email: 'test@slotify.com',
      password: 'test123',
      role: 'user',
    });

    console.log('✓ Created default users:');
    console.log(`  • Admin: admin@slotify.com / admin123 (role: ${adminUser.role})`);
    console.log(`  • User:  test@slotify.com / test123 (role: ${testUser.role})`);

    // ── Create services ──
    const createdServices = await Service.insertMany(services);
    console.log(`\n✓ Created ${createdServices.length} services:`);
    createdServices.forEach((s) => console.log(`  • ${s.name} (${s.duration}min slots)`));

    // ── Create availability templates ──
    const templates = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const svc of createdServices) {
      const schedule = schedules[svc.name];
      if (!schedule) continue;

      for (const day of schedule.days) {
        templates.push({
          serviceId: svc._id,
          dayOfWeek: day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDuration: schedule.slotDuration,
        });
      }
    }

    const createdTemplates = await AvailabilityTemplate.insertMany(templates);
    console.log(`\n✓ Created ${createdTemplates.length} availability templates:`);

    for (const svc of createdServices) {
      const schedule = schedules[svc.name];
      const dayList = schedule.days.map((d) => dayNames[d]).join(', ');
      console.log(
        `  • ${svc.name}: ${dayList} → ${schedule.startTime}–${schedule.endTime} (${schedule.slotDuration}min)`
      );
    }

    console.log('\n✅ Seed complete! Database is ready.\n');
    console.log('Quick start:');
    console.log('  1. npm run dev');
    console.log('  2. POST /api/auth/login with { email: "test@slotify.com", password: "test123" }');
    console.log('  3. Use the accessToken in Authorization: Bearer <token>');
    console.log('  4. POST /api/chat with { message: "Book dentist tomorrow at 10am" }\n');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
