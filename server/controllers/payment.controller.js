const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID, generateInvoiceNo, generateBillSno, generateCommission, generateBarcode, generatePreOrderProduct, generateUniqueBarcodePreOrder, gstDetailBill, generateUniqueBarcode } = require('../helpers/helper_function')


module.exports = {
    getInvoicePayment: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;

            const { PaymentType, PayeeName } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.PaymentType) return res.send({ message: "Invalid Query Data" })
            if (!Body.PayeeName) return res.send({ message: "Invalid Query Data" })

            let qry = ``

            if (PaymentType === 'Supplier') {

            } else if (PaymentType === 'Fitter') {

            } else if (PaymentType === 'Customer') {

            }


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getCommissionDetail: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const { PaymentType, PayeeName, ShopID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!PaymentType || PaymentType === undefined) return res.send({ message: "Invalid PaymentType Data" })
            if (!PayeeName || PayeeName === undefined) return res.send({ message: "Invalid PayeeName Data" })
            if (!ShopID || ShopID === undefined) return res.send({ message: "Invalid ShopID Data" })

            let qry = ``
            if (PaymentType === 'Employee') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, user.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.TotalAmount as BillAmount, customer.Name as CustomerName, customer.MobileNo1 as MobileNo from commissiondetail left join user on user.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Employee' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID} and commissiondetail.ShopID = ${ShopID} and commissiondetail.CommissionMasterID = 0`
            } else if (PaymentType === 'Doctor') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, doctor.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.TotalAmount as BillAmount, customer.Name as CustomerName, customer.MobileNo1 as MobileNo from commissiondetail left join doctor on doctor.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Doctor' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID} and commissiondetail.ShopID = ${ShopID} and commissiondetail.CommissionMasterID = 0`
            }


            response.message = "data fetch sucessfully"
            response.data = await connection.query(qry)
            // connection.release()
            return res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    saveCommissionDetail: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const { Master, Detail } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!Master || Master === undefined) return res.send({ message: "Invalid Master Data" })
            if (!Detail || Detail === undefined || Detail.length === 0) return res.send({ message: "Invalid Detail Data" })

            const { PaymentType, PayeeName, ShopID, InvoiceNo, TotalAmount, PurchaseDate, Quantity } = Master

            if (!PaymentType || PaymentType === undefined) return res.send({ message: "Invalid PaymentType Data" })
            if (!PayeeName || PayeeName === undefined) return res.send({ message: "Invalid PayeeName Data" })
            if (!ShopID || ShopID === undefined) return res.send({ message: "Invalid ShopID Data" })
            if (!InvoiceNo || InvoiceNo === undefined) return res.send({ message: "Invalid InvoiceNo Data" })
            if (!TotalAmount || TotalAmount === undefined) return res.send({ message: "Invalid TotalAmount Data" })
            if (!PurchaseDate || PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })
            if (!Quantity || Quantity === undefined) return res.send({ message: "Invalid Quantity Data" })

            const doesExistInvoiceNo = await connection.query(`select * from commissionmaster where CompanyID = ${CompanyID} and InvoiceNo = '${InvoiceNo}'`)

            if (doesExistInvoiceNo.length !== 0) {
                return res.send({ message: `InvoiceNo ${InvoiceNo} is already exist` })
            }

            for (let item of Detail) {
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data" })
            }

            const saveCommMaster = await connection.query(`insert into(UserID, CompanyID, ShopID, UserType,InvoiceNo, Quantity, TotalAmount,CreatedBy, CreatedOn, PurchaseDate, DueAmount)values(${PayeeName}, ${CompanyID},${ShopID},'${PaymentType}', '${InvoiceNo}', ${Quantity}, ${TotalAmount}, ${LoggedOnUser}, now(),${PurchaseDate}, ${TotalAmount})`)

            console.log(connected("Commission Master Added SuccessFUlly !!!"));

            for (let item of Detail) {
                const updateDetail = await connection.query(`update commissiondetail set CommissionMasterID = ${saveCommMaster.insertId}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${item.ID}`)
            }

            response.message = "data save sucessfully"
            response.data = {
                ID: saveCommMaster.insertId
            }
            // connection.release()
            return res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getCommissionByID: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const { ID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })

            let qry = `select commissiondetail.*,  COALESCE( user.Name, doctor.Name ) AS UserName from commissiondetail left join user as user on user.ID = commissiondetail.UserID and commissiondetail.UserType = 'Employee' left join doctor on doctor.ID = commissiondetail.UserID and commissiondetail.UserType = 'Doctor' where commissiondetail.CompanyID = ${CompanyID} and commissiondetail.ShopID = ${shopid} and commissiondetail.ID = ${ID}`

            response.message = "data fetch sucessfully"
            response.data = await connection.query(qry)
            // connection.release()
            return res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getCommissionDetailList: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select commissiondetail.*, COALESCE( user.Name, doctor.Name ) AS UserName from commissiondetail left join user as user on user.ID = commissiondetail.UserID and commissiondetail.UserType = 'Employee' left join doctor on doctor.ID = commissiondetail.UserID and commissiondetail.UserType = 'Doctor' where commissiondetail.CompanyID = ${CompanyID} and commissiondetail.ShopID = ${shopid} and commissiondetail.ID = ${ID} order by commissiondetail.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
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
}
