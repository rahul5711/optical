const express = require('express')
const router = express.Router()
const Controller = require('../controllers/product.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', Controller.save)
router.post('/update', Controller.update)
router.post('/delete', Controller.delete)
router.post('/restore', Controller.restore)
router.get('/getList', Controller.getList)

router.post('/saveSpec', Controller.saveSpec)
router.post('/deleteSpec', Controller.deleteSpec)
router.post('/getSpec', Controller.getSpec)


module.exports = router