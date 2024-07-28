const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID } = require('../helpers/helper_function')
const mysql2 = require('../database')


module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)

            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const datum = {
                Name: Body.Name ? Body.Name : '',
                ShopID: Body.ShopID ? Body.ShopID : 0,
                EmployeeID: Body.EmployeeID ? Body.EmployeeID : 0,
                InvoiceNo: Body.InvoiceNo ? Body.InvoiceNo : '',
                Amount: Body.Amount ? Body.Amount : 0,
                CashType: Body.CashType ? Body.CashType : '',
                CreditType: Body.CreditType ? Body.CreditType : '',
                Comments: Body.Comments ? Body.Comments : '',
                Status: Body.Status ? Body.Status : 1,
            }

            datum.ShopID = shopid;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.EmployeeID === null || Body.EmployeeID === undefined || !Body.EmployeeID) return res.send({ message: "Invalid Query Data" })
            if (datum.ShopID == 0) return res.send({ message: "Invalid Shop" })

            if (datum.CashType === 'PettyCash' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `you can not withdrawal greater than ${Balance}` })
                }
            }

            if (datum.CashType === 'CashCounter' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `you can not withdrawal greater than ${Balance}` })
                }
            }

            var newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
            let rw = "P";

            let [lastInvoiceID] = await mysql2.pool.query(`select * from pettycash where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

            if (lastInvoiceID[0]?.InvoiceNo.substring(0, 4) !== newInvoiceID) {
                newInvoiceID = newInvoiceID + rw + "00001";
            } else {
                let temp3 = lastInvoiceID[0]?.InvoiceNo;
                let temp1 = parseInt(temp3.substring(10, 5)) + 1;
                let temp2 = "0000" + temp1;
                newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
            }

            datum.InvoiceNo = newInvoiceID;

            const [saveData] = await mysql2.pool.query(`insert into pettycash (CompanyID, ShopID, EmployeeID, CashType, CreditType, Amount,   Comments, Status, CreatedBy , CreatedOn,InvoiceNo, ActionType ) values (${CompanyID},${datum.ShopID}, ${datum.EmployeeID}, '${datum.CashType}', '${datum.CreditType}', ${datum.Amount},'${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${datum.InvoiceNo}', 'CashBox')`)

            let CreditType
            if (datum.CreditType === 'Withdrawal') {
                CreditType = 'Debit'
            }
            else if (datum.CreditType === 'Deposit') {
                CreditType = 'Credit'
            }

            const [paymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${saveData.insertId}, ${CompanyID}, ${datum.ShopID},'PettyCash','${CreditType}',now(),'${datum.CashType}','','',${datum.Amount},${datum.Amount},'${datum.Comments}',1, ${LoggedOnUser}, now())`)

            const [paymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${datum.InvoiceNo}',${saveData.insertId},${saveData.insertId},${CompanyID},${datum.Amount},0,'PettyCash','${CreditType}',1,${LoggedOnUser}, now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));
            response.message = "data save sucessfully"
            const [data] = await mysql2.pool.query(`select * from pettycash where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shop = ``;

            if (shopid !== 0) {
                shop = ` and pettycash.ShopID = ${shopid}`
            }

            let qry = `SELECT pettycash.*, shop.Name as ShopName, shop.AreaName as AreaName, users2.Name AS EmployeeName, users1.Name AS CreatedPerson, users.Name AS UpdatedPerson FROM pettycash  LEFT JOIN user AS users1 ON users1.ID = pettycash.CreatedBy left join shop on shop.ID = pettycash.ShopID  LEFT JOIN user AS users ON users.ID = pettycash.UpdatedBy  LEFT JOIN user AS users2 ON users2.ID = pettycash.EmployeeID WHERE pettycash.Status = 1 and RefID = 0 AND pettycash.CompanyID = ${CompanyID} ${shop} ORDER BY pettycash.ID DESC`
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
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers)

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from pettycash where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "pettycash doesnot exist from this id " })
            }

            if (doesExist.length && doesExist[0].RefID !== 0) {
                return res.send({ message: "You can not delete this Invoice" })
            }

            const [payment] = await mysql2.pool.query(`select * from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'PettyCash'`)


            const [deletePayroll] = await mysql2.pool.query(`update pettycash set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const [deletePaymentMaster] = await mysql2.pool.query(`update paymentmaster set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CustomerID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'PettyCash' and ID = ${payment[0].PaymentMasterID}`)

            const [deletePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where BillMasterID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'PettyCash' and BillID = '${doesExist[0].InvoiceNo}'`)

            console.log("PettyCash Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    getById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [Pettycash] = await mysql2.pool.query(`select * from pettycash where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Pettycash
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [doesExist] = await mysql2.pool.query(`select * from pettycash where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "pettycash doesnot exist from this id " })
            }

            if (doesExist.length && doesExist[0].RefID !== 0) {
                return res.send({ message: "You can not update this Invoice" })
            }

            const datum = {
                Name: Body.Name ? Body.Name : '',
                ShopID: Body.ShopID ? Body.ShopID : 0,
                EmployeeID: Body.EmployeeID ? Body.EmployeeID : 0,
                InvoiceNo: Body.InvoiceNo ? Body.InvoiceNo : '',
                Amount: Body.Amount ? Body.Amount : 0,
                CashType: Body.CashType ? Body.CashType : '',
                CreditType: Body.CreditType ? Body.CreditType : '',
                Comments: Body.Comments ? Body.Comments : '',
                Status: Body.Status ? Body.Status : 1,
            }

            if (datum.CashType === 'PettyCash' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `you can not withdrawal greater than ${Balance}` })
                }
            }
            if (datum.CashType === 'CashCounter' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `you can not withdrawal greater than ${Balance}` })
                }
            }


            const [update] = await mysql2.pool.query(`update pettycash set EmployeeID=${datum.EmployeeID}, CashType='${datum.CashType}',CreditType='${datum.CreditType}',Amount='${datum.Amount}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            let CreditType = ''
            if (datum.CreditType === 'Withdrawal') {
                CreditType = 'Debit'
            }
            else if (datum.CreditType === 'Deposit') {
                CreditType = 'Credit'
            }

            const [payment] = await mysql2.pool.query(`select * from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'PettyCash'`)

            const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount=${datum.Amount},PaidAmount=${datum.Amount},
            CreditType='${CreditType}', Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CustomerID=${Body.ID} and PaymentType = 'PettyCash' and CompanyID = ${CompanyID} and ID =${payment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount=${datum.Amount}, Credit='${CreditType}',UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where BillMasterID =${Body.ID} and PaymentType = 'PettyCash' and CompanyID = ${CompanyID} and BillID = '${doesExist[0].InvoiceNo}'`)

            console.log("PettyCash Updated SuccessFUlly !!!");

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shop = ``;

            if (shopid !== 0) {
                shop = ` and pettycash.ShopID = ${shopid}`
            }

            let qry = `select pettycash.*, shop.Name as ShopName, shop.AreaName as AreaName, users2.Name as EmployeeName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from pettycash left join shop on shop.ID = pettycash.ShopID left join user as users1 on users1.ID = pettycash.CreatedBy left join user as users on users.ID = pettycash.UpdatedBy left join user as users2 on users2.ID = pettycash.EmployeeID where pettycash.Status = 1 and RefID = 0 and  pettycash.CompanyID = ${CompanyID} ${shop} and users2.Name like '%${Body.searchQuery}%' OR pettycash.Status = 1 and pettycash.CompanyID = ${CompanyID} ${shop} and pettycash.CashType like '%${Body.searchQuery}%' OR pettycash.Status = 1 and pettycash.CompanyID = ${CompanyID} ${shop} and pettycash.CreditType like '%${Body.searchQuery}%' `


            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    getPettyCashBalance: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.CashType || Body.CashType.trim() === "" || Body.CashType === undefined) return res.send({ message: "Invalid Query Data" })
            if (!Body.CreditType || Body.CreditType.trim() === "" || Body.CreditType === undefined) return res.send({ message: "Invalid Query Data" })
            if (Body.CreditType !== "Deposit") return res.send({ message: "Invalid Query Data" })
            if (Body.CashType !== "PettyCash") return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [DepositBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='${Body.CreditType}'`)

            const [WithdrawalBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

            response.message = "data fetch sucessfully"
            response.data = DepositBalance[0].Amount - WithdrawalBalance[0].Amount
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getCashCounterCashBalance: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.CashType || Body.CashType.trim() === "" || Body.CashType === undefined) return res.send({ message: "Invalid Query Data" })
            if (!Body.CreditType || Body.CreditType.trim() === "" || Body.CreditType === undefined) return res.send({ message: "Invalid Query Data" })
            if (Body.CreditType !== "Deposit") return res.send({ message: "Invalid Query Data" })
            if (Body.CashType !== "CashCounter") return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [DepositBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='${Body.CreditType}'`)

            const [WithdrawalBalance] = await mysql2.pool.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

            response.message = "data fetch sucessfully"
            response.data = DepositBalance[0].Amount - WithdrawalBalance[0].Amount
            return res.send(response);

        } catch (err) {
            next(err)
        }
    }

}