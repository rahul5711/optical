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
                qry = `select Name, MobileNo1, DOB, Title from customer where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}' ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, DOB from supplier where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, DOB from user where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, DOB from doctor where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, DOB from fitter where status = 1 and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
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
                qry = `select Name, MobileNo1, Anniversary, Title from customer where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d')  = '${date}'  ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, Anniversary from supplier where CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, Anniversary from user where CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, Anniversary from doctor where CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, Anniversary from fitter where CompanyID = ${CompanyID} and  DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`
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

            let qry = `select billmaster.InvoiceNo, customer.Title, customer.Name, customer.MobileNo1, DeliveryDate  from billmaster left join customer on customer.ID = billmaster.CustomerID where billmaster.CompanyID = ${CompanyID} ${shopId} and billmaster.Status = 1 and billmaster.ProductStatus = 'Pending' and DATE_FORMAT(billmaster.DeliveryDate, '%Y-%m-%d') = '${date}'`

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

            let qry = `select customer.Title, customer.Name, customer.MobileNo1, ExpiryDate  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID where spectacle_rx.CompanyID = ${CompanyID} ${shopId} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${date}'`


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

            let qry = `select DISTINCT(billmaster.ID),customer.Title, customer.Name, customer.MobileNo1, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') ${shopId} 
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

            let qry = `select DISTINCT(billmaster.ID), customer.Title, customer.Name, customer.MobileNo1, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  ${shopId} AND DATE(billmaster.BillDate) = DATE_SUB('${date}', INTERVAL ${serviceDays} DAY)`

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
                qry = `select customer.Title, customer.Name, customer.MobileNo1, billdetail.ProductExpDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'SOLUTION' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`
            } else if (type === "Supplier") {
                qry = `select supplier.Name, supplier.MobileNo1, purchasedetailnew.ProductExpDate from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID left join supplier on supplier.ID = purchasemasternew.SupplierID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'SOLUTION' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`
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
                qry = `select customer.Title, customer.Name, customer.MobileNo1, billdetail.ProductExpDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`
            } else if (type === "Supplier") {
                qry = `select supplier.Name, supplier.MobileNo1, purchasedetailnew.ProductExpDate from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID left join supplier on supplier.ID = purchasemasternew.SupplierID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'CONTACT LENS' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`
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

        let [Customer_qry] = await connection.query(`select ID from customer where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}' ${shopId}`)
        let [Supplier_qry] = await connection.query(`select ID from supplier where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        let [Employee_qry] = await connection.query(`select ID from user where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        let [Doctor_qry] = await connection.query(`select ID from doctor where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
        let [Fitter_qry] = await connection.query(`select ID from fitter where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d') = '${date}'`)
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
        const [fetch] = await mysql2.pool.query(`SELECT Name, Email, EffectiveDate, CancellationDate FROM company WHERE status = 1 AND CancellationDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)`);

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

    } catch (error) {
        console.log(error);
    }
}


const fetchBirthDay = async () => {
    let connection;
    try {
        const [company] = await mysql2.pool.query(`select ID, Name from company where Status = 1`);

        let date = moment(new Date()).format("MM-DD")

        if (company.length) {
            for (let data of result) {
                const db = await dbConnection(data.ID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();

                let CompanyID = data.ID

                const [fetchCompanySetting] = await connection.query(`select IsBirthDayReminder from companysetting where CompanyID = ${CompanyID}`);

                if (!fetchCompanySetting.length) {
                    return res.send({ success: false, message: "Company Setting not found." })
                }

                if (fetchCompanySetting[0].IsBirthDayReminder === true || fetchCompanySetting[0].IsBirthDayReminder === "true") {

                    let datum = []

                    const [CustomerQry] = await connection.query(`select Name, MobileNo1, DOB, Title, Email from customer where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
                    const [SupplierQry] = await connection.query(`select Name, MobileNo1, DOB, Email from supplier where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
                    const [EmployeeQry] = await connection.query(`select Name, MobileNo1, DOB, Email from user where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
                    const [DoctorQry] = await connection.query(`select Name, MobileNo1, DOB, Email from doctor where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)
                    const [FitterQry] = await connection.query(`select Name, MobileNo1, DOB, Email from fitter where status = 1 and ShopID != 0 and Email != '' and CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`)

                    if (CustomerQry.length) {
                        datum.concat(CustomerQry)
                    }
                    if (SupplierQry.length) {
                        datum.concat(SupplierQry)
                    }
                    if (EmployeeQry.length) {
                        datum.concat(EmployeeQry)
                    }
                    if (DoctorQry.length) {
                        datum.concat(DoctorQry)
                    }
                    if (FitterQry.length) {
                        datum.concat(FitterQry)
                    }

                    if (datum.length) {
                        for (let item of datum) {

                            const mainEmail = `${item.Email}`
                            // const mainEmail = `relinksys@gmail.com`
                            const mailSubject = ``
                            const mailTemplate = ``
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



                } else {
                    console.log("IsBirthDayReminder setting off");
                }

            }

        }

    } catch (error) {
        console.log(error)
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
            connection.destroy();
        }
    }
}


// cron
// 0 22 * * * - night 10 PM
// 0 10 * * * - morning 10 AM


cron.schedule('0 22 * * *', () => {
    // fetchCompanyExpiry()
});




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