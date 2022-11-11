const express = require('express')
const router = express.Router()
const Controller = require('../controllers/company.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/create', Controller.create)
router.post('/getCompanyById', Controller.getCompanyById)
router.post('/user', Controller.getUser)
router.post('/updatePassword', Controller.updatePassword)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/LoginHistory', verifyAccessTokenAdmin, Controller.LoginHistory)
router.post('/update', Controller.update)
router.post('/delete', Controller.delete)


// update company setting

router.post('/updatecompanysetting', Controller.updatecompanysetting)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/searchByFeildAdmin',verifyAccessTokenAdmin, Controller.searchByFeildAdmin)




module.exports = router