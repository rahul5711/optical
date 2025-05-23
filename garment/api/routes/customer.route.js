const express = require('express')
const router = express.Router()
const Controller = require('../controllers/customer.controller')
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

router.post('/save', verifyAccessTokenAdmin, dbConnection, Controller.save)
router.post('/list', verifyAccessTokenAdmin, dbConnection, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, dbConnection, Controller.delete)
router.post('/restore', verifyAccessTokenAdmin, dbConnection, Controller.restore)
router.post('/getCustomerById', verifyAccessTokenAdmin, dbConnection, Controller.getCustomerById)
router.post('/deleteSpec', verifyAccessTokenAdmin, dbConnection, Controller.deleteSpec)

router.post('/update', verifyAccessTokenAdmin, dbConnection, Controller.update)


// Regex search

router.post('/searchByFeild', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeild)

router.post('/searchByCustomerID', verifyAccessTokenAdmin, dbConnection, Controller.searchByCustomerID)

router.post('/dropdownlist', verifyAccessTokenAdmin, dbConnection, Controller.dropdownlist)

router.post('/customerGSTNumber', verifyAccessTokenAdmin, dbConnection, Controller.customerGSTNumber)

router.post('/getMeasurementByCustomer', verifyAccessTokenAdmin, dbConnection, Controller.getMeasurementByCustomer)

router.post('/getMeasurementByCustomerForDropDown', verifyAccessTokenAdmin, dbConnection, Controller.getMeasurementByCustomerForDropDown)

router.post('/customerPowerPDF', verifyAccessTokenAdmin, dbConnection, Controller.customerPowerPDF)

router.post('/membershipCard', verifyAccessTokenAdmin, dbConnection, Controller.membershipCard)


router.post('/customerSearch', verifyAccessTokenAdmin, dbConnection, Controller.customerSearch)

// update power expiry date and visitDate
router.post('/updateExpiryAndVisitDate', verifyAccessTokenAdmin, dbConnection, Controller.updateExpiryAndVisitDate)
router.post('/updateVisitDateInContactLenRx', verifyAccessTokenAdmin, dbConnection, Controller.updateVisitDateInContactLenRx)


// eye report
router.post('/getEyeTestingReport', verifyAccessTokenAdmin, dbConnection, Controller.getEyeTestingReport)

router.post('/exportCustomerData', verifyAccessTokenAdmin, dbConnection, Controller.exportCustomerData)
router.post('/exportCustomerPower', verifyAccessTokenAdmin, dbConnection, Controller.exportCustomerPower)

// customer category

router.post('/saveCategory', verifyAccessTokenAdmin, dbConnection, Controller.saveCategory)
router.post('/getCategoryList', verifyAccessTokenAdmin, dbConnection, Controller.getCategoryList)
router.post('/deleteAllCategory', verifyAccessTokenAdmin, dbConnection, Controller.deleteAllCategory)
router.post('/getCustomerCategory', verifyAccessTokenAdmin, dbConnection, Controller.getCustomerCategory)




module.exports = router