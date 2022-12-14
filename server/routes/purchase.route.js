const express = require('express')
const router = express.Router()
const Controller = require('../controllers/purchase.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/create', verifyAccessTokenAdmin, Controller.create)
router.post('/update', verifyAccessTokenAdmin, Controller.update)
router.post('/getPurchaseById', verifyAccessTokenAdmin, Controller.getPurchaseById)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.post('/deleteProduct', verifyAccessTokenAdmin, Controller.deleteProduct)
router.post('/deleteCharge', verifyAccessTokenAdmin, Controller.deleteCharge)


// Regex search

router.post('/paymentHistory', verifyAccessTokenAdmin, Controller.paymentHistory)

router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)


// product transfer
router.post('/barCodeListBySearchString', verifyAccessTokenAdmin, Controller.barCodeListBySearchString)

router.post('/productDataByBarCodeNo', verifyAccessTokenAdmin, Controller.productDataByBarCodeNo)

router.post('/transferProduct', verifyAccessTokenAdmin, Controller.transferProduct)

router.post('/acceptTransfer', verifyAccessTokenAdmin, Controller.acceptTransfer)

router.post('/cancelTransfer', verifyAccessTokenAdmin, Controller.cancelTransfer)

router.post('/getTransferList', verifyAccessTokenAdmin, Controller.getTransferList)

// search barcode

router.post('/barcodeDataByBarcodeNo', verifyAccessTokenAdmin, Controller.barcodeDataByBarcodeNo)

router.post('/updateBarcode', verifyAccessTokenAdmin, Controller.updateBarcode)

// Inventory Summery

router.post('/getInventorySummary', verifyAccessTokenAdmin, Controller.getInventorySummary)

router.post('/updateInventorySummary', verifyAccessTokenAdmin, Controller.updateInventorySummary)

// Purchase Report

router.post('/getPurchasereports', verifyAccessTokenAdmin, Controller.getPurchasereports)

router.post('/getPurchasereportsDetail', verifyAccessTokenAdmin, Controller.getPurchasereportsDetail)



module.exports = router