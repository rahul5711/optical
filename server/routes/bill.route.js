const express = require('express')
const router = express.Router()
const Controller = require('../controllers/bill.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/getDoctor', verifyAccessTokenAdmin, Controller.getDoctor)
router.post('/getEmployee', verifyAccessTokenAdmin, Controller.getEmployee)
router.post('/getTrayNo', verifyAccessTokenAdmin, Controller.getTrayNo)
router.post('/searchByBarcodeNo', verifyAccessTokenAdmin, Controller.searchByBarcodeNo)
router.post('/searchByString', verifyAccessTokenAdmin, Controller.searchByString)
router.post('/saveBill', verifyAccessTokenAdmin, Controller.saveBill)
router.post('/updateBill', verifyAccessTokenAdmin, Controller.updateBill)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/getBillById', verifyAccessTokenAdmin, Controller.getBillById)
router.post('/paymentHistory', verifyAccessTokenAdmin, Controller.paymentHistory)
router.post('/billHistoryByCustomer', verifyAccessTokenAdmin, Controller.billHistoryByCustomer)
router.post('/deleteBill', verifyAccessTokenAdmin, Controller.deleteBill)
router.post('/updatePower', verifyAccessTokenAdmin, Controller.updatePower)
router.post('/deleteProduct', verifyAccessTokenAdmin, Controller.deleteProduct)

// customer bills and their payments

router.post('/billByCustomer', verifyAccessTokenAdmin, Controller.billByCustomer)
router.post('/paymentHistoryByMasterID', verifyAccessTokenAdmin, Controller.paymentHistoryByMasterID)

// sale report

router.post('/saleServiceReport', verifyAccessTokenAdmin, Controller.saleServiceReport)

router.post('/getSalereports', verifyAccessTokenAdmin, Controller.getSalereports)

router.post('/getSalereportsDetail', verifyAccessTokenAdmin, Controller.getSalereportsDetail)

// po supplier
router.post('/getSupplierPo', verifyAccessTokenAdmin, Controller.getSupplierPo)
router.post('/assignSupplierPo', verifyAccessTokenAdmin, Controller.assignSupplierPo)
router.post('/assignSupplierDoc', verifyAccessTokenAdmin, Controller.assignSupplierDoc)
router.post('/getSupplierPoList', verifyAccessTokenAdmin, Controller.getSupplierPoList)
router.post('/saveConvertPurchase', verifyAccessTokenAdmin, Controller.saveConvertPurchase)

router.post('/getSupplierPoPurchaseList', verifyAccessTokenAdmin, Controller.getSupplierPoPurchaseList)

// po fitter
router.post('/getFitterPo', verifyAccessTokenAdmin, Controller.getFitterPo)
router.post('/assignFitterPo', verifyAccessTokenAdmin, Controller.assignFitterPo)
router.post('/getFitterPoList', verifyAccessTokenAdmin, Controller.getFitterPoList)
router.post('/getFitterPoPurchaseList', verifyAccessTokenAdmin, Controller.getFitterPoPurchaseList)
router.post('/assignFitterDoc', verifyAccessTokenAdmin, Controller.assignFitterDoc)
module.exports = router