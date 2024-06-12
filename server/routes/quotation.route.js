const express = require('express')
const router = express.Router()
const Controller = require('../controllers/quotation.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/create', verifyAccessTokenAdmin, Controller.create)
router.post('/update', verifyAccessTokenAdmin, Controller.update)
router.post('/getPurchaseById', verifyAccessTokenAdmin, Controller.getPurchaseById)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.post('/deleteProduct', verifyAccessTokenAdmin, Controller.deleteProduct)

module.exports = router