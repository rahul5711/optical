const express = require('express')
const router = express.Router()
const Controller = require('../controllers/purchase.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/create', verifyAccessTokenAdmin, Controller.create)
router.post('/getPurchaseById', verifyAccessTokenAdmin, Controller.getPurchaseById)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.post('/deleteProduct', verifyAccessTokenAdmin, Controller.deleteProduct)
router.post('/deleteCharge', verifyAccessTokenAdmin, Controller.deleteCharge)


// Regex search

router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)

module.exports = router