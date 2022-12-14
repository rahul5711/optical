const express = require('express')
const router = express.Router()
const Controller = require('../controllers/customer.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');


router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.post('/restore', verifyAccessTokenAdmin, Controller.restore)
router.post('/getCustomerById',verifyAccessTokenAdmin, Controller.getCustomerById)
router.post('/deleteSpec', verifyAccessTokenAdmin, Controller.deleteSpec)

router.post('/update',verifyAccessTokenAdmin, Controller.update)


// Regex search

router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)


module.exports = router