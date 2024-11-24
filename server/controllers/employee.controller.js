const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const pass_init = require('../helpers/generate_password')
const mysql2 = require('../database');
const { shopID } = require('../helpers/helper_function');


module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.Email) return res.send({ message: "Invalid Query Data" })
            if (Body.Email === "") return res.send({ message: "Invalid Query Data" })

            const [doesExistUser] = await mysql2.pool.query(`select ID from user where Email = '${Body.Email}' and Status = 1`)
            if (doesExistUser.length) return res.send({ message: `User already exist from this Email ${Body.Email}` })

            const [doesExistLoginName] = await mysql2.pool.query(`select ID from user where LoginName = '${Body.LoginName}'`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName already exist from this LoginName ${Body.LoginName}` })

            const pass = await pass_init.hash_password(Body.Password)

            const [saveUser] = await mysql2.pool.query(`insert into user(CompanyID, ShopID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB,DiscountPermission,SalePermission) values(${CompanyID},${shopid},'${Body.Name}','Employee','${Body.DOB}','${Body.Anniversary}','${Body.MobileNo1}','${Body.MobileNo2}','${Body.PhoneNo}','${Body.Email}','${Body.Address}','${Body.Branch}','${Body.PhotoURL}','${Body.Document ? JSON.stringify(Body.Document) : '[]'}','${Body.LoginName}','${pass}',1,${LoggedOnUser},${LoggedOnUser},now(),now(),${Body.CommissionType},${Body.CommissionMode},${Body.CommissionValue},${Body.CommissionValueNB},'${Body.DiscountPermission}','${Body.SalePermission}')`)

            console.log(connected("User Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveUser.insertId;
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExistUser] = await mysql2.pool.query(`select ID from user where Email = '${Body.Email}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.Email}` })

            const [doesExistLoginName] = await mysql2.pool.query(`select ID from user where LoginName = '${Body.LoginName}' and ID != ${Body.ID}`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.LoginName}` })


            const [updateUser] = await mysql2.pool.query(`update user set Name = '${Body.Name}',DOB = '${Body.DOB}',Anniversary = '${Body.Anniversary}',PhotoURL = '${Body.PhotoURL}',MobileNo1 = '${Body.MobileNo1}',MobileNo2 = '${Body.MobileNo2}',PhoneNo = '${Body.PhoneNo}',Address = '${Body.Address}',Branch='${Body.Branch}',Document='${JSON.stringify(Body.Document)}',LoginName='${Body.LoginName}',CommissionType = ${Body.CommissionType},CommissionMode=${Body.CommissionMode},CommissionValue=${Body.CommissionValue},CommissionValueNB=${Body.CommissionValueNB} ,DiscountPermission='${Body.DiscountPermission}',SalePermission='${Body.SalePermission}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Updated SuccessFUlly !!!");


            response.message = "data update sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)

            console.log('fetchCompanySetting ===> ', fetchCompanySetting);

            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select user.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from user left join user as users1 on users1.ID = user.CreatedBy left join user as users on users.ID = user.UpdatedBy where user.Status = 1 and user.CompanyID = '${CompanyID}' ${shop}  order by user.ID desc`
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

    dropdownlist: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';
            const shopid = await shopID(req.headers) || 0;

            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)

            console.log('fetchCompanySetting ===> ', fetchCompanySetting);

            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let [data] = await mysql2.pool.query(`select ID, Name, MobileNo1 from user where Status = 1 and CompanyID = ${CompanyID} ${shop} order by ID desc limit 100`);
            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from user where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "user doesnot exist from this id " })
            }


            const [deleteUser] = await mysql2.pool.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from user where Status = 0 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "user doesnot exist from this id " })
            }


            const [restoreUser] = await mysql2.pool.query(`update user set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    getUserById: async (req, res, next) => {
        try {
            const response = { data: null, UserShop: [], success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [User] = await mysql2.pool.query(`select * from user where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = User
            const [UserShop] = await mysql2.pool.query(`select usershop.*, role.Name as RoleName, shop.Name as ShopName, shop.AreaName as AreaName, user.Name as UserName from usershop left join role on role.ID = usershop.RoleID left join shop on shop.ID = usershop.ShopID left join user on user.ID = usershop.UserID where usershop.Status = 1 and usershop.UserID = ${Body.ID}`)
            response.UserShop = UserShop
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    LoginHistory: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName, user.UserGroup,  loginhistory.LoginTime AS time   from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and loginhistory.CompanyID = ${CompanyID} order by loginhistory.ID desc`
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
    LoginHistoryFilter: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let userFilterQuery = ``
            if (Body.UserID) {
                userFilterQuery = ` and loginhistory.UserID = ${Body.UserID}`
            }

            let userTimeFilter = ``
            if (Body.From && Body.To) {
                userTimeFilter = ` and loginhistory.LoginTime between '${Body.From}' and '${Body.To}'`
            }

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName, user.UserGroup from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and loginhistory.CompanyID = ${CompanyID} ${userFilterQuery} ${userTimeFilter} `


            let finalQuery = qry;


            let [data] = await mysql2.pool.query(finalQuery);

            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    updatePassword: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (!Body.Password) return res.send({ message: "Invalid Query Data" })

            const pass = await pass_init.hash_password(Body.Password)

            const [doesExist] = await mysql2.pool.query(`select ID from user where ID = '${Body.ID}' and Status = 1`)

            if (!doesExist.length) {
                return res.send({ message: "User does not exists" })
            }

            const [updateUser] = await mysql2.pool.query(`update user set Password = '${pass}' where ID = ${Body.ID}`)

            console.log(connected("User Password Updated SuccessFUlly !!!"));


            const [User] = await mysql2.pool.query(`select * from user where ID = ${Body.ID}`)



            response.message = "data update sucessfully"
            response.data = User[0]
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

            const shopid = await shopID(req.headers) || 0;

            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)

            console.log('fetchCompanySetting ===> ', fetchCompanySetting);

            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let qry = `select user.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from user left join user as users1 on users1.ID = user.CreatedBy left join user as users on users.ID = user.UpdatedBy where user.Status = 1 ${shop} and user.CompanyID = '${CompanyID}' and user.Name like '%${Body.searchQuery}%' OR user.Status = 1 ${shop} and user.CompanyID = '${CompanyID}' and user.MobileNo1 like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    searchByFeildCompanyAdmin: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup != 'CompanyAdmin' and loginhistory.CompanyID = ${CompanyID} and user.Name like '%${Body.searchQuery}%' OR loginhistory.Status = 1 and loginhistory.CompanyID = '${CompanyID}' and company.Name like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);

        } catch (err) {
            next(err);
        }
    }
}
