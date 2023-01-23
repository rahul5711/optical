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
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "CompanyAdmin") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "SuperAdmin") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "Employee") return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from role where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            if (doesExist.length) return res.send({ message: `Role Already exist from this Name ${Body.Name}` })

            const saveData = await connection.query(`insert into role(Name,CompanyID,Permission,Status,CreatedBy,CreatedOn)values('${Body.Name}', ${CompanyID}, '${Body.Permission}', 1, '${LoggedOnUser}', now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from role where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            const doesExist = await connection.query(`select * from role where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            if (doesExist.length) return res.send({ message: `Role Already exist from this Name ${Body.Name}` })

            const saveData = await connection.query(`update role set Name='${Body.Name}',Permission='${Body.Permission}',Status=1, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`update role set Status=0, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from role where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`update role set Status=1, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Restore SuccessFUlly !!!"));

            response.message = "data restore sucessfully"
            response.data = await connection.query(`select * from role where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    getList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const saveData = await connection.query(`select * from role where Status = 1 and CompanyID = ${CompanyID}`)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select role.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from role left join user as users1 on users1.ID = role.CreatedBy left join user as users on users.ID = role.UpdatedBy where role.Status = 1 and role.CompanyID = ${CompanyID} and role.Name like '%${Body.searchQuery}%'`

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            // connection.release()
            res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    }


}