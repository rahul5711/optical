const express = require('express')
const router = express.Router()
const Controller = require('../controllers/supplier.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/update', verifyAccessTokenAdmin, Controller.update)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.post('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)
router.post('/dropdownlistForPreOrder', verifyAccessTokenAdmin, Controller.dropdownlistForPreOrder)
router.post('/getSupplierById',verifyAccessTokenAdmin, Controller.getSupplierById)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)

module.exports = router