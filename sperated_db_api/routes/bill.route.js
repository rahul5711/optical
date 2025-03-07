const express = require('express')
const router = express.Router()
const Controller = require('../controllers/bill.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { shopID } = require('../helpers/helper_function')
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
const moment = require("moment");

const checkCron = async (req, res, next) => {

    const currentTime = req.headers.currenttime;
    const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    const shopid = await shopID(req.headers) || 0;
    const db = await dbConfig.dbByCompanyID(CompanyID);
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

router.post('/getDoctor', verifyAccessTokenAdmin, Controller.getDoctor)
router.post('/getEmployee', verifyAccessTokenAdmin, Controller.getEmployee)
router.post('/getTrayNo', verifyAccessTokenAdmin, Controller.getTrayNo)
router.post('/searchByBarcodeNo', verifyAccessTokenAdmin, Controller.searchByBarcodeNo)
router.post('/searchByString', verifyAccessTokenAdmin, Controller.searchByString)
router.post('/saveBill', verifyAccessTokenAdmin, checkCron, Controller.saveBill)
// router.post('/updateBill', verifyAccessTokenAdmin, Controller.updateBill)
router.post('/updateBillCustomer', verifyAccessTokenAdmin, checkCron, Controller.updateBillCustomer)
router.post('/changeEmployee', verifyAccessTokenAdmin, Controller.changeEmployee)
router.post('/changeProductStatus', verifyAccessTokenAdmin, Controller.changeProductStatus)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/searchByRegNo', verifyAccessTokenAdmin, Controller.searchByRegNo)
router.post('/getBillById', verifyAccessTokenAdmin, Controller.getBillById)
router.post('/paymentHistory', verifyAccessTokenAdmin, Controller.paymentHistory)
router.post('/billHistoryByCustomer', verifyAccessTokenAdmin, Controller.billHistoryByCustomer)
router.post('/billHistoryByCustomerOld', verifyAccessTokenAdmin, Controller.billHistoryByCustomerOld)
router.post('/deleteBill', verifyAccessTokenAdmin, Controller.deleteBill)
router.post('/updatePower', verifyAccessTokenAdmin, Controller.updatePower)
router.post('/deleteProduct', verifyAccessTokenAdmin, checkCron, Controller.deleteProduct)
router.post('/cancelProduct', verifyAccessTokenAdmin, checkCron, Controller.cancelProduct)
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

router.post('/getSalereportExport', verifyAccessTokenAdmin, Controller.getSalereportExport)

router.post('/getSalereportsDetail', verifyAccessTokenAdmin, Controller.getSalereportsDetail)

router.post('/getSalereportsDetailExport', verifyAccessTokenAdmin, Controller.getSalereportsDetailExport)
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

router.post('/getLoyalityReport', verifyAccessTokenAdmin, Controller.getLoyalityReport)
router.post('/getLoyalityDetailReport', verifyAccessTokenAdmin, Controller.getLoyalityDetailReport)

// GST Report

router.post('/getGstReport', verifyAccessTokenAdmin, Controller.getGstReport)
router.post('/getGstReportExport', verifyAccessTokenAdmin, Controller.getGstReportExport)
router.post('/submitGstFile', verifyAccessTokenAdmin, Controller.submitGstFile)
router.post('/generateInvoiceNo', verifyAccessTokenAdmin, Controller.generateInvoiceNo)
router.post('/generateInvoiceNoExcel', verifyAccessTokenAdmin, Controller.generateInvoiceNoExcel)

// fetch reward list
router.post('/getRewardReport', verifyAccessTokenAdmin, Controller.getRewardReport)
router.post('/getRewardBalance', verifyAccessTokenAdmin, Controller.getRewardBalance)
router.post('/sendOtpForAppliedReward', verifyAccessTokenAdmin, Controller.sendOtpForAppliedReward)

// discount setting

router.post('/getDiscountSetting', verifyAccessTokenAdmin, Controller.getDiscountSetting)
router.post('/saveDiscountSetting', verifyAccessTokenAdmin, Controller.saveDiscountSetting)
router.post('/updateDiscountSetting', verifyAccessTokenAdmin, Controller.updateDiscountSetting)
router.post('/deleteDiscountSetting', verifyAccessTokenAdmin, Controller.deleteDiscountSetting)
router.post('/getDiscountDataByID', verifyAccessTokenAdmin, Controller.getDiscountDataByID)
router.post('/getDiscountList', verifyAccessTokenAdmin, Controller.getDiscountList)
router.post('/searchByFeildDiscountSettig', verifyAccessTokenAdmin, Controller.searchByFeildDiscountSettig)

// sale return

router.post('/barCodeListBySearchStringSR', verifyAccessTokenAdmin, Controller.barCodeListBySearchStringSR)
router.post('/productDataByBarCodeNoSR', verifyAccessTokenAdmin, Controller.productDataByBarCodeNoSR)

router.post('/saveSaleReturn', verifyAccessTokenAdmin, checkCron, Controller.saveSaleReturn)

router.post('/updateSaleReturn', verifyAccessTokenAdmin, checkCron, Controller.updateSaleReturn)

router.post('/salereturnlist', verifyAccessTokenAdmin, Controller.salereturnlist)

router.post('/getSaleReturnById', verifyAccessTokenAdmin, Controller.getSaleReturnById)

router.post('/searchByFeildSR', verifyAccessTokenAdmin, Controller.searchByFeildSR)

router.post('/deleteSR', verifyAccessTokenAdmin, Controller.deleteSR)

router.post('/deleteProductSR', verifyAccessTokenAdmin, Controller.deleteProductSR)

router.post('/customerCnSR', verifyAccessTokenAdmin, Controller.customerCnSR)

router.post('/getSaleReturnReport', verifyAccessTokenAdmin, Controller.getSaleReturnReport)
router.post('/getSaleReturnDetailReport', verifyAccessTokenAdmin, Controller.getSaleReturnDetailReport)



// order form
router.post('/orderformrequest', verifyAccessTokenAdmin, Controller.orderformrequest)
router.post('/orderformrequestreport', verifyAccessTokenAdmin, Controller.orderformrequestreport)
router.post('/orderformsubmit', verifyAccessTokenAdmin, Controller.orderformsubmit)
router.post('/orderformAccept', verifyAccessTokenAdmin, Controller.orderformAccept)
router.post('/ordersearchByString', verifyAccessTokenAdmin, Controller.ordersearchByString)
router.post('/getDashBoardReportBI', verifyAccessTokenAdmin, Controller.getDashBoardReportBI)
router.get('/check8', Controller.check)


// DashBoard Report
router.post('/getDashBoardReportOne', verifyAccessTokenAdmin, Controller.getDashBoardReportOne)
router.post('/getDashBoardReportTwo', verifyAccessTokenAdmin, Controller.getDashBoardReportTwo)
router.post('/getDashBoardReportThree', verifyAccessTokenAdmin, Controller.getDashBoardReportThree)


// Recycle bin

router.post('/getRecycleBinData', verifyAccessTokenAdmin, Controller.getRecycleBinData);


// Set Product Status Deliverd in one click

router.post('/updateProductStatusAll', verifyAccessTokenAdmin, Controller.updateProductStatusAll);




module.exports = router