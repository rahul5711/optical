const express = require('express')
const router = express.Router()
const Controller = require('../controllers/membershipcard.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { dbConnection } = require('../helpers/helper_function')


router.post('/save', verifyAccessTokenAdmin, dbConnection, Controller.save)
router.post('/delete', verifyAccessTokenAdmin, dbConnection, Controller.delete)
router.post('/getMembershipcardByCustomerID', verifyAccessTokenAdmin, dbConnection, Controller.getMembershipcardByCustomerID)
router.post('/report', verifyAccessTokenAdmin, dbConnection, Controller.report)



module.exports = router