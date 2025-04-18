const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');

module.exports = {
    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "CompanyAdmin") return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "SuperAdmin") return res.send({ message: "Invalid Query Data" })
            // if (Body.Name.trim() === "Employee") return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID from role where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            if (doesExist.length) return res.send({ message: `Role Already exist from this Name ${Body.Name}` })

            const [saveData] = await connection.query(`insert into role(Name,CompanyID,Permission,Status,CreatedBy,CreatedOn)values('${Body.Name}', ${CompanyID}, '${Body.Permission}', 1, '${LoggedOnUser}', now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await connection.query(`select * from role where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
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
    update: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            // const doesExist = await connection.query(`select * from role where Name = '${Body.Name}' and CompanyID = ${CompanyID} and Status = 1`)
            // if (doesExist.length) return res.send({ message: `Role Already exist from this Name ${Body.Name}` })

            const [saveData] = await connection.query(`update role set Permission='${Body.Permission}', UpdatedOn=now(),UpdatedBy=${LoggedOnUser} where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = saveData
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
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [saveData] = await connection.query(`update role set Status=0, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            const [data] = await connection.query(`select * from role where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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
    restore: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [saveData] = await connection.query(`update role set Status=1, UpdatedOn=now(),UpdatedBy='${LoggedOnUser}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Restore SuccessFUlly !!!"));

            response.message = "data restore sucessfully"
            const [data] = await connection.query(`select * from role where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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
    getList: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [saveData] = await connection.query(`select * from role where Status = 1 and CompanyID = ${CompanyID}`)

            console.log(connected("Data Fetch SuccessFUlly !!!"));

            response.message = "data fetch sucessfully"
            response.data = saveData
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

    getRoleById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [role] = await connection.query(`select * from role where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = role
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select role.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from role left join user as users1 on users1.ID = role.CreatedBy left join user as users on users.ID = role.UpdatedBy where role.Status = 1 and role.CompanyID = ${CompanyID} and role.Name like '%${Body.searchQuery}%'`

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
    roleUpdateMany: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            let [data] = await connection.query(`select * from role where Status = 1`);


            if (data.length) {
                for (let item of data) {
                    let P = JSON.parse(item.Permission);
                    console.log(P.length);

                    // let newA = [{ "ModuleName": "Reminder", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "Quotation", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "QuotationList", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "BulkTransfer", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "BulkTransferList", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "LensGrid", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "LensGridList", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "CustomerPower", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "LocationTracker", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "Physical", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "PhysicalList", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "ProductCancelReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "ProductPendingReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "ProductExpiryReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "CashCollectionReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "SupplierDueAmonutReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "OpeningClosingStockQTY", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "OpeningClosingStockAMT", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "CustomerReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "CustomerLedgerReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "SupplierLedgerReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "FitterLedgerReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "EmployeeLedgerReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "DoctorLedgerReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "LoyalityReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "LoyalityDetailReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "OldSaleReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "OldSaleDetailReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "GSTFilingReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "PettyCashCashCounterReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "OpeningClosingReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "CustomerRewardReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "ExpensesReport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true },
                    // { "ModuleName": "SupplierExcelImport", "MView": true, "Edit": true, "Add": true, "View": true, "Delete": true }]
                    // let newPer = P.concat(newA);
                    // const [update] = await connection.query(`update role set Permission = '${JSON.stringify(newPer)}' where ID = ${item.ID}`)

                }
            }


            response.message = "data update sucessfully"
            return res.send(response);


        } catch (err) {
            console.log(err);

            next(err)
        }
    },


}