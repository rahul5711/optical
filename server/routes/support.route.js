const express = require('express')
const router = express.Router()
const Controller = require('../controllers/support.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

// support data 

router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)

// charge and service management
router.post('/chargesave', verifyAccessTokenAdmin, Controller.chargesave)
router.get('/chargelist', verifyAccessTokenAdmin, Controller.chargelist)
router.post('/chargedelete', verifyAccessTokenAdmin, Controller.chargedelete)


module.exports = router