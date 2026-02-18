import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kiddies';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log('Skipping seed...');
      await mongoose.disconnect();
      return;
    }

    // Default admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@church.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'System';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Administrator';
    const adminPhone = process.env.ADMIN_PHONE || '08000000000';

    // Check if user with this email exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`User with email ${adminEmail} already exists. Updating to admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('User updated to admin role');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const admin = new User({
      email: adminEmail,
      password: adminPassword, // Will be hashed by the pre-save hook
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneNumber: adminPhone,
      role: 'admin',
      isActive: true,
    });

    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Name: ${adminFirstName} ${adminLastName}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed
seedAdmin();
