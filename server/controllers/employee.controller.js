const createError = require('http-errors')
const mysql = require('../newdb')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const _Query = require('../helpers/queryBuilder')
const pass_init = require('../helpers/generate_password')


module.exports = {
    save: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.Email) return res.send({ message: "Invalid Query Data" })
            if (Body.Email === "") return res.send({ message: "Invalid Query Data" })

            const doesExistUser = await connection.query(`select * from user where Email = '${Body.Email}' and Status = 1`)
            if (doesExistUser.length) return res.send({ message: `User already exist from this Email ${Body.Email}` })

            const doesExistLoginName = await connection.query(`select * from user where LoginName = '${Body.LoginName}'`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName already exist from this LoginName ${Body.LoginName}` })

            const pass = await pass_init.hash_password(Body.Password)

            const saveUser = await connection.query(`insert into user(CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${CompanyID},'${Body.Name}','Employee','${Body.DOB}','${Body.Anniversary}','${Body.MobileNo1}','${Body.MobileNo2}','${Body.PhoneNo}','${Body.Email}','${Body.Address}','${Body.Branch}','${Body.PhotoURL}','${Body.Document}','${Body.LoginName}','${pass}',1,${LoggedOnUser},${LoggedOnUser},now(),now(),${Body.CommissionType},${Body.CommissionMode},${Body.CommissionValue},${Body.CommissionValueNB})`)

            console.log(connected("User Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveUser.insertId;
            await connection.query("COMMIT");
            return res.send(response);

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    update: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExistUser = await connection.query(`select * from user where Email = '${Body.Email}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.Email}` })

            const doesExistLoginName = await connection.query(`select * from user where LoginName = '${Body.LoginName}' and ID != ${Body.ID}`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.LoginName}` })


            const updateUser = await connection.query(`update user set Name = '${Body.Name}',DOB = '${Body.DOB}',Anniversary = '${Body.Anniversary}',PhotoURL = '${Body.PhotoURL}',MobileNo1 = '${Body.MobileNo1}',MobileNo2 = '${Body.MobileNo2}',PhoneNo = '${Body.PhoneNo}',Address = '${Body.Address}',Branch='${Body.Branch}',Document='${Body.Document}',LoginName='${Body.LoginName}',CommissionType = ${Body.CommissionType},CommissionMode=${Body.CommissionMode},CommissionValue=${Body.CommissionValue},CommissionValueNB=${Body.CommissionValueNB} where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Updated SuccessFUlly !!!");


            response.message = "data update sucessfully"
            await connection.query("COMMIT");
            return res.send(response);

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
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select user.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from user left join user as users1 on users1.ID = user.CreatedBy left join user as users on users.ID = user.UpdatedBy where user.Status = 1 and user.CompanyID = '${CompanyID}'  order by user.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            await connection.query("COMMIT");
            return res.send(response);
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    dropdownlist: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from user where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            await connection.query("COMMIT");
            return res.send(response);
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
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from user where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "user doesnot exist from this id " })
            }


            const deleteUser = await connection.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            await connection.query("COMMIT");
            return res.send(response);
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    restore: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from user where Status = 0 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "user doesnot exist from this id " })
            }


            const restoreUser = await connection.query(`update user set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"
            await connection.query("COMMIT");
            return res.send(response);
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    getUserById: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, UserShop: [], success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const User = await connection.query(`select * from user where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = User
            response.UserShop = await connection.query(`select usershop.*, role.Name as RoleName, shop.Name as ShopName, shop.AreaName as AreaName, user.Name as UserName from usershop left join role on role.ID = usershop.RoleID left join shop on shop.ID = usershop.ShopID left join user on user.ID = usershop.UserID where usershop.Status = 1 and usershop.UserID = ${Body.ID}`)
            await connection.query("COMMIT");
            return res.send(response);
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    LoginHistory: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup != 'CompanyAdmin' and loginhistory.CompanyID = ${CompanyID} order by loginhistory.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;


            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            await connection.query("COMMIT");
            return res.send(response);
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    updatePassword: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (!Body.Password) return res.send({ message: "Invalid Query Data" })

            const pass = await pass_init.hash_password(Body.Password)

            doesExist = await connection.query(`select * from user where ID = '${Body.ID}' and Status = 1`)

            if (!doesExist.length) {
                return res.send({ message: "User does not exists" })
            }

            const updateUser = await connection.query(`update user set Password = '${pass}' where ID = ${Body.ID}`)

            console.log(connected("User Password Updated SuccessFUlly !!!"));


            const User = await connection.query(`select * from user where ID = ${Body.ID}`)



            response.message = "data update sucessfully"
            response.data = User[0]
            await connection.query("COMMIT");
            return res.send(response);
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    searchByFeild: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select user.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from user left join user as users1 on users1.ID = user.CreatedBy left join user as users on users.ID = user.UpdatedBy where user.Status = 1 and user.CompanyID = '${CompanyID}' and user.Name like '%${Body.searchQuery}%' OR user.Status = 1 and user.CompanyID = '${CompanyID}' and user.MobileNo1 like '%${Body.searchQuery}%' `

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            await connection.query("COMMIT");
            return res.send(response);

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    searchByFeildCompanyAdmin: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup != 'CompanyAdmin' and loginhistory.CompanyID = ${CompanyID} and user.Name like '%${Body.searchQuery}%' OR loginhistory.Status = 1 and loginhistory.CompanyID = '${CompanyID}' and company.Name like '%${Body.searchQuery}%' `

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            await connection.query("COMMIT");
            return res.send(response);

        } catch (err) {
            next(err);
        }
    }
}
