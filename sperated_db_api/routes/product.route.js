const express = require('express')
const router = express.Router()
const Controller = require('../controllers/product.controller')
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

router.post('/save',verifyAccessTokenAdmin, dbConnection, Controller.save)
router.post('/update',verifyAccessTokenAdmin, dbConnection, Controller.update)
router.post('/delete',verifyAccessTokenAdmin, dbConnection, Controller.delete)
router.post('/restore',verifyAccessTokenAdmin, dbConnection, Controller.restore)
router.post('/getList',verifyAccessTokenAdmin, dbConnection, Controller.getList)

router.post('/saveSpec',verifyAccessTokenAdmin, dbConnection, Controller.saveSpec)
router.post('/deleteSpec',verifyAccessTokenAdmin, dbConnection, Controller.deleteSpec)
router.post('/getSpec',verifyAccessTokenAdmin, dbConnection, Controller.getSpec)


//  product master

router.post('/getFieldList',verifyAccessTokenAdmin, dbConnection, Controller.getFieldList)
router.post('/getProductSupportData',verifyAccessTokenAdmin, dbConnection, Controller.getProductSupportData)
router.post('/saveProductSupportData',verifyAccessTokenAdmin, dbConnection, Controller.saveProductSupportData)



module.exports = router