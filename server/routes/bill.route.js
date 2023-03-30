const express = require('express')
const router = express.Router()
const Controller = require('../controllers/bill.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/getDoctor', verifyAccessTokenAdmin, Controller.getDoctor)
router.post('/getEmployee', verifyAccessTokenAdmin, Controller.getEmployee)
router.post('/getTrayNo', verifyAccessTokenAdmin, Controller.getTrayNo)
router.post('/searchByBarcodeNo', verifyAccessTokenAdmin, Controller.searchByBarcodeNo)


module.exports = router