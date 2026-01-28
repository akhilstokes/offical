// Test script to verify salary update endpoint
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function testSalaryUpdate() {
  console.log('🧪 Testing Salary Update Endpoint...\n');
  
  // You'll need to replace these with actual values
  const token = 'YOUR_AUTH_TOKEN_HERE'; // Get from localStorage in browser
  const userId = 'USER_ID_HERE'; // Get from the accountant user
  const newSalary = 700;
  
  try {
    console.log(`📤 Sending PATCH request to: ${API}/api/users/${userId}`);
    console.log(`📝 Payload: { dailySalary: ${newSalary} }\n`);
    
    const response = await fetch(`${API}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dailySalary: newSalary })
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Salary updated successfully');
      console.log(`💰 New daily salary: ₹${data.user?.dailySalary || 'not returned'}`);
    } else {
      console.log('\n❌ FAILED! Server returned an error');
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('💡 Make sure your server is running on', API);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  SALARY UPDATE ENDPOINT TEST');
console.log('═══════════════════════════════════════════════════════\n');
console.log('⚠️  INSTRUCTIONS:');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Console tab');
console.log('3. Type: localStorage.getItem("token")');
console.log('4. Copy the token value');
console.log('5. Find a user ID from the salaries page');
console.log('6. Update the token and userId variables in this script');
console.log('7. Run: node test-salary-update.js\n');
console.log('═══════════════════════════════════════════════════════\n');

// Uncomment to run (after adding token and userId)
// testSalaryUpdate();

console.log('⏸️  Script ready. Update token and userId, then uncomment the last line.');
