const express = require('express')
const router = express.Router()
const Controller = require('../controllers/shop.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.get('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)
router.post('/delete',verifyAccessTokenAdmin, Controller.delete)
router.post('/restore',verifyAccessTokenAdmin, Controller.restore)
router.post('/getShopById',verifyAccessTokenAdmin, Controller.getShopById)
router.post('/update',verifyAccessTokenAdmin, Controller.update)




module.exports = router