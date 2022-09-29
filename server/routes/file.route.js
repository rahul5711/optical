const express = require("express");
const _router = express.Router();
const { verifyAccessTokenAdmin } = require('../helpers/jwt_helper');
const FileController = require('../controllers/file.Controller')

const imageStorageHelper = require('../helpers/diskStorageHelper/image.Storage')


_router.post("/upload", imageStorageHelper.storage.single("file"), FileController.upload);


module.exports = _router;
