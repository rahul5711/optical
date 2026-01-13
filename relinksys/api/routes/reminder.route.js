const express = require("express");
const _router = express.Router();
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const Controller = require('../controllers/reminder.controller')
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

_router.post("/getBirthDayReminder", verifyAccessTokenAdmin, dbConnection, Controller.getBirthDayReminder);
_router.post("/getAnniversaryReminder", verifyAccessTokenAdmin, dbConnection, Controller.getAnniversaryReminder);
_router.post("/getCustomerOrderPending", verifyAccessTokenAdmin, dbConnection, Controller.getCustomerOrderPending);
_router.post("/getEyeTestingReminder", verifyAccessTokenAdmin, dbConnection, Controller.getEyeTestingReminder);
_router.post("/getFeedBackReminder", verifyAccessTokenAdmin, dbConnection, Controller.getFeedBackReminder);
_router.post("/getServiceMessageReminder", verifyAccessTokenAdmin, dbConnection, Controller.getServiceMessageReminder);
_router.post("/getSolutionExpiryReminder", verifyAccessTokenAdmin, dbConnection, Controller.getSolutionExpiryReminder);
_router.post("/getContactLensExpiryReminder", verifyAccessTokenAdmin, dbConnection, Controller.getContactLensExpiryReminder);
_router.post("/getReminderCount", verifyAccessTokenAdmin, dbConnection, Controller.getReminderCount);

_router.post("/sendWpMessage", verifyAccessTokenAdmin, dbConnection, Controller.sendWpMessage);
_router.post("/sendCustomerCreditNoteWpMessage", verifyAccessTokenAdmin, dbConnection, Controller.sendCustomerCreditNoteWpMessage);

_router.post("/getReminderReport", verifyAccessTokenAdmin, dbConnection, Controller.getReminderReport);



module.exports = _router;
