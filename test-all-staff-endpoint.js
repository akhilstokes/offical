// Quick test to verify the /api/users/all-staff endpoint
// This simulates what the frontend is doing

const http = require('http');

// Test without authentication first to see the error
function testEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/all-staff',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Testing GET /api/users/all-staff');
  console.log('='.repeat(60));

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);
    console.log('Headers:', res.headers);
    console.log('='.repeat(60));

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:');
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(data);
      }
      
      if (res.statusCode === 401) {
        console.log('\n✅ Good! Endpoint requires authentication (401)');
        console.log('This means the route is working correctly.');
        console.log('\nThe 400 error in browser might be from:');
        console.log('1. Expired/invalid token');
        console.log('2. Missing Authorization header');
        console.log('3. Server not restarted after route changes');
      } else if (res.statusCode === 400) {
        console.log('\n❌ 400 Bad Request - This is the problem!');
        console.log('The route might still be matching /:id instead of /all-staff');
      } else if (res.statusCode === 200) {
        console.log('\n⚠️  Warning: Endpoint returned 200 without auth');
        console.log('This should require authentication!');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
  });

  req.end();
}

testEndpoint();
