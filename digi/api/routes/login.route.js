const express = require('express')
const router = express.Router()
const Controller = require('../controllers/login.controller')

router.post('/', Controller.login)
router.post('/companylogin', Controller.companylogin)



module.exports = router