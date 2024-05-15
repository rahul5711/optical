const express = require('express')
const router = express.Router()
const Controller = require('../controllers/ledge.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/getSupplierLedgeReport', verifyAccessTokenAdmin, Controller.getSupplierLedgeReport)
router.post('/getCustomerLedgeReport', verifyAccessTokenAdmin, Controller.getCustomerLedgeReport)

module.exports = router