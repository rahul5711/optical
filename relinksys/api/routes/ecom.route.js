const express = require('express')
const router = express.Router()
const Controller = require('../controllers/ecom.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { dbConnection } = require('../helpers/helper_function')



router.post('/save', verifyAccessTokenAdmin, dbConnection, Controller.save)
router.post('/getDataByID', verifyAccessTokenAdmin, dbConnection, Controller.getDataByID)
router.get('/getDataByID', Controller.getProductForWebSite)







module.exports = router