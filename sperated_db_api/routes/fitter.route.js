const express = require('express')
const router = express.Router()
const Controller = require('../controllers/fitter.controller')
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
router.post('/update', verifyAccessTokenAdmin, dbConnection, Controller.update)
router.post('/list', verifyAccessTokenAdmin, dbConnection, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, dbConnection, Controller.delete)
router.get('/dropdownlist', verifyAccessTokenAdmin, dbConnection, Controller.dropdownlist)
router.post('/getRateCard', verifyAccessTokenAdmin, dbConnection, Controller.getRateCard)
router.post('/getFitterById',verifyAccessTokenAdmin, dbConnection, Controller.getFitterById)
router.post('/saveRateCard',verifyAccessTokenAdmin, dbConnection, Controller.saveRateCard)
router.post('/deleteRateCard', verifyAccessTokenAdmin, dbConnection, Controller.deleteRateCard)
router.post('/saveFitterAssignedShop',verifyAccessTokenAdmin, dbConnection, Controller.saveFitterAssignedShop)

router.post('/deleteFitterAssignedShop', verifyAccessTokenAdmin, dbConnection, Controller.deleteFitterAssignedShop)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, dbConnection, Controller.searchByFeild)


// fitter inoice

router.post('/getFitterInvoice',verifyAccessTokenAdmin, dbConnection, Controller.getFitterInvoice)
router.post('/saveFitterInvoice',verifyAccessTokenAdmin, dbConnection, Controller.saveFitterInvoice)
router.post('/getFitterInvoiceList',verifyAccessTokenAdmin, dbConnection, Controller.getFitterInvoiceList)
router.post('/getFitterInvoiceListByID',verifyAccessTokenAdmin, dbConnection, Controller.getFitterInvoiceListByID)
router.post('/getFitterInvoiceDetailByID',verifyAccessTokenAdmin, dbConnection, Controller.getFitterInvoiceDetailByID)
router.post('/updateFitterInvoiceNo',verifyAccessTokenAdmin, dbConnection, Controller.updateFitterInvoiceNo)


module.exports = router