const createError = require('http-errors')
const mysql2 = require('../database')

module.exports = {
    fetchSupplier: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { newId, oldId } = req.body;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = 0;

            const [datum] = await mysql2.old_pool.query(`select * from Supplier where CompanyID = ${oldId}`)

            if (datum) {
                for (const data of datum) {

                    const fetchNew = await mysql2.pool.query(`select * from supplier where SystemID = '${oldId}-${data.ID}'`);

                    if (!fetchNew) {
                        const [save] = await mysql2.pool.query(`insert into supplier (SystemID,Sno,Name, CompanyID,  MobileNo1, MobileNo2 , PhoneNo, Address,GSTNo, Email,Website ,CINNo,Fax,PhotoURL,ContactPerson,Remark,GSTType,DOB,Anniversary, Status,CreatedBy,CreatedOn) values ('${oldId}-${data.ID}','${data.Sno}','${data.Name}', ${newId}, '${data.MobileNo1}', '${data.MobileNo2}', '${data.PhoneNo}','${data.Address}','${data.GSTNo}','${data.Email}','${data.Website}','${data.CINNo}','${data.Fax}','${data.PhotoURL}','${data.ContactPerson}','${data.Remark}','${data.GSTType}','${data.DOB}','${data.Anniversary}',${data.Status},${LoggedOnUser}, now())`)
                    }
                }

            }
            response.message = "supplier fetch sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    fetchShop: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { newId, oldId } = req.body;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = 0;

            const [datum] = await mysql2.old_pool.query(`select * from Shop where CompanyID = ${oldId}`)

            if (datum) {
                for (const data of datum) {

                    const fetchNew = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${data.ID}'`);

                    if (!fetchNew) {
                        const [save] = await mysql2.pool.query(`insert into shop (SystemID,Sno,CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,BillShopWise,RetailBill,WholesaleBill,BillName,AdminDiscount,WaterMark,ShopStatus ) values ('${oldId}-${data.ID}',${data.Sno},${newId},'${data.Name}', '${data.AreaName}', '${data.Address}', '${data.MobileNo1}','${data.MobileNo1}','${data.PhoneNo}','${data.Email}','${data.Website}','${data.GSTNo}','${data.CINNo}','${data.BarcodeName}','${data.Discount}','${data.GSTnumber}','${data.LogoURL}','${data.ShopTiming}','${data.WelcomeNote}',${data.Status},${LoggedOnUser}, now(),'${data.HSNCode}','${data.CustGSTNo}','${data.Rate}','${data.Discounts}','${data.Tax}','${data.SubTotal}','${data.Total}','${data.BillShopWise}','${data.RetailBill}','${data.WholesaleBill}','${data.BillName}','${data.AdminDiscount}','${data.WaterMark}',${data.ShopStatus})`)
                    }
                }

            }
            response.message = "shop fetch sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    fetchMaster: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { newId, oldId } = req.body;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = 0;

            const [datum] = await mysql2.old_pool.query(`select * from PurchaseMaster where CompanyID = ${oldId} and Status = 1 and PStatus = 1`)

            if (datum) {
                for (const data of datum) {

                    const fetchNew = await mysql2.pool.query(`select * from purchasemasternew where SystemID = '${oldId}-${data.ID}'`);

                    const [fetchNewSupp] = await mysql2.pool.query(`select * from supplier where SystemID = '${oldId}-${data.SupplierID}'`);

                    if (!fetchNewSupp) {
                        return res.send({ message: `Supplier Not Found From ID ${oldId}-${data.SupplierID}` })
                    }

                    const [fetchNewShop] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${data.ShopID}'`);

                    if (!fetchNewShop) {
                        return res.send({ message: `Shop Not Found From ID ${oldId}-${data.SupplierID}` })
                    }

                    if (!fetchNew) {

                        const [save] = await mysql2.pool.query(`insert into purchasemasternew(SystemID, SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values('${oldId}-${data.ID}',${fetchNewSupp[0].ID},${newId},${fetchNewShop[0].ID},'${data.PurchaseDate}','${data.PaymentStatus}','${data.InvoiceNo}','${data.GSTNo}',${data.Quantity},${data.SubTotal},${data.DiscountAmount},${data.GSTAmount},${data.TotalAmount},1,0,${data.DueAmount}, ${LoggedOnUser}, now())`);


                        const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${fetchNewSupp[0].ID}, ${newId}, ${fetchNewShop[0].ID}, 'Supplier','Debit',now(), 'Payment Initiated', '', '', ${data.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

                        const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${data.InvoiceNo}',${save.insertId},${fetchNewSupp[0].ID},${newId},0,${data.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)

                        const [savePaymentMaster1] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${fetchNewSupp[0].ID}, ${newId}, ${fetchNewShop[0].ID}, 'Supplier','Debit',now(), 'Old Software Payment', '', '', ${data.TotalAmount}, ${data.TotalAmount - data.DueAmount}, '',1,${LoggedOnUser}, now())`)

                        const [savePaymentDetail1] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster1.insertId},'${data.InvoiceNo}',${save.insertId},${fetchNewSupp[0].ID},${newId},${data.TotalAmount - data.DueAmount},${data.DueAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)
                    }
                }

            }
            response.message = "purchase master fetch sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
}
