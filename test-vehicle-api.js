// Test the vehicle API endpoints
// Run this after logging in as admin to get a token

const API_URL = 'http://localhost:5000';

async function testStaffEndpoint() {
  console.log('Testing /api/users/all-staff endpoint...\n');
  
  // You need to replace this with a real token from localStorage after logging in
  const token = 'YOUR_TOKEN_HERE';
  
  if (token === 'YOUR_TOKEN_HERE') {
    console.log('❌ Please update the token in this script first!');
    console.log('\nHow to get token:');
    console.log('1. Open browser and login as admin');
    console.log('2. Open DevTools (F12) → Console');
    console.log('3. Type: localStorage.getItem("token")');
    console.log('4. Copy the token and paste it in this script');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/users/all-staff`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.staff) {
      const deliveryStaff = data.staff.filter(s => 
        s.role === 'delivery_staff' || 
        s.role === 'delivery' ||
        s.role?.toLowerCase().includes('delivery')
      );
      
      console.log(`\n✅ Found ${deliveryStaff.length} delivery staff:`);
      deliveryStaff.forEach(s => {
        console.log(`  - ${s.name} (${s.email})`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStaffEndpoint();
