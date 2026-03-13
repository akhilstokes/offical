const Rate = require("../models/rateModel");
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');

const ifValidId = (v) => (mongoose.Types.ObjectId.isValid(v) ? v : undefined);

// Manager/Admin: Propose a new rate (goes to pending). Admin can later verify to publish
// @route POST /api/rates/update (back-compat) or /api/rates/propose
// body: { companyRate: number, marketRate: number, effectiveDate?: 'YYYY-MM-DD', product?: 'latex60', notes?: string }
exports.updateRate = async (req, res) => {
  try {
    const { marketRate, companyRate, source, effectiveDate, product, notes } = req.body;

    if (marketRate == null || companyRate == null) {
      return res.status(400).json({ message: "Both marketRate and companyRate are required" });
    }

    const doc = new Rate({
      marketRate,
      companyRate,
      source: source || 'manual',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      product: product || 'latex60',
      status: 'pending',
      ...(ifValidId(req.user?._id) ? { createdBy: req.user._id, updatedBy: req.user._id } : {}),
      notes: notes || ''
    });

    await doc.save();
    return res.status(201).json({ message: "Rate proposed successfully (pending verification)", rate: doc });
  } catch (error) {
    return res.status(500).json({ message: "Error updating rate", error: error.message });
  }
};

// Alias for clarity
exports.proposeRate = exports.updateRate;

// Get the latest rate by product (default latex60)
// @route GET /api/rates/latest?product=latex60
exports.getLatestRate = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    const rate = await Rate.findOne({ product }).sort({ effectiveDate: -1, createdAt: -1 });
    if (!rate) {
      return res.status(404).json({ message: "No rates found" });
    }
    return res.json(rate);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching latest rate", error: error.message });
  }
};

// Public: Latest published rate only (visible to users/staff)
// @route GET /api/rates/published/latest?product=latex60
exports.getPublishedLatest = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    // Accept both 'approved' and 'published' status
    const rate = await Rate.findOne({ 
      product, 
      status: { $in: ['approved', 'published'] } 
    }).sort({ effectiveDate: -1, createdAt: -1 });
    if (!rate) return res.status(404).json({ message: 'No published rates found' });
    return res.json(rate);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching published latest rate', error: error.message });
  }
};

// Get company rate for billing
// @route GET /api/rates/company
exports.getCompanyRate = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    // Accept both 'approved' and 'published' status
    const rate = await Rate.findOne({ 
      product, 
      status: { $in: ['approved', 'published'] } 
    }).sort({ effectiveDate: -1, createdAt: -1 });
    if (!rate) {
      return res.json({ rate: 0, message: 'No company rate found' });
    }
    return res.json({ rate: rate.companyRate || 0 });
  } catch (error) {
    console.error('Error fetching company rate:', error);
    return res.status(500).json({ message: 'Error fetching company rate', error: error.message });
  }
};

// Update company rate (Admin/Manager only)
// @route PUT /api/rates/company
exports.updateCompanyRate = async (req, res) => {
  try {
    const { rate } = req.body;
    if (rate == null || rate <= 0) {
      return res.status(400).json({ message: 'Valid rate is required' });
    }

    const product = req.query.product || 'latex60';
    
    // Create a new rate entry with the updated company rate
    const newRate = new Rate({
      product,
      companyRate: rate,
      marketRate: 0, // Will be updated separately
      source: 'manual',
      effectiveDate: new Date(),
      status: 'published',
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
      notes: 'Company rate updated for billing'
    });

    await newRate.save();
    return res.json({ message: 'Company rate updated successfully', rate: newRate.companyRate });
  } catch (error) {
    console.error('Error updating company rate:', error);
    return res.status(500).json({ message: 'Error updating company rate', error: error.message });
  }
};

// Admin/Manager: Edit a proposed rate (resets to pending)
// @route PUT /api/rates/:id
exports.editRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { marketRate, companyRate, effectiveDate, product, notes } = req.body || {};
    const rate = await Rate.findById(id);
    if (!rate) return res.status(404).json({ message: 'Rate not found' });

    if (marketRate != null) rate.marketRate = marketRate;
    if (companyRate != null) rate.companyRate = companyRate;
    if (effectiveDate) rate.effectiveDate = new Date(effectiveDate);
    if (product) rate.product = product;
    if (notes !== undefined) rate.notes = notes;
    rate.status = 'pending';
    if (ifValidId(req.user?._id)) rate.updatedBy = req.user._id;
    rate.verifiedBy = null;
    rate.verifiedAt = null;

    await rate.save();
    return res.json({ message: 'Rate updated (pending verification)', rate });
  } catch (error) {
    return res.status(500).json({ message: 'Error editing rate', error: error.message });
  }
};

// Admin: Verify and publish a pending rate
// @route POST /api/rates/:id/verify
exports.verifyRate = async (req, res) => {
  try {
    const { id } = req.params;
    const rate = await Rate.findById(id);
    if (!rate) return res.status(404).json({ message: 'Rate not found' });

    rate.status = 'published';
    if (ifValidId(req.user?._id)) rate.verifiedBy = req.user._id;
    rate.verifiedAt = new Date();
    await rate.save();

    return res.json({ message: 'Rate verified and published', rate });
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying rate', error: error.message });
  }
};

// Admin/Manager: List pending rates
// @route GET /api/rates/pending?product=latex60
exports.getPendingRates = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    const list = await Rate.find({ product }).sort({ effectiveDate: -1, createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching pending rates', error: error.message });
  }
};

// Get all rates (history) - Admin (filter by product)
// @route GET /api/rates/history?product=latex60
exports.getAllRates = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    const rates = await Rate.find({ product }).sort({ effectiveDate: -1, createdAt: -1 });
    return res.json(rates);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching rates", error: error.message });
  }
};

// Public: Get recent rate history (no auth) - only approved/published rates
// @route GET /api/rates/public-history?product=latex60&limit=30
exports.getPublicRates = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    const limit = Number(req.query.limit) || 30;
    // Only return approved or published rates
    const rates = await Rate.find({ 
      product, 
      status: { $in: ['approved', 'published'] } 
    }).sort({ effectiveDate: -1, createdAt: -1 }).limit(limit);
    return res.json(rates);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching public rates", error: error.message });
  }
};

// User/Admin: Get rate history by date range (inclusive) for a product
// @route GET /api/rates/history-range?from=2024-01-01&to=2024-01-31&product=latex60&limit=50
exports.getRatesByDateRange = async (req, res) => {
  try {
    const { from, to, startDate, endDate } = req.query;
    const product = req.query.product || 'latex60';
    const limit = Number(req.query.limit) || 50;

    // Support both from/to and startDate/endDate parameter names
    const fromParam = from || startDate;
    const toParam = to || endDate;

    // If no date range provided, return recent history
    if (!fromParam && !toParam) {
      const rates = await Rate.find({ product, status: 'published' })
        .sort({ effectiveDate: -1, createdAt: -1 })
        .limit(limit);
      return res.json(rates);
    }

    // If date range provided, validate and use it
    if (!fromParam || !toParam) {
      return res.status(400).json({ message: 'Both from/to or startDate/endDate query params are required (YYYY-MM-DD)' });
    }

    const fromDate = new Date(fromParam);
    const toDate = new Date(toParam);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Include the entire 'to' day by setting to 23:59:59.999
    toDate.setHours(23, 59, 59, 999);

    const rates = await Rate.find({
      product,
      status: 'published',
      effectiveDate: { $gte: fromDate, $lte: toDate },
    }).sort({ effectiveDate: -1, createdAt: -1 }).limit(limit);

    return res.json(rates);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching rate history', error: error.message });
  }
};

// Fetch live Latex(60%) rate from Rubber Board website
// @route GET /api/rates/live/latex
exports.fetchLatexRateRubberBoard = async (req, res) => {
  try {
    const candidateUrls = [
      'https://rubberboard.gov.in',
      'https://rubberboard.org.in/public?lang=E',
      'https://rubberboard.org.in/public'
    ];

    let html = null;
    let fetchedUrl = null;

    // Try multiple possible URLs (site sometimes changes)
    for (const url of candidateUrls) {
      try {
        const response = await axios.get(url, { timeout: 10000 });
        if (response.status === 200 && typeof response.data === 'string') {
          html = response.data;
          fetchedUrl = url;
          break;
        }
      } catch (_) {
        // try next url
      }
    }

    if (!html) {
      return res.status(502).json({ message: 'Unable to fetch Rubber Board page' });
    }

    const $ = cheerio.load(html);

    // Find the table row containing 'Latex(60%)'
    let latexRow = null;
    $('tr').each((_, el) => {
      const text = $(el).text().trim();
      if (/latex\s*\(60\%?\)/i.test(text)) {
        latexRow = $(el);
        return false; // break
      }
    });

    if (!latexRow || latexRow.length === 0) {
      return res.status(404).json({ message: 'Latex(60%) row not found on source page', source: fetchedUrl });
    }

    // Attempt to read headers from the same table
    const table = latexRow.closest('table');
    let headers = [];
    if (table.length) {
      const headerRow = table.find('thead tr').first().length ? table.find('thead tr').first() : table.find('tr').first();
      headers = headerRow.find('th,td').map((i, th) => $(th).text().trim().replace(/\s+/g, ' ')).get();
    }

    // Extract numeric values from the latex row (INR and possibly USD values)
    const cells = latexRow.find('td,th').map((i, td) => $(td).text().trim()).get();
    const numeric = cells
      .map((t) => {
        const cleaned = t.replace(/[₹,]/g, '');
        const m = cleaned.match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
      })
      .filter((v) => v !== null);

    // Heuristic mapping to markets if available in order
    const markets = {};
    const knownMarkets = ['Kottayam', 'Kochi', 'Agartala', 'USD'];
    knownMarkets.forEach((mkt, idx) => {
      if (numeric[idx] != null) markets[mkt] = numeric[idx];
    });

    // Try to detect the 'as on' date from page text
    const pageText = $('body').text();
    const dateMatch = pageText.match(/on\s+(\d{1,2}-\d{1,2}-\d{4})/i);
    const asOnDate = dateMatch ? dateMatch[1] : null;

    return res.json({
      source: fetchedUrl,
      asOnDate,
      product: 'Latex(60%)',
      unit: 'per 100 Kg',
      headers,
      numeric,
      markets
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch latex rate', error: error.message });
  }
};

// Combined: Admin latest company rate + Rubber Board live rate
// @route GET /api/rates/latex/today?product=latex60
exports.getLatexToday = async (req, res) => {
  try {
    const product = req.query.product || 'latex60';
    const scraper = require('../services/rubberBoardScraper');

    // 1) Fetch Rubber Board live rate from centralized scraper
    const scraperResult = await scraper.getLatexRate();
    let marketData = null;

    if (scraperResult.success) {
      marketData = {
        productLabel: 'Latex(60%)',
        source: scraperResult.url,
        asOnDate: scraperResult.date,
        rate: scraperResult.rate,
        markets: { Kottayam: scraperResult.rate }
      };
    }

    // 2) Always return the latest published rate (no time-based restriction)
    const latest = await Rate.findOne({
      product,
      status: 'published'
    }).sort({ effectiveDate: -1, createdAt: -1 });

    const adminRate = latest ? {
      companyRate: latest.companyRate,
      marketRate: latest.marketRate,
      effectiveDate: latest.effectiveDate,
      isValid: true
    } : null;

    return res.json({
      product,
      unit: 'per 100 Kg',
      admin: adminRate,
      market: marketData   // null when scraper fails — frontend handles gracefully
    });
  } catch (error) {
    console.error('Error in getLatexToday:', error);
    return res.status(500).json({ message: 'Failed to fetch combined latex data', error: error.message });
  }
};

// Accountant: Submit rate for approval
// @route POST /api/rates/submit
exports.submitRateForApproval = async (req, res) => {
  try {
    const { marketRate, companyRate, product, effectiveDate, notes } = req.body;

    if (marketRate == null || companyRate == null) {
      return res.status(400).json({ success: false, message: "Both marketRate and companyRate are required" });
    }

    // Check if accountant already submitted a rate today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingSubmissionToday = await Rate.findOne({
      createdBy: req.user?._id,
      source: 'accountant_submission',
      product: product || 'latex60',
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingSubmissionToday) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already submitted a rate today. Only one submission per day is allowed.",
        existingSubmission: {
          marketRate: existingSubmissionToday.marketRate,
          companyRate: existingSubmissionToday.companyRate,
          status: existingSubmissionToday.status,
          submittedAt: existingSubmissionToday.createdAt
        }
      });
    }

    const doc = new Rate({
      marketRate,
      companyRate,
      product: product || 'latex60',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      status: 'pending',
      source: 'accountant_submission',
      ...(ifValidId(req.user?._id) ? { createdBy: req.user._id, updatedBy: req.user._id } : {}),
      notes: notes || ''
    });

    await doc.save();
    return res.status(201).json({ 
      success: true, 
      message: "Rate submitted successfully for admin approval", 
      data: doc 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error submitting rate", error: error.message });
  }
};

// Admin: Approve submitted rate
// @route PUT /api/rates/approve/:id
exports.approveRate = async (req, res) => {
  try {
    const { id } = req.params;
    const rate = await Rate.findById(id);
    
    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate not found' });
    }

    if (rate.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending rates can be approved' });
    }

    rate.status = 'published';
    if (ifValidId(req.user?._id)) {
      rate.verifiedBy = req.user._id;
    }
    rate.verifiedAt = new Date();
    await rate.save();

    return res.json({ 
      success: true, 
      message: 'Rate approved and published successfully', 
      data: rate 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error approving rate', error: error.message });
  }
};

// Admin: Reject submitted rate
// @route PUT /api/rates/reject/:id
exports.rejectRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const rate = await Rate.findById(id);
    
    if (!rate) {
      return res.status(404).json({ success: false, message: 'Rate not found' });
    }

    if (rate.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending rates can be rejected' });
    }

    rate.status = 'rejected';
    if (reason) {
      rate.notes = rate.notes ? `${rate.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`;
    }
    if (ifValidId(req.user?._id)) {
      rate.verifiedBy = req.user._id;
    }
    rate.verifiedAt = new Date();
    await rate.save();

    return res.json({ 
      success: true, 
      message: 'Rate rejected successfully', 
      data: rate 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error rejecting rate', error: error.message });
  }
};
