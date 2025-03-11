const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
const { shopID, update_pettycash_report } = require('../helpers/helper_function')

module.exports = {
    save: async (req, res, next) => {
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
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.EmployeeID === null || Body.EmployeeID === undefined || !Body.EmployeeID) return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })
            const [doesExist] = await db.query(`select ID from payroll where Status = 1 and EmployeeID=${Body.EmployeeID} and Month='${Body.Month}' and Year='${Body.Year}' and CompanyID=${CompanyID}`)

            if (doesExist.length) return res.send({ message: `payroll Already exist from this EmployeeID ${Body.EmployeeID} and Month ${Body.Month} and Year ${Body.Year}` })

            const datum = {
                EmployeeID: Body.EmployeeID ? Body.EmployeeID : 0,
                InvoiceNo: Body.InvoiceNo ? Body.InvoiceNo : '',
                Month: Body.Month ? Body.Month : '',
                Year: Body.Year ? Body.Year : '',
                LeaveDays: Body.LeaveDays ? Body.LeaveDays : 0,
                Salary: Body.Salary ? Body.Salary : 0,
                CashType: Body.CashType ? Body.CashType : '',
                PaymentMode: Body.PaymentMode ? Body.PaymentMode : '',
                Comments: Body.Comments ? Body.Comments : '',
                Status: Body.Status ? Body.Status : 1,
            }

            var newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
            let rw = "S";

            let [lastInvoiceID] = await db.query(`select * from payroll where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

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

                const [DepositBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='PettyCash' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='PettyCash' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Salary) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "CashCounter") {

                const [DepositBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='CashCounter' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='CashCounter' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Salary) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            const [saveData] = await db.query(`insert into payroll (CompanyID, ShopID, EmployeeID, Month, Year, LeaveDays,  Salary,  PaymentMode, Comments, Status, CreatedBy , CreatedOn,InvoiceNo,CashType ) values (${CompanyID}, ${shopid} , ${datum.EmployeeID}, '${datum.Month}', '${datum.Year}', ${datum.LeaveDays}, ${datum.Salary}, '${datum.PaymentMode}', '${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${datum.InvoiceNo}','${datum.CashType}')`)

            const [paymentMaster] = await db.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${datum.EmployeeID}, ${CompanyID},${shopid},'Employee','Debit',now(),'${datum.PaymentMode}','','',${datum.Salary},${datum.Salary},'${datum.Comments}',1, ${LoggedOnUser}, now())`)

            const [paymentDetail] = await db.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${datum.InvoiceNo}',${saveData.insertId},${datum.EmployeeID},${CompanyID},${datum.Salary},0,'Employee','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            if (datum.PaymentMode.toUpperCase() === "CASH") {
                const [saveDataPettycash] = await db.query(`insert into pettycash (CompanyID, ShopID, EmployeeID, RefID, CashType, CreditType, Amount,   Comments, Status, CreatedBy , CreatedOn,InvoiceNo, ActionType ) values (${CompanyID},${shopid}, ${datum.EmployeeID},${saveData.insertId}, '${datum.CashType}', 'Withdrawal', ${datum.Salary},'${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${datum.InvoiceNo}', 'Employee')`);
                const update_pettycash = update_pettycash_report(CompanyID, shopid, "Payroll", datum.Salary, datum.CashType, req.headers.currenttime)
            }



            response.message = "data save sucessfully"
            const [data] = await db.query(`select * from payroll where CompanyID = ${CompanyID} and ShopID = ${shopid} and Status = 1 order by ID desc`)
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;
            let shop = ``;
            if (shopid !== 0) {
                shop = ` and payroll.ShopID = ${shopid}`
            }

            let qry = `select payroll.*, shop.Name as ShopName, shop.AreaName as AreaName, users2.Name as EmployeeName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from payroll left join shop on shop.ID = payroll.ShopID left join user as users1 on users1.ID = payroll.CreatedBy left join user as users on users.ID = payroll.UpdatedBy left join user as users2 on users2.ID = payroll.EmployeeID where payroll.Status = 1 and payroll.CompanyID = '${CompanyID} ' ${shop}  order by payroll.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;


            let [data] = await db.query(finalQuery);
            let [count] = await db.query(qry);

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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await db.query(`select ID, InvoiceNo, PaymentMode, ShopID, Amount, CashType from payroll where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "payroll doesnot exist from this id " })
            }

            const [payment] = await db.query(`select ID, PaymentMasterID from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'Employee'`)


            const [deletePayroll] = await db.query(`update payroll set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            const [deletePaymentMaster] = await db.query(`update paymentmaster set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CustomerID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Employee' and ID = ${payment[0].PaymentMasterID}`)

            const [deletePaymentDetail] = await db.query(`update paymentdetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where BillMasterID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Employee' and BillID = '${doesExist[0].InvoiceNo}'`)

            console.log("Payroll Delete SuccessFUlly !!!");


            if (doesExist[0].PaymentMode.toUpperCase() === "CASH") {
                const [delPettyCash] = await db.query(`update pettycash set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where RefID = ${Body.ID} and CompanyID = ${CompanyID} and  InvoiceNo = '${doesExist[0].InvoiceNo}'`)

                const update_pettycash = update_pettycash_report(CompanyID, doesExist[0].ShopID, "Payroll", -doesExist[0].Amount, doesExist[0].CashType, req.headers.currenttime)
            }

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
            const shopid = await shopID(req.headers)
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            const [Payroll] = await db.query(`select * from payroll where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Payroll
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (shopid == 0) return res.send({ message: "Invalid Shop" })

            const [doesExist] = await db.query(`select ID, InvoiceNo from payroll where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "payroll doesnot exist from this id " })
            }

            const datum = {
                EmployeeID: Body.EmployeeID ? Body.EmployeeID : 0,
                Month: Body.Month ? Body.Month : '',
                Year: Body.Year ? Body.Year : '',
                LeaveDays: Body.LeaveDays ? Body.LeaveDays : 0,
                Salary: Body.Salary ? Body.Salary : 0,
                CashType: Body.CashType ? Body.CashType : '',
                PaymentMode: Body.PaymentMode ? Body.PaymentMode : '',
                Comments: Body.Comments ? Body.Comments : '',
                Status: Body.Status ? Body.Status : 1,
            }


            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "PettyCash") {

                const [DepositBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='PettyCash' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='PettyCash' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Salary) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }

            if (datum.PaymentMode.toUpperCase() === "CASH" && datum.CashType === "CashCounter") {

                const [DepositBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='CashCounter' and CreditType='Deposit'`)

                const [WithdrawalBalance] = await db.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${shopid} and CashType='CashCounter' and CreditType='Withdrawal'`)

                const Balance = DepositBalance[0].Amount - WithdrawalBalance[0].Amount

                if (Balance < datum.Salary) {
                    return res.send({ message: `You cannot pay more than available Amount Rs ${Balance}` })
                }
            }


            const [update] = await db.query(`update payroll set EmployeeID=${datum.EmployeeID}, ShopID = ${shopid} ,Month='${datum.Month}', Year='${datum.Year}',LeaveDays=${datum.LeaveDays},Salary=${datum.Salary},PaymentMode='${datum.PaymentMode}',CashType='${datum.CashType}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            const [payment] = await db.query(`select ID, PaymentMasterID from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'Employee'`)


            const [updatePaymentMaster] = await db.query(`update paymentmaster set ShopID = ${shopid}, PaymentMode='${datum.PaymentMode}',PayableAmount=${datum.Salary},PaidAmount=${datum.Salary},Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CustomerID=${Body.ID} and PaymentType = 'Employee'  and ID =${payment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await db.query(`update paymentdetail set Amount=${datum.Salary}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where BillMasterID =${Body.ID} and PaymentType = 'Employee' and CompanyID = ${CompanyID} and BillID = '${doesExist[0].InvoiceNo}'`)

            console.log("Payroll Updated SuccessFUlly !!!");


            const [doesExistPettyCash] = await db.query(`select ID, Amount, CashType, ShopID from pettycash where CompanyID = ${CompanyID} and InvoiceNo = '${doesExist[0].InvoiceNo}' and RefID = ${Body.ID} and Status = 1`)

            if (doesExistPettyCash.length && datum.PaymentMode.toUpperCase() === "CASH") {
                const updatedBalance = doesExistPettyCash[0].Amount - datum.Salary

                const [updatePettycash] = await db.query(`update pettycash set ShopID=${shopid}, EmployeeID=${datum.EmployeeID}, CashType='${datum.CashType}',Amount='${datum.Salary}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser},ShopID=${shopid}, UpdatedOn=now() where RefID = ${Body.ID} and CompanyID = ${CompanyID} and InvoiceNo = '${doesExist[0].InvoiceNo}'`)

                if (doesExistPettyCash[0].CashType === datum.CashType) {
                    const update_pettycash = update_pettycash_report(CompanyID, doesExistPettyCash[0].ShopID, "Payroll", -updatedBalance, doesExistPettyCash[0].CashType, req.headers.currenttime)
                }
                if (doesExistPettyCash[0].CashType !== datum.CashType) {
                    const update_pettycash = update_pettycash_report(CompanyID, doesExistPettyCash[0].ShopID, "Payroll", -doesExistPettyCash[0].Amount, doesExistPettyCash[0].CashType, req.headers.currenttime)
                    const update_pettycash2 = update_pettycash_report(CompanyID, datum.ShopID, "Payroll", datum.Amount, datum.CashType, req.headers.currenttime)
                }



            } else if (!doesExistPettyCash.length && datum.PaymentMode.toUpperCase() === "CASH") {

                const [saveDataPettycash] = await db.query(`insert into pettycash (CompanyID, ShopID, EmployeeID, RefID, CashType, CreditType, Amount,   Comments, Status, CreatedBy , CreatedOn,InvoiceNo ) values (${CompanyID},${shopid}, ${datum.EmployeeID},${Body.ID}, '${datum.CashType}', 'Withdrawal', ${datum.Salary},'${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${doesExist[0].InvoiceNo}')`);

                const update_pettycash = update_pettycash_report(CompanyID, datum.ShopID, "Payroll", datum.Salary, datum.CashType, req.headers.currenttime)

            }



            if (doesExistPettyCash.length && datum.PaymentMode.toUpperCase() !== "CASH") {
                const [updatePettycash] = await db.query(`update pettycash set Status = 0, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where RefID = ${Body.ID} and CompanyID = ${CompanyID} and InvoiceNo = '${doesExist[0].InvoiceNo}'`)

                const update_pettycash = update_pettycash_report(CompanyID, doesExistPettyCash[0].ShopID, "Payroll", -doesExistPettyCash[0].Amount, doesExistPettyCash[0].CashType, req.headers.currenttime)
            }

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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shop = ``;
            if (shopid !== 0) {
                shop = ` and payroll.ShopID = ${shopid}`
            }

            let qry = `select payroll.*, shop.Name as ShopName, shop.AreaName as AreaName, users2.Name as EmployeeName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from payroll left join shop on shop.ID = payroll.ShopID left join user as users1 on users1.ID = payroll.CreatedBy left join user as users on users.ID = payroll.UpdatedBy left join user as users2 on users2.ID = payroll.EmployeeID where payroll.Status = 1 and payroll.CompanyID = '${CompanyID}  ' ${shop} and payroll.Month like '%${Body.searchQuery}%' OR payroll.Status = 1 and payroll.CompanyID = '${CompanyID}  ' ${shop} and payroll.Year like '%${Body.searchQuery}%' OR payroll.Status = 1 and payroll.CompanyID = '${CompanyID}  ' ${shop} and users2.Name like '%${Body.searchQuery}%'`

            let [data] = await db.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
}