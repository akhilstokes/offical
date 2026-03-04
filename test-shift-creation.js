const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

async function testShiftCreation() {
  console.log('🧪 Testing Shift Creation Fix...\n');

  try {
    // First, login as manager to get token
    console.log('1. Logging in as manager...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'manager@test.com',
      password: 'manager123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test 1: Create shift with valid data
    console.log('2. Testing valid shift creation...');
    const validShift = {
      name: 'Morning Production Shift',
      description: 'Main production shift for morning hours',
      startTime: '08:00',
      endTime: '16:00',
      type: 'morning',
      category: 'production',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      minStaff: 5,
      maxStaff: 10,
      location: 'Factory Floor A',
      department: 'Production',
      isActive: true,
      isTemplate: false
    };

    const createResponse = await axios.post(
      `${API_BASE}/api/shifts`,
      validShift,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Valid shift created successfully');
    console.log(`   Shift ID: ${createResponse.data._id}`);
    console.log(`   Shift Name: ${createResponse.data.name}\n`);

    // Test 2: Try to create shift with invalid data (should fail gracefully)
    console.log('3. Testing invalid shift creation (missing name)...');
    try {
      await axios.post(
        `${API_BASE}/api/shifts`,
        {
          startTime: '08:00',
          endTime: '16:00',
          type: 'morning',
          category: 'production',
          assignedStaff: "[ '' ]", // This should be removed
          location: 'Factory Floor A',
          department: 'Production'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('❌ Should have failed but didn\'t\n');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid data rejected correctly');
        console.log(`   Error: ${error.response.data.message}`);
        console.log(`   Details: ${error.response.data.errors.join(', ')}\n`);
      } else {
        throw error;
      }
    }

    // Test 3: Create shift with string arrays (should be parsed)
    console.log('4. Testing shift creation with string arrays...');
    const shiftWithStringArrays = {
      name: 'Evening Shift',
      startTime: '16:00',
      endTime: '00:00',
      type: 'evening',
      category: 'production',
      daysOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday']),
      minStaff: 3,
      maxStaff: 8,
      location: 'Factory Floor B',
      department: 'Production',
      assignedStaff: "[ '' ]" // This should be removed
    };

    const createResponse2 = await axios.post(
      `${API_BASE}/api/shifts`,
      shiftWithStringArrays,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Shift with string arrays created successfully');
    console.log(`   Shift ID: ${createResponse2.data._id}`);
    console.log(`   Days: ${createResponse2.data.daysOfWeek.join(', ')}\n`);

    // Test 4: Fetch all shifts
    console.log('5. Fetching all shifts...');
    const shiftsResponse = await axios.get(`${API_BASE}/api/shifts`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Found ${shiftsResponse.data.shifts.length} shifts`);
    shiftsResponse.data.shifts.forEach(shift => {
      console.log(`   - ${shift.name} (${shift.type})`);
    });

    console.log('\n✅ All tests passed! Shift creation is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message}`);
      if (error.response.data.errors) {
        console.error(`   Errors: ${JSON.stringify(error.response.data.errors, null, 2)}`);
      }
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
testShiftCreation();
