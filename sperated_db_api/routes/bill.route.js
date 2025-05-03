const express = require('express')
const router = express.Router()
const Controller = require('../controllers/bill.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { shopID, dbConnection } = require('../helpers/helper_function')
const moment = require("moment");
// const mysql2 = require('../database')
// const dbConfig = require('../helpers/db_config');

const checkCron = async (req, res, next) => {

    const currentTime = req.headers.currenttime;
    const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    const shopid = await shopID(req.headers) || 0;
    // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = req.db;
    if (db.success === false) {
        return res.status(200).json(db);
    }
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

router.post('/getDoctor', verifyAccessTokenAdmin, dbConnection, Controller.getDoctor)
router.post('/getEmployee', verifyAccessTokenAdmin, dbConnection, Controller.getEmployee)
router.post('/getTrayNo', verifyAccessTokenAdmin, dbConnection, Controller.getTrayNo)
router.post('/searchByBarcodeNo', verifyAccessTokenAdmin, dbConnection, Controller.searchByBarcodeNo)
router.post('/searchByString', verifyAccessTokenAdmin, dbConnection, Controller.searchByString)
router.post('/saveBill', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.saveBill)
// router.post('/updateBill', verifyAccessTokenAdmin,dbConnection, Controller.updateBill)
router.post('/updateBillCustomer', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.updateBillCustomer)
router.post('/changeEmployee', verifyAccessTokenAdmin, dbConnection, Controller.changeEmployee)
router.post('/changeProductStatus', verifyAccessTokenAdmin, dbConnection, Controller.changeProductStatus)
router.post('/list', verifyAccessTokenAdmin, dbConnection, Controller.list)
router.post('/searchByFeild', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeild)
router.post('/searchByRegNo', verifyAccessTokenAdmin, dbConnection, Controller.searchByRegNo)
router.post('/getBillById', verifyAccessTokenAdmin, dbConnection, Controller.getBillById)
router.post('/paymentHistory', verifyAccessTokenAdmin, dbConnection, Controller.paymentHistory)
router.post('/billHistoryByCustomer', verifyAccessTokenAdmin, dbConnection, Controller.billHistoryByCustomer)
router.post('/billHistoryByCustomerOld', verifyAccessTokenAdmin, dbConnection, Controller.billHistoryByCustomerOld)
router.post('/deleteBill', verifyAccessTokenAdmin, dbConnection, Controller.deleteBill)
router.post('/updatePower', verifyAccessTokenAdmin, dbConnection, Controller.updatePower)
router.post('/deleteProduct', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.deleteProduct)
router.post('/cancelProduct', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.cancelProduct)
router.post('/updateProduct', verifyAccessTokenAdmin, dbConnection, Controller.updateProduct)
router.post('/billPrint', verifyAccessTokenAdmin, dbConnection, Controller.billPrint)
router.post('/orderFormPrint', verifyAccessTokenAdmin, dbConnection, Controller.orderFormPrint)
router.post('/creditNotePrint', verifyAccessTokenAdmin, dbConnection, Controller.creditNotePrint)

// customer bills and their payments

router.post('/billByCustomer', verifyAccessTokenAdmin, dbConnection, Controller.billByCustomer)
router.post('/paymentHistoryByMasterID', verifyAccessTokenAdmin, dbConnection, Controller.paymentHistoryByMasterID)

// sale report

router.post('/saleServiceReport', verifyAccessTokenAdmin, dbConnection, Controller.saleServiceReport)

router.post('/getSalereports', verifyAccessTokenAdmin, dbConnection, Controller.getSalereports)

router.post('/getSalereport', verifyAccessTokenAdmin, dbConnection, Controller.getSalereport)

router.post('/getSalereportExport', verifyAccessTokenAdmin, dbConnection, Controller.getSalereportExport)

router.post('/getSalereportsDetail', verifyAccessTokenAdmin, dbConnection, Controller.getSalereportsDetail)

router.post('/getSalereportsDetailExport', verifyAccessTokenAdmin, dbConnection, Controller.getSalereportsDetailExport)
router.post('/getOldSalereport', verifyAccessTokenAdmin, dbConnection, Controller.getOldSalereport)
router.post('/getOldSaleDetailreport', verifyAccessTokenAdmin, dbConnection, Controller.getOldSalereDetailport)

router.post('/getCancelProductReport', verifyAccessTokenAdmin, dbConnection, Controller.getCancelProductReport)

// po supplier
router.post('/getSupplierPo', verifyAccessTokenAdmin, dbConnection, Controller.getSupplierPo)
router.post('/assignSupplierPo', verifyAccessTokenAdmin, dbConnection, Controller.assignSupplierPo)
router.post('/assignSupplierDoc', verifyAccessTokenAdmin, dbConnection, Controller.assignSupplierDoc)
router.post('/getSupplierPoList', verifyAccessTokenAdmin, dbConnection, Controller.getSupplierPoList)
router.post('/AssignSupplierPDF', verifyAccessTokenAdmin, dbConnection, Controller.AssignSupplierPDF)
router.post('/saveConvertPurchase', verifyAccessTokenAdmin, dbConnection, Controller.saveConvertPurchase)

router.post('/getSupplierPoPurchaseList', verifyAccessTokenAdmin, dbConnection, Controller.getSupplierPoPurchaseList)

// po fitter
router.post('/getFitterPo', verifyAccessTokenAdmin, dbConnection, Controller.getFitterPo)
router.post('/assignFitterPo', verifyAccessTokenAdmin, dbConnection, Controller.assignFitterPo)
router.post('/getFitterPoList', verifyAccessTokenAdmin, dbConnection, Controller.getFitterPoList)
router.post('/getFitterPoPurchaseList', verifyAccessTokenAdmin, dbConnection, Controller.getFitterPoPurchaseList)
router.post('/assignFitterDoc', verifyAccessTokenAdmin, dbConnection, Controller.assignFitterDoc)
router.post('/AssignFitterPDF', verifyAccessTokenAdmin, dbConnection, Controller.AssignFitterPDF)

// report
router.post('/cashcollectionreport', verifyAccessTokenAdmin, dbConnection, Controller.cashcollectionreport)

// update product type id and name and hsn code

router.post('/updateProductTypeNameOnBill', Controller.updateProductTypeNameOnBill)

router.post('/updateVisitDateContactlensTable', Controller.updateVisitDateContactlensTable)

// emp & dr commission/loyality report

router.post('/getLoyalityReport', verifyAccessTokenAdmin, dbConnection, Controller.getLoyalityReport)
router.post('/getLoyalityDetailReport', verifyAccessTokenAdmin, dbConnection, Controller.getLoyalityDetailReport)

// GST Report

router.post('/getGstReport', verifyAccessTokenAdmin, dbConnection, Controller.getGstReport)
router.post('/getGstReportExport', verifyAccessTokenAdmin, dbConnection, Controller.getGstReportExport)
router.post('/submitGstFile', verifyAccessTokenAdmin, dbConnection, Controller.submitGstFile)
router.post('/generateInvoiceNo', verifyAccessTokenAdmin, dbConnection, Controller.generateInvoiceNo)
router.post('/generateInvoiceNoExcel', verifyAccessTokenAdmin, dbConnection, Controller.generateInvoiceNoExcel)

// fetch reward list
router.post('/getRewardReport', verifyAccessTokenAdmin, dbConnection, Controller.getRewardReport)
router.post('/getRewardBalance', verifyAccessTokenAdmin, dbConnection, Controller.getRewardBalance)
router.post('/sendOtpForAppliedReward', verifyAccessTokenAdmin, dbConnection, Controller.sendOtpForAppliedReward)

// discount setting

router.post('/getDiscountSetting', verifyAccessTokenAdmin, dbConnection, Controller.getDiscountSetting)
router.post('/saveDiscountSetting', verifyAccessTokenAdmin, dbConnection, Controller.saveDiscountSetting)
router.post('/updateDiscountSetting', verifyAccessTokenAdmin, dbConnection, Controller.updateDiscountSetting)
router.post('/deleteDiscountSetting', verifyAccessTokenAdmin, dbConnection, Controller.deleteDiscountSetting)
router.post('/getDiscountDataByID', verifyAccessTokenAdmin, dbConnection, Controller.getDiscountDataByID)
router.post('/getDiscountList', verifyAccessTokenAdmin, dbConnection, Controller.getDiscountList)
router.post('/searchByFeildDiscountSettig', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeildDiscountSettig)

// sale return

router.post('/barCodeListBySearchStringSR', verifyAccessTokenAdmin, dbConnection, Controller.barCodeListBySearchStringSR)
router.post('/productDataByBarCodeNoSR', verifyAccessTokenAdmin, dbConnection, Controller.productDataByBarCodeNoSR)

router.post('/saveSaleReturn', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.saveSaleReturn)

router.post('/updateSaleReturn', verifyAccessTokenAdmin, dbConnection, checkCron, Controller.updateSaleReturn)

router.post('/salereturnlist', verifyAccessTokenAdmin, dbConnection, Controller.salereturnlist)

router.post('/getSaleReturnById', verifyAccessTokenAdmin, dbConnection, Controller.getSaleReturnById)

router.post('/searchByFeildSR', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeildSR)

router.post('/deleteSR', verifyAccessTokenAdmin, dbConnection, Controller.deleteSR)

router.post('/deleteProductSR', verifyAccessTokenAdmin, dbConnection, Controller.deleteProductSR)

router.post('/customerCnSR', verifyAccessTokenAdmin, dbConnection, Controller.customerCnSR)

router.post('/getSaleReturnReport', verifyAccessTokenAdmin, dbConnection, Controller.getSaleReturnReport)
router.post('/getSaleReturnDetailReport', verifyAccessTokenAdmin, dbConnection, Controller.getSaleReturnDetailReport)



// order form
router.post('/orderformrequest', verifyAccessTokenAdmin, dbConnection, Controller.orderformrequest)
router.post('/orderformrequestreport', verifyAccessTokenAdmin, dbConnection, Controller.orderformrequestreport)
router.post('/orderformsubmit', verifyAccessTokenAdmin, dbConnection, Controller.orderformsubmit)
router.post('/orderformAccept', verifyAccessTokenAdmin, dbConnection, Controller.orderformAccept)
router.post('/ordersearchByString', verifyAccessTokenAdmin, dbConnection, Controller.ordersearchByString)
router.post('/getDashBoardReportBI', verifyAccessTokenAdmin, dbConnection, Controller.getDashBoardReportBI)
router.get('/check11', Controller.check)


// DashBoard Report
router.post('/getDashBoardReportOne', verifyAccessTokenAdmin, dbConnection, Controller.getDashBoardReportOne)
router.post('/getDashBoardReportTwo', verifyAccessTokenAdmin, dbConnection, Controller.getDashBoardReportTwo)
router.post('/getDashBoardReportThree', verifyAccessTokenAdmin, dbConnection, Controller.getDashBoardReportThree)


// Recycle bin

router.post('/getRecycleBinData', verifyAccessTokenAdmin, dbConnection, Controller.getRecycleBinData);


// Set Product Status Deliverd in one click

router.post('/updateProductStatusAll', verifyAccessTokenAdmin, dbConnection, Controller.updateProductStatusAll);

// Convert Order into Invoice --- Billing Flow -> 3 // Manual Invoice + Order Flow

router.post('/convertOrderIntoInvoiceNo', verifyAccessTokenAdmin, dbConnection, Controller.convertOrderIntoInvoiceNo);

// Get Month Year wise sale report

router.post('/getSaleReportMonthYearWise', verifyAccessTokenAdmin, dbConnection, Controller.getSaleReportMonthYearWise)





module.exports = router