const express = require('express')
const router = express.Router()
const Controller = require('../controllers/employee.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save',verifyAccessTokenAdmin, Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete',verifyAccessTokenAdmin, Controller.delete)
router.post('/restore',verifyAccessTokenAdmin, Controller.restore)
router.post('/getUserById',verifyAccessTokenAdmin, Controller.getUserById)
router.post('/update',verifyAccessTokenAdmin, Controller.update)
router.post('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)
router.post('/LoginHistory', verifyAccessTokenAdmin, Controller.LoginHistory)
router.post('/LoginHistoryFilter', verifyAccessTokenAdmin, Controller.LoginHistoryFilter)
router.post('/updatePassword', verifyAccessTokenAdmin, Controller.updatePassword)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/searchByFeildCompanyAdmin',verifyAccessTokenAdmin, Controller.searchByFeildCompanyAdmin)




module.exports = router