const express = require('express')
const router = express.Router()
const Controller = require('../controllers/payment.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { dbConnection } = require('../helpers/helper_function')


// const dbConfig = require('../helpers/db_config');

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


router.post('/getInvoicePayment', verifyAccessTokenAdmin, dbConnection, Controller.getInvoicePayment)
router.post('/getSupplierCreditNote', verifyAccessTokenAdmin, dbConnection, Controller.getSupplierCreditNote)
router.post('/getCustomerCreditNote', verifyAccessTokenAdmin, dbConnection, Controller.getCustomerCreditNote)
router.post('/getSupplierCreditNoteByCreditNumber', verifyAccessTokenAdmin, dbConnection, Controller.getSupplierCreditNoteByCreditNumber)
router.post('/applyPayment', verifyAccessTokenAdmin, dbConnection, Controller.applyPayment)

router.post('/getCommissionDetail', verifyAccessTokenAdmin, dbConnection, Controller.getCommissionDetail)
router.post('/getCommissionDetailByID', verifyAccessTokenAdmin, dbConnection, Controller.getCommissionDetailByID)
router.post('/saveCommissionDetail', verifyAccessTokenAdmin, dbConnection, Controller.saveCommissionDetail)
router.post('/getCommissionByID', verifyAccessTokenAdmin, dbConnection, Controller.getCommissionByID)
router.post('/getCommissionDetailList', verifyAccessTokenAdmin, dbConnection, Controller.getCommissionDetailList)

// customer payment
router.post('/customerPayment', verifyAccessTokenAdmin, dbConnection, Controller.customerPayment)
router.post('/customerPaymentDebit', verifyAccessTokenAdmin, dbConnection, Controller.customerPaymentDebit)

// vendor payment

router.post('/vendorPayment', verifyAccessTokenAdmin, dbConnection, Controller.vendorPayment)


// update customer payment mode

router.post('/updateCustomerPaymentMode', verifyAccessTokenAdmin, dbConnection, Controller.updateCustomerPaymentMode)
router.post('/updateCustomerPaymentDate', verifyAccessTokenAdmin, dbConnection, Controller.updateCustomerPaymentDate)


// customer credit amount get and debit release their credit amount


router.post('/getCustomerCreditAmount', verifyAccessTokenAdmin, dbConnection, Controller.getCustomerCreditAmount)
router.post('/customerCreditDebit', verifyAccessTokenAdmin, dbConnection, Controller.customerCreditDebit)


module.exports = router