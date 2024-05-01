const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID } = require('../helpers/helper_function')
const mysql2 = require('../database')


module.exports = {
    getInvoicePayment: async (req, res, next) => {
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
            let creditCreditAmount = 0
            let creditDebitAmount = 0

            if (PaymentType === 'Supplier') {

                const [credit] = await mysql2.pool.query(`select SUM(vendorcredit.Amount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${PayeeName}`);

                const [debit] = await mysql2.pool.query(`select SUM(vendorcredit.PaidAmount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID}  and SupplierID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await mysql2.pool.query(`select SUM(purchasemasternew.DueAmount) as due from purchasemasternew where CompanyID = ${CompanyID} and SupplierID = ${PayeeName} and PStatus = 0 and Status = 1`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }


                qry = `select supplier.Name as PayeeName, shop.Name as ShopName, shop.AreaName, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.GSTNo, purchasemasternew.DiscountAmount, purchasemasternew.GSTAmount, purchasemasternew.PaymentStatus, purchasemasternew.TotalAmount, purchasemasternew.DueAmount, ( purchasemasternew.TotalAmount - purchasemasternew.DueAmount) as PaidAmount, purchasemasternew.ID  from purchasemasternew left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.SupplierID = ${PayeeName} and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.PaymentStatus = 'Unpaid' and purchasemasternew.DueAmount != 0 and purchasemasternew.Status = 1`

                const [data] = await mysql2.pool.query(qry)
                response.data = data


            } else if (PaymentType === 'Fitter') {

                const [credit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Fitter Credit' and Credit = 'Credit' and CustomerID = ${PayeeName}`);
                const [debit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Fitter Credit' and Credit = 'Debit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await mysql2.pool.query(`select SUM(fittermaster.DueAmount) as due from fittermaster where CompanyID = ${CompanyID} and FitterID = ${PayeeName} and PStatus = 1 and Status = 1`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select fitter.Name as PayeeName, shop.Name as ShopName, shop.AreaName, fittermaster.InvoiceNo, fittermaster.PurchaseDate, fittermaster.GSTNo, 0 as DiscountAmount, fittermaster.GSTAmount, fittermaster.PaymentStatus, fittermaster.TotalAmount, fittermaster.DueAmount, ( fittermaster.TotalAmount - fittermaster.DueAmount) as PaidAmount, fittermaster.ID  from fittermaster left join fitter on fitter.ID = fittermaster.FitterID left join shop on shop.ID = fittermaster.ShopID where fittermaster.FitterID = ${PayeeName} and fittermaster.CompanyID = ${CompanyID} and fittermaster.PStatus = 1 and fittermaster.PaymentStatus = 'Unpaid' and fittermaster.DueAmount != 0 and fittermaster.Status = 1`


                const [data] = await mysql2.pool.query(qry)
                response.data = data

            } else if (PaymentType === 'Customer') {

                const [credit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and Credit = 'Credit' and CustomerID = ${PayeeName}`);
                const [debit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and Credit = 'Debit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await mysql2.pool.query(`select SUM(billmaster.DueAmount) as due from billmaster where CompanyID = ${CompanyID} and CustomerID = ${PayeeName} and Status = 1`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select customer.Name as PayeeName, shop.Name as ShopName, shop.AreaName, billmaster.InvoiceNo, billmaster.BillDate as PurchaseDate, billmaster.GSTNo, billmaster.DiscountAmount as DiscountAmount, billmaster.GSTAmount, billmaster.PaymentStatus, billmaster.TotalAmount, billmaster.DueAmount, ( billmaster.TotalAmount - billmaster.DueAmount) as PaidAmount, billmaster.ID from billmaster left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = billmaster.ShopID where billmaster.CustomerID = ${PayeeName} and billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1 and billmaster.PaymentStatus = 'Unpaid' and billmaster.DueAmount != 0`

                const [data] = await mysql2.pool.query(qry)
                response.data = data

            } else if (PaymentType === 'Employee') {

                const [credit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Employee Credit' and Credit = 'Credit' and CustomerID = ${PayeeName}`);
                const [debit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Employee Credit' and Credit = 'Debit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await mysql2.pool.query(`select SUM(commissionmaster.DueAmount) as due from commissionmaster where CompanyID = ${CompanyID} and UserID = ${PayeeName} and Status = 1 and UserType = 'Employee'`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select user.Name as PayeeName, shop.Name as ShopName, shop.AreaName, commissionmaster.InvoiceNo, commissionmaster.PurchaseDate, commissionmaster.GSTNo, 0 as DiscountAmount, 0 as GSTAmount, commissionmaster.PaymentStatus, commissionmaster.TotalAmount, commissionmaster.DueAmount, ( commissionmaster.TotalAmount - commissionmaster.DueAmount) as PaidAmount, commissionmaster.ID from commissionmaster left join user on user.ID = commissionmaster.UserID left join shop on shop.ID = commissionmaster.ShopID where commissionmaster.UserID = ${PayeeName} and commissionmaster.CompanyID = ${CompanyID} and commissionmaster.Status = 1 and commissionmaster.UserType = 'Employee' and commissionmaster.PaymentStatus = 'Unpaid' and commissionmaster.DueAmount != 0`

                const [data] = await mysql2.pool.query(qry)

                response.data = data

            } else if (PaymentType === 'Doctor') {

                const [credit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Doctor Credit' and Credit = 'Credit' and CustomerID = ${PayeeName}`);
                const [debit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Doctor Credit' and Credit = 'Debit' and CustomerID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await mysql2.pool.query(`select SUM(commissionmaster.DueAmount) as due from commissionmaster where CompanyID = ${CompanyID} and UserID = ${PayeeName} and Status = 1 and UserType = 'Doctor'`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }

                qry = `select doctor.Name as PayeeName, shop.Name as ShopName, shop.AreaName, commissionmaster.InvoiceNo, commissionmaster.PurchaseDate, commissionmaster.GSTNo, 0 as DiscountAmount, 0 as GSTAmount, commissionmaster.PaymentStatus, commissionmaster.TotalAmount, commissionmaster.DueAmount, ( commissionmaster.TotalAmount - commissionmaster.DueAmount) as PaidAmount, commissionmaster.ID  from commissionmaster left join doctor on doctor.ID = commissionmaster.UserID left join shop on shop.ID = commissionmaster.ShopID where commissionmaster.UserID = ${PayeeName} and commissionmaster.CompanyID = ${CompanyID} and commissionmaster.Status = 1 and commissionmaster.UserType = 'Doctor' and commissionmaster.PaymentStatus = 'Unpaid' and commissionmaster.DueAmount != 0`

                const [data] = await mysql2.pool.query(qry)

                response.data = data
            }

            totalCreditAmount = creditCreditAmount - creditDebitAmount

            if (PaymentType === 'Customer') {
                totalCreditAmount = creditDebitAmount - creditCreditAmount
            }


            response.totalCreditAmount = totalCreditAmount
            response.totalDueAmount = totalDueAmount
            response.message = "data fetch sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getSupplierCreditNote: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const { SupplierID } = Body
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!SupplierID) return res.send({ message: "Invalid Query Data" })

            const [data] = await mysql2.pool.query(`select SupplierID, CreditNumber, (Amount - PaidAmount) as Amount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${SupplierID} and (Amount - PaidAmount) > 0`)


            response.data = data;
            response.message = 'data fetch successfully'
            return res.send(response)
        } catch (error) {
            next(error)
        }
    },
    getSupplierCreditNoteByCreditNumber: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const { SupplierID, CreditNumber } = Body
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!SupplierID) return res.send({ message: "Invalid Query Data" })
            if (!CreditNumber) return res.send({ message: "Invalid Query Data" })
            // const [data] = await mysql2.pool.query(`select SupplierID, CreditNumber, (Amount - PaidAmount) as Amount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${SupplierID} and CreditNumber = '${CreditNumber}'`)

            const [credit] = await mysql2.pool.query(`select SUM(vendorcredit.Amount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${SupplierID}`);

            const [debit] = await mysql2.pool.query(`select SUM(vendorcredit.PaidAmount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID}  and SupplierID = ${SupplierID}`);

            if (credit[0].CreditAmount !== null) {
                creditCreditAmount = credit[0].CreditAmount
            }
            if (debit[0].CreditAmount !== null) {
                creditDebitAmount = debit[0].CreditAmount
            }

            response.totalCreditAmount = creditCreditAmount - creditDebitAmount || 0
            response.message = 'data fetch successfully'
            return res.send(response)
        } catch (error) {
            next(error)
        }
    },
    applyPayment: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            console.log("current time =====> ",req.headers.currenttime, typeof req.headers.currenttime);

            const { PaymentType, CustomerID, ApplyReturn, CreditType, PaidAmount, PaymentMode, PaymentReferenceNo, CardNo, Comments, pendingPaymentList, CustomerCredit, ShopID, PayableAmount, CreditNumber } = req.body
            console.log('<============= applyPayment =============>');
            console.table({ PaymentType, CustomerID, ApplyReturn, CreditType, PaidAmount, PaymentMode, PaymentReferenceNo, CardNo, Comments, CustomerCredit, ShopID, PayableAmount, CreditNumber })

            if (!CustomerID || CustomerID === undefined) return res.send({ message: "Invalid CustomerID Data" })
            if (ApplyReturn === null || ApplyReturn === undefined) return res.send({ message: "Invalid ApplyReturn Data" })
            if (!CreditType || CreditType === undefined) return res.send({ message: "Invalid CreditType Data" })
            if (!PaidAmount || PaidAmount === undefined) return res.send({ message: "Invalid PaidAmount Data" })
            if (!PaymentMode || PaymentMode === undefined) return res.send({ message: "Invalid PaymentMode Data" })
            if (PaymentReferenceNo === null || PaymentReferenceNo === undefined) return res.send({ message: "Invalid PaymentReferenceNo Data" })
            if (CardNo === null || CardNo === undefined) return res.send({ message: "Invalid CardNo Data" })
            if (Comments === null || Comments === undefined) return res.send({ message: "Invalid Comments Data" })
            if (CustomerCredit === null || CustomerCredit === undefined) return res.send({ message: "Invalid CustomerCredit Data" })
            if (PaymentType === null || PaymentType === undefined) return res.send({ message: "Invalid PaymentType Data" })
            if (!pendingPaymentList || pendingPaymentList.length === 0) return res.send({ message: "Invalid pendingPaymentList Data" })
            if (PayableAmount === null || PayableAmount === undefined) return res.send({ message: "Invalid PaymentType Data" })

            let unpaidList = pendingPaymentList;
            let customerCredit = CustomerCredit;
            let tempAmount = PaidAmount;

            if (PaymentType === 'Customer') {

                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Customer',  '1',${LoggedOnUser}, now())`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Customer', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update billmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = now(), LastUpdate = now() where ID = ${item.ID}`);
                        }

                    }

                }

                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Customer',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Customer Credit', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update billmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

            } else if (PaymentType === 'Supplier') {
                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Supplier',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Vendor', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update purchasemasternew SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                    if (!CreditNumber || CreditNumber === undefined) return res.send({ message: "Invalid CreditNumber Data" })

                    const [data] = await mysql2.pool.query(`select SupplierID, CreditNumber, (Amount - PaidAmount) as Amount, PaidAmount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${CustomerID} and CreditNumber = '${CreditNumber}'`)

                    if (!data.length) {
                        return res.send({ message: `Invalid CreditNumber ${CreditNumber}` })
                    }

                    if (data[0].Amount < PaidAmount) {
                        return res.send({ message: `you can't apply amount more than ${data[0].Amount}` })
                    }

                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', 'CN Amount Rs ${PaidAmount} Apply Ref CN No ${CreditNumber}.', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Supplier',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Vendor Credit', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update purchasemasternew SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}' where ID = ${item.ID}`);

                            const updateAmountForCredit = data[0].PaidAmount + PaidAmount

                            const [updateVendorCredit] = await mysql2.pool.query(`update vendorcredit set PaidAmount = ${updateAmountForCredit}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where CompanyID = ${CompanyID} and SupplierID = ${CustomerID} and CreditNumber = '${CreditNumber}'`)
                        }

                    }

                }

            } else if (PaymentType === 'Fitter') {
                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Fitter',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Fitter', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update fittermaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Fitter',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Fitter Credit', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update fittermaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

            } else if (PaymentType === 'Employee') {
                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Employee',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Employee', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update commissionmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Employee',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Employee Credit', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update commissionmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

            } else if (PaymentType === 'Doctor') {
                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Doctor',  '1',${LoggedOnUser},'${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Doctor', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update commissionmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

                if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                    let [pMaster] = await mysql2.pool.query(
                        `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Doctor',  '1',${LoggedOnUser},'${req.headers.currenttime}')`
                    );

                    let pMasterID = pMaster.insertId;
                    pid = pMaster.insertId;

                    for (const item of unpaidList) {
                        if (tempAmount !== 0) {
                            if (tempAmount >= item.DueAmount) {
                                tempAmount = tempAmount - item.DueAmount;
                                item.Amount = item.DueAmount;
                                item.DueAmount = 0;
                                item.PaymentStatus = "Paid";
                            } else {
                                item.DueAmount = item.DueAmount - tempAmount;
                                item.Amount = tempAmount;
                                item.PaymentStatus = "Unpaid";
                                tempAmount = 0;
                            }
                            let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Doctor Credit', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                            let [pDetail] = await mysql2.pool.query(qry);
                            let [bMaster] = await mysql2.pool.query(`Update commissionmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                        }

                    }

                }

            } else {
                return res.send({ message: `Invalid PaymentType :- ${PaymentType}` })
            }

            response.message = "data update sucessfully"
            response.data = {
                PaymentType: PaymentType,
                PayeeName: CustomerID
            }
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    getCommissionDetail: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { PaymentType, PayeeName, ShopID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!PaymentType || PaymentType === undefined) return res.send({ message: "Invalid PaymentType Data" })
            if (!PayeeName || PayeeName === undefined) return res.send({ message: "Invalid PayeeName Data" })
            // if (!ShopID || ShopID === undefined) return res.send({ message: "Invalid ShopID Data" })

            let param = ``

            if (ShopID !== 0) {
                param = ` and commissiondetail.ShopID = ${ShopID}`
            }

            let qry = ``
            if (PaymentType === 'Employee') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, commissiondetail.BrandedCommissionAmount, commissiondetail.NonBrandedCommissionAmount, user.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.TotalAmount as BillAmount, billmaster.Quantity AS Quantity,  customer.Name as CustomerName, customer.MobileNo1 as MobileNo,shop.Name as ShopName, shop.AreaName as AreaName from commissiondetail left join shop on shop.ID = commissiondetail.ShopID left join user on user.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Employee' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID} ${param} and commissiondetail.CommissionMasterID = 0`
            } else if (PaymentType === 'Doctor') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, commissiondetail.BrandedCommissionAmount, commissiondetail.NonBrandedCommissionAmount, doctor.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.Quantity AS Quantity,  billmaster.TotalAmount as BillAmount, customer.Name as CustomerName, customer.MobileNo1 as MobileNo,shop.Name as ShopName, shop.AreaName as AreaName from commissiondetail left join shop on shop.ID = commissiondetail.ShopID left join doctor on doctor.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Doctor' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID} ${param} and commissiondetail.CommissionMasterID = 0`
            }


            response.message = "data fetch sucessfully"
            const [data] = await mysql2.pool.query(qry)
            response.data = data
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getCommissionDetailByID: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", master: null, detail: null }

            const { PaymentType, PayeeName, ShopID, ID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!PaymentType || PaymentType === undefined) return res.send({ message: "Invalid PaymentType Data" })
            if (!PayeeName || PayeeName === undefined) return res.send({ message: "Invalid PayeeName Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })



            let qry = ``
            if (PaymentType === 'Employee') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, commissiondetail.BrandedCommissionAmount, commissiondetail.NonBrandedCommissionAmount, user.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.TotalAmount as BillAmount, billmaster.Quantity AS Quantity,  customer.Name as CustomerName, customer.MobileNo1 as MobileNo,shop.Name as ShopName, shop.AreaName as AreaName from commissiondetail left join shop on shop.ID = commissiondetail.ShopID left join user on user.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Employee' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID}  and commissiondetail.CommissionMasterID = ${ID}`
            } else if (PaymentType === 'Doctor') {
                qry = `select 0 AS Sel, commissiondetail.ID, commissiondetail.CommissionAmount, doctor.Name as PayeeName, user1.Name as SalesPerson, billmaster.InvoiceNo, billmaster.BillDate, billmaster.PaymentStatus, billmaster.Quantity AS Quantity,  billmaster.TotalAmount as BillAmount, customer.Name as CustomerName, customer.MobileNo1 as MobileNo,shop.Name as ShopName, shop.AreaName as AreaName from commissiondetail left join shop on shop.ID = commissiondetail.ShopID left join doctor on doctor.ID = commissiondetail.UserID left join user as user1 on user1.ID = commissiondetail.CreatedBy left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join customer on customer.ID = billmaster.CustomerID where commissiondetail.UserType = 'Doctor' and commissiondetail.UserID = ${PayeeName} and commissiondetail.CompanyID = ${CompanyID}  and commissiondetail.CommissionMasterID = ${ID}`
                // ${param}
            }


            response.message = "data fetch sucessfully"
            const [data] = await mysql2.pool.query(qry)
            const [masterDatum] = await mysql2.pool.query(`select commissionmaster.*, COALESCE( user.Name, doctor.Name ) AS UserName,shop.Name as ShopName, shop.AreaName as AreaName, commissiondetail.BillMasterID from commissionmaster left join commissiondetail on commissiondetail.CommissionMasterID = commissionmaster.ID left join shop on shop.ID = commissionmaster.ShopID left join user as user on user.ID = commissionmaster.UserID and commissionmaster.UserType = 'Employee' left join doctor on doctor.ID = commissionmaster.UserID and commissionmaster.UserType = 'Doctor' where commissionmaster.CompanyID = ${CompanyID} and commissionmaster.ShopID = ${ShopID} and commissionmaster.ID = ${ID} order by commissionmaster.ID desc`)
            response.detail = data
            response.master = masterDatum[0]
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    saveCommissionDetail: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { Master, Detail } = req.body
            console.log(Master, 'Master');
            console.log(Detail, 'Detail');
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

            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from commissionmaster where CompanyID = ${CompanyID} and InvoiceNo = '${InvoiceNo}' and UserType = '${PaymentType}'`)

            if (doesExistInvoiceNo.length !== 0) {
                return res.send({ message: `InvoiceNo ${InvoiceNo} is already exist` })
            }

            for (let item of Detail) {
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data" })
            }

            const [saveCommMaster] = await mysql2.pool.query(`insert into commissionmaster(UserID, CompanyID, ShopID, UserType,InvoiceNo, Quantity, TotalAmount,CreatedBy, CreatedOn, PurchaseDate, DueAmount)values(${PayeeName}, ${CompanyID},${ShopID},'${PaymentType}', '${InvoiceNo}', ${Quantity}, ${TotalAmount}, ${LoggedOnUser}, now(),'${PurchaseDate}', ${TotalAmount})`)

            console.log(connected("Commission Master Added SuccessFUlly !!!"));

            for (let item of Detail) {
                const [updateDetail] = await mysql2.pool.query(`update commissiondetail set CommissionMasterID = ${saveCommMaster.insertId}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${item.ID}`)
            }


            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${PayeeName}, ${CompanyID}, ${ShopID}, '${PaymentType}','Debit',now(), 'Payment Initiated', '', '', ${TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${InvoiceNo}',${saveCommMaster.insertId},${PayeeName},${CompanyID},0,${TotalAmount},'${PaymentType}','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = {
                ID: saveCommMaster.insertId
            }
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getCommissionByID: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { ID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })

            let qry = `select commissionmaster.*, COALESCE( user.Name, doctor.Name ) AS UserName from commissionmaster left join user as user on user.ID = commissionmaster.UserID and commissionmaster.UserType = 'Employee' left join doctor on doctor.ID = commissionmaster.UserID and commissionmaster.UserType = 'Doctor' where commissionmaster.CompanyID = ${CompanyID} and commissionmaster.ID = ${ID}`

            response.message = "data fetch sucessfully"
            const [data] = await mysql2.pool.query(qry)
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getCommissionDetailList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const shopid = await shopID(req.headers) || 0;
            const Body = req.body;


            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select commissionmaster.*, COALESCE( user.Name, doctor.Name ) AS UserName, shop.Name AS ShopName, shop.AreaName AS AreaName from commissionmaster left join user as user on user.ID = commissionmaster.UserID and commissionmaster.UserType = 'Employee' left join doctor on doctor.ID = commissionmaster.UserID and commissionmaster.UserType = 'Doctor' LEFT JOIN shop ON shop.ID = commissionmaster.ShopID  where commissionmaster.CompanyID = ${CompanyID} order by commissionmaster.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            await mysql2.pool.query("COMMIT");
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    customerPayment: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CustomerID, ApplyReturn, CreditType, PaidAmount, PaymentMode, PaymentReferenceNo, CardNo, Comments, pendingPaymentList, CustomerCredit, ShopID, PaymentDate, PayableAmount } = req.body


            console.log("customerPayment================================>", req.body);

            console.log("currenttime =============>",req.headers.currenttime);

            if (!CustomerID || CustomerID === undefined) return res.send({ message: "Invalid CustomerID Data" })
            if (ApplyReturn === null || ApplyReturn === undefined) return res.send({ message: "Invalid ApplyReturn Data" })
            if (!CreditType || CreditType === undefined) return res.send({ message: "Invalid CreditType Data" })
            if (!PaidAmount || PaidAmount === undefined) return res.send({ message: "Invalid PaidAmount Data" })
            if (!PaymentMode || PaymentMode === undefined) return res.send({ message: "Invalid PaymentMode Data" })
            if (PaymentReferenceNo === null || PaymentReferenceNo === undefined) return res.send({ message: "Invalid PaymentReferenceNo Data" })
            if (CardNo === null || CardNo === undefined) return res.send({ message: "Invalid CardNo Data" })
            if (Comments === null || Comments === undefined) return res.send({ message: "Invalid Comments Data" })
            if (CustomerCredit === null || CustomerCredit === undefined) return res.send({ message: "Invalid CustomerCredit Data" })
            if (!pendingPaymentList || pendingPaymentList.length === 0) return res.send({ message: "Invalid pendingPaymentList Data" })

            let unpaidList = pendingPaymentList;
            let customerCredit = CustomerCredit;
            let tempAmount = PaidAmount;
            let paymentType = 'Customer'

            if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                let [pMaster] = await mysql2.pool.query(
                    `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Customer',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                );

                let pMasterID = pMaster.insertId;
                pid = pMaster.insertId;

                for (const item of unpaidList) {
                    if (tempAmount !== 0) {
                        if (tempAmount >= item.DueAmount) {
                            tempAmount = tempAmount - item.DueAmount;
                            item.Amount = item.DueAmount;
                            item.DueAmount = 0;
                            item.PaymentStatus = "Paid";
                        } else {
                            item.DueAmount = item.DueAmount - tempAmount;
                            item.Amount = tempAmount;
                            item.PaymentStatus = "Unpaid";
                            tempAmount = 0;
                        }
                        let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'${paymentType}', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                        let [pDetail] = await mysql2.pool.query(qry);
                        let [bMaster] = await mysql2.pool.query(`Update billmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                    }

                }

            }

            if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                paymentType = 'Customer Credit'

                let [pMaster] = await mysql2.pool.query(
                    `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Customer',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                );

                let pMasterID = pMaster.insertId;
                pid = pMaster.insertId;

                for (const item of unpaidList) {
                    if (tempAmount !== 0) {
                        if (tempAmount >= item.DueAmount) {
                            tempAmount = tempAmount - item.DueAmount;
                            item.Amount = item.DueAmount;
                            item.DueAmount = 0;
                            item.PaymentStatus = "Paid";
                        } else {
                            item.DueAmount = item.DueAmount - tempAmount;
                            item.Amount = tempAmount;
                            item.PaymentStatus = "Unpaid";
                            tempAmount = 0;
                        }
                        let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'${paymentType}', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                        let [pDetail] = await mysql2.pool.query(qry);
                        let [bMaster] = await mysql2.pool.query(`Update billmaster SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}' where ID = ${item.ID}`);
                    }

                }

            }

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    vendorPayment: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CustomerID, ApplyReturn, CreditType, PaidAmount, PaymentMode, PaymentReferenceNo, CardNo, Comments, pendingPaymentList, CustomerCredit, ShopID, PaymentDate, PayableAmount, CreditNumber } = req.body


            console.log("customerPayment================================>", req.body);

            console.log("currenttime =============>",req.headers.currenttime);

            if (!CustomerID || CustomerID === undefined) return res.send({ message: "Invalid CustomerID Data" })
            if (ApplyReturn === null || ApplyReturn === undefined) return res.send({ message: "Invalid ApplyReturn Data" })
            if (!CreditType || CreditType === undefined) return res.send({ message: "Invalid CreditType Data" })
            if (!PaidAmount || PaidAmount === undefined) return res.send({ message: "Invalid PaidAmount Data" })
            if (!PaymentMode || PaymentMode === undefined) return res.send({ message: "Invalid PaymentMode Data" })
            if (PaymentReferenceNo === null || PaymentReferenceNo === undefined) return res.send({ message: "Invalid PaymentReferenceNo Data" })
            if (CardNo === null || CardNo === undefined) return res.send({ message: "Invalid CardNo Data" })
            if (Comments === null || Comments === undefined) return res.send({ message: "Invalid Comments Data" })
            if (CustomerCredit === null || CustomerCredit === undefined) return res.send({ message: "Invalid CustomerCredit Data" })
            if (!pendingPaymentList || pendingPaymentList.length === 0) return res.send({ message: "Invalid pendingPaymentList Data" })

            let unpaidList = pendingPaymentList;
            let customerCredit = CustomerCredit;
            let tempAmount = PaidAmount;
            let paymentType = 'Supplier'

            if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == false) {
                let [pMaster] = await mysql2.pool.query(
                    `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', '${PaymentReferenceNo}', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Supplier',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                );

                let pMasterID = pMaster.insertId;
                pid = pMaster.insertId;

                for (const item of unpaidList) {
                    if (tempAmount !== 0) {
                        if (tempAmount >= item.DueAmount) {
                            tempAmount = tempAmount - item.DueAmount;
                            item.Amount = item.DueAmount;
                            item.DueAmount = 0;
                            item.PaymentStatus = "Paid";
                        } else {
                            item.DueAmount = item.DueAmount - tempAmount;
                            item.Amount = tempAmount;
                            item.PaymentStatus = "Unpaid";
                            tempAmount = 0;
                        }
                        let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Vendor', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                        let [pDetail] = await mysql2.pool.query(qry);
                        let [bMaster] = await mysql2.pool.query(`Update purchasemasternew SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}' where ID = ${item.ID}`);
                    }

                }

            }

            if (PaidAmount !== 0 && unpaidList.length !== 0 && ApplyReturn == true) {
                if (!CreditNumber || CreditNumber === undefined) return res.send({ message: "Invalid CreditNumber Data" })

                const [data] = await mysql2.pool.query(`select SupplierID, CreditNumber, (Amount - PaidAmount) as Amount, PaidAmount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${CustomerID} and CreditNumber = '${CreditNumber}'`)

                if (!data.length) {
                    return res.send({ message: `Invalid CreditNumber ${CreditNumber}` })
                }

                if (data[0].Amount < PaidAmount) {
                    return res.send({ message: `you can't apply amount more than ${data[0].Amount}` })
                }

                let [pMaster] = await mysql2.pool.query(
                    `insert into paymentmaster (CustomerID,CompanyID,ShopID,CreditType, PaymentDate, PaymentMode,CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, PaymentType, Status,CreatedBy,CreatedOn ) values (${CustomerID}, ${CompanyID}, ${ShopID}, '${CreditType}','${req.headers.currenttime}', '${PaymentMode}', '${CardNo}', 'CN Amount Rs ${PaidAmount} Apply Ref CN No ${CreditNumber}.', ${PayableAmount}, ${PaidAmount}, '${Comments}', 'Supplier',  '1',${LoggedOnUser}, '${req.headers.currenttime}')`
                );

                let pMasterID = pMaster.insertId;
                pid = pMaster.insertId;

                for (const item of unpaidList) {
                    if (tempAmount !== 0) {
                        if (tempAmount >= item.DueAmount) {
                            tempAmount = tempAmount - item.DueAmount;
                            item.Amount = item.DueAmount;
                            item.DueAmount = 0;
                            item.PaymentStatus = "Paid";
                        } else {
                            item.DueAmount = item.DueAmount - tempAmount;
                            item.Amount = tempAmount;
                            item.PaymentStatus = "Unpaid";
                            tempAmount = 0;
                        }
                        let qry = `insert into paymentdetail (PaymentMasterID,CompanyID, CustomerID, BillMasterID, BillID,Amount, DueAmount, PaymentType, Credit, Status,CreatedBy,CreatedOn ) values (${pMasterID}, ${CompanyID}, ${CustomerID}, ${item.ID}, '${item.InvoiceNo}',${item.Amount},${item.DueAmount},'Vendor Credit', '${CreditType}', 1, ${LoggedOnUser}, '${req.headers.currenttime}')`;
                        let [pDetail] = await mysql2.pool.query(qry);
                        let [bMaster] = await mysql2.pool.query(`Update purchasemasternew SET  PaymentStatus = '${item.PaymentStatus}', DueAmount = ${item.DueAmount},UpdatedBy = ${LoggedOnUser},UpdatedOn = '${req.headers.currenttime}' where ID = ${item.ID}`);

                        const updateAmountForCredit = data[0].PaidAmount + PaidAmount

                        const [updateVendorCredit] = await mysql2.pool.query(`update vendorcredit set PaidAmount = ${updateAmountForCredit}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where CompanyID = ${CompanyID} and SupplierID = ${CustomerID} and CreditNumber = '${CreditNumber}'`)
                    }

                }

            }

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    customerPaymentDebit: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CreditType, CustomerID, ID, PaidAmount, PayableAmount, PaymentMode, PaymentReferenceNo } = req.body

            if (!CustomerID || CustomerID === undefined) return res.send({ message: "Invalid CustomerID Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (!CreditType || CreditType === undefined) return res.send({ message: "Invalid CreditType Data" })
            if (!PayableAmount || PayableAmount === undefined) return res.send({ message: "Invalid PayableAmount Data" })
            if (!PaymentMode || PaymentMode === undefined) return res.send({ message: "Invalid PaymentMode Data" })
            if (!PaidAmount || PaidAmount === undefined) return res.send({ message: "Invalid PaidAmount Data" })

            const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where ID = ${ID}`)


            if (fetchBillMaster[0].PayableAmount <= 0) {
                return res.send({ message: `You can't debit, this amount alread added customer credit amount` })
            }


            const DueAmount = fetchBillMaster[0].DueAmount + PaidAmount

            const [update] = await mysql2.pool.query(`update billmaster set DueAmount = ${DueAmount}, PaymentStatus = 'Unpaid', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${ID}`)


            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Debit',now(), '${PaymentMode}', '', '${PaymentReferenceNo ? PaymentReferenceNo : ''}', ${DueAmount}, ${PayableAmount - PaidAmount}, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${fetchBillMaster[0].InvoiceNo}',${fetchBillMaster[0].ID},${CustomerID},${CompanyID},${PaidAmount},${DueAmount},'Customer','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Update SuccessFUlly !!!"));


            response.message = "data update sucessfully"
            response.data = {
                ID: ID,
                InvoiceNo: fetchBillMaster[0].InvoiceNo
            }
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    updateCustomerPaymentMode: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { PaymentMasterID, PaymentMode } = req.body

            if (!PaymentMasterID || PaymentMasterID === undefined) return res.send({ message: "Invalid PaymentMasterID Data" })
            if (!PaymentMode || PaymentMode === undefined) return res.send({ message: "Invalid PaymentMode Data" })
            if (PaymentMode === 'Payment Initiated' || PaymentMode === 'Customer Credit') {
                return res.send({ message: `We can't add this PaymentMode, Payment Initiated || Customer Credit` })
            }

            const [paymentMaster] = await mysql2.pool.query(`select * from paymentmaster where CompanyID = ${CompanyID} and ID = ${PaymentMasterID}`)

            if (paymentMaster.length === 0) {
                return res.send({ message: "Invalid PaymentMasterID Data" })
            }

            if (paymentMaster[0].PaymentMode === 'Payment Initiated' || paymentMaster[0].PaymentMode === 'Customer Credit') {
                return res.send({ message: `We can't update Payment Mode, Payment Initiated || Customer Credit` })
            }

            const [updatePaymentMode] = await mysql2.pool.query(`update paymentmaster set PaymentMode = '${PaymentMode}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where ID = ${PaymentMasterID} and CompanyID = ${CompanyID} `)


            response.message = "data update sucessfully"
            response.data = {
                PaymentMasterID: PaymentMasterID
            }
            return res.send(response)

        } catch (err) {
            next(err)
        }

    },
    updateCustomerPaymentDate: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { PaymentMasterID, PaymentDate } = req.body

            if (!PaymentMasterID || PaymentMasterID === undefined) return res.send({ message: "Invalid PaymentMasterID Data" })
            if (!PaymentDate || PaymentDate === undefined) return res.send({ message: "Invalid PaymentDate Data" })

            const [paymentMaster] = await mysql2.pool.query(`select * from paymentmaster where CompanyID = ${CompanyID} and ID = ${PaymentMasterID}`)

            if (paymentMaster.length === 0) {
                return res.send({ message: "Invalid PaymentMasterID Data" })
            }

            const [updatePaymentDate] = await mysql2.pool.query(`update paymentmaster set PaymentDate = '${PaymentDate}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where ID = ${PaymentMasterID} and CompanyID = ${CompanyID} `)


            response.message = "data update sucessfully"
            response.data = {
                PaymentMasterID: PaymentMasterID
            }
            return res.send(response)

        } catch (err) {
            next(err)
        }

    },

    getCustomerCreditAmount: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;

            const { CustomerID, ID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!CustomerID) return res.send({ message: "Invalid Query Data" })
            if (!ID) return res.send({ message: "Invalid Query Data" })

            let totalCreditAmount = 0
            let creditCreditAmount = 0
            let creditDebitAmount = 0

            const [credit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and Credit = 'Credit' and CustomerID = ${CustomerID} and paymentdetail.BillMasterID = ${ID}`);
            const [debit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and Credit = 'Debit' and CustomerID = ${CustomerID} and paymentdetail.BillMasterID = ${ID}`);

            if (credit[0].CreditAmount !== null) {
                creditCreditAmount = credit[0].CreditAmount
            }
            if (debit[0].CreditAmount !== null) {
                creditDebitAmount = debit[0].CreditAmount
            }


            totalCreditAmount = creditDebitAmount - creditCreditAmount


            response.totalCreditAmount = totalCreditAmount
            response.message = "data fetch sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    customerCreditDebit: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, CustomerID, PaidAmount, PayableAmount, PaymentMode } = req.body

            if (!CustomerID || CustomerID === undefined) return res.send({ message: "Invalid CustomerID Data" })
            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (!PayableAmount || PayableAmount === undefined) return res.send({ message: "Invalid PayableAmount Data" })
            if (!PaymentMode || PaymentMode === undefined) return res.send({ message: "Invalid PaymentMode Data" })
            if (!PaidAmount || PaidAmount === undefined) return res.send({ message: "Invalid PaidAmount Data" })


            const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where ID = ${ID}`)

            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Credit','${req.headers.currenttime}', '${PaymentMode}', '', '', ${PayableAmount}, ${PaidAmount}, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${fetchBillMaster[0].InvoiceNo}',${ID},${CustomerID},${CompanyID},${PaidAmount},${PayableAmount - PaidAmount},'Customer Credit','Credit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            console.log(connected("Payment Update SuccessFUlly !!!"));


            response.message = "data update sucessfully"
            response.data = {
                CustomerID: CustomerID,
                ID: ID
            }
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
}
