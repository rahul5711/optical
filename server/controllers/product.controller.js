const createError = require('http-errors')
const getConnection = require('../helpers/db')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const _Query = require('../helpers/queryBuilder')

module.exports = {
    save: async (req, res, next) => { 
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = {ID : 0}
            const CompanyID = 0
            const ShopID = 0
            console.log(Body);
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = await _Query.getQuery("Product", Body, LoggedOnUser, CompanyID,  ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },
    update: async (req, res, next) => { 
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = {ID : 0}
            const CompanyID = 0
            const ShopID = 0
            console.log(Body);
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = await _Query.getQuery("Product", Body, LoggedOnUser, CompanyID,  ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = saveData
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },
    delete: async (req, res, next) => { 
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = {ID : 0}
            const CompanyID = 0
            const ShopID = 0
            console.log(Body);
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`update ${Body.TableName} set Status = 0, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${LoggedOnUser.ID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = saveData
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },
    restore: async (req, res, next) => { 
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = {ID : 0}
            const CompanyID = 0
            const ShopID = 0
            console.log(Body);
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`update ${Body.TableName} set Status = 1, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${LoggedOnUser.ID}`)

            console.log(connected("Data Restore SuccessFUlly !!!"));

            response.message = "data restore sucessfully"
            response.data = saveData
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },
    getList: async (req, res, next) => { 
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = {ID : 0}
            const CompanyID = 0
            const ShopID = 0
            const query = await _Query.getQuery("getProduct", Body, LoggedOnUser, CompanyID,  ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    }

}