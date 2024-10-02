const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')

module.exports = {
    login: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { UserID, Password } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (UserID.trim() === "") return res.send({ message: "Invalid UserID Data" })
            if (Password.trim() === "") return res.send({ message: "Invalid Password Data" })

            const [data] = await mysql2.pool.query(`select ID, Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from shahoptical where UserID = '${UserID}' and Password = '${Password}'`)

            if (!data.length) {
                response.data = [];
                response.success = false
                response.message = 'Invalid Login Id and Password.';
                return res.send(response);
            }

            if (data[0].Status === 0) {
                response.data = [];
                response.success = false
                response.message = 'User not active, Please contact admin.';
                return res.send(response);
            }

            if (data.length) {
                response.data = data;
                response.success = true
                response.message = 'User login successfully.';
            }

            response.data = data
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    create: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { Name, Email, Mobile, Password, UserID, ShopName, City } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (Name.trim() === "") return res.send({ message: "Invalid Name Data" })
            if (Password.trim() === "") return res.send({ message: "Invalid Password Data" })
            if (Email.trim() === "") return res.send({ message: "Invalid Email Data" })
            if (Mobile.trim() === "") return res.send({ message: "Invalid Mobile Data" })
            if (UserID.trim() === "") return res.send({ message: "Invalid UserID Data" })
            if (ShopName.trim() === "") return res.send({ message: "Invalid ShopName Data" })
            if (City.trim() === "") return res.send({ message: "Invalid City Data" })

            const [doesExistEmail] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from shahoptical where Email = '${Email}'`)

            if (doesExistEmail.length) {
                response.data = [];
                response.success = false
                response.message = 'Email already exist';
                return res.send(response);
            }

            const [doesExistMobile] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from shahoptical where Mobile = '${Mobile}'`)

            if (doesExistMobile.length) {
                response.data = [];
                response.success = false
                response.message = 'Mobile number already exist';
                return res.send(response);
            }

            const [doesExistUserID] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from shahoptical where UserID = '${UserID}'`)

            if (doesExistUserID.length) {
                response.data = [];
                response.success = false
                response.message = 'UserID already exist';
                return res.send(response);
            }

            const [saveData] = await mysql2.pool.query(`insert into shahoptical(Name,Mobile,Email,Password,Status,Role,UserID, ShopName, City,CreatedOn)values('${Name}','${Mobile}','${Email}','${Password}',1,'User','${UserID}','${ShopName}','${City}',now())`)

            if (data.length) {
                response.data = data;
                response.message = 'User registerd successfully.';
            }

            response.data = data
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { ID, Name, Email, Mobile, UserID, ShopName, City } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (Name.trim() === "") return res.send({ message: "Invalid Name Data" })
            if (Email.trim() === "") return res.send({ message: "Invalid Email Data" })
            if (Mobile.trim() === "") return res.send({ message: "Invalid Mobile Data" })
            if (UserID.trim() === "") return res.send({ message: "Invalid UserID Data" })
            if (ShopName.trim() === "") return res.send({ message: "Invalid ShopName Data" })
            if (City.trim() === "") return res.send({ message: "Invalid City Data" })

            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, SHopName, City, Status, CreatedOn from shahoptical where and ID = ${ID}`)

            if (!doesExist.length) {
                response.data = [];
                response.success = false
                response.message = `Inalid ID, data not found`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Email !== Email) {
                response.data = [];
                response.success = false
                response.message = `You can't change email.`;
                return res.send(response);
            }

            if (doesExist.length && doesExist[0].Mobile !== Mobile) {
                response.data = [];
                response.success = false
                response.message = `You can't change mobile number.`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].UserID !== UserID) {
                response.data = [];
                response.success = false
                response.message = `You can't change user id.`;
                return res.send(response);
            }

            const [updateData] = await mysql2.pool.query(`update shahoptical set Name = '${Name}', ShopName = '${ShopName}',City = '${City}', UpdatedOn = now() where ID = ${ID}`)

            response.data = [];
            response.message = 'Data update successfuly'

            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    changePassword: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { ID, Password } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (Password.trim() === "") return res.send({ message: "Invalid Password Data" })

            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, ShopName, UserID, City, Status, CreatedOn from shahoptical where and ID = ${ID}`)

            if (!doesExist.length) {
                response.data = [];
                response.success = false
                response.message = `Invalid ID, data not found`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Role === 'Admin') {
                response.data = [];
                response.success = false
                response.message = `You can't change admin pasword`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Status === 0) {
                response.data = [];
                response.success = false
                response.message = `User already delete`;
                return res.send(response)

            }

            const [updateData] = await mysql2.pool.query(`update shahoptical set Password = '${Password}', UpdatedOn = now() where ID = ${ID}`)

            response.data = [];
            response.message = 'Password update successfuly'
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    userDeactivate: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { ID } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })


            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, Status, CreatedOn from shahoptical where and ID = ${ID}`)

            if (!doesExist.length) {
                response.data = [];
                response.success = false
                response.message = `Invalid ID, data not found`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Role === 'Admin') {
                response.data = [];
                response.success = false
                response.message = `You can't de-activate admin role`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Status === 0) {
                response.data = [];
                response.success = false
                response.message = `User already de-activate`;
                return res.send(response)

            }


            const [updateData] = await mysql2.pool.query(`update shahoptical set Status = 0, UpdatedOn = now() where ID = ${ID}`)

            response.data = [];
            response.message = 'User de-acivate successfuly'

            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    permanentDelete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { ID } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })


            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, Status, CreatedOn from shahoptical where and ID = ${ID}`)

            if (!doesExist.length) {
                response.data = [];
                response.success = false
                response.message = `Invalid ID, data not found`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Role === 'Admin') {
                response.data = [];
                response.success = false
                response.message = `You can't delete admin role`;
                return res.send(response);
            }
            if (doesExist.length && doesExist[0].Status === 0) {
                response.data = [];
                response.success = false
                response.message = `User already delete`;
                return res.send(response)

            }


            const [updateData] = await mysql2.pool.query(`delete from shahoptical where ID = ${ID}`)

            response.data = [];
            response.message = 'User delete successfuly'

            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    getList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select ID, Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from shahoptical order by ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select ID, Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from shahoptical where Name like '%${Body.searchQuery}%' OR Mobile like '%${Body.searchQuery}%' OR Email like '%${Body.searchQuery}%' OR City like '%${Body.searchQuery}%' OR ShopName like '%${Body.searchQuery}%'`

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
