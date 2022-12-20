const createError = require('http-errors')
const getConnection = require('../helpers/db')
const { generateBarcode, doesExistProduct, shopID } = require('../helpers/helper_function')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;


module.exports = {
    create: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";

            const {
                purchaseMaseterData,
                purchaseDetailData,
                charge
            } = req.body

        } catch (error) {
            return error
        }
    }

}
