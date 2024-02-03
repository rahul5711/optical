const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const { generateBarcode, generateUniqueBarcode, doesExistProduct, shopID, gstDetail } = require('../helpers/helper_function')
module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            // if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
            //     return res.send({ message: "Invalid Query Data" })
            // }

            const [doesExist] = await mysql2.pool.query(`select * from supplier where Status = 1 and MobileNo1 = '${Body.MobileNo1}' and CompanyID = ${CompanyID}`)

            if (doesExist.length) {
                return res.send({ message: `supplier already exist from this number ${Body.MobileNo1}` })
            }

            if (Body.Name.trim() === 'PreOrder Supplier') {
                return res.send({ success: false, message: "you can not add this supplier, it is system generated supplier " })
            }


           const [dataCount] = await mysql2.pool.query(`select * from supplier where CompanyID = ${CompanyID}`)
            const sno = dataCount.length + 1

            const [saveData] = await mysql2.pool.query(`insert into supplier (Sno,Name, CompanyID,  MobileNo1, MobileNo2 , PhoneNo, Address,GSTNo, Email,Website ,CINNo,Fax,PhotoURL,ContactPerson,Remark,GSTType,DOB,Anniversary, Status,CreatedBy,CreatedOn) values ('${sno}','${Body.Name}', ${CompanyID}, '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}','${Body.Address}','${Body.GSTNo}','${Body.Email}','${Body.Website}','${Body.CINNo}','${Body.Fax}','${Body.PhotoURL}','${Body.ContactPerson}','${Body.Remark}','${Body.GSTType}','${Body.DOB}','${Body.Anniversary}',1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;
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

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const [doesExistSupplier] = await mysql2.pool.query(`select * from supplier where MobileNo1 = '${Body.MobileNo1}' and CompanyID = ${CompanyID} and Status = 1 and ID != ${Body.ID}`)

            if (doesExistSupplier.length) {
                return res.send({ message: `Supplier Already exist from this MobileNo1 ${Body.MobileNo1}` })
            }

            if (Body.Name.trim() === 'PreOrder Supplier') {
                return res.send({ success: false, message: "you can not add this supplier, it is system generated supplier " })
            }




            const [saveData] = await mysql2.pool.query(`update supplier set Name = '${Body.Name}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', GSTNo='${Body.GSTNo}', Email='${Body.Email}', Website='${Body.Website}', CINNo='${Body.CINNo}', Fax='${Body.Fax}', PhotoURL='${Body.PhotoURL}', ContactPerson='${Body.ContactPerson}', Remark='${Body.Remark}', DOB='${Body.DOB}',GSTType='${Body.GSTType}', Anniversary='${Body.Anniversary}',Status=1,UpdatedBy=${LoggedOnUser},UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Updated SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            //     const shopid = await shopID(req.headers)
            //   console.log(shopid,'shopid');
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select supplier.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from supplier left join user as users1 on users1.ID = supplier.CreatedBy left join user as users on users.ID = supplier.UpdatedBy where supplier.Status = 1 and supplier.CompanyID = '${CompanyID}'  order by supplier.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;


            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);;

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

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from supplier where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "supplier doesnot exist from this id " })
            }
            if (doesExist[0].Name === 'PreOrder Supplier') {
                return res.send({ success: false, message: "you can not delete this supplier, it is system generated supplier " })
            }


            const [doesPurchase] = await mysql2.pool.query(`select * from purchasemasternew where Status and CompanyID = ${CompanyID} and SupplierID = ${Body.ID}`)

            if (doesPurchase.length) {
                return res.send({ message: `You can't delete this supplier because you have inventory of this supplier` })
            }

            const [deleteSupplier] = await mysql2.pool.query(`update supplier set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Supplier Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            const [data] = await mysql2.pool.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            response.data = data
            return res.send(response);;

        } catch (err) {
            next(err)
        }
    },

    dropdownlist: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';


            let [data] = await mysql2.pool.query(`select ID, Name, MobileNo1,GSTType from supplier where Status = 1 and Name != 'PreOrder Supplier' and CompanyID = ${CompanyID}  order by ID desc limit 100`);
            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);;

        } catch (err) {
            next(err)
        }
    },

    dropdownlistForPreOrder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';


            let [data] = await mysql2.pool.query(`select * from supplier where Status = 1 and Name = 'PreOrder Supplier' and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);;

        } catch (err) {
            next(err)
        }
    },

    getSupplierById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [supplier] = await mysql2.pool.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = supplier
            return res.send(response);;

        } catch (err) {
            next(err)
        }
    },

    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select supplier.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from supplier left join user as users1 on users1.ID = supplier.CreatedBy left join user as users on users.ID = supplier.UpdatedBy where supplier.Status = 1 and supplier.CompanyID = '${CompanyID}' and supplier.Name like '%${Body.searchQuery}%' OR supplier.Status = 1 and supplier.CompanyID = '${CompanyID}' and supplier.MobileNo1 like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);;


        } catch (err) {
            next(err)
        }
    },
    saveVendorCredit: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            console.log(req.body);
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data1" })
            if (!Body.SupplierID) res.send({ message: "Invalid Query Data2" })
            if (!Body.ShopID) res.send({ message: "Invalid Query Data2" })
            if (!Body.CreditNumber) res.send({ message: "Invalid Query Data3" })
            if (!Body.Amount) res.send({ message: "Invalid Query Data4" })
            if (!Body.CreditDate) res.send({ message: "Invalid Query Data5" })
            console.table({ ...Body, shopid: shopid })
            const [doesCheckCn] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.CreditNumber.trim()}' and PaymentType = 'Vendor Credit' and Credit = 'Credit'`)

            if (doesCheckCn.length) {
                return res.send({ message: `Vendor Credit  Already exist from this CreditNumber ${Body.CreditNumber}` })
            }

            const [saveVendorCredit] = await mysql2.pool.query(`insert into vendorcredit(CompanyID, ShopID,SupplierID, CreditNumber, CreditDate, Amount, Remark, Is_Return, Status, CreatedBy, CreatedOn)values(${CompanyID}, ${Body.ShopID ? Body.ShopID : shopid}, ${Body.SupplierID}, '${Body.CreditNumber}', '${Body.CreditDate}', ${Body.Amount}, '${Body.Remark ? Body.Remark : `Amount Credited By CreditNumber ${Body.CreditNumber}`}', 0, 1, ${LoggedOnUser}, now())`)

            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${Body.SupplierID}, ${CompanyID}, ${Body.ShopID ? Body.ShopID : shopid}, 'Supplier','Credit',now(), 'Vendor Credit', '', '', ${Body.Amount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${Body.CreditNumber}',${saveVendorCredit.insertId},${Body.SupplierID},${CompanyID},${Body.Amount},0,'Vendor Credit','Credit',1,${LoggedOnUser}, now())`)

            console.log(connected("Vendor Credit Added SuccessFUlly !!!"));

            response.message = "vendor save sucessfully"
            return res.send(response);

        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    vendorCreditReport: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", calculation: [{
                "totalAmount": 0,
                "totalPaidAmount": 0,
                "totalBalance": 0
            }]}
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { Parem } = req.body

            let params = ``
            if (Parem !== undefined) {
                params = Parem
            }

            sumQry = `select SUM(Amount) as Amount, SUM(PaidAmount) as PaidAmount, ( SUM(Amount) - SUM(PaidAmount) ) as Balance from vendorcredit where vendorcredit.CompanyID = ${CompanyID}` + params;

            const [datum] = await mysql2.pool.query(sumQry);


            qry = `select vendorcredit.*, supplier.Name as SupplierName, shop.Name as ShopName, shop.AreaName from vendorcredit left join shop on shop.ID = vendorcredit.ShopID left join supplier on supplier.ID = vendorcredit.SupplierID where vendorcredit.CompanyID = ${CompanyID} ` + params;

            response.message = 'data fetch successfully'
            response.calculation[0].totalAmount = datum[0].Amount || 0
            response.calculation[0].totalPaidAmount = datum[0].PaidAmount || 0
            response.calculation[0].totalBalance = datum[0].Balance || 0

            const [data] = await mysql2.pool.query(qry)
            response.data = data

            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    }
}
