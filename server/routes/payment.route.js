const express = require('express')
const router = express.Router()
const Controller = require('../controllers/payment.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


// router.post('/getInvoicePayment', verifyAccessTokenAdmin, Controller.getInvoicePayment)

router.post('/getCommissionDetail', verifyAccessTokenAdmin, Controller.getCommissionDetail)
router.post('/saveCommissionDetail', verifyAccessTokenAdmin, Controller.saveCommissionDetail)
router.post('/getCommissionByID', verifyAccessTokenAdmin, Controller.getCommissionByID)
router.post('/getCommissionDetailList', verifyAccessTokenAdmin, Controller.getCommissionDetailList)


module.exports = router