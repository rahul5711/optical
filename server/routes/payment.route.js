const express = require('express')
const router = express.Router()
const Controller = require('../controllers/payment.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/getInvoicePayment', verifyAccessTokenAdmin, Controller.getInvoicePayment)

router.post('/getCommissionDetail', verifyAccessTokenAdmin, Controller.getCommissionDetail)
router.post('/saveCommissionDetail', verifyAccessTokenAdmin, Controller.saveCommissionDetail)
router.post('/getCommissionByID', verifyAccessTokenAdmin, Controller.getCommissionByID)
router.post('/getCommissionDetailList', verifyAccessTokenAdmin, Controller.getCommissionDetailList)

// customer payment
router.post('/customerPayment', verifyAccessTokenAdmin, Controller.customerPayment)


// update customer payment mode

router.post('/updateCustomerPaymentMode', verifyAccessTokenAdmin, Controller.updateCustomerPaymentMode)


module.exports = router