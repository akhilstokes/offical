const scraper = require('./services/rubberBoardScraper');
const fs = require('fs');
const axios = require('axios');

async function test() {
  console.log('--- Testing Rubber Board Scraper ---');
  
  // Also try a direct fetch to see what we get
  try {
    const url = 'https://rubberboard.gov.in/public';
    console.log(`🔍 Direct fetch test for ${url}...`);
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync('fetched.html', resp.data);
    console.log('✅ Saved HTML to fetched.html');
  } catch (err) {
    console.log('❌ Direct fetch failed:', err.message);
  }

  try {
    const result = await scraper.getLatexRate(true);
    console.log('Result received. Writing to test-scraper-result.json...');
    fs.writeFileSync('test-scraper-result.json', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Scraper works! See test-scraper-result.json');
    } else {
      console.log('❌ Scraper failed:', result.error);
    }
  } catch (err) {
    console.error('💥 Error running test:', err);
  }
}

test();
