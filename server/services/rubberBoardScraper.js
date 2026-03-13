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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://rubberboard.gov.in/'
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
 */
async function fetchFromWebsite() {
  const candidateUrls = [
    'https://rubberboard.gov.in/public',
    'https://rubberboard.org.in/public?lang=E',
    'https://rubberboard.org.in/public',
    'http://rubberboard.org.in/public'
  ];

  let html = null;
  let fetchedUrl = null;

  const requestWithRetries = async (url) => {
    const attempts = [8000, 12000];
    for (const timeout of attempts) {
      try {
        console.log(`🔍 Trying scraping URL: ${url} (timeout: ${timeout}ms)`);
        const response = await axios.get(url, {
          timeout,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          validateStatus: (s) => s >= 200 && s < 400
        });

        if (response.data && typeof response.data === 'string') {
          return response.data;
        }
      } catch (err) {
        console.log(`⚠️ Failed to fetch ${url}: ${err.message}`);
      }
    }
    return null;
  };

  for (const url of candidateUrls) {
    const data = await requestWithRetries(url);
    if (data) {
      html = data;
      fetchedUrl = url;
      break;
    }
  }

  if (!html) {
    console.log('❌ All candidate URLs failed for scraping');
    return { success: false, error: 'All URLs failed', rate: null };
  }

  try {
    const $ = cheerio.load(html);
    let latexRate = null;
    let rateDate = null;

    // More robust row finding
    let latexRow = null;
    $('tr').each((_, el) => {
      const text = $(el).text().trim();
      if (/latex\s*\(60\%?\)/i.test(text)) {
        latexRow = $(el);
        return false;
      }
    });

    if (latexRow) {
      const cells = latexRow.find('td,th').map((i, td) => $(td).text().trim()).get();
      const numeric = cells
        .map((t) => {
          const cleaned = t.replace(/[₹,]/g, '').trim();
          const match = cleaned.match(/-?\d+(?:\.\d+)?/);
          return match ? parseFloat(match[0]) : null;
        })
        .filter((v) => v !== null && v > 1000); // Usually > 1000 per 100kg

      if (numeric.length > 0) {
        latexRate = Math.max(...numeric);
      }
    }

    // Try to find the date
    const pageText = $('body').text();
    const dateMatch = pageText.match(/(\d{1,2}-\d{1,2}-\d{4})/);
    if (dateMatch) {
      rateDate = dateMatch[1];
    }

    if (latexRate) {
      console.log(`✅ Latex rate fetched via scraping: ₹${latexRate}/100kg (${rateDate || 'today'})`);
      return {
        success: true,
        rate: latexRate,
        date: rateDate,
        source: 'Rubber Board India',
        url: fetchedUrl,
        method: 'scraping'
      };
    }
    
    return { success: false, error: 'Latex rate not found in page structure', rate: null };
  } catch (error) {
    console.error('❌ Error parsing scraped data:', error.message);
    return { success: false, error: error.message, rate: null };
  }
}

/**
 * Fetch latex rate - tries API first, then falls back to scraping
 */
async function fetchLatexRate() {
  console.log('🔍 Starting latex rate fetch (CanaraPost only)...');

  // Always fetch from CanaraPost (rubber board sources are unreliable/expired)
  const canaraResult = await fetchFromCanaraPost();
  if (canaraResult && canaraResult.success) {
    return canaraResult;
  }

  console.log('⚠️ CanaraPost fetch failed; no source available');
  return {
    success: false,
    error: 'Unable to fetch latex rate from CanaraPost',
    rate: null
  };
}

/**
 * Fetch latex rate from CanaraPost rubber price listing.
 * This is a fallback when Rubber Board sources are unavailable.
 */
async function fetchFromCanaraPost() {
  const url = 'https://thecanarapost.com/todays-rubber-prices-kottayam-and-international-market/';

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    });

    if (!response.data || typeof response.data !== 'string') {
      return { success: false, error: 'CanaraPost response was not HTML', rate: null };
    }

    const $ = cheerio.load(response.data);

    // Find table row containing Latex 60% or Latex (60%)
    let latexRow = null;
    $('tr').each((_, el) => {
      const text = $(el).text().trim();
      if (/latex\s*\(?60%?\)?/i.test(text)) {
        latexRow = $(el);
        return false; // break
      }
    });

    if (!latexRow || latexRow.length === 0) {
      return { success: false, error: 'Latex row not found on CanaraPost page', rate: null };
    }

    const cells = latexRow.find('td,th').map((i, td) => $(td).text().trim()).get();

    const numeric = cells
      .map((t) => {
        const cleaned = t.replace(/[₹,]/g, '');
        const m = cleaned.match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
      })
      .filter((v) => v !== null && v > 1000);

    if (!numeric.length) {
      return { success: false, error: 'No numeric latex rate found on CanaraPost page', rate: null };
    }

    const rate = numeric[0];

    // Try to detect the date from page heading or text.
    let rateDate = null;
    const dateText = $('h1, h2, h3, p, span, div')
      .filter((_, el) => /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test($(el).text()))
      .first()
      .text();
    const dateMatch = dateText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/i);
    if (dateMatch) {
      rateDate = dateMatch[0];
    }

    return {
      success: true,
      rate,
      date: rateDate || null,
      source: 'CanaraPost',
      url,
      method: 'scraping'
    };
  } catch (error) {
    console.error('❌ Error fetching from CanaraPost:', error.message);
    return { success: false, error: error.message, rate: null };
  }
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
