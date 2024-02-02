const createError = require('http-errors')
const mysql = require('../newdb')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { now } = require('lodash')
const { shopID, generateInvoiceNo, generateBillSno, generateCommission, updateCommission, generateBarcode, generatePreOrderProduct, generateUniqueBarcodePreOrder, gstDetailBill, generateUniqueBarcode, generateInvoiceNoForService } = require('../helpers/helper_function')
const _ = require("lodash")
let ejs = require("ejs");
let path = require("path");
let pdf = require("html-pdf");
var TinyURL = require('tinyurl');
var moment = require("moment");
const clientConfig = require("../helpers/constants");
const mysql2 = require('../database');
const { log } = require('winston');
const { json } = require('express');

function discountAmount(item) {
    let discountAmount = 0
    discountAmount = (item.UnitPrice * item.Quantity) * item.DiscountPercentage / 100;
    return discountAmount
}

function discountAmount2(item) {
    let discountAmount = 0
    discountAmount = (item.UnitPrice * 1) * item.DiscountPercentage / 100;
    return discountAmount
}

function gstAmount(SubTotal, GSTPercentage) {
    let gstAmount = 0
    gstAmount = (SubTotal * GSTPercentage) / 100
    return gstAmount
}

module.exports = {
    getDoctor: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let [data] = await mysql2.pool.query(`select * from doctor where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data || []
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getEmployee: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let [data] = await mysql2.pool.query(`select * from user where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getTrayNo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let [data] = await mysql2.pool.query(`select * from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'TrayNo' order by ID desc`);
            response.message = "data fetch sucessfully"
            response.data = data || []
            console.log(response);
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    searchByBarcodeNo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { Req, PreOrder, ShopMode } = req.body
            console.log(ShopMode, 'ShopMode');
            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === false) {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID,purchasedetailnew.ProductExpDate, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.UnitPrice, purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice   FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
                console.log(`SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice   FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`);
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;

            }

            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    searchByString: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { Req, PreOrder, ShopMode } = req.body
            let SearchString = Req.searchString;
            let searchString = "%" + SearchString + "%";

            console.log(searchString, '=====================================> searchString');

            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === "false" || ShopMode === false) {
                    shopMode = " barcodemasternew.ShopID = " + shopid + " AND";
                } else {
                    shopMode = " ";
                }
                qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice  FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE  barcodemasternew.CurrentStatus = "Available" AND  ${shopMode} CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND purchasedetailnew.Status = 1  and shop.Status = 1 And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`;
            } else {
                qry = `SELECT 'XXX' AS BarCodeCount,  shop.AreaName as AreaName  ,shop.Name as ShopName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode, purchasedetailnew.RetailPrice as RetailPrice, purchasedetailnew.WholeSalePrice as WholeSalePrice  FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE  CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND barcodemasternew.CompanyID = '${CompanyID}' and purchasemasternew.PStatus = 1  AND barcodemasternew.Status = 1   AND purchasedetailnew.Status = 1 and barcodemasternew.CurrentStatus = 'Pre Order'  GROUP BY purchasedetailnew.ID`;
            }

            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    saveBill: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData, service } = req.body

            console.log("saveBill=============================>", req.body);

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID !== null || billMaseterData.ID === undefined || billMaseterData.ID === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID == null || billMaseterData.CustomerID === undefined || billMaseterData.CustomerID === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.Doctor == null || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.Employee == null || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") return res.send({ message: "Invalid Query Data" })

            const [existShop] = await mysql2.pool.query(`select * from shop where Status = 1 and ID = ${billMaseterData.ShopID}`)

            if (!existShop.length) {
                return res.send({ message: "You have already delete this shop" })
            }


            const serialNo = await generateBillSno(CompanyID, shopid,)

            billMaseterData.Sno = serialNo;
            billMaseterData.ShopID = shopid;
            billMaseterData.CompanyID = CompanyID;

            let billType = 1
            let paymentMode = 'Unpaid';
            let productStatus = 'Deliverd';

            if (billMaseterData.TotalAmount == 0) {
                paymentMode = 'Paid'
            }



            if (billDetailData.length) {
                const invoiceNo = await generateInvoiceNo(CompanyID, shopid, billDetailData, billMaseterData)
                billMaseterData.InvoiceNo = invoiceNo;
                productStatus = 'Pending'
            }

            if (service.length && !billDetailData.length) {
                billType = 0
                const invoiceNo = await generateInvoiceNoForService(CompanyID, shopid, service, billMaseterData)
                billMaseterData.InvoiceNo = invoiceNo;
            }

            // save Bill master data
            let [bMaster] = await mysql2.pool.query(
                `insert into billmaster (CustomerID,CompanyID, Sno,ShopID,BillDate, DeliveryDate,  PaymentStatus,InvoiceNo, GSTNo, Quantity, SubTotal, DiscountAmount, GSTAmount,AddlDiscount, TotalAmount, DueAmount, Status,CreatedBy,CreatedOn, LastUpdate, Doctor, TrayNo, Employee, BillType, RoundOff, AddlDiscountPercentage, ProductStatus) values (${billMaseterData.CustomerID}, ${CompanyID},'${billMaseterData.Sno}', ${billMaseterData.ShopID}, '${billMaseterData.BillDate}','${billMaseterData.DeliveryDate}', '${paymentMode}',  '${billMaseterData.InvoiceNo}', '${billMaseterData.GSTNo}', ${billMaseterData.Quantity}, ${billMaseterData.SubTotal}, ${billMaseterData.DiscountAmount}, ${billMaseterData.GSTAmount}, ${billMaseterData.AddlDiscount}, ${billMaseterData.TotalAmount}, ${billMaseterData.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}','${req.headers.currenttime}', ${billMaseterData.Doctor}, '${billMaseterData.TrayNo}', ${billMaseterData.Employee}, ${billType}, ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0}, '${productStatus}')`
            );

            console.log(connected("BillMaster Add SuccessFUlly !!!"));

            let bMasterID = bMaster.insertId;


            // save service
            console.log(service, 'serviceserviceserviceserviceserviceserviceserviceserviceserviceservice');
            if (service.length) {
                await Promise.all(
                    service.map(async (ele) => {
                        let [result1] = await mysql2.pool.query(
                            `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price},  ${ele.SubTotal}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.TotalAmount},1,${LoggedOnUser}, '${req.headers.currenttime}')`
                        );
                    })
                );
            }


            // save Bill Details

            if (billDetailData.length) {
                // await Promise.all(
                //     billDetailData.map(async (item) => {
                //         let preorder = 0;
                //         if (item.PreOrder === true) {
                //             preorder = 1;
                //         }
                //         let manual = 0;
                //         if (item.Manual === true) {
                //             manual = 1;
                //         }

                //         let wholesale = 0

                //         if (item.WholeSale === true) {
                //             wholesale = 1;
                //         }

                //         if (manual === 0 && preorder === 0) {
                //             let [result] = await mysql2.pool.query(
                //                 `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                //             );
                //         } else if (preorder === 1 && item.Barcode !== "0") {
                //             let [result] = await mysql2.pool.query(
                //                 `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                //             );
                //         } else if (preorder === 1 && item.Barcode === "0") {
                //             item.prod_UnitPrice = item.UnitPrice
                //             item.prod_Quantity = item.Quantity
                //             item.prod_SubTotal = item.SubTotal
                //             item.prod_DiscountPercentage = item.DiscountPercentage
                //             item.prod_DiscountAmount = item.DiscountAmount
                //             item.prod_GSTPercentage = item.GSTPercentage
                //             item.prod_GSTAmount = item.GSTAmount
                //             item.prod_TotalAmount = item.TotalAmount

                //             if (item.WholeSale === false) {
                //                 item.WholeSalePrice = 0
                //                 item.RetailPrice = item.PurchasePrice
                //             } else {
                //                 item.WholeSalePrice = item.PurchasePrice
                //                 item.RetailPrice = 0

                //             }
                //             item.Multiple = 0
                //             item.Ledger = 0
                //             item.BrandType = 0
                //             item.WholeSale = wholesale
                //             item.BaseBarCode = await generateBarcode(CompanyID, 'PB')
                //             item.Barcode = Number(item.BaseBarCode)
                //             // generate unique barcode
                //             item.UniqueBarcode = await generateUniqueBarcodePreOrder(CompanyID, item)
                //             const data = await generatePreOrderProduct(CompanyID, shopid, item, LoggedOnUser)
                //             let [result] = await mysql2.pool.query(
                //                 `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.prod_UnitPrice},${item.PurchasePrice},${item.prod_Quantity},${item.prod_SubTotal}, ${item.prod_DiscountPercentage},${item.prod_DiscountAmount},${item.prod_GSTPercentage},${item.prod_GSTAmount},'${item.GSTType}',${item.prod_TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                //             );
                //         } else if (manual === 1 && preorder === 0) {
                //             item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                //             item.Barcode = Number(item.BaseBarCode)
                //             let [result] = await mysql2.pool.query(
                //                 `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, now(), ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                //             );
                //         }

                //     })
                // );

                for (const item of billDetailData) {
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
                        let [newPurchasePrice] = await mysql2.pool.query(`select * from purchasedetailnew where BaseBarCode = '${item.Barcode}' and CompanyID = ${CompanyID}`);

                        let newPurchaseRate = 0
                        if (newPurchasePrice) {
                            newPurchaseRate = newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100 + (newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100) * newPurchasePrice[0].GSTPercentage / 100;
                        }


                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${newPurchaseRate},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (preorder === 1 && item.Barcode !== "0") {
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (preorder === 1 && item.Barcode === "0") {
                        item.prod_UnitPrice = item.UnitPrice
                        item.prod_Quantity = item.Quantity
                        item.prod_SubTotal = item.SubTotal
                        item.prod_DiscountPercentage = item.DiscountPercentage
                        item.prod_DiscountAmount = item.DiscountAmount
                        item.prod_GSTPercentage = item.GSTPercentage
                        item.prod_GSTAmount = item.GSTAmount
                        item.prod_TotalAmount = item.TotalAmount

                        if (item.WholeSale === false) {
                            item.WholeSalePrice = 0
                            item.RetailPrice = item.PurchasePrice
                        } else {
                            item.WholeSalePrice = item.PurchasePrice
                            item.RetailPrice = 0

                        }
                        item.Multiple = 0
                        item.Ledger = 0
                        item.BrandType = 0
                        item.WholeSale = wholesale
                        item.BaseBarCode = await generateBarcode(CompanyID, 'PB')
                        item.Barcode = Number(item.BaseBarCode)
                        // generate unique barcode
                        item.UniqueBarcode = await generateUniqueBarcodePreOrder(CompanyID, item)
                        const data = await generatePreOrderProduct(CompanyID, shopid, item, LoggedOnUser)
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.prod_UnitPrice},${item.PurchasePrice},${item.prod_Quantity},${item.prod_SubTotal}, ${item.prod_DiscountPercentage},${item.prod_DiscountAmount},${item.prod_GSTPercentage},${item.prod_GSTAmount},'${item.GSTType}',${item.prod_TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (manual === 1 && preorder === 0) {
                        item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                        item.Barcode = Number(item.BaseBarCode)
                        let [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    }
                }

                // fetch bill detail so that we can save and update barcode master table data

                let [detailDataForBarCode] = await mysql2.pool.query(
                    `select * from billdetail where BillID = ${bMasterID} and CompanyID = ${CompanyID}`
                );


                // save and update barcode master accordingly condition like manual, preorder and stock

                for (const ele of detailDataForBarCode) {
                    if (ele.PreOrder === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, PreOrder,Po, TransferStatus, TransferToShop, MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn,AvailableDate, GSTType, GSTPercentage, PurchaseDetailID) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Pre Order', ${ele.WholeSale !== 1 ? ele.UnitPrice : 0}, 0 ,0,${ele.WholeSale},${ele.WholeSale === 1 ? ele.UnitPrice : 0},0, 1, 1, '', 0, '${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1, ${LoggedOnUser}, '${req.headers.currenttime}',  '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage},0)`);
                        }
                    } else if (ele.Manual === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Not Available','${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1,${LoggedOnUser}, '${req.headers.currenttime}', '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.WholeSale !== 1 ? ele.UnitPrice : 0}, 0, 0, ${ele.WholeSale}, ${ele.WholeSale === 1 ? ele.UnitPrice : 0},0,0,'',0)`);
                        }

                    } else {
                        let [selectRows1] = await mysql2.pool.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${CompanyID} AND ShopID = ${shopid} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${ele.Barcode}' LIMIT ${ele.Quantity}`);
                        await Promise.all(
                            selectRows1.map(async (ele1) => {
                                let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' Where ID = ${ele1.ID}`);
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
            }



            // payment inititated

            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${billMaseterData.CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Credit','${req.headers.currenttime}', 'Payment Initiated', '', '', ${billMaseterData.TotalAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billMaseterData.InvoiceNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},0,${billMaseterData.TotalAmount},'Customer','Credit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = {
                ID: bMasterID,
                CustomerID: billMaseterData.CustomerID
            }

            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    updateBillCustomer: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { billMaseterData, billDetailData, service } = req.body

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            // if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined || billMaseterData.CustomerID === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.Employee === null || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.Doctor === null || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") return res.send({ message: "Invalid Query Data" })

            const [existShop] = await mysql2.pool.query(`select * from shop where Status = 1 and ID = ${shopid}`)

            if (!existShop.length) {
                return res.send({ message: "You have already delete this shop" })
            }

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${billMaseterData.InvoiceNo}' and BillMasterID = ${billMaseterData.ID}`)

            let bMasterID = billMaseterData.ID;

            const [fetchBill] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${CompanyID} and ID = ${bMasterID} and Status = 1 `)

            // old software condition
            if (fetchBill[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            if (billDetailData.length && fetchBill[0].BillType === 0) {
                return res.send({ success: false, message: "You can not add product in this invoice, because it is service invoice only" })
            }

            if (billMaseterData.TotalAmount == 0) {
                billMaseterData.PaymentStatus = 'Paid'
            }

            if (billDetailData.length) {
                billMaseterData.ProductStatus = 'Pending'
            }

            const [fetchComm] = await mysql2.pool.query(`select * from commissiondetail where BillMasterID = ${bMasterID} and CommissionMasterID != 0`)

            if (billDetailData.length && fetchComm.length) {
                return res.send({ success: false, message: "you can not add more product in this invoice because you have already settled commission of this invoice" })
            }


            const [bMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${billMaseterData.PaymentStatus}', ProductStatus = '${billMaseterData.ProductStatus}', BillDate = '${billMaseterData.BillDate}', DeliveryDate = '${billMaseterData.DeliveryDate}', Quantity = ${billMaseterData.Quantity}, DiscountAmount = ${billMaseterData.DiscountAmount}, GSTAmount = ${billMaseterData.GSTAmount}, SubTotal = ${billMaseterData.SubTotal}, AddlDiscount = ${billMaseterData.AddlDiscount}, TotalAmount = ${billMaseterData.TotalAmount}, DueAmount = ${billMaseterData.DueAmount}, UpdatedBy = ${LoggedOnUser}, RoundOff = ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, AddlDiscountPercentage = ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0}, UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}', TrayNo = '${billMaseterData.TrayNo}' where ID = ${bMasterID}`)

            console.log(connected("BillMaster Update SuccessFUlly !!!"));

            // save service
            if (service.length) {
                await Promise.all(
                    service.map(async (ele) => {
                        if (ele.ID === null) {
                            let [result1] = await mysql2.pool.query(
                                `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price}, ${ele.SubTotal}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.TotalAmount},1,${LoggedOnUser}, '${req.headers.currenttime}')`
                            );
                        }

                    })
                );
            }

            console.log(connected("Service Added SuccessFUlly !!!"));

            if (billDetailData.length) {
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
                        let [newPurchasePrice] = await mysql2.pool.query(`select * from purchasedetailnew where BaseBarCode = '${item.Barcode}' and CompanyID = ${CompanyID}`);

                        let newPurchaseRate = 0
                        if (newPurchasePrice) {
                            newPurchaseRate = newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100 + (newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100) * newPurchasePrice[0].GSTPercentage / 100;
                        }
                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${newPurchaseRate},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (preorder === 1 && item.Barcode !== "0") {
                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (preorder === 1 && item.Barcode === "0") {
                        item.prod_UnitPrice = item.UnitPrice
                        item.prod_Quantity = item.Quantity
                        item.prod_SubTotal = item.SubTotal
                        item.prod_DiscountPercentage = item.DiscountPercentage
                        item.prod_DiscountAmount = item.DiscountAmount
                        item.prod_GSTPercentage = item.GSTPercentage
                        item.prod_GSTAmount = item.GSTAmount
                        item.prod_TotalAmount = item.TotalAmount

                        if (item.WholeSale === false) {
                            item.WholeSalePrice = 0
                            item.RetailPrice = item.PurchasePrice
                        } else {
                            item.WholeSalePrice = item.PurchasePrice
                            item.RetailPrice = 0

                        }
                        item.Multiple = 0
                        item.Ledger = 0
                        item.BrandType = 0
                        item.WholeSale = wholesale
                        item.BaseBarCode = await generateBarcode(CompanyID, 'PB')
                        item.Barcode = Number(item.BaseBarCode)
                        // generate unique barcode
                        item.UniqueBarcode = await generateUniqueBarcodePreOrder(CompanyID, item)
                        const data = await generatePreOrderProduct(CompanyID, shopid, item, LoggedOnUser);
                        [result] = await mysql2.pool.query(`insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.prod_UnitPrice},${item.PurchasePrice},${item.prod_Quantity},${item.prod_SubTotal}, ${item.prod_DiscountPercentage},${item.prod_DiscountAmount},${item.prod_GSTPercentage},${item.prod_GSTAmount},'${item.GSTType}',${item.prod_TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (manual === 1 && preorder === 0) {
                        item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                        item.Barcode = Number(item.BaseBarCode);
                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );

                    }

                    const [selectRow] = await mysql2.pool.query(`select * from billdetail where BillID = ${bMasterID} and CompanyID = ${CompanyID} and ID = ${result.insertId}`)

                    const ele = selectRow[0]

                    if (ele.PreOrder === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, PreOrder,Po, TransferStatus, TransferToShop, MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn,AvailableDate, GSTType, GSTPercentage, PurchaseDetailID) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Pre Order', ${ele.WholeSale !== 1 ? ele.UnitPrice : 0}, 0 ,0,${ele.WholeSale},${ele.WholeSale === 1 ? ele.UnitPrice : 0},0, 1, 1, '', 0, '${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1, ${LoggedOnUser}, '${req.headers.currenttime}',  '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage},0)`);
                        }
                    } else if (ele.Manual === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Not Available','${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1,${LoggedOnUser}, '${req.headers.currenttime}', '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.WholeSale !== 1 ? ele.PurchasePrice : 0}, 0, 0, ${ele.WholeSale === 1 ? ele.PurchasePrice : 0}, 0,0,0,'',0)`);
                        }

                    } else {
                        let [selectRows1] = await mysql2.pool.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${CompanyID} AND ShopID = ${shopid} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${ele.Barcode}' LIMIT ${ele.Quantity}`);
                        await Promise.all(
                            selectRows1.map(async (ele1) => {
                                let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' Where ID = ${ele1.ID}`);
                            })
                        );
                    }


                }

                // delete comission

                // const [fetchComm] = await mysql2.pool.query(`select * from commissiondetail where BillMasterID = ${bMasterID} and CommissionMasterID != 0`)

                // const [delComm] = await mysql2.pool.query(`delete from commissiondetail where BillMasterID = ${bMasterID}`)
                // console.log(connected("Delete Comission and Again Initiated!!!"));

                // if (fetchComm.length) {
                //   const [delCommMaster] = await mysql2.pool.query(`delete from commissionmaster where ID = ${fetchComm[0].CommissionMasterID}`)
                // }

                // save employee commission

                if (billMaseterData.Employee !== 0 && billMaseterData.Employee !== undefined && billMaseterData.Employee !== null) {
                    const saveEmpCommission = await updateCommission(CompanyID, 'Employee', billMaseterData.Employee, bMasterID, billMaseterData, LoggedOnUser)
                }

                // save doctor commission

                if (billMaseterData.Doctor !== 0 && billMaseterData.Doctor !== undefined && billMaseterData.Doctor !== null) {
                    const saveDocCommission = await updateCommission(CompanyID, 'Doctor', billMaseterData.Doctor, bMasterID, billMaseterData, LoggedOnUser)
                }
            }



            //  update payment

            if (billDetailData.length || service.length) {

                const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${billMaseterData.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID}`)

                const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${billMaseterData.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID}`)
            }



            // const savePaymentMaster = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${billMaseterData.CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Credit',now(), 'Payment Initiated', '', '', ${billMaseterData.DueAmount}, ${billMaseterData.TotalAmount - billMaseterData.DueAmount}, '',1,${LoggedOnUser}, now())`)

            // const savePaymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billMaseterData.InvoiceNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},${billMaseterData.TotalAmount - billMaseterData.DueAmount},${billMaseterData.DueAmount},'Customer','Credit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = {
                ID: bMasterID,
                CustomerID: billMaseterData.CustomerID
            }

            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    changeEmployee: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { BillMasterID, UserID } = req.body

            if (!BillMasterID) return res.send({ message: "Invalid BillMasterID Data" })
            if (!UserID) return res.send({ message: "Invalid UserID Data" })

            const [fetch] = await mysql2.pool.query(`select * from commissiondetail where BillMasterID = ${BillMasterID} and CompanyID = ${CompanyID} and UserType = 'Employee'`)

            if (!fetch.length) {
                return res.send({ success: false, message: "Invalid BillMasterID and Not Available Commission of this Invoice, Please Check Employee Commission Setting" })
            }

            if (fetch[0].CommissionMasterID !== 0) {
                return res.send({ success: false, message: "You Have Already Create Invoice, You Can Not Change Employee" })
            }

            const [update] = await mysql2.pool.query(`update commissiondetail set UserID = ${UserID}, UpdatedOn = now(), UpdatedBy = ${LoggedOnUser} where BillMasterID = ${BillMasterID} and CompanyID = ${CompanyID} and UserType = 'Employee'`)

            const [updateMaster] = await mysql2.pool.query(`update billmaster set Employee = ${UserID} where ID = ${BillMasterID} and CompanyID = ${CompanyID}`)

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    changeProductStatus: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { BillMasterID, billDetailData } = req.body

            console.log("changeProductStatus =====================>", req.body);

            if (!BillMasterID) return res.send({ message: "Invalid BillMasterID Data" })
            if (!billDetailData.length) return res.send({ message: "Invalid Data" })

            const [fetch] = await mysql2.pool.query(`select * from billmaster where ID = ${BillMasterID} and CompanyID = ${CompanyID} and Status = 1`)

            if (!fetch.length) {
                return res.send({ success: false, message: "Invalid BillMasterID" })
            }

            let productStatus = 'Deliverd'

            if (billDetailData.length) {
                for (const item of billDetailData) {
                    if (item.ProductStatus === 0) {
                        productStatus = 'Pending'
                    }

                    const [update] = await mysql2.pool.query(`update billdetail set ProductStatus = ${item.ProductStatus}, ProductDeliveryDate = now() where ID = ${item.ID} and CompanyID = ${CompanyID}`)
                }
            }

            const [updateMaster] = await mysql2.pool.query(`update billmaster set ProductStatus = '${productStatus}' where ID = ${BillMasterID} and CompanyID = ${CompanyID}`)

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    updateBill: async (req, res, next) => {
        const connection = await mysql.connection();
        try {

            ("updateBill=============================>", req);

            return
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;


            const { billMaseterData, billDetailData, service } = req.body;
            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data" })
            // if (billMaseterData.PaymentStatus !== "Unpaid") return res.send({ message: "You have already paid amount of this invoice, you can not add more product in this invoice" })
            // if (billMaseterData.ProductStatus !== "Pending") return res.send({ message: "You have already deliverd product of this invoice, you can not add more product in this invoice" })

            const existShop = await connection.query(`select * from shop where Status = 1 and ID = ${shopid}`)

            if (!existShop.length) {
                return res.send({ message: "You have already delete this shop" })
            }

            const doesCheckPayment = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${billMaseterData.InvoiceNo}' and BillMasterID = ${billMaseterData.ID}`)

            // if (doesCheckPayment.length > 1) {
            //     return res.send({ message: `You Can't Add Product !!, You have Already Paid Amount of this Invoice` })
            // }

            let bMasterID = billMaseterData.ID;

            const bMaster = await connection.query(`update billmaster set PaymentStatus = '${billMaseterData.PaymentStatus}' , BillDate = '${billMaseterData.BillDate}', DeliveryDate = '${billMaseterData.DeliveryDate}', Quantity = ${billMaseterData.Quantity}, DiscountAmount = ${billMaseterData.DiscountAmount}, GSTAmount = ${billMaseterData.GSTAmount}, SubTotal = ${billMaseterData.SubTotal}, AddlDiscount = ${billMaseterData.AddlDiscount}, TotalAmount = ${billMaseterData.TotalAmount}, DueAmount = ${billMaseterData.DueAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), LastUpdate = now(), TrayNo = '${billMaseterData.TrayNo}' where ID = ${bMasterID}`)

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
                        const result = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, PreOrder,Po, TransferStatus, TransferToShop, MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn,AvailableDate, GSTType, GSTPercentage, PurchaseDetailID) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Pre Order', ${ele.UnitPrice}, 0 ,0,${ele.WholeSale},${ele.UnitPrice},0, 1, 1, '', 0, '${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1, ${LoggedOnUser}, now(),  now(), '${ele.GSTType}',${ele.GSTPercentage},0)`);
                    }
                } else if (ele.Manual === 1) {
                    let count = ele.Quantity;
                    let j = 0;
                    for (j = 0; j < count; j++) {
                        const result = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Not Available','${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1,${LoggedOnUser}, now(), now(), '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.UnitPrice}, 0, 0, ${ele.WholeSale}, 0,0,0,'',0)`);
                    }

                } else {
                    let selectRows1 = await connection.query(`SELECT * FROM barcodemasternew WHERE CompanyID = ${CompanyID} AND ShopID = ${shopid} AND CurrentStatus = "Available" AND Status = 1 AND Barcode = '${ele.Barcode}' LIMIT ${ele.Quantity}`);
                    await Promise.all(
                        selectRows1.map(async (ele1) => {
                            let resultn = await connection.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn=now() Where ID = ${ele1.ID}`);
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

            // const updatePaymentMaster = await connection.query(`update paymentmaster set PayableAmount = ${billMaseterData.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            // const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${billMaseterData.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            // const savePaymentMaster = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${billMaseterData.CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Credit',now(), 'Payment Initiated', '', '', ${billMaseterData.DueAmount}, ${billMaseterData.TotalAmount - billMaseterData.DueAmount}, '',1,${LoggedOnUser}, now())`)

            // const savePaymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billMaseterData.InvoiceNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},${billMaseterData.TotalAmount - billMaseterData.DueAmount},${billMaseterData.DueAmount},'Customer','Credit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = {
                ID: bMasterID,
                CustomerID: billMaseterData.CustomerID
            }


            return res.send(response);



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

            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser, User2.Name as SalePerson FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN user AS User2 ON User2.ID = billmaster.Employee LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE  billmaster.CompanyID = ${CompanyID} ${shopId}  Order By billmaster.ID Desc `

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length

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
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })
            let { searchQuery } = Body;
            let shopId = ``

            if (shopid !== 0) {
                shopId = `and billmaster.ShopID = ${shopid}`
            }


            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser, User2.Name as SalePerson FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN user AS User2 ON User2.ID = billmaster.Employee LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE billmaster.CompanyID = ${CompanyID} and Customer1.Name like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID}  and  Customer1.MobileNo1 like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = '${CompanyID}' and billmaster.InvoiceNo like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} and Customer1.Idd like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} and Customer1.Sno like '${searchQuery}%' ${shopId}`;

            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getBillById: async (req, res, next) => {
        try {
            const response = { result: { billMaster: null, billDetail: null, service: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [billMaster] = await mysql2.pool.query(`select * from  billmaster where CompanyID =  ${CompanyID} and ID = ${ID} Order By ID Desc`)

            const [billDetail] = await mysql2.pool.query(`select billdetail.*, 0 as Sel from  billdetail where CompanyID =  ${CompanyID} and BillID = ${ID} Order By ID Desc`)

            const [service] = await mysql2.pool.query(`SELECT billservice.*, servicemaster.Name AS ServiceType  FROM  billservice  LEFT JOIN servicemaster ON servicemaster.ID = billservice.ServiceType WHERE billservice.CompanyID =  ${CompanyID} and BillID = ${ID} Order By ID Desc`)

            const gst_detail = await gstDetailBill(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.billMaster = billMaster
            if (response.result.billMaster.length) {
                response.result.billMaster[0].gst_detail = gst_detail || []
            }

            response.result.billDetail = billDetail
            response.result.service = service
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    paymentHistory: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, InvoiceNo } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })
            if (InvoiceNo === null || InvoiceNo === undefined) return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT paymentdetail.*, billmaster.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentDate AS PaymentDate, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN billmaster ON billmaster.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType IN ('Customer', 'Customer Credit') AND billmaster.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and billmaster.CompanyID = ${CompanyID} and billmaster.ShopID = ${shopid}`

            let [data] = await mysql2.pool.query(qry);

            let totalPaidAmount = 0

            let totalCred = 0
            let totalDeb = 0

            let [sumPaidCred] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as PaidAmount from paymentdetail where CompanyID = ${CompanyID} and BillMasterID = ${ID} and PaymentType = 'Customer' and Credit = 'Credit'`)
            let [sumPaidDeb] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as PaidAmount from paymentdetail where CompanyID = ${CompanyID} and BillMasterID = ${ID} and PaymentType = 'Customer' and Credit = 'Debit'`)


            if (sumPaidCred[0].PaidAmount !== null) {
                totalCred = sumPaidCred[0].PaidAmount
            }
            if (sumPaidDeb[0].PaidAmount !== null) {
                totalDeb = sumPaidDeb[0].PaidAmount
            }

            // console.log(totalCred - totalDeb, 'totalCred - totalDeb');

            // if (sumPaidDeb.length === 0) {
            //     totalPaidAmount = totalCred - totalDeb
            // }

            response.message = "data fetch sucessfully"
            response.data = data
            response.totalPaidAmount = totalPaidAmount

            let totalCreditAmount = 0
            let creditCreditAmount = 0
            let creditDebitAmount = 0

            const [credit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and Credit = 'Credit' and paymentdetail.BillID = '${InvoiceNo}'`);
            const [debit] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as CreditAmount from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Customer Credit' and Credit = 'Debit'  and paymentdetail.BillID = '${InvoiceNo}'`);

            if (credit[0].CreditAmount !== null) {
                creditCreditAmount = credit[0].CreditAmount
            }
            if (debit[0].CreditAmount !== null) {
                creditDebitAmount = debit[0].CreditAmount
            }


            totalCreditAmount = creditDebitAmount - creditCreditAmount


            response.totalCreditAmount = totalCreditAmount
            response.totalPaidAmount -= response.totalCreditAmount || 0
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    billHistoryByCustomer: async (req, res, next) => {
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
            let [data] = await mysql2.pool.query(finalQuery);
            let [sumData] = await mysql2.pool.query(SumQry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.sumData = sumData[0]

            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    billHistoryByCustomerOld: async (req, res, next) => {
        try {
            const response = { data: { customerData: null, bill: null }, success: true, message: "", totalGrandTotal: 0 }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { CustomerID } = req.body;

            if (!CustomerID || CustomerID === undefined || CustomerID === null) return res.send({ message: "Invalid Query Data" })

            const [customerData] = await mysql2.pool.query(`select customer.ID, customer.Name, customer.MobileNo1, customer.SystemID, users1.Name as CreatedPerson, shop.Name as ShopName, shop.AreaName as AreaName from customer left join user as users1 on users1.ID = customer.CreatedBy left join user as users on users.ID = customer.UpdatedBy left join shop on shop.ID = customer.ShopID where customer.Status = 1 and customer.CompanyID = '${CompanyID}' and customer.ID = ${CustomerID}`)

            if (!customerData.length) {
                return res.send({ message: "Invalid CustomerID Data" })
            }

            const [billMasterData] = await mysql2.pool.query(`select * from oldbillmaster where CompanyID = ${CompanyID} and CustomerID = ${CustomerID}`)

            const [total] = await mysql2.pool.query(`select SUM(GrandTotal) as totalGrandTotal from oldbillmaster where CompanyID = ${CompanyID} and CustomerID = ${CustomerID}`)

            if (total) {
                response.totalGrandTotal = total[0].totalGrandTotal
            }

            if (!billMasterData.length) {
                return res.send({ message: "Bill Not Found" })
            }

            for (let item of billMasterData) {

                const [billDetails] = await mysql2.pool.query(`select oldbilldetail.*, oldbillmaster.BillNo from oldbilldetail left join oldbillmaster on oldbillmaster.ID = oldbilldetail.BillMasterID where oldbilldetail.CompanyID = ${CompanyID} and oldbilldetail.BillMasterID =${item.ID}`)

                if (billDetails.length !== 0) {
                    item.billDetail = billDetails
                }
            }

            response.data.customerData = customerData[0]
            response.data.bill = billMasterData
            response.message = "data fetch successfully"
            return res.send(response);



        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    deleteBill: async (req, res, next) => {
        try {
            const response = { data: null, sumData: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${CompanyID} and Status = 1 and ID = ${ID}`)

            if (!doesExist.length) {
                return res.send({ message: "bill doesnot exist from this id " })
            }

            // old software condition
            if (doesExist[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const [doesCheckLen] = await mysql2.pool.query(`select * from billdetail where CompanyID = ${CompanyID} and Status = 1 and BillID = ${ID}`)

            console.log(doesCheckLen.length, 'doesCheckLen')

            if (doesCheckLen.length !== 0) {
                return res.send({ message: `First you'll have to delete product` })
            }

            const [deleteBill] = await mysql2.pool.query(`update billmaster set Status = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where ID = ${ID}`)

            response.message = "data delete sucessfully"
            response.data = []

            return res.send(response);


        } catch (err) {
            next(err)
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

            const [doesExist] = await mysql2.pool.query(`select * from billdetail where CompanyID = ${CompanyID} and Status = 1 and ID = ${ID}`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            const [updateBill] = await mysql2.pool.query(`update billdetail set MeasurementID = '${MeasurementID}', UpdatedBy = ${LoggedOnUser} where ID = ${ID} and CompanyID = ${CompanyID}`)

            const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set MeasurementID = '${MeasurementID}', UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where BillDetailID = ${ID} and CompanyID = ${CompanyID}`)

            response.message = "data update sucessfully"
            response.data = [{
                ID: ID,
                MeasurementID: MeasurementID
            }]

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            // return res.send({message: "coming soon !!!!"})
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData, service } = req.body

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            // if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            // if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data" })


            const [fetchBill] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${CompanyID} and ID = ${billMaseterData.ID} and Status = 1 `)

            // old software condition
            if (fetchBill[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }


            let bMaster = {
                ID: billMaseterData.ID,
                CustomerID: billMaseterData.CustomerID,
                InvoiceNo: billMaseterData.InvoiceNo,
                Quantity: billMaseterData.Quantity,
                SubTotal: billMaseterData.SubTotal,
                GSTAmount: billMaseterData.GSTAmount,
                DiscountAmount: billMaseterData.DiscountAmount,
                AddlDiscount: billMaseterData.AddlDiscount,
                AddlDiscountPercentage: billMaseterData.AddlDiscountPercentage,
                TotalAmount: billMaseterData.TotalAmount,
                DueAmount: billMaseterData.DueAmount
            }

            if (billDetailData) {

                const bDetail = {
                    ID: billDetailData.ID,
                    Quantity: billDetailData.Quantity,
                    SubTotal: billDetailData.SubTotal,
                    GSTAmount: billDetailData.GSTAmount,
                    DiscountAmount: billDetailData.DiscountAmount,
                    TotalAmount: billDetailData.TotalAmount,
                    Manual: billDetailData.Manual,
                    PreOrder: billDetailData.PreOrder
                }

                // update calculation
                // bMaster.Quantity -= bDetail.Quantity
                // bMaster.SubTotal -= bDetail.SubTotal
                // bMaster.GSTAmount -= bDetail.GSTAmount
                // bMaster.DiscountAmount -= bDetail.DiscountAmount
                // bMaster.TotalAmount -= bDetail.TotalAmount
                // bMaster.DueAmount -= bDetail.TotalAmount

                // delete bill product

                const [delProduct] = await mysql2.pool.query(`update billdetail set Status = 0, UpdatedBy=${LoggedOnUser} where ID = ${bDetail.ID}`)
                console.log(connected("Bill Detail Update SuccessFUlly !!!"));

                if (bDetail.Manual === 1) {
                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Not Available' limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));
                }

                if (bDetail.PreOrder === 1) {
                    const [fetchBarcode] = await mysql2.pool.query(`select * from barcodemasternew where BillDetailID = ${bDetail.ID} and PurchaseDetailID = 0 and CurrentStatus = 'Pre Order' limit ${bDetail.Quantity}`);

                    // if length available it means product in only pre order not purchsed right now, you have to only delete
                    if (fetchBarcode.length && fetchBarcode.length === bDetail.Quantity) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Pre Order' and PurchaseDetailID = 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }
                    // if product is in preorder and has been purchased so we have to update for availlable
                    else if (!fetchBarcode.length) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set BillDetailID=0,CurrentStatus='Available' where BillDetailID = ${bDetail.ID} and PurchaseDetailID != 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }
                }

                if (bDetail.Manual === 0 && bDetail.PreOrder === 0) {
                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus='Available', BillDetailID=0 where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Sold' limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));
                }
            }

            if (service) {

                const bService = {
                    ID: service.ID,
                    BillID: service.BillID,
                    GSTAmount: service.GSTAmount,
                    Price: service.Price,
                    TotalAmount: service.TotalAmount
                }
                // update calculation
                // bMaster.SubTotal -= bService.Price
                // bMaster.GSTAmount -= bService.GSTAmount
                // bMaster.TotalAmount -= bService.TotalAmount
                // bMaster.DueAmount -= bService.TotalAmount

                // delete service

                const [delService] = await mysql2.pool.query(`update billservice set Status = 0 where ID = ${bService.ID}`)

                console.log(connected("Bill Service Update SuccessFUlly !!!"));
            }

            let DueAmount = 0
            let CreditAmount = 0
            DueAmount = bMaster.DueAmount
            let paymentStatus = 'Unpaid'
            if (DueAmount < 0) {
                CreditAmount = Math.abs(DueAmount)
                bMaster.DueAmount = 0
                DueAmount = 0
            }

            if (DueAmount === 0) {
                paymentStatus = 'Paid'
            }

            // update bill naster
            const [updateMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${paymentStatus}', Quantity=${bMaster.Quantity}, SubTotal=${bMaster.SubTotal}, GSTAmount=${bMaster.GSTAmount}, DiscountAmount=${bMaster.DiscountAmount}, TotalAmount=${bMaster.TotalAmount}, DueAmount=${bMaster.DueAmount}, AddlDiscount=${bMaster.AddlDiscount}, AddlDiscountPercentage=${bMaster.AddlDiscountPercentage} where ID=${bMaster.ID}`)
            console.log(connected("Bill Master Update SuccessFUlly !!!"));


            // if payment length zero we have to update payment
            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${bMaster.InvoiceNo}' and BillMasterID = ${bMaster.ID}`)

            if (doesCheckPayment.length === 1) {
                //  update payment
                const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${bMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID}`)

                const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${bMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID}`)
                console.log(connected("Payment Update SuccessFUlly !!!"));
            }

            // generate credit note
            console.log(CreditAmount, 'CreditAmount');
            if (CreditAmount !== 0) {
                const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${bMaster.CustomerID}, ${CompanyID}, ${shopid},'Customer', 'Debit', now(), 'Customer Credit', '', '${bMaster.InvoiceNo}', ${CreditAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`);

                const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID, BillID, BillMasterID, CustomerID, CompanyID, Amount, DueAmount, PaymentType, Credit, Status, CreatedBy, CreatedOn)values(${savePaymentMaster.insertId},'${bMaster.InvoiceNo}',${bMaster.ID}, ${bMaster.CustomerID},${CompanyID}, ${CreditAmount}, 0, 'Customer Credit', 'Debit', 1,${LoggedOnUser}, '${req.headers.currenttime}')`);

                console.log(connected("Customer Credit Update SuccessFUlly !!!"));
            }

            response.data = [{
                "CustomerID": bMaster.CustomerID,
                "BillMasterID": bMaster.ID
            }]
            response.message = "success";

            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    cancelProduct: async (req, res, next) => {
        try {
            // return res.send({message: "coming soon !!!!"})
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData, service } = req.body

            if (!billMaseterData) return res.send({ message: "Invalid Query Data1" })
            // if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            // if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data2" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data3" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data4" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data5" })


            const [fetchBill] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${CompanyID} and ID = ${billMaseterData.ID} and Status = 1 `)

            // old software condition
            if (fetchBill[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            let bMaster = {
                ID: billMaseterData.ID,
                CustomerID: billMaseterData.CustomerID,
                InvoiceNo: billMaseterData.InvoiceNo,
                Quantity: billMaseterData.Quantity,
                SubTotal: billMaseterData.SubTotal,
                GSTAmount: billMaseterData.GSTAmount,
                DiscountAmount: billMaseterData.DiscountAmount,
                AddlDiscount: billMaseterData.AddlDiscount,
                AddlDiscountPercentage: billMaseterData.AddlDiscountPercentage,
                TotalAmount: billMaseterData.TotalAmount,
                DueAmount: billMaseterData.DueAmount
            }

            if (billDetailData) {

                const bDetail = {
                    ID: billDetailData.ID,
                    Quantity: billDetailData.Quantity,
                    SubTotal: billDetailData.SubTotal,
                    GSTAmount: billDetailData.GSTAmount,
                    DiscountAmount: billDetailData.DiscountAmount,
                    TotalAmount: billDetailData.TotalAmount,
                    Manual: billDetailData.Manual,
                    PreOrder: billDetailData.PreOrder
                }

                // update calculation
                // bMaster.Quantity -= bDetail.Quantity
                // bMaster.SubTotal -= bDetail.SubTotal
                // bMaster.GSTAmount -= bDetail.GSTAmount
                // bMaster.DiscountAmount -= bDetail.DiscountAmount
                // bMaster.TotalAmount -= bDetail.TotalAmount
                // bMaster.DueAmount -= bDetail.TotalAmount

                // delete bill product

                const [delProduct] = await mysql2.pool.query(`update billdetail set Status = 0, CancelStatus = 0, UpdatedBy=${LoggedOnUser} where ID = ${bDetail.ID}`)
                console.log(connected("Bill Detail Update SuccessFUlly !!!"));

                if (bDetail.Manual === 1) {
                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Not Available' limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));
                }

                if (bDetail.PreOrder === 1) {
                    const [fetchBarcode] = await mysql2.pool.query(`select * from barcodemasternew where BillDetailID = ${bDetail.ID} and PurchaseDetailID = 0 and CurrentStatus = 'Pre Order' limit ${bDetail.Quantity}`);

                    // if length available it means product in only pre order not purchsed right now, you have to only delete
                    if (fetchBarcode.length && fetchBarcode.length === bDetail.Quantity) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Pre Order' and PurchaseDetailID = 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }
                    // if product is in preorder and has been purchased so we have to update for availlable
                    else if (!fetchBarcode.length) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set BillDetailID=0,CurrentStatus='Available' where BillDetailID = ${bDetail.ID} and PurchaseDetailID != 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }
                }

                if (bDetail.Manual === 0 && bDetail.PreOrder === 0) {
                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus='Available', BillDetailID=0 where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Sold' limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));
                }
            }

            if (service) {

                const bService = {
                    ID: service.ID,
                    BillID: service.BillID,
                    GSTAmount: service.GSTAmount,
                    Price: service.Price,
                    TotalAmount: service.TotalAmount
                }
                // update calculation
                // bMaster.SubTotal -= bService.Price
                // bMaster.GSTAmount -= bService.GSTAmount
                // bMaster.TotalAmount -= bService.TotalAmount
                // bMaster.DueAmount -= bService.TotalAmount

                // delete service

                const [delService] = await mysql2.pool.query(`update billservice set Status = 0 where ID = ${bService.ID}`)

                console.log(connected("Bill Service Update SuccessFUlly !!!"));
            }

            let DueAmount = 0
            let CreditAmount = 0
            DueAmount = bMaster.DueAmount
            let paymentStatus = 'Unpaid'
            if (DueAmount < 0) {
                CreditAmount = Math.abs(DueAmount)
                bMaster.DueAmount = 0
                DueAmount = 0
            }

            if (DueAmount === 0) {
                paymentStatus = 'Paid'
            }

            // update bill naster
            const [updateMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${paymentStatus}', Quantity=${bMaster.Quantity}, SubTotal=${bMaster.SubTotal}, GSTAmount=${bMaster.GSTAmount}, DiscountAmount=${bMaster.DiscountAmount}, TotalAmount=${bMaster.TotalAmount}, DueAmount=${bMaster.DueAmount}, AddlDiscount=${bMaster.AddlDiscount}, AddlDiscountPercentage=${bMaster.AddlDiscountPercentage} where ID=${bMaster.ID}`)
            console.log(connected("Bill Master Update SuccessFUlly !!!"));


            // if payment length zero we have to update payment
            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${bMaster.InvoiceNo}' and BillMasterID = ${bMaster.ID}`)

            if (doesCheckPayment.length === 1) {
                //  update payment
                const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${bMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

                const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${bMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)
                console.log(connected("Payment Update SuccessFUlly !!!"));
            }

            // generate credit note
            console.log(CreditAmount, 'CreditAmount');
            if (CreditAmount !== 0) {
                const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${bMaster.CustomerID}, ${CompanyID}, ${shopid},'Customer', 'Debit', now(), 'Customer Credit', '', '${bMaster.InvoiceNo}', ${CreditAmount}, 0, '',1,${LoggedOnUser}, now())`);

                const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID, BillID, BillMasterID, CustomerID, CompanyID, Amount, DueAmount, PaymentType, Credit, Status, CreatedBy, CreatedOn)values(${savePaymentMaster.insertId},'${bMaster.InvoiceNo}',${bMaster.ID}, ${bMaster.CustomerID},${CompanyID}, ${CreditAmount}, 0, 'Customer Credit', 'Debit', 1,${LoggedOnUser}, now())`);

                console.log(connected("Customer Credit Update SuccessFUlly !!!"));
            }

            response.data = [{
                "CustomerID": bMaster.CustomerID,
                "BillMasterID": bMaster.ID
            }]
            response.message = "success";

            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    updateProduct: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { billMaseterData, billDetailData } = req.body


            console.log(req.body);

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === undefined) return res.send({ message: "Invalid Query Data" })

            let bMasterID = billMaseterData.ID;

            const [fetchBill] = await mysql2.pool.query(`select * from billmaster where CompanyID = ${CompanyID} and ID = ${bMasterID} and Status = 1 `)

            // old software condition
            if (fetchBill[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const [fetchComm] = await mysql2.pool.query(`select * from commissiondetail where BillMasterID = ${bMasterID} and CommissionMasterID != 0`)

            if (fetchComm.length) {
                return res.send({ success: false, message: "you can not add more product in this invoice because you have already settled commission of this invoice" })
            }

            const [bMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${billMaseterData.PaymentStatus}' , BillDate = '${billMaseterData.BillDate}', DeliveryDate = '${billMaseterData.DeliveryDate}', Quantity = ${billMaseterData.Quantity}, DiscountAmount = ${billMaseterData.DiscountAmount}, GSTAmount = ${billMaseterData.GSTAmount}, SubTotal = ${billMaseterData.SubTotal}, AddlDiscount = ${billMaseterData.AddlDiscount}, TotalAmount = ${billMaseterData.TotalAmount}, DueAmount = ${billMaseterData.DueAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), LastUpdate = now(), TrayNo = '${billMaseterData.TrayNo}',RoundOff = ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, AddlDiscountPercentage = ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0} where ID = ${bMasterID}`)

            console.log(connected("BillMaster Update SuccessFUlly !!!"));

            const billDetail = billDetailData[0];

            const [update] = await mysql2.pool.query(`update billdetail set UnitPrice = ${billDetail.UnitPrice}, DiscountPercentage = ${billDetail.DiscountPercentage}, DiscountAmount = ${billDetail.DiscountAmount}, GSTPercentage = ${billDetail.GSTPercentage}, GSTAmount = ${billDetail.GSTAmount}, GSTType = '${billDetail.GSTType}', SubTotal = ${billDetail.SubTotal}, TotalAmount = ${billDetail.TotalAmount}, Remark = '${billDetail.Remark}', UpdatedBy = ${LoggedOnUser} where ID = ${billDetail.ID} and CompanyID = ${CompanyID}`)


            //  update payment

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${billMaseterData.InvoiceNo}' and BillMasterID = ${billMaseterData.ID}`)

            const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${billMaseterData.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0, DueAmount = ${billMaseterData.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)


            // save employee commission

            if (billMaseterData.Employee !== 0 && billMaseterData.Employee !== undefined && billMaseterData.Employee !== null) {
                const saveEmpCommission = await updateCommission(CompanyID, 'Employee', billMaseterData.Employee, billMaseterData.ID, billMaseterData, LoggedOnUser)
            }

            // save doctor commission

            if (billMaseterData.Doctor !== 0 && billMaseterData.Doctor !== undefined && billMaseterData.Doctor !== null) {
                const saveDocCommission = await updateCommission(CompanyID, 'Doctor', billMaseterData.Doctor, billMaseterData.ID, billMaseterData, LoggedOnUser)
            }

            console.log(connected("BillDetail Update SuccessFUlly !!!"));
            response.message = "success";
            return res.send(response)

        } catch (err) {
            next(err)
        }
    },
    billPrint: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const printdata = req.body;
            // console.log(printdata.mode);
            const Company = req.body.Company;
            const CompanySetting = req.body.CompanySetting;
            const CompanyWelComeNote = JSON.parse(req.body.CompanySetting.WelComeNote);
            const Shop = req.body.Shop;
            const ShopWelComeNote = JSON.parse(req.body.Shop.WelcomeNote);
            const User = req.body.User;
            const Customer = req.body.customer;
            const BillMaster = req.body.billMaster;

            req.body.billItemList = req.body.billItemList.filter((element) => {
                return element.Status !== 0;
            });

            req.body.serviceList = req.body.serviceList.filter((element) => {
                return element.Status !== 0;
            });

            
            // lensbird subtotal 
            let subtotals = 0
            const x = [];

            req.body.billItemList.forEach((element) => {
                if (element.MeasurementID !== "null" && element.MeasurementID !== "undefined" && element.MeasurementID !== undefined && element.MeasurementID !== '' && x.length === 0) {
                    x.push(JSON.parse(element.MeasurementID));
                }
                subtotals += element.UnitPrice * element.Quantity
            });

            printdata.subtotals = subtotals
            printdata.EyeMeasurement = x[0];
            const BillItemList = req.body.billItemList;
            const ServiceList = req.body.serviceList;
            const PaidList = req.body.paidList;
            const UnpaidList = req.body.unpaidList;

            const [billformate] = await mysql2.pool.query(`select * from billformate where CompanyID = ${CompanyID}`)
            const [Employee] = await mysql2.pool.query(`select * from user where CompanyID = ${CompanyID} and ID = ${BillMaster.Employee}`)
            printdata.billformate = billformate[0]
            printdata.BillHeader = `${Number(printdata.billformate.BillHeader)}`;
            printdata.Color = printdata.billformate.Color;
            printdata.ShopNameBold = `${Number(printdata.billformate.ShopNameBold)}`;
            printdata.HeaderWidth = `${Number(printdata.billformate.HeaderWidth)}px`;
            printdata.HeaderHeight = `${Number(printdata.billformate.HeaderHeight)}px`;
            printdata.HeaderPadding = `${Number(printdata.billformate.HeaderPadding)}px`;
            printdata.HeaderMargin = `${Number(printdata.billformate.HeaderMargin)}px`;
            printdata.ImageWidth = `${Number(printdata.billformate.ImageWidth)}px`;
            printdata.ImageHeight = `${Number(printdata.billformate.ImageHeight)}px`;
            printdata.ImageAlign = printdata.billformate.ImageAlign;
            printdata.ShopNameFont = `${Number(printdata.billformate.ShopNameFont)}px`;
            printdata.ShopDetailFont = `${Number(printdata.billformate.ShopDetailFont)}px`;
            printdata.LineSpace = `${Number(printdata.billformate.LineSpace)}px`;
            printdata.CustomerFont = `${Number(printdata.billformate.CustomerFont)}px`;
            printdata.CustomerLineSpace = `${Number(printdata.billformate.CustomerLineSpace)}px`;
            printdata.TableHeading = `${Number(printdata.billformate.TableHeading)}px`;
            printdata.TableBody = `${Number(printdata.billformate.TableBody)}px`;
            printdata.NoteFont = `${Number(printdata.billformate.NoteFont)}px`;
            printdata.WaterMarkWidth = `${Number(printdata.billformate.WaterMarkWidth)}px`;
            printdata.WaterMarkHeigh = `${Number(printdata.billformate.WaterMarkHeigh)}px`;
            printdata.WaterMarkOpecity = `${Number(printdata.billformate.WaterMarkOpecity)}`;
            printdata.WaterMarkLeft = `${Number(printdata.billformate.WaterMarkLeft)}%`;
            printdata.WaterMarkRight = `${Number(printdata.billformate.WaterMarkRight)}%`;

            printdata.company = Company
            printdata.companysetting = CompanySetting
            printdata.companyWelComeNote = CompanyWelComeNote
            printdata.shopdetails = Shop
            printdata.shopWelComeNote = ShopWelComeNote
            printdata.user = User
            printdata.customer = Customer
            printdata.billMaster = BillMaster
            printdata.billItemList = BillItemList
            printdata.serviceList = ServiceList
            printdata.paidlist = PaidList
            printdata.unpaidlist = UnpaidList
            printdata.employee = Employee[0].Name
            printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;
            // printdata.welcomeNoteCompany = printdata.companyWelComeNote.filter(ele => ele.NoteType === "retail");
            printdata.recivePayment = printdata.paidlist.reduce((total, e) => {
                if (e.Type === 'Credit') {
                    return total + e.Amount;
                } else {
                    return total - e.Amount;
                }
            }, 0);

            printdata.CurrentInvoiceBalance = printdata.unpaidlist.reduce((total, em) => {
                if (printdata.billMaster.InvoiceNo === em.InvoiceNo) {
                    return total + em.DueAmount;
                }
                return total;
            }, 0);
            
            printdata.DueAmount = printdata.unpaidlist.reduce((total, item) => total + item.DueAmount, 0);
            printdata.SavedDiscount = printdata.billMaster.DiscountAmount + printdata.billMaster.AddlDiscount
            printdata.billMaster.BillDate = moment(printdata.billMaster.BillDate).format("DD-MM-YYYY")
            printdata.billMaster.DeliveryDate = moment(printdata.billMaster.DeliveryDate).format("DD-MM-YYYY")
            printdata.billMaster.PaymentStatus = printdata.mode === "Invoice" ? "Unpaid" : "Paid";

            printdata.invoiceNo = printdata.shopdetails.BillName.split("/")[0]
            printdata.TotalValue = printdata.shopdetails.BillName.split("/")[1]
            printdata.BillValue = printdata.shopdetails.BillName.split("/")[2]
            printdata.CashMemo = printdata.shopdetails.BillName.split("/")[3]
            if(printdata.BillValue === '' || printdata.BillValue == undefined){
                printdata.BillValue = 'Tax Invoice'
            }
            if(printdata.CashMemo === '' || printdata.CashMemo == undefined){
                printdata.CashMemo = 'Cash Memo'
            }

            printdata.bill = printdata.mode === "Invoice" ? printdata.CashMemo : printdata.BillValue;
            printdata.welComeNoteShop = printdata.shopWelComeNote.filter((ele) => {
                if (printdata.shopdetails.WholesaleBill == "true" && ele.NoteType === "wholesale") {
                    return true;
                } else if (printdata.shopdetails.RetailBill == "true" &&  ele.NoteType === "retail") {
                    return true;
                }
                return false;
            });

         
            printdata.billItemList = printdata.billItemList.map((element) => {
                if (element.Status === 1) {
                    printdata.GSTTypes = element.GSTType;
                    if (element.GSTType.toUpperCase() === "CGST-SGST") {
                        return {
                            ...element,
                            GSTPercentage: (element.GSTPercentage / 2) + '%',
                            GSTAmount: (element.GSTAmount / 2).toFixed(2),
                        };
                    }
                }
                return element;
            });

            printdata.serviceList = printdata.serviceList.map((element) => {
                if (element.Status === 1) {
                    printdata.GSTTypes = element.GSTType;
                    if (element.GSTType.toUpperCase() === "CGST-SGST") {
                        return {
                            ...element,
                            GSTPercentage: (element.GSTPercentage / 2) + '%',
                            GSTAmount: (element.GSTAmount / 2).toFixed(2),
                        };
                    }
                }
                return element;
            });

            printdata.LogoURL = clientConfig.appURL + printdata.shopdetails.LogoURL;
            printdata.WaterMark = clientConfig.appURL + printdata.shopdetails.WaterMark;

            let BillFormat = ''
            BillFormat = printdata.CompanySetting.BillFormat;
            let fileName = "";
            const file = 'Bill' + '-' + printdata.billMaster.ID + '-'  + CompanyID + ".pdf";
            const formatName = BillFormat;
            fileName = "uploads/" + file;


            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        format: "A4",
                        orientation: "portrait",
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            console.log(file, 'file');
                            res.json(file);

                            // res.json(updateUrl);
                        }
                    });
                }
            });
        } catch (err) {
            next(err)
        }
    },

    orderFormPrint: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const printdata = req.body;
            const MeasurementID = JSON.parse(req.body.data.MeasurementID);
            const Company = req.body.Company;
            const CompanySetting = req.body.CompanySetting;
            const CompanyWelComeNote = JSON.parse(req.body.CompanySetting.WelComeNote);
            const Shop = req.body.Shop;
            const ShopWelComeNote = JSON.parse(req.body.Shop.WelcomeNote);
            const User = req.body.User;
            const Customer = req.body.customer;
            const BillMaster = req.body.billMaster;
            req.body.billItemList = req.body.billItemList.filter((element) => {
                return element.Status !== 0;
            });
            const BillItemList = req.body.billItemList;
            const PaidList = req.body.paidList;
            const UnpaidList = req.body.unpaidList;

            const [billformate] = await mysql2.pool.query(`select * from billformate where CompanyID = ${CompanyID}`)
            printdata.billformate = billformate[0]
            printdata.BillHeader = `${Number(printdata.billformate.BillHeader)}`;
            printdata.Color = printdata.billformate.Color;
            printdata.ShopNameBold = `${Number(printdata.billformate.ShopNameBold)}`;
            printdata.HeaderWidth = `${Number(printdata.billformate.HeaderWidth)}px`;
            printdata.HeaderHeight = `${Number(printdata.billformate.HeaderHeight)}px`;
            printdata.HeaderPadding = `${Number(printdata.billformate.HeaderPadding)}px`;
            printdata.HeaderMargin = `${Number(printdata.billformate.HeaderMargin)}px`;
            printdata.ImageWidth = `${Number(printdata.billformate.ImageWidth)}px`;
            printdata.ImageHeight = `${Number(printdata.billformate.ImageHeight)}px`;
            printdata.ImageAlign = printdata.billformate.ImageAlign;
            printdata.ShopNameFont = `${Number(printdata.billformate.ShopNameFont)}px`;
            printdata.ShopDetailFont = `${Number(printdata.billformate.ShopDetailFont)}px`;
            printdata.LineSpace = `${Number(printdata.billformate.LineSpace)}px`;
            printdata.CustomerFont = `${Number(printdata.billformate.CustomerFont)}px`;
            printdata.CustomerLineSpace = `${Number(printdata.billformate.CustomerLineSpace)}px`;
            printdata.TableHeading = `${Number(printdata.billformate.TableHeading)}px`;
            printdata.TableBody = `${Number(printdata.billformate.TableBody)}px`;
            printdata.NoteFont = `${Number(printdata.billformate.NoteFont)}px`;
            printdata.NoteLineSpace = `${Number(printdata.billformate.NoteLineSpace)}px`;
            printdata.billformate = billformate[0]

            printdata.company = Company
            printdata.companysetting = CompanySetting
            printdata.companyWelComeNote = CompanyWelComeNote
            printdata.shopdetails = Shop
            printdata.shopWelComeNote = ShopWelComeNote
            printdata.user = User
            printdata.customer = Customer
            printdata.billMaster = BillMaster
            printdata.billItemList = BillItemList
            printdata.paidlist = PaidList
            printdata.unpaidlist = UnpaidList
            printdata.Measurement = MeasurementID[0]
            printdata.LogoURL = clientConfig.appURL + printdata.shopdetails.LogoURL;

            var recivePayment = 0;
            if (printdata.paidlist) {
                for (const item of printdata.paidlist) {
                    recivePayment = +recivePayment + item.Amount;
                }
            }
            printdata.recivePayment = recivePayment;

            let fileName = "";
            let file = "";
            let formatName = "";
            if (printdata.company.ID == 20) {
                file = "billOrder_form.ejs" + ".pdf";
                formatName = "billOrder_form.ejs";
            } else {
                file = "OrderForm.ejs" + ".pdf";
                formatName = "OrderForm.ejs";
            }
            fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        format: "A4",
                        orientation: "portrait",
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });
        } catch (err) {
            next(err)
        }
    },

    creditNotePrint: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const printdata = req.body;
            const Company = req.body.Company;
            const CompanySetting = req.body.CompanySetting;
            const CompanyWelComeNote = JSON.parse(req.body.CompanySetting.WelComeNote);
            const Shop = req.body.Shop;
            const ShopWelComeNote = JSON.parse(req.body.Shop.WelcomeNote);
            const User = req.body.User;
            const Customer = req.body.customer;
            const BillMaster = req.body.billMaster;
            const CustomerCredit = req.body.CustomerCredit;

            req.body.billItemList = req.body.billItemList.filter((element) => {
                return element.Status !== 0;
            });
            const BillItemList = req.body.billItemList;
            req.body.paidList = req.body.paidList.filter((element) => {
                return element.PaymentMode === 'Customer Credit';
            });

            const PaidList = req.body.paidList;
            const UnpaidList = req.body.unpaidList;

            printdata.company = Company
            printdata.companysetting = CompanySetting
            printdata.companyWelComeNote = CompanyWelComeNote
            printdata.shopdetails = Shop
            printdata.shopWelComeNote = ShopWelComeNote
            printdata.user = User
            printdata.customer = Customer
            printdata.billMaster = BillMaster
            printdata.billItemList = BillItemList
            printdata.paidlist = PaidList
            printdata.unpaidlist = UnpaidList
            printdata.customerCredit = CustomerCredit
            printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;

            const [billformate] = await mysql2.pool.query(`select * from billformate where CompanyID = ${CompanyID}`)
            printdata.billformate = billformate[0]
            printdata.BillHeader = `${Number(printdata.billformate.BillHeader)}`;
            printdata.Color = printdata.billformate.Color;
            printdata.ShopNameBold = `${Number(printdata.billformate.ShopNameBold)}`;
            printdata.HeaderWidth = `${Number(printdata.billformate.HeaderWidth)}px`;
            printdata.HeaderHeight = `${Number(printdata.billformate.HeaderHeight)}px`;
            printdata.HeaderPadding = `${Number(printdata.billformate.HeaderPadding)}px`;
            printdata.HeaderMargin = `${Number(printdata.billformate.HeaderMargin)}px`;
            printdata.ImageWidth = `${Number(printdata.billformate.ImageWidth)}px`;
            printdata.ImageHeight = `${Number(printdata.billformate.ImageHeight)}px`;
            printdata.ImageAlign = printdata.billformate.ImageAlign;
            printdata.ShopNameFont = `${Number(printdata.billformate.ShopNameFont)}px`;
            printdata.ShopDetailFont = `${Number(printdata.billformate.ShopDetailFont)}px`;
            printdata.LineSpace = `${Number(printdata.billformate.LineSpace)}px`;
            printdata.CustomerFont = `${Number(printdata.billformate.CustomerFont)}px`;
            printdata.CustomerLineSpace = `${Number(printdata.billformate.CustomerLineSpace)}px`;
            printdata.TableHeading = `${Number(printdata.billformate.TableHeading)}px`;
            printdata.TableBody = `${Number(printdata.billformate.TableBody)}px`;
            printdata.NoteFont = `${Number(printdata.billformate.NoteFont)}px`;
            printdata.NoteLineSpace = `${Number(printdata.billformate.NoteLineSpace)}px`;
            printdata.billformate = billformate[0]

            let total = 0;

            printdata.paidlist.forEach(ee => {
                if (ee.Type === 'Debit') {
                    total = total + ee.Amount
                } else {
                    total = total - ee.Amount
                }
            })
            printdata.total = total
               
            let fileName = "";
            const file = "CreditNote.ejs" + ".pdf";
            const formatName = "CreditNote.ejs";
            fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        format: "A4",
                        orientation: "portrait",
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });
        } catch (err) {
            next(err)
        }
    },

    billByCustomer: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CustomerID, BillMasterID } = req.body

            console.log("billByCustomer =======================", CustomerID, BillMasterID);
            if (CustomerID == null || CustomerID == undefined || CustomerID == 0 || CustomerID == "") return res.send({ message: "Invalid Query Data" })

            let param = ``
            if (BillMasterID === null || BillMasterID === undefined || BillMasterID === 0 || BillMasterID === "") {
                param = ``
            } else {
                param = ` and billmaster.ID = ${BillMasterID}`
            }

            let [data] = await mysql2.pool.query(`select billmaster.ID, billmaster.InvoiceNo, billmaster.TotalAmount, billmaster.DueAmount from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and ShopID = ${shopid} and PaymentStatus = 'Unpaid' and  billmaster.DueAmount != 0  ${param}`)

            response.data = data
            const [totalDueAmount] = await mysql2.pool.query(`select SUM(billmaster.DueAmount) as totalDueAmount from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and ShopID = ${shopid} and PaymentStatus = 'Unpaid'  ${param}  order by ID desc`)

            const [creditCreditAmount] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as totalAmount from paymentdetail where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and PaymentType = 'Customer Credit' and Credit = 'Credit'`)

            const [creditDebitAmount] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as totalAmount from paymentdetail where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and PaymentType = 'Customer Credit' and Credit = 'Debit'`)

            response.totalDueAmount = 0;
            response.creditCreditAmount = 0;
            response.creditDebitAmount = 0;

            if (totalDueAmount[0].totalDueAmount !== null) {
                response.totalDueAmount = totalDueAmount[0].totalDueAmount
            }
            if (creditCreditAmount[0].totalAmount !== null) {
                response.creditCreditAmount = creditCreditAmount[0].totalAmount
            }
            if (creditDebitAmount[0].totalAmount !== null) {
                response.creditDebitAmount = creditDebitAmount[0].totalAmount
            }
            response.creditAmount = response.creditDebitAmount - response.creditCreditAmount
            response.message = "success";

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    paymentHistoryByMasterID: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { CustomerID, BillMasterID } = req.body

            if (CustomerID === null || CustomerID === undefined || CustomerID == 0 || CustomerID === "") return res.send({ message: "Invalid Query Data" })
            if (BillMasterID === null || BillMasterID === undefined || BillMasterID == 0 || BillMasterID === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await mysql2.pool.query(`select paymentdetail.amount as Amount, paymentmaster.PaymentDate as PaymentDate, paymentmaster.PaymentType AS PaymentType,paymentmaster.PaymentMode as PaymentMode, paymentmaster.CardNo as CardNo, paymentmaster.PaymentReferenceNo as PaymentReferenceNo, paymentdetail.Credit as Type from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.CustomerID = ${CustomerID} and paymentmaster.PaymentType = 'Customer' and paymentmaster.Status = 1 and paymentdetail.BillMasterID = ${BillMasterID}`)

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    saleServiceReport: async (req, res, next) => {
        try {

            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalSubTotal": 0,
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

            qry = `select billservice.*, shop.name as ShopName, shop.AreaName as AreaName, billmaster.InvoiceNo as InvoiceNo, billmaster.BillDate, customer.Name as CustomerName, customer.MobileNo1 from billservice left join billmaster on billmaster.ID = billservice.BillID left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = billmaster.ShopID WHERE billservice.CompanyID = ${CompanyID} AND billservice.Status = 1 ` + Parem;

            let [data] = await mysql2.pool.query(qry);

            let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                    item.gst_detail = []
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.Price
                    response.calculation[0].totalSubTotal += item.SubTotal

                    if (values) {
                        values.forEach(e => {
                            if (e.GSTType === item.GSTType) {
                                e.Amount += item.GSTAmount
                                item.gst_detail.push({
                                    "GSTType": item.GSTType,
                                    "Amount": item.GSTAmount,
                                })
                            }

                            // CGST-SGST

                            if (item.GSTType === 'CGST-SGST') {

                                if (e.GSTType === 'CGST') {
                                    e.Amount += item.GSTAmount / 2
                                    item.gst_detail.push(
                                        {
                                            "GSTType": "CGST",
                                            "Amount": item.GSTAmount / 2,
                                        },
                                    )
                                }

                                if (e.GSTType === 'SGST') {
                                    e.Amount += item.GSTAmount / 2
                                    item.gst_detail.push(
                                        {
                                            "GSTType": "SGST",
                                            "Amount": item.GSTAmount / 2,
                                        },
                                    )
                                }
                            }
                        })
                    }

                }


            }

            response.calculation[0].gst_details = values;
            response.data = data
            response.message = "success";


            return res.send(response);



        } catch (err) {
            next(err)
        }

    },

    getSalereports: async (req, res, next) => {
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
                Parem + " GROUP BY billmaster.ID ORDER BY billmaster.ID DESC"

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await mysql2.pool.query(qry);

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID} ` + Parem);

            let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                            e.Amount += item.GSTAmount
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount,
                                InvoiceNo: item.InvoiceNo,
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2
                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2,
                                    InvoiceNo: item.InvoiceNo,
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2
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

            response.calculation[0].gst_details = values2;
            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0
            response.data = data
            response.message = "success";

            return res.send(response);



        } catch (err) {
            next(err)
        }

    },
    getSalereport: async (req, res, next) => {
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalAddlDiscount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalSubTotalPrice": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT billmaster.*, shop.Name AS ShopName, shop.AreaName AS AreaName, customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo,  billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN shop ON shop.ID = billmaster.ShopID  WHERE billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1 ` +
                Parem + " GROUP BY billmaster.ID ORDER BY billmaster.ID DESC"

            let [data] = await mysql2.pool.query(qry);

            // if (data.length) {
            //     data.forEach(ee => {
            //         ee.gst_detailssss = []
            //         ee.gst_details = [{ InvoiceNo: ee.InvoiceNo, }]
            //         data.push(ee)
            //     })
            // }


            let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

            gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
            if (gstTypes.length) {
                for (const item of gstTypes) {
                    if ((item.Name).toUpperCase() === 'CGST-SGST') {
                        response.calculation[0].gst_details.push(
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
                        response.calculation[0].gst_details.push({
                            GSTType: `${item.Name}`,
                            Amount: 0
                        })
                    }
                }

            }

            if (data.length) {
                for (const item of data) {
                    item.gst_detailssss = []
                    item.gst_details = [{ InvoiceNo: item.InvoiceNo, }]
                    if (item.BillType === 0) {
                        // service bill
                        const [fetchService] = await mysql2.pool.query(`select * from billservice where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchService.length) {
                            for (const item2 of fetchService) {
                                response.calculation[0].totalAmount += item2.TotalAmount
                                response.calculation[0].totalGstAmount += item2.GSTAmount
                                response.calculation[0].totalSubTotalPrice += item2.SubTotal
                                response.calculation[0].totalUnitPrice += item2.Price

                                if (item2.GSTType === 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === 'CGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                        if (e.GSTType === 'SGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                    })
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === item2.GSTType) {
                                            e.Amount += item2.GSTAmount
                                        }
                                    })
                                }
                            }
                        }
                    }

                    if (item.BillType === 1) {
                        // product & service bill

                        // service bill
                        const [fetchService] = await mysql2.pool.query(`select * from billservice where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchService.length) {
                            for (const item2 of fetchService) {

                                response.calculation[0].totalAmount += item2.TotalAmount
                                response.calculation[0].totalGstAmount += item2.GSTAmount
                                response.calculation[0].totalSubTotalPrice += item2.SubTotal
                                response.calculation[0].totalUnitPrice += item2.Price
                                if (item2.GSTType === 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {

                                        if (e.GSTType === 'CGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                        if (e.GSTType === 'SGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                    })
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === item2.GSTType) {
                                            e.Amount += item2.GSTAmount
                                        }
                                    })
                                }
                            }
                        }

                        // product bill
                        const [fetchProduct] = await mysql2.pool.query(`select * from billdetail where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchProduct.length) {
                            for (const item2 of fetchProduct) {
                                response.calculation[0].totalQty += item2.Quantity
                                response.calculation[0].totalAmount += item2.TotalAmount
                                response.calculation[0].totalGstAmount += item2.GSTAmount
                                response.calculation[0].totalUnitPrice += item2.UnitPrice
                                response.calculation[0].totalDiscount += item2.DiscountAmount
                                response.calculation[0].totalSubTotalPrice += item2.SubTotal

                                if (item2.GSTType === 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === 'CGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                        if (e.GSTType === 'SGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                    })
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === item2.GSTType) {
                                            e.Amount += item2.GSTAmount
                                        }
                                    })
                                }
                            }
                        }

                    }

                    response.calculation[0].totalAmount = response.calculation[0].totalAmount - item.AddlDiscount
                    response.calculation[0].totalAddlDiscount += item.AddlDiscount

                }
            }

            response.data = data
            response.message = "success";

            return res.send(response);



        } catch (err) {
            console.log(err)
            next(err)
        }

    },
    getOldSalereport: async (req, res, next) => {
        try {
            const response = {
                data: null, calculation: [{
                    "totalGrandTotal": 0,
                    "totalPaid": 0,
                    "totalBalance": 0,
                    "totalQty": 0
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT oldbillmaster.*, customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo,  oldbillmaster.DeliveryDate AS DeliveryDate FROM oldbillmaster LEFT JOIN customer ON customer.ID = oldbillmaster.CustomerID  WHERE oldbillmaster.CompanyID = ${CompanyID} and oldbillmaster.Status = 1 ` +
                Parem + " GROUP BY oldbillmaster.ID ORDER BY oldbillmaster.ID DESC"
            console.log(qry);
            let [data] = await mysql2.pool.query(qry);


            const [total] = await mysql2.pool.query(`select SUM(GrandTotal) as totalGrandTotal, SUM(Paid) as totalPaid, SUM(qty) as totalQty, SUM(Balance) as totalBalance from oldbillmaster where CompanyID = ${CompanyID}` + Parem)

            if (data.length && total) {
                response.calculation[0].totalBalance = total[0].totalBalance
                response.calculation[0].totalGrandTotal = total[0].totalGrandTotal
                response.calculation[0].totalPaid = total[0].totalPaid
                response.calculation[0].totalQty = total[0].totalQty
            }

            response.data = data
            response.message = "success";

            return res.send(response);



        } catch (err) {
            console.log(err)
            next(err)
        }

    },
    getOldSalereDetailport: async (req, res, next) => {
        try {
            const response = {
                data: null, calculation: [{
                    "totalGrandTotal": 0,
                    "totalPaid": 0,
                    "totalBalance": 0,
                    "totalQty": 0
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT oldbillmaster.BillNo, oldbillmaster.BillDate, oldbillmaster.DeliveryDate, oldbillmaster.Paid, oldbillmaster.Balance, oldbilldetail.*, customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo FROM oldbilldetail left join oldbillmaster on oldbillmaster.ID = oldbilldetail.BillMasterID LEFT JOIN customer ON customer.ID = oldbilldetail.CustomerID WHERE oldbillmaster.CompanyID = ${CompanyID} and oldbillmaster.Status = 1 ` + Parem
            let [data] = await mysql2.pool.query(qry);
            const [total] = await mysql2.pool.query(`select SUM(GrandTotal) as totalGrandTotal, SUM(Paid) as totalPaid, SUM(qty) as totalQty, SUM(Balance) as totalBalance from oldbillmaster where CompanyID = ${CompanyID}` + Parem)

            if (total) {
                response.calculation[0].totalBalance = total[0].totalBalance
                response.calculation[0].totalGrandTotal = total[0].totalGrandTotal
                response.calculation[0].totalPaid = total[0].totalPaid
                response.calculation[0].totalQty = total[0].totalQty
            }

            response.data = data
            response.message = "success";

            return res.send(response);



        } catch (err) {
            console.log(err)
            next(err)
        }

    },
    getSalereportsDetail: async (req, res, next) => {
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalPurchasePrice": 0,
                    "totalProfit": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT billdetail.*, customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.Status = 1 AND billdetail.CompanyID = '${CompanyID}' AND billdetail.Quantity != 0 AND shop.Status = 1 ` + Parem

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await mysql2.pool.query(qry);

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.Status = 1  AND billdetail.CompanyID = ${CompanyID} ` + Parem);

            let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                for (let item of data) {
                    item.gst_details = []
                    values2.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            e.Amount += item.GSTAmount
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2

                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2

                                item.gst_details.push({
                                    GSTType: 'SGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }
                        }
                    })

                    // profit calculation
                    item.ModifyPurchasePrice = item.PurchasePrice * item.Quantity;
                    item.Profit = item.SubTotal - (item.PurchasePrice * item.Quantity)

                    response.calculation[0].totalPurchasePrice += item.ModifyPurchasePrice
                    response.calculation[0].totalProfit += item.Profit
                }



            }
            response.calculation[0].gst_details = values2;
            response.calculation[0].totalPurchasePrice = response.calculation[0].totalPurchasePrice.toFixed(2) || 0
            response.calculation[0].totalProfit = response.calculation[0].totalProfit.toFixed(2) || 0
            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0
            response.data = data
            response.message = "success";
            return res.send(response);



        } catch (err) {
            next(err)
        }

    },
    getCancelProductReport: async (req, res, next) => {
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

            qry = `SELECT billdetail.*, customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, userOne.Name as CreatedPerson, userTwo.Name as UpdatedPerson FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee left join user as userOne on userOne.ID = billdetail.CreatedBy left join user as userTwo on userTwo.ID = billdetail.UpdatedBy WHERE billdetail.CompanyID = '${CompanyID}' AND billdetail.Quantity != 0 AND shop.Status = 1 ` + Parem

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await mysql2.pool.query(qry);

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.CompanyID = ${CompanyID} ` + Parem);

            let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                            e.Amount += item.GSTAmount
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2

                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2

                                item.gst_details.push({
                                    GSTType: 'SGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }
                        }
                    })
                }



            }

            response.calculation[0].gst_details = values2;
            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0
            response.data = data
            response.message = "success";
            return res.send(response);



        } catch (err) {
            next(err)
        }

    },

    // po

    getSupplierPo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, Parem } = req.body;

            console.log(req.body);

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })

            let masterParam = ``
            let parem = ``
            if (Parem !== undefined) {
                parem = Parem
            }
            if (ID !== 0) {
                masterParam = ` and billdetail.BillID = ${ID}`
            }

            let qry = `SELECT 0 AS Sel , barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,barcodemasternew.CurrentStatus,barcodemasternew.SupplierID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID WHERE  barcodemasternew.BillDetailID != 0 and barcodemasternew.PurchaseDetailID = 0 AND  barcodemasternew.SupplierID = 0 and billdetail.Status = 1 and barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.CurrentStatus = 'Pre Order' AND billdetail.PreOrder = 1  ${masterParam}  ${parem} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

            console.log(qry);

            const [data] = await mysql2.pool.query(qry)
            response.data = data
            response.message = "success";

            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    assignSupplierPo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Body } = req.body;

            for (const item of Body) {
                if (!item.ID || item.ID === null || item.ID === undefined) return res.send({ message: "Invalid Query Data" })
                // if (!item.SupplierID || item.SupplierID === null || item.SupplierID === undefined) return res.send({ message: "Invalid Query Data" })
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data" })
            }

            await Promise.all(
                Body.map(async (item) => {
                    const [update] = await mysql2.pool.query(`update barcodemasternew set SupplierID = ${item.SupplierID}, UpdatedOn=now() where  BillDetailID = ${item.BillDetailID}`);
                })
            )

            // for (let item of Body) {
            //     const [update] = await mysql2.pool.query(`update barcodemasternew set SupplierID = ${item.SupplierID}, UpdatedOn=now() where ID = ${item.ID}`);
            // }

            response.data = null
            response.message = "Supplier Assign SuccessFully !!!";


            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    assignSupplierDoc: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Body } = req.body;

            for (const item of Body) {
                if (!item.ID || item.ID === null || item.ID === undefined) return res.send({ message: "Invalid Query Data" })
                // if (!item.SupplierID || item.SupplierID === null || item.SupplierID === undefined) return res.send({ message: "Invalid Query Data" })
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data" })
                if (!item.SupplierDocNo || item.SupplierDocNo === null || item.SupplierDocNo === "" || item.SupplierDocNo === undefined) return res.send({ message: "Invalid Query Data" })
            }

            await Promise.all(
                Body.map(async (item) => {
                    const [update] = await mysql2.pool.query(`update barcodemasternew set SupplierDocNo = '${item.SupplierDocNo}', UpdatedOn=now() where  BillDetailID = ${item.BillDetailID}`);
                })
            )


            // for (let item of Body) {
            //     const [update] = await mysql2.pool.query(`update barcodemasternew set SupplierDocNo = '${item.SupplierDocNo}', UpdatedOn=now() where ID = ${item.ID}`);
            // }

            response.data = null
            response.message = "Supplier Doc Assign SuccessFully !!!";

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getSupplierPoList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Parem, currentPage, itemsPerPage } = req.body;


            let parem = ``
            if (Parem !== undefined) {
                parem = Parem
            }

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            let qry = `SELECT 0 AS Sel, barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,barcodemasternew.CurrentStatus,barcodemasternew.SupplierID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.PurchasePrice as UnitPrice, billdetail.Quantity, billdetail.Quantity as saleQuantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, supplier.Name as SupplierName, billdetail.WholeSale, billdetail.Manual, billdetail.PreOrder,barcodemasternew.WholeSalePrice, barcodemasternew.RetailPrice, barcodemasternew.SupplierDocNo  FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN supplier on supplier.ID = barcodemasternew.SupplierID WHERE  barcodemasternew.BillDetailID != 0 and barcodemasternew.PurchaseDetailID = 0 AND  barcodemasternew.SupplierID != 0 and barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.CurrentStatus = 'Pre Order' AND billdetail.PreOrder = 1   ${parem} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            if (data.length) {
                for (let Item of data) {
                    Item.DiscountAmount = discountAmount(Item)
                    Item.SubTotal = Item.UnitPrice * Item.Quantity - Item.DiscountAmount
                    Item.GSTAmount = gstAmount(Item.SubTotal, Item.GSTPercentage)
                    Item.TotalAmount = Item.SubTotal + Item.GSTAmount
                }
            }

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length


            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    AssignSupplierPDF: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const printdata = req.body
            const productList = req.body.productList;
            printdata.productListHVD = req.body.productList;
            printdata.todaydate = moment().format("DD/MM/YYYY");

            let modifyList = [];
            let invoiceNos = [];

            productList.forEach(ell => {
                ell.InvoiceDate = moment(ell.InvoiceDate).format("DD-MM-YYYY")
                ell.DeliveryDate = moment(ell.DeliveryDate).format("DD-MM-YYYY")
                ell.s = [ell.ProductName];
                ell.R = [ell.Remark];

                if (!invoiceNos.includes(ell.InvoiceNo)) {
                    invoiceNos.push(ell.InvoiceNo);
                    modifyList.push(ell);
                } else {
                    const existingItem = modifyList.find(item => item.InvoiceNo === ell.InvoiceNo);

                    if (!existingItem.s.some(obj => obj.ProductName === ell.ProductName)) {
                        existingItem.s.push(ell.ProductName);
                    }
                    if (!existingItem.R.some(obj => obj.Remark === ell.Remark)) {
                        existingItem.R.push(ell.Remark);
                    }
                }

            });

            printdata.productList = modifyList

            const [shopdetails] = await mysql2.pool.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await mysql2.pool.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [billformate] = await mysql2.pool.query(`select * from billformate where CompanyID = ${CompanyID}`)

            printdata.shopdetails = shopdetails[0]
            printdata.companysetting = companysetting[0]
            printdata.billformate = billformate[0]

            printdata.BillHeader = `${Number(printdata.billformate.BillHeader)}`;
            printdata.Color = printdata.billformate.Color;
            printdata.ShopNameBold = `${Number(printdata.billformate.ShopNameBold)}`;
            printdata.HeaderWidth = `${Number(printdata.billformate.HeaderWidth)}px`;
            printdata.HeaderHeight = `${Number(printdata.billformate.HeaderHeight)}px`;
            printdata.HeaderPadding = `${Number(printdata.billformate.HeaderPadding)}px`;
            printdata.HeaderMargin = `${Number(printdata.billformate.HeaderMargin)}px`;
            printdata.ImageWidth = `${Number(printdata.billformate.ImageWidth)}px`;
            printdata.ImageHeight = `${Number(printdata.billformate.ImageHeight)}px`;
            printdata.ImageAlign = printdata.billformate.ImageAlign;
            printdata.ShopNameFont = `${Number(printdata.billformate.ShopNameFont)}px`;
            printdata.ShopDetailFont = `${Number(printdata.billformate.ShopDetailFont)}px`;
            printdata.LineSpace = `${Number(printdata.billformate.LineSpace)}px`;
            printdata.CustomerFont = `${Number(printdata.billformate.CustomerFont)}px`;
            printdata.CustomerLineSpace = `${Number(printdata.billformate.CustomerLineSpace)}px`;
            printdata.TableHeading = `${Number(printdata.billformate.TableHeading)}px`;
            printdata.TableBody = `${Number(printdata.billformate.TableBody)}px`;
            printdata.NoteFont = `${Number(printdata.billformate.NoteFont)}px`;
            printdata.NoteLineSpace = `${Number(printdata.billformate.NoteLineSpace)}px`;


            var fileName = "";

            if (!printdata.companysetting.LogoURL) {
                printdata.LogoURL = clientConfig.appURL + '../assest/no-image.png';
            } else {
                printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;
            }

            if (CompanyID === 0) {
                var formatName = "AssignSupplierPDF.ejs"
            } else {
                var formatName = "AssignLensPDF.ejs";
            }

            var file = 'Supplier' + "_" + CompanyID + ".pdf";
            fileName = "uploads/" + file;

            console.log(fileName);

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        header: {
                            height: "0mm"
                        },
                        footer: {
                            height: "0mm",
                            contents: {
                                last: ``,
                            },
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

            return

        } catch (err) {
            next(err)
        }

    },

    saveConvertPurchase: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            let { PurchaseMaster, PurchaseDetail } = req.body
            PurchaseDetail = JSON.parse(req.body.PurchaseDetail)

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data1" })

            if (PurchaseMaster.ID !== 0) return res.send({ message: "Invalid Query Data2" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity3" })


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }

            if (PurchaseDetail.length === 0) {
                return res.send({ message: "Invalid Query Data purchaseDetail" })
            }

            // for (let item of PurchaseDetail) {
            //     if (!item.ID || item.ID === null || item.ID === undefined) return res.send({ message: "Invalid Query Data4" })
            //     if (!item.SupplierID || item.SupplierID === null || item.SupplierID === undefined) return res.send({ message: "Invalid Query Data5" })
            //     if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data6" })
            // }

            const purchase = {
                ID: null,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: shopid,
                PurchaseDate: PurchaseMaster.PurchaseDate ? PurchaseMaster.PurchaseDate : now(),
                PaymentStatus: PurchaseMaster.PaymentStatus,
                InvoiceNo: PurchaseMaster.InvoiceNo,
                GSTNo: PurchaseMaster.GSTNo ? PurchaseMaster.GSTNo : '',
                Quantity: PurchaseMaster.Quantity,
                SubTotal: PurchaseMaster.SubTotal,
                DiscountAmount: PurchaseMaster.DiscountAmount,
                GSTAmount: PurchaseMaster.GSTAmount,
                TotalAmount: PurchaseMaster.TotalAmount,
                Status: 1,
                PStatus: 1,
                DueAmount: PurchaseMaster.DueAmount
            }

            const supplierId = purchase.SupplierID;

            //  save purchase data
            const [savePurchase] = await mysql2.pool.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${purchase.PaymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,0,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

            console.log(connected("Data Save SuccessFUlly !!!"));


            //  save purchase detail data
            for (const item of PurchaseDetail) {

                // generate unique barcode
                item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},0,${item.WholeSale},'${item.BaseBarcode}',0,1,'${item.BaseBarcode}',0,0,'${item.UniqueBarcode}',0,0,${LoggedOnUser},now())`)


                let saleCount = 0
                let count = 0
                saleCount = Number(item.saleQuantity)
                count = Number(item.Quantity) - saleCount

                const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set PurchaseDetailID = ${savePurchaseDetail.insertId}, CurrentStatus = 'Sold' where BillDetailID = ${item.BillDetailID}`)

                if (count !== 0 && count > 0) {
                    for (j = 0; j < count; j++) {
                        const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${savePurchaseDetail.insertId},'${item.GSTType}',${item.GSTPercentage}, '${item.Barcode}',now(),'Available', ${item.RetailPrice},0,0,${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now())`)
                    }
                }

            }


            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Debit',now(), 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
            return res.send(response)
        } catch (err) {
            next(err)
        }
    },
    getSupplierPoPurchaseList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Parem, currentPage, itemsPerPage } = req.body;


            let parem = ``
            if (Parem !== undefined) {
                parem = Parem
            }

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            let qry = `SELECT barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,barcodemasternew.CurrentStatus,barcodemasternew.SupplierID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, supplier.Name as SupplierName FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN supplier on supplier.ID = barcodemasternew.SupplierID WHERE  barcodemasternew.BillDetailID != 0 and barcodemasternew.PurchaseDetailID != 0 AND  barcodemasternew.SupplierID != 0 and barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.CurrentStatus = 'Sold' AND billdetail.PreOrder = 1   ${parem} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length


            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    // po fitter

    getFitterPo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, Parem } = req.body;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })

            let masterParam = ``
            let parem = ``
            let productTypes = ` and billdetail.ProductTypeName IN ('Lens', 'Frame','Sunglases')`
            if (Parem !== undefined) {
                parem = Parem
            }
            if (ID !== 0) {
                masterParam = ` and billdetail.BillID = ${ID}`
            }

            let qry = `SELECT 0 AS Sel , barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, barcodemasternew.LensType, barcodemasternew.FitterCost,barcodemasternew.FitterID,barcodemasternew.FitterStatus, barcodemasternew.Optionsss as Optionsss FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID WHERE  barcodemasternew.FitterID = 0 and barcodemasternew.BillDetailID != 0 and billdetail.Status = 1 and barcodemasternew.CompanyID = ${CompanyID} and barcodemasternew.ShopID = ${shopid} AND barcodemasternew.FitterStatus = 'initiate' ${masterParam}  ${parem} ${productTypes} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.BillDetailID DESC`

            console.log(qry);

            const [data] = await mysql2.pool.query(qry)
            response.data = data
            response.message = "success";

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    assignFitterPo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Body } = req.body;

            for (const item of Body) {
                if (!item.ID || item.ID === null || item.ID === undefined) return res.send({ message: "Invalid Query Data1" })
                // if (item.FitterID === null || item.FitterID === undefined || item.FitterID == 0) return res.send({ message: "Invalid Query Data2" })
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data3" })
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data3" })
            }

            await Promise.all(
                Body.map(async (item) => {
                    const [update] = await mysql2.pool.query(`update barcodemasternew set FitterID = ${item.FitterID}, LensType = '${item.LensType}',FitterCost = ${item.FitterCost}, FitterStatus = '${item.FitterStatus}', Remark = '${item.Remark}', UpdatedOn=now() where  BillDetailID = ${item.BillDetailID}`);
                })
            )


            // for (let item of Body) {
            //     const [update] = await mysql2.pool.query(`update barcodemasternew set FitterID = ${item.FitterID}, LensType = '${item.LensType}',FitterCost = ${item.FitterCost}, FitterStatus = '${item.FitterStatus}', Remark = '${item.Remark}', UpdatedOn=now() where ID = ${item.ID}`);
            // }

            response.data = null
            response.message = "Fitter Assign SuccessFully !!!";

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    assignFitterDoc: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Body } = req.body;

            for (const item of Body) {
                if (!item.ID || item.ID === null || item.ID === undefined) return res.send({ message: "Invalid Query Data1" })
                if (!item.Sel || item.Sel == 0) return res.send({ message: "Invalid Query Data2" })
            }


            await Promise.all(
                Body.map(async (item) => {
                    const [update] = await mysql2.pool.query(`update barcodemasternew set Remark = '${item.Remark}', FitterDocNo = '${item.FitterDocNo}', UpdatedOn=now() where BillDetailID = ${item.BillDetailID}`);
                })
            )
            // for (let item of Body) {
            //     const [update] = await mysql2.pool.query(`update barcodemasternew set Remark = '${item.Remark}', FitterDocNo = '${item.FitterDocNo}', UpdatedOn=now() where ID = ${item.ID}`);
            // }

            response.data = null
            response.message = "Fitter Doc Assign SuccessFully !!!";
            return res.send(response)

        } catch (err) {
            next(err)
        }
    },

    AssignFitterPDF: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const printdata = req.body

            // const MeasurementID = JSON.parse(req.body.productList.MeasurementID) ;
            const productList = req.body.productList

            let modifyList = [];
            let invoiceNos = [];

            productList.forEach(ell => {
                ell.InvoiceDate = moment(ell.InvoiceDate).format("DD-MM-YYYY")
                ell.DeliveryDate = moment(ell.DeliveryDate).format("DD-MM-YYYY")
                ell.s = [ell.ProductName];  // Initialize 'ell.s' as an array with the current ProductName.
                ell.R = [ell.Remark];  // Initialize 'ell.s' as an array with the current ProductName.

                if (!invoiceNos.includes(ell.InvoiceNo)) {
                    invoiceNos.push(ell.InvoiceNo);
                    modifyList.push(ell);
                } else {
                    // Find the corresponding item in 'v' to update its 's' array.
                    const existingItem = modifyList.find(item => item.InvoiceNo === ell.InvoiceNo);

                    // Check if ProductName and Remark are not already in the 's' array.


                    if (!existingItem.s.some(obj => obj.ProductName === ell.ProductName)) {
                        existingItem.s.push(ell.ProductName);
                    }
                    if (!existingItem.R.some(obj => obj.Remark === ell.Remark)) {
                        existingItem.R.push(ell.Remark);
                    }
                }

            });


            printdata.productList = modifyList


            console.log(printdata.productList);

            const [shopdetails] = await mysql2.pool.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await mysql2.pool.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [billformate] = await mysql2.pool.query(`select * from billformate where CompanyID = ${CompanyID}`)

            printdata.billformate = billformate[0]
            printdata.BillHeader = `${Number(printdata.billformate.BillHeader)}`;
            printdata.Color = printdata.billformate.Color;
            printdata.ShopNameBold = `${Number(printdata.billformate.ShopNameBold)}`;
            printdata.HeaderWidth = `${Number(printdata.billformate.HeaderWidth)}px`;
            printdata.HeaderHeight = `${Number(printdata.billformate.HeaderHeight)}px`;
            printdata.HeaderPadding = `${Number(printdata.billformate.HeaderPadding)}px`;
            printdata.HeaderMargin = `${Number(printdata.billformate.HeaderMargin)}px`;
            printdata.ImageWidth = `${Number(printdata.billformate.ImageWidth)}px`;
            printdata.ImageHeight = `${Number(printdata.billformate.ImageHeight)}px`;
            printdata.ImageAlign = printdata.billformate.ImageAlign;
            printdata.ShopNameFont = `${Number(printdata.billformate.ShopNameFont)}px`;
            printdata.ShopDetailFont = `${Number(printdata.billformate.ShopDetailFont)}px`;
            printdata.LineSpace = `${Number(printdata.billformate.LineSpace)}px`;
            printdata.CustomerFont = `${Number(printdata.billformate.CustomerFont)}px`;
            printdata.CustomerLineSpace = `${Number(printdata.billformate.CustomerLineSpace)}px`;
            printdata.TableHeading = `${Number(printdata.billformate.TableHeading)}px`;
            printdata.TableBody = `${Number(printdata.billformate.TableBody)}px`;
            printdata.NoteFont = `${Number(printdata.billformate.NoteFont)}px`;
            printdata.NoteLineSpace = `${Number(printdata.billformate.NoteLineSpace)}px`;

            printdata.shopdetails = shopdetails[0]
            printdata.companysetting = companysetting[0]

            var fileName = "";

            if (!printdata.companysetting.LogoURL) {
                printdata.LogoURL = clientConfig.appURL + '../assest/no-image.png';
            } else {
                printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;
            }

            var formatName = "AssignFitterPDF.ejs";
            var file = 'Fitter' + "_" + CompanyID + ".pdf";
            fileName = "uploads/" + file;

            console.log(fileName);

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        header: {
                            height: "0mm"
                        },
                        footer: {
                            height: "0mm",
                            contents: {
                                last: ``,
                            },
                        },
                    };
                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

            return

        } catch (err) {
            next(err)
        }

    },
    getFitterPoList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, Parem } = req.body;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })

            let masterParam = ``
            let parem = ``
            let productTypes = ` and billdetail.ProductTypeName IN ('Lens', 'Frame','Sunglases')`
            if (Parem !== undefined) {
                parem = Parem
            }
            if (ID !== 0) {
                masterParam = ` and billdetail.BillID = ${ID}`
            }

            let qry = `SELECT 0 AS Sel , barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, barcodemasternew.LensType, barcodemasternew.FitterCost,barcodemasternew.FitterID,barcodemasternew.FitterStatus, barcodemasternew.Optionsss as Optionsss, barcodemasternew.FitterDocNo, barcodemasternew.Remark, fitter.Name as FitterName FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN fitter ON fitter.ID =  barcodemasternew.FitterID WHERE  barcodemasternew.FitterID != 0 and barcodemasternew.BillDetailID != 0 and billdetail.Status = 1 and barcodemasternew.ShopID = ${shopid} and FitterStatus != 'invoice' and barcodemasternew.CompanyID = ${CompanyID}  ${masterParam}  ${parem} ${productTypes} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.BillDetailID DESC`

            console.log(qry);

            const [data] = await mysql2.pool.query(qry)
            response.data = data
            response.message = "success";

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getFitterPoPurchaseList: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, Parem } = req.body;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })

            let masterParam = ``
            let parem = ``
            let productTypes = ` and billdetail.ProductTypeName IN ('Lens', 'Frame','Sunglases')`
            if (Parem !== undefined) {
                parem = Parem
            }
            if (ID !== 0) {
                masterParam = ` and billdetail.BillID = ${ID}`
            }

            let qry = `SELECT 0 AS Sel , barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, barcodemasternew.LensType, barcodemasternew.FitterCost,barcodemasternew.FitterID,barcodemasternew.FitterStatus, barcodemasternew.Optionsss as Optionsss, barcodemasternew.FitterDocNo, barcodemasternew.Remark, Fitter.Name as FitterName FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN fitter ON fitter.ID =  barcodemasternew.FitterID WHERE  barcodemasternew.FitterID != 0 and barcodemasternew.BillDetailID != 0 and billdetail.Status = 1 and barcodemasternew.ShopID = ${shopid} and FitterStatus = 'invoice' and barcodemasternew.CompanyID = ${CompanyID}  ${masterParam}  ${parem} ${productTypes} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.BillDetailID DESC`

            console.log(qry);

            const [data] = await mysql2.pool.query(qry)
            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    cashcollectionreport: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", paymentMode: [], sumOfPaymentMode: 0, AmountReturnByDebit: 0, AmountReturnByCredit: 0, totalAmount: 0 }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;


            const { Date, ShopID, PaymentMode, PaymentStatus } = req.body;
            let shop = ``
            let shop2 = ``
            let paymentType = ``
            let paymentStatus = ``

            if (ShopID) {
                shop = ` and billmaster.ShopID = ${ShopID}`
                shop2 = ` and paymentmaster.ShopID = ${ShopID}`
            }
            if (PaymentMode) {
                paymentType = ` and paymentmaster.PaymentMode = '${PaymentMode}' `
            }
            if (PaymentStatus) {
                paymentStatus = ` and billmaster.PaymentStatus = '${PaymentStatus}'`
            }


            let qry = `select paymentmaster.CustomerID, paymentmaster.ShopID, paymentmaster.PaymentMode, paymentmaster.PaymentDate, paymentmaster.CardNo, paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentdetail.Amount, paymentdetail.DueAmount, billmaster.InvoiceNo, billmaster.BillDate,billmaster.DeliveryDate, billmaster.PaymentStatus, billmaster.TotalAmount, shop.Name as ShopName, shop.AreaName, customer.Name as CustomerName, customer.MobileNo1, paymentmaster.CreditType from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID left join billmaster on billmaster.ID = paymentdetail.BillMasterID left join shop on shop.ID = paymentmaster.ShopID left join customer on customer.ID = paymentmaster.CustomerID where  paymentmaster.CompanyID = '${CompanyID}' and paymentdetail.PaymentType = 'Customer' and paymentmaster.PaymentMode != 'Payment Initiated'  ${shop} ${paymentStatus} ${paymentType} ` + Date + ` order by paymentdetail.BillMasterID desc`


            const [data] = await mysql2.pool.query(qry)

            const [paymentMode] = await mysql2.pool.query(`select supportmaster.Name, 0 as Amount from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'PaymentModeType' order by ID desc`)

            response.paymentMode = paymentMode

            if (data) {
                for (const item of data) {
                    response.paymentMode.forEach(x => {
                        if (item.PaymentMode === x.Name && item.CreditType === 'Credit') {
                            x.Amount += item.Amount
                            response.sumOfPaymentMode += item.Amount
                        }
                    })

                }
            }

            const [debitReturn] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentdetail.PaymentType = 'Customer' and paymentdetail.Credit = 'Debit' and paymentdetail.CompanyID = ${CompanyID} ${shop2}` + Date)
            const [creditReturn] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentdetail.PaymentType = 'Customer Credit' and paymentdetail.Credit = 'Credit' and paymentdetail.CompanyID = ${CompanyID} ${shop2}` + Date)

            if (debitReturn[0].Amount !== null) {
                response.AmountReturnByDebit = debitReturn[0].Amount
            }
            if (creditReturn[0].Amount !== null) {
                response.AmountReturnByCredit = creditReturn[0].Amount
            }


            response.totalAmount = response.sumOfPaymentMode - response.AmountReturnByDebit - response.AmountReturnByCredit
            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    updateProductTypeNameOnBill: async (req, res, next) => {
        try {

            return

            const response = { data: null, success: true, message: "" }

            const [data] = await mysql2.pool.query(`select ID, ProductTypeID, ProductTypeName, BaseBarCode,HSNCode, CompanyID  from billdetail where ProductTypeName = "null" and Manual = 0 and PreOrder = 0`)

            let count = 0
            if (data.length) {
                for (let item of data) {
                    count += 1
                    console.log(count);
                    const [fetch] = await mysql2.pool.query(`select ProductTypeID, ProductTypeName, product.HSNCode from purchasedetailnew left join product on product.ID = purchasedetailnew.ProductTypeID where purchasedetailnew.BaseBarCode = '${item.BaseBarCode}' and purchasedetailnew.CompanyID = ${item.CompanyID} limit 1`)

                    item.ProductTypeID = fetch[0].ProductTypeID
                    item.ProductTypeName = fetch[0].ProductTypeName
                    item.HSNCode = fetch[0].HSNCode

                    if (!fetch.length) {
                        console.log(item.BaseBarCode, "item.BaseBarCode");
                        return
                    }


                    const [update] = await mysql2.pool.query(`update billdetail set ProductTypeID = ${item.ProductTypeID}, ProductTypeName = '${item.ProductTypeName}', HSNCode = '${item.HSNCode}' where CompanyID = ${item.CompanyID} and ID = ${item.ID} and BaseBarCode = '${item.BaseBarCode}'`)

                }

            }

            console.log(data.length);

            response.message = "Updated"
            return res.send(response)
        } catch (error) {
            console.log(error);
            next(error)
        }
    }
}
