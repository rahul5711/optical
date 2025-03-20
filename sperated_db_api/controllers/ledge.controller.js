const createError = require('http-errors')
const mysql = require('../newdb')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const _ = require("lodash")
let ejs = require("ejs");
let path = require("path");
let pdf = require("html-pdf");
var TinyURL = require('tinyurl');
var moment = require("moment");
const clientConfig = require("../helpers/constants");
const mysql2 = require('../database');
const dbConfig = require('../helpers/db_config');

const { log } = require('winston');
const { json } = require('express');


function formatBillMasterIDs(fetchInvoice) {
    // Extract BillMasterID values
    var billMasterIDs = fetchInvoice.map(function (item) {
        return item.BillMasterID;
    });

    // Format output
    var output = '(' + billMasterIDs.join(', ') + ')';

    return output;
}

module.exports = {
    getSupplierLedgeReport: async (req, res, next) => {
        let connection;
        try {
            let response = {
                success: true, message: "",
                OpeningBalance: 0,
                InvoicedAmount: 0,
                AmountPaid: 0,
                BalanceDue: 0,
                data: [],
                CompanyDetails: null,
                SupplierDetails: null,
                FromDate: null,
                ToDate: null,
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                FromDate,
                ToDate,
                SupplierID
            } = req.body

            if (SupplierID === null || SupplierID === undefined || SupplierID == 0 || SupplierID === "") return res.send({ message: "Invalid SupplierID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })

            let dateParams = ``
            let datePaymentParams = ``
            let dateParamsForOpening = ``
            var fromDate = moment(FromDate).subtract(1, 'days').format('YYYY-MM-DD');

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(purchasemasternew.PurchaseDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                datePaymentParams = ` and DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                dateParamsForOpening = ` and DATE_FORMAT(purchasemasternew.PurchaseDate,"%Y-%m-%d") between '2023-01-01' and '${fromDate}'`
            }


            let [fetchCompany] = await connection.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchSupplier] = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${SupplierID}`)

            if (!fetchSupplier.length) {
                return res.send({ message: "Invalid SupplierID Data, Data not found !!!" })
            }

            response.SupplierDetails = fetchSupplier[0]

            let [fetchInvoiceForOpening] = await connection.query(`select SUM(DueAmount) as OpeningBalance from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and SupplierID = ${SupplierID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await connection.query(`select ID as BillMasterID from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and SupplierID = ${SupplierID} and Quantity != 0 ${dateParams}`)

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Purchase Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0;
            let AmountPaid = 0;
            let payment = [];
            var output = formatBillMasterIDs(fetchInvoice)
            if (fetchInvoice.length && output) {


                [payment] = await connection.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Vendor' , 'Vendor Credit')  and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${SupplierID} ${datePaymentParams}`)


                if (payment) {
                    for (let item of payment) {
                        if (item.PaymentMode === "Payment Initiated") {
                            item.Transactions = 'Invoice'
                            item.Description = `${item.InvoiceNo}`
                            item.remark = ``
                            item.InvoiceAmount = Number(item.PayableAmount)
                            balance = Number(balance) + Number(item.InvoiceAmount);
                            InvoicedAmount = Number(InvoicedAmount) + Number(item.InvoiceAmount);
                            item.balance = balance;
                        } else if (item.PaymentMode !== "Payment Initiated") {
                            if (item.PaymentType === 'Supplier' && item.PayableAmount == 0) {
                                e.PaymentMode = 'Vendor Credit'
                            }
                            item.PayableAmount = 0
                            item.Transactions = 'Payment Recieved'
                            item.Description = `${item.PaidAmount} ${item.PaymentMode} For Payment Of - ${item.InvoiceNo}`
                            item.remark = `${item.PaymentReferenceNo}`
                            balance = Number(balance) - Number(item.PaidAmount);
                            item.balance = balance;
                            AmountPaid = Number(AmountPaid) + Number(item.PaidAmount);
                        }

                        delete item.PayableAmount
                        delete item.PaymentReferenceNo
                    }
                }

            }

            response.data = payment
            response.FromDate = req.body.FromDate
            response.ToDate = req.body.ToDate
            response.InvoicedAmount = InvoicedAmount;
            response.AmountPaid = AmountPaid;
            response.BalanceDue = Number(response.OpeningBalance) + Number(InvoicedAmount) - Number(AmountPaid);
            response.message = "data fetch successfully"
            // return res.send(response)

            // Generate PDF
            const printdata = response;
            const Details = printdata.SupplierDetails;
            const paymentList = printdata.data;
            const From = moment(printdata.FromDate).format('DD-MM-YYYY')
            const To = moment(printdata.ToDate).format('DD-MM-YYYY')

            printdata.From = From
            printdata.To = To
            printdata.Details = Details;
            printdata.paymentList = paymentList;

            var formatName = "ladger.ejs";
            var file = "supplier" + "_" + "ladger" + ".pdf";
            var fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "0mm"
                        },
                        "footer": {
                            "height": "0mm",
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getCustomerLedgeReport: async (req, res, next) => {
        let connection;
        try {
            let response = {
                success: true, message: "",
                OpeningBalance: 0,
                InvoicedAmount: 0,
                AmountPaid: 0,
                BalanceDue: 0,
                data: [],
                CompanyDetails: null,
                CustomerDetails: null,
                FromDate: null,
                ToDate: null,
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                FromDate,
                ToDate,
                CustomerID
            } = req.body

            if (CustomerID === null || CustomerID === undefined || CustomerID == 0 || CustomerID === "") return res.send({ message: "Invalid CustomerID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })


            let dateParams = ``
            let datePaymentParams = ``
            let dateParamsForOpening = ``
            var fromDate = moment(FromDate).subtract(1, 'days').format('YYYY-MM-DD');

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(billmaster.BillDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                datePaymentParams = ` and DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                dateParamsForOpening = ` and DATE_FORMAT(billmaster.BillDate,"%Y-%m-%d") between '2023-01-01' and '${fromDate}'`
            }


            let [fetchCompany] = await connection.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchCustomer] = await connection.query(`select * from customer where Status = 1 and CompanyID = ${CompanyID} and ID = ${CustomerID}`)

            if (!fetchCustomer.length) {
                return res.send({ message: "Invalid CustomerID Data, Data not found !!!" })
            }

            response.CustomerDetails = fetchCustomer[0]

            let [fetchInvoiceForOpening] = await connection.query(`select SUM(DueAmount) as OpeningBalance from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await connection.query(`select ID as BillMasterID from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Quantity != 0 ${dateParams}`)

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Bill Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0
            let AmountPaid = 0
            let payment = []
            var output = formatBillMasterIDs(fetchInvoice)

            if (fetchInvoice.length && output) {
                [payment] = await connection.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Customer' , 'Customer Credit') and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${CustomerID} ${datePaymentParams}`)



                if (payment) {
                    for (let item of payment) {
                        if (item.PaymentMode === "Payment Initiated") {
                            item.Transactions = 'Invoice'
                            item.Description = `${item.InvoiceNo}`
                            item.remark = ``
                            item.InvoiceAmount = Number(item.PayableAmount)
                            balance = Number(balance) + Number(item.InvoiceAmount);
                            InvoicedAmount = Number(InvoicedAmount) + Number(item.InvoiceAmount);
                            item.balance = balance;
                        } else if (item.PaymentMode !== "Payment Initiated") {
                            if (item.PaymentType === 'Customer' && item.PayableAmount == 0) {
                                e.PaymentMode = 'Customer Credit'
                            }
                            if (item.Credit === 'Debit') {
                                item.PaidAmount = - item.PaidAmount
                            }
                            item.PayableAmount = 0
                            item.Transactions = 'Payment Recieved'
                            item.Description = `${item.PaidAmount} ${item.PaymentMode} For Payment Of - ${item.InvoiceNo}`
                            item.remark = `${item.PaymentReferenceNo}`
                            balance = Number(balance) - Number(item.PaidAmount);
                            item.balance = balance;
                            AmountPaid = Number(AmountPaid) + Number(item.PaidAmount);
                        }

                        delete item.PayableAmount
                        delete item.PaymentReferenceNo

                    }
                }
            }

            response.FromDate = req.body.FromDate
            response.ToDate = req.body.ToDate
            response.data = payment
            response.InvoicedAmount = InvoicedAmount;
            response.AmountPaid = AmountPaid;
            response.BalanceDue = Number(response.OpeningBalance) + Number(InvoicedAmount) - Number(AmountPaid);
            response.message = "data fetch successfully"

            // return res.send(response)

            // Generate PDF
            const printdata = response;
            const Details = printdata.CustomerDetails;
            const paymentList = printdata.data;
            const From = moment(printdata.FromDate).format('DD-MM-YYYY')
            const To = moment(printdata.ToDate).format('DD-MM-YYYY')

            printdata.From = From
            printdata.To = To
            printdata.Details = Details;
            printdata.paymentList = paymentList;

            var formatName = "ladger.ejs";
            var file = "customer" + "_" + "ladger" + ".pdf";
            var fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "0mm"
                        },
                        "footer": {
                            "height": "0mm",
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getFitterLedgeReport: async (req, res, next) => {
        let connection;
        try {
            let response = {
                success: true, message: "",
                OpeningBalance: 0,
                InvoicedAmount: 0,
                AmountPaid: 0,
                BalanceDue: 0,
                data: [],
                CompanyDetails: null,
                FitterDetails: null,
                FromDate: null,
                ToDate: null,
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                FromDate,
                ToDate,
                FitterID
            } = req.body

            if (FitterID === null || FitterID === undefined || FitterID == 0 || FitterID === "") return res.send({ message: "Invalid FitterID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })


            let dateParams = ``
            let datePaymentParams = ``
            let dateParamsForOpening = ``
            var fromDate = moment(FromDate).subtract(1, 'days').format('YYYY-MM-DD');

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(fittermaster.PurchaseDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                datePaymentParams = ` and DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                dateParamsForOpening = ` and DATE_FORMAT(fittermaster.PurchaseDate,"%Y-%m-%d") between '2023-01-01' and '${fromDate}'`
            }


            let [fetchCompany] = await connection.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchFitter] = await connection.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID} and ID = ${FitterID}`)

            if (!fetchFitter.length) {
                return res.send({ message: "Invalid FitterID Data, Data not found !!!" })
            }

            response.FitterDetails = fetchFitter[0]

            let [fetchInvoiceForOpening] = await connection.query(`select SUM(DueAmount) as OpeningBalance from fittermaster where Status = 1 and CompanyID = ${CompanyID} and FitterID = ${FitterID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await connection.query(`select ID as BillMasterID from fittermaster where Status = 1 and CompanyID = ${CompanyID} and FitterID = ${FitterID} and Quantity != 0 ${dateParams}`)

            console.log(`select ID as BillMasterID from fittermaster where Status = 1 and CompanyID = ${CompanyID} and FitterID = ${FitterID} and Quantity != 0 ${dateParams}`);

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Bill Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0
            let AmountPaid = 0
            let payment = 0
            var output = formatBillMasterIDs(fetchInvoice)

            if (fetchInvoice.length && output) {

                [payment] = await connection.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Fitter' ) and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${FitterID}  ${datePaymentParams}`)


                if (payment) {
                    for (let item of payment) {
                        if (item.PaymentMode === "Payment Initiated") {
                            item.Transactions = 'Invoice'
                            item.Description = `${item.InvoiceNo}`
                            item.remark = ``
                            item.InvoiceAmount = Number(item.PayableAmount)
                            balance = Number(balance) + Number(item.InvoiceAmount);
                            InvoicedAmount = Number(InvoicedAmount) + Number(item.InvoiceAmount);
                            item.balance = balance;
                        } else if (item.PaymentMode !== "Payment Initiated") {
                            if (item.Credit === 'Debit') {
                                item.PaidAmount = + item.PaidAmount
                            }
                            item.PayableAmount = 0
                            item.Transactions = 'Payment Recieved'
                            item.Description = `${item.PaidAmount} ${item.PaymentMode} For Payment Of - ${item.InvoiceNo}`
                            item.remark = `${item.PaymentReferenceNo}`
                            balance = Number(balance) - Number(item.PaidAmount);
                            item.balance = balance;
                            AmountPaid = Number(AmountPaid) + Number(item.PaidAmount);
                        }

                        delete item.PayableAmount
                        delete item.PaymentReferenceNo

                    }
                }

            }

            response.FromDate = req.body.FromDate
            response.ToDate = req.body.ToDate
            response.data = payment
            response.InvoicedAmount = Number(Number(InvoicedAmount).toFixed(2));
            response.AmountPaid = Number(Number(AmountPaid).toFixed(2));
            response.BalanceDue = Number(Number(Number(response.OpeningBalance) + Number(InvoicedAmount) - Number(AmountPaid)).toFixed(2));
            response.message = "data fetch successfully"

            // return res.send(response)

            // Generate PDF
            const printdata = response;
            const Details = printdata.FitterDetails;
            const paymentList = printdata.data;
            const From = moment(printdata.FromDate).format('DD-MM-YYYY')
            const To = moment(printdata.ToDate).format('DD-MM-YYYY')

            printdata.From = From
            printdata.To = To
            printdata.Details = Details;
            printdata.paymentList = paymentList;

            var formatName = "ladger.ejs";
            var file = "fitter" + "_" + "ladger" + ".pdf";
            var fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "0mm"
                        },
                        "footer": {
                            "height": "0mm",
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getEmployeeLedgeReport: async (req, res, next) => {
        let connection;
        try {
            let response = {
                success: true, message: "",
                OpeningBalance: 0,
                InvoicedAmount: 0,
                AmountPaid: 0,
                BalanceDue: 0,
                data: [],
                CompanyDetails: null,
                UserDetails: null,
                FromDate: null,
                ToDate: null,
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                FromDate,
                ToDate,
                UserID
            } = req.body

            if (UserID === null || UserID === undefined || UserID == 0 || UserID === "") return res.send({ message: "Invalid UserID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })


            let dateParams = ``
            let datePaymentParams = ``
            let dateParamsForOpening = ``
            var fromDate = moment(FromDate).subtract(1, 'days').format('YYYY-MM-DD');

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(commissionmaster.PurchaseDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                datePaymentParams = ` and DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                dateParamsForOpening = ` and DATE_FORMAT(commissionmaster.PurchaseDate,"%Y-%m-%d") between '2023-01-01' and '${fromDate}'`
            }


            let [fetchCompany] = await connection.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchEmployee] = await connection.query(`select * from user where Status = 1 and CompanyID = ${CompanyID} and ID = ${UserID}`)

            if (!fetchEmployee.length) {
                return res.send({ message: "Invalid UserID Data, Data not found !!!" })
            }

            response.UserDetails = fetchEmployee[0]

            let [fetchInvoiceForOpening] = await connection.query(`select SUM(DueAmount) as OpeningBalance from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${UserID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await connection.query(`select ID as BillMasterID from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${UserID} and Quantity != 0 ${dateParams}`)

            console.log(`select ID as BillMasterID from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${UserID} and Quantity != 0 ${dateParams}`);

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Bill Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0
            let AmountPaid = 0
            let payment = []
            var output = formatBillMasterIDs(fetchInvoice)
            if (fetchInvoice.length && output) {

                [payment] = await connection.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Employee' ) and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${UserID}  ${datePaymentParams}`)

                if (payment) {
                    for (let item of payment) {
                        if (item.PaymentMode === "Payment Initiated") {
                            item.Transactions = 'Invoice'
                            item.Description = `${item.InvoiceNo}`
                            item.remark = ``
                            item.InvoiceAmount = Number(item.PayableAmount)
                            balance = Number(balance) + Number(item.InvoiceAmount);
                            InvoicedAmount = Number(InvoicedAmount) + Number(item.InvoiceAmount);
                            item.balance = balance;
                        } else if (item.PaymentMode !== "Payment Initiated") {
                            if (item.Credit === 'Debit') {
                                item.PaidAmount = + item.PaidAmount
                            }
                            item.PayableAmount = 0
                            item.Transactions = 'Payment Recieved'
                            item.Description = `${item.PaidAmount} ${item.PaymentMode} For Payment Of - ${item.InvoiceNo}`
                            item.remark = `${item.PaymentReferenceNo}`
                            balance = Number(balance) - Number(item.PaidAmount);
                            item.balance = balance;
                            AmountPaid = Number(AmountPaid) + Number(item.PaidAmount);
                        }

                        delete item.PayableAmount
                        delete item.PaymentReferenceNo

                    }
                }
            }

            response.FromDate = req.body.FromDate
            response.ToDate = req.body.ToDate
            response.data = payment
            response.InvoicedAmount = Number(Number(InvoicedAmount).toFixed(2));
            response.AmountPaid = Number(Number(AmountPaid).toFixed(2));
            response.BalanceDue = Number((Number(response.OpeningBalance) + Number(InvoicedAmount) - Number(AmountPaid)).toFixed(2));
            response.message = "data fetch successfully"

            // return res.send(response)

            // Generate PDF
            const printdata = response;
            const Details = printdata.UserDetails;
            const paymentList = printdata.data;
            const From = moment(printdata.FromDate).format('DD-MM-YYYY')
            const To = moment(printdata.ToDate).format('DD-MM-YYYY')

            printdata.From = From
            printdata.To = To
            printdata.Details = Details;
            printdata.paymentList = paymentList;

            var formatName = "ladger.ejs";
            var file = "employee" + "_" + "ladger" + ".pdf";
            var fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "0mm"
                        },
                        "footer": {
                            "height": "0mm",
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getDoctorLedgeReport: async (req, res, next) => {
        let connection;
        try {
            let response = {
                success: true, message: "",
                OpeningBalance: 0,
                InvoicedAmount: 0,
                AmountPaid: 0,
                BalanceDue: 0,
                data: [],
                CompanyDetails: null,
                DoctorDetails: null,
                FromDate: null,
                ToDate: null,
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                FromDate,
                ToDate,
                DoctorID
            } = req.body

            if (DoctorID === null || DoctorID === undefined || DoctorID == 0 || DoctorID === "") return res.send({ message: "Invalid DoctorID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })


            let dateParams = ``
            let datePaymentParams = ``
            let dateParamsForOpening = ``
            var fromDate = moment(FromDate).subtract(1, 'days').format('YYYY-MM-DD');

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(commissionmaster.PurchaseDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                datePaymentParams = ` and DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
                dateParamsForOpening = ` and DATE_FORMAT(commissionmaster.PurchaseDate,"%Y-%m-%d") between '2023-01-01' and '${fromDate}'`
            }


            let [fetchCompany] = await connection.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchDoctor] = await connection.query(`select * from doctor where Status = 1 and CompanyID = ${CompanyID} and ID = ${DoctorID}`)

            if (!fetchDoctor.length) {
                return res.send({ message: "Invalid DoctorID Data, Data not found !!!" })
            }

            response.DoctorDetails = fetchDoctor[0]

            let [fetchInvoiceForOpening] = await connection.query(`select SUM(DueAmount) as OpeningBalance from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${DoctorID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await connection.query(`select ID as BillMasterID from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${DoctorID} and Quantity != 0 ${dateParams}`)

            console.log(`select ID as BillMasterID from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${DoctorID} and Quantity != 0 ${dateParams}`);

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Bill Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0
            let AmountPaid = 0
            let payment = []
            var output = formatBillMasterIDs(fetchInvoice)
            if (fetchInvoice.length && output) {
                [payment] = await connection.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Doctor' ) and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${DoctorID}  ${datePaymentParams}`)



                if (payment) {
                    for (let item of payment) {
                        if (item.PaymentMode === "Payment Initiated") {
                            item.Transactions = 'Invoice'
                            item.Description = `${item.InvoiceNo}`
                            item.remark = ``
                            item.InvoiceAmount = Number(item.PayableAmount)
                            balance = Number(balance) + Number(item.InvoiceAmount);
                            InvoicedAmount = Number(InvoicedAmount) + Number(item.InvoiceAmount);
                            item.balance = balance;
                        } else if (item.PaymentMode !== "Payment Initiated") {
                            if (item.Credit === 'Debit') {
                                item.PaidAmount = + item.PaidAmount
                            }
                            item.PayableAmount = 0
                            item.Transactions = 'Payment Recieved'
                            item.Description = `${item.PaidAmount} ${item.PaymentMode} For Payment Of - ${item.InvoiceNo}`
                            item.remark = `${item.PaymentReferenceNo}`
                            balance = Number(balance) - Number(item.PaidAmount);
                            item.balance = balance;
                            AmountPaid = Number(AmountPaid) + Number(item.PaidAmount);
                        }

                        delete item.PayableAmount
                        delete item.PaymentReferenceNo

                    }
                }

            }


            response.FromDate = req.body.FromDate
            response.ToDate = req.body.ToDate
            response.data = payment
            response.InvoicedAmount = Number(Number(InvoicedAmount).toFixed(2));
            response.AmountPaid = Number(Number(AmountPaid).toFixed(2));
            response.BalanceDue = Number((Number(response.OpeningBalance) + Number(InvoicedAmount) - Number(AmountPaid)).toFixed(2));
            response.message = "data fetch successfully"

            // return res.send(response)

            // Generate PDF
            const printdata = response;
            const Details = printdata.DoctorDetails;
            const paymentList = printdata.data;
            const From = moment(printdata.FromDate).format('DD-MM-YYYY')
            const To = moment(printdata.ToDate).format('DD-MM-YYYY')

            printdata.From = From
            printdata.To = To
            printdata.Details = Details;
            printdata.paymentList = paymentList;

            var formatName = "ladger.ejs";
            var file = "doctor" + "_" + "ladger" + ".pdf";
            var fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "0mm"
                        },
                        "footer": {
                            "height": "0mm",
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    }
}
