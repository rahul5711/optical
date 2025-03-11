const express = require('express')
const router = express.Router()
const Controller = require('../controllers/ledge.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

const dbConfig = require('../helpers/db_config');

let dbCache = {}; // Cache for storing database instances

const dbConnection = async (req, res, next) => {
    const CompanyID = req.user?.CompanyID || 0;

    // Check if the database instance is already cached
    if (dbCache[CompanyID]) {
        req.db = dbCache[CompanyID];
        return next();
    }

    // Fetch database connection
    const db = await dbConfig.dbByCompanyID(CompanyID);

    if (db.success === false) {
        return res.status(200).json(db);
    }

    // Store in cache
    dbCache[CompanyID] = db;
    req.db = db;

    next();
};

router.post('/getSupplierLedgeReport', verifyAccessTokenAdmin, dbConnection, Controller.getSupplierLedgeReport)
router.post('/getCustomerLedgeReport', verifyAccessTokenAdmin, dbConnection, Controller.getCustomerLedgeReport)
router.post('/getFitterLedgeReport', verifyAccessTokenAdmin, dbConnection, Controller.getFitterLedgeReport)
router.post('/getEmployeeLedgeReport', verifyAccessTokenAdmin, dbConnection, Controller.getEmployeeLedgeReport)
router.post('/getDoctorLedgeReport', verifyAccessTokenAdmin, dbConnection, Controller.getDoctorLedgeReport)

module.exports = router