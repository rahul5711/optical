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
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;
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
                qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE  ${shopMode} CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND barcodemasternew.CurrentStatus = "Available" AND purchasedetailnew.Status = 1  and shop.Status = 1 And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`;
            } else {
                qry = `SELECT 'XXX' AS BarCodeCount,  shop.AreaName as AreaName  ,shop.Name as ShopName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE  CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND barcodemasternew.CompanyID = '${CompanyID}' and purchasemasternew.PStatus = 1  AND barcodemasternew.Status = 1   AND purchasedetailnew.Status = 1 and barcodemasternew.CurrentStatus = 'Pre Order'  GROUP BY purchasedetailnew.ID`;
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

            response.message = "data fetch sucessfully"
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

            let qry = `SELECT paymentdetail.*, billmaster.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN billmaster ON billmaster.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType = 'Customer' AND billmaster.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and billmaster.CompanyID = ${CompanyID} and billmaster.ShopID = ${shopid}`

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

}
