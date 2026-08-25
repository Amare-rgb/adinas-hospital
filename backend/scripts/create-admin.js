// scripts/create-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // NEW CREDENTIALS
    const email = 'adinashospital@gmail.com';
    const password = 'Adinas@123';
    const firstName = 'System';
    const lastName = 'Administrator';

    console.log('🔧 Creating admin user...\n');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('✅ Admin already exists. Updating password...');
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          isActive: true,
          isEmailVerified: true,
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin password updated!');
    } else {
      console.log('📦 Creating new admin...');
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          firstName: firstName,
          lastName: lastName,
          phone: '+251-XXX-XXXX',
          role: 'ADMIN',
          isActive: true,
          isEmailVerified: true,
          location: 'Adinas General Hospital',
        }
      });
      console.log('✅ Admin created successfully!');
    }

    console.log('\n✅ Admin ready!');
    console.log('🔑 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ADMIN`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();