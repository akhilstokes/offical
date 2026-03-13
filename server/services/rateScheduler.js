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

    // Schedule daily rate fetch at 4:00 PM IST (Kottayam market updates at 4 PM)
    cron.schedule('0 16 * * *', async () => {
      console.log('Running scheduled daily rate fetch (4 PM IST)...');
      await this.fetchAndStoreRates();
    }, {
      timezone: 'Asia/Kolkata'
    });

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
    const scraper = require('./rubberBoardScraper');
    const result = await scraper.getLatexRate(true); // force refresh for scheduler
    
    if (result.success) {
      return [{
        product: 'latex60',
        rate: result.rate,
        source: 'rubber_board',
        effectiveDate: new Date(),
        fetchedFrom: result.url
      }];
    }
    
    return [];
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


