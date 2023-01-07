const createError = require('http-errors')
const getConnection = require('../helpers/db')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const _Query = require('../helpers/queryBuilder')


module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.Name.trim() === "") return res.send({ message: "Invalid Query Data" })
            if (Body.ShopID === null || Body.ShopID === undefined) return res.send({ message: "Invalid Query Data" })

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
                ExpenseDate: Body.ExpenseDate ? Body.ExpenseDate : '',
                Status: Body.Status ? Body.Status : 1,
            }

            var newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
            let rw = "E";

            let lastInvoiceID = await connection.query(`select * from expense where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

            if (lastInvoiceID[0]?.InvoiceNo.substring(0, 4) !== newInvoiceID) {
                newInvoiceID = newInvoiceID + rw + "00001";
            } else {
                let temp3 = lastInvoiceID[0]?.InvoiceNo;
                let temp1 = parseInt(temp3.substring(10, 5)) + 1;
                let temp2 = "0000" + temp1;
                newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
            }

            datum.InvoiceNo = newInvoiceID;


            const saveData = await connection.query(`insert into expense (CompanyID,  ShopID, Name, Category, InvoiceNo, SubCategory,  Amount,  PaymentMode, CashType,  PaymentRefereceNo, Comments, ExpenseDate, Status, CreatedBy , CreatedOn ) values (${CompanyID}, '${datum.ShopID}', '${datum.Name}', '${datum.Category}', '${datum.InvoiceNo}', '${datum.SubCategory}', ${datum.Amount}, '${datum.PaymentMode}', '${datum.CashType}', '${datum.PaymentRefereceNo}','${datum.Comments}', now(), 1 , ${LoggedOnUser}, now())`)

            const paymentMaster = await connection.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${saveData.insertId}, ${CompanyID}, ${datum.ShopID},'Expense','Debit',now(),'${datum.PaymentMode}','','${datum.PaymentRefereceNo}',${datum.Amount},${datum.Amount},'${datum.Comments}',1, ${LoggedOnUser}, now())`)

            const paymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${datum.InvoiceNo}',${saveData.insertId},${saveData.insertId},${CompanyID},${datum.Amount},0,'Expense','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));
            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from expense where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error
        }
    },
    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select expense.*, shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from expense left join user as users1 on users1.ID = expense.CreatedBy left join user as users on users.ID = expense.UpdatedBy left join shop on shop.ID = expense.ShopID where expense.Status = 1 and expense.CompanyID = '${CompanyID}'  order by expense.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            // connection.release()
            res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from expense where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "expense doesnot exist from this id " })
            }


            const deleteExpense = await connection.query(`update expense set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            const payment = await connection.query(`select * from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'Expense'`)

            const deletePaymentMaster = await connection.query(`update paymentmaster set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CustomerID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Expense' and ID = ${payment[0].PaymentMasterID}`)

            const deletePaymentDetail = await connection.query(`update paymentdetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where BillMasterID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Expense' and BillID = '${doesExist[0].InvoiceNo}'`)

            console.log("Expense Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            // connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    getById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const Expense = await connection.query(`select * from expense where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Expense
            // connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from expense where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

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
            }

            const update = await connection.query(`update expense set ShopID='${datum.ShopID}',Name='${datum.Name}', Category='${datum.Category}',SubCategory='${datum.SubCategory}',Amount=${datum.Amount},PaymentMode='${datum.PaymentMode}',CashType='${datum.CashType}',PaymentRefereceNo='${datum.PaymentRefereceNo}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)


            const payment = await connection.query(`select * from paymentdetail where Status = 1 and BillID='${doesExist[0].InvoiceNo}' and CompanyID = ${CompanyID} and PaymentType = 'Expense'`)


            const updatePaymentMaster = await connection.query(`update paymentmaster set PaymentMode='${datum.PaymentMode}',PaymentReferenceNo='${datum.PaymentRefereceNo}',PayableAmount=${datum.Amount},PaidAmount=${datum.Amount},Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CustomerID=${Body.ID} and PaymentType = 'Expense' and CompanyID = ${CompanyID} and ID = ${payment[0].PaymentMasterID}`)

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount=${datum.Amount}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where BillMasterID =${Body.ID} and PaymentType = 'Expense' and CompanyID = ${CompanyID} and BillID = '${doesExist[0].InvoiceNo}'`)

            console.log("Expense Updated SuccessFUlly !!!");

            response.message = "data update sucessfully"
            // connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error
        }
    },

    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select expense.*, shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from expense left join user as users1 on users1.ID = expense.CreatedBy left join user as users on users.ID = expense.UpdatedBy left join shop on shop.ID = expense.ShopID where expense.Status = 1 and expense.CompanyID = '${CompanyID}' and expense.Name like '%${Body.searchQuery}%' OR expense.Status = 1 and expense.CompanyID = '${CompanyID}' and expense.Category like '%${Body.searchQuery}%' `


            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            // connection.release()
            res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },

}