const express = require('express')
const router = express.Router()
const Controller = require('../controllers/role.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin ,Controller.save)
router.post('/update', verifyAccessTokenAdmin ,Controller.update)
router.post('/delete', verifyAccessTokenAdmin ,Controller.delete)
router.post('/restore', verifyAccessTokenAdmin ,Controller.restore)
router.post('/getList', verifyAccessTokenAdmin ,Controller.getList)
router.post('/getRoleById', verifyAccessTokenAdmin ,Controller.getRoleById)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)

// update many

router.post('/roleUpdateMany', Controller.roleUpdateMany)

module.exports = router