const createError = require('http-errors')
const mysql = require('../helpers/db')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { now } = require('lodash')
const { shopID, generateInvoiceNo, generateBillSno, generateCommission, generateBarcode, generatePreOrderProduct, generateUniqueBarcodePreOrder, gstDetailBill } = require('../helpers/helper_function')
const _ = require("lodash")

module.exports = {
    getDoctor: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from doctor where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getEmployee: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from user where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getTrayNo: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let data = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'TrayNo' order by ID desc`);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)
        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    searchByBarcodeNo: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { Req, PreOrder, ShopMode } = req.body
            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === "false") {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice   FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;
            }

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    searchByString: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { Req, PreOrder, ShopMode } = req.body
            let SearchString = Req.searchString;
            let searchString = "%" + SearchString + "%";

            console.log(searchString, 'searchString');

            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === "false" || ShopMode === false) {
                    shopMode = " barcodemasternew.ShopID = " + shopid + " AND";
                } else {
                    shopMode = " ";
                }
                qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice  FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE  ${shopMode} CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND barcodemasternew.CurrentStatus = "Available" AND purchasedetailnew.Status = 1  and shop.Status = 1 And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`;
            } else {
                qry = `SELECT 'XXX' AS BarCodeCount,  shop.AreaName as AreaName  ,shop.Name as ShopName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice  FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE  CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND barcodemasternew.CompanyID = '${CompanyID}' and purchasemasternew.PStatus = 1  AND barcodemasternew.Status = 1   AND purchasedetailnew.Status = 1 and barcodemasternew.CurrentStatus = 'Pre Order'  GROUP BY purchasedetailnew.ID`;
            }

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    saveBill: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData, service } = req.body

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID !== null || billMaseterData.ID === undefined) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID == null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data" })

            const invoiceNo = await generateInvoiceNo(CompanyID, shopid, billDetailData, billMaseterData)
            const serialNo = await generateBillSno(CompanyID, shopid,)

            billMaseterData.Sno = serialNo;
            billMaseterData.ShopID = shopid;
            billMaseterData.CompanyID = CompanyID;
            billMaseterData.InvoiceNo = invoiceNo;

            // save Bill master data
            let bMaster = await connection.query(
                `insert into billmaster (CustomerID,CompanyID, Sno,ShopID,BillDate, DeliveryDate,  PaymentStatus,InvoiceNo, GSTNo, Quantity, SubTotal, DiscountAmount, GSTAmount,AddlDiscount, TotalAmount, DueAmount, Status,CreatedBy,CreatedOn, LastUpdate, Doctor, TrayNo, Employee) values (${billMaseterData.CustomerID}, ${CompanyID},'${billMaseterData.Sno}', ${billMaseterData.ShopID}, '${billMaseterData.BillDate}','${billMaseterData.DeliveryDate}', 'Unpaid',  '${billMaseterData.InvoiceNo}', '${billMaseterData.GSTNo}', ${billMaseterData.Quantity}, ${billMaseterData.SubTotal}, ${billMaseterData.DiscountAmount}, ${billMaseterData.GSTAmount}, ${billMaseterData.AddlDiscount}, ${billMaseterData.TotalAmount}, ${billMaseterData.TotalAmount - billMaseterData.AddlDiscount}, 1, ${LoggedOnUser}, now(), now(), ${billMaseterData.Doctor}, '${billMaseterData.TrayNo}', ${billMaseterData.Employee})`
            );

            console.log(connected("BillMaster Add SuccessFUlly !!!"));

            let bMasterID = bMaster.insertId;


            // save service
            await Promise.all(
                service.map(async (ele) => {
                    let result1 = await connection.query(
                        `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.TotalAmount},1,${LoggedOnUser}, now())`
                    );
                })
            );

            // save Bill Details

            await Promise.all(
                billDetailData.map(async (item) => {
                    let preorder = 0;
                    if (item.PreOrder === true) {
                        preorder = 1;
                    }
                    let manual = 0;
                    if (item.Manual === true) {
                        manual = 1;
                    }

                    let wholesale = 0

                    if (item.WholeSale === true) {
                        wholesale = 1;
                    }

                    if (manual === 0 && preorder === 0) {
                        let result = await connection.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (preorder === 1 && item.Barcode !== "0") {
                        let result = await connection.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (preorder === 1 && item.Barcode === "0") {
                        if (item.WholeSale === false) {
                            item.WholeSalePrice = 0
                            item.RetailPrice = item.UnitPrice
                        } else {
                            item.WholeSalePrice = item.WholeSalePrice
                            item.RetailPrice = 0

                        }
                        item.Multiple = 0
                        item.Ledger = 0
                        item.BrandType = 0
                        item.WholeSale = wholesale
                        item.BaseBarCode = await generateBarcode(CompanyID, 'PB')
                        item.Barcode = Number(item.BaseBarCode) * 1000
                        // generate unique barcode
                        item.UniqueBarcode = await generateUniqueBarcodePreOrder(CompanyID, item)
                        const data = await generatePreOrderProduct(CompanyID, shopid, item, LoggedOnUser)

                        let result = await connection.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (manual === 1 && preorder === 0) {
                        item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                        item.Barcode = Number(item.BaseBarCode) * 1000
                        let result = await connection.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    }

                })
            );

            // fetch bill detail so that we can save and update barcode master table data

            let detailDataForBarCode = await connection.query(
                `select * from billdetail where BillID = ${bMasterID} and CompanyID = ${CompanyID}`
            );


            // save and update barcode master accordingly condition like manual, preorder and stock

            for (const ele of detailDataForBarCode) {
                if (ele.PreOrder === 1) {
                    let count = ele.Quantity;
                    let j = 0;
                    for (j = 0; j < count; j++) {
                        const result = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, PreOrder,Po, TransferStatus, TransferToShop, MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn,AvailableDate, GSTType, GSTPercentage, PurchaseDetailID) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Pre Order', ${ele.UnitPrice}, 0 ,0,${ele.WholeSale},${ele.UnitPrice},0, 1, 1, '', 0, '${ele.MeasurementID}','${ele.Option}','${ele.Family}', 1, ${LoggedOnUser}, now(),  now(), '${ele.GSTType}',${ele.GSTPercentage},0)`);
                    }
                } else if (ele.Manual === 1) {
                    let count = ele.Quantity;
                    let j = 0;
                    for (j = 0; j < count; j++) {
                        const result = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Not Available','${ele.MeasurementID}','${ele.Option}','${ele.Family}', 1,${LoggedOnUser}, now(), now(), '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.UnitPrice}, 0, 0, ${ele.WholeSale}, 0,0,0,'',0)`);
                    }

                } else {
                    let selectRows1 = await connection.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${CompanyID} AND ShopID = ${shopid} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${ele.Barcode}' LIMIT ${ele.Quantity}`);
                    await Promise.all(
                        selectRows1.map(async (ele1) => {
                            let resultn = await connection.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Option}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() Where ID = ${ele1.ID}`);
                        })
                    );
                }
            }
            // save employee commission

            if (billMaseterData.Employee !== 0 && billMaseterData.Employee !== undefined && billMaseterData.Employee !== null) {
                const saveEmpCommission = await generateCommission(CompanyID, 'Employee', billMaseterData.Employee, bMasterID, billMaseterData, LoggedOnUser)
            }

            // save doctor commission

            if (billMaseterData.Doctor !== 0 && billMaseterData.Doctor !== undefined && billMaseterData.Doctor !== null) {
                const saveDocCommission = await generateCommission(CompanyID, 'Doctor', billMaseterData.Doctor, bMasterID, billMaseterData, LoggedOnUser)
            }


            // payment inititated

            const savePaymentMaster = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${billMaseterData.CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Credit',now(), 'Payment Initiated', '', '', ${billMaseterData.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const savePaymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billMaseterData.InvoiceNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},0,${billMaseterData.TotalAmount},'Customer','Credit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = {
                ID: bMasterID,
                CustomerID: billMaseterData.CustomerID
            }
            // connection.release()
            res.send(response)



        } catch (err) {
            console.log(err);
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    updateBill: async (req, res, next) => {
        const connection = await mysql.connection();
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData, service } = req.body

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.PaymentStatus !== "Unpaid") return res.send({ message: "You have already paid amount of this invoice, you can not add more product in this invoice" })
            if (billMaseterData.ProductStatus !== "Pending") return res.send({ message: "You have already deliverd product of this invoice, you can not add more product in this invoice" })

            const doesCheckPayment = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${billMaseterData.InvoiceNo}' and BillMasterID = ${billMaseterData.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Add Product !!, You have Already Paid Amount of this Invoice` })
            }

            let bMasterID = billMaseterData.ID;

            const bMaster = await connection.query(`update billmaster set BillDate = '${billMaseterData.BillDate}', DeliveryDate = '${billMaseterData.DeliveryDate}', Quantity = ${billMaseterData.Quantity}, DiscountAmount = ${billMaseterData.DiscountAmount}, GSTAmount = ${billMaseterData.GSTAmount}, SubTotal = ${billMaseterData.SubTotal}, AddlDiscount = ${billMaseterData.AddlDiscount}, TotalAmount = ${billMaseterData.TotalAmount}, DueAmount = ${billMaseterData.TotalAmount - billMaseterData.AddlDiscount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), LastUpdate = now(), TrayNo = '${billMaseterData.TrayNo}' where ID = ${bMasterID}`)

            console.log(connected("BillMaster Update SuccessFUlly !!!"));

            // save service
            await Promise.all(
                service.map(async (ele) => {
                    if (ele.ID === null) {
                        let result1 = await connection.query(
                            `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.TotalAmount},1,${LoggedOnUser}, now())`
                        );
                    }

                })
            );

            console.log(connected("Service Added SuccessFUlly !!!"));

            for (const item of billDetailData) {
                let preorder = 0;
                let manual = 0;
                let wholesale = 0
                let result = {}
                if (item.PreOrder === true) {
                    preorder = 1;
                }
                if (item.Manual === true) {
                    manual = 1;
                }
                if (item.WholeSale === true) {
                    wholesale = 1;
                }

                if (manual === 0 && preorder === 0) {
                    result = await connection.query(
                        `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                    );
                } else if (preorder === 1 && item.Barcode !== "0") {
                    result = await connection.query(
                        `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                    );
                } else if (preorder === 1 && item.Barcode === "0") {

                    if (item.WholeSale === false) {
                        item.WholeSalePrice = 0
                        item.RetailPrice = item.UnitPrice
                    } else {
                        item.WholeSalePrice = item.WholeSalePrice
                        item.RetailPrice = 0

                    }
                    item.Multiple = 0
                    item.Ledger = 0
                    item.BrandType = 0
                    item.WholeSale = wholesale
                    item.BaseBarCode = await generateBarcode(CompanyID, 'PB')
                    item.Barcode = Number(item.BaseBarCode) * 1000
                    // generate unique barcode
                    item.UniqueBarcode = await generateUniqueBarcodePreOrder(CompanyID, item)
                    const data = await generatePreOrderProduct(CompanyID, shopid, item, LoggedOnUser)
                    console.log(item, 'item');
                    result = await connection.query(
                        `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                    );
                } else if (manual === 1 && preorder === 0) {
                    item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                    item.Barcode = Number(item.BaseBarCode) * 1000
                    result = await connection.query(
                        `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                    );
                }

                const selectRow = await connection.query(`select * from billdetail where BillID = ${bMasterID} and CompanyID = ${CompanyID} and ID = ${result.insertId}`)

                const ele = selectRow[0]

                if (ele.PreOrder === 1) {
                    let count = ele.Quantity;
                    let j = 0;
                    for (j = 0; j < count; j++) {
                        const result = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, PreOrder,Po, TransferStatus, TransferToShop, MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn,AvailableDate, GSTType, GSTPercentage, PurchaseDetailID) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Pre Order', ${ele.UnitPrice}, 0 ,0,${ele.WholeSale},${ele.UnitPrice},0, 1, 1, '', 0, '${ele.MeasurementID}','${ele.Option}','${ele.Family}', 1, ${LoggedOnUser}, now(),  now(), '${ele.GSTType}',${ele.GSTPercentage},0)`);
                    }
                } else if (ele.Manual === 1) {
                    let count = ele.Quantity;
                    let j = 0;
                    for (j = 0; j < count; j++) {
                        const result = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Not Available','${ele.MeasurementID}','${ele.Option}','${ele.Family}', 1,${LoggedOnUser}, now(), now(), '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.UnitPrice}, 0, 0, ${ele.WholeSale}, 0,0,0,'',0)`);
                    }

                } else {
                    let selectRows1 = await connection.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${CompanyID} AND ShopID = ${shopid} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${ele.Barcode}' LIMIT ${ele.Quantity}`);
                    await Promise.all(
                        selectRows1.map(async (ele1) => {
                            let resultn = await connection.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Option}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() Where ID = ${ele1.ID}`);
                        })
                    );
                }


            }

            // delete comission
            const delComm = await connection.query(`delete from commissiondetail where BillMasterID = ${bMasterID}`)
            console.log(connected("Delete Comission and Again Initiated!!!"));
            // save employee commission

            if (billMaseterData.Employee !== 0 && billMaseterData.Employee !== undefined && billMaseterData.Employee !== null) {
                const saveEmpCommission = await generateCommission(CompanyID, 'Employee', billMaseterData.Employee, bMasterID, billMaseterData, LoggedOnUser)
            }

            // save doctor commission

            if (billMaseterData.Doctor !== 0 && billMaseterData.Doctor !== undefined && billMaseterData.Doctor !== null) {
                const saveDocCommission = await generateCommission(CompanyID, 'Doctor', billMaseterData.Doctor, bMasterID, billMaseterData, LoggedOnUser)
            }

            //  update payment

            const updatePaymentMaster = await connection.query(`update paymentmaster set PayableAmount = ${billMaseterData.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${billMaseterData.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            console.log(connected("Payment Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = {
                ID: bMasterID,
                CustomerID: billMaseterData.CustomerID
            }
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    list: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const Body = req.body;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and billmaster.ShopID = ${shopid}`
            }

            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE  billmaster.CompanyID = ${CompanyID} ${shopId}  AND billmaster.Status = 1   Order By billmaster.ID Desc `

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    searchByFeild: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })
            let { searchQuery } = Body;
            let shopId = ``

            if (shopid !== 0) {
                shopId = `and billmaster.ShopID = ${shopid}`
            }


            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 and Customer1.Name like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 and  Customer1.MobileNo1 like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = '${CompanyID}' AND billmaster.Status = 1 and billmaster.InvoiceNo like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 and Customer1.Idd like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1 and Customer1.Sno like '${searchQuery}%' ${shopId}`;

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    getBillById: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { result: { billMaster: null, billDetail: null, service: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const billMaster = await connection.query(`select * from  billmaster where CompanyID =  ${CompanyID} and ID = ${ID} and Status = 1 Order By ID Desc`)

            const billDetail = await connection.query(`select * from  billdetail where CompanyID =  ${CompanyID} and BillID = ${ID} Order By ID Desc`)

            const service = await connection.query(`SELECT billservice.*, servicemaster.Name AS ServiceType  FROM  billservice  LEFT JOIN servicemaster ON servicemaster.ID = billservice.ServiceType WHERE billservice.CompanyID =  ${CompanyID} and BillID = ${ID} Order By ID Desc`)

            const gst_detail = await gstDetailBill(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.billMaster = billMaster
            if (response.result.billMaster.length) {
                response.result.billMaster[0].gst_detail = gst_detail || []
            }

            response.result.billDetail = billDetail
            response.result.service = service
            // connection.release()
            return res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    paymentHistory: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, InvoiceNo } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })
            if (InvoiceNo === null || InvoiceNo === undefined) return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT paymentdetail.*, billmaster.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.CreatedOn AS PaymentDate, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN billmaster ON billmaster.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType = 'Customer' AND billmaster.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and billmaster.CompanyID = ${CompanyID} and billmaster.ShopID = ${shopid}`

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    billHistoryByCustomer: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, sumData: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { CustomerID } = req.body;

            if (!CustomerID || CustomerID === undefined || CustomerID === null) return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE  billmaster.CustomerID = ${CustomerID} and billmaster.CompanyID = ${CompanyID}  AND billmaster.Status = 1   Order By billmaster.ID Desc `

            let SumQry = `SELECT SUM(billmaster.Quantity) as Quantity , SUM(billmaster.SubTotal) as SubTotal , SUM(billmaster.DiscountAmount) as DiscountAmount , SUM(billmaster.GSTAmount) as GSTAmount , SUM(billmaster.TotalAmount) as TotalAmount , SUM(billmaster.DueAmount) as DueAmount FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE  billmaster.CustomerID = ${CustomerID} and billmaster.CompanyID = ${CompanyID}  AND billmaster.Status = 1   Order By billmaster.ID Desc `

            let finalQuery = qry;
            let data = await connection.query(finalQuery);
            let sumData = await connection.query(SumQry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.sumData = sumData[0]
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    deleteBill: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, sumData: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from billmaster where CompanyID = ${CompanyID} and Status = 1 and ID = ${ID}`)

            if (!doesExist.length) {
                return res.send({ message: "bill doesnot exist from this id " })
            }

            const doesCheckLen = await connection.query(`select * from billdetail where CompanyID = ${CompanyID} and Status = 1 and BillID = ${ID}`)

            console.log(doesCheckLen.length, 'doesCheckLen')

            if (doesCheckLen.length !== 0) {
                return res.send({ message: `First you'll have to delete product` })
            }

            const deleteBill = await connection.query(`update billmaster set Status = 0, CreatedBy = ${LoggedOnUser}, UpdatedBy = now() where ID = ${ID}`)

            response.message = "data delete sucessfully"
            response.data = []
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    updatePower: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID, MeasurementID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            if (!MeasurementID || MeasurementID === undefined || MeasurementID === null) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from billdetail where CompanyID = ${CompanyID} and Status = 1 and ID = ${ID}`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            const updateBill = await connection.query(`update billdetail set MeasurementID = '${MeasurementID}', UpdatedBy = ${LoggedOnUser} where ID = ${ID} and CompanyID = ${CompanyID}`)

            const updateBarcode = await connection.query(`update barcodemasternew set MeasurementID = '${MeasurementID}', UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where BillDetailID = ${ID} and CompanyID = ${CompanyID}`)

            response.message = "data update sucessfully"
            response.data = [{
                ID: ID,
                MeasurementID: MeasurementID
            }]
            // connection.release()
            res.send(response)

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData, service } = req.body

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data" })

            let bMaster = {
                ID,
                Quantity,
                SubTotal,
                DiscountAmount,
                GSTAmount,
                AddlDiscount,
                TotalAmount,
                DueAmount
            }



        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },

    billByCustomer: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CustomerID } = req.body

            if (CustomerID === null || CustomerID === undefined || CustomerID == 0 || CustomerID === "") return res.send({ message: "Invalid Query Data" })

            let data = await connection.query(`select billmaster.InvoiceNo, billmaster.TotalAmount, billmaster.DueAmount from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and ShopID = ${shopid} and PaymentStatus = 'Unpaid' order by ID desc`)

            response.data = data
            response.message = "success";
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    paymentHistoryByMasterID: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CustomerID, BillMasterID } = req.body

            if (CustomerID === null || CustomerID === undefined || CustomerID == 0 || CustomerID === "") return res.send({ message: "Invalid Query Data" })
            if (BillMasterID === null || BillMasterID === undefined || BillMasterID == 0 || BillMasterID === "") return res.send({ message: "Invalid Query Data" })

            let data = await connection.query(`select paymentdetail.amount as Amount, PaymentMaster.PaymentDate as PaymentDate, PaymentMaster.PaymentType AS PaymentType,PaymentMaster.PaymentMode as PaymentMode, PaymentMaster.CardNo as CardNo, PaymentMaster.PaymentReferenceNo as PaymentReferenceNo from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.CustomerID = ${CustomerID} and paymentmaster.ShopID = ${shopid} and paymentmaster.PaymentType = 'Customer' and paymentmaster.Status = 1 and paymentdetail.BillMasterID = ${BillMasterID}`)

            response.data = data
            response.message = "success";
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    },
    saleServiceReport: async (req, res, next) => {
        const connection = await mysql.connection();
        try {

            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "gst_details": []
                }]
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and billmaster.ShopID = ${shopid}`
                }
            }

            qry = `select billservice.*, shop.name as ShopName, shop.AreaName as AreaName, billmaster.InvoiceNo as InvoiceNo from billservice left join billmaster on billmaster.ID = billservice.BillID left join shop on shop.ID = billmaster.ShopID WHERE billservice.CompanyID = ${CompanyID} AND billservice.Status = 1 ` + Parem;

            let data = await connection.query(qry);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

            gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
            const values = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    if ((item.Name).toUpperCase() === 'CGST-SGST') {
                        values.push(
                            {
                                GSTType: `CGST`,
                                Amount: 0
                            },
                            {
                                GSTType: `SGST`,
                                Amount: 0
                            }
                        )
                    } else {
                        values.push({
                            GSTType: `${item.Name}`,
                            Amount: 0
                        })
                    }
                }

            }

            if (data.length) {
                for (const item of data) {
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.Price

                    if (values) {
                        values.forEach(e => {
                            if (e.GSTType === item.GSTType) {
                                e.Amount += item.GSTAmount
                            }

                            // CGST-SGST

                            if (item.GSTType === 'CGST-SGST') {

                                if (e.GSTType === 'CGST') {
                                    e.Amount += item.GSTAmount / 2
                                }

                                if (e.GSTType === 'SGST') {
                                    e.Amount += item.GSTAmount / 2
                                }
                            }
                        })
                    }

                }


            }

            response.calculation[0].gst_details = values;
            response.data = data
            response.message = "success";
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }

    },

    getSalereports: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT billmaster.*, shop.Name AS ShopName, shop.AreaName AS AreaName, customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo, billdetail.ProductStatus as ProductStatus, billdetail.HSNCode as HSNCode, billdetail.ProductDeliveryDate as ProductDeliveryDate,billdetail.GSTType AS GSTType ,billdetail.UnitPrice AS UnitPrice,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID  WHERE billmaster.CompanyID = ${CompanyID} and (billdetail.Manual = 0 || billdetail.Manual = 1 ) and billmaster.Status = 1 AND shop.Status = 1 ` +
                Parem + " GROUP BY billmaster.InvoiceNo ORDER BY billmaster.ID DESC"

            let datum = await connection.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID}  ` + Parem)

            let data = await connection.query(qry);

            let data2 = await connection.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID} ` + Parem);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

            gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
            const values = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    if ((item.Name).toUpperCase() === 'CGST-SGST') {
                        values.push(
                            {
                                GSTType: `CGST`,
                                Amount: 0
                            },
                            {
                                GSTType: `SGST`,
                                Amount: 0
                            }
                        )
                    } else {
                        values.push({
                            GSTType: `${item.Name}`,
                            Amount: 0
                        })
                    }
                }

            }

            if (data2.length && values.length) {
                for (const item of data2) {
                    values.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            e.Amount += item.GSTAmount
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2
                            }
                        }
                    })

                }

            }
            const values2 = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    if ((item.Name).toUpperCase() === 'CGST-SGST') {
                        values2.push(
                            {
                                GSTType: `CGST`,
                                Amount: 0
                            },
                            {
                                GSTType: `SGST`,
                                Amount: 0
                            }
                        )
                    } else {
                        values2.push({
                            GSTType: `${item.Name}`,
                            Amount: 0
                        })
                    }
                }

            }

            if (data.length && values2.length) {
                for (const item of data) {
                    item.gst_details = []
                    item.gst_detailssss = []
                    values2.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount,
                                InvoiceNo: item.InvoiceNo,
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2,
                                    InvoiceNo: item.InvoiceNo,
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                item.gst_details.push({
                                    GSTType: 'SGST',
                                    Amount: item.GSTAmount / 2,
                                    InvoiceNo: item.InvoiceNo,

                                })
                            }
                        }
                    })
                }



            }

            response.calculation[0].gst_details = values;
            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0
            response.data = data
            response.message = "success";
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }

    },
    getSalereportsDetail: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT billdetail.*, customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN Shop ON Shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.Status = 1 AND billdetail.CompanyID = '${CompanyID}' AND billdetail.Quantity != 0 AND Shop.Status = 1 ` + Parem

            let datum = await connection.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID}  ` + Parem)

            let data = await connection.query(qry);

            let data2 = await connection.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID} ` + Parem);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

            gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
            const values = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    if ((item.Name).toUpperCase() === 'CGST-SGST') {
                        values.push(
                            {
                                GSTType: `CGST`,
                                Amount: 0
                            },
                            {
                                GSTType: `SGST`,
                                Amount: 0
                            }
                        )
                    } else {
                        values.push({
                            GSTType: `${item.Name}`,
                            Amount: 0
                        })
                    }
                }

            }

            if (data2.length && values.length) {
                for (const item of data2) {
                    values.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            e.Amount += item.GSTAmount
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2
                            }
                        }
                    })

                }

            }
            const values2 = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    if ((item.Name).toUpperCase() === 'CGST-SGST') {
                        values2.push(
                            {
                                GSTType: `CGST`,
                                Amount: 0
                            },
                            {
                                GSTType: `SGST`,
                                Amount: 0
                            }
                        )
                    } else {
                        values2.push({
                            GSTType: `${item.Name}`,
                            Amount: 0
                        })
                    }
                }

            }

            if (data.length && values2.length) {
                for (const item of data) {
                    item.gst_details = []
                    values2.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                item.gst_details.push({
                                    GSTType: 'SGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }
                        }
                    })
                }



            }

            response.calculation[0].gst_details = values;
            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0
            response.data = data
            response.message = "success";
            // connection.release()
            res.send(response)


        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }

    },

}
