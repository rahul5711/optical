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


            let [fetchCompany] = await mysql2.pool.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchSupplier] = await mysql2.pool.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${SupplierID}`)

            if (!fetchSupplier.length) {
                return res.send({ message: "Invalid SupplierID Data, Data not found !!!" })
            }

            response.SupplierDetails = fetchSupplier[0]

            let [fetchInvoiceForOpening] = await mysql2.pool.query(`select SUM(DueAmount) as OpeningBalance from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and SupplierID = ${SupplierID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await mysql2.pool.query(`select ID as BillMasterID from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and SupplierID = ${SupplierID} and Quantity != 0 ${dateParams}`)

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Purchase Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0;
            let AmountPaid = 0;
            let payment = [];
            var output = formatBillMasterIDs(fetchInvoice)
            if (fetchInvoice.length && output) {


                [payment] = await mysql2.pool.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Vendor' , 'Vendor Credit')  and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${SupplierID} ${datePaymentParams}`)


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
        }
    },
    getCustomerLedgeReport: async (req, res, next) => {
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


            let [fetchCompany] = await mysql2.pool.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchCustomer] = await mysql2.pool.query(`select * from customer where Status = 1 and CompanyID = ${CompanyID} and ID = ${CustomerID}`)

            if (!fetchCustomer.length) {
                return res.send({ message: "Invalid CustomerID Data, Data not found !!!" })
            }

            response.CustomerDetails = fetchCustomer[0]

            let [fetchInvoiceForOpening] = await mysql2.pool.query(`select SUM(DueAmount) as OpeningBalance from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await mysql2.pool.query(`select ID as BillMasterID from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Quantity != 0 ${dateParams}`)

            // if (!fetchInvoice.length) {
            //     return res.send({ message: "Bill Invoice not found !!!" })
            // }

            let balance = 0;
            let InvoicedAmount = 0
            let AmountPaid = 0
            let payment = []
            var output = formatBillMasterIDs(fetchInvoice)

            if (fetchInvoice.length && output) {
                [payment] = await mysql2.pool.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Customer' , 'Customer Credit') and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${CustomerID} ${datePaymentParams}`)



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
        }
    },
    getFitterLedgeReport: async (req, res, next) => {
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


            let [fetchCompany] = await mysql2.pool.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchFitter] = await mysql2.pool.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID} and ID = ${FitterID}`)

            if (!fetchFitter.length) {
                return res.send({ message: "Invalid FitterID Data, Data not found !!!" })
            }

            response.FitterDetails = fetchFitter[0]

            let [fetchInvoiceForOpening] = await mysql2.pool.query(`select SUM(DueAmount) as OpeningBalance from fittermaster where Status = 1 and CompanyID = ${CompanyID} and FitterID = ${FitterID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await mysql2.pool.query(`select ID as BillMasterID from fittermaster where Status = 1 and CompanyID = ${CompanyID} and FitterID = ${FitterID} and Quantity != 0 ${dateParams}`)

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

                [payment] = await mysql2.pool.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Fitter' ) and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${FitterID}  ${datePaymentParams}`)


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
        }
    },
    getEmployeeLedgeReport: async (req, res, next) => {
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


            let [fetchCompany] = await mysql2.pool.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchEmployee] = await mysql2.pool.query(`select * from user where Status = 1 and CompanyID = ${CompanyID} and ID = ${UserID}`)

            if (!fetchEmployee.length) {
                return res.send({ message: "Invalid UserID Data, Data not found !!!" })
            }

            response.UserDetails = fetchEmployee[0]

            let [fetchInvoiceForOpening] = await mysql2.pool.query(`select SUM(DueAmount) as OpeningBalance from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${UserID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await mysql2.pool.query(`select ID as BillMasterID from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${UserID} and Quantity != 0 ${dateParams}`)

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

                [payment] = await mysql2.pool.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Employee' ) and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${UserID}  ${datePaymentParams}`)

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
        }
    },
    getDoctorLedgeReport: async (req, res, next) => {
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


            let [fetchCompany] = await mysql2.pool.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            if (!fetchCompany.length) {
                return res.send({ message: "Invalid CompanyID Data, Data not found !!!" })
            }

            response.CompanyDetails = fetchCompany[0]

            let [fetchDoctor] = await mysql2.pool.query(`select * from doctor where Status = 1 and CompanyID = ${CompanyID} and ID = ${DoctorID}`)

            if (!fetchDoctor.length) {
                return res.send({ message: "Invalid DoctorID Data, Data not found !!!" })
            }

            response.DoctorDetails = fetchDoctor[0]

            let [fetchInvoiceForOpening] = await mysql2.pool.query(`select SUM(DueAmount) as OpeningBalance from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${DoctorID} and Quantity != 0 ${dateParamsForOpening}`)

            if (fetchInvoiceForOpening.length) {
                response.OpeningBalance = Number(fetchInvoiceForOpening[0].OpeningBalance)
            }

            let [fetchInvoice] = await mysql2.pool.query(`select ID as BillMasterID from commissionmaster where Status = 1 and CompanyID = ${CompanyID} and UserID = ${DoctorID} and Quantity != 0 ${dateParams}`)

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
                [payment] = await mysql2.pool.query(`select paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentmaster.PaymentMode, paymentdetail.Amount as PaidAmount, paymentdetail.BillID as InvoiceNo, 0 as InvoiceAmount,DATE_FORMAT(paymentmaster.PaymentDate,"%Y-%m-%d") as PaymentDate, paymentdetail.Credit from paymentmaster LEFT JOIN paymentdetail ON paymentdetail.PaymentMasterID = paymentmaster.ID where paymentdetail.BillMasterID IN ${output} and paymentdetail.PaymentType IN('Doctor' ) and paymentdetail.BillMasterID !=  0 ` + ` and paymentmaster.CompanyID = ${CompanyID} and paymentmaster.CustomerID = ${DoctorID}  ${datePaymentParams}`)



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
        }
    },
    getRecycleData: async (req, res, next) => {
        try {

            let response = {
                success: true, message: "",
                customerData: {
                    data: [],
                    deleteCount: 0
                },
                expenseData: {
                    data: [],
                    deleteCount: 0,
                    total_invoice_amount: 0
                },
                purchaseData: {
                    data: [],
                    deleteCount: 0,
                    total_invoice_amount: 0
                },
                billData: {
                    // data: [],
                    no_of_bill_delete: 0,
                    product_delete_qty: {
                        delete: 0,
                        add_new: 0,
                        diff: 0
                    },
                    product_delete_amt: {
                        delete: 0,
                        add_new: 0,
                        diff: 0
                    },
                    discount_diff_after_bill: {
                        previous_discount: 0,
                        updated_discount: 0,
                        diff: 0
                    },
                    addl_discount_diff_after_bill: {
                        previous_discount: 0,
                        updated_discount: 0,
                        diff: 0
                    }
                }
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const {
                FromDate,
                ToDate,
                UserID
            } = req.body

            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })

            let dateParamsCustomer = ``

            if (FromDate && ToDate) {
                let user = ``
                if (UserID !== 0 && UserID !== 'all') {
                    user = ` and customer.UpdatedBy = ${UserID}`
                }
                dateParamsCustomer = ` and DATE_FORMAT(customer.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user}`
            }

            let [datum] = await mysql2.pool.query(`select customer.ID, customer.Idd as Cust_ID, customer.Title AS Title, customer.Name as CustomerName, customer.MobileNo1 as MobileNo, DATE_FORMAT(customer.VisitDate,"%Y-%m-%d")  as VisitDate, DATE_FORMAT(customer.UpdatedOn,"%Y-%m-%d") as DeletedDate from customer where customer.Status = 0 and customer.CompanyID = ${CompanyID}  ${dateParamsCustomer}`)

            if (datum.length) {
                response.customerData.deleteCount = datum.length || 0;
                response.customerData.data = datum || [];
            }


            // expense

            let dateParamsExpense = ``

            if (FromDate && ToDate) {
                let user = ``
                if (UserID !== 0 && UserID !== 'all') {
                    user = ` and expense.UpdatedBy = ${UserID}`
                }
                dateParamsExpense = ` and DATE_FORMAT(expense.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user}`
            }

            let [datum2] = await mysql2.pool.query(`select expense.InvoiceNo, expense.Category as ExpenseType,expense.Name, expense.PaymentMode,  DATE_FORMAT(expense.ExpenseDate,"%Y-%m-%d") as ExpenseDate, expense.Amount, DATE_FORMAT(expense.UpdatedOn,"%Y-%m-%d") as DeletedDate from expense where expense.Status = 0 and expense.CompanyID = ${CompanyID}  ${dateParamsExpense}`)

            if (datum2.length) {
                response.expenseData.deleteCount = datum2.length || 0;
                response.expenseData.data = datum2 || [];
                response.expenseData.total_invoice_amount = datum2.reduce((Amount, transaction) => Amount + transaction.Amount, 0).toFixed(2);
            }

            // purchase

            let dateParamsPurchase = ``
            let dateParamsPurchase2 = ``

            if (FromDate && ToDate) {
                let user = ``
                let user2 = ``
                if (UserID !== 0 && UserID !== 'all') {
                    user = ` and purchasemasternew.UpdatedBy = ${UserID}`
                }
                if (UserID !== 0 && UserID !== 'all') {
                    user2 = ` and purchasedetailnew.UpdatedBy = ${UserID}`
                }
                dateParamsPurchase = ` and DATE_FORMAT(purchasemasternew.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user}`
                dateParamsPurchase2 = ` and DATE_FORMAT(purchasedetailnew.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user2}`
            }

            let [datum3] = await mysql2.pool.query(`select purchasemasternew.ID, purchasemasternew.InvoiceNo, purchasemasternew.TotalAmount as Amount, purchasemasternew.PaymentStatus, DATE_FORMAT(purchasemasternew.PurchaseDate,"%Y-%m-%d") as PurchaseDate, DATE_FORMAT(purchasemasternew.UpdatedOn,"%Y-%m-%d") as DeletedDate from purchasemasternew where purchasemasternew.Status = 0 and purchasemasternew.CompanyID = ${CompanyID}  ${dateParamsPurchase}`)

            if (datum3.length) {
                response.purchaseData.deleteCount = datum3.length || 0;
                let fetchPurchaseDetail = []
                if (datum3.length) {
                    for (let item of datum3) {
                        [fetchPurchaseDetail] = await mysql2.pool.query(`select SUM(purchasedetailnew.TotalAmount) as Amount from purchasedetailnew where purchasedetailnew.Status = 0 and purchasedetailnew.CompanyID = ${CompanyID} and purchasedetailnew.PurchaseID = ${item.ID}  ${dateParamsPurchase2}`)
                        item.Amount = fetchPurchaseDetail[0]?.Amount;
                        response.purchaseData.total_invoice_amount = (Number(response.purchaseData.total_invoice_amount) + Number(fetchPurchaseDetail[0]?.Amount)).toFixed(2) || 0;
                    }

                }
                response.purchaseData.data = datum3 || [];
            }

            // bill

            let dateParamsForBillDelete = ``

            if (FromDate && ToDate) {
                let user = ``
                if (UserID !== 0 && UserID !== 'all') {
                    user = ` and billmaster.UpdatedBy = ${UserID}`
                }
                dateParamsForBillDelete = ` and DATE_FORMAT(billmaster.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user}`
            }

            const [billDel] = await mysql2.pool.query(`select * from billmaster where Status = 0 and CompanyID = ${CompanyID}   ${dateParamsForBillDelete}`)

            const [billDiscountObject] = await mysql2.pool.query(`select DiscountAmountObject, AddlDiscountAmountObject from billmaster where Status = 1 and CompanyID = ${CompanyID}   ${dateParamsForBillDelete}`)


            if (billDel.length) {
                response.billData.no_of_bill_delete = billDel.length;
            }

            if (billDiscountObject.length) {
                for (let item of billDiscountObject) {
                    let disObj = item;

                    response.billData.discount_diff_after_bill.previous_discount += JSON.parse(disObj.DiscountAmountObject).previous_discount || 0
                    response.billData.discount_diff_after_bill.updated_discount += JSON.parse(disObj.DiscountAmountObject).updated_discount || 0

                    response.billData.discount_diff_after_bill.diff += response.billData.discount_diff_after_bill.previous_discount - response.billData.discount_diff_after_bill.updated_discount || 0
                    // addl

                    response.billData.addl_discount_diff_after_bill.previous_discount += JSON.parse(disObj.AddlDiscountAmountObject).previous_discount || 0
                    response.billData.addl_discount_diff_after_bill.updated_discount += JSON.parse(disObj.AddlDiscountAmountObject).updated_discount || 0
                    response.billData.addl_discount_diff_after_bill.diff += response.billData.addl_discount_diff_after_bill.previous_discount - response.billData.addl_discount_diff_after_bill.updated_discount || 0

                }

            }


            let dateParamsForBillDetailDelete = ``

            if (FromDate && ToDate) {
                let user = ``
                if (UserID !== 0 && UserID !== 'all') {
                    user = ` and billdetail.UpdatedBy = ${UserID}`
                }
                dateParamsForBillDetailDelete = ` and DATE_FORMAT(billdetail.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user}`
            }

            const [billDetailDel] = await mysql2.pool.query(`select SUM(billdetail.Quantity) as Quantity, SUM(billdetail.TotalAmount) as TotalAmount from billdetail where Status = 0 and CompanyID = ${CompanyID}  ${dateParamsForBillDetailDelete}`)



            if (billDetailDel.length) {
                response.billData.product_delete_qty.delete += Number(billDetailDel[0].Quantity);
                response.billData.product_delete_amt.delete += Number(billDetailDel[0].TotalAmount);
            }

            const [billDetailAfterBill] = await mysql2.pool.query(`select SUM(billdetail.Quantity) as Quantity, SUM(billdetail.TotalAmount) as TotalAmount from billdetail where Status = 1 and CompanyID = ${CompanyID} and IsAfterBill = 1  ${dateParamsForBillDetailDelete}`)

            if (billDetailAfterBill.length) {
                response.billData.product_delete_qty.add_new += Number(billDetailAfterBill[0].Quantity);
                response.billData.product_delete_amt.add_new += Number(billDetailAfterBill[0].TotalAmount);
            }



            let dateParamsForBillServiceDetailDelete = ``

            if (FromDate && ToDate) {
                let user = ``
                if (UserID !== 0 && UserID !== 'all') {
                    user = ` and billservice.UpdatedBy = ${UserID}`
                }
                dateParamsForBillServiceDetailDelete = ` and DATE_FORMAT(billservice.UpdatedOn,"%Y-%m-%d") between '${FromDate}' and '${ToDate}' ${user}`
            }

            const [billServiceDetailDel] = await mysql2.pool.query(`select SUM(billservice.TotalAmount) as TotalAmount from billservice where Status = 0 and CompanyID = ${CompanyID}  ${dateParamsForBillServiceDetailDelete}`)

            if (billServiceDetailDel.length) {
                response.billData.product_delete_amt.delete += Number(billServiceDetailDel[0].TotalAmount);
            }

            const [billServiceDetailAfterBill] = await mysql2.pool.query(`select SUM(billservice.TotalAmount) as TotalAmount from billservice where Status = 1 and CompanyID = ${CompanyID} and IsAfterBill = 1  ${dateParamsForBillServiceDetailDelete}`)

            if (billServiceDetailAfterBill.length) {
                response.billData.product_delete_amt.add_new += Number(billServiceDetailAfterBill[0].TotalAmount);
            }

            response.billData.product_delete_amt.diff = response.billData.product_delete_amt.delete - response.billData.product_delete_amt.add_new
            response.billData.product_delete_qty.diff = response.billData.product_delete_qty.delete - response.billData.product_delete_qty.add_new

            response.message = 'data fetch successfully';
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }
    },
}
