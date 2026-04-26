const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanies
} = require('../controllers/companyController');

router.get('/', getCompanies);
router.post('/', createCompany);

module.exports = router;