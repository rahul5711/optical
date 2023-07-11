const express = require('express')
const router = express.Router()
const Controller = require('../controllers/bill.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/getInvoicePayment', verifyAccessTokenAdmin, Controller.getInvoicePayment)



module.exports = router