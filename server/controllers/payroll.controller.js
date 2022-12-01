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
            if (Body.EmployeeID === null || Body.EmployeeID === undefined || !Body.EmployeeID) return res.send({ message: "Invalid Query Data" })

            doesExist = await connection.query(`select * from payroll where Status = 1 and EmployeeID=${Body.EmployeeID} and Month='${Body.Month}' and Year='${Body.Year}' and CompanyID=${CompanyID}`)

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

            let lastInvoiceID = await connection.query(`select * from payroll where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

            if (lastInvoiceID[0]?.InvoiceNo.substring(0, 4) !== newInvoiceID) {
                newInvoiceID = newInvoiceID + rw + "00001";
            } else {
                let temp3 = lastInvoiceID[0]?.InvoiceNo;
                let temp1 = parseInt(temp3.substring(10, 5)) + 1;
                let temp2 = "0000" + temp1;
                newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
            }

            datum.InvoiceNo = newInvoiceID;

            const saveData = await connection.query(`insert into payroll (CompanyID,  EmployeeID, Month, Year, LeaveDays,  Salary,  PaymentMode, Comments, Status, CreatedBy , CreatedOn,InvoiceNo,CashType ) values (${CompanyID}, ${datum.EmployeeID}, '${datum.Month}', '${datum.Year}', ${datum.LeaveDays}, ${datum.Salary}, '${datum.PaymentMode}', '${datum.Comments}', 1 , ${LoggedOnUser}, now(),'${datum.InvoiceNo}','${datum.CashType}')`)

            const paymentMaster = await connection.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${saveData.insertId}, ${CompanyID}, 0,'Employee','Debit',now(),'${datum.PaymentMode}','','',${datum.Salary},${datum.Salary},'${datum.Comments}',1, ${LoggedOnUser}, now())`)

            const paymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${datum.InvoiceNo}',${saveData.insertId},${saveData.insertId},${CompanyID},${datum.Salary},0,'Employee','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));
            response.message = "data save sucessfully"
            response.data = await connection.query(`select * from payroll where CompanyID = ${CompanyID} and Status = 1 order by ID desc`)
            connection.release()
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

            let qry = `select payroll.*, users2.Name as EmployeeName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from payroll left join user as users1 on users1.ID = payroll.CreatedBy left join user as users on users.ID = payroll.UpdatedBy left join user as users2 on users2.ID = payroll.EmployeeID where payroll.Status = 1 and payroll.CompanyID = '${CompanyID}'  order by payroll.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            connection.release()
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

            const doesExist = await connection.query(`select * from payroll where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "payroll doesnot exist from this id " })
            }


            const deletePayroll = await connection.query(`update payroll set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            const deletePaymentMaster = await connection.query(`update paymentmaster set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CustomerID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Employee'`)

            const deletePaymentDetail = await connection.query(`update paymentdetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where BillMasterID = ${Body.ID} and CompanyID = ${CompanyID} and PaymentType = 'Employee'`)

            console.log("Payroll Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            connection.release()
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

            const Payroll = await connection.query(`select * from payroll where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Payroll
            connection.release()
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

            const doesExist = await connection.query(`select * from payroll where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

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

            const update = await connection.query(`update payroll set EmployeeID=${datum.EmployeeID},Month='${datum.Month}', Year='${datum.Year}',LeaveDays=${datum.LeaveDays},Salary=${datum.Salary},PaymentMode='${datum.PaymentMode}',CashType='${datum.CashType}',Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)


            const updatePaymentMaster = await connection.query(`update paymentmaster set PaymentMode='${datum.PaymentMode}',PayableAmount=${datum.Salary},PaidAmount=${datum.Salary},Comments='${datum.Comments}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CustomerID=${Body.ID} and PaymentType = 'Employee' and CompanyID = ${CompanyID}`)

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount=${datum.Salary} where BillMasterID =${Body.ID} and PaymentType = 'Employee' and CompanyID = ${CompanyID}`)

            console.log("Payroll Updated SuccessFUlly !!!");

            response.message = "data update sucessfully"
            connection.release()
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

            let qry = `select payroll.*, users2.Name as EmployeeName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from payroll left join user as users1 on users1.ID = payroll.CreatedBy left join user as users on users.ID = payroll.UpdatedBy left join user as users2 on users2.ID = payroll.EmployeeID where payroll.Status = 1 and payroll.CompanyID = '${CompanyID}' and payroll.Month like '%${Body.searchQuery}%' OR payroll.Status = 1 and payroll.CompanyID = '${CompanyID}' and payroll.Year like '%${Body.searchQuery}%' OR payroll.Status = 1 and payroll.CompanyID = '${CompanyID}' and users2.Name like '%${Body.searchQuery}%'`


            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            connection.release()
            res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },
}