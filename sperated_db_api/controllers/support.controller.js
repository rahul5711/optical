const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database');
const dbConfig = require('../helpers/db_config');
const { shopID } = require('../helpers/helper_function');


module.exports = {

    // support data api

    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.TableName)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID from supportmaster where CompanyID = ${CompanyID} and Status = 1 and Name = '${Body.Name}'`)
            if (doesExist.length) return res.send({ message: `Data Already exist from this Name ${Body.Name}` })

            const [saveData] = await connection.query(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${Body.Name}', '${Body.TableName}', ${CompanyID}, 1, '${LoggedOnUser}', now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = ${CompanyID} and TableName = '${Body.TableName}' order by ID desc`)
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
    list: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.TableName)) return res.send({ message: "Invalid Query Data" })

            response.message = "fetch data sucessfully"
            const [data] = await connection.query(`select ID, Name, Status, TableName from supportmaster where Status = 1 and CompanyID = ${CompanyID} and TableName = '${Body.TableName}' order by ID desc`)
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
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.TableName)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [deleteData] = await connection.query(`update supportmaster set Status = 0, UpdatedBy = '${LoggedOnUser}', UpdatedOn = now() where Name = '${Body.Name}' and CompanyID = ${CompanyID} and TableName = '${Body.TableName}'`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            const [data] = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = ${CompanyID} and TableName = '${Body.TableName}' order by ID desc`)
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

    //  charge master api

    chargesave: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID from chargermaster where CompanyID = ${CompanyID} and Status = 1 and Name = '${Body.Name}'`)
            if (doesExist.length) return res.send({ message: `Data Already exist from this Name ${Body.Name}` })

            const [saveData] = await connection.query(`insert into chargermaster (CompanyID, Name, Description, Price,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values (${CompanyID},'${Body.Name}','${Body.Description}', ${Body.Price}, ${Body.GSTPercentage},${Body.GSTAmount},'${Body.GSTType}',${Body.TotalAmount}, 1, ${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await connection.query(`select * from chargermaster where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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

    chargelist: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            response.message = "fetch data sucessfully"
            const [data] = await connection.query(`select * from chargermaster where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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


    chargedelete: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [deleteData] = await connection.query(`update chargermaster set Status = 0, UpdatedBy = '${LoggedOnUser}', UpdatedOn = now() where Name = '${Body.Name}' and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            const [data] = await connection.query(`select * from chargermaster where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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


    //  service master api

    servicesave: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID from servicemaster where CompanyID = ${CompanyID} and Status = 1 and Name = '${Body.Name}'`)
            if (doesExist.length) return res.send({ message: `Data Already exist from this Name ${Body.Name}` })

            const [saveData] = await connection.query(`insert into servicemaster (CompanyID, Name, Description,Cost, Price, SubTotal,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values (${CompanyID},'${Body.Name}','${Body.Description}', ${Body.Cost},${Body.Price},${Body.SubTotal},${Body.GSTPercentage},${Body.GSTAmount},'${Body.GSTType}',${Body.TotalAmount}, 1, ${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await connection.query(`select * from servicemaster where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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

    servicelist: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            response.message = "fetch data sucessfully"
            const [data] = await connection.query(`select * from servicemaster where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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


    servicedelete: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [deleteData] = await connection.query(`update servicemaster set Status = 0, UpdatedBy = '${LoggedOnUser}', UpdatedOn = now() where Name = '${Body.Name}' and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            const [data] = await connection.query(`select * from servicemaster where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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
    dropdownlistBySearch: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const { Type, Name } = Body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select SupplierShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].SupplierShopWise === 'true') {
                shop = ` and ShopID = ${shopid}`
            }

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Name Data" })
            if (_.isEmpty(Body.Type)) return res.send({ message: "Invalid Query Type Data" })

            let qry = ``;

            if (Type === "Customer") {
                qry = `select Name, ID, MobileNo1 from customer where customer.CompanyID = ${CompanyID} ${shop} and customer.Status = 1 and customer.Name like '%${Name}%'`
            } else if (Type === "Employee") {
                qry = `select Name, ID, MobileNo1 from user where user.CompanyID = ${CompanyID} ${shop} and user.Status = 1 and user.Name like '%${Name}%'`
            } else if (Type === "Fitter") {
                qry = `select Name, ID, MobileNo1 from fitter where fitter.CompanyID = ${CompanyID} ${shop} and fitter.Status = 1 and fitter.Name like '%${Name}%'`
            } else if (Type === "Doctor") {
                qry = `select Name, ID, MobileNo1 from doctor where doctor.CompanyID = ${CompanyID} ${shop} and doctor.Status = 1 and doctor.Name like '%${Name}%'`
            } else if (Type === "Supplier") {
                qry = `select Name, ID, MobileNo1 from supplier where supplier.CompanyID = ${CompanyID} ${shop} and supplier.Status = 1 and supplier.Name != 'PreOrder Supplier' and supplier.Name like '%${Name}%'`
            } else {
                return res.send({ message: "Invalid Query Type Data" })
            }

            const [data] = await connection.query(qry)
            response.data = data || []
            response.message = "data fetch successfully"
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


}