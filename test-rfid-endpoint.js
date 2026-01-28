const axios = require('axios');

// Test the RFID endpoint
async function testRFIDEndpoint() {
    const baseURL = 'http://10.208.100.39:5000';
    
    console.log('Testing RFID Attendance Endpoint...\n');
    
    // Test data
    const testData = {
        uid: 'TEST123',  // Replace with actual RFID UID from your database
        date: '08-01-2026',  // DD-MM-YYYY format
        time: '09:30:00'     // HH:MM:SS format
    };
    
    try {
        console.log('Sending request to:', `${baseURL}/api/attendance/rfid`);
        console.log('Request body:', JSON.stringify(testData, null, 2));
        console.log('\n---\n');
        
        const response = await axios.post(`${baseURL}/api/attendance/rfid`, testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERROR!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('No response received from server');
            console.log('Error:', error.message);
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Run the test
testRFIDEndpoint();
