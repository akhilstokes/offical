const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test credentials
const DELIVERY_STAFF = {
  email: 'jojo2001p@gmail.com',
  password: 'jojo123'
};

const LAB_STAFF = {
  email: 'akhil@gmail.com',
  password: 'akhil123'
};

async function testDeliveryToLabFlow() {
  console.log('=== Testing Delivery to Lab Workflow ===\n');

  try {
    // Step 1: Login as delivery staff
    console.log('1. Logging in as delivery staff...');
    const deliveryLogin = await axios.post(`${API_BASE}/api/auth/login`, DELIVERY_STAFF);
    const deliveryToken = deliveryLogin.data.token;
    console.log('✓ Delivery staff logged in\n');

    // Step 2: Get assigned sell requests
    console.log('2. Fetching assigned sell requests...');
    const assignedRes = await axios.get(`${API_BASE}/api/sell-requests/assigned-for-delivery`, {
      headers: { Authorization: `Bearer ${deliveryToken}` }
    });
    const assigned = assignedRes.data.records || [];
    console.log(`✓ Found ${assigned.length} assigned requests\n`);

    if (assigned.length === 0) {
      console.log('⚠ No assigned requests to test with');
      return;
    }

    // Step 3: Mark first request as delivered to lab
    const testRequest = assigned[0];
    console.log(`3. Marking request ${testRequest._id} as delivered to lab...`);
    console.log(`   Customer: ${testRequest.farmerId?.name || 'Unknown'}`);
    console.log(`   Status: ${testRequest.status}`);
    
    const deliverRes = await axios.put(
      `${API_BASE}/api/sell-requests/${testRequest._id}/delivered-to-lab`,
      {},
      { headers: { Authorization: `Bearer ${deliveryToken}` } }
    );
    
    console.log('✓ Marked as delivered to lab');
    console.log(`   New status: ${deliverRes.data.request.status}`);
    console.log(`   Intake ID created: ${deliverRes.data.intakeId}\n`);

    // Step 4: Login as lab staff
    console.log('4. Logging in as lab staff...');
    const labLogin = await axios.post(`${API_BASE}/api/auth/login`, LAB_STAFF);
    const labToken = labLogin.data.token;
    console.log('✓ Lab staff logged in\n');

    // Step 5: Check lab incoming requests
    console.log('5. Checking lab incoming requests...');
    const labRes = await axios.get(`${API_BASE}/api/delivery/barrels/intake/lab-pending?status=pending`, {
      headers: { Authorization: `Bearer ${labToken}` }
    });
    
    const labRequests = labRes.data.items || labRes.data || [];
    console.log(`✓ Found ${labRequests.length} incoming requests in lab dashboard\n`);

    // Find the request we just created
    const foundRequest = labRequests.find(r => r.requestId === String(testRequest._id));
    if (foundRequest) {
      console.log('✅ SUCCESS! Request appears in lab dashboard:');
      console.log(`   Customer: ${foundRequest.name}`);
      console.log(`   Phone: ${foundRequest.phone}`);
      console.log(`   Barrel Count: ${foundRequest.barrelCount}`);
      console.log(`   Status: ${foundRequest.status}`);
      console.log(`   Request ID: ${foundRequest.requestId}`);
    } else {
      console.log('❌ FAILED: Request not found in lab dashboard');
      console.log('Lab requests:', labRequests.map(r => ({
        id: r._id,
        requestId: r.requestId,
        name: r.name,
        status: r.status
      })));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDeliveryToLabFlow();
