const createError = require('http-errors')
const mysql2 = require('../database')
const mysql = require('../olddb')
var moment = require("moment");
const { shopID, generateInvoiceNo, generateBillSno, generateCommission, updateCommission, generateBarcode, generatePreOrderProduct, generateUniqueBarcodePreOrder, gstDetailBill, generateUniqueBarcode, generateInvoiceNoForService } = require('../helpers/helper_function')
module.exports = {
    fetchSupplier: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from Supplier where CompanyID = ${oldId}`)

            if (datum) {
                for (const data of datum) {

                    const [fetchNew] = await mysql2.pool.query(`select * from supplier where SystemID = '${oldId}-${data.ID}'`);
                    if (!fetchNew.length) {
                        const [save] = await mysql2.pool.query(`insert into supplier (SystemID,Sno,Name, CompanyID,  MobileNo1, MobileNo2 , PhoneNo, Address,GSTNo, Email,Website ,CINNo,Fax,PhotoURL,ContactPerson,Remark,GSTType,DOB,Anniversary, Status,CreatedBy,CreatedOn) values ('${oldId}-${data.ID}','${data.Sno}','${data.Name}', ${newId}, '${data.MobileNo1}', '${data.MobileNo2}', '${data.PhoneNo}','${data.Address}','${data.GSTNo}','${data.Email}','${data.Website}','${data.CINNo}','${data.Fax}','${data.PhotoURL}','${data.ContactPerson}','${data.Remark}','','${data.DOB}','${data.Anniversary}',${data.Status},${LoggedOnUser}, '${data.CreatedOn}')`)
                    }
                }

            }
            response.message = "supplier fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchShop: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            const datum = await connection.query(`select * from Shop where CompanyID = ${oldId}`)

            if (datum) {
                for (const data of datum) {

                    const [fetchNew] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${data.ID}'`);

                    if (!fetchNew.length) {
                        const [save] = await mysql2.pool.query(`insert into shop (SystemID,Sno,CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,BillShopWise,RetailBill,WholesaleBill,BillName,AdminDiscount,WaterMark,ShopStatus ) values ('${oldId}-${data.ID}',${data.Sno},${newId},'${data.Name}', '${data.AreaName}', '${data.Address}', '${data.MobileNo1}','${data.MobileNo1}','${data.PhoneNo}','${data.Email}','${data.Website}','${data.GSTNo}','${data.CINNo}','${data.BarcodeName}','${data.Discount}','${data.GSTnumber}','${data.LogoURL}','${data.ShopTiming}','${data.WelcomeNote}',${data.Status},${LoggedOnUser}, '${data.CreatedOn}','${data.HSNCode}','${data.CustGSTNo}','${data.Rate}','${data.Discounts}','${data.Tax}','${data.SubTotal}','${data.Total}','${data.BillShopWise}','${data.RetailBill}','${data.WholesaleBill}','${data.BillName}','${data.AdminDiscount}','${data.WaterMark}',${data.ShopStatus})`)
                    }
                }

            }
            response.message = "shop fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchMaster: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            // console.log(req.user, 'user');
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            const datum = await connection.query(`select * from PurchaseMaster where CompanyID = ${oldId} and Status = 1`)

            if (datum) {
                for (let data of datum) {
                    const [fetchNew] = await mysql2.pool.query(`select * from purchasemasternew where SystemID = '${oldId}-${data.ID}' and CompanyID = ${newId}`);

                    const [fetchNewSupp] = await mysql2.pool.query(`select * from supplier where SystemID = '${oldId}-${data.SupplierID}'`);

                    if (!fetchNewSupp.length) {
                        return res.send({ message: `Supplier Not Found From ID ${oldId}-${data.SupplierID}` })
                    }

                    const [fetchNewShop] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${data.ShopID}'`);

                    if (!fetchNewShop.length) {
                        return res.send({ message: `Shop Not Found From ID ${oldId}-${data.ShopID}` })
                    }

                    if (!fetchNew.length) {

                        const [save] = await mysql2.pool.query(`insert into purchasemasternew(SystemID, SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values('${oldId}-${data.ID}',${fetchNewSupp[0].ID},${newId},${fetchNewShop[0].ID},'${moment(data.PurchaseDate).format('YYYY-MM-DD')}','${data.PaymentStatus}','${data.InvoiceNo}','${data.GSTNo}',${data.Quantity},${data.SubTotal},${data.DiscountAmount},${data.GSTAmount},${data.TotalAmount},1,${data.PStatus},${data.DueAmount}, ${LoggedOnUser}, '${data.CreatedOn}')`);


                        const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${fetchNewSupp[0].ID}, ${newId}, ${fetchNewShop[0].ID}, 'Supplier','Debit','${data.CreatedOn}', 'Payment Initiated', '', '', ${data.TotalAmount}, 0, '',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                        const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${data.InvoiceNo}',${save.insertId},${fetchNewSupp[0].ID},${newId},0,${data.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                        if (data.TotalAmount - data.DueAmount > 0) {
                            const [savePaymentMaster1] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${fetchNewSupp[0].ID}, ${newId}, ${fetchNewShop[0].ID}, 'Supplier','Debit','${data.CreatedOn}', 'Old Software Payment', '', '', ${data.TotalAmount}, ${data.TotalAmount - data.DueAmount}, '',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                            const [savePaymentDetail1] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster1.insertId},'${data.InvoiceNo}',${save.insertId},${fetchNewSupp[0].ID},${newId},${data.TotalAmount - data.DueAmount},${data.DueAmount ? data.DueAmount : 0},'Vendor','Debit',1,${LoggedOnUser}, '${data.CreatedOn}')`)
                        }

                    }
                }

            }
            response.message = "purchase master fetch sucessfully"
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    fetchPurchaseDetail: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            const datum = await connection.query(`select * from PurchaseDetail where CompanyID = ${oldId} and PurchaseID != '-1' and PurchaseID != '0' and Status = 1`)

            // console.log(datum);

            if (datum) {
                for (const item of datum) {
                   // console.log("item =================>", item);
                    const systemID = `${item.CompanyID}-${item.PurchaseID}`
                    let productTypeID = 0

                    if (item.ProductTypeID !== 0 && item.ProductTypeID !== undefined && item.ProductTypeID !== null) {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where CompanyID = ${newId} and SystemID = '${oldId}-${item.ProductTypeID}'`)

                        productTypeID = fetchProductTypeID[0].ID
                    } else {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where CompanyID = ${newId} and Name = '${data.ProductTypeName}'`)

                        if (fetchProductTypeID.length) {
                           // console.log("fetchProductTypeID", fetchProductTypeID);
                            productTypeID = fetchProductTypeID[0].ID
                        } else {
                            productTypeID = 0
                        }
                    }

                    const [fetch] = await mysql2.pool.query(`select * from purchasemasternew where CompanyID = ${newId} and SystemID = '${systemID}'`)


                    const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(SystemID,PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values('${systemID}',${fetch[0].ID},${newId},'${item.ProductName}',${productTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.MultipleBarCode},${item.WholeSale},'${Number(item.BaseBarCode) * 1000}',${item.Ledger},1,'${Number(item.BaseBarCode) * 1000}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${item.CreatedOn}')`)


                    //  save barcode

                    const createDate = item.CreatedOn

                    let [detailDataForBarCode] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and ID = ${savePurchaseDetail.insertId}`)

                    if (detailDataForBarCode.length) {
                        for (const item of detailDataForBarCode) {
                            const barcode = Number(item.BaseBarCode)
                            let count = 0;
                            count = item.Quantity;
                            for (j = 0; j < count; j++) {
                                const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(SystemID,CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, FitterStatus)values('${systemID}',${newId},${fetch[0].ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','${createDate}','Available', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '${createDate}', 'None')`)
                            }
                        }
                    }
                }
            }


            response.message = "purchase detail fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchBillMaster: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId, currentPage, itemsPerPage } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            // const datum = await connection.query(`select * from BillMaster where CompanyID = ${oldId} and Status = 1`)
            let qry = `select * from BillMaster where CompanyID = ${oldId} and Status = 1 and ID > 111166`
            // let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            // let finalQuery = qry + skipQuery;
            let datum = await connection.query(qry);
           // console.log(datum.length);
            if (datum) {
                for (const data of datum) {

                    // console.log("item=====>", data);
                    const [fetchNew] = await mysql2.pool.query(`select * from billmaster where SystemID = '${oldId}-${data.ID}' and CompanyID = ${newId}`);

                    const [fetchNewShop] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${data.ShopID}'`);

                    if (!fetchNewShop.length) {
                        return res.send({ message: `Shop Not Found From ID ${oldId}-${data.ShopID}` })
                    }

                    let [fetchNewCustomer] = await mysql2.pool.query(`select * from customer where SystemID = '${newId}-${data.CustomerID}' and CompanyID = ${newId}`);

                    if (!fetchNewCustomer.length) {

                        const customer_old_db = await connection.query(`select * from Customer where ID = ${data.CustomerID}`);
                        const cus = customer_old_db[0]

                        if (cus) {
                            for (const datum of customer_old_db) {

                                const [customerCount] = await mysql2.pool.query(`select * from customer where CompanyID = ${newId}`)

                                let Idd = customerCount.length

                                let Id = Idd + 1
                                datum.Idd = Id

                                let remark = datum.Remarks.toString().replace(/[\r\n]/gm, '');
                                let addr = datum.Address.toString().replace(/[\r\n]/gm, '');

                                const [customer] = await mysql2.pool.query(`insert into customer(SystemID,ShopID,Idd,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,RefferedByDoc,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Category,Status,CreatedBy,CreatedOn,VisitDate) values('${newId}-${datum.ID}',${fetchNewShop[0].ID},'${datum.Idd}', '${datum.Name}','${newId}-${datum.ID}',${newId},'${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${addr}','${datum.GSTNo}','${datum.Email}','${datum.PhotoURL}',${datum.DOB},'${datum.RefferedByDoc}','${datum.Age}',${datum.Anniversary},'${datum.ReferenceType}','${datum.Gender}','${datum.Other}',' ${remark.toString()} ','${datum.Category}',1,'${LoggedOnUser}','${datum.CreatedOn}',${datum.VisitDate})`);

                            }

                            [fetchNewCustomer] = await mysql2.pool.query(`select * from customer where SystemID = '${newId}-${data.CustomerID}' and CompanyID = ${newId}`);
                        } else {
                            return res.send({ message: `Customer Not Found From ID ${newId}-${data.CustomerID}` })
                        }


                    }



                    // if (!fetchNew.length) {
                    // save Bill master data

                    const systemID = `${data.CompanyID}-${data.ID}`

                    data.Sno = await generateBillSno(newId, fetchNewShop[0].ID)

                    const [checkMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${newId} and SystemID = '${systemID}'`)

                    if (!checkMaster.length) {


                        let [bMaster] = await mysql2.pool.query(
                            `insert into billmaster (SystemID,CustomerID,CompanyID, Sno,ShopID,BillDate, DeliveryDate,  PaymentStatus,InvoiceNo, GSTNo, Quantity, SubTotal, DiscountAmount, GSTAmount,AddlDiscount, TotalAmount, DueAmount, Status,CreatedBy,CreatedOn, LastUpdate, Doctor, TrayNo, Employee, BillType, RoundOff, AddlDiscountPercentage, ProductStatus) values ('${systemID}',${fetchNewCustomer[0].ID}, ${newId},'${data.Sno}', ${fetchNewShop[0].ID}, '${data.BillDate}','${data.DeliveryDate}', '${data.PaymentStatus}',  '${data.InvoiceNo}', '${data.GSTNo}', ${data.Quantity}, ${data.SubTotal}, ${data.DiscountAmount}, ${data.GSTAmount}, ${data.AddlDiscount}, ${data.TotalAmount - data.AddlDiscount}, ${data.DueAmount}, ${data.Status}, ${LoggedOnUser}, '${data.CreatedOn}' , '${data.CreatedOn}', 0, '${data.TrayNo}', ${LoggedOnUser}, 1, ${data.RoundOff ? Number(data.RoundOff) : 0}, ${data.AddlDiscountPercentage ? Number(data.AddlDiscountPercentage) : 0}, '${data.ProductStatus}')`
                        );


                        // payment inititated

                        const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${fetchNewCustomer[0].ID}, ${newId}, ${fetchNewShop[0].ID}, 'Customer','Credit','${data.CreatedOn}', 'Payment Initiated', '', '', ${data.TotalAmount - data.AddlDiscount}, 0, '',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                        const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${data.InvoiceNo}',${bMaster.insertId},${fetchNewCustomer[0].ID},${newId},0,${data.TotalAmount - data.AddlDiscount},'Customer','Credit',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                        if (data.TotalAmount - data.AddlDiscount - data.DueAmount > 0) {
                            const [savePaymentMaster1] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${fetchNewCustomer[0].ID}, ${newId}, ${fetchNewShop[0].ID}, 'Customer','Credit','${data.CreatedOn}', 'Old Software Payment', '', '', ${data.TotalAmount - data.AddlDiscount}, ${data.TotalAmount - data.AddlDiscount - data.DueAmount}, '',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                            const [savePaymentDetail1] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster1.insertId},'${data.InvoiceNo}',${bMaster.insertId},${fetchNewCustomer[0].ID},${newId},${data.TotalAmount - data.AddlDiscount - data.DueAmount},${data.DueAmount},'Customer','Credit',1,${LoggedOnUser}, '${data.CreatedOn}')`)

                        }

                    }



                    // }
                }

            }

            response.message = "billmaster fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchBillDetail: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            const datum = await connection.query(`select * from BillDetail where CompanyID = ${oldId}  and Status = 1 and Quantity != 0 AND ID < 2625 order by ID desc`)
            // for pre order not in ID 106542
            // and ID NOT IN (104105) and ID > 104105
            // for stock into manual convert
            // let dataa = []
            // if (datum) {
            //     for (let data of datum) {
            //         if (data.Manual === 0 && data.PreOrder === 0) {
            //             data.Manual = 1
            //         }
            //         dataa.push(data)
            //     }
            // }


            if (datum) {
                for (let data of datum) {
                   // console.log(data, "data");
                    if (data.MeasurementID === null || data.MeasurementID === undefined || data.MeasurementID === "null" || data.MeasurementID === "undefined") {
                        data.MeasurementID = ''
                    }
                    if (data.Option === null || data.Option === undefined || data.Option === "null" || data.Option === "undefined") {
                        data.Option = ''
                    }
                    if (data.Family === null || data.Family === undefined || data.Family === "null" || data.Family === "undefined") {
                        data.Family = ''
                    }
                    let billID = 0
                    let productTypeID = 0
                    let purchasePrice = 0
                    const systemID = `${data.CompanyID}-${data.ID}`
                    const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${newId} and SystemID = '${oldId}-${data.BillID}'`)



                    if (!fetchBillMaster.length) {

                       // console.log("Bill Master Not Found From ID ========>", data);
                        return res.send({ message: `Bill Master Not Found From ID ${oldId}-${data.BillID}`, query: `select * from billmaster where CompanyID = ${newId} and SystemID = '${oldId}-${data.BillID}'` })
                    }

                    billID = fetchBillMaster[0].ID

                    if (data.ProductTypeID !== 0 && data.ProductTypeID !== undefined && data.ProductTypeID !== null) {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where CompanyID = ${newId} and SystemID = '${oldId}-${data.ProductTypeID}'`)

                        productTypeID = fetchProductTypeID[0].ID
                    } else {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where Status = 1 and CompanyID = ${newId} and Name = '${data.ProductTypeName}'`)

                        if (fetchProductTypeID.length) {
                            productTypeID = fetchProductTypeID[0].ID
                        } else {
                            productTypeID = 0
                        }
                    }


                    if (data.Manual === 0 && data.PreOrder === 0) {
                        // stock

                        const [fetchPurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnew where CompanyID = ${newId} and BaseBarCode = '${data.Barcode}' limit 1`)

                        if (!fetchPurchaseDetail.length) {
                            // console.log("Purchase Detail Not Found From BaseBarCode ===>", data);
                            return res.send({ message: `Purchase Detail Not Found From BaseBarCode ${data.Barcode}` })
                        }

                        purchasePrice = fetchPurchaseDetail[0].RetailPrice

                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (SystemID,BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values ('${systemID}',${billID}, ${newId}, ${productTypeID},'${data.ProductTypeName}','${data.ProductName}', '${data.HSNCode}',${data.UnitPrice},${purchasePrice},${data.Quantity},${data.SubTotal}, ${data.DiscountPercentage},${data.DiscountAmount},${data.GSTPercentage},${data.GSTAmount},'${data.GSTType}',${data.TotalAmount},${data.WholeSale},0, 0, '${data.Barcode}' ,'${data.Barcode}',1,'${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', ${LoggedOnUser}, '${data.CreatedOn}' , 0 , '${data.Remark}', '${data.Warranty ? data.Warranty : ''}', '${data.ProductExpDate}')`
                        );

                        const bMasterID = result.insertId;
                        let [detailDataForBarCode] = await mysql2.pool.query(
                            `select * from billdetail where ID = ${bMasterID} and CompanyID = ${newId} order by ID desc`
                        );

                       // console.log(detailDataForBarCode[0], "detailDataForBarCode[0]", `select * from billdetail where BillID = ${bMasterID} and CompanyID = ${newId}`);

                        let [selectRows1] = await mysql2.pool.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${newId} AND ShopID = ${fetchBillMaster[0].ShopID} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${detailDataForBarCode[0].Barcode}' LIMIT ${detailDataForBarCode[0].Quantity}`);
                        for (const ele1 of selectRows1) {
                            let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${data.MeasurementID}', Family = '${data.Family}',Optionsss = '${data.Optionsss}', BillDetailID = ${bMasterID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${data.CreatedOn}' Where ID = ${ele1.ID}`);
                        }
                        // await Promise.all(
                        //     selectRows1.map(async (ele1) => {
                        //         let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${data.MeasurementID}', Family = '${data.Family}',Optionsss = '${data.Optionsss}', BillDetailID = ${bMasterID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${data.CreatedOn}' Where ID = ${ele1.ID}`);
                        //     })
                        // );

                    } else if (data.Manual === 0 && data.PreOrder === 1) {
                        // stock

                        const [fetchPurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnew where CompanyID = ${newId} and BaseBarCode = '${data.Barcode}' limit 1`)

                        if (!fetchPurchaseDetail.length) {
                            // console.log("Purchase Detail Not Found From BaseBarCode ===>", data);
                            return res.send({ message: `Purchase Detail Not Found From BaseBarCode ${data.Barcode}` })
                        }

                        purchasePrice = fetchPurchaseDetail[0].RetailPrice

                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (SystemID,BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values ('${systemID}',${billID}, ${newId}, ${productTypeID},'${data.ProductTypeName}','${data.ProductName}', '${data.HSNCode}',${data.UnitPrice},${purchasePrice},${data.Quantity},${data.SubTotal}, ${data.DiscountPercentage},${data.DiscountAmount},${data.GSTPercentage},${data.GSTAmount},'${data.GSTType}',${data.TotalAmount},${data.WholeSale},0, 1, '${data.Barcode}' ,'${data.Barcode}',1,'${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', ${LoggedOnUser}, '${data.CreatedOn}' , 0 , '${data.Remark}', '${data.Warranty ? data.Warranty : ''}', '${data.ProductExpDate}')`
                        );

                        const bMasterID = result.insertId;
                        let [detailDataForBarCode] = await mysql2.pool.query(
                            `select * from billdetail where ID = ${bMasterID} and CompanyID = ${newId} order by ID desc`
                        );

                        // console.log(detailDataForBarCode[0], "detailDataForBarCode[0]", `select * from billdetail where BillID = ${bMasterID} and CompanyID = ${newId}`);

                        let [selectRows1] = await mysql2.pool.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${newId} AND ShopID = ${fetchBillMaster[0].ShopID} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${detailDataForBarCode[0].Barcode}' LIMIT ${detailDataForBarCode[0].Quantity}`);
                        for (const ele1 of selectRows1) {
                            let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${data.MeasurementID}', Family = '${data.Family}',Optionsss = '${data.Optionsss}', BillDetailID = ${bMasterID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${data.CreatedOn}' Where ID = ${ele1.ID}`);
                        }
                        // await Promise.all(
                        //     selectRows1.map(async (ele1) => {
                        //         let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${data.MeasurementID}', Family = '${data.Family}',Optionsss = '${data.Optionsss}', BillDetailID = ${bMasterID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${data.CreatedOn}' Where ID = ${ele1.ID}`);
                        //     })
                        // );

                    } else if (data.Manual === 1 && data.PreOrder === 0) {
                        // manual
                        purchasePrice = 0

                        data.BaseBarCode = await generateBarcode(newId, 'MB')
                        data.Barcode = Number(data.BaseBarCode)
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (SystemID,BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values ('${systemID}',${billID}, ${newId}, ${productTypeID},'${data.ProductTypeName}','${data.ProductName}', '${data.HSNCode}',${data.UnitPrice},${purchasePrice},${data.Quantity},${data.SubTotal}, ${data.DiscountPercentage},${data.DiscountAmount},${data.GSTPercentage},${data.GSTAmount},'${data.GSTType}',${data.TotalAmount},${data.WholeSale},1, 0, '${data.BaseBarCode}' ,'${data.Barcode}',1,'${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', ${LoggedOnUser}, '${data.CreatedOn}' , 0, '${data.Remark ? data.Remark : ''}', '${data.Warranty ? data.Warranty : ''}', '${data.ProductExpDate}')`
                        );


                        const bMasterID = result.insertId;
                        let [detailDataForBarCode] = await mysql2.pool.query(
                            `select * from billdetail where ID = ${bMasterID} and CompanyID = ${newId} order by ID desc`
                        );

                        // console.log("detailDataForBarCode =======>", detailDataForBarCode);

                        let count = detailDataForBarCode[0].Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            let systemID = `${data.CompanyID}-${bMasterID}`
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (SystemID,CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop, FitterStatus) VALUES ('${systemID}',${newId}, ${fetchBillMaster[0].ShopID},${bMasterID},${data.BaseBarCode}, 'Not Available','${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', 1,${LoggedOnUser}, '${data.CreatedOn}' , '${data.CreatedOn}', '${detailDataForBarCode[0].GSTType}',${detailDataForBarCode[0].GSTPercentage}, 0, 0, 0, 0, ${detailDataForBarCode[0].WholeSale}, 0,0,0,'',0, 'None')`);
                        }

                    }

                }

            }

            response.message = "bill detail fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchBillDetailPreOrder: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            const datum = await connection.query(`select * from BillDetail where CompanyID = ${oldId} and PreOrder = 1 and Manual = 0 and Status = 1 and Quantity != 0`)

           // console.log(datum);

            if (datum) {
                for (let data of datum) {

                    if (data.MeasurementID === null || data.MeasurementID === undefined || data.MeasurementID === "null" || data.MeasurementID === "undefined") {
                        data.MeasurementID = ''
                    }
                    if (data.Option === null || data.Option === undefined || data.Option === "null" || data.Option === "undefined") {
                        data.Option = ''
                    }
                    if (data.Family === null || data.Family === undefined || data.Family === "null" || data.Family === "undefined") {
                        data.Family = ''
                    }
                    let billID = 0
                    let productTypeID = 0
                    let purchasePrice = 0
                    const systemID = `${data.CompanyID}-${data.BillID}`
                    const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${newId} and SystemID = '${oldId}-${data.BillID}'`)

                    if (!fetchBillMaster.length) {
                        // console.log("Bill Master Not Found From ID ========>", data);
                        return res.send({ message: `Bill Master Not Found From ID ${oldId}-${data.BillID}` })
                    }

                    billID = fetchBillMaster[0].ID

                    if (data.ProductTypeID !== 0 && data.ProductTypeID !== undefined && data.ProductTypeID !== null) {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where CompanyID = ${newId} and SystemID = '${oldId}-${data.ProductTypeID}'`)

                        productTypeID = fetchProductTypeID[0].ID
                    } else {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where Status = 1 and CompanyID = ${newId} and Name = '${data.ProductTypeName}'`)

                        if (fetchProductTypeID.length) {
                            // console.log("fetchProductTypeID", fetchProductTypeID);
                            productTypeID = fetchProductTypeID[0].ID
                        } else {
                            productTypeID = 0
                        }
                    }


                    if (data.Manual === 0 && data.PreOrder === 1) {
                        data.Manual = 1
                        data.PreOrder = 0
                        // manual
                        purchasePrice = 0

                        data.BaseBarCode = await generateBarcode(newId, 'MB')
                        data.Barcode = Number(data.BaseBarCode)
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (SystemID,BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values ('${systemID}',${billID}, ${newId}, ${productTypeID},'${data.ProductTypeName}','${data.ProductName}', '${data.HSNCode}',${data.UnitPrice},${purchasePrice},${data.Quantity},${data.SubTotal}, ${data.DiscountPercentage},${data.DiscountAmount},${data.GSTPercentage},${data.GSTAmount},'${data.GSTType}',${data.TotalAmount},${data.WholeSale},1, 0, '${data.BaseBarCode}' ,'${data.Barcode}',1,'${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', ${LoggedOnUser}, '${data.CreatedOn}' , 0, '${data.Remark ? data.Remark : ''}', '${data.Warranty ? data.Warranty : ''}', '${data.ProductExpDate}')`
                        );


                        const bMasterID = result.insertId;
                        let [detailDataForBarCode] = await mysql2.pool.query(
                            `select * from billdetail where ID = ${bMasterID} and CompanyID = ${newId}`
                        );

                       // console.log("detailDataForBarCode =======>", detailDataForBarCode);

                        let count = detailDataForBarCode[0].Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            let systemID = `${data.CompanyID}-${bMasterID}`
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (SystemID,CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop, FitterStatus) VALUES ('${systemID}',${newId}, ${fetchBillMaster[0].ShopID},${bMasterID},${data.BaseBarCode}, 'Not Available','${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', 1,${LoggedOnUser}, '${data.CreatedOn}' , '${data.CreatedOn}', '${detailDataForBarCode[0].GSTType}',${detailDataForBarCode[0].GSTPercentage}, 0, 0, 0, 0, ${detailDataForBarCode[0].WholeSale}, 0,0,0,'',0, 'None')`);
                        }

                    }

                }

            }

            response.message = "bill detail fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchBillDetailManual: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            const datum = await connection.query(`select * from BillDetail left join BillMaster on BillMaster.ID = BillDetail.BillID where BillDetail.CompanyID = ${oldId} and BillDetail.PreOrder = 0 AND BillDetail.Manual = 1 and BillDetail.Status = 1 and BillDetail.Quantity != 0 and BillMaster.ShopID != 112 and BillMaster.ShopID != 113`)

           // console.log(datum);

            if (datum) {
                for (let data of datum) {

                    if (data.MeasurementID === null || data.MeasurementID === undefined || data.MeasurementID === "null" || data.MeasurementID === "undefined") {
                        data.MeasurementID = ''
                    }
                    if (data.Option === null || data.Option === undefined || data.Option === "null" || data.Option === "undefined") {
                        data.Option = ''
                    }
                    if (data.Family === null || data.Family === undefined || data.Family === "null" || data.Family === "undefined") {
                        data.Family = ''
                    }
                    let billID = 0
                    let productTypeID = 0
                    let purchasePrice = 0
                    const systemID = `${data.CompanyID}-${data.BillID}`
                    const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${newId} and SystemID = '${oldId}-${data.BillID}'`)

                    if (!fetchBillMaster.length) {
                        // console.log("Bill Master Not Found From ID ========>", data);
                        return res.send({ message: `Bill Master Not Found From ID ${oldId}-${data.BillID}` })
                    }

                    billID = fetchBillMaster[0].ID

                    if (data.ProductTypeID !== 0 && data.ProductTypeID !== undefined && data.ProductTypeID !== null) {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where CompanyID = ${newId} and SystemID = '${oldId}-${data.ProductTypeID}'`)

                        productTypeID = fetchProductTypeID[0].ID
                    } else {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where Status = 1 and CompanyID = ${newId} and Name = '${data.ProductTypeName}'`)

                        if (fetchProductTypeID.length) {
                            // console.log("fetchProductTypeID", fetchProductTypeID);
                            productTypeID = fetchProductTypeID[0].ID
                        } else {
                            productTypeID = 0
                        }
                    }


                    if (data.Manual === 1) {
                        data.Manual = 1
                        data.PreOrder = 0
                        // manual
                        purchasePrice = 0

                        data.BaseBarCode = await generateBarcode(newId, 'MB')
                        data.Barcode = Number(data.BaseBarCode)
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (SystemID,BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values ('${systemID}',${billID}, ${newId}, ${productTypeID},'${data.ProductTypeName}','${data.ProductName}', '${data.HSNCode}',${data.UnitPrice},${purchasePrice},${data.Quantity},${data.SubTotal}, ${data.DiscountPercentage},${data.DiscountAmount},${data.GSTPercentage},${data.GSTAmount},'${data.GSTType}',${data.TotalAmount},${data.WholeSale},1, 0, '${data.BaseBarCode}' ,'${data.Barcode}',1,'${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', ${LoggedOnUser}, '${data.CreatedOn}' , 0, '${data.Remark ? data.Remark : ''}', '${data.Warranty ? data.Warranty : ''}', '${data.ProductExpDate}')`
                        );


                        const bMasterID = result.insertId;

                        let [detailDataForBarCode] = await mysql2.pool.query(
                            `select * from billdetail where ID = ${bMasterID} and CompanyID = ${newId}`
                        );

                        // console.log("detailDataForBarCode =======>", detailDataForBarCode);

                        let count = detailDataForBarCode[0].Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            let systemID = `${data.CompanyID}-${bMasterID}`
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (SystemID,CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop, FitterStatus) VALUES ('${systemID}',${newId}, ${fetchBillMaster[0].ShopID},${bMasterID},${data.BaseBarCode}, 'Not Available','${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', 1,${LoggedOnUser}, '${data.CreatedOn}' , '${data.CreatedOn}', '${detailDataForBarCode[0].GSTType}',${detailDataForBarCode[0].GSTPercentage}, 0, 0, 0, 0, ${detailDataForBarCode[0].WholeSale}, 0,0,0,'',0, 'None')`);
                        }
                    }



                }

            }

            response.message = "bill detail fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchBillDetailStock: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;


            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })
            const datum = await connection.query(`select * from BillDetail left join BillMaster on BillMaster.ID = BillDetail.BillID where BillDetail.CompanyID = ${oldId} and BillDetail.PreOrder = 0 AND  BillDetail.Manual = 0  and BillDetail.Status = 1 and BillDetail.Quantity != 0 and BillMaster.ShopID != 112 and BillMaster.ShopID != 113`)

           // console.log(datum);

            if (datum) {
                for (let data of datum) {

                    if (data.MeasurementID === null || data.MeasurementID === undefined || data.MeasurementID === "null" || data.MeasurementID === "undefined") {
                        data.MeasurementID = ''
                    }
                    if (data.Option === null || data.Option === undefined || data.Option === "null" || data.Option === "undefined") {
                        data.Option = ''
                    }
                    if (data.Family === null || data.Family === undefined || data.Family === "null" || data.Family === "undefined") {
                        data.Family = ''
                    }
                    let billID = 0
                    let productTypeID = 0
                    let purchasePrice = 0
                    const systemID = `${data.CompanyID}-${data.BillID}`
                    const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${newId} and SystemID = '${oldId}-${data.BillID}'`)

                    if (!fetchBillMaster.length) {
                        // console.log("Bill Master Not Found From ID ========>", data);
                        return res.send({ message: `Bill Master Not Found From ID ${oldId}-${data.BillID}` })
                    }

                    billID = fetchBillMaster[0].ID

                    if (data.ProductTypeID !== 0 && data.ProductTypeID !== undefined && data.ProductTypeID !== null) {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where CompanyID = ${newId} and SystemID = '${oldId}-${data.ProductTypeID}'`)

                        productTypeID = fetchProductTypeID[0].ID
                    } else {
                        const [fetchProductTypeID] = await mysql2.pool.query(`select * from product where Status = 1 and CompanyID = ${newId} and Name = '${data.ProductTypeName}'`)

                        if (fetchProductTypeID.length) {
                           // console.log("fetchProductTypeID", fetchProductTypeID);
                            productTypeID = fetchProductTypeID[0].ID
                        } else {
                            productTypeID = 0
                        }
                    }


                    if (data.Manual === 0 && data.PreOrder === 0) {
                        data.Manual = 1
                        data.PreOrder = 0
                        // manual
                        purchasePrice = 0

                        data.BaseBarCode = await generateBarcode(newId, 'MB')
                        data.Barcode = Number(data.BaseBarCode)
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (SystemID,BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values ('${systemID}',${billID}, ${newId}, ${productTypeID},'${data.ProductTypeName}','${data.ProductName}', '${data.HSNCode}',${data.UnitPrice},${purchasePrice},${data.Quantity},${data.SubTotal}, ${data.DiscountPercentage},${data.DiscountAmount},${data.GSTPercentage},${data.GSTAmount},'${data.GSTType}',${data.TotalAmount},${data.WholeSale},1, 0, '${data.BaseBarCode}' ,'${data.Barcode}',1,'${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', ${LoggedOnUser}, '${data.CreatedOn}' , 0, '${data.Remark ? data.Remark : ''}', '${data.Warranty ? data.Warranty : ''}', '${data.ProductExpDate}')`
                        );


                        const bMasterID = result.insertId;
                        let [detailDataForBarCode] = await mysql2.pool.query(
                            `select * from billdetail where BillID = ${billID} and CompanyID = ${newId}`
                        );

                        // console.log("detailDataForBarCode =======>", detailDataForBarCode);

                        let count = detailDataForBarCode[0].Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            let systemID = `${data.CompanyID}-${bMasterID}`
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (SystemID,CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop, FitterStatus) VALUES ('${systemID}',${newId}, ${fetchBillMaster[0].ShopID},${bMasterID},${data.BaseBarCode}, 'Not Available','${data.MeasurementID ? data.MeasurementID : ''}','${data.Option ? data.Option : ''}','${data.Family ? data.Family : ''}', 1,${LoggedOnUser}, '${data.CreatedOn}' , '${data.CreatedOn}', '${detailDataForBarCode[0].GSTType}',${detailDataForBarCode[0].GSTPercentage}, 0, 0, 0, 0, ${detailDataForBarCode[0].WholeSale}, 0,0,0,'',0, 'None')`);
                        }

                    }

                }

            }

            response.message = "bill detail fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchChargeMaster: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;
            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            newId = CompanyID;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from ChargerMaster where CompanyID = ${oldId}`)

            if (datum) {
                for (const Body of datum) {
                    const [saveData] = await mysql2.pool.query(`insert into chargermaster (SystemID,CompanyID, Name, Description, Price,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values ('${oldId}-${Body.ID}',${newId},'${Body.Name}','${Body.Description}', ${Body.Price}, ${Body.GSTPercentage},${Body.GSTAmount},'${Body.GSTType}',${Body.TotalAmount}, ${Body.Status}, ${LoggedOnUser}, '${Body.CreatedOn}')`)
                }

            }
            response.message = "charge master fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    saveChargeMaster: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;

            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }



            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from PurchaseCharge where CompanyID = ${oldId} and Status = 1`)

            if (datum) {
                for (const item of datum) {
                    const systemID = `${item.CompanyID}-${item.ID}`

                    const [fetch] = await mysql2.pool.query(`select * from purchasemasternew where CompanyID = ${newId} and SystemID = '${item.CompanyID}-${item.PurchaseID}'`)

                    if (!fetch.length) {
                        return res.send({ success: false, message: `purchase master not found from '${item.CompanyID}'-'${item.PurchaseID}'` })
                    }

                    const [fetchChargeType] = await mysql2.pool.query(`select * from chargermaster where CompanyID = ${newId} and SystemID = '${item.CompanyID}-${item.ChargeType}'`)

                    if (!fetchChargeType.length) {
                        return res.send({ success: false, message: `charge master not found from '${item.CompanyID}'-'${item.ChargeType}'` })
                    }

                    const [saveCharge] = await mysql2.pool.query(`insert into purchasecharge (SystemID,PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values ('${oldId}-${item.ID}',${fetch[0].ID}, '${fetchChargeType[0].ID}', ${CompanyID}, '${item.Description}', ${item.Amount}, ${item.GSTPercentage}, ${item.GSTAmount}, '${item.GSTType}', ${item.TotalAmount},${item.Status}, ${LoggedOnUser}, '${item.CreatedOn}')`)
                }

            }
            response.message = "purchase charge save sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchServiceMaster: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;

            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            newId = CompanyID;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from ServiceMaster where CompanyID = ${oldId}`)

            if (datum) {
                for (const Body of datum) {
                    const [saveData] = await mysql2.pool.query(`insert into servicemaster (SystemID, CompanyID, Name, Description,Cost, Price, SubTotal,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values ('${oldId}-${Body.ID}',${newId},'${Body.Name}','${Body.Description}', ${Body.Cost},${Body.Price},${Body.TotalAmount},${Body.GSTPercentage},${Body.GSTAmount},'${Body.GSTType}',${Body.TotalAmount},${Body.Status}, ${LoggedOnUser}, '${Body.CreatedOn}')`)
                }

            }
            response.message = "service master fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    saveServiceMaster: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;

            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from BillService where CompanyID = ${oldId} and Status = 1`)

            if (datum) {
                for (const item of datum) {
                    let servicetype = item.ServiceType == null ? 0 : item.ServiceType;
                    const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${newId} and SystemID = '${oldId}-${item.BillID}'`)

                    if (!fetchBillMaster.length) {
                       // console.log("Bill Master Not Found From ID ========>", item);
                        return res.send({ message: `Bill Master Not Found From ID ${oldId}-${item.BillID}` })
                    }

                    let fetchServiceType = []
                    if (servicetype !== 0 && servicetype !== null && servicetype !== 'null') {
                        [fetchServiceType] = await mysql2.pool.query(`select * from servicemaster where Status = 1 and CompanyID = ${newId} and SystemID = '${item.CompanyID}-${servicetype}'`)

                        if (!fetchServiceType.length) {
                            return res.send({ message: `Service Master Not Found From ID '${item.CompanyID}'-'${servicetype}'` })
                        }
                    }

                    // save
                    let [result1] = await mysql2.pool.query(
                        `insert into billservice (SystemID, BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values ('${oldId}-${item.ID}',${fetchBillMaster[0].ID}, '${fetchServiceType[0]?.ID ? fetchServiceType[0]?.ID : 0}', ${CompanyID},  '${item.Description}', ${item.Price},  ${item.TotalAmount}, ${item.GSTPercentage}, ${item.GSTAmount}, '${item.GSTType}', ${item.TotalAmount},${item.Status},${LoggedOnUser}, '${item.CreatedOn}')`
                    );
                }

            }
            response.message = "bill service save sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    saveTransferMaster: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;

            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            newId = CompanyID;
            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })
            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from TransferMaster where CompanyID = ${oldId}`)

            if (datum) {
                for (const item of datum) {

                    const [fetchTransferToShop] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${item.TransferToShop}'`);

                    if (!fetchTransferToShop.length) {
                        return res.send({ message: `Shop Not Found From ID ${oldId}-${item.TransferToShop}` })
                    }
                    const [fetchTransferFromShop] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${item.TransferFromShop}'`);

                    if (!fetchTransferFromShop.length) {
                        return res.send({ message: `Shop Not Found From ID ${oldId}-${item.TransferFromShop}` })
                    }

                    let qry = `insert into transfermaster (SystemID, CompanyID, ProductName, BarCode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop, AcceptanceCode, DateStarted, TransferStatus, CreatedBy, CreatedOn) values ('${oldId}-${item.ID}',${CompanyID}, '${item.ProductName}', '${item.BarCode}', ${item.BarCodeCount}, ${item.TransferCount},  '${item.Remark == undefined ? '' : item.Remark}',  ${fetchTransferToShop[0].ID},${fetchTransferFromShop[0].ID}, '${item.AcceptanceCode}','${item.DateStarted}' ,  '${item.TransferStatus}',${LoggedOnUser}, '${item.CreatedOn}')`;
                    let [xferData] = await mysql2.pool.query(qry);
                    let xferID = xferData.insertId;
                    let [selectedRows] = await mysql2.pool.query(
                        `SELECT ID FROM barcodemasternew WHERE CurrentStatus = "Available" AND ShopID = ${fetchTransferFromShop[0].ID} AND Barcode = '${item.BarCode}' AND PreOrder = '0' and CompanyID ='${CompanyID}' LIMIT ${item.TransferCount}`
                    );

                    await Promise.all(
                        selectedRows.map(async (ele) => {
                            if (item.TransferStatus === 'Transfer Initiated') {
                                await mysql2.pool.query(
                                    `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Transfer Pending', TransferStatus = 'Transfer Pending', TransferToShop=${fetchTransferToShop[0].ID}, UpdatedBy = ${LoggedOnUser}, updatedOn = '${item.UpdatedOn}' WHERE ID = ${ele.ID}`
                                );
                            }

                            if (item.TransferStatus === 'Transfer Completed') {
                                await mysql2.pool.query(
                                    `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Available', TransferStatus = 'Available', TransferToShop=${fetchTransferToShop[0].ID}, ShopID=${fetchTransferToShop[0].ID}, UpdatedBy = ${LoggedOnUser}, updatedOn = '${item.UpdatedOn}' WHERE ID = ${ele.ID}`
                                );
                            }


                        })
                    );

                }

            }
            response.message = "product Transfer save sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    fetchExpense: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { newId, oldId } = req.body;

            if (!oldId || oldId === undefined || oldId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            newId = CompanyID;

            if (!newId || newId === undefined || newId === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (!LoggedOnUser || LoggedOnUser === 0 || LoggedOnUser === undefined) return res.send({ message: "Invalid LoggedOnUser Data" })

            const datum = await connection.query(`select * from Expense where Status = 1 and CompanyID = ${oldId}`)
            if (datum) {
                for (let item of datum) {
                    item.ShopID = item.ShopID !== 'null' ? item.ShopID : 0
                    item.InvoiceNo = item.InvoiceNo !== 'null' ? item.InvoiceNo : ''
                    item.SubCategory = item.SubCategory !== 'null' ? item.SubCategory : ''
                    item.PaymentRefereceNo = item.PaymentRefereceNo !== 'null' ? item.PaymentRefereceNo : ''
                    item.Comments = item.Comments !== 'null' ? item.Comments : ''
                    item.CashType = item.CashType !== 'undefined' ? item.CashType : 'CashCounter'

                    let shopId = 0

                    const [fetchNewShop] = await mysql2.pool.query(`select * from shop where SystemID = '${oldId}-${item.ShopID}'`);

                    if (!fetchNewShop.length) {
                        shopId = 0
                    }
                    shopId = fetchNewShop[0]?.ID ? fetchNewShop[0]?.ID : 0

                    if (item.InvoiceNo === '') {
                        var newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
                        let rw = "E";

                        let [lastInvoiceID] = await mysql2.pool.query(`select * from expense where CompanyID = ${CompanyID} and InvoiceNo LIKE '${newInvoiceID}%' order by ID desc`);

                        if (lastInvoiceID[0]?.InvoiceNo.substring(0, 4) !== newInvoiceID) {
                            newInvoiceID = newInvoiceID + rw + "00001";
                        } else {
                            let temp3 = lastInvoiceID[0]?.InvoiceNo;
                            let temp1 = parseInt(temp3.substring(10, 5)) + 1;
                            let temp2 = "0000" + temp1;
                            newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
                        }

                        item.InvoiceNo = newInvoiceID

                    }
                    const [saveData] = await mysql2.pool.query(`insert into expense (CompanyID,  ShopID, Name, Category, InvoiceNo, SubCategory,  Amount,  PaymentMode, CashType,  PaymentRefereceNo, Comments, ExpenseDate, Status, CreatedBy , CreatedOn ) values (${CompanyID}, '${shopId}', '${item.Name}', '${item.Category}', '${item.InvoiceNo}', '${item.SubCategory}', ${item.Amount}, '${item.PaymentMode}', '${item.CashType}', '${item.PaymentRefereceNo}','${item.Comments}','${item.CreatedOn}', 1 , ${LoggedOnUser}, '${item.CreatedOn}')`)

                    const [paymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID,CompanyID,ShopID,PaymentType,CreditType,PaymentDate,PaymentMode,CardNo,PaymentReferenceNo,PayableAmount,PaidAmount,Comments,Status,CreatedBy,CreatedOn) values (${saveData.insertId}, ${CompanyID}, ${shopId},'Expense','Debit','${item.CreatedOn}','${item.PaymentMode}','','${item.PaymentRefereceNo}',${item.Amount},${item.Amount},'${item.Comments}',1, ${LoggedOnUser}, '${item.CreatedOn}')`)

                    const [paymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn) values (${paymentMaster.insertId},'${item.InvoiceNo}',${saveData.insertId},${saveData.insertId},${CompanyID},${item.Amount},0,'Expense','Debit',1,${LoggedOnUser}, '${item.CreatedOn}')`)
                }
            }
            response.message = "expense fetch sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    chcekPhysicalStock: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { CompanyID } = req.body;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            const [datum] = await mysql2.pool.query(`select * from billdetail where Status = 1 and PreOrder = 0 and Manual = 0 and CompanyID = ${CompanyID}`)

           // console.log(datum.length);
            let qty = 0
            if (datum) {
                for (let item of datum) {
                    const [fetch] = await mysql2.pool.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and BillDetailID = ${item.ID}`)
                    if (!fetch.length) {
                        qty = qty + item.Quantity
                        let formattedDate = moment(item.CreatedOn).format('YYYY-MM-DD HH:mm:ss');

                        const [fetchBillMaster] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${CompanyID} and ID = ${item.BillID}`)

                        if (!fetchBillMaster.length) {
                            // console.log("Bill Master Not Found From ID ========>", item.BillID);
                            return res.send({ message: `Bill Master Not Found From ID ${item.BillID}` })
                        }

                        const cusId = fetchBillMaster[0].CustomerID
                        let measurement = []
                        if (item.ProductName.toUpperCase() !== 'CONTACT LENS') {
                           const [measure] = await mysql2.pool.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${cusId} order by ID desc LIMIT 1`)


                           if (measure.length) {
                            measurement = measure || []
                           }
                        } else {
                            const [measure] = await mysql2.pool.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${cusId} order by ID desc LIMIT 1`)

                            if (measure.length) {
                             measurement = measure || []
                            }
                        }

                        // console.log(qty);
                        // console.log(item.ID);

                        // console.log(`update barcodemasternew set BillDetailID = ${item.ID}, CurrentStatus = 'Sold', UpdatedOn = '${formattedDate}', MeasurementID='${JSON.stringify(measurement)}' where CompanyID = ${CompanyID} AND Barcode = '${item.Barcode}' and ShopID = ${fetchBillMaster[0].ShopID} and CurrentStatus = 'Available' Limit ${item.Quantity}`);

                        const [update] = await mysql2.pool.query(`update barcodemasternew set BillDetailID = ${item.ID}, CurrentStatus = 'Sold', UpdatedOn = '${formattedDate}', MeasurementID='${JSON.stringify(measurement)}' where CompanyID = ${CompanyID} AND Barcode = '${item.Barcode}' and ShopID = ${fetchBillMaster[0].ShopID} and CurrentStatus = 'Available' Limit ${item.Quantity}`)
                    }


                }
            }
            response.message = "update sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    deleteBarcodeByPurchaseDetail: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { CompanyID } = req.body;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            const [datum] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 0 and CompanyID = ${CompanyID}`)

            // console.log(datum.length);
            let qty = 0
            if (datum) {
                for (let item of datum) {
                    const [fetch] = await mysql2.pool.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and PurchaseDetailID = ${item.ID}`)
                    if (fetch.length) {
                        qty = qty + item.Quantity
                        // console.log(qty);
                        const [update] = await mysql2.pool.query(`update barcodemasternew set Status = 0 where CompanyID = ${CompanyID} and PurchaseDetailID = ${item.ID}`)
                    }


                }
            }
            response.message = "update sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    checkBarcodeByPurchaseDetail: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { CompanyID } = req.body;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            const [datum] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID}`)

            // console.log(datum.length);
            let qty = 0
            if (datum) {
                for (let item of datum) {
                    const [fetch] = await mysql2.pool.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and PurchaseDetailID = ${item.ID}`)
                    if (fetch.length !== item.Quantity) {
                        // console.log(item.ID, "====>", item.Quantity);
                    }


                }
            }
            response.message = "update sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    chcekPhysicalStock2: async (req, res, next) => {
        const connection = await mysql.connection();

        try {
            const response = { data: null, success: true, message: "" }
            let { CompanyID } = req.body;

            if (!CompanyID || CompanyID === 0 || CompanyID === undefined) return res.send({ message: "Invalid CompanyID Data" })

            const [datum] = await mysql2.pool.query(`select * from billdetail where Status = 1 and Manual = 0 and CompanyID = ${CompanyID} and ID > 454535`)

            // console.log(datum.length);
            let qty = 0
            if (datum) {
                for (let item of datum) {
                    // console.log(item.ID);
                    const [fetch] = await mysql2.pool.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and BillDetailID = ${item.ID}`)
                    if (!fetch.length) {
                        qty = qty + item.Quantity
                        // console.log(qty);
                        const [update] = await mysql2.pool.query(`update barcodemasternew set BillDetailID = ${item.ID}, CurrentStatus = 'Sold', UpdatedOn = now() where CompanyID = ${CompanyID} and Barcode = '${item.Barcode}' and CurrentStatus = 'Available' Limit ${item.Quantity}`)
                    }


                }
            }
            response.message = "update sucessfully"
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
}
