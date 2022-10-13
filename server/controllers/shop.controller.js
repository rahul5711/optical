const createError = require('http-errors')
const getConnection = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;


module.exports = {

    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`insert into shop (CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,ShopStatus ) values (${CompanyID},'${Body.Name}', '${Body.AreaName}', '${Body.Address}', '${Body.MobileNo1}','${Body.MobileNo1}','${Body.PhoneNo}','${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.BarcodeName}','${Body.Discount}','${Body.GSTnumber}','${Body.LogoURL}','${Body.ShopTiming}','${Body.WelcomeNote}',1,${LoggedOnUser}, now(),'${Body.HSNCode}','${Body.CustGSTNo}','${Body.Rate}','${Body.Discounts}','${Body.Tax}','${Body.SubTotal}','${Body.Total}',${Body.ShopStatus})`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            // response.data =  await connection.query(`select * from shop where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
            connection.release()
            return res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select * from shop where Status = 1 and CompanyID = '${CompanyID}'  order by ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    dropdownlist: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let qry = ``
            
            if (UserGroup === 'CompanyAdmin') {
                qry = `select * from shop where Status = 1 and CompanyID = '${CompanyID}'  order by ID desc`;
            } else {
                qry = `SELECT * FROM shop LEFT JOIN usershop ON usershop.ShopID = shop.ID WHERE usershop.Status = 1 AND shop.CompanyID = ${CompanyID} AND usershop.UserID = ${UserID} order by shop.ID desc`
            }

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            connection.release()
            res.send(response)
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
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from shop where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "shop doesnot exist from this id " })
            }


            const deleteShop = await connection.query(`update shop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Shop Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from shop where Status = 0 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "shop doesnot exist from this id " })
            }


            const restoreShop = await connection.query(`update shop set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Shop Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

}