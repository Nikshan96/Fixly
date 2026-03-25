const { User } = require('./models');

async function resetPassword() {
  try {
    const admin = await User.findOne({ where: { role: 'admin' } });
    
    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    const newPassword = 'Admin@123';
    admin.password = newPassword;
    await admin.save();
    
    console.log('✅ Password reset successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 New Password: Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPassword();