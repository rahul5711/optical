const express = require('express')
const router = express.Router()
const Controller = require('../controllers/datamerge.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/fetchSupplier', verifyAccessTokenAdmin, Controller.fetchSupplier)
router.post('/fetchShop', verifyAccessTokenAdmin, Controller.fetchShop)
router.post('/fetchMaster', verifyAccessTokenAdmin, Controller.fetchMaster)
router.post('/fetchPurchaseDetail', verifyAccessTokenAdmin, Controller.fetchPurchaseDetail)

router.post('/fetchBillMaster', verifyAccessTokenAdmin, Controller.fetchBillMaster)
router.post('/fetchBillDetail', verifyAccessTokenAdmin, Controller.fetchBillDetail)


module.exports = router
