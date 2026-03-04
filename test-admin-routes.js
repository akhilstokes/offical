const http = require('http');

const routes = [
  '/admin/attendance',
  '/admin/worker-documents',
  '/admin/worker-schedule',
  '/admin/staff-management',
  '/admin/staff'
];

console.log('========================================');
console.log('Testing Admin Routes');
console.log('========================================\n');

function testRoute(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'text/html'
      }
    };

    const req = http.request(options, (res) => {
      const status = res.statusCode;
      const statusIcon = status === 200 ? '✅' : '❌';
      console.log(`${statusIcon} ${path} - Status: ${status}`);
      resolve({ path, status });
    });

    req.on('error', (error) => {
      console.log(`❌ ${path} - Error: ${error.message}`);
      resolve({ path, status: 'ERROR', error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${path} - Timeout`);
      resolve({ path, status: 'TIMEOUT' });
    });

    req.end();
  });
}

async function runTests() {
  const results = [];
  
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  
  const passed = results.filter(r => r.status === 200).length;
  const failed = results.filter(r => r.status !== 200).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All routes are working correctly!');
  } else {
    console.log('\n⚠️  Some routes are failing. Please run the fix script.');
    console.log('   Run: quick-fix-admin-routes.bat');
  }
  
  console.log('========================================\n');
}

// Check if server is running first
const checkServer = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 2000
}, (res) => {
  console.log('Server is running. Starting tests...\n');
  runTests();
});

checkServer.on('error', () => {
  console.log('❌ Server is not running on port 3000!');
  console.log('   Please start the application first.');
  console.log('   Run: start-dev-mode.bat or quick-fix-admin-routes.bat\n');
});

checkServer.end();
