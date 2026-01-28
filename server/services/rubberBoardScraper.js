const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch latex rate from Rubber Board API (if available)
 * Official API endpoint (if exists)
 */
async function fetchFromAPI() {
  try {
    // Try official Rubber Board API endpoints
    const apiEndpoints = [
      'https://rubberboard.gov.in/api/rates/latex',
      'https://rubberboard.gov.in/api/public/rates',
      'https://api.rubberboard.gov.in/rates/latex',
      'https://rubberboard.org.in/api/rates'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`🔍 Trying API endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 5000
        });

        if (response.data && response.status === 200) {
          console.log('✅ API response received:', JSON.stringify(response.data).substring(0, 200));
          
          // Try to extract rate from various possible response formats
          let rate = null;
          let date = null;

          // Format 1: { latex60: 13260, date: "20-01-2026" }
          if (response.data.latex60) {
            rate = parseFloat(response.data.latex60);
            date = response.data.date || response.data.asOnDate;
          }
          // Format 2: { rate: 13260, product: "latex60", date: "..." }
          else if (response.data.rate) {
            rate = parseFloat(response.data.rate);
            date = response.data.date || response.data.asOnDate;
          }
          // Format 3: { data: { latex60: 13260 } }
          else if (response.data.data && response.data.data.latex60) {
            rate = parseFloat(response.data.data.latex60);
            date = response.data.data.date || response.data.date;
          }
          // Format 4: Array of rates
          else if (Array.isArray(response.data) && response.data.length > 0) {
            const latexItem = response.data.find(item => 
              item.product === 'latex60' || item.name === 'Latex(60%)'
            );
            if (latexItem) {
              rate = parseFloat(latexItem.rate || latexItem.value);
              date = latexItem.date || latexItem.asOnDate;
            }
          }

          if (rate && rate > 1000) { // Validate it's a reasonable rate
            console.log(`✅ Latex rate from API: ₹${rate}/100kg (Date: ${date || 'Unknown'})`);
            return {
              success: true,
              rate: rate,
              date: date,
              source: 'Rubber Board API',
              url: endpoint,
              method: 'api'
            };
          }
        }
      } catch (err) {
        // Continue to next endpoint
        console.log(`⚠️ API endpoint failed: ${endpoint}`);
      }
    }

    return null; // No API worked
  } catch (error) {
    console.error('❌ Error fetching from API:', error.message);
    return null;
  }
}

/**
 * Fetch daily latex rate from Rubber Board website (fallback scraping)
 * URL: https://rubberboard.gov.in/public
 */
async function fetchFromWebsite() {
  try {
    console.log('🔍 Fetching latex rate from Rubber Board website...');
    
    const response = await axios.get('https://rubberboard.gov.in/public', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Find the Latex(60%) rate from the domestic market table
    let latexRate = null;
    let rateDate = null;

    // Look for the table with domestic market rates
    $('table').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const category = $(cells[0]).text().trim();
          
          // Check if this row contains Latex(60%)
          if (category.includes('Latex') && category.includes('60')) {
            const rateText = $(cells[1]).text().trim();
            // Extract number from rate (e.g., "▲ 13210.0" -> 13210.0)
            const match = rateText.match(/[\d.]+/);
            if (match) {
              latexRate = parseFloat(match[0]);
            }
          }
        }
      });
    });

    // Try to find the date
    const dateText = $('body').text();
    const dateMatch = dateText.match(/(\d{2}-\d{2}-\d{4})/);
    if (dateMatch) {
      rateDate = dateMatch[1];
    }

    if (latexRate) {
      console.log(`✅ Latex rate fetched: ₹${latexRate}/100kg (Date: ${rateDate || 'Unknown'})`);
      return {
        success: true,
        rate: latexRate,
        date: rateDate,
        source: 'Rubber Board India',
        url: 'https://rubberboard.gov.in/public',
        method: 'scraping'
      };
    } else {
      console.log('⚠️ Could not find latex rate in the page');
      return {
        success: false,
        error: 'Latex rate not found in page',
        rate: null
      };
    }

  } catch (error) {
    console.error('❌ Error fetching latex rate:', error.message);
    return {
      success: false,
      error: error.message,
      rate: null
    };
  }
}

/**
 * Fetch latex rate - tries API first, then falls back to scraping
 */
async function fetchLatexRate() {
  console.log('🔍 Starting latex rate fetch...');
  
  // Try API first
  const apiResult = await fetchFromAPI();
  if (apiResult && apiResult.success) {
    return apiResult;
  }

  console.log('⚠️ API fetch failed, falling back to website scraping...');
  
  // Fallback to scraping
  const scrapingResult = await fetchFromWebsite();
  return scrapingResult;
}

/**
 * Get cached rate or fetch new one
 */
let cachedRate = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getLatexRate(forceRefresh = false) {
  const now = Date.now();
  
  // Return cached rate if available and not expired
  if (!forceRefresh && cachedRate && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    console.log('📦 Returning cached latex rate');
    return {
      ...cachedRate,
      cached: true,
      cacheAge: Math.floor((now - cacheTime) / 1000) // seconds
    };
  }

  // Fetch new rate
  const result = await fetchLatexRate();
  
  if (result.success) {
    cachedRate = result;
    cacheTime = now;
  }

  return {
    ...result,
    cached: false
  };
}

module.exports = {
  fetchLatexRate,
  getLatexRate,
  fetchFromAPI,
  fetchFromWebsite
};
