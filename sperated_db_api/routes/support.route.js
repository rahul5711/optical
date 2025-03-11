const express = require('express')
const router = express.Router()
const Controller = require('../controllers/support.controller')
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

// support data 

router.post('/save', verifyAccessTokenAdmin, dbConnection, Controller.save)
router.post('/list', verifyAccessTokenAdmin, dbConnection, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, dbConnection, Controller.delete)

// charge and service management
router.post('/chargesave', verifyAccessTokenAdmin, dbConnection, Controller.chargesave)
router.post('/chargelist', verifyAccessTokenAdmin, dbConnection, Controller.chargelist)
router.post('/chargedelete', verifyAccessTokenAdmin, dbConnection, Controller.chargedelete)

// service management
router.post('/servicesave', verifyAccessTokenAdmin, dbConnection, Controller.servicesave)
router.post('/servicelist', verifyAccessTokenAdmin, dbConnection, Controller.servicelist)
router.post('/servicedelete', verifyAccessTokenAdmin, dbConnection, Controller.servicedelete)

// data by search feild

router.post('/dropdownlistBySearch', verifyAccessTokenAdmin, dbConnection, Controller.dropdownlistBySearch)



module.exports = router