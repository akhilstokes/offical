// Quick test to check if chemical routes are working
const API = 'http://localhost:5000';

async function testRoutes() {
  console.log('Testing chemical routes...\n');
  
  // Test 1: Check if /api/chemicals is accessible
  try {
    const res1 = await fetch(`${API}/api/chemicals`);
    console.log('✓ /api/chemicals:', res1.status, res1.statusText);
  } catch (e) {
    console.log('✗ /api/chemicals:', e.message);
  }
  
  // Test 2: Check if /api/chem-requests is accessible
  try {
    const res2 = await fetch(`${API}/api/chem-requests/catalog`);
    console.log('✓ /api/chem-requests/catalog:', res2.status, res2.statusText);
  } catch (e) {
    console.log('✗ /api/chem-requests/catalog:', e.message);
  }
  
  // Test 3: Check if /api/chem-requests/admin/verified is accessible
  try {
    const res3 = await fetch(`${API}/api/chem-requests/admin/verified`);
    console.log('✓ /api/chem-requests/admin/verified:', res3.status, res3.statusText);
  } catch (e) {
    console.log('✗ /api/chem-requests/admin/verified:', e.message);
  }
  
  // Test 4: Check if /api/chem-requests/admin/history is accessible
  try {
    const res4 = await fetch(`${API}/api/chem-requests/admin/history`);
    console.log('✓ /api/chem-requests/admin/history:', res4.status, res4.statusText);
  } catch (e) {
    console.log('✗ /api/chem-requests/admin/history:', e.message);
  }
}

testRoutes();
