const express = require('express')
const router = express.Router()
const Controller = require('../controllers/company.controller')
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

router.post('/create', verifyAccessTokenAdmin, Controller.create)
router.post('/getCompanyById', Controller.getCompanyById)
router.post('/user', Controller.getUser)
router.post('/updatePassword', Controller.updatePassword)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/dropdownlist', Controller.dropdownlist)
router.post('/Deactivelist', verifyAccessTokenAdmin, Controller.Deactivelist)
router.post('/LoginHistory', verifyAccessTokenAdmin, Controller.LoginHistory)
router.post('/LoginHistoryDetails', verifyAccessTokenAdmin, Controller.LoginHistoryDetails)
router.post('/update', Controller.update)
router.post('/updatePlan', Controller.updatePlan)
router.post('/delete', Controller.delete)
router.post('/deactive', Controller.deactive)
router.post('/activecompany', Controller.activecompany)
router.post('/updateBarcodeSetting', verifyAccessTokenAdmin, Controller.updateBarcodeSetting)
router.post('/getBarcodeSettingByCompanyID', verifyAccessTokenAdmin, Controller.getBarcodeSettingByCompanyID)


// update company setting

router.post('/updatecompanysetting', verifyAccessTokenAdmin, dbConnection, Controller.updatecompanysetting)

// Regex search

router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/searchByFeildAdmin', verifyAccessTokenAdmin, Controller.searchByFeildAdmin)


// bill formate
router.post('/saveBillFormate', verifyAccessTokenAdmin, dbConnection, Controller.saveBillFormate)
router.post('/getBillFormateById', verifyAccessTokenAdmin, dbConnection, Controller.getBillFormateById)



// process product & product spec & specspttable

router.post('/processProduct', Controller.processProduct)

router.post('/processProductSpec', Controller.processProductSpec)

router.post('/processSpecSpt', Controller.processSpecSpt)

router.post('/processSupportData', Controller.processSupportData)


// Barcode and Invoice details

router.post('/barcodeDetails', Controller.barcodeDetails)
router.post('/invoiceDetails', Controller.invoiceDetails)

// Company hide option

router.post('/getCompanySettingByCompanyID', Controller.getCompanySettingByCompanyID)
router.post('/updateCompanySettingByCompanyID', Controller.updateCompanySettingByCompanyID)

// Company expiry report

router.post('/getCompanyExpirylist', verifyAccessTokenAdmin, Controller.getCompanyExpirylist)

router.get('/getDbConfig', Controller.getDbConfig)






module.exports = router