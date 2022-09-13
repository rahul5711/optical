const express = require('express')
const router = express.Router()
const Controller = require('../controllers/company.controller')

router.post('/create', Controller.create)
router.post('/getCompanyById', Controller.getCompanyById)
router.post('/user', Controller.getUser)
router.post('/list', Controller.list)
router.post('/update', Controller.update)
router.post('/delete', Controller.delete)



module.exports = router