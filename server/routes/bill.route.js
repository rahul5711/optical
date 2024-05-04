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
// router.post('/updateBill', verifyAccessTokenAdmin, Controller.updateBill)
router.post('/updateBillCustomer', verifyAccessTokenAdmin, Controller.updateBillCustomer)
router.post('/changeEmployee', verifyAccessTokenAdmin, Controller.changeEmployee)
router.post('/changeProductStatus', verifyAccessTokenAdmin, Controller.changeProductStatus)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/getBillById', verifyAccessTokenAdmin, Controller.getBillById)
router.post('/paymentHistory', verifyAccessTokenAdmin, Controller.paymentHistory)
router.post('/billHistoryByCustomer', verifyAccessTokenAdmin, Controller.billHistoryByCustomer)
router.post('/billHistoryByCustomerOld', verifyAccessTokenAdmin, Controller.billHistoryByCustomerOld)
router.post('/deleteBill', verifyAccessTokenAdmin, Controller.deleteBill)
router.post('/updatePower', verifyAccessTokenAdmin, Controller.updatePower)
router.post('/deleteProduct', verifyAccessTokenAdmin, Controller.deleteProduct)
router.post('/cancelProduct', verifyAccessTokenAdmin, Controller.cancelProduct)
router.post('/updateProduct', verifyAccessTokenAdmin, Controller.updateProduct)
router.post('/billPrint', verifyAccessTokenAdmin, Controller.billPrint)
router.post('/orderFormPrint', verifyAccessTokenAdmin, Controller.orderFormPrint)
router.post('/creditNotePrint', verifyAccessTokenAdmin, Controller.creditNotePrint)

// customer bills and their payments

router.post('/billByCustomer', verifyAccessTokenAdmin, Controller.billByCustomer)
router.post('/paymentHistoryByMasterID', verifyAccessTokenAdmin, Controller.paymentHistoryByMasterID)

// sale report

router.post('/saleServiceReport', verifyAccessTokenAdmin, Controller.saleServiceReport)

router.post('/getSalereports', verifyAccessTokenAdmin, Controller.getSalereports)

router.post('/getSalereport', verifyAccessTokenAdmin, Controller.getSalereport)

router.post('/getSalereportsDetail', verifyAccessTokenAdmin, Controller.getSalereportsDetail)

router.post('/getOldSalereport', verifyAccessTokenAdmin, Controller.getOldSalereport)
router.post('/getOldSaleDetailreport', verifyAccessTokenAdmin, Controller.getOldSalereDetailport)

router.post('/getCancelProductReport', verifyAccessTokenAdmin, Controller.getCancelProductReport)

// po supplier
router.post('/getSupplierPo', verifyAccessTokenAdmin, Controller.getSupplierPo)
router.post('/assignSupplierPo', verifyAccessTokenAdmin, Controller.assignSupplierPo)
router.post('/assignSupplierDoc', verifyAccessTokenAdmin, Controller.assignSupplierDoc)
router.post('/getSupplierPoList', verifyAccessTokenAdmin, Controller.getSupplierPoList)
router.post('/AssignSupplierPDF', verifyAccessTokenAdmin, Controller.AssignSupplierPDF)
router.post('/saveConvertPurchase', verifyAccessTokenAdmin, Controller.saveConvertPurchase)

router.post('/getSupplierPoPurchaseList', verifyAccessTokenAdmin, Controller.getSupplierPoPurchaseList)

// po fitter
router.post('/getFitterPo', verifyAccessTokenAdmin, Controller.getFitterPo)
router.post('/assignFitterPo', verifyAccessTokenAdmin, Controller.assignFitterPo)
router.post('/getFitterPoList', verifyAccessTokenAdmin, Controller.getFitterPoList)
router.post('/getFitterPoPurchaseList', verifyAccessTokenAdmin, Controller.getFitterPoPurchaseList)
router.post('/assignFitterDoc', verifyAccessTokenAdmin, Controller.assignFitterDoc)
router.post('/AssignFitterPDF', verifyAccessTokenAdmin, Controller.AssignFitterPDF)

// report
router.post('/cashcollectionreport', verifyAccessTokenAdmin, Controller.cashcollectionreport)

// update product type id and name and hsn code

router.post('/updateProductTypeNameOnBill', Controller.updateProductTypeNameOnBill)

router.post('/updateVisitDateContactlensTable', Controller.updateVisitDateContactlensTable)

// emp & dr commission/loyality report

router.post('/getLoyalityReport',verifyAccessTokenAdmin, Controller.getLoyalityReport)
router.post('/getLoyalityDetailReport',verifyAccessTokenAdmin, Controller.getLoyalityDetailReport)


module.exports = router