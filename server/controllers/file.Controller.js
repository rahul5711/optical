var multer = require("multer")
var path = require("path")
var fs = require("fs")
// var xlsx = require('node-xlsx')
const createError = require('http-errors')

const dateObj = new Date()
const month = dateObj.getUTCMonth() + 1
const day = dateObj.getUTCDate()
const year = dateObj.getUTCFullYear();

module.exports = {


  upload: async (req, res, next) => {
    try {
      if (req.file == undefined) {
        return res.status(400).json({ message: "Please upload file!" });
      }
      return res.json({
        message: "Uploaded Successfully",
        file: req.file,
        fileName: req.file.filename,
        download: '/uploads/' + year + '/' + month + '/' + 'images/' + req.file.filename
      });

    } catch (error) {
      return next(error)
    }
  },
  companyimageupload: async (req, res, next) => {
    try {
      const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0

      if (req.file == undefined) {
        return res.status(400).json({ message: "Please upload file!" });
      }
      return res.json({
        message: "Uploaded Successfully",
        file: req.file,
        fileName: req.file.filename,
        download: '/uploads/' + year + '/' + month + '/' + CompanyID + '/' + 'images/' + req.file.filename
      });

    } catch (error) {
      return next(error)
    }
  },
  purchaseupload: async (req, res, next) => {
    try {
      const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0

      if (req.file == undefined) {
        return res.status(400).json({ message: "Please upload file!" });
      }
      return res.json({
        message: "Uploaded Successfully",
        file: req.file,
        fileName: req.file.filename,
        download: '/uploads/' + year + '/' + month + '/' + CompanyID + '/' + 'purchase/' + req.file.filename
      });

    } catch (error) {
      return next(error)
    }
  },


}