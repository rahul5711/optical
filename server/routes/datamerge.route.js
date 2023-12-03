const express = require('express')
const router = express.Router()
const Controller = require('../controllers/datamerge.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/fetchSupplier', Controller.fetchSupplier)
router.post('/fetchShop', Controller.fetchShop)
router.post('/fetchMaster', Controller.fetchMaster)


module.exports = router
