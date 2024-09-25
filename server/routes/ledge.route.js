const express = require('express')
const router = express.Router()
const Controller = require('../controllers/ledge.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/getSupplierLedgeReport', verifyAccessTokenAdmin, Controller.getSupplierLedgeReport)
router.post('/getCustomerLedgeReport', verifyAccessTokenAdmin, Controller.getCustomerLedgeReport)
router.post('/getFitterLedgeReport', verifyAccessTokenAdmin, Controller.getFitterLedgeReport)
router.post('/getEmployeeLedgeReport', verifyAccessTokenAdmin, Controller.getEmployeeLedgeReport)
router.post('/getDoctorLedgeReport', verifyAccessTokenAdmin, Controller.getDoctorLedgeReport)


module.exports = router