const express = require('express')
const router = express.Router()
const Controller = require('../controllers/login.controller')

router.post('/', Controller.login)



module.exports = router