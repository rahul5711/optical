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



module.exports = router