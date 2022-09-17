const express = require('express')
const router = express.Router()
const Controller = require('../controllers/product.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', Controller.save)
router.post('/update', Controller.update)
router.post('/delete', Controller.delete)
router.post('/restore', Controller.restore)
router.get('/getList', Controller.getList)

module.exports = router