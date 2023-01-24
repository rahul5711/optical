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
router.post('/chargelist', verifyAccessTokenAdmin, Controller.chargelist)
router.post('/chargedelete', verifyAccessTokenAdmin, Controller.chargedelete)

// service management
router.post('/servicesave', verifyAccessTokenAdmin, Controller.servicesave)
router.post('/servicelist', verifyAccessTokenAdmin, Controller.servicelist)
router.post('/servicedelete', verifyAccessTokenAdmin, Controller.servicedelete)



module.exports = router