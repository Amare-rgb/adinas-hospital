// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Adinas General Hospital Database...\n');

  // ============================================================
  // CLEAN EXISTING DATA (Order matters for foreign keys)
  // ============================================================
  console.log('🧹 Cleaning existing data...');
  
  try {
    await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.message.deleteMany(),
      prisma.vitalSign.deleteMany(),
      prisma.medicalNote.deleteMany(),
      prisma.prescription.deleteMany(),
      prisma.labTest.deleteMany(),
      prisma.surgery.deleteMany(),
      prisma.allergy.deleteMany(),
      prisma.immunization.deleteMany(),
      prisma.admission.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.appointment.deleteMany(),
      prisma.doctorAvailability.deleteMany(),
      prisma.workingHour.deleteMany(),
      prisma.pharmaOrder.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.contact.deleteMany(),
      prisma.news.deleteMany(),
      prisma.gallery.deleteMany(),
      prisma.service.deleteMany(),
      prisma.doctor.deleteMany(),
      prisma.staff.deleteMany(),
      prisma.patient.deleteMany(),
      prisma.user.deleteMany(),
      prisma.department.deleteMany(),
      prisma.bed.deleteMany(),
      prisma.room.deleteMany(),
      prisma.settings.deleteMany(),
    ]);
    console.log('✅ Database cleaned\n');
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.message);
  }

  // ============================================================
  // HASH PASSWORD
  // ============================================================
  const hashedPassword = await bcrypt.hash('Adinas@123', 10);

  // ============================================================
  // CREATE ONLY ADMIN USER - Using both firstName and lastName
  // ============================================================
  console.log('👤 Creating admin user...');
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'adinashospital@gmail.com',
      password: hashedPassword,
      firstName: 'System',      // Required field
      lastName: 'Administrator', // Required field
      phone: '+251-XXX-XXXX',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      location: 'Adinas General Hospital',
    },
  });

  console.log(`✅ Created ADMIN: adinashospital@gmail.com\n`);

  // ============================================================
  // CREATE SETTINGS
  // ============================================================
  console.log('⚙️ Creating settings...');

  await prisma.settings.create({
    data: {
      hospitalName: 'Adinas General Hospital',
      hospitalAddress: 'Addis Ababa, Ethiopia',
      hospitalPhone: '+251-XXX-XXXX',
      hospitalEmail: 'info@adinashospital.com',
      timezone: 'Africa/Nairobi',
      currency: 'ETB',
      clinicHours: 'Monday-Friday: 8:00 AM - 8:00 PM, Saturday: 8:00 AM - 5:00 PM',
      aboutText: 'Adinas General Hospital is a leading healthcare provider in Ethiopia.',
      missionText: 'To provide quality healthcare services to all.',
      visionText: 'To be the leading healthcare provider in Ethiopia.',
    },
  });
  console.log('✅ Created settings\n');

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('========================================');
  console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
  console.log('========================================\n');
  
  console.log('📊 Summary:');
  console.log(`   👤 Admin User: 1`);
  
  console.log('\n🔑 Login Credentials:');
  console.log('\n📧 ADMIN:');
  console.log(`   Email: adinashospital@gmail.com`);
  console.log(`   Password: Adinas@123`);
  console.log(`   Role: ADMIN`);
  
  console.log('\n========================================');
  console.log('✅ Database seed complete!');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    console.error('Error details:', e.message);
    if (e.meta) {
      console.error('Error meta:', e.meta);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });