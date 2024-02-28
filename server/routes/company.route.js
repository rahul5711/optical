const express = require('express')
const router = express.Router()
const Controller = require('../controllers/company.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/create', verifyAccessTokenAdmin, Controller.create)
router.post('/getCompanyById', Controller.getCompanyById)
router.post('/user', Controller.getUser)
router.post('/updatePassword', Controller.updatePassword)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.post('/dropdownlist', Controller.dropdownlist)
router.post('/Deactivelist', verifyAccessTokenAdmin, Controller.Deactivelist)
router.post('/LoginHistory', verifyAccessTokenAdmin, Controller.LoginHistory)
router.post('/update', Controller.update)
router.post('/delete', Controller.delete)
router.post('/deactive', Controller.deactive)
router.post('/activecompany', Controller.activecompany)
router.post('/updateBarcodeSetting', verifyAccessTokenAdmin, Controller.updateBarcodeSetting)
router.post('/getBarcodeSettingByCompanyID', verifyAccessTokenAdmin, Controller.getBarcodeSettingByCompanyID)


// update company setting

router.post('/updatecompanysetting', Controller.updatecompanysetting)

// Regex search

router.post('/searchByFeild', verifyAccessTokenAdmin, Controller.searchByFeild)
router.post('/searchByFeildAdmin', verifyAccessTokenAdmin, Controller.searchByFeildAdmin)


// bill formate
router.post('/saveBillFormate', verifyAccessTokenAdmin, Controller.saveBillFormate)
router.post('/getBillFormateById', verifyAccessTokenAdmin, Controller.getBillFormateById)



// process product & product spec & specspttable

router.post('/processProduct', Controller.processProduct)

router.post('/processProductSpec', Controller.processProductSpec)

router.post('/processSpecSpt', Controller.processSpecSpt)

router.post('/processSupportData', Controller.processSupportData)


// Barcode and Invoice details

router.post('/barcodeDetails', Controller.barcodeDetails)
router.post('/invoiceDetails', Controller.invoiceDetails)


module.exports = router