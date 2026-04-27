import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123098123098';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existing = await usersCollection.findOne({ username: ADMIN_USERNAME });

    if (existing) {
      // Update to ensure isAdmin is true and email is correct
      await usersCollection.updateOne(
        { username: ADMIN_USERNAME },
        { $set: { isAdmin: true, email: ADMIN_EMAIL } }
      );
      console.log('🔑 Admin user already exists — updated isAdmin=true and email');
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      await usersCollection.insertOne({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        isAdmin: true,
        avatar: '#FF3B30',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('🔑 Admin user created successfully!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   isAdmin:  true\n`);

    await mongoose.disconnect();
    console.log('✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
