const express = require("express");
const router = express.Router();
const rateController = require("../controllers/rateController");
const { protect, admin, adminOrManager } = require("../middleware/authMiddleware");

// Manager/Admin can propose (back-compat path retained)
router.post("/update", protect, adminOrManager, rateController.updateRate);
router.post("/propose", protect, adminOrManager, rateController.proposeRate);

// Combined (Admin latest + Rubber Board live)
router.get("/latex/today", rateController.getLatexToday);

// Anyone can view latest rate (by product)
router.get("/latest", rateController.getLatestRate);

// Company rate endpoint for billing
router.get("/company", rateController.getCompanyRate);
router.put("/company", protect, adminOrManager, rateController.updateCompanyRate);

// Latest published rate (visible to end users/staff)
router.get("/published/latest", rateController.getPublishedLatest);

// Combined (Admin latest + Rubber Board live)
router.get("/latex/today", rateController.getLatexToday);

// Live Latex(60%) rate scraped from Rubber Board (public)
router.get("/live/latex", rateController.fetchLatexRateRubberBoard);

// Admin can view full history
router.get("/history", protect, admin, rateController.getAllRates);

// User/Admin: date-range history (auth required for users)
router.get("/history-range", protect, rateController.getRatesByDateRange);

// Public recent history (for dashboards without admin auth)
router.get("/public-history", rateController.getPublicRates);

// Admin/Manager/Accountant: list pending rates
router.get("/pending", protect, rateController.getPendingRates);
router.put("/:id", protect, adminOrManager, rateController.editRate);
router.post("/:id/verify", protect, admin, rateController.verifyRate);

// Accountant: Submit rate for approval
router.post("/submit", protect, rateController.submitRateForApproval);

// Admin: Approve or reject submitted rates
router.put("/approve/:id", protect, admin, rateController.approveRate);
router.put("/reject/:id", protect, admin, rateController.rejectRate);

module.exports = router;
