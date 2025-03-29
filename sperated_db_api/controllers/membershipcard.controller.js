const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
var moment = require("moment");
const { shopID } = require('../helpers/helper_function')

module.exports = {
    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) {
                return res.send({ message: "Invalid Query Data" });
            }
            if (!Body.IssueDate) return res.send({ message: "Invalid Query Data" })
            if (!Body.ExpiryDate) return res.send({ message: "Invalid Query Data" })
            if (Body.CustomerID == null || Body.CustomerID == "null" || Body.CustomerID === undefined || Body.CustomerID === "None" || Body.CustomerID == 0) {
                return res.send({ message: "Invalid Query CustomerID Data" })
            }
            if (shopid === 0 || shopid === "0") {
                return res.send({ message: "Invalid Query Shop ID Data" })
            }

            const [save] = await connection.query(`insert into membershipcard(CustomerID,CompanyID,ShopID,IssueDate,ExpiryDate,Status,CreatedBy,CreatedOn) values(${Body.CustomerID},${CompanyID},${shopid}, '${Body.IssueDate}','${Body.ExpiryDate}',1,'${LoggedOnUser}',now())`);

            console.log(connected("Membershipcard Added SuccessFUlly !!!"));

            const [data] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName, membershipcard.* from membershipcard left join customer on customer.ID = membershipcard.CustomerID where membershipcard.Status = 1 and membershipcard.CompanyID = ${CompanyID} and membershipcard.ShopID = ${shopid} and membershipcard.CustomerID = ${Body.CustomerID} order by membershipcard.ID desc`);

            response.data = data || []

            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    delete: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, CustomerID from membershipcard where Status = 1 and CompanyID = '${CompanyID}' and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "Membershipcard doesnot exist from this id " })
            }

            const [deleteData] = await connection.query(`update membershipcard set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)
            console.log("Membershipcard Delete SuccessFUlly !!!");

            const [data] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName, membershipcard.* from membershipcard left join customer on customer.ID = membershipcard.CustomerID where membershipcard.Status = 1 and membershipcard.CompanyID = ${CompanyID} and membershipcard.CustomerID = ${doesExist[0].CustomerID} order by membershipcard.ID desc`);

            response.data = data || []

            response.message = "data delete sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getMembershipcardByCustomerID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [data] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName, membershipcard.* from membershipcard left join customer on customer.ID = membershipcard.CustomerID where membershipcard.Status = 1 and membershipcard.CompanyID = ${CompanyID} and membershipcard.CustomerID = ${Body.ID} order by membershipcard.ID desc`);

            response.data = data || []
            response.message = "data fetch sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    report: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const { Parem } = req.body;
            if (Parem === "" || Parem === undefined || Parem === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [data] = await connection.query(`select CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName, membershipcard.* from membershipcard left join customer on customer.ID = membershipcard.CustomerID where membershipcard.Status = 1 and membershipcard.CompanyID = ${CompanyID}  ${Parem}`);

            response.data = data || []
            response.message = "data fetch sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

}
