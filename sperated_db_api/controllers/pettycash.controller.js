const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID, update_pettycash_report } = require('../helpers/helper_function')
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');


module.exports = {
    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            console.log("current time =====> ", req.headers.currenttime, typeof req.headers.currenttime);
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
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
                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs  ${Balance}` })
                }
            }

            if (datum.CashType === 'CashCounter' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs  ${Balance}` })
                }
            }

            var newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
            let rw = "P";

            let [lastInvoiceID] = await connection.query(`select InvoiceNo from pettycash where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

            if (lastInvoiceID.length && lastInvoiceID[0]?.InvoiceNo.substring(0, 4) !== newInvoiceID) {
                newInvoiceID = newInvoiceID + rw + "00001";
            } else if (lastInvoiceID.length) {
                let temp3 = lastInvoiceID[0]?.InvoiceNo;
                let temp1 = parseInt(temp3.substring(10, 5)) + 1;
                let temp2 = "0000" + temp1;
                newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
            } else {
                newInvoiceID = newInvoiceID + rw + "00001";
            }

            datum.InvoiceNo = newInvoiceID;

            const [saveData] = await connection.query(`insert into pettycash (CompanyID, ShopID, EmployeeID, CashType, CreditType, Amount,   Comments, Status, CreatedBy , CreatedOn,InvoiceNo, ActionType ) values (${CompanyID},${datum.ShopID}, ${datum.EmployeeID}, '${datum.CashType}', '${datum.CreditType}', ${datum.Amount},'${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${datum.InvoiceNo}', 'CashBox')`)

            let CreditType
            if (datum.CreditType === 'Withdrawal') {
                CreditType = 'Debit'
            }
            else if (datum.CreditType === 'Deposit') {
                CreditType = 'Credit'
            }

            const [paymentMaster] = await connection.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${datum.EmployeeID}, ${CompanyID}, ${datum.ShopID},'PettyCash','${CreditType}',now(),'${datum.CashType}','','',${datum.Amount},${datum.Amount},'${datum.Comments}',1, ${LoggedOnUser}, now())`)

            const [paymentDetail] = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${datum.InvoiceNo}',${saveData.insertId},${datum.EmployeeID},${CompanyID},${datum.Amount},0,'PettyCash','${CreditType}',1,${LoggedOnUser}, now())`)


            const update_pettycash = update_pettycash_report(CompanyID, datum.ShopID, datum.CreditType, datum.Amount, datum.CashType, req.headers.currenttime)

            console.log(connected("Data Save SuccessFUlly !!!"));
            response.message = "data save sucessfully"
            const [data] = await connection.query(`select * from pettycash where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
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
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
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
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, RefID, InvoiceNo, CreditType, Amount, ShopID, CashType  from pettycash where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "pettycash doesnot exist from this id " })
            }

            if (doesExist.length && doesExist[0].RefID !== 0) {
                return res.send({ message: "You can not delete this Invoice" })
            }

            const [payment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'PettyCash'`)


            const [deletePayroll] = await connection.query(`update pettycash set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const [deletePaymentMaster] = await connection.query(`update paymentmaster set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and PaymentType = 'PettyCash' and ID = ${payment[0].PaymentMasterID}`)

            const [deletePaymentDetail] = await connection.query(`update paymentdetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where BillMasterID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'PettyCash' and BillID = '${doesExist[0].InvoiceNo}'`)

            if (doesExist[0].CreditType === "Deposit") {
                const update_pettycash = update_pettycash_report(CompanyID, doesExist[0].ShopID, "Withdrawal", doesExist[0].Amount, doesExist[0].CashType, req.headers.currenttime)
            }
            if (doesExist[0].CreditType === "Withdrawal") {
                const update_pettycash = update_pettycash_report(CompanyID, doesExist[0].ShopID, "Deposit", doesExist[0].Amount, doesExist[0].CashType, req.headers.currenttime)
            }



            console.log("PettyCash Delete SuccessFUlly !!!");

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
            const [Pettycash] = await connection.query(`select * from pettycash where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Pettycash
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
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [doesExist] = await connection.query(`select ID, RefID, InvoiceNo, CreditType, Amount, ShopID, CashType from pettycash where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

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

            if (doesExist[0].CashType !== datum.CashType) {
                return res.send({ message: "You can not change register type." })
            }

            if (datum.CashType === 'PettyCash' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs  ${Balance}` })
                }
            }
            if (datum.CashType === 'CashCounter' && datum.CreditType === 'Withdrawal') {
                const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Amount) {
                    return res.send({ message: `You cannot pay more than available Amount Rs  ${Balance}` })
                }
            }

            if (doesExist[0].CashType === datum.CashType && datum.CreditType !== doesExist[0].CreditType) {
                let updatedBalance = datum.Amount + doesExist[0].Amount
                const update_pettycash2 = await update_pettycash_report(CompanyID, datum.ShopID, datum.CreditType, updatedBalance, datum.CashType, req.headers.currenttime)
            }
            if (doesExist[0].CashType === datum.CashType && datum.CreditType === doesExist[0].CreditType) {
                let updatedBalance = datum.Amount - doesExist[0].Amount;
                const update_pettycash2 = await update_pettycash_report(CompanyID, datum.ShopID, datum.CreditType, updatedBalance, datum.CashType, req.headers.currenttime)
            }

            const [update] = await connection.query(`update pettycash set EmployeeID=${datum.EmployeeID}, CashType='${datum.CashType}',CreditType='${datum.CreditType}',Amount='${datum.Amount}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            let CreditType = ''
            if (datum.CreditType === 'Withdrawal') {
                CreditType = 'Debit'
            }
            else if (datum.CreditType === 'Deposit') {
                CreditType = 'Credit'
            }

            const [payment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'PettyCash'`)

            const [updatePaymentMaster] = await connection.query(`update paymentmaster set PayableAmount=${datum.Amount},PaidAmount=${datum.Amount},
            CreditType='${CreditType}', Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where  PaymentType = 'PettyCash' and CompanyID = ${CompanyID} and ID =${payment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await connection.query(`update paymentdetail set Amount=${datum.Amount}, Credit='${CreditType}',UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where BillMasterID =${Body.ID} and PaymentType = 'PettyCash' and CompanyID = ${CompanyID} and BillID = '${doesExist[0].InvoiceNo}'`)



            console.log("PettyCash Updated SuccessFUlly !!!");

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
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shop = ``;

            if (shopid !== 0) {
                shop = ` and pettycash.ShopID = ${shopid}`
            }

            let qry = `select pettycash.*, shop.Name as ShopName, shop.AreaName as AreaName, users2.Name as EmployeeName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from pettycash left join shop on shop.ID = pettycash.ShopID left join user as users1 on users1.ID = pettycash.CreatedBy left join user as users on users.ID = pettycash.UpdatedBy left join user as users2 on users2.ID = pettycash.EmployeeID where pettycash.Status = 1 and RefID = 0 and  pettycash.CompanyID = ${CompanyID} ${shop} and users2.Name like '%${Body.searchQuery}%' OR pettycash.Status = 1 and pettycash.CompanyID = ${CompanyID} ${shop} and pettycash.CashType like '%${Body.searchQuery}%' OR pettycash.Status = 1 and pettycash.CompanyID = ${CompanyID} ${shop} and pettycash.CreditType like '%${Body.searchQuery}%' `


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
    pettyCashReport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: [{
                    "WithdrawalAmount": 0,
                    "DepositAmount": 0,
                    "TotalAmount": 0,
                }]
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) {
                return res.send({ success: false, message: "Invalid query data" })
            }

            let qry = `SELECT pettycash.ID, COALESCE(c.Name, u.Name, s.Name, u2.Name, u3.Name, d.Name, f.Name) AS NAME, CONCAT(ss.Name, '(', ss.AreaName, ')') AS ShopName, pettycash.CashType, pettycash.CreditType, CASE WHEN pettycash.CreditType = 'Deposit' THEN pettycash.Amount ELSE 0 END AS DepositAmount, CASE WHEN pettycash.CreditType = 'Withdrawal' THEN pettycash.Amount ELSE 0 END AS WithdrawalAmount, pettycash.Amount AS TotalAmount, CASE WHEN pettycash.Comments = '0' THEN '' ELSE pettycash.Comments END AS Comments, pettycash.Status, u4.Name AS CreatedBy, pettycash.CreatedOn, pettycash.InvoiceNo, pettycash.ActionType FROM pettycash LEFT JOIN customer c ON pettycash.ActionType = 'Customer' AND c.ID = pettycash.EmployeeID LEFT JOIN USER u ON pettycash.ActionType = 'CashBox' AND u.ID = pettycash.EmployeeID LEFT JOIN supplier s ON pettycash.ActionType = 'Supplier' AND s.ID = pettycash.EmployeeID LEFT JOIN USER u2 ON pettycash.ActionType = 'Expense' AND u2.ID = pettycash.EmployeeID LEFT JOIN USER u3 ON pettycash.ActionType = 'Employee' AND u3.ID = pettycash.EmployeeID LEFT JOIN doctor d ON pettycash.ActionType = 'Doctor' AND d.ID = pettycash.EmployeeID LEFT JOIN fitter f ON pettycash.ActionType = 'Fitter' AND f.ID = pettycash.EmployeeID LEFT JOIN shop AS ss ON ss.ID = pettycash.ShopID LEFT JOIN USER u4 ON u4.ID = pettycash.CreatedBy WHERE pettycash.Status = 1 and pettycash.CompanyID = ${CompanyID}  ${Parem}`

            let [data] = await connection.query(qry);

            if (data) {
                for (let item of data) {
                    response.calculation[0].TotalAmount += item.TotalAmount
                    response.calculation[0].WithdrawalAmount += item.WithdrawalAmount
                    response.calculation[0].DepositAmount += item.DepositAmount
                }
            }
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
    pettyCashOpeningClosingReport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) {
                return res.send({ success: false, message: "Invalid query data" })
            }

            let qry = `SELECT pettycashreport.*, CONCAT(ss.Name, '(', ss.AreaName, ')') AS ShopName FROM pettycashreport LEFT JOIN shop AS ss ON ss.ID = pettycashreport.ShopID WHERE pettycashreport.CompanyID = ${CompanyID}  ${Parem}`
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

    getPettyCashBalance: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.CashType || Body.CashType.trim() === "" || Body.CashType === undefined) return res.send({ message: "Invalid Query Data" })
            if (!Body.CreditType || Body.CreditType.trim() === "" || Body.CreditType === undefined) return res.send({ message: "Invalid Query Data" })
            if (Body.CreditType !== "Deposit") return res.send({ message: "Invalid Query Data" })
            if (Body.CashType !== "PettyCash") return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='${Body.CreditType}'`)

            const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

            response.message = "data fetch sucessfully"
            response.data = DepositBalance[0].Amount - WithdrawalBalance[0].Amount
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
    getCashCounterCashBalance: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.CashType || Body.CashType.trim() === "" || Body.CashType === undefined) return res.send({ message: "Invalid Query Data" })
            if (!Body.CreditType || Body.CreditType.trim() === "" || Body.CreditType === undefined) return res.send({ message: "Invalid Query Data" })
            if (Body.CreditType !== "Deposit") return res.send({ message: "Invalid Query Data" })
            if (Body.CashType !== "CashCounter") return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='${Body.CreditType}'`)

            const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='${Body.CashType}' and CreditType='Withdrawal'`)

            response.message = "data fetch sucessfully"
            response.data = DepositBalance[0].Amount - WithdrawalBalance[0].Amount
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    }

}