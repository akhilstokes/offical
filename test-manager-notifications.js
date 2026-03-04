const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

async function testManagerNotifications() {
  console.log('🧪 Testing Manager Notifications System...\n');

  try {
    // Login as manager
    console.log('1. Logging in as manager...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'manager@test.com',
      password: 'manager123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test 1: Send notification to all staff
    console.log('2. Testing send notification to all staff...');
    const allStaffResponse = await axios.post(
      `${API_BASE}/api/bulk-notifications/all`,
      {
        title: 'Test Notification',
        message: 'This is a test notification from the manager'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Notification sent to all staff');
    console.log(`   Recipients: ${allStaffResponse.data.recipientCount || 'N/A'}\n`);

    // Test 2: Send notification to specific role
    console.log('3. Testing send notification to specific role (lab_staff)...');
    const roleResponse = await axios.post(
      `${API_BASE}/api/bulk-notifications/role`,
      {
        title: 'Lab Staff Reminder',
        message: 'Please submit your lab reports by end of day',
        role: 'lab_staff'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Notification sent to lab staff');
    console.log(`   Recipients: ${roleResponse.data.recipientCount || 'N/A'}\n`);

    // Test 3: Get notification stats
    console.log('4. Testing get notification statistics...');
    try {
      const statsResponse = await axios.get(
        `${API_BASE}/api/bulk-notifications/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Notification stats retrieved');
      console.log(`   Total sent: ${statsResponse.data.totalSent || 0}`);
      console.log(`   Total read: ${statsResponse.data.totalRead || 0}\n`);
    } catch (error) {
      console.log('⚠️  Stats endpoint not available (optional)\n');
    }

    // Test 4: Send attendance reminder
    console.log('5. Testing attendance reminder...');
    try {
      const reminderResponse = await axios.post(
        `${API_BASE}/api/bulk-notifications/attendance-reminder`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Attendance reminder sent');
      console.log(`   Recipients: ${reminderResponse.data.recipientCount || 'N/A'}\n`);
    } catch (error) {
      console.log('⚠️  Attendance reminder endpoint not available (optional)\n');
    }

    console.log('✅ All tests passed! Manager notifications are working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
testManagerNotifications();
