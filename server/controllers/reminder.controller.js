const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
var moment = require("moment");
const { shopID } = require('../helpers/helper_function')


module.exports = {
    getBirthDayReminder: async (req, res, next) => {
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
                qry = `select Name, MobileNo1, DOB from customer where CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}' ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, DOB from supplier where CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, DOB from user where CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, DOB from doctor where CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, DOB from fitter where CompanyID = ${CompanyID} and DATE_FORMAT(DOB, '%m-%d') = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }

            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getAnniversaryReminder: async (req, res, next) => {
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
                qry = `select Name, MobileNo1, Anniversary from customer where CompanyID = ${CompanyID} and DATE_FORMAT(Anniversary, '%m-%d')  = '${date}'  ${shopId}`
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

            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getCustomerOrderPending: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

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

            let qry = `select billmaster.InvoiceNo, customer.Name, customer.MobileNo1, DeliveryDate  from billmaster left join customer on customer.ID = billmaster.CustomerID where billmaster.CompanyID = ${CompanyID} ${shopId} and DATE_FORMAT(billmaster.DeliveryDate, '%Y-%m-%d') = '${date}'`


            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getEyeTestingReminder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

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

            let qry = `select customer.Name, customer.MobileNo1, ExpiryDate  from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID where spectacle_rx.CompanyID = ${CompanyID} ${shopId} and DATE_FORMAT(spectacle_rx.ExpiryDate, '%Y-%m-%d') = '${date}'`


            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getFeedBackReminder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const shopid = await shopID(req.headers) || 0;

            const [companysetting] = await mysql2.pool.query(`select * from companysetting where ID = ${CompanyID}`)


            let feedbackDays = Number(companysetting[0].FeedbackDate) || 0
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

            let qry = `select DISTINCT(billmaster.ID),customer.Name, customer.MobileNo1, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS') ${shopId} 
            and DATE(billmaster.BillDate) = DATE_SUB('${date}', INTERVAL ${feedbackDays} DAY)`

            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getServiceMessageReminder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { dateType } = req.body;

            if (!dateType || dateType === undefined || dateType === null) {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const shopid = await shopID(req.headers) || 0;

            const [companysetting] = await mysql2.pool.query(`select * from companysetting where ID = ${CompanyID}`)


            let serviceDays = Number(companysetting[0].ServiceDate) || 0
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

            let qry = `select DISTINCT(billmaster.ID), customer.Name, customer.MobileNo1, billmaster.BillDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName IN ('FRAME', 'LENS', 'CONTACT LENS', 'SUNGLASS')  ${shopId} and 
            DATE_FORMAT(DATE_SUB(billmaster.BillDate, INTERVAL ${serviceDays} DAY), '%Y-%m-%d') = '${date}'`
            


            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getSolutionExpiryReminder: async (req, res, next) => {
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
                qry = `select customer.Name, customer.MobileNo1, billdetail.ProductExpDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'SOLUTION' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`
            } else if (type === "Supplier") {
                qry = `select supplier.Name, supplier.MobileNo1, purchasedetailnew.ProductExpDate from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID left join supplier on supplier.ID = purchasemasternew.SupplierID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'SOLUTION' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }



            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    },
    getContactLensExpiryReminder: async (req, res, next) => {
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
                qry = `select customer.Name, customer.MobileNo1, billdetail.ProductExpDate from billdetail left join billmaster on billmaster.ID = billdetail.BillID left join customer on customer.ID = billmaster.CustomerID where billdetail.CompanyID = ${CompanyID} and billdetail.ProductTypeName = 'CONTACT LENS' and billmaster.ShopID = ${shopId} and billdetail.ProductExpDate = '${date}'`
            } else if (type === "Supplier") {
                qry = `select supplier.Name, supplier.MobileNo1, purchasedetailnew.ProductExpDate from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID left join supplier on supplier.ID = purchasemasternew.SupplierID where purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.ProductTypeName = 'CONTACT LENS' and purchasemasternew.ShopID = ${shopId} and purchasedetailnew.ProductExpDate = '${date}'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }



            const [datum] = await mysql2.pool.query(qry)

            response.data = datum || []
            response.message = "data fetch successfully"
            return res.send(response)


        } catch (error) {
            next(error)
        }
    }

}