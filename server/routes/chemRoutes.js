const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/chemicalController');

router.use(protect, admin);

router.get('/alerts/all', ctrl.alerts);
router.get('/', ctrl.listChemicals);
router.post('/', ctrl.addOrUpdateChemical);
router.post('/:name/lots', ctrl.addLot);
router.post('/:name/issue', ctrl.issue);

module.exports = router;


