const express = require('express')
const router = express.Router()
const Controller = require('../controllers/shahoptical.controller')

router.post('/login',Controller.login)
router.post('/create',Controller.create)
router.post('/update',Controller.update)
router.post('/changePassword',Controller.changePassword)
router.post('/userDeactivate',Controller.userDeactivate)
router.post('/permanentDelete',Controller.permanentDelete)
router.post('/getList',Controller.getList)
router.post('/getDataByID',Controller.getDataByID)
router.post('/searchByFeild',Controller.searchByFeild)

module.exports = router