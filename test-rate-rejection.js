const axios = require('axios');

async function testRateRejection() {
  try {
    // First, login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Get pending rates
    console.log('\nFetching pending rates...');
    const pendingResponse = await axios.get('http://localhost:5000/api/rates/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Pending rates:', JSON.stringify(pendingResponse.data, null, 2));
    
    if (pendingResponse.data.data && pendingResponse.data.data.length > 0) {
      const rateId = pendingResponse.data.data[0]._id;
      console.log(`\nAttempting to reject rate: ${rateId}`);
      
      // Try to reject the first pending rate
      const rejectResponse = await axios.put(
        `http://localhost:5000/api/rates/reject/${rateId}`,
        { reason: 'Test rejection' },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Rejection successful:', JSON.stringify(rejectResponse.data, null, 2));
    } else {
      console.log('No pending rates to reject');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testRateRejection();
