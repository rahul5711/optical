const express = require('express')
const router = express.Router()
const Controller = require('../controllers/uploader.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/saveFileRecord', verifyAccessTokenAdmin, Controller.saveFileRecord)

router.post('/list', verifyAccessTokenAdmin, Controller.list)

router.post('/updateFileRecord', verifyAccessTokenAdmin, Controller.updateFileRecord)

router.post('/deleteFileRecord', verifyAccessTokenAdmin, Controller.deleteFileRecord)

router.post('/processPurchaseFile', verifyAccessTokenAdmin, Controller.processPurchaseFile)

router.post('/processCustomerFile', verifyAccessTokenAdmin, Controller.processCustomerFile)

router.post('/processSupplierFile', verifyAccessTokenAdmin, Controller.processSupplierFile)

router.post('/processCusSpectacleFile', verifyAccessTokenAdmin, Controller.processCusSpectacleFile)

router.post('/processCusContactFile', verifyAccessTokenAdmin, Controller.processCusContactFile)

router.post('/processBillMaster', verifyAccessTokenAdmin, Controller.processBillMaster)
router.post('/processBillDetail', verifyAccessTokenAdmin, Controller.processBillDetail)

module.exports = router