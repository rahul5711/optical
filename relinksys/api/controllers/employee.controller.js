const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const pass_init = require('../helpers/generate_password')
const mysql2 = require('../database');
const { shopID } = require('../helpers/helper_function');
const dbConfig = require('../helpers/db_config');
const Mail = require('../services/mail');


module.exports = {
    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.Email) return res.send({ message: "Invalid Query Data" })
            if (Body.Email === "") return res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [fetchCompanySetting] = await connection.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].EmployeeShopWise === 'true' && (shopid === "0" || shopid === 0)) {
                return res.send({ message: "Invalid shop id, please select shop" });
            }

            const [doesExistUser] = await connection.query(`select ID from user where Email = '${Body.Email}' and Status = 1`)
            if (doesExistUser.length) return res.send({ message: `User already exist from this Email ${Body.Email}` })

            const [doesExistLoginName] = await connection.query(`select ID from user where LoginName = '${Body.LoginName}'`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName already exist from this LoginName ${Body.LoginName}` })

            const pass = await pass_init.hash_password(Body.Password)

            const [saveUser] = await mysql2.pool.query(`insert into user(CompanyID, ShopID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB,DiscountPermission,SalePermission) values(${CompanyID},${shopid},'${Body.Name}','${Body.UserGroup ? Body.UserGroup : 'Employee'}','${Body.DOB}','${Body.Anniversary}','${Body.MobileNo1}','${Body.MobileNo2}','${Body.PhoneNo}','${Body.Email}','${Body.Address}','${Body.Branch}','${Body.PhotoURL}','${Body.Document ? JSON.stringify(Body.Document) : '[]'}','${Body.LoginName}','${pass}',1,${LoggedOnUser},${LoggedOnUser},now(),now(),${Body.CommissionType},${Body.CommissionMode},${Body.CommissionValue},${Body.CommissionValueNB},'${Body.DiscountPermission}','${Body.SalePermission}')`)

            const [saveUser2] = await connection.query(`insert into user(ID, CompanyID, ShopID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB,DiscountPermission,SalePermission, IsGetReport) values(${saveUser.insertId},${CompanyID},${shopid},'${Body.Name}','${Body.UserGroup ? Body.UserGroup : 'Employee'}','${Body.DOB}','${Body.Anniversary}','${Body.MobileNo1}','${Body.MobileNo2}','${Body.PhoneNo}','${Body.Email}','${Body.Address}','${Body.Branch}','${Body.PhotoURL}','${Body.Document ? JSON.stringify(Body.Document) : '[]'}','${Body.LoginName}','${pass}',1,${LoggedOnUser},${LoggedOnUser},now(),now(),${Body.CommissionType},${Body.CommissionMode},${Body.CommissionValue},${Body.CommissionValueNB},'${Body.DiscountPermission}','${Body.SalePermission}','${Body.IsGetReport ? Body.IsGetReport : 'false'}')`)

            console.log(connected("User Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveUser.insertId;
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
    update: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [doesExistUser] = await connection.query(`select ID from user where Email = '${Body.Email}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.Email}` })

            const [doesExistLoginName] = await connection.query(`select ID from user where LoginName = '${Body.LoginName}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.LoginName}` })


            const [updateUser] = await mysql2.pool.query(`update user set Name = '${Body.Name}',DOB = '${Body.DOB}',Anniversary = '${Body.Anniversary}',PhotoURL = '${Body.PhotoURL}',MobileNo1 = '${Body.MobileNo1}',MobileNo2 = '${Body.MobileNo2}',PhoneNo = '${Body.PhoneNo}',Address = '${Body.Address}',Branch='${Body.Branch}',Document='${JSON.stringify(Body.Document)}',LoginName='${Body.LoginName}',CommissionType = ${Body.CommissionType},CommissionMode=${Body.CommissionMode},CommissionValue=${Body.CommissionValue},CommissionValueNB=${Body.CommissionValueNB} ,DiscountPermission='${Body.DiscountPermission}',SalePermission='${Body.SalePermission}', UserGroup = '${Body.UserGroup ? Body.UserGroup : 'Employee'}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            const [updateUser2] = await connection.query(`update user set Name = '${Body.Name}',DOB = '${Body.DOB}',Anniversary = '${Body.Anniversary}',PhotoURL = '${Body.PhotoURL}',MobileNo1 = '${Body.MobileNo1}',MobileNo2 = '${Body.MobileNo2}',PhoneNo = '${Body.PhoneNo}',Address = '${Body.Address}',Branch='${Body.Branch}',Document='${JSON.stringify(Body.Document)}',LoginName='${Body.LoginName}',CommissionType = ${Body.CommissionType},CommissionMode=${Body.CommissionMode},CommissionValue=${Body.CommissionValue},CommissionValueNB=${Body.CommissionValueNB} ,DiscountPermission='${Body.DiscountPermission}',SalePermission='${Body.SalePermission}', UserGroup = '${Body.UserGroup ? Body.UserGroup : 'Employee'}', IsGetReport = '${Body.IsGetReport ? Body.IsGetReport : 'false'}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Updated SuccessFUlly !!!");


            response.message = "data update sucessfully"
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
    list: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            const shopid = await shopID(req.headers) || 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select user.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from user left join user as users1 on users1.ID = user.CreatedBy left join user as users on users.ID = user.UpdatedBy where user.Status = 1 and user.CompanyID = ${CompanyID} ${shop}  order by user.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
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

    dropdownlist: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';
            const shopid = await shopID(req.headers) || 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let [data] = await connection.query(`select ID, Name, MobileNo1 from user where Status = 1 and CompanyID = ${CompanyID} ${shop} order by ID desc limit 100`);
            response.message = "data fetch sucessfully"
            response.data = data
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

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [doesExist] = await connection.query(`select ID from user where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "user doesnot exist from this id " })
            }


            const [deleteUser] = await mysql2.pool.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)
            const [deleteUser2] = await connection.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Delete SuccessFUlly !!!");

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

    restore: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [doesExist] = await connection.query(`select ID from user where Status = 0 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "user doesnot exist from this id " })
            }


            const [restoreUser] = await mysql2.pool.query(`update user set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)
            const [restoreUser2] = await connection.query(`update user set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("User Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"
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

    getUserById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, UserShop: [], success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [User] = await connection.query(`select * from user where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = User
            const [UserShop] = await connection.query(`select usershop.*, role.Name as RoleName, shop.Name as ShopName, shop.AreaName as AreaName, user.Name as UserName from usershop left join role on role.ID = usershop.RoleID left join shop on shop.ID = usershop.ShopID left join user on user.ID = usershop.UserID where usershop.Status = 1 and usershop.UserID = ${Body.ID}`)
            response.UserShop = UserShop
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

    LoginHistory: async (req, res, next) => {
        let connection;
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
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    LoginHistoryFilter: async (req, res, next) => {
        let connection;
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
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    updatePassword: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (!Body.Password) return res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const pass = await pass_init.hash_password(Body.Password)

            const [doesExist] = await connection.query(`select ID from user where ID = ${Body.ID} and Status = 1`)

            if (!doesExist.length) {
                return res.send({ message: "User does not exists" })
            }

            const [updateUser] = await mysql2.pool.query(`update user set Password = '${pass}' where ID = ${Body.ID}`)
            const [updateUser2] = await connection.query(`update user set Password = '${pass}' where ID = ${Body.ID}`)

            console.log(connected("User Password Updated SuccessFUlly !!!"));


            const [User] = await connection.query(`select * from user where ID = ${Body.ID}`)



            response.message = "data update sucessfully"
            response.data = User[0]
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

    searchByFeild: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            const shopid = await shopID(req.headers) || 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let qry = `select user.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from user left join user as users1 on users1.ID = user.CreatedBy left join user as users on users.ID = user.UpdatedBy where user.Status = 1 ${shop} and user.CompanyID = ${CompanyID} and user.Name like '%${Body.searchQuery}%' OR user.Status = 1 ${shop} and user.CompanyID = ${CompanyID} and user.MobileNo1 like '%${Body.searchQuery}%' `

            let [data] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
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
    searchByFeildCompanyAdmin: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup != 'CompanyAdmin' and loginhistory.CompanyID = ${CompanyID} and user.Name like '%${Body.searchQuery}%' OR loginhistory.Status = 1 and loginhistory.CompanyID = ${CompanyID} and company.Name like '%${Body.searchQuery}%' `

            let [data] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    forgetPassword: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.authid.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select user.ID, user.CompanyID, user.LoginName, company.Email as CompanyEmail from user left join company on company.ID = user.CompanyID where user.status = 1 and user.LoginName = '${Body.authid}' OR user.status = 1 and user.Email = '${Body.authid}'`

            let [data] = await mysql2.pool.query(qry);
            let genPassword = await generateRandomPassword()
            const pass = await pass_init.hash_password(genPassword)

            if (data.length) {
                const db = await dbConfig.dbByCompanyID(data[0].CompanyID);
                connection = await db.getConnection();
                const [updateUser] = await mysql2.pool.query(`update user set Password = '${pass}' where ID = ${data[0].ID}`)
                const [updateUser2] = await connection.query(`update user set Password = '${pass}' where ID = ${data[0].ID}`)
                console.log(connected("User Password Updated SuccessFUlly !!!"));
            }
            const mainEmail = data[0].CompanyEmail
            const ccEmail = 'relinksys@gmail.com'
            const mailSubject = 'OpticalGuru Password Reset Request';
            const mailTemplate = `<p>Dear <strong style="text-transform: capitalize;">${data[0].LoginName}</strong>,</p>
<p>We received a request to reset your password for your account.</p>

<p>Your temporary password is: <strong>${genPassword}</strong></p>

<p>If you did not request a password reset, please ignore this message or contact support.</p>

<p>For any help, reach out to your Sales representative or email us at <a href="mailto:relinksys@gmail.com">relinksys@gmail.com</a>.</p>


 <strong>Thanks for your Business</strong> 
 
  <div style="position: relative; width: 100%; max-width: 100%; display: flex; flex-wrap: wrap; align-items: center; padding: 10px; margin: auto; box-sizing: border-box;">
  <div style="flex: 1 1 100%; max-width: 240px; padding-right: 2%; border-right: 2px solid #000; display: flex; justify-content: center; box-sizing: border-box; align-items: center;">
    <img src="https://theopticalguru.relinksys.com/assest/relinksyslogo.png" alt="LOGO" style="width: 100%; max-width: 200px; height: auto; padding-top: 4%;" />
  </div>

  <div style="flex: 1 1 100%; max-width: 400px; padding-left: 2%; box-sizing: border-box;">
    <h2 style="margin: 0; padding-top: 2%; font-size: 1.5rem;">
      <span style="color: rgb(243, 113, 53); font-weight: bold;">Relinksys Software Pvt. Ltd.</span>
    </h2>
    <h4 style="margin: 0; font-size: 1rem;">
      <span>Branch: Pune</span><br>
      <span>Mob: 9766666248 / 9130366248</span><br>
      <span>Web: <a href="https://www.relinksys.com" target="_blank">www.relinksys.com</a></span>
    </h4>

    <hr style="margin: 5px 0; border-color: rgb(243, 113, 53);">

    <div>
      <h4 style="margin: 0; font-size: 1rem;">Follow:</h4>
      <a href="https://www.facebook.com/relinksys" target="_blank">
        <img src="https://cdn-icons-png.freepik.com/256/13051/13051733.png?uid=R197419144&ga=GA1.1.1547618945.1741080986&semt=ais_hybrid" alt="F" style="width: 24px; margin-right: 10px;" />
      </a>
      <a href="https://www.instagram.com/relinksys/" target="_blank">
        <img src="https://cdn-icons-png.freepik.com/256/2111/2111463.png?uid=R197419144&ga=GA1.1.1547618945.1741080986&semt=ais_hybrid" alt="I" style="width: 24px; margin-right: 10px;" />
      </a>
      <a href="https://www.facebook.com/Bestopticalsoftware" target="_blank">
        <img src="https://cdn-icons-png.freepik.com/256/13051/13051733.png?uid=R197419144&ga=GA1.1.1547618945.1741080986&semt=ais_hybrid" alt="F" style="width: 24px;" />
      </a>
    </div>
  </div>
</div>

<style>
  @media (max-width: 768px) {
    div[style*="width: 100%; max-width: 1200px"] {
      flex-direction: column;
      text-align: center;
    }

    div[style*="width: 100%; max-width: 1200px"] > div {
      flex: 1 1 100%;
      max-width: 100%;
      padding: 10px 0;
      border-right: none;
    }

   div[style*="width: 100%; max-width: 1200px"] > div img {
      width: 40px; /* Adjusted for mobile */
      max-width: 40px;
      padding-top: 2%;
    }
  }
</style>

`;
            const emailData = await { to: mainEmail, cc: ccEmail, subject: mailSubject, body: mailTemplate }
            await Mail.sendMail(emailData, (err, resp) => {
                if (!err) {
                    return res.send({ success: true, message: 'Mail Sent Successfully' })
                } else {
                    return res.send({ success: false, message: 'Failed to send mail' })
                }
            })

            response.message = "Mail Sent Successfully"
            response.data = data
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err);
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    }
}

async function generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
