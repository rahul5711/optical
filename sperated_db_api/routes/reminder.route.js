const express = require("express");
const _router = express.Router();
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const Controller = require('../controllers/reminder.controller')

_router.post("/getBirthDayReminder", verifyAccessTokenAdmin, Controller.getBirthDayReminder);
_router.post("/getAnniversaryReminder", verifyAccessTokenAdmin, Controller.getAnniversaryReminder);
_router.post("/getCustomerOrderPending", verifyAccessTokenAdmin, Controller.getCustomerOrderPending);
_router.post("/getEyeTestingReminder", verifyAccessTokenAdmin, Controller.getEyeTestingReminder);
_router.post("/getFeedBackReminder", verifyAccessTokenAdmin, Controller.getFeedBackReminder);
_router.post("/getServiceMessageReminder", verifyAccessTokenAdmin, Controller.getServiceMessageReminder);
_router.post("/getSolutionExpiryReminder", verifyAccessTokenAdmin, Controller.getSolutionExpiryReminder);
_router.post("/getContactLensExpiryReminder", verifyAccessTokenAdmin, Controller.getContactLensExpiryReminder);
_router.post("/getReminderCount", verifyAccessTokenAdmin, Controller.getReminderCount);

module.exports = _router;
