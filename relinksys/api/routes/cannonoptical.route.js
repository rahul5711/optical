const express = require('express')
const router = express.Router()
const Controller = require('../controllers/cannonoptical.controller')

// user 

router.post('/user/login', Controller.login)
router.post('/user/create', Controller.create)
router.post('/user/update', Controller.update)
router.post('/user/changePassword', Controller.changePassword)
router.post('/user/userDeactivate', Controller.userDeactivate)
router.post('/user/permanentDelete', Controller.permanentDelete)
router.post('/user/getList', Controller.getList)
router.post('/user/getDataByID', Controller.getDataByID)
router.post('/user/searchByFeild', Controller.searchByFeild)

// customer
router.post('/customer/create', Controller.Ccreate)
router.post('/customer/update', Controller.Cupdate)
router.post('/customer/customerDeactivate', Controller.CcustomerDeactivate)
router.post('/customer/permanentDelete', Controller.CpermanentDelete)
router.post('/customer/getList', Controller.CgetList)
router.post('/customer/getDataByID', Controller.CgetDataByID)
router.post('/customer/searchByFeild', Controller.CsearchByFeild)


module.exports = router