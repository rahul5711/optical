const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
var moment = require("moment");
const { shopID } = require('../helpers/helper_function')
const Mail = require('../services/mail');
const cron = require('node-cron');
const ExcelJS = require('exceljs');
var path = require("path")
var fs = require("fs")
const axios = require('axios');
const clientConfig = require("../helpers/constants");

let dbCache = {}; // Cache for storing database instances

async function dbConnection(CompanyID) {
    // Check if the database instance is already cached
    if (dbCache[CompanyID]) {
        return dbCache[CompanyID];
    }

    // Fetch database connection
    const db = await dbConfig.dbByCompanyID(CompanyID);

    if (db.success === false) {
        return db;
    }
    // Store in cache
    dbCache[CompanyID] = db;
    return db;
}

async function extractEmailsAsString(data) {
    return data.map(item => item.email).join(', ');
}

module.exports = {
    getBirthDayReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { type, dateType } = req.body;
            if (!type || type === undefined || type === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let qry = ``

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and ShopID = ${shopid}`
            }

            let date = moment(new Date()).format("MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            if (type === 'Customer') {
                qry = `select Name, MobileNo1, DOB, Title, Email, ShopID from customer where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}' ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, DOB, Email, ShopID from supplier where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, DOB, Email, ShopID from user where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, DOB, Email, ShopID from doctor where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, DOB, Email, ShopID from fitter where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }

            const [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }


            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getAnniversaryReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { type, dateType } = req.body;
            if (!type || type === undefined || type === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            let qry = ``

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and ShopID = ${shopid}`
            }

            let date = moment(new Date()).format("MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            if (type === 'Customer') {
                qry = `select Name, MobileNo1, Anniversary, Title, Email, ShopID from customer where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d')  = '${date}'  ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, Anniversary, Email, ShopID from supplier where status = 1 and CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, Anniversary, Email, ShopID from user where status = 1 and CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, Anniversary, Email, ShopID from doctor where status = 1 and CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, Anniversary, Email, ShopID from fitter where status = 1 and CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }

            const [fetchCompanySetting] = await connection.query(`select IsAnniversaryReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsAnniversaryReminder === true || fetchCompanySetting[0].IsAnniversaryReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }

            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getCustomerOrderPending: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shopId = ``

            if (shopid !== 0) {
                shopId = `and billmaster.ShopID = ${shopid}`
            }

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            let qry = `select billmaster.InvoiceNo, customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.DeliveryDate, billmaster.ShopID  from billmaster left join customer on customer.ID = billmaster.CustomerID where billmaster.CompanyID = ${CompanyID} ${shopId} and billmaster.Status = 1 and billmaster.ProductStatus = 'Pending' and DATE_FORMAT(billmaster.DeliveryDate, '%Y-%m-%d') = '${date}'`

            const [fetchCompanySetting] = await connection.query(`select IsCustomerOrderPendingReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsCustomerOrderPendingReminder === true || fetchCompanySetting[0].IsCustomerOrderPendingReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getEyeTestingReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shopId = ``

            if (shopid !== 0) {
                shopId = `and customer.ShopID = ${shopid}`
            }

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            let qry = `select customer.Title, customer.Name, customer.MobileNo1, customer.Email, customer.ShopID, spectacle_rx.ExpiryDate  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID where spectacle_rx.CompanyID = ${CompanyID} ${shopId} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${date}'`


            const [fetchCompanySetting] = await connection.query(`select IsEyeTesingReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsEyeTesingReminder === true || fetchCompanySetting[0].IsEyeTesingReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getFeedBackReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            const [companysetting] = await connection.query(`select ID, FeedbackDate, IsComfortFeedBackReminder from companysetting where CompanyID = ${CompanyID}`)

            let feedbackDays = Number(companysetting[0]?.FeedbackDate) || 0
            let shopId = ``
            if (shopid !== 0) {
                shopId = `and customer.ShopID = ${shopid}`
            }

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            let qry = `select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.ShopID, COALESCE(NULLIF(billmaster.OrderDate,'0000-00-00'), NULLIF(billmaster.OrderDate,'0000-00-00 00:00:00'), billmaster.BillDate) AS BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') ${shopId} AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${date}', INTERVAL ${feedbackDays} DAY)`


            if (!companysetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (companysetting[0].IsComfortFeedBackReminder === true || companysetting[0].IsComfortFeedBackReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }

            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            console.log(error);
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getServiceMessageReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            const [companysetting] = await connection.query(`select ID, ServiceDate, IsServiceReminder from companysetting where CompanyID = ${CompanyID}`)


            let serviceDays = Number(companysetting[0]?.ServiceDate) || 0
            let shopId = ``

            if (shopid !== 0) {
                shopId = `and customer.ShopID = ${shopid}`
            }

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            let qry = `select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, COALESCE(NULLIF(billmaster.OrderDate,'0000-00-00'), NULLIF(billmaster.OrderDate,'0000-00-00 00:00:00'), billmaster.BillDate) AS BillDate, customer.Email, billmaster.ShopID from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  ${shopId} AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${date}', INTERVAL ${serviceDays} DAY)`


            // console.log(qry);


            if (!companysetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (companysetting[0].IsServiceReminder === true || companysetting[0].IsServiceReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }

            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getSolutionExpiryReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { type, dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            if (!type || type === undefined || type === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shopId = 0

            if (shopid !== 0) {
                shopId = shopid
            }

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            let qry = ``

            if (type === "Customer") {
                qry = `select customer.Title, customer.Name, customer.MobileNo1, billdetail.ProductExpDate, customer.Email, billmaster.ShopID from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'SOLUTION' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`
            } else if (type === "Supplier") {
                qry = `select supplier.Name, supplier.MobileNo1, purchasedetailnew.ProductExpDate, supplier.Email,purchasemasternew.ShopID  from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID left join supplier on supplier.ID = purchasemasternew.SupplierID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'SOLUTION' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }



            const [fetchCompanySetting] = await connection.query(`select IsSolutionExpiryReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsSolutionExpiryReminder === true || fetchCompanySetting[0].IsSolutionExpiryReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }

            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getContactLensExpiryReminder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { type, dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            if (!type || type === undefined || type === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shopId = 0

            if (shopid !== 0) {
                shopId = shopid
            }

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            let qry = ``

            if (type === "Customer") {
                qry = `select customer.Title, customer.Name, customer.MobileNo1, billdetail.ProductExpDate, customer.Email, billmaster.ShopID from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`
            } else if (type === "Supplier") {
                qry = `select supplier.Name, supplier.MobileNo1, purchasedetailnew.ProductExpDate, supplier.Email,purchasemasternew.ShopID from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID left join supplier on supplier.ID = purchasemasternew.SupplierID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'CONTACT LENS' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }

            const [fetchCompanySetting] = await connection.query(`select IsContactLensExpiryReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsContactLensExpiryReminder === true || fetchCompanySetting[0].IsContactLensExpiryReminder === "true") {
                const [datum] = await connection.query(qry);
                response.data = datum || []
            } else {
                response.data = []
            }

            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    sendWpMessage: async (req, res, next) => {
        let connection;
        try {

            // const response = { data: null, success: true, message: "" }

            const { CustomerName, MobileNo1, ShopName, ShopMobileNumber, ImageUrl, Type, FileName, ShopID } = req.body;

            // ✅ Validate body parameters
            if (!CustomerName || !MobileNo1 || !ShopName || !ShopMobileNumber || !Type || !ShopID) {
                return res.send({
                    success: false,
                    message: "Missing required fields: CustomerName, MobileNo1, ShopName, ShopMobileNumber, Type, ShopID"
                });
            }

            // ✅ Validate MobileNo1 (must be at least 10 digits)
            if (!/^\d{10,}$/.test(MobileNo1)) {
                return res.send({
                    success: false,
                    message: "MobileNo1 must be at least 10 digits"
                });
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            let sendMessage = await sendWhatsAppTextMessageNew({ CustomerName: CustomerName, Mobile: MobileNo1, ShopName: ShopName, ShopMobileNumber: ShopMobileNumber, ImageUrl: ImageUrl, Type: Type, FileName, ShopID })

            return res.send(sendMessage)

        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    sendCustomerCreditNoteWpMessage: async (req, res, next) => {
        let connection;
        try {

            // const response = { data: null, success: true, message: "" }

            const { CustomerName, MobileNo1, ShopName, ShopMobileNumber, ImageUrl, Type, FileName, ShopID, CustomerCreditNumber, CustomerCreditAmount } = req.body;

            // ✅ Validate body parameters
            if (!CustomerName || !MobileNo1 || !ShopName || !ShopMobileNumber || !Type || !ShopID || !CustomerCreditNumber || !CustomerCreditAmount) {
                return res.send({
                    success: false,
                    message: "Missing required fields: CustomerName, MobileNo1, ShopName, ShopMobileNumber, Type, ShopID, CustomerCreditNumber, CustomerCreditAmount"
                });
            }

            // ✅ Validate MobileNo1 (must be at least 10 digits)
            if (!/^\d{10,}$/.test(MobileNo1)) {
                return res.send({
                    success: false,
                    message: "MobileNo1 must be at least 10 digits"
                });
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            let sendMessage = await sendCustomerCreditNoteWhatsAppTextMessageNew({ CustomerName: CustomerName, Mobile: MobileNo1, ShopName: ShopName, ShopMobileNumber: ShopMobileNumber, ImageUrl: ImageUrl, Type: Type, FileName, CustomerCreditNumber, CustomerCreditAmount, ShopID })

            return res.send(sendMessage)

        } catch (error) {
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getReminderCount: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: {
                    TotalCount: 0,
                    BirthDayReminder: 0,
                    AnniversaryReminder: 0,
                    CustomerOrderPending: 0,
                    EyeTestingReminder: 0,
                    FeedBackReminder: 0,
                    ServiceMessageReminder: 0,
                    SolutionExpiryReminder: 0,
                    ContactLensExpiryReminder: 0
                }, success: true, message: ""
            }

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            // const CompanyID = 1
            // const shopid = 1

            const [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder,IsAnniversaryReminder,IsCustomerOrderPendingReminder,IsEyeTesingReminder,IsSolutionExpiryReminder,IsContactLensExpiryReminder,IsComfortFeedBackReminder,IsServiceReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {
                response.data.BirthDayReminder = await getBirthDayReminderCount(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsAnniversaryReminder === true || fetchCompanySetting[0].IsAnniversaryReminder === "true") {
                response.data.AnniversaryReminder = await getAnniversaryReminder(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsCustomerOrderPendingReminder === true || fetchCompanySetting[0].IsCustomerOrderPendingReminder === "true") {
                response.data.CustomerOrderPending = await getCustomerOrderPending(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsEyeTesingReminder === true || fetchCompanySetting[0].IsEyeTesingReminder === "true") {
                response.data.EyeTestingReminder = await getEyeTestingReminder(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsSolutionExpiryReminder === true || fetchCompanySetting[0].IsSolutionExpiryReminder === "true") {
                response.data.SolutionExpiryReminder = await getSolutionExpiryReminder(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsContactLensExpiryReminder === true || fetchCompanySetting[0].IsContactLensExpiryReminder === "true") {
                response.data.ContactLensExpiryReminder = await getContactLensExpiryReminder(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsComfortFeedBackReminder === true || fetchCompanySetting[0].IsComfortFeedBackReminder === "true") {
                response.data.FeedBackReminder = await getFeedBackReminder(CompanyID, shopid, db);
            }
            if (fetchCompanySetting[0].IsServiceReminder === true || fetchCompanySetting[0].IsServiceReminder === "true") {
                response.data.ServiceMessageReminder = await getServiceMessageReminder(CompanyID, shopid, db);
            }

            response.data.TotalCount = response.data.BirthDayReminder + response.data.AnniversaryReminder + response.data.CustomerOrderPending + response.data.ContactLensExpiryReminder + response.data.SolutionExpiryReminder + response.data.EyeTestingReminder + response.data.FeedBackReminder + response.data.ServiceMessageReminder;
            response.message = "data fetch successfully"
            return res.send(response)
        } catch (error) {
            next(error);
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    }

}


async function getContactLensExpiryReminder(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }

        connection = await db.getConnection();


        let dateType = "today"
        let shopId = ``
        if (shopid !== 0) {
            shopId = shopid
        }
        let date = moment(new Date()).format("YYYY-MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("YYYY-MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let [Customer_qry] = await connection.query(`select billdetail.ID from billdetail where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`)
        let [Supplier_qry] = await connection.query(`select purchasedetailnew.ID from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'CONTACT LENS' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`)
        response = Customer_qry.length + Supplier_qry.length
        return response
    } catch (error) {
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getSolutionExpiryReminder(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"
        let shopId = ``
        if (shopid !== 0) {
            shopId = shopid
        }
        let date = moment(new Date()).format("YYYY-MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("YYYY-MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let [Customer_qry] = await connection.query(`select billdetail.ID  from billdetail left join billmaster on billmaster.ID = billdetail.BillID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'SOLUTION' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`)
        let [Supplier_qry] = await connection.query(`select purchasedetailnew.ID from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'SOLUTION' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`)
        response = Customer_qry.length + Supplier_qry.length
        return response
    } catch (error) {
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getBirthDayReminderCount(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"
        let shopId = ``
        if (shopid !== 0) {
            shopId = `and ShopID = ${shopid}`
        }
        let date = moment(new Date()).format("MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let [Customer_qry] = await connection.query(`select ID from customer where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}' ${shopId}`)
        let [Supplier_qry] = await connection.query(`select ID from supplier where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
        let [Employee_qry] = await connection.query(`select ID from user where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
        let [Doctor_qry] = await connection.query(`select ID from doctor where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
        let [Fitter_qry] = await connection.query(`select ID from fitter where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
        response = Customer_qry.length + Supplier_qry.length + Employee_qry.length + Doctor_qry.length + Fitter_qry.length
        return response
    } catch (error) {
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getAnniversaryReminder(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"
        let shopId = ``
        if (shopid !== 0) {
            shopId = `and ShopID = ${shopid}`
        }
        let date = moment(new Date()).format("MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let [Customer_qry] = await connection.query(`select ID from customer where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}' ${shopId}`)
        let [Supplier_qry] = await connection.query(`select ID from supplier where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        let [Employee_qry] = await connection.query(`select ID from user where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        let [Doctor_qry] = await connection.query(`select ID from doctor where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        let [Fitter_qry] = await connection.query(`select ID from fitter where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        response = Customer_qry.length + Supplier_qry.length + Employee_qry.length + Doctor_qry.length + Fitter_qry.length
        return response
    } catch (error) {
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getCustomerOrderPending(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"
        let shopId = ``
        if (shopid !== 0) {
            shopId = `and billmaster.ShopID = ${shopid}`
        }
        let date = moment(new Date()).format("YYYY-MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("YYYY-MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let qry = `select billmaster.ID from billmaster where billmaster.CompanyID = ${CompanyID} ${shopId} and billmaster.Status = 1 and billmaster.ProductStatus = 'Pending' and DATE_FORMAT(billmaster.DeliveryDate, '%Y-%m-%d') = '${date}'`
        let [data] = await connection.query(qry);
        response = data.length;
        return response
    } catch (error) {
        console.log(error);
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getEyeTestingReminder(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"
        let shopId = ``
        if (shopid !== 0) {
            shopId = `and customer.ShopID = ${shopid}`
        }

        let date = moment(new Date()).format("YYYY-MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("YYYY-MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let qry = `select customer.Title, customer.Name, customer.MobileNo1, ExpiryDate  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID where spectacle_rx.CompanyID = ${CompanyID} ${shopId} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${date}'`

        let [data] = await connection.query(qry);
        response = data.length;
        return response
    } catch (error) {
        console.log(error);
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getFeedBackReminder(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"

        const [companysetting] = await connection.query(`select ID, FeedbackDate from companysetting where CompanyID = ${CompanyID}`)


        let feedbackDays = Number(companysetting[0]?.FeedbackDate) || 0
        let shopId = ``
        if (shopid !== 0) {
            shopId = `and customer.ShopID = ${shopid}`
        }

        let date = moment(new Date()).format("YYYY-MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("YYYY-MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let qry = `select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, COALESCE(NULLIF(billmaster.OrderDate,'0000-00-00'), NULLIF(billmaster.OrderDate,'0000-00-00 00:00:00'), billmaster.BillDate) AS BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') ${shopId} AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${date}', INTERVAL ${feedbackDays} DAY)`

        // AND DATE(COALESCE(NULLIF(billmaster.OrderDate,'0000-00-00'),NULLIF(billmaster.OrderDate,'0000-00-00 00:00:00'),billmaster.BillDate)) = DATE_SUB('${date}', INTERVAL ${feedbackDays} DAY)


        let [data] = await connection.query(qry);
        response = data.length;
        return response
    } catch (error) {
        console.log(error);
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getServiceMessageReminder(CompanyID, shopid, db) {
    let response = 0;
    let connection;
    try {
        // const db = await dbConfig.dbByCompanyID(CompanyID);
        // const db = req.db;
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        let dateType = "today"

        const [companysetting] = await connection.query(`select ID, ServiceDate from companysetting where CompanyID = ${CompanyID}`)


        let serviceDays = Number(companysetting[0]?.ServiceDate) || 0
        let shopId = ``

        if (shopid !== 0) {
            shopId = `and customer.ShopID = ${shopid}`
        }

        let date = moment(new Date()).format("YYYY-MM-DD")

        if (dateType === 'today') {
            date = moment(new Date()).format("YYYY-MM-DD");
        } else if (dateType === 'tomorrow') {
            date = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
        } else if (dateType === 'yesterday') {
            date = moment(new Date()).add(-1, 'days').format("YYYY-MM-DD");
        } else {
            return res.send({ message: "Invalid Query dateType Data" })
        }

        let qry = `select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, COALESCE(NULLIF(billmaster.OrderDate,'0000-00-00'), NULLIF(billmaster.OrderDate,'0000-00-00 00:00:00'), billmaster.BillDate) AS BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  ${shopId} AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${date}', INTERVAL ${serviceDays} DAY)`


        let [data] = await connection.query(qry);
        response = data.length;
        return response
    } catch (error) {
        console.log(error);
        return response
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

// CRON Function

const fetchCompanyExpiry = async () => {
    try {
        const [fetch] = await mysql2.pool.query(`SELECT Name, Email, EffectiveDate, CancellationDate FROM company WHERE status = 1 AND CancellationDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 5 DAY)`);

        console.log(JSON.stringify(fetch));
        console.log(fetch.length);

        if (fetch.length) {
            for (let item of fetch) {
                const mainEmail = `${item.Email}`
                // const mainEmail = `relinksys@gmail.com`
                const mailSubject = `Reminder: Your Server Plan Expiry mail`
                const mailTemplate = ` Your data is at risk. Please renew today !  Your Server Plan Expired In Next  differenceDay  Days. <strong>Thanks for your Business</strong> 
 
  <div style="position: relative; width: 100%; max-width: 100%; display: flex; flex-wrap: wrap; align-items: center; padding: 10px; margin: auto; box-sizing: border-box;">
  <div style="flex: 1 1 100%; max-width: 240px; padding-right: 2%; border-right: 2px solid #000; display: flex; justify-content: center; box-sizing: border-box; align-items: center;">
    <img src="https://theopticalguru.relinksys.com/assest/relinksyslogo.png" alt="LOGO" style="width: 100%; max-width: 200px; height: auto; padding-top: 4%;" />
  </div>

  <div style="flex: 1 1 100%; max-width: 400px; padding-left: 2%; box-sizing: border-box;">
    <h2 style="margin: 0; padding-top: 2%; font-size: 1.5rem;">
      <span style="color: rgb(243, 113, 53); font-weight: bold;">Relinksys Software Pvt. Ltd.</span>
    </h2>
    <h4 style="margin: 0; font-size: 1rem;">
      <span>Branch: Pune</span><br>
      <span>Mob: 9766666248 / 9130366248</span><br>
      <span>Web: <a href="https://www.relinksys.com" target="_blank">www.relinksys.com</a></span>
    </h4>

    <hr style="margin: 5px 0; border-color: rgb(243, 113, 53);">

    <div>
      <h4 style="margin: 0; font-size: 1rem;">Follow:</h4>
      <a href="https://www.facebook.com/relinksys" target="_blank">
        <img src="https://cdn-icons-png.freepik.com/256/13051/13051733.png?uid=R197419144&ga=GA1.1.1547618945.1741080986&semt=ais_hybrid" alt="F" style="width: 24px; margin-right: 10px;" />
      </a>
      <a href="https://www.instagram.com/relinksys/" target="_blank">
        <img src="https://cdn-icons-png.freepik.com/256/2111/2111463.png?uid=R197419144&ga=GA1.1.1547618945.1741080986&semt=ais_hybrid" alt="I" style="width: 24px; margin-right: 10px;" />
      </a>
      <a href="https://www.facebook.com/Bestopticalsoftware" target="_blank">
        <img src="https://cdn-icons-png.freepik.com/256/13051/13051733.png?uid=R197419144&ga=GA1.1.1547618945.1741080986&semt=ais_hybrid" alt="F" style="width: 24px;" />
      </a>
    </div>
  </div>
</div>

<style>
  @media (max-width: 768px) {
    div[style*="width: 100%; max-width: 1200px"] {
      flex-direction: column;
      text-align: center;
    }

    div[style*="width: 100%; max-width: 1200px"] > div {
      flex: 1 1 100%;
      max-width: 100%;
      padding: 10px 0;
      border-right: none;
    }

   div[style*="width: 100%; max-width: 1200px"] > div img {
      width: 40px; /* Adjusted for mobile */
      max-width: 40px;
      padding-top: 2%;
    }
  }
</style>`
                const attachment = null
                const ccEmail = 'opticalguruindia@gmail.com'
                const emailData = await { to: mainEmail, cc: ccEmail, subject: mailSubject, body: mailTemplate, attachments: attachment }
                console.log(emailData, "emailData");

                await Mail.sendMailForOwn(emailData, (err, resp) => {
                    if (!err) {
                        console.log({ success: true, message: 'Mail Sent Successfully' })
                    } else {
                        console.log({ success: false, message: 'Failed to send mail' })
                    }
                })
            }
        }

        console.log("Company Expiry Auto Mail sent process done");


    } catch (error) {
        console.log(error);
    }
}

const auto_mail = async () => {
    let connection;
    try {
        const [company] = await mysql2.pool.query(`select ID, Name from company where status = 1 and EmailMsg = "true"`);

        let date = moment(new Date()).format("MM-DD")
        let service_date = moment(new Date()).format("YYYY-MM-DD")

        if (company.length) {
            for (let data of company) {
                const db = await dbConnection(data.ID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();

                let CompanyID = data.ID

                let [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder, IsAnniversaryReminder, EmailSetting, ServiceDate, IsServiceReminder, FeedbackDate, IsComfortFeedBackReminder, IsEyeTesingReminder, IsSolutionExpiryReminder, IsContactLensExpiryReminder from companysetting where CompanyID = ${CompanyID}`);

                if (!fetchCompanySetting.length) {
                    return res.send({ success: false, message: "Company Setting not found." })
                }

                let Template = JSON.parse(fetchCompanySetting[0]?.EmailSetting) || []
                if (!Template.length) {
                    console.log("Mail Template not found");
                    continue
                }

                // console.log(Template);


                let datum = []
                let serviceDays = Number(fetchCompanySetting[0]?.ServiceDate) || 0
                let feedbackDays = Number(fetchCompanySetting[0]?.FeedbackDate) || 0

                if (fetchCompanySetting[0].IsAnniversaryReminder === true || fetchCompanySetting[0].IsAnniversaryReminder === "true") {
                    const [qry] = await connection.query(`select Name, MobileNo1, Anniversary, Title, Email, ShopID, 'Customer_Anniversary' as Type, 'Anniversary' as MailSubject from customer where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {
                    const [qry] = await connection.query(`select Name, MobileNo1, DOB, Title, Email, ShopID, 'Customer_Birthday' as Type, 'BirthDay' as MailSubject from customer where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsServiceReminder === true || fetchCompanySetting[0].IsServiceReminder === "true") {
                    const [qry] = await connection.query(`select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'Customer_Service' as Type, 'Service Reminder' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and customer.Email != '' and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${service_date}', INTERVAL ${serviceDays} DAY)`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsComfortFeedBackReminder === true || fetchCompanySetting[0].IsComfortFeedBackReminder === "true") {

                    const [qry] = await connection.query(`select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'Customer_Comfort Feedback' as Type, 'FeedBack Reminder' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and customer.Email != '' and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${service_date}', INTERVAL ${feedbackDays} DAY)`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsEyeTesingReminder === true || fetchCompanySetting[0].IsEyeTesingReminder === "true") {
                    const [qry] = await connection.query(`select customer.Title, customer.Name, customer.MobileNo1, customer.Email,customer.ShopID, spectacle_rx.ExpiryDate,'Customer_Eye Testing' as Type, 'Eye Testing Reminder' as MailSubject  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID where customer.Email != '' and customer.ShopID != 0 and spectacle_rx.CompanyID = ${CompanyID} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${service_date}'`)
                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsSolutionExpiryReminder === true || fetchCompanySetting[0].IsSolutionExpiryReminder === "true") {
                    const [qry] = await connection.query(`select customer.Title, customer.Name, customer.MobileNo1, billdetail.ProductExpDate, billmaster.ShopID, customer.Email,'Customer_Solution Expiry' as Type, 'Solution Expiry Reminder' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and customer.Email != '' and billdetail.ProductTypeName = 'SOLUTION' and billdetail.ProductExpDate = '${service_date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsContactLensExpiryReminder === true || fetchCompanySetting[0].IsContactLensExpiryReminder === "true") {
                    const [qry] = await connection.query(`select customer.Title, customer.Name, customer.Email, customer.MobileNo1, billdetail.ProductExpDate, billmaster.ShopID, 'Customer_Contactlens Expiry' as Type, 'Contactlens Expiry Reminder' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where customer.Email != '' and billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billdetail.ProductExpDate = '${service_date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }

                //  console.log(datum);

                if (datum.length) {
                    for (let item of datum) {
                        const filtered = Template.filter(msg => msg.MessageName2 === item.Type);
                        if (!filtered.length) {
                            console.log(`${item.Type} Mail template not found`);
                            continue
                        }
                        const mainEmail = `${item.Email}`
                        //  const mainEmail = `rahulberchha@gmail.com`
                        const mailSubject = `${item.MailSubject}`
                        let mailTemplate = `${filtered[0].MessageText2}`

                        if (mailSubject === 'BirthDay') {
                            mailTemplate = `${filtered[0].MessageText2}.<br><br>
                        <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExenI2d200d2ZsMHhsZjByYzc4cG1jOWthcWw4MjY4aWRsZW45YmU5eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/V2JgPXdvuCKrDo9uem/giphy.gif" alt="Happy Birthday">`
                        }
                        const attachment = null
                        const ccEmail = ''
                        // const ccEmail = 'opticalguruindia@gmail.com'
                        // const ccEmail = 'rahulberchha@gmail.com'
                        const emailData = await { to: mainEmail, cc: ccEmail, subject: mailSubject, body: mailTemplate, attachments: attachment, shopid: item.ShopID, companyid: CompanyID }

                        console.log(emailData, "emailData");

                        await Mail.companySendMail(emailData, (err, resp) => {
                            if (!err) {
                                console.log({ success: true, message: 'Mail Sent Successfully' })
                            } else {
                                console.log({ success: false, message: 'Failed to send mail' })
                            }
                        })
                    }
                } else {
                    console.log("Data not found")
                }


            }

        }

        console.log("Auto Mail sent process done");


    } catch (error) {
        console.log(error)
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getExpensereport(Company, Shop) {
    let connection;
    try {
        const response = { data: null, totalAmount: 0, success: true, message: "" }
        let date = moment(new Date()).subtract(1, 'days').format("YYYY-MM-DD");
        const Parem = ` and DATE_FORMAT(expense.ExpenseDate,"%Y-%m-%d")  between '${date}' and '${date}' and expense.ShopID = ${Shop}`;

        const CompanyID = Company ? Company : 0;
        const db = await dbConnection(Company);
        if (db.success === false) {
            return { db };
        }
        connection = await db.getConnection();

        let qry = `select expense.*,CONCAT(shop.Name,'(', shop.AreaName, ')') AS ShopName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from expense left join user as users1 on users1.ID = expense.CreatedBy left join user as users on users.ID = expense.UpdatedBy left join shop on shop.ID = expense.ShopID where expense.Status = 1 and expense.CompanyID = ${CompanyID} ${Parem}  order by expense.ID desc`

        let [data] = await connection.query(qry);
        response.message = "data fetch sucessfully"
        response.data = data || []
        if (response.data.length) {
            let [sumData] = await connection.query(`select SUM(Amount) as TotalAmount from expense where Status = 1 and CompanyID = ${CompanyID} ${Parem}`)
            if (sumData.length) {
                response.totalAmount = sumData[0].TotalAmount || 0
            }
        }
        // console.log("Get Expense Data :-", response);
        return response;
    } catch (error) {

    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getSalereport(Company, Shop) {
    let connection;
    try {
        const response = {
            data: null,
            calculation: [{
                "totalQty": 0,
                "totalGstAmount": 0,
                "totalAmount": 0,
                "totalAddlDiscount": 0,
                "totalDiscount": 0,
                "totalUnitPrice": 0,
                "totalSubTotalPrice": 0,
                "totalPaidAmount": 0,
                "gst_details": []
            }],
            success: true, message: ""
        }

        let date = moment(new Date()).subtract(1, 'days').format("YYYY-MM-DD");
        // let date = moment(new Date()).format("2025-06-01")
        const Parem = ` and DATE_FORMAT(billmaster.BillDate,"%Y-%m-%d")  between '${date}' and '${date}' and billmaster.ShopID = ${Shop}`;
        const CompanyID = Company ? Company : 0;
        const db = await dbConnection(Company);
        if (db.success === false) {
            return { db };
        }
        connection = await db.getConnection();
        // const shopid = await shopID(req.headers) || 0;
        // const LoggedOnUser = req.user.ID ? req.user.ID : 0;

        // console.log("Parem ---->", Parem);


        if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

        qry = `SELECT billmaster.*,CONCAT(shop.Name,'(', shop.AreaName, ')') AS ShopName, customer.Title AS Title , customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo, customer.Age, customer.Gender,  billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN shop ON shop.ID = billmaster.ShopID  WHERE billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1 ` + Parem + " GROUP BY billmaster.ID ORDER BY billmaster.ID DESC"

        let [data] = await connection.query(qry);

        const [sumData] = await connection.query(`SELECT SUM(billmaster.TotalAmount) AS TotalAmount, SUM(billmaster.Quantity) AS totalQty, SUM(billmaster.GSTAmount) AS totalGstAmount,SUM(billmaster.AddlDiscount) AS totalAddlDiscount, SUM(billmaster.DiscountAmount) AS totalDiscount, SUM(billmaster.SubTotal) AS totalSubTotalPrice  FROM billmaster WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1  ${Parem} `)
        if (sumData) {
            response.calculation[0].totalGstAmount = sumData[0].totalGstAmount ? sumData[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = sumData[0].TotalAmount ? sumData[0].TotalAmount.toFixed(2) : 0
            response.calculation[0].totalQty = sumData[0].totalQty ? sumData[0].totalQty : 0
            response.calculation[0].totalAddlDiscount = sumData[0].totalAddlDiscount ? sumData[0].totalAddlDiscount.toFixed(2) : 0
            response.calculation[0].totalDiscount = sumData[0].totalDiscount ? sumData[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalSubTotalPrice = sumData[0].totalSubTotalPrice ? sumData[0].totalSubTotalPrice.toFixed(2) : 0
        }


        // if (data.length) {
        //     data.forEach(ee => {
        //         ee.gst_detailssss = []
        //         ee.gst_details = [{ InvoiceNo: ee.InvoiceNo, }]
        //         data.push(ee)
        //     })
        // }


        let [gstTypes] = await connection.query(`select ID, Name, Status, TableName  from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

        gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
        if (gstTypes.length) {
            for (const item of gstTypes) {
                if ((item.Name).toUpperCase() === 'CGST-SGST') {
                    response.calculation[0].gst_details.push(
                        {
                            GSTType: `CGST`,
                            Amount: 0
                        },
                        {
                            GSTType: `SGST`,
                            Amount: 0
                        }
                    )
                } else {
                    response.calculation[0].gst_details.push({
                        GSTType: `${item.Name}`,
                        Amount: 0
                    })
                }
            }

        }

        if (data.length) {
            for (const item of data) {
                item.cGstAmount = 0
                item.iGstAmount = 0
                item.sGstAmount = 0
                item.gst_detailssss = []
                item.paymentDetail = []
                item.gst_details = []

                if (item.BillType === 0) {
                    // service bill
                    const [fetchService] = await connection.query(`select * from billservice where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                    if (fetchService.length) {
                        for (const item2 of fetchService) {
                            // response.calculation[0].totalAmount += item2.TotalAmount
                            // response.calculation[0].totalGstAmount += item2.GSTAmount
                            // response.calculation[0].totalSubTotalPrice += item2.SubTotal
                            response.calculation[0].totalUnitPrice += item2.Price

                            if (item2.GSTType === 'CGST-SGST') {
                                response.calculation[0].gst_details.forEach(e => {
                                    if (e.GSTType === 'CGST') {
                                        e.Amount += item2.GSTAmount / 2
                                    }
                                    if (e.GSTType === 'SGST') {
                                        e.Amount += item2.GSTAmount / 2
                                    }
                                })

                                item.cGstAmount += item2.GSTAmount / 2
                                item.sGstAmount += item2.GSTAmount / 2

                                // if (item.gst_details.length === 0) {
                                //     item.gst_details.push(
                                //         {
                                //             GSTType: `CGST`,
                                //             Amount: item2.GSTAmount / 2
                                //         },
                                //         {
                                //             GSTType: `SGST`,
                                //             Amount: item2.GSTAmount / 2
                                //         }
                                //     )
                                // } else {
                                //     item.gst_details.forEach(e => {
                                //         if (e.GSTType === 'CGST') {
                                //             e.Amount += item2.GSTAmount / 2
                                //         }
                                //         if (e.GSTType === 'SGST') {
                                //             e.Amount += item2.GSTAmount / 2
                                //         }
                                //     })
                                // }
                            }

                            if (item2.GSTType !== 'CGST-SGST') {
                                response.calculation[0].gst_details.forEach(e => {
                                    if (e.GSTType === item2.GSTType) {
                                        e.Amount += item2.GSTAmount
                                    }
                                })

                                item.iGstAmount += item2.GSTAmount

                                // item.gst_details.push(
                                //     {
                                //         GSTType: `${item2.GSTType}`,
                                //         Amount: item2.GSTAmount
                                //     },
                                // )
                            }
                        }
                    }
                }

                if (item.BillType === 1) {
                    // product & service bill

                    // service bill
                    const [fetchService] = await connection.query(`select * from billservice where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                    if (fetchService.length) {
                        for (const item2 of fetchService) {

                            // response.calculation[0].totalAmount += item2.TotalAmount
                            // response.calculation[0].totalGstAmount += item2.GSTAmount
                            // response.calculation[0].totalSubTotalPrice += item2.SubTotal
                            response.calculation[0].totalUnitPrice += item2.Price
                            if (item2.GSTType === 'CGST-SGST') {
                                response.calculation[0].gst_details.forEach(e => {

                                    if (e.GSTType === 'CGST') {
                                        e.Amount += item2.GSTAmount / 2
                                    }
                                    if (e.GSTType === 'SGST') {
                                        e.Amount += item2.GSTAmount / 2
                                    }
                                })
                                item.cGstAmount += item2.GSTAmount / 2
                                item.sGstAmount += item2.GSTAmount / 2
                                // if (item.gst_details.length === 0) {
                                //     item.gst_details.push(
                                //         {
                                //             GSTType: `CGST`,
                                //             Amount: item2.GSTAmount / 2
                                //         },
                                //         {
                                //             GSTType: `SGST`,
                                //             Amount: item2.GSTAmount / 2
                                //         }
                                //     )
                                // } else {
                                //     item.gst_details.forEach(e => {
                                //         if (e.GSTType === 'CGST') {
                                //             e.Amount += item2.GSTAmount / 2
                                //         }
                                //         if (e.GSTType === 'SGST') {
                                //             e.Amount += item2.GSTAmount / 2
                                //         }
                                //     })
                                // }
                            }

                            if (item2.GSTType !== 'CGST-SGST') {
                                response.calculation[0].gst_details.forEach(e => {
                                    if (e.GSTType === item2.GSTType) {
                                        e.Amount += item2.GSTAmount
                                    }
                                })

                                item.iGstAmount += item2.GSTAmount
                                // item.gst_details.push(
                                //     {
                                //         GSTType: `${item2.GSTType}`,
                                //         Amount: item2.GSTAmount
                                //     },
                                // )

                            }
                        }
                    }

                    // product bill
                    const [fetchProduct] = await connection.query(`select * from billdetail where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                    if (fetchProduct.length) {
                        for (const item2 of fetchProduct) {
                            // response.calculation[0].totalQty += item2.Quantity
                            // response.calculation[0].totalAmount += item2.TotalAmount
                            // response.calculation[0].totalGstAmount += item2.GSTAmount
                            response.calculation[0].totalUnitPrice += item2.UnitPrice
                            // response.calculation[0].totalDiscount += item2.DiscountAmount
                            // response.calculation[0].totalSubTotalPrice += item2.SubTotal

                            if (item2.GSTType === 'CGST-SGST') {
                                response.calculation[0].gst_details.forEach(e => {
                                    if (e.GSTType === 'CGST') {
                                        e.Amount += item2.GSTAmount / 2
                                    }
                                    if (e.GSTType === 'SGST') {
                                        e.Amount += item2.GSTAmount / 2
                                    }
                                })
                                item.cGstAmount += item2.GSTAmount / 2
                                item.sGstAmount += item2.GSTAmount / 2
                                // if (item.gst_details.length === 0) {
                                //     item.gst_details.push(
                                //         {
                                //             GSTType: `CGST`,
                                //             Amount: item2.GSTAmount / 2
                                //         },
                                //         {
                                //             GSTType: `SGST`,
                                //             Amount: item2.GSTAmount / 2
                                //         }
                                //     )
                                // } else {
                                //     item.gst_details.forEach(e => {
                                //         if (e.GSTType === 'CGST') {
                                //             e.Amount += item2.GSTAmount / 2
                                //         }
                                //         if (e.GSTType === 'SGST') {
                                //             e.Amount += item2.GSTAmount / 2
                                //         }
                                //     })
                                // }

                            }

                            if (item2.GSTType !== 'CGST-SGST') {
                                response.calculation[0].gst_details.forEach(e => {
                                    if (e.GSTType === item2.GSTType) {
                                        e.Amount += item2.GSTAmount
                                    }
                                })
                                item.iGstAmount += item2.GSTAmount
                                // item.gst_details.push(
                                //     {
                                //         GSTType: `${item2.GSTType}`,
                                //         Amount: item2.GSTAmount
                                //     },
                                // )
                            }
                        }
                    }

                }

                const [fetchpayment] = await connection.query(`select paymentmaster.PaymentMode, DATE_FORMAT(paymentmaster.PaymentDate, '%Y-%m-%d %H:%i:%s') as PaymentDate, paymentmaster.PaidAmount as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where BillMasterID = ${item.ID} and paymentmaster.PaymentMode != 'Payment Initiated'`)

                if (fetchpayment.length) {
                    item.paymentDetail = fetchpayment
                }

                response.calculation[0].totalPaidAmount += item.TotalAmount - item.DueAmount
                response.calculation[0].totalAmount = response.calculation[0].totalAmount
                response.calculation[0].totalAddlDiscount += item.AddlDiscount

            }
        }

        response.data = data
        response.message = "success";

        return response;



    } catch (err) {
        console.log(err)
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function getCashcollectionreport(Company, Shop) {
    let connection;
    try {
        const response = { data: null, success: true, message: "", paymentMode: [], sumOfPaymentMode: 0, AmountReturnByDebit: 0, AmountReturnByCredit: 0, totalExpense: 0, totalAmount: 0 };

        let date = moment(new Date()).subtract(1, 'days').format("YYYY-MM-DD");

        const Dates = ` and DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d")  between '${date}' and '${date}'`;

        const CompanyID = Company ? Company : 0;
        const ShopID = Shop ? Shop : 0;
        const db = await dbConnection(Company);
        if (db.success === false) {
            return { db };
        }
        connection = await db.getConnection();

        let shop = ``;
        let shop2 = ``;
        let paymentType = ``;
        let paymentStatus = ``;

        if (ShopID) {
            shop = ` and billmaster.ShopID = ${ShopID}`;
            shop2 = ` and paymentmaster.ShopID = ${ShopID}`;
        }
        // if (PaymentMode) {
        //     paymentType = ` and paymentmaster.PaymentMode = '${PaymentMode}' `;
        // }
        // if (PaymentStatus) {
        //     paymentStatus = ` and billmaster.PaymentStatus = '${PaymentStatus}'`;
        // }

        let qry = `select paymentmaster.CustomerID, paymentmaster.ShopID, paymentmaster.PaymentMode, paymentmaster.PaymentDate, paymentmaster.CardNo, paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentdetail.Amount, paymentdetail.DueAmount, billmaster.InvoiceNo, billmaster.BillDate,billmaster.DeliveryDate, billmaster.PaymentStatus, billmaster.TotalAmount,CONCAT(shop.Name,'(', shop.AreaName, ')') AS ShopName, customer.Name as CustomerName, customer.MobileNo1, paymentmaster.CreditType from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID left join billmaster on billmaster.ID = paymentdetail.BillMasterID left join shop on shop.ID = paymentmaster.ShopID left join customer on customer.ID = paymentmaster.CustomerID where  paymentmaster.CompanyID = ${CompanyID} and paymentdetail.PaymentType IN ( 'Customer', 'Customer Credit' ) and paymentmaster.CreditType = 'Credit' and paymentmaster.PaymentMode != 'Payment Initiated'  ${shop} ${paymentStatus} ${paymentType} ` + Dates + ` order by paymentdetail.BillMasterID desc`;

        const [data] = await connection.query(qry);

        const [paymentMode] = await connection.query(`select supportmaster.Name, 0 as Amount from supportmaster where Status = 1 and CompanyID = ${CompanyID} and TableName = 'PaymentModeType' order by ID desc`);

        response.paymentMode = paymentMode;

        if (data) {
            // Iterate through the array in reverse to avoid index issues when removing items
            for (let i = data.length - 1; i >= 0; i--) {
                let item = data[i];

                response.paymentMode.forEach(x => {
                    if (item.PaymentMode === x.Name && item.CreditType === 'Credit') {
                        x.Amount += item.Amount;
                        // response.sumOfPaymentMode += item.Amount;
                    }
                });

                if (item.PaymentMode === 'Customer Credit') {
                    data.splice(i, 1); // Remove 1 element at index i
                }

                if (item.PaymentMode.toUpperCase() == 'AMOUNT RETURN') {
                    response.sumOfPaymentMode -= item.Amount;
                } else if (item.PaymentMode !== 'Customer Credit') {
                    response.sumOfPaymentMode += item.Amount;
                }
            }
        }

        const [ExpenseData] = await connection.query(`select SUM(paymentmaster.PaidAmount) as ExpenseAmount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.Status = 1 and  paymentmaster.CompanyID = ${CompanyID} and paymentdetail.PaymentType IN ( 'Expense' ) and paymentmaster.CreditType = 'Debit' and paymentmaster.PaymentMode != 'Payment Initiated'  ${shop2}  ${paymentType} ` + Dates + ` order by paymentdetail.BillMasterID desc`);

        response.totalExpense = ExpenseData[0].ExpenseAmount || 0
        response.totalAmount = response.sumOfPaymentMode;
        response.data = data;
        response.message = "success";
        // console.log("Get Cash Collection Report :- ", response);

        return response;
    } catch (err) {
        console.log(err)
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

const sendReport = async () => {
    let connection;
    try {
        const [company] = await mysql2.pool.query(`select ID, Name from company where status = 1 and EmailMsg = "true"`);

        if (company.length) {
            for (let c of company) {
                const db = await dbConnection(c.ID);
                if (db.success === false) {
                    return { db };
                }
                connection = await db.getConnection();

                const [fetchEmailUsers] = await connection.query(`SELECT usershop.ShopID, GROUP_CONCAT(user.email) AS emails FROM usershop LEFT JOIN user ON user.ID = usershop.UserID WHERE user.status = 1 AND usershop.status = 1 AND user.CompanyID = ${c.ID} AND user.IsGetReport = 'true' AND user.email != '' GROUP BY usershop.ShopID`);

                if (fetchEmailUsers.length) {

                    for (let u of fetchEmailUsers) {
                        const [fetchShop] = await connection.query(`select ID, CONCAT(shop.Name,'(', shop.AreaName, ')') AS ShopName, IsEmailConfiguration from shop where Status = 1 and CompanyID = ${c.ID} and ID = ${u.ShopID} `)
                        if (fetchShop.length) {
                            for (let s of fetchShop) {
                                if (s.IsEmailConfiguration === true || s.IsEmailConfiguration === "true") {
                                    const ToEmails = `${u.emails}`;
                                    const fetchSaleData = await getSalereport(c.ID, s.ID)
                                    const fetchExpenseData = await getExpensereport(c.ID, s.ID)
                                    const fetchCollectionData = await getCashcollectionreport(c.ID, s.ID)

                                    // Mail Data 
                                    let fileReport = []
                                    let date = moment(new Date()).subtract(1, 'days').format("YYYY-MM-DD");
                                    const mainEmail = `${ToEmails}`
                                    // const mailSubject = `Report: CID_${c.ID}_${s.ShopName}_${date}`
                                    const mailSubject = `Sale Report-${date}-${s.ShopName}`
                                    const mailTemplate = `FYI`
                                    const attachment = fileReport
                                    let ccEmail = ''
                                    if (c.ID === 1) {
                                        ccEmail = `relinksys@gmail.com`
                                    }

                                    // 

                                    if (ToEmails && fetchSaleData.data.length) {
                                        const workbook = new ExcelJS.Workbook();
                                        // const worksheet = workbook.addWorksheet(`CID_${c.ID}_Sale_report_${date}`);
                                        const worksheet = workbook.addWorksheet(`Sale_Report_${date}_${s.ShopName}`);

                                        worksheet.columns = [
                                            { header: 'S.no', key: 'S_no', width: 8 },
                                            { header: 'InvoiceDate', key: 'InvoiceDate', width: 20 },
                                            { header: 'InvoiceNo', key: 'InvoiceNo', width: 20 },
                                            { header: 'CustomerName', key: 'CustomerName', width: 25 },
                                            { header: 'MobileNo', key: 'MobileNo1', width: 15 },
                                            // { header: 'Age', key: 'Age', width: 10 },
                                            // { header: 'Gender', key: 'Gender', width: 15 },
                                            { header: 'PaymentStatus', key: 'PaymentStatus', width: 10 },
                                            { header: 'Quantity', key: 'Quantity', width: 5 },
                                            { header: 'Discount', key: 'DiscountAmount', width: 10 },
                                            { header: 'SubTotal', key: 'SubTotal', width: 10 },
                                            { header: 'TAXAmount', key: 'GSTAmount', width: 10 },
                                            { header: 'CGSTAmt', key: 'cGstAmount', width: 10 },
                                            { header: 'SGSTAmt', key: 'sGstAmount', width: 10 },
                                            { header: 'IGSTAmt', key: 'iGstAmount', width: 10 },
                                            { header: 'GrandTotal', key: 'TotalAmount', width: 12 },
                                            { header: 'AddDiscount', key: 'AddlDiscount', width: 10 },
                                            { header: 'Paid', key: 'Paid', width: 10 },
                                            { header: 'Balance', key: 'Balance', width: 10 },
                                            { header: 'ProductStatus', key: 'ProductStatus', width: 12 },
                                            { header: 'DeliveryDate', key: 'DeliveryDate', width: 15 },
                                            { header: 'Cust_GSTNo', key: 'GSTNo', width: 15 },
                                            { header: 'ShopName', key: 'ShopName', width: 20 },
                                            { header: 'INT_1_Date', key: 'INT_1_Date', width: 15 },
                                            { header: 'INT_1_Mode', key: 'INT_1_Mode', width: 15 },
                                            { header: 'INT_1_Amount', key: 'INT_1_Amount', width: 15 },
                                            { header: 'INT_2_Date', key: 'INT_2_Date', width: 15 },
                                            { header: 'INT_2_Mode', key: 'INT_2_Mode', width: 15 },
                                            { header: 'INT_2_Amount', key: 'INT_2_Amount', width: 15 },
                                            { header: 'INT_3_Date', key: 'INT_3_Date', width: 15 },
                                            { header: 'INT_3_Mode', key: 'INT_3_Mode', width: 15 },
                                            { header: 'INT_3_Amount', key: 'INT_3_Amount', width: 15 },
                                            { header: 'INT_4_Date', key: 'INT_4_Date', width: 15 },
                                            { header: 'INT_4_Mode', key: 'INT_4_Mode', width: 15 },
                                            { header: 'INT_4_Amount', key: 'INT_4_Amount', width: 15 },
                                            { header: 'INT_5_Date', key: 'INT_5_Date', width: 15 },
                                            { header: 'INT_5_Mode', key: 'INT_5_Mode', width: 15 },
                                            { header: 'INT_5_Amount', key: 'INT_5_Amount', width: 15 },
                                            { header: 'INT_6_Date', key: 'INT_6_Date', width: 15 },
                                            { header: 'INT_6_Mode', key: 'INT_6_Mode', width: 15 },
                                            { header: 'INT_6_Amount', key: 'INT_6_Amount', width: 15 },
                                            { header: 'INT_7_Date', key: 'INT_7_Date', width: 15 },
                                            { header: 'INT_7_Mode', key: 'INT_7_Mode', width: 15 },
                                            { header: 'INT_7_Amount', key: 'INT_7_Amount', width: 15 },
                                            { header: 'INT_8_Date', key: 'INT_8_Date', width: 15 },
                                            { header: 'INT_8_Mode', key: 'INT_8_Mode', width: 15 },
                                            { header: 'INT_8_Amount', key: 'INT_8_Amount', width: 10 },

                                        ];

                                        let count = 1;
                                        const datum = {
                                            "S_no": '',
                                            "InvoiceDate": '',
                                            "InvoiceNo": '',
                                            "CustomerName": '',
                                            "MobileNo": '',
                                            // "Age": '',
                                            // "Gender": '',
                                            "PaymentStatus": '',
                                            "Quantity": Number(fetchSaleData.calculation[0].totalQty),
                                            "DiscountAmount": Number(fetchSaleData.calculation[0].totalDiscount),
                                            "SubTotal": Number(fetchSaleData.calculation[0].totalSubTotalPrice),
                                            "GSTAmount": Number(fetchSaleData.calculation[0].totalGstAmount),
                                            "CGSTAmt": '',
                                            "SGSTAmt": '',
                                            "IGSTAmt": '',
                                            "TotalAmount": Number(fetchSaleData.calculation[0].totalAmount),
                                            "AddlDiscount": Number(fetchSaleData.calculation[0].totalAddlDiscount),
                                            "Paid": Number(fetchSaleData.calculation[0].totalPaidAmount.toFixed(2)),
                                            "Balance": fetchSaleData.calculation[0].totalAmount - fetchSaleData.calculation[0].totalPaidAmount.toFixed(2),
                                            "ProductStatus": '',
                                            "DeliveryDate": '',
                                            "Cust_GSTNo": '',
                                            "ShopName": '',
                                            "INT_1_Date": '',
                                            "INT_1_Mode": '',
                                            "INT_1_Amount": '',
                                            "INT_2_Date": '',
                                            "INT_2_Mode": '',
                                            "INT_2_Amount": '',
                                            "INT_3_Date": '',
                                            "INT_3_Mode": '',
                                            "INT_3_Amount": '',
                                            "INT_4_Date": '',
                                            "INT_4_Mode": '',
                                            "INT_4_Amount": '',
                                            "INT_5_Date": '',
                                            "INT_5_Mode": '',
                                            "INT_5_Amount": '',
                                            "INT_6_Date": '',
                                            "INT_6_Mode": '',
                                            "INT_6_Amount": '',
                                            "INT_7_Date": '',
                                            "INT_7_Mode": '',
                                            "INT_7_Amount": '',
                                            "INT_8_Date": '',
                                            "INT_8_Mode": '',
                                            "INT_8_Amount": '',
                                        }
                                        worksheet.addRow(datum);
                                        fetchSaleData.data.forEach((x) => {
                                            x.S_no = count++;
                                            x.InvoiceDate = moment(x.BillDate).format('YYYY-MM-DD hh:mm a');
                                            x.DeliveryDate = moment(x.DeliveryDate).format('YYYY-MM-DD hh:mm a');
                                            x.INT_1_Date = x.paymentDetail[0]?.PaymentDate ? x.paymentDetail[0]?.PaymentDate : ''
                                            x.INT_1_Mode = x.paymentDetail[0]?.PaymentMode ? x.paymentDetail[0]?.PaymentMode : ''
                                            x.INT_1_Amount = x.paymentDetail[0]?.Amount ? x.paymentDetail[0]?.Amount : ''
                                            x.INT_2_Date = x.paymentDetail[1]?.PaymentDate ? x.paymentDetail[1]?.PaymentDate : ''
                                            x.INT_2_Mode = x.paymentDetail[1]?.PaymentMode ? x.paymentDetail[1]?.PaymentMode : ''
                                            x.INT_2_Amount = x.paymentDetail[1]?.Amount ? x.paymentDetail[1]?.Amount : ''
                                            x.INT_3_Date = x.paymentDetail[2]?.PaymentDate ? x.paymentDetail[2]?.PaymentDate : ''
                                            x.INT_3_Mode = x.paymentDetail[2]?.PaymentMode ? x.paymentDetail[2]?.PaymentMode : ''
                                            x.INT_3_Amount = x.paymentDetail[2]?.Amount ? x.paymentDetail[2]?.Amount : ''
                                            x.INT_4_Date = x.paymentDetail[3]?.PaymentDate ? x.paymentDetail[3]?.PaymentDate : ''
                                            x.INT_4_Mode = x.paymentDetail[3]?.PaymentMode ? x.paymentDetail[3]?.PaymentMode : ''
                                            x.INT_4_Amount = x.paymentDetail[3]?.Amount ? x.paymentDetail[3]?.Amount : ''
                                            x.INT_5_Date = x.paymentDetail[4]?.PaymentDate ? x.paymentDetail[4]?.PaymentDate : ''
                                            x.INT_5_Mode = x.paymentDetail[4]?.PaymentMode ? x.paymentDetail[4]?.PaymentMode : ''
                                            x.INT_5_Amount = x.paymentDetail[4]?.Amount ? x.paymentDetail[4]?.Amount : ''
                                            x.INT_6_Date = x.paymentDetail[5]?.PaymentDate ? x.paymentDetail[5]?.PaymentDate : ''
                                            x.INT_6_Mode = x.paymentDetail[5]?.PaymentMode ? x.paymentDetail[5]?.PaymentMode : ''
                                            x.INT_6_Amount = x.paymentDetail[5]?.Amount ? x.paymentDetail[5]?.Amount : ''
                                            x.INT_7_Date = x.paymentDetail[6]?.PaymentDate ? x.paymentDetail[6]?.PaymentDate : ''
                                            x.INT_7_Mode = x.paymentDetail[6]?.PaymentMode ? x.paymentDetail[6]?.PaymentMode : ''
                                            x.INT_7_Amount = x.paymentDetail[6]?.Amount ? x.paymentDetail[6]?.Amount : ''
                                            x.INT_8_Date = x.paymentDetail[7]?.PaymentDate ? x.paymentDetail[7]?.PaymentDate : ''
                                            x.INT_8_Mode = x.paymentDetail[7]?.PaymentMode ? x.paymentDetail[7]?.PaymentMode : ''
                                            x.INT_8_Amount = x.paymentDetail[7]?.Amount ? x.paymentDetail[7]?.Amount : ''
                                            x.Paid = x.TotalAmount - x.DueAmount
                                            x.Balance = x.DueAmount
                                            worksheet.addRow(x);
                                        });

                                        worksheet.getRow(1).eachCell((cell) => {
                                            cell.font = { bold: true };
                                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
                                        });

                                        const buffer = await workbook.xlsx.writeBuffer();

                                        fileReport.push(
                                            {
                                                filename: `Sale_Report_${date}_${s.ShopName}.xlsx`,
                                                content: buffer,
                                                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                            },
                                        )

                                    }
                                    if (ToEmails && fetchExpenseData.data.length) {
                                        const workbook = new ExcelJS.Workbook();
                                        // const worksheet = workbook.addWorksheet(`CID_${c.ID}_Expense_report_${date}`);
                                        const worksheet = workbook.addWorksheet(`Expense_report_${date}_${s.ShopName}`);

                                        worksheet.columns = [
                                            { header: 'S.no', key: 'S_no', width: 8 },
                                            { header: 'ExpenseDate', key: 'ExpenseDate', width: 20 },
                                            { header: 'InvoiceNo', key: 'InvoiceNo', width: 20 },
                                            { header: 'ExpenseType', key: 'Category', width: 25 },
                                            { header: 'GivenTo', key: 'Name', width: 15 },
                                            { header: 'PaymentMode', key: 'PaymentMode', width: 10 },
                                            { header: 'CashType', key: 'CashType', width: 15 },
                                            { header: 'Amount', key: 'Amount', width: 10 },
                                            { header: 'ShopName', key: 'ShopName', width: 20 }
                                        ];

                                        let count = 1;
                                        const datum = {
                                            "S_no": '',
                                            "ExpenseDate": '',
                                            "InvoiceNo": '',
                                            "ExpenseType": '',
                                            "GivenTo": '',
                                            "PaymentMode": '',
                                            "CashType": '',
                                            "Amount": Number(fetchExpenseData.totalAmount),
                                            "ShopName": ''
                                        }
                                        worksheet.addRow(datum);
                                        fetchExpenseData.data.forEach((x) => {
                                            x.S_no = count++;
                                            x.ExpenseDate = moment(x.ExpenseDate).format('YYYY-MM-DD hh:mm a');
                                            worksheet.addRow(x);
                                        });

                                        worksheet.getRow(1).eachCell((cell) => {
                                            cell.font = { bold: true };
                                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
                                        });


                                        const buffer = await workbook.xlsx.writeBuffer();

                                        fileReport.push(
                                            {
                                                filename: `Expense_report_${date}_${s.ShopName}.xlsx`,
                                                content: buffer,
                                                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                            },
                                        )


                                    }
                                    if (ToEmails && fetchCollectionData.data.length) {
                                        const workbook = new ExcelJS.Workbook();
                                        const worksheet = workbook.addWorksheet(`Collection_report_${date}_${s.ShopName}`);

                                        worksheet.columns = [
                                            { header: 'S.no', key: 'S_no', width: 8 },
                                            { header: 'InvoiceNo', key: 'InvoiceNo', width: 25 },
                                            { header: 'InvoiceDate', key: 'InvoiceDate', width: 25 },
                                            { header: 'PaymentDate', key: 'PaymentDate', width: 25 },
                                            { header: 'CustomerName', key: 'CustomerName', width: 20 },
                                            { header: 'MobileNo', key: 'MobileNo1', width: 15 },
                                            { header: 'PaymentMode', key: 'PaymentMode', width: 15 },
                                            { header: 'PayAmount', key: 'Amount', width: 10 },
                                            { header: 'ShopName', key: 'ShopName', width: 20 }
                                        ];

                                        let count = 1;
                                        const datum = {
                                            "S_no": '',
                                            "InvoiceNo": '',
                                            "InvoiceDate": '',
                                            "PaymentDate": '',
                                            "CustomerName": '',
                                            "MobileNo1": '',
                                            "PaymentMode": '',
                                            "Amount": Number(fetchCollectionData.totalAmount),
                                            "ShopName": ''
                                        }
                                        worksheet.addRow(datum);
                                        fetchCollectionData.data.forEach((x) => {
                                            x.S_no = count++;
                                            x.InvoiceDate = moment(x.BillDate).format('YYYY-MM-DD hh:mm a');
                                            x.PaymentDate = moment(x.PaymentDate).format('YYYY-MM-DD hh:mm a');
                                            worksheet.addRow(x);
                                        });

                                        worksheet.getRow(1).eachCell((cell) => {
                                            cell.font = { bold: true };
                                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
                                        });

                                        const buffer = await workbook.xlsx.writeBuffer();

                                        fileReport.push(
                                            {
                                                filename: `Collection_report_${date}_${s.ShopName}.xlsx`,
                                                content: buffer,
                                                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                            },
                                        )


                                    }


                                    const emailData = await { to: mainEmail, cc: ccEmail, subject: mailSubject, body: mailTemplate, attachments: fileReport, shopid: s.ID, companyid: c.ID }


                                    console.log(`Email Data For CID_${c.ID}_${s.ShopName} :- `, emailData);


                                    if (emailData.attachments.length) {
                                        await Mail.companySendMail(emailData, (err, resp) => {
                                            if (!err) {
                                                console.log({ success: true, message: 'Mail Sent Successfully' })
                                            } else {
                                                console.log({ success: false, message: 'Failed to send mail' })
                                            }
                                        })
                                    }


                                } else {
                                    console.log("IsEmailConfiguration not found");
                                }

                            }

                        } else {
                            console.log("fetchShop not found");
                        }
                    }

                } else {
                    console.log("Email User not found");
                }
            }
        } else {
            console.log("Company data not found");
        }

    } catch (error) {
        console.log(error);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}


// Old WP API

const auto_wpmsg = async () => {
    let connection;
    try {
        const [company] = await mysql2.pool.query(`select ID, Name from company where status = 1 and ID = 84 and WhatsappMsg = "true"`);

        let date = moment(new Date()).format("MM-DD")
        let service_date = moment(new Date()).format("YYYY-MM-DD")

        if (company.length) {
            for (let data of company) {
                const db = await dbConnection(data.ID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();

                let CompanyID = data.ID

                let [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder, IsAnniversaryReminder, WhatsappSetting, ServiceDate, IsServiceReminder, FeedbackDate, IsComfortFeedBackReminder, IsEyeTesingReminder, IsSolutionExpiryReminder, IsContactLensExpiryReminder, IsCustomerOrderPendingReminder from companysetting where CompanyID = ${CompanyID}`);

                if (!fetchCompanySetting.length) {
                    return res.send({ success: false, message: "Company Setting not found." })
                }

                let Template = JSON.parse(fetchCompanySetting[0]?.WhatsappSetting) || []
                // console.log(Template);

                if (!Template.length) {
                    console.log("Whatsapp Template not found");
                    continue
                }

                // console.log(Template);


                let datum = []
                let serviceDays = Number(fetchCompanySetting[0]?.ServiceDate) || 0
                let feedbackDays = Number(fetchCompanySetting[0]?.FeedbackDate) || 0

                // if (fetchCompanySetting[0].IsAnniversaryReminder === true || fetchCompanySetting[0].IsAnniversaryReminder === "true") {
                //     const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Anniversary, customer.Title, customer.Email, customer.ShopID, 'Customer_Anniversary' as Type, 'Anniversary' as MailSubject from customer left join shop on shop.ID = customer.ShopID where customer.status = 1 and customer.ShopID != 0 and customer.MobileNo1 != '' and customer.CompanyID = ${CompanyID} and DATE_FORMAT(customer.Anniversary, '%m-%d') = '${date}'`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {
                    const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.DOB, customer.Title, customer.Email, customer.ShopID, 'Customer_Birthday' as Type, 'BirthDay' as MailSubject from customer left join shop on shop.ID = customer.ShopID where customer.status = 1 and customer.ShopID != 0 and customer.MobileNo1 != '' and customer.CompanyID = ${CompanyID} and DATE_FORMAT(customer.DOB, '%m-%d') = '${date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                // if (fetchCompanySetting[0].IsServiceReminder === true || fetchCompanySetting[0].IsServiceReminder === "true") {
                //     const [qry] = await connection.query(`select DISTINCT(billmaster.ID), CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'Customer_Service' as Type, 'Service Reminder' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where billdetail.CompanyID = ${CompanyID} and customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${service_date}', INTERVAL ${serviceDays} DAY)`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                // if (fetchCompanySetting[0].IsComfortFeedBackReminder === true || fetchCompanySetting[0].IsComfortFeedBackReminder === "true") {

                //     const [qry] = await connection.query(`select DISTINCT(billmaster.ID),CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'Customer_Comfort Feedback' as Type, 'FeedBack Reminder' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where billdetail.CompanyID = ${CompanyID} and customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') and DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${service_date}', INTERVAL ${feedbackDays} DAY)`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                // if (fetchCompanySetting[0].IsEyeTesingReminder === true || fetchCompanySetting[0].IsEyeTesingReminder === "true") {
                //     const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email,customer.ShopID, spectacle_rx.ExpiryDate,'Customer_Eye Testing' as Type, 'Eye Testing Reminder' as MailSubject  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID left join shop on shop.ID = customer.ShopID where customer.MobileNo1 != '' and customer.ShopID != 0 and spectacle_rx.CompanyID = ${CompanyID} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${service_date}'`)
                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                // if (fetchCompanySetting[0].IsSolutionExpiryReminder === true || fetchCompanySetting[0].IsSolutionExpiryReminder === "true") {
                //     const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, billdetail.ProductExpDate, billmaster.ShopID, customer.Email,'Customer_Solution Expiry' as Type, 'Solution Expiry Reminder' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where billdetail.CompanyID = ${CompanyID} and customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.ProductTypeName = 'SOLUTION' and billdetail.ProductExpDate = '${service_date}'`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                // if (fetchCompanySetting[0].IsContactLensExpiryReminder === true || fetchCompanySetting[0].IsContactLensExpiryReminder === "true") {
                //     const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.Email, customer.MobileNo1, billdetail.ProductExpDate, billmaster.ShopID, 'Customer_Contactlens Expiry' as Type, 'Contactlens Expiry Reminder' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billdetail.ProductExpDate = '${service_date}'`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                // if (fetchCompanySetting[0].IsCustomerOrderPendingReminder === true || fetchCompanySetting[0].IsCustomerOrderPendingReminder === "true") {
                //     const [qry] = await connection.query(`SELECT billmaster.InvoiceNo, CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, DATE_FORMAT(billmaster.DeliveryDate, '%Y-%m-%d') AS DeliveryDate, CURDATE() AS Today, DATE_FORMAT(DATE_ADD(billmaster.DeliveryDate, INTERVAL 15 DAY), '%Y-%m-%d') AS DeliveryDatePlus15, DATE_FORMAT(DATE_ADD(billmaster.DeliveryDate, INTERVAL 30 DAY), '%Y-%m-%d') AS DeliveryDatePlus30, billmaster.ShopID, 'Customer_Bill OrderReady' as MailSubject,'Customer_Bill OrderReady' as Type FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 AND customer.MobileNo1 != '' and customer.ShopID != 0 AND billmaster.ProductStatus = 'Pending' AND CURDATE() BETWEEN DATE(DATE_ADD(billmaster.DeliveryDate, INTERVAL 15 DAY)) AND DATE(DATE_ADD(billmaster.DeliveryDate, INTERVAL 30 DAY))`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }

                //  console.log(datum);

                if (datum.length) {
                    for (let item of datum) {
                        const filtered = Template.filter(msg => msg.MessageName1 === item.Type);
                        if (!filtered.length) {
                            console.log(`${item.Type} Whatsapp template not found`);
                            continue
                        }

                        const websiteLine = item.Website ? `${item.Website}\n` : '';
                        const mainEmail = `${item.MobileNo1}`
                        const mailSubject = `${item.MailSubject}`
                        let mailTemplate = `${item.CustomerName + ','}${'\n\n' + filtered[0].MessageText1}${'\n\n' + item.ShopName}${'\n' + item.MobileNo1}${'\n' + websiteLine}\nPlease give your valuable review for us!`

                        const whatsappData = await { to: mainEmail, subject: mailSubject, body: mailTemplate, shopid: item.ShopID, companyid: CompanyID, Attachment: `${filtered[0].Images}` }

                        console.log(whatsappData, "whatsappData");

                        const sendMessage = await sendWhatsAppTextMessage(
                            {
                                number: mainEmail,
                                message: mailTemplate,
                                Attachment: `${whatsappData.Attachment}`
                            }
                        )

                    }
                } else {
                    console.log("Data not found")
                }


            }

        }

        console.log("Auto Whatsapp sent process done");


    } catch (error) {
        console.log(error)
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}

async function cleanURL(encodedURL) {
    return decodeURIComponent(encodedURL);
}

async function sendWhatsAppTextMessage({ number, message, Attachment }) {
    const url = 'https://web2.connectitapp.in/api/send';
    const instanceId = '685EB1392F626';
    const accessToken = '685eb0f6d4a9e';

    try {
        let params = {
            number: `91${number}`,
            type: 'text',
            message,
            instance_id: instanceId,
            access_token: accessToken
        };

        if (clientConfig.appURL.startsWith("http://")) {
            Attachment = 'undefined'
        }

        if (Attachment !== 'undefined' && Attachment !== undefined) {
            params.type = 'media'
            params.media_url = await cleanURL(`${clientConfig.appURL}${Attachment}`)
            params.filename = params.media_url.split('/').pop()
        }

        // Log the base URL
        // console.log('Base URL:', url);

        // Log the parameters object
        // console.log('Parameters:', params);

        // Construct and log the full URL with parameters for verification
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${url}?${queryString}`;

        console.log('Full URL with all parameters:', fullUrl);

        const response = await axios.get(url, {
            params: params
        });

        console.log('Message sent api response :', response.data.status);

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// New WP API Below

const auto_wpmsg_new = async () => {
    let connection;
    let DB;
    try {

        DB = await mysql2.pool.getConnection();

        const [company] = await DB.query(`select ID, Name from company where status = 1 and ID = 84 and WhatsappMsg = "true"`);

        let date = moment(new Date()).format("MM-DD")
        let service_date = moment(new Date()).format("YYYY-MM-DD")

        if (company.length) {
            for (let data of company) {
                const db = await dbConnection(data.ID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();

                let CompanyID = data.ID

                let [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder, IsAnniversaryReminder, WhatsappSetting, ServiceDate, IsServiceReminder, FeedbackDate, IsComfortFeedBackReminder, IsEyeTesingReminder, IsSolutionExpiryReminder, IsContactLensExpiryReminder, IsCustomerOrderPendingReminder from companysetting where CompanyID = ${CompanyID}`);

                if (!fetchCompanySetting.length) {
                    return { success: false, message: "Company Setting not found." }
                }

                let Template = templates
                // let Template = JSON.parse(fetchCompanySetting[0]?.WhatsappSetting) || []
                // console.log(Template);

                if (!Template.length) {
                    console.log("Whatsapp Template not found");
                    continue
                }

                // console.log(Template);


                let datum = []
                let serviceDays = Number(fetchCompanySetting[0]?.ServiceDate) || 0
                let feedbackDays = Number(fetchCompanySetting[0]?.FeedbackDate) || 0

                if (fetchCompanySetting[0].IsAnniversaryReminder === true || fetchCompanySetting[0].IsAnniversaryReminder === "true") {
                    const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Anniversary, customer.Title, customer.Email, customer.ShopID, 'opticalguru_customer_anniversary_new' as Type, 'opticalguru_customer_anniversary_new' as MailSubject from customer left join shop on shop.ID = customer.ShopID where customer.status = 1 and customer.ShopID != 0 and customer.MobileNo1 != '' and customer.CompanyID = ${CompanyID} and DATE_FORMAT(customer.Anniversary, '%m-%d') = '${date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {
                    const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.DOB, customer.Title, customer.Email, customer.ShopID, 'opticalguru_customer_birthday_new' as Type, 'opticalguru_customer_birthday_new' as MailSubject from customer left join shop on shop.ID = customer.ShopID where customer.status = 1 and customer.ShopID != 0 and customer.MobileNo1 != '' and customer.CompanyID = ${CompanyID} and DATE_FORMAT(customer.DOB, '%m-%d') = '${date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsServiceReminder === true || fetchCompanySetting[0].IsServiceReminder === "true") {
                    const [qry] = await connection.query(`select DISTINCT(billmaster.ID), CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'opticalguru_customer_service_new' as Type, 'opticalguru_customer_service_new' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where billdetail.CompanyID = ${CompanyID} and customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  AND DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${service_date}', INTERVAL ${serviceDays} DAY)`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsComfortFeedBackReminder === true || fetchCompanySetting[0].IsComfortFeedBackReminder === "true") {

                    const [qry] = await connection.query(`select DISTINCT(billmaster.ID),CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'opticalguru_customer_comfort_feedback_new' as Type, 'opticalguru_customer_comfort_feedback_new' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where billdetail.CompanyID = ${CompanyID} and customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') and DATE(COALESCE(NULLIF(billmaster.DeliveryDate,'0000-00-00'),NULLIF(billmaster.DeliveryDate,'0000-00-00 00:00:00'),billmaster.DeliveryDate)) = DATE_SUB('${service_date}', INTERVAL ${feedbackDays} DAY)`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsEyeTesingReminder === true || fetchCompanySetting[0].IsEyeTesingReminder === "true") {
                    const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email,customer.ShopID, spectacle_rx.ExpiryDate,'opticalguru_customer_eye_testing_new' as Type, 'opticalguru_customer_eye_testing_new' as MailSubject  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID left join shop on shop.ID = customer.ShopID where customer.MobileNo1 != '' and customer.ShopID != 0 and spectacle_rx.CompanyID = ${CompanyID} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${service_date}'`)
                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsSolutionExpiryReminder === true || fetchCompanySetting[0].IsSolutionExpiryReminder === "true") {
                    const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, billdetail.ProductExpDate, billmaster.ShopID, customer.Email,'Customer_Solution Expiry_new' as Type, 'Solution Expiry Reminder_new' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where billdetail.CompanyID = ${CompanyID} and customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.ProductTypeName = 'SOLUTION' and billdetail.ProductExpDate = '${service_date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsContactLensExpiryReminder === true || fetchCompanySetting[0].IsContactLensExpiryReminder === "true") {
                    const [qry] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.Email, customer.MobileNo1, billdetail.ProductExpDate, billmaster.ShopID, 'opticalguru_customer_contactlens_expiry_new' as Type, 'opticalguru_customer_contactlens_expiry_new' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID where customer.MobileNo1 != '' and customer.ShopID != 0 and billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billdetail.ProductExpDate = '${service_date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsCustomerOrderPendingReminder === true || fetchCompanySetting[0].IsCustomerOrderPendingReminder === "true") {
                    const [qry] = await connection.query(`SELECT billmaster.InvoiceNo, CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, DATE_FORMAT(billmaster.BillDate, '%Y-%m-%d') AS BillDate, CURDATE() AS Today, DATE_FORMAT(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY), '%Y-%m-%d') AS DeliveryDatePlus15, DATE_FORMAT(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY), '%Y-%m-%d') AS DeliveryDatePlus30, billmaster.ShopID, 'opticalguru_customer_bill_orderready_new' as MailSubject,'opticalguru_customer_bill_orderready_new' as Type FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 AND billmaster.Quantity > 0 AND customer.MobileNo1 != '' and customer.ShopID != 0 AND billmaster.ProductStatus = 'Pending' AND CURDATE() BETWEEN DATE(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY)) AND DATE(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY))`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsCustomerOrderPendingReminder === true || fetchCompanySetting[0].IsCustomerOrderPendingReminder === "true") {
                    const [qry] = await connection.query(`SELECT billmaster.InvoiceNo, billmaster.DueAmount, CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, DATE_FORMAT(billmaster.BillDate, '%Y-%m-%d') AS BillDate, CURDATE() AS Today, DATE_FORMAT(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY), '%Y-%m-%d') AS DeliveryDatePlus15, DATE_FORMAT(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY), '%Y-%m-%d') AS DeliveryDatePlus30, billmaster.ShopID, 'opticalguru_customer_balance_pending_new' as MailSubject,'opticalguru_customer_balance_pending_new' as Type FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join shop on shop.ID = customer.ShopID WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 AND billmaster.Quantity > 0 AND customer.MobileNo1 != '' and customer.ShopID != 0 AND billmaster.PaymentStatus = 'Unpaid' AND CURDATE() BETWEEN DATE(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY)) AND DATE(DATE_ADD(billmaster.BillDate, INTERVAL 15 DAY))`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }

                // console.log(datum);

                if (datum.length) {
                    for (let item of datum) {
                        const filtered = Template.filter(msg => msg.TemplateName === item.Type);
                        if (!filtered.length) {
                            console.log(`${item.Type} Whatsapp template not found`);
                            continue
                        }

                        item.ImageUrl = filtered[0]?.ImageUrl || `https://billing.eyeconoptical.in/logo.png`

                        // item.CustomerName = `Mr. Rahul Gothi`
                        // item.ShopMobileNumber = `9752885711`
                        // item.MobileNo1 = `9752885711`
                        // item.ShopName = `Wakad`

                        console.log("Item for whatsapp message sending ---", item);


                        if (item.Type === "opticalguru_customer_balance_pending_new") {
                            const sendMessage = await sendWhatsAppTextMessageNewCustomerBalPending({ CustomerName: item.CustomerName, Mobile: item.MobileNo1, ShopName: item.ShopName, ShopMobileNumber: item.ShopMobileNumber, ImageUrl: item.ImageUrl, Type: item.Type, ShopID: item.ShopID, Amount: item.DueAmount })
                            console.log(item.Type, sendMessage);
                        } else {
                            const sendMessage = await sendWhatsAppTextMessageNew({ CustomerName: item.CustomerName, Mobile: item.MobileNo1, ShopName: item.ShopName, ShopMobileNumber: item.ShopMobileNumber, ImageUrl: item.ImageUrl, Type: item.Type, ShopID: item.ShopID })
                            console.log(item.Type, sendMessage);
                        }




                    }
                } else {
                    console.log("Data not found")
                }


            }

        }

        console.log("Auto Whatsapp sent process done");


    } catch (error) {
        console.log(error)
    } finally {
        if (DB) {
            try {
                DB.release();
                console.log("✅ MySQL pool connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
            }
        }
        if (connection) {
            try {
                connection.release();
                console.log("✅ Company DB connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing company DB connection:", releaseErr);
            }
        }
    }
}

async function sendWhatsAppTextMessageNew({ CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, FileName = Type, ShopID }) {
    try {

        // 🚀 Skip if required fields are missing
        if (!CustomerName || !Mobile || !ShopName || !ShopMobileNumber || !ImageUrl || !Type || !ShopID) {
            console.log("Skipping record due to missing data:", { CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, ShopID });
            const message = `Skipping record due to missing data: ${CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, ShopID}`
            return { success: false, skipped: true };
        }

        // ✅ Validate MobileNo1 (must be at least 10 digits)
        if (!/^\d{10,}$/.test(Mobile)) {
            return {
                success: false,
                message: "MobileNo must be at least 10 digits"
            };
        }

        console.log("ShopID ===>", ShopID);


        if (ShopID == "542" || ShopID == "552") {
            return {
                success: false,
                message: `WhatsApp messaging for ${ShopName} is restricted by the admin. Please contact support for assistance.`
            };
        }

        if ((Type === "opticalguru_customer_bill_advance" || Type === "opticalguru_customer_bill_advance_new") && ImageUrl === "" && ImageUrl === "https://billing.eyeconoptical.in/logo.png") {
            return { success: false, skipped: true, message: "Please provide invoice pdf url." };
        }

        // ✅ Check if Type is in templates
        const template = templates.find(t => t.TemplateName === Type);
        if (!template) {
            const validTypes = templates.map(t => t.TemplateName);
            const message = `Skipping record: Invalid Type '${Type}'. Valid Types are: [ ${validTypes.join(", ")} ]`
            console.log(message);
            return { success: false, skipped: true, message: message };
        }

        const bodyData = {
            "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDdiNDBiOGMzMzg1MGQ1NTZhMDBhZSIsIm5hbWUiOiJFeWVjb24gT3B0aWNhbCA5NzcyIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4ZDdiNDBiOGMzMzg1MGQ1NTZhMDBhOSIsImFjdGl2ZVBsYW4iOiJGUkVFX0ZPUkVWRVIiLCJpYXQiOjE3NTg5NjY3OTV9.53av8ndwgGZDFHZQQ6A_nsMJcD8F_TVymMz0cNvlJjE",
            "campaignName": `${Type}`,
            "destination": `91${Mobile}`,
            "userName": "campaign",
            "templateParams": [
                `${CustomerName}`,
                `${ShopName}`,
                `${ShopMobileNumber}`,
                "https://eyeconoptical.in/"
            ],
            "source": "new-landing-page form",
            "media": {
                "url": `${ImageUrl}`,
                "filename": `${FileName}`
            },
            "buttons": [],
            "carouselCards": [],
            "location": {},
            "attributes": {},
            "paramsFallbackValue": {
                "FirstName": "user"
            }
        }

        console.log("bodyData:", bodyData);

        const response = await axios.post(`https://backend.aisensy.com/campaign/t1/api/v2`, bodyData, {
            headers: {
                "Content-Type": "application/json"
            }
        });


        console.log("Api Response :- ", response.data);



        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return { success: false, message: error.response?.data || error.message };
    }
}

async function sendWhatsAppTextMessageNewCustomerBalPending({ CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, FileName = Type, ShopID, Amount }) {
    try {

        // 🚀 Skip if required fields are missing
        if (!CustomerName || !Mobile || !ShopName || !ShopMobileNumber || !ImageUrl || !Type || !ShopID || !Amount) {
            console.log("Skipping record due to missing data:", { CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, ShopID });
            const message = `Skipping record due to missing data: ${CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, ShopID}`
            return { success: false, skipped: true, message };
        }

        if (!/^\d{10,}$/.test(Mobile)) {
            return {
                success: false,
                message: "MobileNo must be at least 10 digits"
            };
        }

        console.log("ShopID ===>", ShopID);


        if (ShopID == "542" || ShopID == "552") {
            return {
                success: false,
                message: `WhatsApp messaging for ${ShopName} is restricted by the admin. Please contact support for assistance.`
            };
        }

        if ((Type === "opticalguru_customer_bill_advance" || Type === "opticalguru_customer_bill_advance_new") && ImageUrl === "" && ImageUrl === "https://billing.eyeconoptical.in/logo.png") {
            return { success: false, skipped: true, message: "Please provide invoice pdf url." };
        }

        // ✅ Check if Type is in templates
        const template = templates.find(t => t.TemplateName === Type);
        if (!template) {
            const validTypes = templates.map(t => t.TemplateName);
            const message = `Skipping record: Invalid Type '${Type}'. Valid Types are: [ ${validTypes.join(", ")} ]`
            // console.log(message);
            return { success: false, skipped: true, message: message };
        }

        const bodyData = {
            "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDdiNDBiOGMzMzg1MGQ1NTZhMDBhZSIsIm5hbWUiOiJFeWVjb24gT3B0aWNhbCA5NzcyIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4ZDdiNDBiOGMzMzg1MGQ1NTZhMDBhOSIsImFjdGl2ZVBsYW4iOiJGUkVFX0ZPUkVWRVIiLCJpYXQiOjE3NTg5NjY3OTV9.53av8ndwgGZDFHZQQ6A_nsMJcD8F_TVymMz0cNvlJjE",
            "campaignName": `${Type}`,
            "destination": `91${Mobile}`,
            "userName": "campaign",
            "templateParams": [
                `${CustomerName}`,
                `${Amount}`,
                `${ShopName}`,
                `${ShopMobileNumber}`,
                "https://eyeconoptical.in/"
            ],
            "source": "new-landing-page form",
            "media": {
                "url": `${ImageUrl}`,
                "filename": `${FileName}`
            },
            "buttons": [],
            "carouselCards": [],
            "location": {},
            "attributes": {},
            "paramsFallbackValue": {
                "FirstName": "user"
            }
        }

        // console.log("bodyData:", bodyData);

        const response = await axios.post(`https://backend.aisensy.com/campaign/t1/api/v2`, bodyData, {
            headers: {
                "Content-Type": "application/json"
            }
        });


        console.log("Api Response :- ", response.data);



        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return { success: false, message: error.response?.data || error.message };
    }
}

async function sendCustomerCreditNoteWhatsAppTextMessageNew({ CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, FileName = Type, CustomerCreditNumber, CustomerCreditAmount, ShopID }) {


    try {

        // 🚀 Skip if required fields are missing
        if (!CustomerName || !Mobile || !ShopName || !ShopMobileNumber || !ImageUrl || !Type || !CustomerCreditNumber || !CustomerCreditAmount || !ShopID) {
            console.log("Skipping record due to missing data:", { CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, CustomerCreditNumber, CustomerCreditAmount, ShopID });
            const message = `Skipping record due to missing data: ${CustomerName, Mobile, ShopName, ShopMobileNumber, ImageUrl, Type, CustomerCreditNumber, CustomerCreditAmount, ShopID}`
            return { success: false, skipped: true };
        }

        // ✅ Validate MobileNo1 (must be at least 10 digits)
        if (!/^\d{10,}$/.test(Mobile)) {
            return {
                success: false,
                message: "MobileNo must be at least 10 digits"
            };
        }

        console.log("ShopID ===>", ShopID);


        if (ShopID == "542" || ShopID == "552") {
            return {
                success: false,
                message: `WhatsApp messaging for ${ShopName} is restricted by the admin. Please contact support for assistance.`
            };
        }

        if (Type === "customer_credit_note_approval_pdf_final_new_1" && ImageUrl === "" && ImageUrl === "https://billing.eyeconoptical.in/logo.png") {
            return { success: false, skipped: true, message: "Please provide customer credit not pdf url." };
        }

        // ✅ Check if Type is in templates
        const template = templates.find(t => t.TemplateName === Type);
        if (!template) {
            const validTypes = templates.map(t => t.TemplateName);
            const message = `Skipping record: Invalid Type '${Type}'. Valid Types are: [ ${validTypes.join(", ")} ]`
            console.log(message);
            return { success: false, skipped: true, message: message };
        }

        const bodyData = {
            "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDdiNDBiOGMzMzg1MGQ1NTZhMDBhZSIsIm5hbWUiOiJFeWVjb24gT3B0aWNhbCA5NzcyIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4ZDdiNDBiOGMzMzg1MGQ1NTZhMDBhOSIsImFjdGl2ZVBsYW4iOiJGUkVFX0ZPUkVWRVIiLCJpYXQiOjE3NTg5NjY3OTV9.53av8ndwgGZDFHZQQ6A_nsMJcD8F_TVymMz0cNvlJjE",
            "campaignName": `${Type}`,
            "destination": `91${Mobile}`,
            "userName": "campaign",
            "templateParams": [
                `${CustomerName}`,
                `${CustomerCreditNumber}`,
                `${CustomerCreditAmount}`,
                `${ShopName}`,
                `${ShopMobileNumber}`,
                "https://eyeconoptical.in/"
            ],
            "source": "new-landing-page form",
            "media": {
                "url": `${ImageUrl}`,
                "filename": `${FileName}`
            },
            "buttons": [],
            "carouselCards": [],
            "location": {},
            "attributes": {},
            "paramsFallbackValue": {
                "FirstName": "user"
            }
        }

        // console.log("bodyData:", bodyData);

        const response = await axios.post(`https://backend.aisensy.com/campaign/t1/api/v2`, bodyData, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("Api Response :- ", response.data);

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        return { success: false, message: error.response?.data || error.message };
    }
}

const templates = [
    {
        SNo: 1,
        TemplateName: "opticalguru_customer_balance_pending_new",
        ImageUrl: "https://billing.eyeconoptical.in/amount_pending.png"
    },
    {
        SNo: 2,
        TemplateName: "opticalguru_customer_service_new",
        ImageUrl: "https://billing.eyeconoptical.in/customer_service.png"
    },
    {
        SNo: 3,
        TemplateName: "opticalguru_customer_comfort_feedback_new",
        ImageUrl: "https://billing.eyeconoptical.in/customer_feedback.png"
    },
    {
        SNo: 4,
        TemplateName: "opticalguru_customer_contactlens_expiry_new",
        ImageUrl: "https://billing.eyeconoptical.in/contact_lens_expired.png"
    },
    {
        SNo: 5,
        TemplateName: "opticalguru_customer_eye_prescription_new",
        ImageUrl: "https://billing.eyeconoptical.in/power_priscription.png"
    },
    {
        SNo: 6,
        TemplateName: "opticalguru_customer_eye_testing_new",
        ImageUrl: "https://billing.eyeconoptical.in/eye_testing.png"
    },
    {
        SNo: 7,
        TemplateName: "opticalguru_customer_bill_orderready_new",
        ImageUrl: "https://billing.eyeconoptical.in/order_ready.png"
    },
    {
        SNo: 8,
        TemplateName: "opticalguru_customer_bill_finaldelivery_new",
        ImageUrl: "https://billing.eyeconoptical.in/final_delivery.png"
    },
    {
        SNo: 9,
        TemplateName: "opticalguru_customer_bill_advance_new",
        ImageUrl: "" // no image given // send in this invoice
    },
    {
        SNo: 10,
        TemplateName: "opticalguru_customer_anniversary_new",
        ImageUrl: "https://billing.eyeconoptical.in/anniversary.png"
    },
    {
        SNo: 11,
        TemplateName: "opticalguru_customer_birthday_new",
        ImageUrl: "https://billing.eyeconoptical.in/happy_birthday.png"
    },
    {
        SNo: 12,
        TemplateName: "customer_credit_note_approval_pdf_final_new_1",
        ImageUrl: "" // no image given // send in this invoice
    },
    {
        SNo: 13,
        TemplateName: "opticalguru_prime_member_ship_card_pdf_new",
        ImageUrl: "" // no image given // send in this invoice
    },
    {
        SNo: 14,
        TemplateName: "opticalguru_customer_bill_advance_new",
        ImageUrl: "" // no image given // send in this invoice
    },
];

async function sendDailyPendingProductMessage() {
    let connection;
    let DB;
    try {

        DB = await mysql2.pool.getConnection();

        const [company] = await DB.query(`select ID, Name from company where status = 1 and ID = 84 and WhatsappMsg = "true"`);
        if (company.length) {
            const db = await dbConnection(company[0].ID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            let CompanyID = company[0].ID

            let [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder, IsAnniversaryReminder, WhatsappSetting, ServiceDate, IsServiceReminder, FeedbackDate, IsComfortFeedBackReminder, IsEyeTesingReminder, IsSolutionExpiryReminder, IsContactLensExpiryReminder, IsCustomerOrderPendingReminder from companysetting where CompanyID = ${CompanyID}`);

            if (!fetchCompanySetting.length) {
                return res.send({ success: false, message: "Company Setting not found." })
            }

            let Template = templates
            if (!Template.length) {
                console.log("Whatsapp Template not found");
                return { message: false, message: "Whatsapp Template not found" }
            }

            // Start date: yesterday 07:00 PM
            let startDate = moment().subtract(1, "day").hour(19).minute(0).second(0).millisecond(0).format("YYYY-MM-DD HH:mm:ss");

            // End date: today 07:00 PM
            let endDate = moment().hour(19).minute(0).second(0).millisecond(0).format("YYYY-MM-DD HH:mm:ss");

            console.log("Start Date:", startDate);
            console.log("End Date:", endDate);


            if (fetchCompanySetting[0].IsCustomerOrderPendingReminder === true || fetchCompanySetting[0].IsCustomerOrderPendingReminder === "true") {
                const [qry] = await connection.query(`SELECT billmaster.InvoiceNo, CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName, CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, shop.ID as ShopID, shop.MobileNo1 as ShopMobileNumber, shop.Website, customer.MobileNo1, customer.Email, DATE_FORMAT(billmaster.DeliveryDate, '%Y-%m-%d') AS DeliveryDate, billmaster.DeliveryDate as DelDate, CURDATE() AS Today, billmaster.ShopID, 'opticalguru_customer_bill_orderready_new' as MailSubject,'opticalguru_customer_bill_orderready_new' as Type FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = customer.ShopID WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 AND billmaster.Quantity > 0 AND customer.MobileNo1 != '' AND customer.ShopID != 0 AND billmaster.ProductStatus = 'Pending' AND billmaster.DeliveryDate BETWEEN '${startDate}' AND '${endDate}'`);

                if (qry.length) {
                    for (let item of qry) {
                        const filtered = Template.filter(msg => msg.TemplateName === item.Type);
                        if (!filtered.length) {
                            console.log(`${item.Type} Whatsapp template not found`);
                            continue
                        }

                        item.ImageUrl = filtered[0]?.ImageUrl || `https://billing.eyeconoptical.in/logo.png`

                        // item.CustomerName = `Mr. Rahul Gothi`
                        // item.ShopMobileNumber = `9752885711`
                        // item.MobileNo1 = `9752885711`
                        // item.ShopName = `Wakad`


                        if (item.Type === "opticalguru_customer_balance_pending_new") {
                            const sendMessage = await sendWhatsAppTextMessageNewCustomerBalPending({ CustomerName: item.CustomerName, Mobile: item.MobileNo1, ShopName: item.ShopName, ShopMobileNumber: item.ShopMobileNumber, ImageUrl: item.ImageUrl, Type: item.Type, ShopID: item.ShopID, Amount: item.DueAmount })
                            console.log(item.Type, sendMessage);
                        } else {
                            const sendMessage = await sendWhatsAppTextMessageNew({ CustomerName: item.CustomerName, Mobile: item.MobileNo1, ShopName: item.ShopName, ShopMobileNumber: item.ShopMobileNumber, ImageUrl: item.ImageUrl, Type: item.Type, ShopID: item.ShopID })
                            console.log(item.Type, sendMessage);
                        }

                    }
                }
            }


        }


    } catch (error) {
        console.log(error)
    } finally {
        if (DB) {
            try {
                DB.release();
                console.log("✅ MySQL pool connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
            }
        }
        if (connection) {
            try {
                connection.release();
                console.log("✅ Company DB connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing company DB connection:", releaseErr);
            }
        }
    }
}


// cron
// 0 22 * * * - night 10 PM
// 0 10 * * * - morning 10 AM
// 0 11 * * * - morning 11 AM
// 15 11 * * * - mornig 11:15 AM

cron.schedule('0 11 * * *', () => {
    fetchCompanyExpiry()
});
cron.schedule('15 0 * * *', () => {
    sendReport();
});
cron.schedule('15 11 * * *', () => {
    auto_mail()
    // auto_wpmsg()
    auto_wpmsg_new()
});

// Runs every day at 7:00 PM
cron.schedule('0 19 * * *', () => {
    sendDailyPendingProductMessage()
});


