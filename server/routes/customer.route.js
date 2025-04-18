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

router.post('/searchByCustomerID', verifyAccessTokenAdmin, Controller.searchByCustomerID)

router.post('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)

router.post('/customerGSTNumber', verifyAccessTokenAdmin, Controller.customerGSTNumber)

router.post('/getMeasurementByCustomer', verifyAccessTokenAdmin, Controller.getMeasurementByCustomer)

router.post('/getMeasurementByCustomerForDropDown', verifyAccessTokenAdmin, Controller.getMeasurementByCustomerForDropDown)

router.post('/customerPowerPDF', verifyAccessTokenAdmin, Controller.customerPowerPDF)

router.post('/membershipCard', verifyAccessTokenAdmin, Controller.membershipCard)

router.post('/customerSearch', verifyAccessTokenAdmin, Controller.customerSearch)

// update power expiry date and visitDate
router.post('/updateExpiryAndVisitDate', verifyAccessTokenAdmin, Controller.updateExpiryAndVisitDate)
router.post('/updateVisitDateInContactLenRx', verifyAccessTokenAdmin, Controller.updateVisitDateInContactLenRx)


// eye report
router.post('/getEyeTestingReport', verifyAccessTokenAdmin, Controller.getEyeTestingReport)

router.post('/exportCustomerData', verifyAccessTokenAdmin, Controller.exportCustomerData)
router.post('/exportCustomerPower', verifyAccessTokenAdmin, Controller.exportCustomerPower)

// customer category

router.post('/saveCategory', verifyAccessTokenAdmin, Controller.saveCategory)
router.post('/getCategoryList', verifyAccessTokenAdmin, Controller.getCategoryList)
router.post('/deleteAllCategory', verifyAccessTokenAdmin, Controller.deleteAllCategory)
router.post('/getCustomerCategory', verifyAccessTokenAdmin, Controller.getCustomerCategory)




module.exports = router