const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID, generateInvoiceNo, generateBillSno, generateCommission, generateBarcode, generatePreOrderProduct, generateUniqueBarcodePreOrder, gstDetailBill, generateUniqueBarcode } = require('../helpers/helper_function')


module.exports = {
    getInvoicePayment: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;

            const { PaymentType, PayeeName } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.PaymentType) return res.send({ message: "Invalid Query Data" })
            if (!Body.PayeeName) return res.send({ message: "Invalid Query Data" })

            let qry = ``

            if (PaymentType === 'Supplier') {

            } else if (PaymentType === 'Fitter') {

            } else if (PaymentType === 'Customer') {

            }


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    }
}
