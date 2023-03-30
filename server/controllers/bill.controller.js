const createError = require('http-errors')
const mysql = require('../helpers/db')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID } = require('../helpers/helper_function')
module.exports = {
    getDoctor: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from doctor where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getEmployee: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from user where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getTrayNo: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'TrayNo' order by ID desc`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    searchByBarcodeNo: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const {Req,PreOrder,ShopMode} = req.body
            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === "false") {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;
            }

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    }

}
