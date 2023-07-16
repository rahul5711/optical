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
            let totalDueAmount = 0
            let totalCreditAmount = 0

            if (PaymentType === 'Supplier') {

                const credit = await connection.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Vendor Credit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    totalCreditAmount = credit[0].CreditAmount
                }

                const due = await connection.query(`select SUM(purchasemasternew.DueAmount) as due from purchasemasternew where CompanyID = ${CompanyID} and SupplierID = ${PayeeName} and PStatus = 0`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }


                qry = `select supplier.Name as PayeeName, shop.Name as ShopName, shop.AreaName, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.GSTNo, purchasemasternew.DiscountAmount, purchasemasternew.GSTAmount, purchasemasternew.PaymentStatus, purchasemasternew.TotalAmount, purchasemasternew.DueAmount, ( purchasemasternew.TotalAmount - purchasemasternew.DueAmount) as PaidAmount  from purchasemasternew left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.SupplierID = ${PayeeName} and purchasemasternew.CompanyID = ${CompanyID}`


                response.data = await connection.query(qry)


            } else if (PaymentType === 'Fitter') {

                const credit = await connection.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Fitter Credit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    totalCreditAmount = credit[0].CreditAmount
                }

                const due = await connection.query(`select SUM(fittermaster.DueAmount) as due from fittermaster where CompanyID = ${CompanyID} and FitterID = ${PayeeName} and PStatus = 1`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select fitter.Name as PayeeName, shop.Name as ShopName, shop.AreaName, fittermaster.InvoiceNo, fittermaster.PurchaseDate, fittermaster.GSTNo, 0 as DiscountAmount, fittermaster.GSTAmount, fittermaster.PaymentStatus, fittermaster.TotalAmount, fittermaster.DueAmount, ( fittermaster.TotalAmount - fittermaster.DueAmount) as PaidAmount  from fittermaster left join fitter on fitter.ID = fittermaster.FitterID left join shop on shop.ID = fittermaster.ShopID where fittermaster.FitterID = ${PayeeName} and fittermaster.CompanyID = ${CompanyID} and fittermaster.PStatus = 1`


                response.data = await connection.query(qry)

            } else if (PaymentType === 'Customer') {

                const credit = await connection.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    totalCreditAmount = credit[0].CreditAmount
                }

                const due = await connection.query(`select SUM(billmaster.DueAmount) as due from billmaster where CompanyID = ${CompanyID} and CustomerID = ${PayeeName} and Status = 1`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select customer.Name as PayeeName, shop.Name as ShopName, shop.AreaName, billmaster.InvoiceNo, billmaster.BillDate, billmaster.GSTNo, billmaster.DiscountAmount as DiscountAmount, billmaster.GSTAmount, billmaster.PaymentStatus, billmaster.TotalAmount, billmaster.DueAmount, ( billmaster.TotalAmount - billmaster.DueAmount) as PaidAmount  from billmaster left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = billmaster.ShopID where billmaster.CustomerID = ${PayeeName} and billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1`


                response.data = await connection.query(qry)

            } else if (PaymentType === 'Employee') {

                const credit = await connection.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Employee Credit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    totalCreditAmount = credit[0].CreditAmount
                }

                const due = await connection.query(`select SUM(commissionmaster.DueAmount) as due from commissionmaster where CompanyID = ${CompanyID} and UserID = ${PayeeName} and Status = 1 and UserType = 'Employee'`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select user.Name as PayeeName, shop.Name as ShopName, shop.AreaName, commissionmaster.InvoiceNo, commissionmaster.PurchaseDate, commissionmaster.GSTNo, 0 as DiscountAmount, 0 as GSTAmount, commissionmaster.PaymentStatus, commissionmaster.TotalAmount, commissionmaster.DueAmount, ( commissionmaster.TotalAmount - commissionmaster.DueAmount) as PaidAmount  from commissionmaster left join user on user.ID = commissionmaster.UserID left join shop on shop.ID = commissionmaster.ShopID where commissionmaster.UserID = ${PayeeName} and commissionmaster.CompanyID = ${CompanyID} and commissionmaster.Status = 1 and commissionmaster.UserType = 'Employee'`


                response.data = await connection.query(qry)

            } else if (PaymentType === 'Doctor') {

                const credit = await connection.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Doctor Credit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    totalCreditAmount = credit[0].CreditAmount
                }

                const due = await connection.query(`select SUM(commissionmaster.DueAmount) as due from commissionmaster where CompanyID = ${CompanyID} and UserID = ${PayeeName} and Status = 1 and UserType = 'Doctor'`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select doctor.Name as PayeeName, shop.Name as ShopName, shop.AreaName, commissionmaster.InvoiceNo, commissionmaster.PurchaseDate, commissionmaster.GSTNo, 0 as DiscountAmount, 0 as GSTAmount, commissionmaster.PaymentStatus, commissionmaster.TotalAmount, commissionmaster.DueAmount, ( commissionmaster.TotalAmount - commissionmaster.DueAmount) as PaidAmount  from commissionmaster left join doctor on doctor.ID = commissionmaster.UserID left join shop on shop.ID = commissionmaster.ShopID where commissionmaster.UserID = ${PayeeName} and commissionmaster.CompanyID = ${CompanyID} and commissionmaster.Status = 1 and commissionmaster.UserType = 'Doctor'`


                response.data = await connection.query(qry)
            }

            response.totalCreditAmount = totalCreditAmount
            response.totalDueAmount = totalDueAmount
            response.message = "data fetch sucessfully"
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
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, user.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.TotalAmount as BillAmount, billmaster.Quantity AS Quantity,  customer.Name as CustomerName, customer.MobileNo1 as MobileNo from commissiondetail left join user on user.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Employee' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID} and commissiondetail.ShopID = ${ShopID} and commissiondetail.CommissionMasterID = 0`
            } else if (PaymentType === 'Doctor') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, doctor.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.Quantity AS Quantity,  billmaster.TotalAmount as BillAmount, customer.Name as CustomerName, customer.MobileNo1 as MobileNo from commissiondetail left join doctor on doctor.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Doctor' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID} and commissiondetail.ShopID = ${ShopID} and commissiondetail.CommissionMasterID = 0`
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

            const saveCommMaster = await connection.query(`insert into commissionmaster(UserID, CompanyID, ShopID, UserType,InvoiceNo, Quantity, TotalAmount,CreatedBy, CreatedOn, PurchaseDate, DueAmount)values(${PayeeName}, ${CompanyID},${ShopID},'${PaymentType}', '${InvoiceNo}', ${Quantity}, ${TotalAmount}, ${LoggedOnUser}, now(),'${PurchaseDate}', ${TotalAmount})`)

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

            let qry = `select commissionmaster.*, COALESCE( user.Name, doctor.Name ) AS UserName from commissionmaster left join user as user on user.ID = commissionmaster.UserID and commissionmaster.UserType = 'Employee' left join doctor on doctor.ID = commissionmaster.UserID and commissionmaster.UserType = 'Doctor' where commissionmaster.CompanyID = ${CompanyID} and commissionmaster.ShopID = ${shopid} and commissionmaster.ID = ${ID}`

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
            const shopid = await shopID(req.headers) || 0;
            const Body = req.body;


            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select commissionmaster.*, COALESCE( user.Name, doctor.Name ) AS UserName from commissionmaster left join user as user on user.ID = commissionmaster.UserID and commissionmaster.UserType = 'Employee' left join doctor on doctor.ID = commissionmaster.UserID and commissionmaster.UserType = 'Doctor' where commissionmaster.CompanyID = ${CompanyID} and commissionmaster.ShopID = ${shopid} order by commissionmaster.ID desc`
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
