const express = require("express");
const _router = express.Router();
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const FileController = require('../controllers/file.Controller')

const imageStorageHelper = require('../helpers/diskStorageHelper/image.Storage')
const companyimageStorageHelper = require('../helpers/diskStorageHelper/companyimage.Storage')


_router.post("/upload", imageStorageHelper.storage.single("file"), FileController.upload);
_router.post("/companyimage", verifyAccessTokenAdmin, companyimageStorageHelper.storage.single("file"), FileController.companyimageupload);


module.exports = _router;
