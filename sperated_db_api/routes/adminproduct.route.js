const express = require('express')
const router = express.Router()
const Controller = require('../controllers/adminproduct.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save',verifyAccessTokenAdmin, Controller.save)
router.post('/update',verifyAccessTokenAdmin, Controller.update)
router.post('/delete',verifyAccessTokenAdmin, Controller.delete)
router.post('/restore',verifyAccessTokenAdmin, Controller.restore)
router.post('/getList',verifyAccessTokenAdmin, Controller.getList)

router.post('/saveSpec',verifyAccessTokenAdmin, Controller.saveSpec)
router.post('/deleteSpec',verifyAccessTokenAdmin, Controller.deleteSpec)
router.post('/getSpec',verifyAccessTokenAdmin, Controller.getSpec)


//  product master

router.post('/getFieldList',verifyAccessTokenAdmin, Controller.getFieldList)
router.post('/getProductSupportData',verifyAccessTokenAdmin, Controller.getProductSupportData)
router.post('/saveProductSupportData',verifyAccessTokenAdmin, Controller.saveProductSupportData)



module.exports = router