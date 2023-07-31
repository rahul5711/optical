const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;


module.exports = {

    // support data api

    save: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.TableName)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from supportmaster where CompanyID = '${CompanyID}' and Status = 1 and Name = '${Body.Name}'`)
            if (doesExist.length) return res.send({ message: `Data Already exist from this Name ${Body.Name}` })

            const saveData = await connection.query(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${Body.Name}', '${Body.TableName}', '${CompanyID}', 1, '${LoggedOnUser}', now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = '${Body.TableName}' order by ID desc`)
            return res.send(response)
            connection.release()
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

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.TableName)) return res.send({ message: "Invalid Query Data" })

            response.message = "fetch data sucessfully"
            response.data = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = '${Body.TableName}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    delete: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.TableName)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const deleteData = await connection.query(`update supportmaster set Status = 0, UpdatedBy = '${LoggedOnUser}', UpdatedOn = now() where Name = '${Body.Name}' and CompanyID = '${CompanyID}' and TableName = '${Body.TableName}'`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = '${Body.TableName}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    //  charge master api

    chargesave: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from chargermaster where CompanyID = '${CompanyID}' and Status = 1 and Name = '${Body.Name}'`)
            if (doesExist.length) return res.send({ message: `Data Already exist from this Name ${Body.Name}` })

            const saveData = await connection.query(`insert into chargermaster (CompanyID, Name, Description, Price,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values (${CompanyID},'${Body.Name}','${Body.Description}', ${Body.Price}, ${Body.GSTPercentage},${Body.GSTAmount},'${Body.GSTType}',${Body.TotalAmount}, 1, ${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from chargermaster where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    chargelist: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            response.message = "fetch data sucessfully"
            response.data = await connection.query(`select * from chargermaster where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },


    chargedelete: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const deleteData = await connection.query(`update chargermaster set Status = 0, UpdatedBy = '${LoggedOnUser}', UpdatedOn = now() where Name = '${Body.Name}' and CompanyID = '${CompanyID}'`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from chargermaster where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },


    //  service master api

    servicesave: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from servicemaster where CompanyID = '${CompanyID}' and Status = 1 and Name = '${Body.Name}'`)
            if (doesExist.length) return res.send({ message: `Data Already exist from this Name ${Body.Name}` })

            const saveData = await connection.query(`insert into servicemaster (CompanyID, Name, Description,Cost, Price,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values (${CompanyID},'${Body.Name}','${Body.Description}', ${Body.Cost},${Body.Price}, ${Body.GSTPercentage},${Body.GSTAmount},'${Body.GSTType}',${Body.TotalAmount}, 1, ${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from servicemaster where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    servicelist: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            response.message = "fetch data sucessfully"
            response.data = await connection.query(`select * from servicemaster where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },


    servicedelete: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const deleteData = await connection.query(`update servicemaster set Status = 0, UpdatedBy = '${LoggedOnUser}', UpdatedOn = now() where Name = '${Body.Name}' and CompanyID = '${CompanyID}'`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from servicemaster where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            return res.send(response)
            connection.release()
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },


}