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

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).format("YYYY-MM-DD").add(1,'days');
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).format("YYYY-MM-DD").add(-1, 'days');
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            if (type === 'Customer') {
                qry = `select Name, MobileNo1, DOB from customer where CompanyID = ${CompanyID} and DOB = '${date}' ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, DOB from supplier where CompanyID = ${CompanyID} and DOB = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, DOB from user where CompanyID = ${CompanyID} and DOB = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, DOB from doctor where CompanyID = ${CompanyID} and DOB = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, DOB from fitter where CompanyID = ${CompanyID} and DOB = '${date}'`
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

            let date = moment(new Date()).format("YYYY-MM-DD")

            if (dateType === 'today') {
                date = moment(new Date()).format("YYYY-MM-DD");
            } else if (dateType === 'tomorrow') {
                date = moment(new Date()).format("YYYY-MM-DD").add(1,'days');
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).format("YYYY-MM-DD").add(-1, 'days');
            } else {
                return res.send({ message: "Invalid Query dateType Data" })
            }

            if (type === 'Customer') {
                qry = `select Name, MobileNo1, Anniversary from customer where CompanyID = ${CompanyID} and Anniversary = '${date}'  ${shopId}`
            } else if (type === 'Supplier') {
                qry = `select Name, MobileNo1, Anniversary from supplier where CompanyID = ${CompanyID} and Anniversary = '${date}'`
            } else if (type === 'Employee') {
                qry = `select Name, MobileNo1, Anniversary from user where CompanyID = ${CompanyID} and Anniversary = '${date}'`
            } else if (type === 'Doctor') {
                qry = `select Name, MobileNo1, Anniversary from doctor where CompanyID = ${CompanyID} and Anniversary = '${date}'`
            } else if (type === 'Fitter') {
                qry = `select Name, MobileNo1, Anniversary from fitter where CompanyID = ${CompanyID} and Anniversary = '${date}'`
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
                date = moment(new Date()).format("YYYY-MM-DD").add(1,'days');
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).format("YYYY-MM-DD").add(-1, 'days');
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
                date = moment(new Date()).format("YYYY-MM-DD").add(1,'days');
            } else if (dateType === 'yesterday') {
                date = moment(new Date()).format("YYYY-MM-DD").add(-1, 'days');
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
    }

}