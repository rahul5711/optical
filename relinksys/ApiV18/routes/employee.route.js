const express = require('express')
const router = express.Router()
const Controller = require('../controllers/employee.controller')
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
router.post('/getUserById', verifyAccessTokenAdmin, dbConnection, Controller.getUserById)
router.post('/update', verifyAccessTokenAdmin, dbConnection, Controller.update)
router.post('/dropdownlist', verifyAccessTokenAdmin, dbConnection, Controller.dropdownlist)
router.post('/LoginHistory', verifyAccessTokenAdmin, dbConnection, Controller.LoginHistory)
router.post('/LoginHistoryFilter', verifyAccessTokenAdmin, dbConnection, Controller.LoginHistoryFilter)
router.post('/updatePassword', verifyAccessTokenAdmin, dbConnection, Controller.updatePassword)

// Regex search

router.post('/searchByFeild', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeild)
router.post('/searchByFeildCompanyAdmin', verifyAccessTokenAdmin, dbConnection, Controller.searchByFeildCompanyAdmin)

// Forgate Password

router.post('/forgetPassword', Controller.forgetPassword)





module.exports = router