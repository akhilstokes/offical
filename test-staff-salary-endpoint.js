const axios = require('axios');

const API = 'http://localhost:5000';

// Test staff credentials - replace with actual staff user
const testStaffLogin = {
  email: 'staff@test.com', // Replace with actual staff email
  password: 'password123'   // Replace with actual password
};

async function testStaffSalaryEndpoint() {
  try {
    console.log('🔐 Logging in as staff...');
    
    // Login to get token
    const loginRes = await axios.post(`${API}/api/auth/login`, testStaffLogin);
    const token = loginRes.data.token;
    const user = loginRes.data.user;
    
    console.log('✅ Logged in successfully');
    console.log('   User:', user.name);
    console.log('   Role:', user.role);
    console.log('   Email:', user.email);
    console.log('   Daily Salary:', user.dailySalary || 'Not set');
    console.log('');
    
    // Test /api/salary/my-salary endpoint
    console.log('📊 Fetching salary records...');
    const salaryRes = await axios.get(`${API}/api/salary/my-salary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Salary endpoint response:');
    console.log('   Success:', salaryRes.data.success);
    console.log('   Count:', salaryRes.data.count);
    console.log('   Daily Rate:', salaryRes.data.dailyRate);
    console.log('');
    
    if (salaryRes.data.data && salaryRes.data.data.length > 0) {
      console.log('📋 Salary Records:');
      salaryRes.data.data.forEach((record, index) => {
        console.log(`\n   Record ${index + 1}:`);
        console.log('   Month:', record.month);
        console.log('   Year:', record.year);
        console.log('   Gross Salary: ₹', record.grossSalary);
        console.log('   Total Deductions: ₹', record.totalDeductions);
        console.log('   Net Salary: ₹', record.netSalary);
        console.log('   Status:', record.status);
      });
    } else {
      console.log('⚠️  No salary records found for this staff member');
      console.log('   This is normal if no salary has been generated yet');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
console.log('='.repeat(60));
console.log('STAFF SALARY ENDPOINT TEST');
console.log('='.repeat(60));
console.log('');

testStaffSalaryEndpoint();
