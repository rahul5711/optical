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
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from product where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            if (doesExist.length) return res.send({ message: `Product Already exist from this Name ${Body.Name}` })

            const query = await _Query.getQuery("Product", Body, LoggedOnUser, CompanyID, ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from product where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            const doesExist = await connection.query(`select * from product where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1 and ID != ${Body.ID}`)
            if (doesExist.length) return res.send({ message: `Product Already exist from this Name ${Body.Name}` })

            const query = await _Query.getQuery("Product", Body, LoggedOnUser, CompanyID, ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })
            const getProduct = await connection.query(`select * from product where ID = ${Body.ID} and CompanyID = ${CompanyID} and Status = 1`)

            const doesExist = await connection.query(`select * from productspec where ProductName = '${getProduct[0].Name}' and Status = 1 and CompanyID = ${CompanyID}`)
            if (doesExist.length) return res.send({ message: `you have to delete spec data first before you can delete product` })
            const saveData = await connection.query(`update ${Body.TableName} set Status = 0, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },
    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`update ${Body.TableName} set Status = 1, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${LoggedOnUser.ID}`)

            console.log(connected("Data Restore SuccessFUlly !!!"));

            response.message = "data restore sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },
    getList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;

            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            const query = await _Query.getQuery("getProduct", Body, LoggedOnUser, CompanyID, ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },


    saveSpec: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            const doesExistSeq = await connection.query(`select * from productspec where ProductName = '${Body.ProductName}' and CompanyID = ${CompanyID} and Status = 1 and Seq = '${Body.Seq}'`)
            if (doesExistSeq.length) return res.send({ message: `this Seq Already Exist ${Body.Seq}` })


            if (Body.Type === 'DropDown') {
                Body.SptTableName = Body.ProductName + Math.floor(Math.random() * 999999) + 1;
            } else {
                Body.SptTableName = '0'
            }




            const query = await _Query.getQuery("ProductSpec", Body, LoggedOnUser, CompanyID, ShopID)
            const saveData = await connection.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },

    deleteSpec: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })

            const saveData = await connection.query(`update ${Body.TableName} set Status = 0, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },


    getSpec: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ProductName.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = `select * from productspec where ProductName = '${Body.ProductName}' and Status = 1 and CompanyID = ${CompanyID}`
            const saveData = await connection.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },


    getFieldList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ProductName.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = `Select ProductSpec.ID as SpecID, ProductSpec.ProductName , ProductSpec.Required , ProductSpec.CompanyID, ProductSpec.Name as FieldName, ProductSpec.Seq, ProductSpec.Type as FieldType, ProductSpec.Ref, ProductSpec.SptTableName, null as SptTableData, '' as SelectedValue, false as DisplayAdd,  '' as EnteredValue, null as SptFilterData from ProductSpec where ProductSpec.ProductName = '${Body.ProductName}' and CompanyID = '${CompanyID}' and Status = 1  Order By ProductSpec.Seq ASC`

            const Data = await connection.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = Data
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },
    getProductSupportData: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName.trim() === "") return res.send({ message: "Invalid Query Data" })
            // if (Body.Ref.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = `select * from SpecSptTable where RefID = '${Body.Ref}' and TableName = '${Body.TableName}' and Status = 1`

            const Data = await connection.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = Data
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },
    saveProductSupportData: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName.trim() === "") return res.send({ message: "Invalid Query Data" })
            // if (Body.Ref.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.SelectedValue.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = `insert into SpecSptTable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${Body.TableName}','${Body.Ref}','${Body.SelectedValue}',1,now(),${LoggedOnUser.ID})`

            const Data = await connection.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = Data
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return next(error)
        }
    },

}