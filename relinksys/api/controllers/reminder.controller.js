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

            let qry = `select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.ShopID, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') ${shopId} 
            and DATE(billmaster.BillDate) = DATE_SUB('${date}', INTERVAL ${feedbackDays} DAY)`


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

            let qry = `select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, billmaster.BillDate, customer.Email, billmaster.ShopID from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  ${shopId} AND DATE(billmaster.BillDate) = DATE_SUB('${date}', INTERVAL ${serviceDays} DAY)`

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

        let qry = `select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') ${shopId} and DATE(billmaster.BillDate) = DATE_SUB('${date}', INTERVAL ${feedbackDays} DAY)`


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

        let qry = `select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  ${shopId} AND DATE(billmaster.BillDate) = DATE_SUB('${date}', INTERVAL ${serviceDays} DAY)`


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

                await Mail.sendMail(emailData, (err, resp) => {
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

                // if (fetchCompanySetting[0].IsAnniversaryReminder === true || fetchCompanySetting[0].IsAnniversaryReminder === "true") {
                //     const [qry] = await connection.query(`select Name, MobileNo1, Anniversary, Title, Email, ShopID, 'Customer_Anniversary' as Type, 'Anniversary' as MailSubject from customer where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)

                //     if (qry.length) {
                //         datum = datum.concat(qry);
                //     }
                // }
                if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {
                    const [qry] = await connection.query(`select Name, MobileNo1, DOB, Title, Email, ShopID, 'Customer_Birthday' as Type, 'BirthDay' as MailSubject from customer where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsServiceReminder === true || fetchCompanySetting[0].IsServiceReminder === "true") {
                    const [qry] = await connection.query(`select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'Customer_Service' as Type, 'Service Reminder' as MailSubject from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and customer.Email != '' and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  AND DATE(billmaster.BillDate) = DATE_SUB('${service_date}', INTERVAL ${serviceDays} DAY)`)

                    if (qry.length) {
                        datum = datum.concat(qry);
                    }
                }
                if (fetchCompanySetting[0].IsComfortFeedBackReminder === true || fetchCompanySetting[0].IsComfortFeedBackReminder === "true") {

                    const [qry] = await connection.query(`select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, customer.Email, billmaster.BillDate, billmaster.ShopID,'Customer_Comfort Feedback' as Type, 'FeedBack Reminder' as MailSubject  from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and customer.Email != '' and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') and DATE(billmaster.BillDate) = DATE_SUB('${service_date}', INTERVAL ${feedbackDays} DAY)`)

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

const sendReport = async () => {
    try {
        const [company] = await mysql2.pool.query(`select ID, Name from company where status = 1 and EmailMsg = "true"`);

        if (company.length) {
            for (let c of company) {
                const [fetchCompanyAdminUsers] = await mysql2.pool.query(`select ID, email from user where status = 1 and CompanyID = ${c.ID} and UserGroup='CompanyAdmin' and email != ''`);
                if (fetchCompanyAdminUsers.length) {
                    const ToEmails = await extractEmailsAsString(fetchCompanyAdminUsers);
                    const fetchSaleData = await getSalereport(c.ID)
                    // console.log("fetchCompanyAdminUsers ---->", ToEmails);

                    if (ToEmails && fetchSaleData.data.length) {
                        // console.log("fetchSaleData ---->", fetchSaleData.data);
                        //  console.log("fetchSaleData.calculation[0] ---->", fetchSaleData.calculation[0]);
                        // let date = moment(new Date()).format("YYYY-MM-DD")

                        let date = moment(new Date()).subtract(1, 'days').format("YYYY-MM-DD");
                        const workbook = new ExcelJS.Workbook();
                        const worksheet = workbook.addWorksheet(`CID_${c.ID}_Sale_report_${date}`);

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
                        // console.log("Start Exporting...");
                        fetchSaleData.data.forEach((x) => {
                            x.S_no = count++;
                            x.InvoiceDate = moment(x.BillDate).format('YYYY-MM-DD HH:mm a');
                            x.DeliveryDate = moment(x.DeliveryDate).format('YYYY-MM-DD HH:mm a');
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
                        // worksheet.autoFilter = {
                        //     from: 'A1',
                        //     to: 'AU1',
                        // };

                        worksheet.getRow(1).eachCell((cell) => {
                            cell.font = { bold: true };
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
                        });
                        if (!fs.existsSync('./uploads/')) {
                            fs.mkdirSync('./uploads/')
                        }
                        if (!fs.existsSync('./uploads/' + 'saleDaily')) {
                            fs.mkdirSync('./uploads/' + 'saleDaily')
                        }

                        //  const data = await workbook.xlsx.writeFile(path.join(__dirname, `/../uploads/saleDaily/CID_${c.ID}_Sale_report_${date}.xlsx`))

                        const buffer = await workbook.xlsx.writeBuffer();

                        const fileAttachments = [
                            {
                                filename: `CID_${c.ID}_Sale_report_${date}.xlsx`,
                                content: buffer,
                                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            },
                        ]

                        const mainEmail = `${ToEmails}`
                        // const mainEmail = `rahulg.voso@gmail.com`
                        const mailSubject = `Report: CID_${c.ID}_Sale_report_${date}`
                        const mailTemplate = `FYI`
                        const attachment = fileAttachments
                        const ccEmail = ''
                        const emailData = await { to: mainEmail, cc: ccEmail, subject: mailSubject, body: mailTemplate, attachments: attachment }

                        console.log(emailData, "emailData");

                        await Mail.sendMail(emailData, (err, resp) => {
                            if (!err) {
                                console.log({ success: true, message: 'Mail Sent Successfully' })
                            } else {
                                console.log({ success: false, message: 'Failed to send mail' })
                            }
                        })
                    }

                } else {
                    console.log("Company Admin User not found");
                }
            }
        } else {
            console.log("Company data not found");
        }

    } catch (error) {
        console.log(error);
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
cron.schedule('15 11 * * *', () => {
    auto_mail()
});
cron.schedule('0 0 * * *', () => {
    sendReport();
});
async function getSalereport(Company) {
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
        const Parem = ` and DATE_FORMAT(billmaster.BillDate,"%Y-%m-%d")  between '${date}' and '${date}'`;
        const CompanyID = Company ? Company : 0;
        const db = await dbConnection(Company);
        if (db.success === false) {
            return { db };
        }
        connection = await db.getConnection();
        // const shopid = await shopID(req.headers) || 0;
        // const LoggedOnUser = req.user.ID ? req.user.ID : 0;

        console.log("Parem ---->", Parem);


        if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

        qry = `SELECT billmaster.*, shop.Name AS ShopName, shop.AreaName AS AreaName, customer.Title AS Title , customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo, customer.Age, customer.Gender,  billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN shop ON shop.ID = billmaster.ShopID  WHERE billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1 ` + Parem + " GROUP BY billmaster.ID ORDER BY billmaster.ID DESC"

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
async function extractEmailsAsString(data) {
    return data.map(item => item.email).join(', ');
}
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