const express = require('express')
const router = express.Router()
const Controller = require('../controllers/fitter.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/update', verifyAccessTokenAdmin, Controller.update)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/delete', verifyAccessTokenAdmin, Controller.delete)
router.get('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)
router.post('/getRateCard', verifyAccessTokenAdmin, Controller.getRateCard)
router.post('/getFitterById',verifyAccessTokenAdmin, Controller.getFitterById)
router.post('/saveRateCard',verifyAccessTokenAdmin, Controller.saveRateCard)
router.post('/deleteRateCard', verifyAccessTokenAdmin, Controller.deleteRateCard)
router.post('/saveFitterAssignedShop',verifyAccessTokenAdmin, Controller.saveFitterAssignedShop)

router.post('/deleteFitterAssignedShop', verifyAccessTokenAdmin, Controller.deleteFitterAssignedShop)

// Regex search

router.post('/searchByFeild',verifyAccessTokenAdmin, Controller.searchByFeild)


// fitter inoice

router.post('/getFitterInvoice',verifyAccessTokenAdmin, Controller.getFitterInvoice)
router.post('/saveFitterInvoice',verifyAccessTokenAdmin, Controller.saveFitterInvoice)
router.post('/getFitterInvoiceList',verifyAccessTokenAdmin, Controller.getFitterInvoiceList)
router.post('/getFitterInvoiceListByID',verifyAccessTokenAdmin, Controller.getFitterInvoiceListByID)


module.exports = router