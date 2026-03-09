const express = require('express')
const router = express.Router()
const Controller = require('../controllers/ecom.controller')
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const { dbConnection } = require('../helpers/helper_function')



router.post('/save', verifyAccessTokenAdmin, dbConnection, Controller.save)
router.post('/getList', verifyAccessTokenAdmin, dbConnection, Controller.getList)
router.post('/getDataByID', verifyAccessTokenAdmin, dbConnection, Controller.getDataByID)
router.get('/getProductForWebSite', Controller.getProductForWebSite)
router.post('/getProductForWebSiteFilter', Controller.getProductForWebSiteFilter)
router.get('/getDataByPincode/:pincode', Controller.getDataByPincode)
router.post('/saveOrUpdateShipmentRate', verifyAccessTokenAdmin, dbConnection, Controller.saveOrUpdateShipmentRate)
router.get('/shipmentRate', verifyAccessTokenAdmin, dbConnection, Controller.getShipmentRate);

router.post("/signup", Controller.signup);
router.post("/login", Controller.login);
router.get('/getUserDataByID', Controller.getUserDataByID);


// add to cart

router.post("/manageCart", Controller.manageCart);
router.post("/saveOrder", Controller.saveOrder);
router.post("/cancelOrder", Controller.cancelOrder);
router.post("/returnOrder", Controller.returnOrder);
router.post("/getOrderDetail", Controller.getOrderDetail);

// company

router.post("/getOrderList", verifyAccessTokenAdmin, dbConnection, Controller.getOrderList);
router.post("/getOrderDetailByID", verifyAccessTokenAdmin, dbConnection, Controller.getOrderDetailByID);



module.exports = router