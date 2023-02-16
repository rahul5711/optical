const express = require("express");
const _router = express.Router();
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const FileController = require('../controllers/file.Controller')

const imageStorageHelper = require('../helpers/diskStorageHelper/image.Storage')
const companyimageStorageHelper = require('../helpers/diskStorageHelper/companyimage.Storage')
const purchaseStorageHelper = require('../helpers/diskStorageHelper/purchase.Storage')


_router.post("/upload", imageStorageHelper.storage.single("file"), FileController.upload);
_router.post("/companyimage", verifyAccessTokenAdmin, companyimageStorageHelper.storage.single("file"), FileController.companyimageupload);
_router.post("/purchase", verifyAccessTokenAdmin, companyimageStorageHelper.storage.single("file"), FileController.purchaseupload);


module.exports = _router;
