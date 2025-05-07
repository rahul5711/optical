const express = require('express')
const router = express.Router()
const Controller = require('../controllers/uploader.controller')
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

router.post('/saveFileRecord', verifyAccessTokenAdmin, dbConnection, Controller.saveFileRecord)

router.post('/list', verifyAccessTokenAdmin, dbConnection, Controller.list)

router.post('/updateFileRecord', verifyAccessTokenAdmin, dbConnection, Controller.updateFileRecord)

router.post('/deleteFileRecord', verifyAccessTokenAdmin, dbConnection, Controller.deleteFileRecord)

router.post('/processPurchaseFile', verifyAccessTokenAdmin, dbConnection, Controller.processPurchaseFile)

router.post('/processCustomerFile', verifyAccessTokenAdmin, dbConnection, Controller.processCustomerFile)

router.post('/processSupplierFile', verifyAccessTokenAdmin, dbConnection, Controller.processSupplierFile)

router.post('/processCusSpectacleFile', verifyAccessTokenAdmin, dbConnection, Controller.processCusSpectacleFile)

router.post('/processCusContactFile', verifyAccessTokenAdmin, dbConnection, Controller.processCusContactFile)

router.post('/processBillMaster', verifyAccessTokenAdmin, dbConnection, Controller.processBillMaster)
router.post('/processBillDetail', verifyAccessTokenAdmin, dbConnection, Controller.processBillDetail)

module.exports = router