const express = require('express')
const router = express.Router()
const Controller = require('../controllers/support.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)




module.exports = router