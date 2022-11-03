const express = require('express')
const router = express.Router()
const Controller = require('../controllers/doctor.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');

router.post('/save', verifyAccessTokenAdmin, Controller.save)
router.post('/list', verifyAccessTokenAdmin, Controller.list)
router.get('/dropdownlist', verifyAccessTokenAdmin, Controller.dropdownlist)
router.post('/delete',verifyAccessTokenAdmin, Controller.delete)
router.post('/getDoctorById',verifyAccessTokenAdmin, Controller.getDoctorById)
router.post('/update',verifyAccessTokenAdmin, Controller.update)




module.exports = router