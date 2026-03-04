const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminNotifications() {
  console.log('Testing Admin Notifications System...\n');
  
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@hfp.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✓ Admin logged in successfully\n');
    
    // 2. Test broadcast notification
    console.log('2. Testing broadcast notification...');
    const broadcastRes = await axios.post(
      `${BASE_URL}/api/notifications/broadcast`,
      {
        targetRole: 'staff',
        title: 'Test Notification',
        message: 'This is a test broadcast notification from admin',
        priority: 'normal'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✓ Broadcast sent successfully');
    console.log(`  - Sent to ${broadcastRes.data.count} user(s)\n`);
    
    // 3. Test broadcast to all users
    console.log('3. Testing broadcast to all users...');
    const allBroadcastRes = await axios.post(
      `${BASE_URL}/api/notifications/broadcast`,
      {
        targetRole: 'all',
        title: 'System Announcement',
        message: 'This is a system-wide announcement',
        priority: 'high'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✓ System-wide broadcast sent successfully');
    console.log(`  - Sent to ${allBroadcastRes.data.count} user(s)\n`);
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAdminNotifications();
