const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')

module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "CompanyAdmin") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "SuperAdmin") return res.send({ message: "Invalid Query Data" })
            // if (Body.Name.trim() === "Employee") return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from role where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            if (doesExist.length) return res.send({ message: `Role Already exist from this Name ${Body.Name}` })

            const [saveData] = await mysql2.pool.query(`insert into role(Name,CompanyID,Permission,Status,CreatedBy,CreatedOn)values('${Body.Name}', ${CompanyID}, '${Body.Permission}', 1, '${LoggedOnUser}', now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await mysql2.pool.query(`select * from role where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
            response.data = data
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            // const doesExist = await connection.query(`select * from role where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            // if (doesExist.length) return res.send({ message: `Role Already exist from this Name ${Body.Name}` })

            const [saveData] = await mysql2.pool.query(`update role set Permission='${Body.Permission}', UpdatedOn=now(),UpdatedBy=${LoggedOnUser} where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [saveData] = await mysql2.pool.query(`update role set Status=0, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            const [data] = await mysql2.pool.query(`select * from role where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [saveData] = await mysql2.pool.query(`update role set Status=1, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Restore SuccessFUlly !!!"));

            response.message = "data restore sucessfully"
            const [data] = await mysql2.pool.query(`select * from role where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            response.data = data
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const [saveData] = await mysql2.pool.query(`select * from role where Status = 1 and CompanyID = ${CompanyID}`)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    getRoleById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [role] = await mysql2.pool.query(`select * from role where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = role
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select role.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from role left join user as users1 on users1.ID = role.CreatedBy left join user as users on users.ID = role.UpdatedBy where role.Status = 1 and role.CompanyID = ${CompanyID} and role.Name like '%${Body.searchQuery}%'`

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        }
    }


}