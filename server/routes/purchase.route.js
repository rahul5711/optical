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
router.post('/updateProduct', verifyAccessTokenAdmin, Controller.updateProduct)
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

router.post('/getproductTransferReport', verifyAccessTokenAdmin, Controller.getproductTransferReport)
// search barcode

router.post('/barcodeDataByBarcodeNo', verifyAccessTokenAdmin, Controller.barcodeDataByBarcodeNo)

router.post('/barCodeListBySearchStringSearch', verifyAccessTokenAdmin, Controller.barCodeListBySearchStringSearch)

router.post('/updateBarcode', verifyAccessTokenAdmin, Controller.updateBarcode)

// Inventory Summery

router.post('/getInventorySummary', verifyAccessTokenAdmin, Controller.getInventorySummary)

router.post('/updateInventorySummary', verifyAccessTokenAdmin, Controller.updateInventorySummary)

// Purchase Report

router.post('/getPurchasereports', verifyAccessTokenAdmin, Controller.getPurchasereports)

router.post('/getPurchasereportsDetail', verifyAccessTokenAdmin, Controller.getPurchasereportsDetail)


// pre order product
router.post('/createPreOrder', verifyAccessTokenAdmin, Controller.createPreOrder)
router.post('/listPreOrder', verifyAccessTokenAdmin, Controller.listPreOrder)
router.post('/getPurchaseByIdPreOrder', verifyAccessTokenAdmin, Controller.getPurchaseByIdPreOrder)
router.post('/deletePreOrder', verifyAccessTokenAdmin, Controller.deletePreOrder)
router.post('/deleteProductPreOrder', verifyAccessTokenAdmin, Controller.deleteProductPreOrder)
router.post('/updatePreOrder', verifyAccessTokenAdmin, Controller.updatePreOrder)


router.post('/searchByFeildPreOrder', verifyAccessTokenAdmin, Controller.searchByFeildPreOrder)

// product inventory report

router.post('/getProductInventoryReport', verifyAccessTokenAdmin, Controller.getProductInventoryReport)


// product expiry report

router.post('/getProductExpiryReport', verifyAccessTokenAdmin, Controller.getProductExpiryReport)


// charge report

router.post('/getPurchaseChargeReport', verifyAccessTokenAdmin, Controller.getPurchaseChargeReport)


// purchase return
router.post('/barCodeListBySearchStringPR', verifyAccessTokenAdmin, Controller.barCodeListBySearchStringPR)

router.post('/productDataByBarCodeNoPR', verifyAccessTokenAdmin, Controller.productDataByBarCodeNoPR)

router.post('/savePurchaseReturn', verifyAccessTokenAdmin, Controller.savePurchaseReturn)

router.post('/updatePurchaseReturn', verifyAccessTokenAdmin, Controller.updatePurchaseReturn)

router.post('/purchasereturnlist', verifyAccessTokenAdmin, Controller.purchasereturnlist)

router.post('/getPurchaseReturnById', verifyAccessTokenAdmin, Controller.getPurchaseReturnById)

router.post('/deleteProductPR', verifyAccessTokenAdmin, Controller.deleteProductPR)

router.post('/searchByFeildPR', verifyAccessTokenAdmin, Controller.searchByFeildPR)

router.post('/deletePR', verifyAccessTokenAdmin, Controller.deletePR)

router.post('/supplierCnPR', verifyAccessTokenAdmin, Controller.supplierCnPR)


// purchase return report

router.post('/getPurchasereturnreports', verifyAccessTokenAdmin, Controller.getPurchasereturnreports)

router.post('/getPurchasereturndetailreports', verifyAccessTokenAdmin, Controller.getPurchasereturndetailreports)



module.exports = router