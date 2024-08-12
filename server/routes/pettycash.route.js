const express = require('express')
const router = express.Router()
const Controller = require('../controllers/pettycash.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin ,Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete',verifyAccessTokenAdmin, Controller.delete)
router.post('/getById',verifyAccessTokenAdmin, Controller.getById)
router.post('/update',verifyAccessTokenAdmin, Controller.update)
router.post('/getPettyCashBalance',verifyAccessTokenAdmin, Controller.getPettyCashBalance)
router.post('/getCashCounterCashBalance',verifyAccessTokenAdmin, Controller.getCashCounterCashBalance)

// Regex search
router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/pettyCashReport',verifyAccessTokenAdmin, Controller.pettyCashReport)
router.post('/pettyCashOpeningClosingReport',verifyAccessTokenAdmin, Controller.pettyCashOpeningClosingReport)

module.exports = router