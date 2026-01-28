const axios = require('axios');

/**
 * Test script to check Rubber Board API endpoints
 */
async function testRubberBoardAPI() {
  console.log('🧪 Testing Rubber Board API endpoints...\n');

  const endpoints = [
    'https://rubberboard.gov.in/api/rates/latex',
    'https://rubberboard.gov.in/api/public/rates',
    'https://api.rubberboard.gov.in/rates/latex',
    'https://rubberboard.org.in/api/rates',
    'https://rubberboard.gov.in/public', // Website (for comparison)
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint}`);
    console.log('─'.repeat(60));

    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📦 Content-Type: ${response.headers['content-type']}`);
      
      if (response.headers['content-type']?.includes('json')) {
        console.log('📄 Response (JSON):');
        console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
      } else {
        console.log('📄 Response (HTML/Text):');
        console.log(response.data.substring(0, 300) + '...');
      }

    } catch (error) {
      if (error.response) {
        console.log(`❌ Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`❌ Error: Endpoint not found (DNS resolution failed)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ Error: Request timeout`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n\n🔍 Testing with rubber board scraper service...\n');
  
  try {
    const { getLatexRate } = require('./server/services/rubberBoardScraper');
    const result = await getLatexRate(true); // Force refresh
    
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`\n✅ SUCCESS! Rate: ₹${result.rate}/100kg`);
      console.log(`📅 Date: ${result.date || 'Unknown'}`);
      console.log(`🔧 Method: ${result.method || 'Unknown'}`);
      console.log(`📍 Source: ${result.source}`);
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
    }
  } catch (error) {
    console.log(`\n❌ Error testing scraper: ${error.message}`);
  }
}

// Run the test
testRubberBoardAPI().then(() => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
