const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID } = require('../helpers/helper_function')

var multer = require("multer")
var path = require("path")
var fs = require("fs")
var xlsx = require('node-xlsx')

module.exports = {
    saveFileRecord: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, originalname, fileName, download, path, destination, Type } = req.body

            if (ID !== null) return res.send({ message: "Invalid ID Data" })
            if (!originalname || originalname === undefined || originalname.trim() === "") return res.send({ message: "Invalid originalname Data" })
            if (!fileName || fileName === undefined || fileName.trim() === "") return res.send({ message: "Invalid fileName Data" })
            if (!download || download === undefined || download.trim() === "") return res.send({ message: "Invalid download Data" })
            if (!path || path === undefined || path.trim() === "") return res.send({ message: "Invalid path Data" })
            if (!destination || destination === undefined || destination.trim() === "") return res.send({ message: "Invalid destination Data" })
            if (!Type || Type === undefined || Type.trim() === "") return res.send({ message: "Invalid Type Data" })

            const save = await connection.query(`insert into files(CompanyID, ShopID, originalname, fileName, download,path,destination, Type, Process, PurchaseMaster, UniqueBarcode, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},'${originalname}','${fileName}','${download}','${path}','${destination}','${Type}',0,0,0,1,${LoggedOnUser},now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = []
            // connection.release()
            return res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    list: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { currentPage, itemsPerPage, Type } = req.body

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select * from files where CompanyID = ${CompanyID} and ShopID = ${shopid} and Type = '${Type}' order by id desc`

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`

            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    updateFileRecord: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, key, value, Type } = req.body

            if (ID === null || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (!key || key === undefined || key.trim() === "") return res.send({ message: "Invalid key Data" })
            if (!value || value === undefined || value.trim() === "") return res.send({ message: "Invalid value Data" })
            if (!Type || Type === undefined || Type.trim() === "") return res.send({ message: "Invalid Type Data" })

            const update = await connection.query(`update files set ${key} = ${value} where CompanyID = ${CompanyID} and ID = ${ID} and Type=${Type}`)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
            // connection.release()
            return res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    processPurchaseFile: async (req, res, next) => {
        try {

            const {

            } = req.body

            const filename = req.body.filename
            const originalname = req.body.originalname
            const fileLocation = req.body.path
            const fileDestination = req.body.destination



        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    }

}
