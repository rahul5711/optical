const express = require('express')
const router = express.Router()
const Controller = require('../controllers/ledge.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/getSupplierLedgeReport', verifyAccessTokenAdmin, Controller.getSupplierLedgeReport)
router.post('/getCustomerLedgeReport', verifyAccessTokenAdmin, Controller.getCustomerLedgeReport)
router.post('/getSupplierLedgeReportPDF', verifyAccessTokenAdmin, Controller.getSupplierLedgeReportPDF)
router.post('/getCustomerLedgeReportPDF', verifyAccessTokenAdmin, Controller.getCustomerLedgeReportPDF)

module.exports = router