const express = require('express')
const router = express.Router()
const Controller = require('../controllers/uploader.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/saveFileRecord', verifyAccessTokenAdmin, Controller.saveFileRecord)

router.post('/list', verifyAccessTokenAdmin, Controller.list)



module.exports = router