const express = require('express')
const router = express.Router()
const Controller = require('../controllers/customer.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/save',verifyAccessTokenAdmin, Controller.save)


module.exports = router