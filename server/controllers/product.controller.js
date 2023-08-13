const createError = require('http-errors')
const mysql = require('../newdb')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const _Query = require('../helpers/queryBuilder')
const mysql2 = require('../database')

module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from product where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            if (doesExist.length) return res.send({ message: `Product Already exist from this Name ${Body.Name}` })

            const query = await _Query.getQuery("Product", Body, LoggedOnUser, CompanyID, ShopID)
            const [saveData] = await mysql2.pool.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await mysql2.pool.query(`select * from product where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
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
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            const [doesExist] = await mysql2.pool.query(`select * from product where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1 and ID != ${Body.ID}`)
            if (doesExist.length) return res.send({ message: `Product Already exist from this Name ${Body.Name}` })

            const query = await _Query.getQuery("Product", Body, LoggedOnUser, CompanyID, ShopID)
            const [saveData] = await mysql2.pool.query(query)

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
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })
            const [getProduct] = await mysql2.pool.query(`select * from product where ID = ${Body.ID} and CompanyID = ${CompanyID} and Status = 1`)

            const [doesExist] = await mysql2.pool.query(`select * from productspec where ProductName = '${getProduct[0].Name}' and Status = 1 and CompanyID = ${CompanyID}`)
            if (doesExist.length) return res.send({ message: `you have to delete spec data first before you can delete product` })
            const [saveData] = await mysql2.pool.query(`update ${Body.TableName} set Status = 0, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })

            const [saveData] = await mysql2.pool.query(`update ${Body.TableName} set Status = 1, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID} and CompanyID = ${LoggedOnUser.ID}`)

            console.log(connected("Data Restore SuccessFUlly !!!"));

            response.message = "data restore sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;

            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            // const query = await _Query.getQuery("getProduct", Body, LoggedOnUser, CompanyID, ShopID)
            const [saveData] = await mysql2.pool.query(`select product.*, user.Name as CreatedPerson, users.Name as UpdatedPerson from product left join user on user.ID = product.CreatedBy left join user as users on users.ID = product.UpdatedBy where product.Status = 1 and product.CompanyID = ${CompanyID}`)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },


    saveSpec: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            const [doesExistSeq] = await mysql2.pool.query(`select * from productspec where ProductName = '${Body.ProductName}' and CompanyID = ${CompanyID} and Status = 1 and Seq = '${Body.Seq}'`)
            if (doesExistSeq.length) return res.send({ message: `this Seq Already Exist ${Body.Seq}` })


            if (Body.Type === 'DropDown') {
                Body.SptTableName = Body.ProductName + Math.floor(Math.random() * 999999) + 1;
            } else {
                Body.SptTableName = '0'
            }




            const query = await _Query.getQuery("ProductSpec", Body, LoggedOnUser, CompanyID, ShopID)
            const [saveData] = await mysql2.pool.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    deleteSpec: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ID === null) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName === "") return res.send({ message: "Invalid Query Data" })

            const [saveData] = await mysql2.pool.query(`update ${Body.TableName} set Status = 0, UpdatedBy = ${LoggedOnUser.ID}, UpdatedOn = now() where ID = ${Body.ID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            err
        }
    },


    getSpec: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ProductName.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = `select * from productspec where ProductName = '${Body.ProductName}' and Status = 1 and CompanyID = ${CompanyID}`
            const [saveData] = await mysql2.pool.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },


    getFieldList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.ProductName.trim() === "") return res.send({ message: "Invalid Query Data" })


            console.log("Body =================================>", Body);

            const query = `Select productspec.ID as SpecID, productspec.ProductName , productspec.Required , productspec.CompanyID, productspec.Name as FieldName, productspec.Seq, productspec.Type as FieldType, productspec.Ref, productspec.SptTableName, null as SptTableData, '' as SelectedValue, false as DisplayAdd,  '' as EnteredValue, null as SptFilterData from productspec where productspec.ProductName = '${Body.ProductName}' and CompanyID = '${CompanyID}' and Status = 1  Order By productspec.Seq ASC`

            const [Data] = await mysql2.pool.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = Data
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getProductSupportData: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName.trim() === "") return res.send({ message: "Invalid Query Data" })
            // if (Body.Ref.trim() === "") return res.send({ message: "Invalid Query Data" })


            console.log("getProductSupportData========================================>", Body);

            const query = `select * from specspttable where RefID = '${Body.Ref}' and TableName = '${Body.TableName}' and Status = 1`

            const [Data] = await mysql2.pool.query(query)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = Data
            // await connection.query("COMMIT");
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    saveProductSupportData: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = { ID: req.user.ID ? req.user.ID : 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = 0
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.TableName.trim() === "") return res.send({ message: "Invalid Query Data" })
            // if (Body.Ref.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.SelectedValue.trim() === "") return res.send({ message: "Invalid Query Data" })

            const query = `insert into specspttable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${Body.TableName}','${Body.Ref}','${Body.SelectedValue}',1,now(),${LoggedOnUser.ID})`

            const [Data] = await mysql2.pool.query(query)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = Data
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

}