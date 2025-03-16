const express = require('express')
const router = express.Router()
const Controller = require('../controllers/doctor.controller')
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
router.get('/dropdownlist', verifyAccessTokenAdmin, dbConnection, Controller.dropdownlist)
router.post('/delete',verifyAccessTokenAdmin, dbConnection, Controller.delete)
router.post('/getDoctorById',verifyAccessTokenAdmin, dbConnection, Controller.getDoctorById)
router.post('/update',verifyAccessTokenAdmin, dbConnection, Controller.update)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, dbConnection, Controller.searchByFeild)



module.exports = router