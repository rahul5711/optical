const express = require('express')
const router = express.Router()
const Controller = require('../controllers/purchase.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { shopID } = require('../helpers/helper_function')
const mysql2 = require('../database')
const moment = require("moment");

const checkCron = async (req, res, next) => {

    const currentTime = req.headers.currenttime;
    const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    const shopid = await shopID(req.headers) || 0;

    let date = moment(currentTime).format("YYYY-MM-DD");

    const [fetch_company_wise] = await mysql2.pool.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)

    if (!fetch_company_wise.length) {
        return res.status(200).send({
            success: false, message: `Hello,
        We are facing some technical issues with your license. Don't use software please contact the OPTICALGURU Team.
        (Cron)
        Thankyou`})
    }

    const [fetch_shop_wise] = await mysql2.pool.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

    if (!fetch_shop_wise.length) {
        return res.status(200).send({
            success: false, message: `Hello,
        We are facing some technical issues with your license. Don't use software please contact the OPTICALGURU Team.

        Thankyou`})
    }

    next();
}


router.post('/create', verifyAccessTokenAdmin, checkCron, Controller.create)
router.post('/update', verifyAccessTokenAdmin, checkCron, Controller.update)
router.post('/getPurchaseById', verifyAccessTokenAdmin, Controller.getPurchaseById)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/purchaseHistoryBySupplier', verifyAccessTokenAdmin, Controller.purchaseHistoryBySupplier)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.post('/deleteProduct', verifyAccessTokenAdmin, checkCron, Controller.deleteProduct)
router.post('/updateProduct', verifyAccessTokenAdmin, checkCron, Controller.updateProduct)
router.post('/deleteCharge', verifyAccessTokenAdmin, Controller.deleteCharge)
router.post('/purchaseDetailPDF', verifyAccessTokenAdmin, Controller.purchaseDetailPDF)
router.post('/purchaseRetrunPDF', verifyAccessTokenAdmin, Controller.purchaseRetrunPDF)
router.post('/PrintBarcode', verifyAccessTokenAdmin, Controller.PrintBarcode)
router.post('/AllPrintBarcode', verifyAccessTokenAdmin, Controller.AllPrintBarcode)


// Regex search

router.post('/paymentHistory', verifyAccessTokenAdmin, Controller.paymentHistory)

router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)


// product transfer
router.post('/barCodeListBySearchString', verifyAccessTokenAdmin, Controller.barCodeListBySearchString)

router.post('/productDataByBarCodeNo', verifyAccessTokenAdmin, Controller.productDataByBarCodeNo)

router.post('/transferProduct', verifyAccessTokenAdmin, checkCron, Controller.transferProduct)

router.post('/acceptTransfer', verifyAccessTokenAdmin, checkCron, Controller.acceptTransfer)

router.post('/cancelTransfer', verifyAccessTokenAdmin, checkCron, Controller.cancelTransfer)

router.post('/getTransferList', verifyAccessTokenAdmin, Controller.getTransferList)

router.post('/getproductTransferReport', verifyAccessTokenAdmin, Controller.getproductTransferReport)

router.post('/transferProductPDF', verifyAccessTokenAdmin, Controller.transferProductPDF)

// bulk product transfer

router.post('/bulkTransferProduct', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProduct)
router.post('/bulkTransferProductList', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProductList)
router.post('/bulkTransferProductByID', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProductByID)
router.post('/bulkTransferProductCancel', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProductCancel)
router.post('/bulkTransferProductUpdate', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProductUpdate)
router.post('/bulkTransferProductAccept', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProductAccept)
router.post('/bulkTransferProductPDF', verifyAccessTokenAdmin, checkCron, Controller.bulkTransferProductPDF)


// search barcode

router.post('/barcodeDataByBarcodeNo', verifyAccessTokenAdmin, Controller.barcodeDataByBarcodeNo)

router.post('/barCodeListBySearchStringSearch', verifyAccessTokenAdmin, Controller.barCodeListBySearchStringSearch)

router.post('/updateBarcode', verifyAccessTokenAdmin, checkCron, Controller.updateBarcode)

// Inventory Summery

router.post('/getInventorySummary', verifyAccessTokenAdmin, Controller.getInventorySummary)

router.post('/updateInventorySummary', verifyAccessTokenAdmin, Controller.updateInventorySummary)

// Purchase Report

router.post('/getPurchasereports', verifyAccessTokenAdmin, Controller.getPurchasereports)

router.post('/getPurchasereportsExport', verifyAccessTokenAdmin, Controller.getPurchasereportsExport)

router.post('/getPurchasereportsDetail', verifyAccessTokenAdmin, Controller.getPurchasereportsDetail)

router.post('/getPurchasereportsDetailExport', verifyAccessTokenAdmin, Controller.getPurchasereportsDetailExport)


// pre order product
router.post('/createPreOrder', verifyAccessTokenAdmin, Controller.createPreOrder)
router.post('/listPreOrder', verifyAccessTokenAdmin, Controller.listPreOrder)
router.post('/listPreOrderDummy', verifyAccessTokenAdmin, Controller.listPreOrderDummy)
router.post('/deletePreOrderDummy', verifyAccessTokenAdmin, Controller.deletePreOrderDummy)
router.post('/deleteAllPreOrderDummy', verifyAccessTokenAdmin, Controller.deleteAllPreOrderDummy)
router.post('/updatePreOrderDummy', verifyAccessTokenAdmin, Controller.updatePreOrderDummy)
router.post('/getPurchaseByIdPreOrder', verifyAccessTokenAdmin, Controller.getPurchaseByIdPreOrder)
router.post('/deletePreOrder', verifyAccessTokenAdmin, Controller.deletePreOrder)
router.post('/deleteProductPreOrder', verifyAccessTokenAdmin, Controller.deleteProductPreOrder)
router.post('/updatePreOrder', verifyAccessTokenAdmin, Controller.updatePreOrder)


router.post('/searchByFeildPreOrder', verifyAccessTokenAdmin, Controller.searchByFeildPreOrder)

// product inventory report

router.post('/getProductInventoryReport', verifyAccessTokenAdmin, Controller.getProductInventoryReport)

router.post('/getProductInventoryReportExport', verifyAccessTokenAdmin, Controller.getProductInventoryReportExport)


// product expiry report

router.post('/getProductExpiryReport', verifyAccessTokenAdmin, Controller.getProductExpiryReport)


// charge report

router.post('/getPurchaseChargeReport', verifyAccessTokenAdmin, Controller.getPurchaseChargeReport)


// purchase return
router.post('/barCodeListBySearchStringPR', verifyAccessTokenAdmin, Controller.barCodeListBySearchStringPR)

router.post('/productDataByBarCodeNoPR', verifyAccessTokenAdmin, Controller.productDataByBarCodeNoPR)

router.post('/savePurchaseReturn', verifyAccessTokenAdmin, checkCron, Controller.savePurchaseReturn)

router.post('/updatePurchaseReturn', verifyAccessTokenAdmin, checkCron, Controller.updatePurchaseReturn)

router.post('/purchasereturnlist', verifyAccessTokenAdmin, Controller.purchasereturnlist)

router.post('/getPurchaseReturnById', verifyAccessTokenAdmin, Controller.getPurchaseReturnById)

router.post('/deleteProductPR', verifyAccessTokenAdmin, checkCron, Controller.deleteProductPR)

router.post('/searchByFeildPR', verifyAccessTokenAdmin, Controller.searchByFeildPR)

router.post('/deletePR', verifyAccessTokenAdmin, Controller.deletePR)

router.post('/supplierCnPR', verifyAccessTokenAdmin, Controller.supplierCnPR)


// purchase return report

router.post('/getPurchasereturnreports', verifyAccessTokenAdmin, Controller.getPurchasereturnreports)

router.post('/getPurchasereturndetailreports', verifyAccessTokenAdmin, Controller.getPurchasereturndetailreports)
router.post('/setProductExpiryDate', verifyAccessTokenAdmin, Controller.setProductExpiryDate)

router.post('/setbarcodemaster', verifyAccessTokenAdmin, Controller.setbarcodemaster)

// Payment
router.post('/getInvoicePayment', verifyAccessTokenAdmin, Controller.getInvoicePayment)
router.post('/paymentHistoryByPurchaseID', verifyAccessTokenAdmin, Controller.paymentHistoryByPurchaseID)

// creport

router.post('/getCountInventoryReport', verifyAccessTokenAdmin, Controller.getCountInventoryReport)
router.post('/getCountInventoryReportMonthWise', verifyAccessTokenAdmin, Controller.getCountInventoryReportMonthWise)
router.post('/getAmountInventoryReport', verifyAccessTokenAdmin, Controller.getAmountInventoryReport)
router.post('/getAmountInventoryReportMonthWise', verifyAccessTokenAdmin, Controller.getAmountInventoryReportMonthWise)

// update retail price && whole sale price

router.post('/updateProductPrice', verifyAccessTokenAdmin, Controller.updateProductPrice)

// get vendor due payment

router.post('/getVendorDuePayment', verifyAccessTokenAdmin, Controller.getVendorDuePayment)

// get physical stock check api's

router.post('/getPhysicalStockProductList', verifyAccessTokenAdmin, Controller.getPhysicalStockProductList)
router.post('/savePhysicalStockProduct', verifyAccessTokenAdmin, Controller.savePhysicalStockProduct)
router.post('/getPhysicalStockProductByID', verifyAccessTokenAdmin, Controller.getPhysicalStockProductByID)
router.post('/getPhysicalStockCheckList', verifyAccessTokenAdmin, Controller.getPhysicalStockCheckList)
router.post('/updatePhysicalStockProduct', verifyAccessTokenAdmin, Controller.updatePhysicalStockProduct)


// get loaction set api's
router.post('/getLocationStockProductList', verifyAccessTokenAdmin, Controller.getLocationStockProductList)
router.post('/saveProductLocation', verifyAccessTokenAdmin, Controller.saveProductLocation)
router.post('/updateProductLocation', verifyAccessTokenAdmin, Controller.updateProductLocation)
router.post('/deleteProductLocation', verifyAccessTokenAdmin, Controller.deleteProductLocation)
router.post('/getProductLocationByBarcodeNumber', verifyAccessTokenAdmin, Controller.getProductLocationByBarcodeNumber)




module.exports = router