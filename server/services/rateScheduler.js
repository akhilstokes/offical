const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');
const Rate = require('../models/rateModel');
const RateHistory = require('../models/RateHistory');

class RateScheduler {
  constructor() {
    this.isRunning = false;
    this.lastFetchTime = null;
    this.fetchCount = 0;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Rate scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting rate scheduler...');

    // Schedule daily rate fetch at 9:00 AM IST
    cron.schedule('0 9 * * *', async () => {
      console.log('Running scheduled rate fetch...');
      await this.fetchAndStoreRates();
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Schedule hourly rate fetch during business hours (8 AM to 6 PM IST)
    cron.schedule('0 8-18 * * *', async () => {
      console.log('Running hourly rate fetch...');
      await this.fetchAndStoreRates();
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Initial fetch on startup
    setTimeout(() => {
      this.fetchAndStoreRates();
    }, 5000); // Wait 5 seconds after startup

    console.log('Rate scheduler started successfully');
  }

  // Stop the scheduler
  stop() {
    this.isRunning = false;
    console.log('Rate scheduler stopped');
  }

  // Fetch rates from rubber board and store in database
  async fetchAndStoreRates() {
    try {
      console.log('Fetching rates from rubber board...');
      const rates = await this.fetchRubberBoardRates();

      if (rates && rates.length > 0) {
        await this.storeRates(rates);
        this.fetchCount++;
        this.lastFetchTime = new Date();
        console.log(`Successfully fetched and stored ${rates.length} rates`);
      } else {
        console.log('No rates fetched from rubber board');
        // As a fallback, use last known rates so downstream features have a value
        const fallback = await this.getLastKnownRates();
        if (fallback.length > 0) {
          console.log(`Using ${fallback.length} last-known rate(s) as fallback`);
          await this.storeRates(fallback);
        }
      }
    } catch (error) {
      console.error('Error in scheduled rate fetch:', error);
      // Fail-safe: try to store last known rates to avoid gaps
      try {
        const fallback = await this.getLastKnownRates();
        if (fallback.length > 0) {
          console.log(`Stored ${fallback.length} last-known rate(s) after failure`);
          await this.storeRates(fallback);
        }
      } catch { }
    }
  }

  // Fetch rates from rubber board website
  async fetchRubberBoardRates() {
    const candidateUrls = [
      'https://rubberboard.gov.in',
      'https://rubberboard.org.in/public?lang=E',
      'https://rubberboard.org.in/public',
      'http://rubberboard.org.in/public'
    ];

    let html = null;
    let fetchedUrl = null;

    const requestWithRetries = async (url) => {
      const attempts = [10000, 15000]; // Reduce timeouts to fail faster
      for (let i = 0; i < attempts.length; i++) {
        try {
          const response = await axios.get(url, {
            timeout: attempts[i],
            maxRedirects: 2,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            validateStatus: (s) => s >= 200 && s < 400
          });
          if (typeof response.data === 'string') {
            return response.data;
          }
        } catch (e) {
          // Silently catch error to prevent log spam when site blocks bots
        }
      }
      return null;
    };

    // Try multiple possible URLs with retries
    for (const url of candidateUrls) {
      const data = await requestWithRetries(url);
      if (data) {
        html = data;
        fetchedUrl = url;
        break;
      }
    }

    if (!html) {
      // Provide a clean generic message without spamming all candidate failures
      console.log('Unable to reach Rubber Board (WAF/Timeout). Falling back to last-known rates.');
      return [];
    }

    const $ = cheerio.load(html);
    const rates = [];

    // Look for latex rates in tables
    $('tr').each((_, el) => {
      const text = $(el).text().trim();

      // Check for latex 60% rate
      if (/latex\s*\(60\%?\)/i.test(text)) {
        const cells = $(el).find('td,th').map((i, td) => $(td).text().trim()).get();
        const numeric = cells
          .map((t) => {
            const cleaned = t.replace(/[₹,]/g, '');
            const match = cleaned.match(/-?\d+(?:\.\d+)?/);
            return match ? parseFloat(match[0]) : null;
          })
          .filter((v) => v !== null && v > 0);

        if (numeric.length > 0) {
          rates.push({
            product: 'latex60',
            rate: Math.max(...numeric), // Take the highest rate found
            source: 'rubber_board',
            effectiveDate: new Date(),
            fetchedFrom: fetchedUrl
          });
        }
      }

      // Check for other rubber products
      if (/rubber\s*sheet/i.test(text)) {
        const cells = $(el).find('td,th').map((i, td) => $(td).text().trim()).get();
        const numeric = cells
          .map((t) => {
            const cleaned = t.replace(/[₹,]/g, '');
            const match = cleaned.match(/-?\d+(?:\.\d+)?/);
            return match ? parseFloat(match[0]) : null;
          })
          .filter((v) => v !== null && v > 0);

        if (numeric.length > 0) {
          rates.push({
            product: 'rubber_sheet',
            rate: Math.max(...numeric),
            source: 'rubber_board',
            effectiveDate: new Date(),
            fetchedFrom: fetchedUrl
          });
        }
      }
    });

    return rates;
  }

  // Fallback: get last known rates and mark as cached for today
  async getLastKnownRates() {
    try {
      const products = ['latex60', 'rubber_sheet'];
      const results = [];
      for (const product of products) {
        const last = await Rate.findOne({ product }).sort({ effectiveDate: -1 });
        if (last && last.rate > 0) {
          results.push({
            product,
            rate: last.rate,
            source: 'cache_last_known',
            effectiveDate: new Date(),
            fetchedFrom: last.fetchedFrom || 'cache'
          });
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  // Store rates in database
  async storeRates(rates) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const rateData of rates) {
      try {
        // Check if rate already exists for today
        const existingRate = await Rate.findOne({
          product: rateData.product,
          source: rateData.source,
          effectiveDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingRate) {
          // Update existing rate
          existingRate.rate = rateData.rate;
          existingRate.fetchedFrom = rateData.fetchedFrom;
          existingRate.updatedAt = new Date();
          await existingRate.save();
          console.log(`Updated rate for ${rateData.product}: ₹${rateData.rate}`);
        } else {
          // Create new rate
          const newRate = new Rate({
            product: rateData.product,
            rate: rateData.rate,
            source: rateData.source,
            effectiveDate: rateData.effectiveDate,
            fetchedFrom: rateData.fetchedFrom
          });
          await newRate.save();
          console.log(`Created new rate for ${rateData.product}: ₹${rateData.rate}`);
        }

        // Also store in rate history
        const rateHistory = new RateHistory({
          userId: null, // System generated
          rateType: rateData.product,
          rateValue: rateData.rate,
          effectiveDate: rateData.effectiveDate,
          updatedBy: null, // System generated
          source: rateData.source,
          fetchedFrom: rateData.fetchedFrom
        });
        await rateHistory.save();

      } catch (error) {
        console.error(`Error storing rate for ${rateData.product}:`, error);
      }
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastFetchTime: this.lastFetchTime,
      fetchCount: this.fetchCount
    };
  }

  // Manual trigger for rate fetch
  async triggerFetch() {
    console.log('Manual rate fetch triggered');
    await this.fetchAndStoreRates();
  }
}

// Create singleton instance
const rateScheduler = new RateScheduler();

module.exports = rateScheduler;


