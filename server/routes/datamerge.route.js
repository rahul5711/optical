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
router.post('/fetchBillDetailPreOrder', verifyAccessTokenAdmin, Controller.fetchBillDetailPreOrder)
router.post('/fetchBillDetailManual', verifyAccessTokenAdmin, Controller.fetchBillDetailManual)
router.post('/fetchBillDetailStock', verifyAccessTokenAdmin, Controller.fetchBillDetailStock)

router.post('/fetchChargeMaster', verifyAccessTokenAdmin, Controller.fetchChargeMaster)
router.post('/savePurchaseCharge', verifyAccessTokenAdmin, Controller.saveChargeMaster)
router.post('/fetchServiceMaster', verifyAccessTokenAdmin, Controller.fetchServiceMaster)
router.post('/saveBillService', verifyAccessTokenAdmin, Controller.saveServiceMaster)
router.post('/saveTransferMaster', verifyAccessTokenAdmin, Controller.saveTransferMaster)
router.post('/fetchExpense', verifyAccessTokenAdmin, Controller.fetchExpense)


module.exports = router
