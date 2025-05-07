const express = require('express')
const router = express.Router()
const Controller = require('../controllers/purchase.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { shopID } = require('../helpers/helper_function')
const moment = require("moment");
const { dbConnection } = require('../helpers/helper_function')

const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');


const checkCron = async (req, res, next) => {

    const currentTime = req.headers.currenttime;
    const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    const shopid = await shopID(req.headers) || 0;

    // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = req.db;
    if (db.success === false) {
        return res.status(200).json(db);
    }

    let date = moment(currentTime).format("YYYY-MM-DD");

    const [fetch_company_wise] = await db.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)

    if (!fetch_company_wise.length) {
        return res.status(200).send({
            success: false, message: `Hello,
        We are facing some technical issues with your license. Don't use software please contact the OPTICALGURU Team.
        (Cron)
        Thankyou`})
    }

    const [fetch_shop_wise] = await db.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

    if (!fetch_shop_wise.length) {
        return res.status(200).send({
            success: false, message: `Hello,
        We are facing some technical issues with your license. Don't use software please contact the OPTICALGURU Team.

        Thankyou`})
    }

    next();
}

// let dbCache = {}; // Cache for storing database instances

// const dbConnection = async (req, res, next) => {
//     const CompanyID = req.user?.CompanyID || 0;

//     // Check if the database instance is already cached
//     if (dbCache[CompanyID]) {
//         req.db = dbCache[CompanyID];
//         return next();
//     }

//     // Fetch database connection
//     const db = await dbConfig.dbByCompanyID(CompanyID);

//     if (db.success === false) {
//         return res.status(200).json(db);
//     }

//     // Store in cache
//     dbCache[CompanyID] = db;
//     req.db = db;

//     next();
// };


router.post('/create', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.create)
router.post('/update', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.update)
router.post('/getPurchaseById', verifyAccessTokenAdmin, dbConnection, Controller.getPurchaseById)
router.post('/list', verifyAccessTokenAdmin, dbConnection, Controller.list)
router.post('/purchaseHistoryBySupplier', verifyAccessTokenAdmin, dbConnection, Controller.purchaseHistoryBySupplier)
router.post('/delete', verifyAccessTokenAdmin, dbConnection, Controller.delete)
router.post('/deleteProduct', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.deleteProduct)
router.post('/updateProduct', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.updateProduct)
router.post('/deleteCharge', verifyAccessTokenAdmin, dbConnection, Controller.deleteCharge)
router.post('/purchaseDetailPDF', verifyAccessTokenAdmin, dbConnection, Controller.purchaseDetailPDF)
router.post('/purchaseRetrunPDF', verifyAccessTokenAdmin, dbConnection, Controller.purchaseRetrunPDF)
router.post('/PrintBarcode', verifyAccessTokenAdmin, dbConnection, Controller.PrintBarcode)
router.post('/AllPrintBarcode', verifyAccessTokenAdmin, dbConnection, Controller.AllPrintBarcode)


// Regex search

router.post('/paymentHistory', verifyAccessTokenAdmin, dbConnection, Controller.paymentHistory)

router.post('/searchByFeild', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeild)


// product transfer
router.post('/barCodeListBySearchString', verifyAccessTokenAdmin, dbConnection, Controller.barCodeListBySearchString)

router.post('/productDataByBarCodeNo', verifyAccessTokenAdmin, dbConnection, Controller.productDataByBarCodeNo)

router.post('/transferProduct', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.transferProduct)

router.post('/acceptTransfer', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.acceptTransfer)

router.post('/cancelTransfer', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.cancelTransfer)

router.post('/getTransferList', verifyAccessTokenAdmin, dbConnection, Controller.getTransferList)

router.post('/getproductTransferReport', verifyAccessTokenAdmin, dbConnection, Controller.getproductTransferReport)

router.post('/transferProductPDF', verifyAccessTokenAdmin, dbConnection, Controller.transferProductPDF)

// bulk product transfer

router.post('/bulkTransferProduct', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProduct)
router.post('/bulkTransferProductList', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProductList)
router.post('/bulkTransferProductByID', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProductByID)
router.post('/bulkTransferProductCancel', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProductCancel)
router.post('/bulkTransferProductUpdate', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProductUpdate)
router.post('/bulkTransferProductAccept', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProductAccept)
router.post('/bulkTransferProductPDF', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.bulkTransferProductPDF)


// search barcode

router.post('/barcodeDataByBarcodeNo', verifyAccessTokenAdmin, dbConnection, Controller.barcodeDataByBarcodeNo)

router.post('/barCodeListBySearchStringSearch', verifyAccessTokenAdmin, dbConnection, Controller.barCodeListBySearchStringSearch)

router.post('/updateBarcode', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.updateBarcode)

// Inventory Summery

router.post('/getInventorySummary', verifyAccessTokenAdmin, dbConnection, Controller.getInventorySummary)

router.post('/updateInventorySummary', verifyAccessTokenAdmin, dbConnection, Controller.updateInventorySummary)

// Purchase Report

router.post('/getPurchasereports', verifyAccessTokenAdmin, dbConnection, Controller.getPurchasereports)

router.post('/getPurchasereportsExport', verifyAccessTokenAdmin, dbConnection, Controller.getPurchasereportsExport)

router.post('/getPurchasereportsDetail', verifyAccessTokenAdmin, dbConnection, Controller.getPurchasereportsDetail)

router.post('/getPurchasereportsDetailExport', verifyAccessTokenAdmin, dbConnection, Controller.getPurchasereportsDetailExport)


// pre order product
router.post('/createPreOrder', verifyAccessTokenAdmin, dbConnection, Controller.createPreOrder)
router.post('/listPreOrder', verifyAccessTokenAdmin, dbConnection, Controller.listPreOrder)
router.post('/listPreOrderDummy', verifyAccessTokenAdmin, dbConnection, Controller.listPreOrderDummy)
router.post('/deletePreOrderDummy', verifyAccessTokenAdmin, dbConnection, Controller.deletePreOrderDummy)
router.post('/deleteAllPreOrderDummy', verifyAccessTokenAdmin, dbConnection, Controller.deleteAllPreOrderDummy)
router.post('/updatePreOrderDummy', verifyAccessTokenAdmin, dbConnection, Controller.updatePreOrderDummy)
router.post('/getPurchaseByIdPreOrder', verifyAccessTokenAdmin, dbConnection, Controller.getPurchaseByIdPreOrder)
router.post('/deletePreOrder', verifyAccessTokenAdmin, dbConnection, Controller.deletePreOrder)
router.post('/deleteProductPreOrder', verifyAccessTokenAdmin, dbConnection, Controller.deleteProductPreOrder)
router.post('/updatePreOrder', verifyAccessTokenAdmin, dbConnection, Controller.updatePreOrder)


router.post('/searchByFeildPreOrder', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeildPreOrder)

// product inventory report

router.post('/getProductInventoryReport', verifyAccessTokenAdmin, dbConnection, Controller.getProductInventoryReport)

router.post('/getProductInventoryReportExport', verifyAccessTokenAdmin, dbConnection, Controller.getProductInventoryReportExport)


// product expiry report

router.post('/getProductExpiryReport', verifyAccessTokenAdmin, dbConnection, Controller.getProductExpiryReport)


// charge report

router.post('/getPurchaseChargeReport', verifyAccessTokenAdmin, dbConnection, Controller.getPurchaseChargeReport)


// purchase return
router.post('/barCodeListBySearchStringPR', verifyAccessTokenAdmin, dbConnection, Controller.barCodeListBySearchStringPR)

router.post('/productDataByBarCodeNoPR', verifyAccessTokenAdmin, dbConnection, Controller.productDataByBarCodeNoPR)

router.post('/savePurchaseReturn', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.savePurchaseReturn)

router.post('/updatePurchaseReturn', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.updatePurchaseReturn)

router.post('/purchasereturnlist', verifyAccessTokenAdmin, dbConnection, Controller.purchasereturnlist)

router.post('/getPurchaseReturnById', verifyAccessTokenAdmin, dbConnection, Controller.getPurchaseReturnById)

router.post('/deleteProductPR', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.deleteProductPR)

router.post('/searchByFeildPR', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeildPR)

router.post('/deletePR', verifyAccessTokenAdmin, dbConnection, Controller.deletePR)

router.post('/supplierCnPR', verifyAccessTokenAdmin, dbConnection, Controller.supplierCnPR)


// purchase return report

router.post('/getPurchasereturnreports', verifyAccessTokenAdmin, dbConnection, Controller.getPurchasereturnreports)

router.post('/getPurchasereturndetailreports', verifyAccessTokenAdmin, dbConnection, Controller.getPurchasereturndetailreports)
router.post('/setProductExpiryDate', verifyAccessTokenAdmin, dbConnection, Controller.setProductExpiryDate)

router.post('/setbarcodemaster', verifyAccessTokenAdmin, dbConnection, Controller.setbarcodemaster)

// Payment
router.post('/getInvoicePayment', verifyAccessTokenAdmin, dbConnection, Controller.getInvoicePayment)
router.post('/paymentHistoryByPurchaseID', verifyAccessTokenAdmin, dbConnection, Controller.paymentHistoryByPurchaseID)

// creport

router.post('/getCountInventoryReport', verifyAccessTokenAdmin, dbConnection, Controller.getCountInventoryReport)
router.post('/getCountInventoryReportMonthWise', verifyAccessTokenAdmin, dbConnection, Controller.getCountInventoryReportMonthWise)
router.post('/getAmountInventoryReport', verifyAccessTokenAdmin, dbConnection, Controller.getAmountInventoryReport)
router.post('/getAmountInventoryReportMonthWise', verifyAccessTokenAdmin, dbConnection, Controller.getAmountInventoryReportMonthWise)

// update retail price && whole sale price

router.post('/updateProductPrice', verifyAccessTokenAdmin, dbConnection, Controller.updateProductPrice)

// get vendor due payment

router.post('/getVendorDuePayment', verifyAccessTokenAdmin, dbConnection, Controller.getVendorDuePayment)

// get physical stock check api's

router.post('/getPhysicalStockProductList', verifyAccessTokenAdmin, dbConnection, Controller.getPhysicalStockProductList)
router.post('/savePhysicalStockProduct', verifyAccessTokenAdmin, dbConnection, Controller.savePhysicalStockProduct)
router.post('/getPhysicalStockProductByID', verifyAccessTokenAdmin, dbConnection, Controller.getPhysicalStockProductByID)
router.post('/getPhysicalStockCheckList', verifyAccessTokenAdmin, dbConnection, Controller.getPhysicalStockCheckList)
router.post('/getPhysicalStockCheckReport', verifyAccessTokenAdmin, dbConnection, Controller.getPhysicalStockCheckReport)
router.post('/searchByFeildPhysicalStockCheckList', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeildPhysicalStockCheckList)
router.post('/updatePhysicalStockProduct', verifyAccessTokenAdmin, dbConnection, Controller.updatePhysicalStockProduct)


// get loaction set api's
router.post('/getLocationStockProductList', verifyAccessTokenAdmin, dbConnection, Controller.getLocationStockProductList)
router.post('/saveProductLocation', verifyAccessTokenAdmin, dbConnection, Controller.saveProductLocation)
router.post('/updateProductLocation', verifyAccessTokenAdmin, dbConnection, Controller.updateProductLocation)
router.post('/deleteProductLocation', verifyAccessTokenAdmin, dbConnection, Controller.deleteProductLocation)
router.post('/getProductLocationByBarcodeNumber', verifyAccessTokenAdmin, dbConnection, Controller.getProductLocationByBarcodeNumber)

// Get Month Year wise purchase report

router.post('/getPurchaseReportMonthYearWise', verifyAccessTokenAdmin, dbConnection, Controller.getPurchaseReportMonthYearWise)
router.post('/getPurchaseReportMonthYearWiseDetails', verifyAccessTokenAdmin, dbConnection, Controller.getPurchaseReportMonthYearWiseDetails)




module.exports = router