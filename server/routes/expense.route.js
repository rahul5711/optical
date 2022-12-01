const express = require('express')
const router = express.Router()
const Controller = require('../controllers/expense.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin ,Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete',verifyAccessTokenAdmin, Controller.delete)
router.post('/getById',verifyAccessTokenAdmin, Controller.getById)
router.post('/update',verifyAccessTokenAdmin, Controller.update)

// Regex search
router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)

module.exports = router