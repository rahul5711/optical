const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
let ejs = require("ejs");
let path = require("path");
let pdf = require("html-pdf");
var TinyURL = require('tinyurl');
var moment = require("moment");

module.exports = {

    // user

    login: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { UserID, Password } = req.body;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (UserID.trim() === "") return res.send({ message: "Invalid UserID Data" })
            if (Password.trim() === "") return res.send({ message: "Invalid Password Data" })

            const [data] = await mysql2.pool.query(`select ID, Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser where  UserID = '${UserID}' and Password = '${Password}'`)

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
            // if (Email.trim() === "") return res.send({ message: "Invalid Email Data" })
            // if (Mobile.trim() === "") return res.send({ message: "Invalid Mobile Data" })
            if (UserID.trim() === "") return res.send({ message: "Invalid UserID Data" })
            if (ShopName.trim() === "") return res.send({ message: "Invalid ShopName Data" })
            // if (City.trim() === "") return res.send({ message: "Invalid City Data" })

            const [doesExistEmail] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser where Email = '${Email}'`)

            if (doesExistEmail.length) {
                response.data = [];
                response.success = false
                response.message = 'Email already exist';
                return res.send(response);
            }

            const [doesExistMobile] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser where Mobile = '${Mobile}'`)

            if (doesExistMobile.length) {
                response.data = [];
                response.success = false
                response.message = 'Mobile number already exist';
                return res.send(response);
            }

            const [doesExistUserID] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser where UserID = '${UserID}'`)

            if (doesExistUserID.length) {
                response.data = [];
                response.success = false
                response.message = 'UserID already exist';
                return res.send(response);
            }

            const [data] = await mysql2.pool.query(`insert into cannonuser(Name,Mobile,Email,Password,Status,Role,UserID, ShopName, City,CreatedOn)values('${Name}','${Mobile}','${Email}','${Password}',1,'User','${UserID}','${ShopName}','${City}',now())`)

            response.message = 'User registerd successfully.';
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

            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser where ID = ${ID}`)

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

            const [updateData] = await mysql2.pool.query(`update cannonuser set Name = '${Name}', ShopName = '${ShopName}',City = '${City}',Email = '${Email}',Mobile = '${Mobile}', UpdatedOn = now() where ID = ${ID}`)

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

            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, ShopName, UserID, City, Status, CreatedOn from cannonuser where  ID = ${ID}`)

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

            const [updateData] = await mysql2.pool.query(`update cannonuser set Password = '${Password}', UpdatedOn = now() where ID = ${ID}`)

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


            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, ShopName, UserID, City, Status, CreatedOn from cannonuser where ID = ${ID}`)

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


            const [updateData] = await mysql2.pool.query(`update cannonuser set Status = 0, UpdatedOn = now() where ID = ${ID}`)

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


            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, ShopName, UserID, City, Status, CreatedOn from cannonuser where ID = ${ID}`)

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


            const [updateData] = await mysql2.pool.query(`delete from cannonuser where ID = ${ID}`)

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

            let qry = `select ID, Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser order by ID desc`
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
    getDataByID: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID } = req.body;

            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })


            const [doesExist] = await mysql2.pool.query(`select Name, Mobile, Email, Role, ShopName, UserID, City, Status, CreatedOn from cannonuser where ID = ${ID}`)

            if (!doesExist.length) {
                response.data = [];
                response.success = false
                response.message = `Invalid ID, data not found`;
                return res.send(response);
            }
            response.message = "data fetch sucessfully"
            response.data = doesExist
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

            let qry = `select ID, Name, Mobile, Email, Role, UserID, ShopName, City, Status, CreatedOn from cannonuser where Name like '%${Body.searchQuery}%' OR Mobile like '%${Body.searchQuery}%' OR Email like '%${Body.searchQuery}%' OR City like '%${Body.searchQuery}%' OR ShopName like '%${Body.searchQuery}%'`

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    // Customer

    Ccreate: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" };

            const { CustomerName, Mobile, CardNumber, SupplierID, MeasurementID } = req.body;

            if (_.isEmpty(req.body))
                return res.send({ success: false, message: "Invalid Query Data" });

            if (!CustomerName || CustomerName.trim() === "")
                return res.send({ success: false, message: "Invalid CustomerName Data" });

            if (!CardNumber || CardNumber.trim() === "")
                return res.send({ success: false, message: "Invalid CardNumber Data" });

            if (!SupplierID || SupplierID.trim() === "")
                return res.send({ success: false, message: "Invalid SupplierID Data" });
            if (!MeasurementID)
                return res.send({ success: false, message: "Invalid MeasurementID Data" });
            if (!Array.isArray(MeasurementID) || MeasurementID.length === 0) {
                return res.send({
                    success: false,
                    message: "MeasurementID must be a non-empty array of objects"
                });
            }

            // CHECK: Card Number Exists
            const [doesExistSupplierID] =
                await mysql2.pool.query(`SELECT * FROM cannonuser WHERE ID = ${SupplierID}`);

            if (!doesExistSupplierID.length) {
                return res.send({
                    success: false,
                    message: "Invalid SupplierID",
                    data: []
                });
            }

            const [doesExistCardNumber] =
                await mysql2.pool.query(`SELECT CustomerName, Mobile, CardNumber FROM cannoncustomer WHERE CardNumber = ${CardNumber}`);

            if (doesExistCardNumber.length) {
                return res.send({
                    success: false,
                    message: "Card number already exists",
                    data: []
                });
            }

            // CHECK: Mobile Exists
            const [doesExistMobile] = await mysql2.pool.query(`SELECT CustomerName, Mobile FROM cannoncustomer WHERE Mobile = ${Mobile}`);

            if (doesExistMobile.length) {
                return res.send({
                    success: false,
                    message: "Mobile number already exists",
                    data: []
                });
            }

            // INSERT CUSTOMER
            const [data] =
                await mysql2.pool.query(`INSERT INTO cannoncustomer 
                (CustomerName, Mobile, CardNumber, MeasurementID, Supplier, CreatedOn) 
                VALUES (?, ?, ?, ?, NOW())`, [CustomerName, Mobile, CardNumber, MeasurementID, SupplierID]
                );

            response.success = true;
            response.message = "Customer created successfully.";
            response.data = data;

            return res.send(response);

        } catch (err) {
            next(err);
        }
    },
    Cupdate: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" };

            const { ID, CustomerName, Mobile, CardNumber, SupplierID, MeasurementID } = req.body;

            if (_.isEmpty(req.body))
                return res.send({ success: false, message: "Invalid Query Data" });

            if (!ID)
                return res.send({ success: false, message: "ID is required" });

            if (!CustomerName || CustomerName.trim() === "")
                return res.send({ success: false, message: "Invalid CustomerName Data" });

            if (!CardNumber || CardNumber.trim() === "")
                return res.send({ success: false, message: "Invalid CardNumber Data" });

            if (!SupplierID || SupplierID.trim() === "")
                return res.send({ success: false, message: "Invalid SupplierID Data" });
            if (!MeasurementID)
                return res.send({ success: false, message: "Invalid MeasurementID Data" });

            if (!Array.isArray(MeasurementID) || MeasurementID.length === 0) {
                return res.send({
                    success: false,
                    message: "MeasurementID must be a non-empty array of objects"
                });
            }

            // ✔ CHECK VALID SUPPLIER
            const [checkSupplier] =
                await mysql2.pool.query(
                    `SELECT ID FROM cannonuser WHERE ID = ?`,
                    [SupplierID]
                );

            if (!checkSupplier.length) {
                return res.send({
                    success: false,
                    message: "Invalid SupplierID",
                    data: []
                });
            }

            // ✔ CHECK CARD NUMBER EXISTS IN OTHER CUSTOMER
            const [cardExists] =
                await mysql2.pool.query(
                    `SELECT ID FROM cannoncustomer 
                 WHERE CardNumber = ? AND ID != ?`,
                    [CardNumber, ID]
                );

            if (cardExists.length) {
                return res.send({
                    success: false,
                    message: "Card number already exists for another customer",
                    data: []
                });
            }

            // ✔ CHECK MOBILE EXISTS IN OTHER CUSTOMER
            const [mobileExists] =
                await mysql2.pool.query(
                    `SELECT ID FROM cannoncustomer 
                 WHERE Mobile = ? AND ID != ?`,
                    [Mobile, ID]
                );

            if (mobileExists.length) {
                return res.send({
                    success: false,
                    message: "Mobile number already exists for another customer",
                    data: []
                });
            }

            // ✔ UPDATE CUSTOMER
            const [data] = await mysql2.pool.query(`UPDATE cannoncustomer SET CustomerName = ?, Mobile = ?, CardNumber = ?, MeasurementID = ?, Supplier = ?, UpdatedOn = NOW() WHERE ID = ?`, [CustomerName, Mobile, CardNumber, MeasurementID, SupplierID, ID]);

            response.success = true;
            response.message = "Customer updated successfully.";
            response.data = data;

            return res.send(response);

        } catch (err) {
            next(err);
        }
    },
    CcustomerDeactivate: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" };

            const { ID } = req.body;

            if (_.isEmpty(req.body))
                return res.send({ success: false, message: "Invalid Query Data" });

            if (!ID)
                return res.send({ success: false, message: "Invalid ID Data" });

            // CHECK: Customer Exists
            const [doesExist] = await mysql2.pool.query(`SELECT ID, CustomerName, Mobile, Status FROM cannoncustomer WHERE ID = ?`, [ID]);

            if (!doesExist.length) {
                response.data = [];
                response.success = false;
                response.message = "Invalid ID, data not found";
                return res.send(response);
            }

            // Already Deactivated
            if (doesExist[0].Status === 0) {
                response.data = [];
                response.success = false;
                response.message = "Customer already de-activated";
                return res.send(response);
            }

            // UPDATE STATUS
            const [updateData] = await mysql2.pool.query(`UPDATE cannoncustomer SET Status = 0, UpdatedOn =NOW() WHERE ID = ?`, [ID]);

            response.data = updateData;
            response.message = "Customer de-activated successfully";

            return res.send(response);

        } catch (err) {
            next(err);
        }
    },
    CpermanentDelete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" };

            const { ID } = req.body;

            if (_.isEmpty(req.body))
                return res.send({ success: false, message: "Invalid Query Data" });

            if (!ID)
                return res.send({ success: false, message: "Invalid ID Data" });

            // CHECK: Customer Exists
            const [doesExist] = await mysql2.pool.query(`SELECT ID, CustomerName, Mobile, Status  FROM cannoncustomer WHERE ID = ?`, [ID]);

            if (!doesExist.length) {
                response.data = [];
                response.success = false;
                response.message = "Invalid ID, data not found";
                return res.send(response);
            }

            // Already Deleted? (Optional logic)
            if (doesExist[0].Status === 0) {
                response.data = [];
                response.success = false;
                response.message = "Customer already deleted";
                return res.send(response);
            }

            // PERMANENT DELETE
            const [deleteData] = await mysql2.pool.query(`DELETE FROM cannoncustomer WHERE ID = ?`, [ID]);

            response.data = deleteData;
            response.message = "Customer deleted successfully";

            return res.send(response);

        } catch (err) {
            next(err);
        }
    },
    CgetList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" };
            const Body = req.body;

            if (_.isEmpty(Body))
                return res.send({ success: false, message: "Invalid Query Data" });

            let page = Body.currentPage || 1;
            let limit = Body.itemsPerPage || 10;
            let skip = (page - 1) * limit;

            // BASE QUERY (WITH JOIN)
            let baseQuery = `SELECT c.ID,c.CustomerName,c.Mobile,c.CardNumber,c.Supplier as SupplierID,c.Status,c.CreatedOn,u.Name AS SupplierName,u.Mobile AS SupplierMobile,u.ShopName AS SupplierShopName,u.City AS SupplierCity FROM cannoncustomer c LEFT JOIN cannonuser u ON c.Supplier = u.ID ORDER BY c.ID DESC`;

            // PAGINATION
            let paginatedQuery = `${baseQuery} LIMIT ${limit} OFFSET ${skip}`;

            // RUN QUERIES
            const [data] = await mysql2.pool.query(paginatedQuery);
            const [countRows] = await mysql2.pool.query(`SELECT COUNT(*) AS totalCount FROM cannoncustomer`);

            response.message = "Data fetched successfully";
            response.data = data;
            response.count = countRows[0].totalCount;

            return res.send(response);

        } catch (err) {
            next(err);
        }
    },
    CgetDataByID: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID } = req.body;

            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })


            const [doesExist] = await mysql2.pool.query(`SELECT c.ID,c.CustomerName,c.Mobile,c.CardNumber,c.MeasurementID,c.Supplier as SupplierID ,c.Status,c.CreatedOn,u.Name AS SupplierName,u.Mobile AS SupplierMobile,u.ShopName AS SupplierShopName,u.City AS SupplierCity FROM cannoncustomer c LEFT JOIN cannonuser u ON c.Supplier = u.ID where c.ID = ${ID}`)

            if (!doesExist.length) {
                response.data = [];
                response.success = false
                response.message = `Invalid ID, data not found`;
                return res.send(response);
            }
            response.message = "data fetch sucessfully"
            response.data = doesExist
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    CsearchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT c.ID,c.CustomerName,c.Mobile,c.CardNumber,c.MeasurementID,c.Supplier as SupplierID ,c.Status,c.CreatedOn,u.Name AS SupplierName,u.Mobile AS SupplierMobile,u.ShopName AS SupplierShopName,u.City AS SupplierCity FROM cannoncustomer c LEFT JOIN cannonuser u ON c.Supplier = u.ID where c.CustomerName like '%${Body.searchQuery}%' OR c.Mobile like '%${Body.searchQuery}%' OR c.CardNumber like '%${Body.searchQuery}%'`

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    CcardPdf: async (req, res, next) => {
        let connection;
        try {

            const printdata = req.body
            var formatName = "membershipCard.ejs";
            var file = 'CustomerCard' + "_" + printdata.CustomerName + "-" + printdata.ID + ".pdf";
            fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options

                    options = {
                        "height": "1.9in",
                        "width": "3.14in",
                    }

                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

            return

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
