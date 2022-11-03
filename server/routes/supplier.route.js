const express = require('express')
const router = express.Router()
const Controller = require('../controllers/supplier.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/update', verifyAccessTokenAdmin, Controller.update)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.get('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)
router.post('/getSupplierById',verifyAccessTokenAdmin, Controller.getSupplierById)



module.exports = router