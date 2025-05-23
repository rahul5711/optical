const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');

const { shopID, update_pettycash_report } = require('../helpers/helper_function')

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
            // if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.ShopID === null || Body.ShopID === 0 || Body.ShopID === undefined) return res.send({ message: "Invalid Query Data" })

            const datum = {
                Name: Body.Name ? Body.Name : '',
                ShopID: Body.ShopID ? Body.ShopID : 0,
                InvoiceNo: Body.InvoiceNo ? Body.InvoiceNo : '',
                Category: Body.Category ? Body.Category : '',
                SubCategory: Body.SubCategory ? Body.SubCategory : '',
                Amount: Body.Amount ? Body.Amount : 0,
                PaymentMode: Body.PaymentMode ? Body.PaymentMode : '',
                CashType: Body.CashType ? Body.CashType : '',
                PaymentRefereceNo: Body.PaymentRefereceNo ? Body.PaymentRefereceNo : '',
                Comments: Body.Comments ? Body.Comments : '',
                ExpenseDate: Body.ExpenseDate ? Body.ExpenseDate : now(),
                Status: Body.Status ? Body.Status : 1,
            }

            var newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
            let rw = "E";

            let [lastInvoiceID] = await connection.query(`select * from expense where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

            if (lastInvoiceID[0]?.InvoiceNo.substring(0, 4) !== newInvoiceID) {
                newInvoiceID = newInvoiceID + rw + "00001";
            } else {
                let temp3 = lastInvoiceID[0]?.InvoiceNo;
                let temp1 = parseInt(temp3.substring(10, 5)) + 1;
                let temp2 = "0000" + temp1;
                newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
            }

            datum.InvoiceNo = newInvoiceID;

            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "PettyCash") {

                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='PettyCash' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='PettyCash' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "CashCounter") {

                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='CashCounter' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='CashCounter' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            const [saveData] = await connection.query(`insert into expense (CompanyID,  ShopID, Name, Category, InvoiceNo, SubCategory,  Amount,  PaymentMode, CashType,  PaymentRefereceNo, Comments, ExpenseDate, Status, CreatedBy , CreatedOn ) values (${CompanyID}, '${datum.ShopID}', '${datum.Name}', '${datum.Category}', '${datum.InvoiceNo}', '${datum.SubCategory}', ${datum.Amount}, '${datum.PaymentMode}', '${datum.CashType}', '${datum.PaymentRefereceNo}','${datum.Comments}', '${datum.ExpenseDate}', 1 , ${LoggedOnUser}, now())`)

            const [paymentMaster] = await connection.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${LoggedOnUser}, ${CompanyID}, ${datum.ShopID},'Expense','Debit','${datum.ExpenseDate}','${datum.PaymentMode}','','${datum.PaymentRefereceNo}',${datum.Amount},${datum.Amount},'${datum.Comments}',1, ${LoggedOnUser}, now())`)

            const [paymentDetail] = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${datum.InvoiceNo}',${saveData.insertId},${LoggedOnUser},${CompanyID},${datum.Amount},0,'Expense','Debit',1,${LoggedOnUser}, now())`)


            console.log(connected("Data Save SuccessFUlly !!!"));
            response.message = "data save sucessfully"

            if (datum.PaymentMode.toUpperCase() === "CASH") {
                const [saveDataPettycash] = await connection.query(`insert into pettycash (CompanyID, ShopID, EmployeeID, RefID, CashType, CreditType, Amount,   Comments, Status, CreatedBy , CreatedOn,InvoiceNo, ActionType ) values (${CompanyID},${datum.ShopID}, ${LoggedOnUser},${saveData.insertId}, '${datum.CashType}', 'Withdrawal', ${datum.Amount},'${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${datum.InvoiceNo}', 'Expense')`);

                const update_pettycash = update_pettycash_report(CompanyID, datum.ShopID, "Expense", datum.Amount, datum.CashType, req.headers.currenttime)

            }



            const [data] = await connection.query(`select * from expense where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
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
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and expense.ShopID = ${shopid}`
            }

            let qry = `select expense.*, shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from expense left join user as users1 on users1.ID = expense.CreatedBy left join user as users on users.ID = expense.UpdatedBy left join shop on shop.ID = expense.ShopID where expense.Status = 1 and expense.CompanyID = ${CompanyID} ${shopId}   order by expense.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
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
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, InvoiceNo, PaymentMode, ShopID, Amount, CashType  from expense where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "expense doesnot exist from this id " })
            }


            const [deleteExpense] = await connection.query(`update expense set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            const [payment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'Expense'`)

            const [deletePaymentMaster] = await connection.query(`update paymentmaster set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where  CompanyID = ${CompanyID} and PaymentType = 'Expense' and ID = ${payment[0].PaymentMasterID}`)

            const [deletePaymentDetail] = await connection.query(`update paymentdetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where BillMasterID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Expense' and BillID = '${doesExist[0].InvoiceNo}'`)

            if (doesExist[0].PaymentMode.toUpperCase() === "CASH") {
                const [delPettyCash] = await connection.query(`update pettycash set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where RefID = ${Body.ID} and CompanyID = ${CompanyID} and  InvoiceNo = '${doesExist[0].InvoiceNo}'`)

                const update_pettycash = update_pettycash_report(CompanyID, doesExist[0].ShopID, "Expense", -doesExist[0].Amount, doesExist[0].CashType, req.headers.currenttime)

            }

            console.log("Expense Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
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

    getById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [Expense] = await connection.query(`select * from expense where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Expense
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
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, InvoiceNo, PaymentMode, ShopID, Amount, CashType from expense where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "expense doesnot exist from this id " })
            }

            const datum = {
                Name: Body.Name ? Body.Name : '',
                ShopID: Body.ShopID ? Body.ShopID : 0,
                Category: Body.Category ? Body.Category : '',
                SubCategory: Body.SubCategory ? Body.SubCategory : '',
                Amount: Body.Amount ? Body.Amount : 0,
                PaymentMode: Body.PaymentMode ? Body.PaymentMode : '',
                CashType: Body.CashType ? Body.CashType : '',
                PaymentRefereceNo: Body.PaymentRefereceNo ? Body.PaymentRefereceNo : '',
                Comments: Body.Comments ? Body.Comments : '',
                Status: Body.Status ? Body.Status : 1,
                ExpenseDate: Body.ExpenseDate ? Body.ExpenseDate : now(),
            }


            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "PettyCash") {

                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='PettyCash' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='PettyCash' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "CashCounter") {

                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='CashCounter' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${datum.ShopID} and CashType='CashCounter' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            const [update] = await connection.query(`update expense set ShopID='${datum.ShopID}',Name='${datum.Name}', Category='${datum.Category}',SubCategory='${datum.SubCategory}',Amount=${datum.Amount},PaymentMode='${datum.PaymentMode}',CashType='${datum.CashType}',PaymentRefereceNo='${datum.PaymentRefereceNo}',Comments='${datum.Comments}', ExpenseDate = '${datum.ExpenseDate}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)


            const [payment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'Expense'`)


            const [updatePaymentMaster] = await connection.query(`update paymentmaster set ShopID=${datum.ShopID}, PaymentMode='${datum.PaymentMode}',PaymentReferenceNo='${datum.PaymentRefereceNo}',PayableAmount=${datum.Amount},PaidAmount=${datum.Amount},Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now(), PaymentDate = '${datum.ExpenseDate}' where CustomerID=${LoggedOnUser} and PaymentType = 'Expense' and CompanyID = ${CompanyID} and ID = ${payment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await connection.query(`update paymentdetail set Amount=${datum.Amount}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where BillMasterID =${Body.ID} and PaymentType = 'Expense' and CompanyID = ${CompanyID} and BillID = '${doesExist[0].InvoiceNo}'`)

            const [doesExistPettyCash] = await connection.query(`select ID, CashType, Amount, ShopID  from pettycash where CompanyID = ${CompanyID} and InvoiceNo = '${doesExist[0].InvoiceNo}' and RefID = ${Body.ID} and Status = 1`)

            if (doesExistPettyCash.length && datum.PaymentMode.toUpperCase() === "CASH") {
                const updatedBalance = doesExistPettyCash[0].Amount - datum.Amount
                if (doesExistPettyCash[0].CashType === datum.CashType) {
                    const update_pettycash = update_pettycash_report(CompanyID, doesExistPettyCash[0].ShopID, "Expense", -updatedBalance, doesExistPettyCash[0].CashType, req.headers.currenttime)
                }
                if (doesExistPettyCash[0].CashType !== datum.CashType) {
                    const update_pettycash = update_pettycash_report(CompanyID, doesExistPettyCash[0].ShopID, "Expense", -doesExistPettyCash[0].Amount, doesExistPettyCash[0].CashType, req.headers.currenttime)
                    const update_pettycash2 = update_pettycash_report(CompanyID, datum.ShopID, "Expense", datum.Amount, datum.CashType, req.headers.currenttime)
                }

                const [updatePettycash] = await connection.query(`update pettycash set ShopID=${datum.ShopID}, CashType='${datum.CashType}',Amount='${datum.Amount}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser},ShopID=${datum.ShopID}, UpdatedOn=now() where RefID = ${Body.ID} and CompanyID = ${CompanyID} and InvoiceNo = '${doesExist[0].InvoiceNo}'`)





            } else if (!doesExistPettyCash.length && datum.PaymentMode.toUpperCase() === "CASH") {

                const [saveDataPettycash] = await connection.query(`insert into pettycash (CompanyID, ShopID, EmployeeID, RefID, CashType, CreditType, Amount,   Comments, Status, CreatedBy , CreatedOn,InvoiceNo ) values (${CompanyID},${datum.ShopID}, ${LoggedOnUser},${Body.ID}, '${datum.CashType}', 'Withdrawal', ${datum.Amount},'${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${doesExist[0].InvoiceNo}')`);

                const update_pettycash = update_pettycash_report(CompanyID, datum.ShopID, "Expense", datum.Amount, datum.CashType, req.headers.currenttime)
            }

            if (doesExistPettyCash.length && datum.PaymentMode.toUpperCase() !== "CASH") {
                const [updatePettycash] = await connection.query(`update pettycash set Status = 0, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where RefID = ${Body.ID} and CompanyID = ${CompanyID} and InvoiceNo = '${doesExist[0].InvoiceNo}'`)

                const update_pettycash = update_pettycash_report(CompanyID, doesExistPettyCash[0].ShopID, "Expense", -doesExistPettyCash[0].Amount, doesExistPettyCash[0].CashType, req.headers.currenttime)
            }

            console.log("Expense Updated SuccessFUlly !!!");

            response.message = "data update sucessfully"

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
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let qry = `select expense.*, shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from expense left join user as users1 on users1.ID = expense.CreatedBy left join user as users on users.ID = expense.UpdatedBy left join shop on shop.ID = expense.ShopID where expense.Status = 1 and expense.CompanyID = ${CompanyID} and expense.Name like '%${Body.searchQuery}%' OR expense.Status = 1 and expense.CompanyID = ${CompanyID} and expense.Category like '%${Body.searchQuery}%' `


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

    getExpenseReport: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            let qry = `select expense.*, shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from expense left join user as users1 on users1.ID = expense.CreatedBy left join user as users on users.ID = expense.UpdatedBy left join shop on shop.ID = expense.ShopID where expense.Status = 1 and expense.CompanyID = ${CompanyID} ${Parem}  order by expense.ID desc`

            let [data] = await connection.query(qry);
            response.message = "data fetch sucessfully"
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

    getSaleReportMonthYearWise: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: {
                    "Amount": 0,
                    "Paid": 0,
                    "Balance": 0,
                    "BillCount": 0,
                }
            }
            const { Parem, Type } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            let qry = ``

            if (Type === 'YearWise') {
                qry = `SELECT DATE_FORMAT(ExpenseDate, '%Y') AS YEAR, ROUND(SUM(Amount), 2) AS Amount,ROUND(SUM(Amount) - SUM(0), 2) AS Paid, ROUND(SUM(0), 2) AS Balance,COUNT(ID) AS BillCount FROM expense WHERE expense.status = 1 AND expense.CompanyID = ${CompanyID} ${Parem} GROUP BY DATE_FORMAT(ExpenseDate, '%Y') ORDER BY DATE_FORMAT(ExpenseDate, '%Y')`
            } else if (Type === 'YearMonthWise') {
                qry = `SELECT DATE_FORMAT(ExpenseDate, '%M-%Y') AS MonthYear, ROUND(SUM(Amount), 2) AS Amount, ROUND(SUM(Amount), 2) - ROUND(SUM(0),2) AS Paid, ROUND(SUM(0),2) AS Balance, COUNT(ID) AS BillCount,GROUP_CONCAT(ID) AS BillMasterIds FROM expense WHERE expense.status = 1 AND expense.CompanyID = ${CompanyID} ${Parem} GROUP BY DATE_FORMAT(ExpenseDate, '%M - %Y') ORDER BY DATE_FORMAT(ExpenseDate, '%Y-%m')`;
            } else {
                qry = `SELECT DATE_FORMAT(ExpenseDate, '%M-%Y') AS MonthYear, ROUND(SUM(Amount), 2) AS Amount, ROUND(SUM(Amount), 2) - ROUND(SUM(0),2) AS Paid, ROUND(SUM(0),2) AS Balance, COUNT(ID) AS BillCount,GROUP_CONCAT(ID) AS BillMasterIds FROM expense WHERE expense.status = 1 AND expense.CompanyID = ${CompanyID} ${Parem} GROUP BY DATE_FORMAT(ExpenseDate, '%M - %Y') ORDER BY DATE_FORMAT(ExpenseDate, '%Y-%m')`;
            }


            let [data] = await connection.query(qry);

            if (data.length) {
                for (let item of data) {
                    response.calculation.Amount += item.Amount
                    response.calculation.Paid += item.Paid
                    response.calculation.Balance += item.Balance
                    response.calculation.BillCount += item.BillCount
                }
            }

            response.data = data
            response.message = "success";
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
    getSaleReportMonthYearWiseDetails: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: {
                    "Amount": 0,
                    "Paid": 0,
                    "Balance": 0
                }
            }
            const { BillMasterIds } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            qry = `SELECT DATE(expense.ExpenseDate) AS ExpenseDate, ROUND(SUM(expense.Amount),2) AS Amount, ROUND(SUM(expense.Amount - 0),2) AS Paid, ROUND(SUM(0),2) AS Balance FROM expense WHERE expense.status = 1 AND expense.CompanyID = ${CompanyID} AND expense.ID IN (${BillMasterIds}) GROUP BY DATE(expense.ExpenseDate)`;

            let [data] = await connection.query(qry);

            if (data.length) {
                for (let item of data) {
                    response.calculation.Amount += item.Amount
                    response.calculation.Paid += item.Paid
                    response.calculation.Balance += item.Balance
                }
            }

            response.data = data
            response.message = "success";
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