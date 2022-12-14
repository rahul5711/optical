const createError = require('http-errors')
const getConnection = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
// const {shopID} = require('../helpers/helper_function')
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
            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            doesExist = await connection.query(`select * from supplier where Status = 1 and MobileNo1 = '${Body.MobileNo1}' and CompanyID = ${CompanyID}`)

            if (doesExist.length) {
               return res.send({message : `supplier already exist from this number ${Body.MobileNo1}`})
            }

            dataCount = await connection.query(`select * from supplier where CompanyID = ${CompanyID}`)
            const sno = dataCount.length + 1

            const saveData = await connection.query(`insert into supplier (Sno,Name, CompanyID,  MobileNo1, MobileNo2 , PhoneNo, Address,GSTNo, Email,Website ,CINNo,Fax,PhotoURL,ContactPerson,Remark,GSTType,DOB,Anniversary, Status,CreatedBy,CreatedOn) values ('${sno}','${Body.Name}', ${CompanyID}, '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}','${Body.Address}','${Body.GSTNo}','${Body.Email}','${Body.Website}','${Body.CINNo}','${Body.Fax}','${Body.PhotoURL}','${Body.ContactPerson}','${Body.Remark}','${Body.GSTType}','${Body.DOB}','${Body.Anniversary}',1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data =  saveData.insertId;
            // connection.release()
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
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const doesExistSupplier = await connection.query(`select * from supplier where MobileNo1 = '${Body.MobileNo1}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistSupplier.length) return res.send({ message: `Supplier Already exist from this MobileNo1 ${Body.MobileNo1}` })



            const saveData = await connection.query(`update supplier set Name = '${Body.Name}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', GSTNo='${Body.GSTNo}', Email='${Body.Email}', Website='${Body.Website}', CINNo='${Body.CINNo}', Fax='${Body.Fax}', PhotoURL='${Body.PhotoURL}', ContactPerson='${Body.ContactPerson}', Remark='${Body.Remark}', DOB='${Body.DOB}',GSTType='${Body.GSTType}', Anniversary='${Body.Anniversary}',Status=1,UpdatedBy=${LoggedOnUser},UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Updated SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
            // connection.release()
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
        //     const shopid = await shopID(req.headers)
        //   console.log(shopid,'shopid');
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select supplier.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from supplier left join user as users1 on users1.ID = supplier.CreatedBy left join user as users on users.ID = supplier.UpdatedBy where supplier.Status = 1 and supplier.CompanyID = '${CompanyID}'  order by supplier.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;


            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            // connection.release()
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

            const doesExist = await connection.query(`select * from supplier where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "supplier doesnot exist from this id " })
            }


            const doesPurchase = await connection.query(`select * from purchasemasternew where Status and CompanyID = ${CompanyID} and SupplierID = ${Body.ID}`)

            if (doesPurchase.length) {
                return res.send({ message: `You can't delete this supplier because you have inventory of this supplier`})
            }

            const deleteSupplier = await connection.query(`update supplier set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Supplier Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            // connection.release()
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


            let data = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    getSupplierById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const supplier = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = supplier
            // connection.release()
            res.send(response)
        } catch (error) {
            return error
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

            let qry = `select supplier.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from supplier left join user as users1 on users1.ID = supplier.CreatedBy left join user as users on users.ID = supplier.UpdatedBy where supplier.Status = 1 and supplier.CompanyID = '${CompanyID}' and supplier.Name like '%${Body.searchQuery}%' OR supplier.Status = 1 and supplier.CompanyID = '${CompanyID}' and supplier.MobileNo1 like '%${Body.searchQuery}%' `

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            // connection.release()
            res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    }
}
