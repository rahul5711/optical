const createError = require('http-errors')
const mysql = require('../newdb')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { now } = require('lodash')
const { shopID, generateInvoiceNo, generateBillSno, generateCommission, updateCommission, generateBarcode, generatePreOrderProduct, generateUniqueBarcodePreOrder, gstDetailBill, generateUniqueBarcode, generateInvoiceNoForService, update_c_report_setting, update_c_report, amt_update_c_report, getTotalAmountByBarcode, generateOtp, doesExistDiscoutSetting, doesExistDiscoutSettingUpdate, updateLocatedProductCount } = require('../helpers/helper_function')
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
const ExcelJS = require('exceljs');
const numberToWords = require('number-to-words');
function rearrangeString(str) {
    // Split the input string into an array of words
    let words = str.split(' ');

    // Reverse the order of the words
    let reversedWords = words.reverse();

    // Join the words back into a single string
    return reversedWords.join(' ');
}
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

function calculateAmount(Amount, Percentage) {
    let modifyAmount = 0
    modifyAmount = (Amount * Percentage) / 100
    return modifyAmount.toFixed(2)
}

async function validateSameMonthAndYear(fromDate, toDate) {
    // Create Date objects from the input dates
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Check if both dates have the same month and year
    const isSameMonth = from.getMonth() === to.getMonth();
    const isSameYear = from.getFullYear() === to.getFullYear();

    // Return true if both conditions are met, otherwise false
    return isSameMonth && isSameYear;
}

function numberToMonth(number) {
    const months = {
        1: "Jan",
        2: "Feb",
        3: "Mar",
        4: "Apr",
        5: "May",
        6: "Jun",
        7: "Jul",
        8: "Aug",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Dec"
    };;

    if (months.hasOwnProperty(number)) {
        return months[number];
    } else {
        return "Invalid month number";
    }
}

module.exports = {
    getDoctor: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select DoctorShopWise from companysetting where CompanyID = ${CompanyID}`)

            if (fetchCompanySetting[0].DoctorShopWise === 'true') {
                shop = ` and doctor.ShopID = ${shopid}`
            }

            let [data] = await mysql2.pool.query(`select ID, Name, MobileNo1 from doctor where Status = 1 ${shop} and CompanyID = ${CompanyID}`);

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

            const shopid = await shopID(req.headers) || 0;

            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select EmployeeShopWise from companysetting where CompanyID = ${CompanyID}`)

            if (fetchCompanySetting[0].EmployeeShopWise === 'true') {
                shop = ` and user.ShopID = ${shopid}`
            }

            let [data] = await mysql2.pool.query(`select ID, Name, MobileNo1 from user where Status = 1 ${shop} and CompanyID = ${CompanyID}`);
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

            let [data] = await mysql2.pool.query(`select Name, ID from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'TrayNo' order by ID desc`);
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
                let searchParams = ``
                if (Req?.searchString !== null && Req?.searchString !== "" && Req?.searchString !== undefined) {
                    searchParams = ` and purchasedetailnew.ProductName = '${Req.searchString}' `
                }

                if (ShopMode === false) {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID,purchasedetailnew.ProductExpDate, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.UnitPrice, purchasedetailnew.BaseBarCode, barcodemasternew.RetailPrice as RetailPrice, barcodemasternew.WholeSalePrice as WholeSalePrice   FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID Left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' ${searchParams}  and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode, barcodemasternew.RetailPrice as RetailPrice, barcodemasternew.WholeSalePrice as WholeSalePrice FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;

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
                qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode, barcodemasternew.RetailPrice as RetailPrice, barcodemasternew.WholeSalePrice as WholeSalePrice, purchasemasternew.SupplierID  FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE  barcodemasternew.CurrentStatus = "Available" AND  ${shopMode} CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND purchasedetailnew.Status = 1  and shop.Status = 1 And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`;
            } else {
                qry = `SELECT 'XXX' AS BarCodeCount,  shop.AreaName as AreaName  ,shop.Name as ShopName, purchasedetailnew.*, barcodemasternew.*, CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode, barcodemasternew.RetailPrice as RetailPrice, barcodemasternew.WholeSalePrice as WholeSalePrice  FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE  CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' AND barcodemasternew.CompanyID = '${CompanyID}' and purchasemasternew.PStatus = 1  AND barcodemasternew.Status = 1   AND purchasedetailnew.Status = 1 and barcodemasternew.CurrentStatus = 'Pre Order'  GROUP BY purchasedetailnew.ID`;
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

            let { billMaseterData, billDetailData, service } = req.body
            if (billMaseterData.Employee === null || billMaseterData.Employee === "null" || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") {
                billMaseterData.Employee = 0
            }
            if (billMaseterData.Doctor === null || billMaseterData.Doctor === "null" || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") {
                billMaseterData.Doctor = 0
            }
            console.log("saveBill=============================>", req.body);

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID !== null || billMaseterData.ID === undefined || billMaseterData.ID === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID == null || billMaseterData.CustomerID == "null" || billMaseterData.CustomerID === undefined || billMaseterData.CustomerID === "None") return res.send({ message: "Invalid Query CustomerID Data" })
            if (billMaseterData.Doctor == null || billMaseterData.Doctor == "null" || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") return res.send({ message: "Invalid Query Doctor Data" })
            if (billMaseterData.Employee == null || billMaseterData.Employee == "null" || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") return res.send({ message: "Invalid Query Employee Data" })
            if ((new Date(`${billMaseterData.BillDate}`) == "Invalid Date")) return res.send({ message: "Invalid BillDate" })
            if ((new Date(`${billMaseterData.DeliveryDate}`) == "Invalid Date")) return res.send({ message: "Invalid DeliveryDate" })

            const [existShop] = await mysql2.pool.query(`select ID, Name, Status, AreaName from shop where Status = 1 and ID = ${billMaseterData.ShopID}`)

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
            console.log("Invoice No ======>", billMaseterData.InvoiceNo);

            // save Bill master data
            let [bMaster] = await mysql2.pool.query(
                `insert into billmaster (CustomerID,CompanyID, Sno,RegNo,ShopID,BillDate, DeliveryDate,  PaymentStatus,InvoiceNo, GSTNo, Quantity, SubTotal, DiscountAmount, GSTAmount,AddlDiscount, TotalAmount, DueAmount, Status,CreatedBy,CreatedOn, LastUpdate, Doctor, TrayNo, Employee, BillType, RoundOff, AddlDiscountPercentage, ProductStatus) values (${billMaseterData.CustomerID}, ${CompanyID},'${billMaseterData.Sno}','${billMaseterData.RegNo}', ${billMaseterData.ShopID}, '${billMaseterData.BillDate}','${billMaseterData.DeliveryDate}', '${paymentMode}',  '${billMaseterData.InvoiceNo}', '${billMaseterData.GSTNo}', ${billMaseterData.Quantity}, ${billMaseterData.SubTotal}, ${billMaseterData.DiscountAmount}, ${billMaseterData.GSTAmount}, ${billMaseterData.AddlDiscount}, ${billMaseterData.TotalAmount}, ${billMaseterData.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}','${req.headers.currenttime}', ${billMaseterData.Doctor ? billMaseterData.Doctor : 0}, '${billMaseterData.TrayNo}', ${billMaseterData.Employee ? billMaseterData.Employee : 0}, ${billType}, ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0}, '${productStatus}')`
            );

            console.log(connected("BillMaster Add SuccessFUlly !!!"));

            let bMasterID = bMaster.insertId;

            // save service
            console.log(service, 'serviceserviceserviceserviceserviceserviceserviceserviceserviceservice');
            if (service.length) {
                await Promise.all(
                    service.map(async (ele) => {
                        let [result1] = await mysql2.pool.query(
                            `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType,DiscountPercentage, DiscountAmount, TotalAmount, Status,CreatedBy,CreatedOn, MeasurementID ) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price},  ${ele.SubTotal}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.DiscountPercentage}, ${ele.DiscountAmount}, ${ele.TotalAmount},1,${LoggedOnUser}, '${req.headers.currenttime}' ,'${ele.MeasurementID}')`
                        );
                    })
                );
            }


            // save Bill Details

            if (billDetailData.length) {

                for (let item of billDetailData) {
                    let preorder = 0;
                    let manual = 0;
                    let wholesale = 0
                    let order = 0
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
                    if (item.Order === true) {
                        order = 1;
                    }

                    if (manual === 0 && preorder === 0 && order === 0) {
                        let [newPurchasePrice] = await mysql2.pool.query(`select UnitPrice, DiscountPercentage, GSTPercentage from purchasedetailnew where BaseBarCode = '${item.Barcode}' and CompanyID = ${CompanyID}`);

                        let newPurchaseRate = 0
                        if (newPurchasePrice) {
                            newPurchaseRate = newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100 + (newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100) * newPurchasePrice[0].GSTPercentage / 100;
                        }


                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${newPurchaseRate},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );

                        console.log("is_location ======> ", item.is_location);
                        console.log("Location =======> ", item.Location);

                        if (item.Location) {
                            const updateLocation = await updateLocatedProductCount(CompanyID, shopid, item.ProductTypeID, item.ProductTypeName, item.Barcode, item.Location);

                            console.log("save Bill Location =====>", updateLocation);

                        }


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

                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.prod_UnitPrice},${item.PurchasePrice},${item.prod_Quantity},${item.prod_SubTotal}, ${item.prod_DiscountPercentage},${item.prod_DiscountAmount},${item.prod_GSTPercentage},${item.prod_GSTAmount},'${item.GSTType}',${item.prod_TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (manual === 1 && preorder === 0) {
                        item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                        item.Barcode = Number(item.BaseBarCode);
                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                    } else if (order === 1) {
                        item.BaseBarCode = 0
                        item.Barcode = 0
                        const [saveOrderRequest] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual,PreOrder,OrderRequest,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, 1, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', 0, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                        result.insertId = saveOrderRequest.insertId

                        const [saveOrderRequestForm] = await mysql2.pool.query(`insert into orderrequest(CompanyID, BillMasterID, BillDetailID, ShopID, OrderRequestShopID, ProductTypeID, ProductTypeName, ProductName, HSNCode, UnitPrice, Quantity, SubTotal, DiscountPercentage, DiscountAmount, GSTPercentage, GSTAmount, GSTType, TotalAmount, BaseBarCode, Barcode, Status, ProductStatus, CreatedBy, CreatedOn)values(${CompanyID}, ${bMasterID}, ${saveOrderRequest.insertId}, ${billMaseterData.ShopID}, ${item.OrderShop}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},'0', '0', 1, 'Order Request',${LoggedOnUser}, '${req.headers.currenttime}')`);
                    }
                    const [selectRow] = await mysql2.pool.query(`select * from billdetail where BillID = ${bMasterID} and CompanyID = ${CompanyID} and ID = ${result.insertId}`)

                    console.log("select row =====>", `select * from billdetail where BillID = ${bMasterID} and CompanyID = ${CompanyID} and ID = ${result.insertId}`);

                    const ele = selectRow[0]

                    // save and update barcode master accordingly condition like manual, preorder and stock

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
                    } else if (ele.OrderRequest === 0 && ele.PreOrder === 0 && ele.Manual === 0) {
                        let [selectRows1] = await mysql2.pool.query(`SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.ShopID = ${shopid} AND barcodemasternew.CurrentStatus = "Available" AND barcodemasternew.Status = 1 AND barcodemasternew.Barcode = '${ele.Barcode}' and purchasedetailnew.ProductName = '${ele.ProductName}' LIMIT ${ele.Quantity}`);
                        await Promise.all(
                            selectRows1.map(async (ele1) => {
                                let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' Where ID = ${ele1.ID}`);
                            })
                        );

                        // update c report setting

                        const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                        const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                        const totalAmount = await getTotalAmountByBarcode(CompanyID, ele.Barcode)

                        const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity * Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
                    } else if (ele.OrderRequest === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Order Request','${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1,${LoggedOnUser}, '${req.headers.currenttime}', '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.WholeSale !== 1 ? ele.UnitPrice : 0}, 0, 0, ${ele.WholeSale}, ${ele.WholeSale === 1 ? ele.UnitPrice : 0},0,0,'',0)`);
                        }
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

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billMaseterData.InvoiceNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},0,${billMaseterData.TotalAmount},'Customer','Credit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

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
    saveBill2: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            let { billMaseterData, billDetailData, service } = req.body
            if (billMaseterData.Employee === null || billMaseterData.Employee === "null" || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") {
                billMaseterData.Employee = 0
            }
            if (billMaseterData.Doctor === null || billMaseterData.Doctor === "null" || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") {
                billMaseterData.Doctor = 0
            }
            console.log("saveBill=============================>", req.body);

            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID !== null || billMaseterData.ID === undefined || billMaseterData.ID === "None") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.CustomerID == null || billMaseterData.CustomerID == "null" || billMaseterData.CustomerID === undefined || billMaseterData.CustomerID === "None") return res.send({ message: "Invalid Query CustomerID Data" })
            if (billMaseterData.Doctor == null || billMaseterData.Doctor == "null" || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") return res.send({ message: "Invalid Query Doctor Data" })
            if (billMaseterData.Employee == null || billMaseterData.Employee == "null" || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") return res.send({ message: "Invalid Query Employee Data" })
            if ((new Date(`${billMaseterData.BillDate}`) == "Invalid Date")) return res.send({ message: "Invalid BillDate" })
            if ((new Date(`${billMaseterData.DeliveryDate}`) == "Invalid Date")) return res.send({ message: "Invalid DeliveryDate" })

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
            console.log("Invoice No ======>", billMaseterData.InvoiceNo);

            // save Bill master data
            let [bMaster] = await mysql2.pool.query(
                `insert into billmaster (CustomerID,CompanyID, Sno,RegNo,ShopID,BillDate, DeliveryDate,  PaymentStatus,InvoiceNo, GSTNo, Quantity, SubTotal, DiscountAmount, GSTAmount,AddlDiscount, TotalAmount, DueAmount, Status,CreatedBy,CreatedOn, LastUpdate, Doctor, TrayNo, Employee, BillType, RoundOff, AddlDiscountPercentage, ProductStatus) values (${billMaseterData.CustomerID}, ${CompanyID},'${billMaseterData.Sno}','${billMaseterData.RegNo}', ${billMaseterData.ShopID}, '${billMaseterData.BillDate}','${billMaseterData.DeliveryDate}', '${paymentMode}',  '${billMaseterData.InvoiceNo}', '${billMaseterData.GSTNo}', ${billMaseterData.Quantity}, ${billMaseterData.SubTotal}, ${billMaseterData.DiscountAmount}, ${billMaseterData.GSTAmount}, ${billMaseterData.AddlDiscount}, ${billMaseterData.TotalAmount}, ${billMaseterData.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}','${req.headers.currenttime}', ${billMaseterData.Doctor ? billMaseterData.Doctor : 0}, '${billMaseterData.TrayNo}', ${billMaseterData.Employee ? billMaseterData.Employee : 0}, ${billType}, ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0}, '${productStatus}')`
            );

            console.log(connected("BillMaster Add SuccessFUlly !!!"));

            let bMasterID = bMaster.insertId;


            // save service
            console.log(service, 'serviceserviceserviceserviceserviceserviceserviceserviceserviceservice');
            if (service.length) {
                await Promise.all(
                    service.map(async (ele) => {
                        let [result1] = await mysql2.pool.query(
                            `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType,DiscountPercentage, DiscountAmount, TotalAmount, Status,CreatedBy,CreatedOn, MeasurementID ) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price},  ${ele.SubTotal}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.DiscountPercentage}, ${ele.DiscountAmount}, ${ele.TotalAmount},1,${LoggedOnUser}, '${req.headers.currenttime}' ,'${ele.MeasurementID}')`
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
                        let [selectRows1] = await mysql2.pool.query(`SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.ShopID = ${shopid} AND barcodemasternew.CurrentStatus = "Available" AND barcodemasternew.Status = 1 AND barcodemasternew.Barcode = '${ele.Barcode}' and purchasedetailnew.ProductName = '${ele.ProductName}' LIMIT ${ele.Quantity}`);
                        await Promise.all(
                            selectRows1.map(async (ele1) => {
                                let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' Where ID = ${ele1.ID}`);
                            })
                        );

                        // update c report setting

                        const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                        const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                        const totalAmount = await getTotalAmountByBarcode(CompanyID, ele.Barcode)

                        const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity * Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
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

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billMaseterData.InvoiceNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},0,${billMaseterData.TotalAmount},'Customer','Credit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

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
            let { billMaseterData, billDetailData, service } = req.body
            if (billMaseterData.Employee === null || billMaseterData.Employee === "null" || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") {
                billMaseterData.Employee = 0
            }
            if (billMaseterData.Doctor === null || billMaseterData.Doctor === "null" || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") {
                billMaseterData.Doctor = 0
            }
            if (!billMaseterData) return res.send({ message: "Invalid Query Data" })
            if (!billDetailData) return res.send({ message: "Invalid Query Data" })
            // if (!billDetailData.length && !service.length) return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ID === null || billMaseterData.ID === undefined || billMaseterData.ID == 0 || billMaseterData.ID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.ShopID === null || billMaseterData.ShopID === undefined || billMaseterData.ShopID == 0 || billMaseterData.ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (billMaseterData.InvoiceNo === null || billMaseterData.InvoiceNo === undefined || billMaseterData.InvoiceNo == 0 || billMaseterData.InvoiceNo === "") return res.send({ message: "Invalid Query InvoiceNo Data" })
            if (billMaseterData.CustomerID === null || billMaseterData.CustomerID === "null" || billMaseterData.CustomerID === undefined || billMaseterData.CustomerID === "None") return res.send({ message: "Invalid Query CustomerID Data" })
            if (billMaseterData.Employee === null || billMaseterData.Employee === "null" || billMaseterData.Employee === undefined || billMaseterData.Employee === "None") return res.send({ message: "Invalid Query Employee Data" })
            if (billMaseterData.Doctor === null || billMaseterData.Doctor === "null" || billMaseterData.Doctor === undefined || billMaseterData.Doctor === "None") return res.send({ message: "Invalid Query Doctor Data" })
            if ((new Date(`${billMaseterData.BillDate}`) == "Invalid Date")) return res.send({ message: "Invalid BillDate" })
            if ((new Date(`${billMaseterData.DeliveryDate}`) == "Invalid Date")) return res.send({ message: "Invalid DeliveryDate" })
            const [existShop] = await mysql2.pool.query(`select ID, Name, Status, AreaName from shop where Status = 1 and ID = ${shopid}`)

            if (!existShop.length) {
                return res.send({ message: "You have already delete this shop" })
            }

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${billMaseterData.InvoiceNo}' and BillMasterID = ${billMaseterData.ID}`)

            let bMasterID = billMaseterData.ID;

            const [fetchBill] = await mysql2.pool.query(`select SystemID, BillType from billmaster where CompanyID = ${CompanyID} and ID = ${bMasterID} and Status = 1 `)

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

            const [fetchComm] = await mysql2.pool.query(`select ID from commissiondetail where BillMasterID = ${bMasterID} and CommissionMasterID != 0`)

            if (billDetailData.length && fetchComm.length) {
                return res.send({ success: false, message: "you can not add more product in this invoice because you have already settled commission of this invoice" })
            }


            const [bMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${billMaseterData.PaymentStatus}', RegNo = '${billMaseterData.RegNo}', ProductStatus = '${billMaseterData.ProductStatus}', BillDate = '${billMaseterData.BillDate}', DeliveryDate = '${billMaseterData.DeliveryDate}', Quantity = ${billMaseterData.Quantity}, DiscountAmount = ${billMaseterData.DiscountAmount}, GSTAmount = ${billMaseterData.GSTAmount}, SubTotal = ${billMaseterData.SubTotal}, AddlDiscount = ${billMaseterData.AddlDiscount}, TotalAmount = ${billMaseterData.TotalAmount}, DueAmount = ${billMaseterData.DueAmount}, UpdatedBy = ${LoggedOnUser}, RoundOff = ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, AddlDiscountPercentage = ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0}, UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}', TrayNo = '${billMaseterData.TrayNo}' where ID = ${bMasterID} and CompanyID = ${CompanyID}`)

            console.log(connected("BillMaster Update SuccessFUlly !!!"));

            // save service
            if (service.length) {
                await Promise.all(
                    service.map(async (ele) => {
                        if (ele.ID === null) {
                            let [result1] = await mysql2.pool.query(
                                `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType,DiscountPercentage, DiscountAmount, TotalAmount, Status,CreatedBy,CreatedOn, MeasurementID) values (${bMasterID}, '${ele.ServiceType}', ${CompanyID},  '${ele.Description}', ${ele.Price}, ${ele.SubTotal}, ${ele.GSTPercentage}, ${ele.GSTAmount}, '${ele.GSTType}', ${ele.DiscountPercentage}, ${ele.DiscountAmount}, ${ele.TotalAmount},1,${LoggedOnUser}, '${req.headers.currenttime}', '${ele.MeasurementID}')`
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
                    let order = 0
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
                    if (item.Order === true) {
                        order = 1;
                    }

                    if (manual === 0 && preorder === 0 && order === 0) {
                        let [newPurchasePrice] = await mysql2.pool.query(`select UnitPrice, DiscountPercentage, GSTPercentage  from purchasedetailnew where BaseBarCode = '${item.Barcode}' and CompanyID = ${CompanyID}`);

                        let newPurchaseRate = 0
                        if (newPurchasePrice) {
                            newPurchaseRate = newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100 + (newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100) * newPurchasePrice[0].GSTPercentage / 100;
                        }
                        [result] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${newPurchaseRate},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID}, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );

                        console.log("is_location ======> ", item.is_location);
                        console.log("Location =======> ", item.Location);

                        if (item.Location) {
                            const updateLocation = await updateLocatedProductCount(CompanyID, shopid, item.ProductTypeID, item.ProductTypeName, item.Barcode, item.Location);

                            console.log("update Bill Location =====>", updateLocation);

                        }

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

                    } else if (order === 1) {
                        item.BaseBarCode = 0
                        item.Barcode = 0
                        const [saveOrderRequest] = await mysql2.pool.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual,PreOrder,OrderRequest,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.WholeSale},${manual}, ${preorder}, 1, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.MeasurementID}','${item.Option}','${item.Family}', ${LoggedOnUser}, '${req.headers.currenttime}', 0, '${item.Remark}', '${item.Warranty}', '${item.ProductExpDate}')`
                        );
                        result.insertId = saveOrderRequest.insertId;
                        const [saveOrderRequestForm] = await mysql2.pool.query(`insert into orderrequest(CompanyID, BillMasterID, BillDetailID, ShopID, OrderRequestShopID, ProductTypeID, ProductTypeName, ProductName, HSNCode, UnitPrice, Quantity, SubTotal, DiscountPercentage, DiscountAmount, GSTPercentage, GSTAmount, GSTType, TotalAmount, BaseBarCode, Barcode, Status, ProductStatus, CreatedBy, CreatedOn)values(${CompanyID}, ${bMasterID}, ${saveOrderRequest.insertId}, ${billMaseterData.ShopID}, ${item.OrderShop}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode}',${item.UnitPrice},${item.Quantity},${item.SubTotal}, ${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},'0', '0', 1, 'Order Request',${LoggedOnUser}, '${req.headers.currenttime}')`);
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


                    } else if (ele.OrderRequest === 0 && ele.PreOrder === 0 && ele.Manual === 0) {
                        let [selectRows1] = await mysql2.pool.query(`SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.ShopID = ${shopid} AND barcodemasternew.CurrentStatus = "Available" AND barcodemasternew.Status = 1 AND barcodemasternew.Barcode = '${ele.Barcode}' and purchasedetailnew.ProductName = '${ele.ProductName}' LIMIT ${ele.Quantity}`);
                        await Promise.all(
                            selectRows1.map(async (ele1) => {
                                let [resultn] = await mysql2.pool.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' Where ID = ${ele1.ID}`);
                            })
                        );

                        // update c report setting

                        const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                        const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
                        const totalAmount = await getTotalAmountByBarcode(CompanyID, ele.Barcode)
                        const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity * Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
                    } else if (ele.OrderRequest === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await mysql2.pool.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},${ele.Barcode}, 'Order Request','${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1,${LoggedOnUser}, '${req.headers.currenttime}', '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.WholeSale !== 1 ? ele.UnitPrice : 0}, 0, 0, ${ele.WholeSale}, ${ele.WholeSale === 1 ? ele.UnitPrice : 0},0,0,'',0)`);
                        }
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

            const [fetch] = await mysql2.pool.query(`select ID, CommissionMasterID from commissiondetail where BillMasterID = ${BillMasterID} and CompanyID = ${CompanyID} and UserType = 'Employee'`)

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

            const [fetch] = await mysql2.pool.query(`select ID from billmaster where ID = ${BillMasterID} and CompanyID = ${CompanyID} and Status = 1`)

            if (!fetch.length) {
                return res.send({ success: false, message: "Invalid BillMasterID" })
            }

            let productStatus = 'Deliverd'

            if (billDetailData.length) {
                for (const item of billDetailData) {
                    if (item.ProductStatus === 0) {
                        productStatus = 'Pending'
                    }

                    if (item.OrderRequest === 1) {
                        productStatus = 'Pending'
                        continue
                        return res.send({ success: false, message: `You can't deliverd this product because product is under process` });
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


            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser, User2.Name as SalePerson FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN user AS User2 ON User2.ID = billmaster.Employee LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE billmaster.CompanyID = ${CompanyID} and Customer1.Name LIKE '${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} and Customer1.Name LIKE '%${rearrangeString(searchQuery)}%' ${shopId} OR billmaster.CompanyID = ${CompanyID}  and  Customer1.MobileNo1 like '${searchQuery}%' ${shopId} OR billmaster.CompanyID = '${CompanyID}' and billmaster.InvoiceNo like '%${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} and Customer1.Idd like '%${searchQuery}%' ${shopId} OR billmaster.CompanyID = ${CompanyID} and Customer1.Sno like '%${searchQuery}%' ${shopId}`;

            console.log(qry);

            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length

            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    searchByRegNo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.RegNo.trim() === "") return res.send({ message: "Invalid Query Data" })
            let { RegNo } = Body;
            let shopId = ``

            if (shopid !== 0) {
                shopId = `and billmaster.ShopID = ${shopid}`
            }


            let qry = `SELECT billmaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob,Customer1.Sno AS Sno,Customer1.Idd AS Idd, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser, User2.Name as SalePerson FROM billmaster LEFT JOIN shop ON shop.ID = billmaster.ShopID LEFT JOIN user ON user.ID = billmaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = billmaster.UpdatedBy LEFT JOIN user AS User2 ON User2.ID = billmaster.Employee LEFT JOIN customer AS Customer1 ON Customer1.ID = billmaster.CustomerID WHERE billmaster.CompanyID = ${CompanyID} and billmaster.RegNo LIKE '%${RegNo}%' ${shopId}`;

            console.log(qry);

            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length

            return res.send(response);


        } catch (err) {
            console.log(err);
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

            let qry = `SELECT paymentdetail.*, billmaster.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentDate AS PaymentDate, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN billmaster ON billmaster.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType IN ('Customer', 'Customer Credit', 'Customer Reward') AND billmaster.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and billmaster.CompanyID = ${CompanyID} and billmaster.ShopID = ${shopid}`

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

            if (data) {
                for (let item of data) {
                    let Product = []

                    if (item.BillType === 0) {
                        [Product] = await mysql2.pool.query(`select MeasurementID from billservice where CompanyID = ${item.CompanyID} and BillID = ${item.ID}`)
                    } else {
                        [Product] = await mysql2.pool.query(`select MeasurementID from billdetail where CompanyID = ${item.CompanyID} and BillID = ${item.ID}`)
                    }

                    item.MeasurementID = JSON.parse(Product[0]?.MeasurementID ? Product[0]?.MeasurementID : '[]') || []
                }
            }

            response.message = "data fetch sucessfully"
            response.data = data
            response.sumData = sumData[0]

            return res.send(response);



        } catch (err) {
            console.log(err);
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

            const [doesExist] = await mysql2.pool.query(`select ID, SystemID from billmaster where CompanyID = ${CompanyID} and Status = 1 and ID = ${ID}`)

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

            const [deleteBill] = await mysql2.pool.query(`update billmaster set Status = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn = '${req.headers.currenttime}' where ID = ${ID}`)

            response.message = "data delete sucessfully"
            response.data = []

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    updatePower: async (req, res, next) => {
        // const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID, MeasurementID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            if (!MeasurementID || MeasurementID === undefined || MeasurementID === null) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from billdetail where CompanyID = ${CompanyID} and Status = 1 and ID = ${ID}`)

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
                DueAmount: billMaseterData.DueAmount,
                RoundOff: billMaseterData.RoundOff
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
                    PreOrder: billDetailData.PreOrder,
                    OrderRequest: billDetailData.OrderRequest
                }

                // update calculation
                // bMaster.Quantity -= bDetail.Quantity
                // bMaster.SubTotal -= bDetail.SubTotal
                // bMaster.GSTAmount -= bDetail.GSTAmount
                // bMaster.DiscountAmount -= bDetail.DiscountAmount
                // bMaster.TotalAmount -= bDetail.TotalAmount
                // bMaster.DueAmount -= bDetail.TotalAmount

                // delete bill product

                if (bDetail.OrderRequest === 1) {
                    return res.send({ success: false, apiStatusCode: 'OrderRequest001', data: [{ BillMasterID: billMaseterData.ID }], message: `You can't delete this product because product is under process` });
                }

                const [delProduct] = await mysql2.pool.query(`update billdetail set Status = 0, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${bDetail.ID} and CompanyID = ${CompanyID}`)
                console.log(connected("Bill Detail Update SuccessFUlly !!!"));

                if (bDetail.Manual === 1) {
                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} and CurrentStatus = 'Not Available' limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));


                }

                if (bDetail.PreOrder === 1) {
                    const [fetchBarcode] = await mysql2.pool.query(`select * from barcodemasternew where BillDetailID = ${bDetail.ID} and PurchaseDetailID = 0 and CompanyID = ${CompanyID} and CurrentStatus = 'Pre Order' limit ${bDetail.Quantity}`);

                    // if length available it means product in only pre order not purchsed right now, you have to only delete
                    if (fetchBarcode.length && fetchBarcode.length === bDetail.Quantity) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} and CurrentStatus = 'Pre Order' and PurchaseDetailID = 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }
                    // if product is in preorder and has been purchased so we have to update for availlable
                    else if (!fetchBarcode.length) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set BillDetailID=0,CurrentStatus='Available' where BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} and PurchaseDetailID != 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }


                }

                let fetchbarcodeForPrice = []
                if (bDetail.Manual === 0 && bDetail.PreOrder === 0) {

                    [fetchbarcodeForPrice] = await mysql2.pool.query(`select * from barcodemasternew where CurrentStatus = 'Available' and Barcode = '${billDetailData.Barcode}' and CompanyID = ${CompanyID} limit 1`);

                    if (!fetchbarcodeForPrice.length) {
                        [fetchbarcodeForPrice] = await mysql2.pool.query(`select * from barcodemasternew where CurrentStatus = 'Sold' and Barcode = '${billDetailData.Barcode}' and BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} limit 1`);
                    }

                    console.log("fetchbarcodeForPrice ====>", fetchbarcodeForPrice);

                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus='Available', BillDetailID=0, RetailPrice = ${fetchbarcodeForPrice[0].RetailPrice} , WholeSalePrice = ${fetchbarcodeForPrice[0].WholeSalePrice} where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Sold' and CompanyID = ${CompanyID} limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, billDetailData.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
                    const totalAmount = await getTotalAmountByBarcode(CompanyID, billDetailData.Barcode)
                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, 0, billDetailData.Quantity * Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
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

                const [delService] = await mysql2.pool.query(`update billservice set Status = 0, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${bService.ID} and CompanyID = ${CompanyID}`)

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
            const [updateMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${paymentStatus}', Quantity=${bMaster.Quantity}, SubTotal=${bMaster.SubTotal}, GSTAmount=${bMaster.GSTAmount}, DiscountAmount=${bMaster.DiscountAmount}, TotalAmount=${bMaster.TotalAmount}, DueAmount=${bMaster.DueAmount}, AddlDiscount=${bMaster.AddlDiscount}, AddlDiscountPercentage=${bMaster.AddlDiscountPercentage}, RoundOff=${bMaster.RoundOff}, UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}', UpdatedBy = ${LoggedOnUser} where ID=${bMaster.ID} and CompanyID = ${CompanyID}`)
            console.log(connected("Bill Master Update SuccessFUlly !!!"));


            // if payment length zero we have to update payment
            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${bMaster.InvoiceNo}' and BillMasterID = ${bMaster.ID}`)

            if (doesCheckPayment.length === 1) {
                //  update payment
                const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${bMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

                const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${bMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)
                console.log(connected("Payment Update SuccessFUlly !!!"));
            }

            // generate credit note
            console.log(CreditAmount, 'CreditAmount');
            if (CreditAmount !== 0) {
                const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${bMaster.CustomerID}, ${CompanyID}, ${shopid},'Customer', 'Debit','${req.headers.currenttime}', 'Customer Credit', '', '${bMaster.InvoiceNo}', ${CreditAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`);

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
            console.log(err);
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
                    PreOrder: billDetailData.PreOrder,
                    OrderRequest: billDetailData.OrderRequest,
                }

                // update calculation
                // bMaster.Quantity -= bDetail.Quantity
                // bMaster.SubTotal -= bDetail.SubTotal
                // bMaster.GSTAmount -= bDetail.GSTAmount
                // bMaster.DiscountAmount -= bDetail.DiscountAmount
                // bMaster.TotalAmount -= bDetail.TotalAmount
                // bMaster.DueAmount -= bDetail.TotalAmount

                // delete bill product

                if (bDetail.OrderRequest === 1) {
                    return res.send({ success: false, message: `You can't delete this product because product is under process` });
                }

                const [delProduct] = await mysql2.pool.query(`update billdetail set Status = 0, CancelStatus = 0, UpdatedBy=${LoggedOnUser}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${bDetail.ID} and CompanyID = ${CompanyID}`)
                console.log(connected("Bill Detail Update SuccessFUlly !!!"));

                if (bDetail.Manual === 1) {
                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} and CurrentStatus = 'Not Available' limit ${bDetail.Quantity}`)
                    console.log(connected("Barcode Update SuccessFUlly !!!"));



                }

                if (bDetail.PreOrder === 1) {
                    const [fetchBarcode] = await mysql2.pool.query(`select * from barcodemasternew where BillDetailID = ${bDetail.ID} and PurchaseDetailID = 0 and CompanyID = ${CompanyID} and CurrentStatus = 'Pre Order' limit ${bDetail.Quantity}`);

                    // if length available it means product in only pre order not purchsed right now, you have to only delete
                    if (fetchBarcode.length && fetchBarcode.length === bDetail.Quantity) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, BillDetailID=0 where BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} and CurrentStatus = 'Pre Order' and PurchaseDetailID = 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }
                    // if product is in preorder and has been purchased so we have to update for availlable
                    else if (!fetchBarcode.length) {
                        const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set BillDetailID=0,CurrentStatus='Available' where BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} and PurchaseDetailID != 0 limit ${bDetail.Quantity}`)
                        console.log(connected("Barcode Update SuccessFUlly !!!"));
                    }

                }
                let fetchbarcodeForPrice = []

                if (bDetail.Manual === 0 && bDetail.PreOrder === 0) {

                    [fetchbarcodeForPrice] = await mysql2.pool.query(`select * from barcodemasternew where CurrentStatus = 'Available' and Barcode = '${billDetailData.Barcode}' and CompanyID = ${CompanyID} limit 1`);

                    if (!fetchbarcodeForPrice.length) {
                        [fetchbarcodeForPrice] = await mysql2.pool.query(`select * from barcodemasternew where CurrentStatus = 'Sold' and Barcode = '${billDetailData.Barcode}' and BillDetailID = ${bDetail.ID} and CompanyID = ${CompanyID} limit 1`);
                    }

                    console.log("fetchbarcodeForPrice ====>", fetchbarcodeForPrice);

                    const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus='Available', BillDetailID=0, RetailPrice = ${fetchbarcodeForPrice[0].RetailPrice} , WholeSalePrice = ${fetchbarcodeForPrice[0].WholeSalePrice} where BillDetailID = ${bDetail.ID} and CurrentStatus = 'Sold' and CompanyID = ${CompanyID} limit ${bDetail.Quantity}`)

                    console.log(connected("Barcode Update SuccessFUlly !!!"));

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, billDetailData.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                    const totalAmount = await getTotalAmountByBarcode(CompanyID, billDetailData.Barcode)

                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, 0, billDetailData.Quantity * Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
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

                const [delService] = await mysql2.pool.query(`update billservice set Status = 0, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${bService.ID} and CompanyID = ${CompanyID}`)

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
            const [updateMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${paymentStatus}', Quantity=${bMaster.Quantity}, SubTotal=${bMaster.SubTotal}, GSTAmount=${bMaster.GSTAmount}, DiscountAmount=${bMaster.DiscountAmount}, TotalAmount=${bMaster.TotalAmount}, DueAmount=${bMaster.DueAmount}, AddlDiscount=${bMaster.AddlDiscount}, AddlDiscountPercentage=${bMaster.AddlDiscountPercentage}, UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}', UpdatedBy = ${LoggedOnUser} where ID=${bMaster.ID}`)
            console.log(connected("Bill Master Update SuccessFUlly !!!"));


            // if payment length zero we have to update payment
            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${bMaster.InvoiceNo}' and BillMasterID = ${bMaster.ID}`)

            if (doesCheckPayment.length === 1) {
                //  update payment
                const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${bMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

                const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${bMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)
                console.log(connected("Payment Update SuccessFUlly !!!"));
            }

            // generate credit note
            console.log(CreditAmount, 'CreditAmount');
            if (CreditAmount !== 0) {
                const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${bMaster.CustomerID}, ${CompanyID}, ${shopid},'Customer', 'Debit', '${req.headers.currenttime}', 'Customer Credit', '', '${bMaster.InvoiceNo}', ${CreditAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`);

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

            const [bMaster] = await mysql2.pool.query(`update billmaster set PaymentStatus = '${billMaseterData.PaymentStatus}' , BillDate = '${billMaseterData.BillDate}', DeliveryDate = '${billMaseterData.DeliveryDate}', Quantity = ${billMaseterData.Quantity}, DiscountAmount = ${billMaseterData.DiscountAmount}, GSTAmount = ${billMaseterData.GSTAmount}, SubTotal = ${billMaseterData.SubTotal}, AddlDiscount = ${billMaseterData.AddlDiscount}, TotalAmount = ${billMaseterData.TotalAmount}, DueAmount = ${billMaseterData.DueAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = '${req.headers.currenttime}', LastUpdate = '${req.headers.currenttime}', TrayNo = '${billMaseterData.TrayNo}',RoundOff = ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, AddlDiscountPercentage = ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0} where ID = ${bMasterID} and CompanyID = ${CompanyID}`)

            console.log(connected("BillMaster Update SuccessFUlly !!!"));

            const billDetail = billDetailData[0];

            const [update] = await mysql2.pool.query(`update billdetail set UnitPrice = ${billDetail.UnitPrice}, DiscountPercentage = ${billDetail.DiscountPercentage}, DiscountAmount = ${billDetail.DiscountAmount}, GSTPercentage = ${billDetail.GSTPercentage}, GSTAmount = ${billDetail.GSTAmount}, GSTType = '${billDetail.GSTType}', SubTotal = ${billDetail.SubTotal}, TotalAmount = ${billDetail.TotalAmount}, Remark = '${billDetail.Remark}', UpdatedBy = ${LoggedOnUser} where ID = ${billDetail.ID} and CompanyID = ${CompanyID}`)


            //  update payment

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${billMaseterData.InvoiceNo}' and BillMasterID = ${billMaseterData.ID}`)

            const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${billMaseterData.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0, DueAmount = ${billMaseterData.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)


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
            const Zoom = req.body.zoom;
            const BillDatePrint = moment(req.body.BillDatePrint).format('DD-MM-YYYY hh:mm:ss A');
            const OldDueAmt = req.body.OldDueAmount;
            console.log(CompanySetting);

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


            req.body.serviceList.forEach(element => {
                subtotals += element.SubTotal;
            });

            printdata.subtotals = subtotals
            // printdata.EyeMeasurement = x[0];

            if (Array.isArray(x[0])) {
                printdata.EyeMeasurement = x[0];
            } else if (typeof x[0] === 'object') {
                printdata.EyeMeasurement = [x[0]];
            }
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
            printdata.NoteLineSpace = `${Number(printdata.billformate.NoteLineSpace)}px`;
            printdata.WaterMarkWidth = `${Number(printdata.billformate.WaterMarkWidth)}px`;
            printdata.WaterMarkHeigh = `${Number(printdata.billformate.WaterMarkHeigh)}px`;
            printdata.WaterMarkOpecity = `${Number(printdata.billformate.WaterMarkOpecity)}`;
            printdata.WaterMarkLeft = `${Number(printdata.billformate.WaterMarkLeft)}%`;
            printdata.WaterMarkRight = `${Number(printdata.billformate.WaterMarkRight)}%`;

            printdata.billDatePrint = BillDatePrint;
            printdata.oldDueAmt = OldDueAmt;
            console.log(printdata.oldDueAmt, 'printdata.oldDueAmt');

            printdata.zoom = Zoom
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
            printdata.currencyLocale = printdata.companysetting.Locale;


            if (printdata.companysetting.CompanyCurrency != 0) {
                printdata.currencyFormat = printdata.companysetting.CompanyCurrency
            } else {
                printdata.currencyFormat = ''
            }
            console.log(printdata.currencyFormat, 'currencyLocale');
            console.log(printdata.currencyLocale);

            printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;
            // printdata.welcomeNoteCompany = printdata.companyWelComeNote.filter(ele => ele.NoteType === "retail");

            // printdata.recivePayment = printdata.paidlist.reduce((total, e) => {
            //     if (e.Type === 'Credit') {
            //         return total + e.Amount; // Add amount for Credit
            //     } else {
            //         return total - e.Amount; // Subtract amount for other types
            //     }
            // }, 0);

            printdata.recivePayment = printdata.paidlist.reduce((total, e) => {
                if (e.PaymentMode !== 'Customer Reward') { // Exclude Customer Reward
                    if (e.Type === 'Credit') {
                        return total + e.Amount; // Add amount for Credit
                    } else {
                        return total - e.Amount; // Subtract amount for other types
                    }
                }
                return total; // Skip Customer Reward
            }, 0);

            printdata.rewardDsicount = printdata.paidlist.reduce((Rtotal, r) => {
                if (r.PaymentMode === 'Customer Reward') {
                    return Rtotal + r.Amount; // Add amount for Customer Reward
                } else {
                    return Rtotal; // Do nothing for other payment modes
                }
            }, 0);

            printdata.CurrentInvoiceBalance = printdata.unpaidlist.reduce((total, em) => {
                if (printdata.billMaster.InvoiceNo === em.InvoiceNo) {
                    return total + em.DueAmount;
                }
                return total;
            }, 0);


            console.log(printdata.unpaidlist.length, 'printdata.unpaidlistprintdata.unpaidlist');

            printdata.DueAmount = printdata.unpaidlist.reduce((total, item) => total + item.DueAmount, 0);
            printdata.SavedDiscount = printdata.billMaster.DiscountAmount + printdata.billMaster.AddlDiscount
            printdata.billMaster.BillDate = moment(printdata.billMaster.BillDate).format("DD-MM-YYYY")
            printdata.billMaster.DeliveryDate = moment(printdata.billMaster.DeliveryDate).format("DD-MM-YYYY")
            printdata.billMaster.PaymentStatus = printdata.mode === "Invoice" ? "Unpaid" : "Paid";

            printdata.invoiceNo = printdata.shopdetails.BillName.split("/")[0]
            printdata.TotalValue = printdata.shopdetails.BillName.split("/")[1]
            printdata.BillValue = printdata.shopdetails.BillName.split("/")[2]
            printdata.CashMemo = printdata.shopdetails.BillName.split("/")[3]
            if (printdata.BillValue === '' || printdata.BillValue == undefined) {
                printdata.BillValue = 'Tax Invoice'
            }
            if (printdata.CashMemo === '' || printdata.CashMemo == undefined) {
                printdata.CashMemo = 'Cash Memo'
            }

            printdata.bill = printdata.mode === "Invoice" ? printdata.CashMemo : printdata.BillValue;
            printdata.welComeNoteShop = printdata.shopWelComeNote.filter((ele) => {
                if (printdata.shopdetails.WholesaleBill == "true" && ele.NoteType === "wholesale") {
                    return true;
                } else if (printdata.shopdetails.RetailBill == "true" && ele.NoteType === "retail") {
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
            printdata.Signature = clientConfig.appURL + printdata.shopdetails.Signature;
            console.log(printdata.Signature, 'printdata.Signature')

            printdata.GlassDetail = '';
            printdata.billItemList.forEach((g) => {

                if (g.ProductTypeName == 'LENS') {
                    printdata.GlassDetail = g.ProductName
                }
            })

            let BillFormat = ''

            if (CompanyID === 256) {
                BillFormat = "arihantPowerPdf.ejs";
            } else if (CompanyID === 277) {
                BillFormat = "Mumbai.ejs";
            } else {
                BillFormat = printdata.CompanySetting.BillFormat;
            }

            let fileName = "";
            const file = 'Bill' + '-' + printdata.billMaster.ID + '-' + CompanyID + ".pdf";

            const formatName = BillFormat;
            console.log(formatName);
            fileName = "uploads/" + file;


            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {

                    let options

                    if (CompanyID == 277) {
                        options = {
                            height: "200mm",
                            width: "75mm",
                            header: {
                                height: "0mm",
                                contents: ''
                            },
                            footer: {
                                height: "0mm",
                                contents: ''
                            },
                            margin: {
                                left: '0mm',
                                top: '0mm',
                                right: '0mm',
                                bottom: '0mm'
                            },
                            padding: {
                                left: '0mm',
                                top: '0mm',
                                right: '0mm',
                                bottom: '0mm'
                            },
                            format: "A4",
                            orientation: "portrait",
                        };

                    } else {
                        options = {
                            format: "A4",
                            orientation: "portrait",
                        };
                    }

                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
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
            BillMaster.DeliveryDate = moment(req.body.billMaster.DeliveryDate).format('DD-MM-YYYY')
            BillMaster.BillDate = moment(req.body.billMaster.BillDate).format('DD-MM-YYYY')

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
            response.oldInvoiceDueAmount = 0;
            const [oldInvoiceAmount] = await mysql2.pool.query(`select SUM(billmaster.DueAmount) as totalDueAmount from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and ShopID = ${shopid} and PaymentStatus = 'Unpaid' and billmaster.ID != ${BillMasterID}  order by ID desc`)


            if (oldInvoiceAmount[0].totalDueAmount !== null) {
                response.oldInvoiceDueAmount = oldInvoiceAmount[0].totalDueAmount
            }
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
            console.log(err)
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

            let [data] = await mysql2.pool.query(`select paymentdetail.amount as Amount, paymentmaster.PaymentDate as PaymentDate, paymentmaster.PaymentType AS PaymentType,paymentmaster.PaymentMode as PaymentMode, paymentmaster.CardNo as CardNo, paymentmaster.PaymentReferenceNo as PaymentReferenceNo, paymentdetail.Credit as Type from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.CustomerID = ${CustomerID} and paymentmaster.PaymentType = 'Customer' and paymentmaster.Status = 1 and paymentdetail.BillMasterID = ${BillMasterID} and paymentmaster.CompanyID = ${CompanyID}`)

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
                    "totalDiscountAmount": 0,
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
                    response.calculation[0].totalDiscountAmount += item.DiscountAmount

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

            qry = `SELECT billmaster.*, shop.Name AS ShopName, shop.AreaName AS AreaName, customer.Title AS Title , customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo, customer.Age, customer.Gender,  billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN shop ON shop.ID = billmaster.ShopID  WHERE billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1 ` +
                Parem + " GROUP BY billmaster.ID ORDER BY billmaster.ID DESC"

            let [data] = await mysql2.pool.query(qry);

            const [sumData] = await mysql2.pool.query(`SELECT SUM(billmaster.TotalAmount) AS TotalAmount, SUM(billmaster.Quantity) AS totalQty, SUM(billmaster.GSTAmount) AS totalGstAmount,SUM(billmaster.AddlDiscount) AS totalAddlDiscount, SUM(billmaster.DiscountAmount) AS totalDiscount, SUM(billmaster.SubTotal) AS totalSubTotalPrice  FROM billmaster WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1  ${Parem} `)
            if (sumData) {
                response.calculation[0].totalGstAmount = sumData[0].totalGstAmount ? sumData[0].totalGstAmount.toFixed(2) : 0
                response.calculation[0].totalAmount = sumData[0].TotalAmount ? sumData[0].TotalAmount.toFixed(2) : 0
                response.calculation[0].totalQty = sumData[0].totalQty ? sumData[0].totalQty : 0
                response.calculation[0].totalAddlDiscount = sumData[0].totalAddlDiscount ? sumData[0].totalAddlDiscount.toFixed(2) : 0
                response.calculation[0].totalDiscount = sumData[0].totalDiscount ? sumData[0].totalDiscount.toFixed(2) : 0
                response.calculation[0].totalSubTotalPrice = sumData[0].totalSubTotalPrice ? sumData[0].totalSubTotalPrice.toFixed(2) : 0
            }


            // if (data.length) {
            //     data.forEach(ee => {
            //         ee.gst_detailssss = []
            //         ee.gst_details = [{ InvoiceNo: ee.InvoiceNo, }]
            //         data.push(ee)
            //     })
            // }


            let [gstTypes] = await mysql2.pool.query(`select ID, Name, Status, TableName  from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                    item.cGstAmount = 0
                    item.iGstAmount = 0
                    item.sGstAmount = 0
                    item.gst_detailssss = []
                    item.paymentDetail = []
                    item.gst_details = []
                    if (item.BillType === 0) {
                        // service bill
                        const [fetchService] = await mysql2.pool.query(`select * from billservice where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchService.length) {
                            for (const item2 of fetchService) {
                                // response.calculation[0].totalAmount += item2.TotalAmount
                                // response.calculation[0].totalGstAmount += item2.GSTAmount
                                // response.calculation[0].totalSubTotalPrice += item2.SubTotal
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

                                    item.cGstAmount += item2.GSTAmount / 2
                                    item.sGstAmount += item2.GSTAmount / 2

                                    // if (item.gst_details.length === 0) {
                                    //     item.gst_details.push(
                                    //         {
                                    //             GSTType: `CGST`,
                                    //             Amount: item2.GSTAmount / 2
                                    //         },
                                    //         {
                                    //             GSTType: `SGST`,
                                    //             Amount: item2.GSTAmount / 2
                                    //         }
                                    //     )
                                    // } else {
                                    //     item.gst_details.forEach(e => {
                                    //         if (e.GSTType === 'CGST') {
                                    //             e.Amount += item2.GSTAmount / 2
                                    //         }
                                    //         if (e.GSTType === 'SGST') {
                                    //             e.Amount += item2.GSTAmount / 2
                                    //         }
                                    //     })
                                    // }
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === item2.GSTType) {
                                            e.Amount += item2.GSTAmount
                                        }
                                    })

                                    item.iGstAmount += item2.GSTAmount

                                    // item.gst_details.push(
                                    //     {
                                    //         GSTType: `${item2.GSTType}`,
                                    //         Amount: item2.GSTAmount
                                    //     },
                                    // )
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

                                // response.calculation[0].totalAmount += item2.TotalAmount
                                // response.calculation[0].totalGstAmount += item2.GSTAmount
                                // response.calculation[0].totalSubTotalPrice += item2.SubTotal
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
                                    item.cGstAmount += item2.GSTAmount / 2
                                    item.sGstAmount += item2.GSTAmount / 2
                                    // if (item.gst_details.length === 0) {
                                    //     item.gst_details.push(
                                    //         {
                                    //             GSTType: `CGST`,
                                    //             Amount: item2.GSTAmount / 2
                                    //         },
                                    //         {
                                    //             GSTType: `SGST`,
                                    //             Amount: item2.GSTAmount / 2
                                    //         }
                                    //     )
                                    // } else {
                                    //     item.gst_details.forEach(e => {
                                    //         if (e.GSTType === 'CGST') {
                                    //             e.Amount += item2.GSTAmount / 2
                                    //         }
                                    //         if (e.GSTType === 'SGST') {
                                    //             e.Amount += item2.GSTAmount / 2
                                    //         }
                                    //     })
                                    // }
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === item2.GSTType) {
                                            e.Amount += item2.GSTAmount
                                        }
                                    })

                                    item.iGstAmount += item2.GSTAmount
                                    // item.gst_details.push(
                                    //     {
                                    //         GSTType: `${item2.GSTType}`,
                                    //         Amount: item2.GSTAmount
                                    //     },
                                    // )

                                }
                            }
                        }

                        // product bill
                        const [fetchProduct] = await mysql2.pool.query(`select * from billdetail where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchProduct.length) {
                            for (const item2 of fetchProduct) {
                                // response.calculation[0].totalQty += item2.Quantity
                                // response.calculation[0].totalAmount += item2.TotalAmount
                                // response.calculation[0].totalGstAmount += item2.GSTAmount
                                response.calculation[0].totalUnitPrice += item2.UnitPrice
                                // response.calculation[0].totalDiscount += item2.DiscountAmount
                                // response.calculation[0].totalSubTotalPrice += item2.SubTotal

                                if (item2.GSTType === 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === 'CGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                        if (e.GSTType === 'SGST') {
                                            e.Amount += item2.GSTAmount / 2
                                        }
                                    })
                                    item.cGstAmount += item2.GSTAmount / 2
                                    item.sGstAmount += item2.GSTAmount / 2
                                    // if (item.gst_details.length === 0) {
                                    //     item.gst_details.push(
                                    //         {
                                    //             GSTType: `CGST`,
                                    //             Amount: item2.GSTAmount / 2
                                    //         },
                                    //         {
                                    //             GSTType: `SGST`,
                                    //             Amount: item2.GSTAmount / 2
                                    //         }
                                    //     )
                                    // } else {
                                    //     item.gst_details.forEach(e => {
                                    //         if (e.GSTType === 'CGST') {
                                    //             e.Amount += item2.GSTAmount / 2
                                    //         }
                                    //         if (e.GSTType === 'SGST') {
                                    //             e.Amount += item2.GSTAmount / 2
                                    //         }
                                    //     })
                                    // }

                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    response.calculation[0].gst_details.forEach(e => {
                                        if (e.GSTType === item2.GSTType) {
                                            e.Amount += item2.GSTAmount
                                        }
                                    })
                                    item.iGstAmount += item2.GSTAmount
                                    // item.gst_details.push(
                                    //     {
                                    //         GSTType: `${item2.GSTType}`,
                                    //         Amount: item2.GSTAmount
                                    //     },
                                    // )
                                }
                            }
                        }

                    }

                    const [fetchpayment] = await mysql2.pool.query(`select paymentmaster.PaymentMode, DATE_FORMAT(paymentmaster.PaymentDate, '%Y-%m-%d %H:%i:%s') as PaymentDate, paymentmaster.PaidAmount as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where BillMasterID = ${item.ID} and paymentmaster.PaymentMode != 'Payment Initiated'`)

                    if (fetchpayment.length) {
                        item.paymentDetail = fetchpayment
                    }

                    response.calculation[0].totalAmount = response.calculation[0].totalAmount
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
    getSalereportExport: async (req, res, next) => {
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalAddlDiscount": 0,
                    "totalDiscount": 0,
                    "totalPaidAmount": 0,
                    "totalUnitPrice": 0,
                    "totalSubTotalPrice": 0,
                    // "gst_details": []
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT billmaster.*, shop.Name AS ShopName, shop.AreaName AS AreaName, customer.Title AS Title , customer.Name AS CustomerName , customer.MobileNo1,customer.GSTNo AS GSTNo, customer.Age, customer.Gender,  billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN shop ON shop.ID = billmaster.ShopID  WHERE billmaster.CompanyID = ${CompanyID} and billmaster.Status = 1 ` +
                Parem + " GROUP BY billmaster.ID ORDER BY billmaster.ID DESC"

            let [data] = await mysql2.pool.query(qry);

            const [sumData] = await mysql2.pool.query(`SELECT SUM(billmaster.TotalAmount) AS TotalAmount, SUM(billmaster.Quantity) AS totalQty, SUM(billmaster.GSTAmount) AS totalGstAmount,SUM(billmaster.AddlDiscount) AS totalAddlDiscount, SUM(billmaster.DiscountAmount) AS totalDiscount, SUM(billmaster.SubTotal) AS totalSubTotalPrice  FROM billmaster WHERE billmaster.CompanyID = ${CompanyID} AND billmaster.Status = 1  ${Parem} `)


            if (sumData) {
                response.calculation[0].totalGstAmount = sumData[0].totalGstAmount ? sumData[0].totalGstAmount.toFixed(2) : 0
                response.calculation[0].totalAmount = sumData[0].TotalAmount ? sumData[0].TotalAmount.toFixed(2) : 0
                response.calculation[0].totalQty = sumData[0].totalQty ? sumData[0].totalQty : 0
                response.calculation[0].totalAddlDiscount = sumData[0].totalAddlDiscount ? sumData[0].totalAddlDiscount.toFixed(2) : 0
                response.calculation[0].totalDiscount = sumData[0].totalDiscount ? sumData[0].totalDiscount.toFixed(2) : 0
                response.calculation[0].totalSubTotalPrice = sumData[0].totalSubTotalPrice ? sumData[0].totalSubTotalPrice.toFixed(2) : 0
            }

            // let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

            // gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
            // if (gstTypes.length) {
            //     for (const item of gstTypes) {
            //         if ((item.Name).toUpperCase() === 'CGST-SGST') {
            //             response.calculation[0].gst_details.push(
            //                 {
            //                     GSTType: `CGST`,
            //                     Amount: 0
            //                 },
            //                 {
            //                     GSTType: `SGST`,
            //                     Amount: 0
            //                 }
            //             )
            //         } else {
            //             response.calculation[0].gst_details.push({
            //                 GSTType: `${item.Name}`,
            //                 Amount: 0
            //             })
            //         }
            //     }

            // }

            if (data.length) {
                for (const item of data) {
                    response.calculation[0].totalPaidAmount += item.TotalAmount - item.DueAmount
                    item.cGstAmount = 0
                    item.iGstAmount = 0
                    item.sGstAmount = 0
                    item.paymentDetail = []
                    if (item.BillType === 0) {
                        // service bill
                        const [fetchService] = await mysql2.pool.query(`select * from billservice where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchService.length) {
                            for (const item2 of fetchService) {
                                // response.calculation[0].totalAmount += item2.TotalAmount
                                // response.calculation[0].totalGstAmount += item2.GSTAmount
                                // response.calculation[0].totalSubTotalPrice += item2.SubTotal
                                response.calculation[0].totalUnitPrice += item2.Price

                                if (item2.GSTType === 'CGST-SGST') {
                                    // response.calculation[0].gst_details.forEach(e => {
                                    //     if (e.GSTType === 'CGST') {
                                    //         e.Amount += item2.GSTAmount / 2
                                    //     }
                                    //     if (e.GSTType === 'SGST') {
                                    //         e.Amount += item2.GSTAmount / 2
                                    //     }
                                    // })

                                    item.cGstAmount += item2.GSTAmount / 2
                                    item.sGstAmount += item2.GSTAmount / 2
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    // response.calculation[0].gst_details.forEach(e => {
                                    //     if (e.GSTType === item2.GSTType) {
                                    //         e.Amount += item2.GSTAmount
                                    //     }
                                    // })

                                    item.iGstAmount += item2.GSTAmount
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

                                // response.calculation[0].totalAmount += item2.TotalAmount
                                // response.calculation[0].totalGstAmount += item2.GSTAmount
                                // response.calculation[0].totalSubTotalPrice += item2.SubTotal
                                response.calculation[0].totalUnitPrice += item2.Price
                                if (item2.GSTType === 'CGST-SGST') {
                                    // response.calculation[0].gst_details.forEach(e => {

                                    //     if (e.GSTType === 'CGST') {
                                    //         e.Amount += item2.GSTAmount / 2
                                    //     }
                                    //     if (e.GSTType === 'SGST') {
                                    //         e.Amount += item2.GSTAmount / 2
                                    //     }
                                    // })
                                    item.cGstAmount += item2.GSTAmount / 2
                                    item.sGstAmount += item2.GSTAmount / 2
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    // response.calculation[0].gst_details.forEach(e => {
                                    //     if (e.GSTType === item2.GSTType) {
                                    //         e.Amount += item2.GSTAmount
                                    //     }
                                    // })

                                    item.iGstAmount += item2.GSTAmount
                                }
                            }
                        }

                        // product bill
                        const [fetchProduct] = await mysql2.pool.query(`select * from billdetail where BillID = ${item.ID} and CompanyID = ${CompanyID} and Status = 1`)

                        if (fetchProduct.length) {
                            for (const item2 of fetchProduct) {
                                // response.calculation[0].totalQty += item2.Quantity
                                // response.calculation[0].totalAmount += item2.TotalAmount
                                // response.calculation[0].totalGstAmount += item2.GSTAmount
                                response.calculation[0].totalUnitPrice += item2.UnitPrice
                                // response.calculation[0].totalDiscount += item2.DiscountAmount
                                // response.calculation[0].totalSubTotalPrice += item2.SubTotal

                                if (item2.GSTType === 'CGST-SGST') {
                                    // response.calculation[0].gst_details.forEach(e => {
                                    //     if (e.GSTType === 'CGST') {
                                    //         e.Amount += item2.GSTAmount / 2
                                    //     }
                                    //     if (e.GSTType === 'SGST') {
                                    //         e.Amount += item2.GSTAmount / 2
                                    //     }
                                    // })
                                    item.cGstAmount += item2.GSTAmount / 2
                                    item.sGstAmount += item2.GSTAmount / 2
                                }

                                if (item2.GSTType !== 'CGST-SGST') {
                                    // response.calculation[0].gst_details.forEach(e => {
                                    //     if (e.GSTType === item2.GSTType) {
                                    //         e.Amount += item2.GSTAmount
                                    //     }
                                    // })
                                    item.iGstAmount += item2.GSTAmount
                                }
                            }
                        }

                    }

                    const [fetchpayment] = await mysql2.pool.query(`select paymentmaster.PaymentMode, DATE_FORMAT(paymentmaster.PaymentDate, '%Y-%m-%d %H:%i:%s') as PaymentDate, paymentmaster.PaidAmount as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where BillMasterID = ${item.ID} and paymentmaster.PaymentMode != 'Payment Initiated'`)

                    if (fetchpayment.length) {
                        item.paymentDetail = fetchpayment
                    }

                    response.calculation[0].totalAmount = response.calculation[0].totalAmount
                    response.calculation[0].totalAddlDiscount += item.AddlDiscount

                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`salereport_export`);

            worksheet.columns = [
                { header: 'S.no', key: 'S_no', width: 8 },
                { header: 'InvoiceDate', key: 'InvoiceDate', width: 15 },
                { header: 'InvoiceNo', key: 'InvoiceNo', width: 20 },
                { header: 'CustomerName', key: 'CustomerName', width: 25 },
                { header: 'MobileNo', key: 'MobileNo1', width: 15 },
                { header: 'Age', key: 'Age', width: 5 },
                { header: 'Gender', key: 'Gender', width: 10 },
                { header: 'PaymentStatus', key: 'PaymentStatus', width: 10 },
                { header: 'Quantity', key: 'Quantity', width: 5 },
                { header: 'Discount', key: 'DiscountAmount', width: 10 },
                { header: 'SubTotal', key: 'SubTotal', width: 10 },
                { header: 'TAXAmount', key: 'GSTAmount', width: 10 },
                { header: 'CGSTAmt', key: 'cGstAmount', width: 10 },
                { header: 'SGSTAmt', key: 'sGstAmount', width: 10 },
                { header: 'IGSTAmt', key: 'iGstAmount', width: 10 },
                { header: 'GrandTotal', key: 'TotalAmount', width: 12 },
                { header: 'AddDiscount', key: 'AddlDiscount', width: 10 },
                { header: 'Paid', key: 'Paid', width: 10 },
                { header: 'Balance', key: 'Balance', width: 10 },
                { header: 'ProductStatus', key: 'ProductStatus', width: 12 },
                { header: 'DeliveryDate', key: 'DeliveryDate', width: 15 },
                { header: 'Cust_GSTNo', key: 'GSTNo', width: 15 },
                { header: 'ShopName', key: 'ShopName', width: 20 },
                { header: 'INT_1_Date', key: 'INT_1_Date', width: 15 },
                { header: 'INT_1_Mode', key: 'INT_1_Mode', width: 15 },
                { header: 'INT_1_Amount', key: 'INT_1_Amount', width: 15 },
                { header: 'INT_2_Date', key: 'INT_2_Date', width: 15 },
                { header: 'INT_2_Mode', key: 'INT_2_Mode', width: 15 },
                { header: 'INT_2_Amount', key: 'INT_2_Amount', width: 15 },
                { header: 'INT_3_Date', key: 'INT_3_Date', width: 15 },
                { header: 'INT_3_Mode', key: 'INT_3_Mode', width: 15 },
                { header: 'INT_3_Amount', key: 'INT_3_Amount', width: 15 },
                { header: 'INT_4_Date', key: 'INT_4_Date', width: 15 },
                { header: 'INT_4_Mode', key: 'INT_4_Mode', width: 15 },
                { header: 'INT_4_Amount', key: 'INT_4_Amount', width: 15 },
                { header: 'INT_5_Date', key: 'INT_5_Date', width: 15 },
                { header: 'INT_5_Mode', key: 'INT_5_Mode', width: 15 },
                { header: 'INT_5_Amount', key: 'INT_5_Amount', width: 15 },
                { header: 'INT_6_Date', key: 'INT_6_Date', width: 15 },
                { header: 'INT_6_Mode', key: 'INT_6_Mode', width: 15 },
                { header: 'INT_6_Amount', key: 'INT_6_Amount', width: 15 },
                { header: 'INT_7_Date', key: 'INT_7_Date', width: 15 },
                { header: 'INT_7_Mode', key: 'INT_7_Mode', width: 15 },
                { header: 'INT_7_Amount', key: 'INT_7_Amount', width: 15 },
                { header: 'INT_8_Date', key: 'INT_8_Date', width: 15 },
                { header: 'INT_8_Mode', key: 'INT_8_Mode', width: 15 },
                { header: 'INT_8_Amount', key: 'INT_8_Amount', width: 10 },

            ];

            let count = 1;
            const datum = {
                "S_no": '',
                "InvoiceDate": '',
                "InvoiceNo": '',
                "CustomerName": '',
                "MobileNo": '',
                "Age": '',
                "Gender": '',
                "PaymentStatus": '',
                "Quantity": response.calculation[0].totalQty,
                "DiscountAmount": response.calculation[0].totalDiscount,
                "SubTotal": response.calculation[0].totalSubTotalPrice,
                "GSTAmount": response.calculation[0].totalGstAmount,
                "CGSTAmt": '',
                "SGSTAmt": '',
                "IGSTAmt": '',
                "TotalAmount": Number(response.calculation[0].totalAmount).toFixed(2),
                "AddlDiscount": Number(response.calculation[0].totalAddlDiscount).toFixed(2),
                "Paid": Number(response.calculation[0].totalPaidAmount.toFixed(2)),
                "Balance": response.calculation[0].totalAmount - response.calculation[0].totalPaidAmount.toFixed(2),
                "ProductStatus": '',
                "DeliveryDate": '',
                "Cust_GSTNo": '',
                "ShopName": '',
                "INT_1_Date": '',
                "INT_1_Mode": '',
                "INT_1_Amount": '',
                "INT_2_Date": '',
                "INT_2_Mode": '',
                "INT_2_Amount": '',
                "INT_3_Date": '',
                "INT_3_Mode": '',
                "INT_3_Amount": '',
                "INT_4_Date": '',
                "INT_4_Mode": '',
                "INT_4_Amount": '',
                "INT_5_Date": '',
                "INT_5_Mode": '',
                "INT_5_Amount": '',
                "INT_6_Date": '',
                "INT_6_Mode": '',
                "INT_6_Amount": '',
                "INT_7_Date": '',
                "INT_7_Mode": '',
                "INT_7_Amount": '',
                "INT_8_Date": '',
                "INT_8_Mode": '',
                "INT_8_Amount": '',
            }

            worksheet.addRow(datum);
            console.log("Start Exporting...");
            data.forEach((x) => {
                x.S_no = count++;
                x.InvoiceDate = moment(x.BillDate).format('YYYY-MM-DD HH:mm a');
                x.DeliveryDate = moment(x.DeliveryDate).format('YYYY-MM-DD HH:mm a');
                x.INT_1_Date = x.paymentDetail[0]?.PaymentDate ? x.paymentDetail[0]?.PaymentDate : ''
                x.INT_1_Mode = x.paymentDetail[0]?.PaymentMode ? x.paymentDetail[0]?.PaymentMode : ''
                x.INT_1_Amount = x.paymentDetail[0]?.Amount ? x.paymentDetail[0]?.Amount : ''
                x.INT_2_Date = x.paymentDetail[1]?.PaymentDate ? x.paymentDetail[1]?.PaymentDate : ''
                x.INT_2_Mode = x.paymentDetail[1]?.PaymentMode ? x.paymentDetail[1]?.PaymentMode : ''
                x.INT_2_Amount = x.paymentDetail[1]?.Amount ? x.paymentDetail[1]?.Amount : ''
                x.INT_3_Date = x.paymentDetail[2]?.PaymentDate ? x.paymentDetail[2]?.PaymentDate : ''
                x.INT_3_Mode = x.paymentDetail[2]?.PaymentMode ? x.paymentDetail[2]?.PaymentMode : ''
                x.INT_3_Amount = x.paymentDetail[2]?.Amount ? x.paymentDetail[2]?.Amount : ''
                x.INT_4_Date = x.paymentDetail[3]?.PaymentDate ? x.paymentDetail[3]?.PaymentDate : ''
                x.INT_4_Mode = x.paymentDetail[3]?.PaymentMode ? x.paymentDetail[3]?.PaymentMode : ''
                x.INT_4_Amount = x.paymentDetail[3]?.Amount ? x.paymentDetail[3]?.Amount : ''
                x.INT_5_Date = x.paymentDetail[4]?.PaymentDate ? x.paymentDetail[4]?.PaymentDate : ''
                x.INT_5_Mode = x.paymentDetail[4]?.PaymentMode ? x.paymentDetail[4]?.PaymentMode : ''
                x.INT_5_Amount = x.paymentDetail[4]?.Amount ? x.paymentDetail[4]?.Amount : ''
                x.INT_6_Date = x.paymentDetail[5]?.PaymentDate ? x.paymentDetail[5]?.PaymentDate : ''
                x.INT_6_Mode = x.paymentDetail[5]?.PaymentMode ? x.paymentDetail[5]?.PaymentMode : ''
                x.INT_6_Amount = x.paymentDetail[5]?.Amount ? x.paymentDetail[5]?.Amount : ''
                x.INT_7_Date = x.paymentDetail[6]?.PaymentDate ? x.paymentDetail[6]?.PaymentDate : ''
                x.INT_7_Mode = x.paymentDetail[6]?.PaymentMode ? x.paymentDetail[6]?.PaymentMode : ''
                x.INT_7_Amount = x.paymentDetail[6]?.Amount ? x.paymentDetail[6]?.Amount : ''
                x.INT_8_Date = x.paymentDetail[7]?.PaymentDate ? x.paymentDetail[7]?.PaymentDate : ''
                x.INT_8_Mode = x.paymentDetail[7]?.PaymentMode ? x.paymentDetail[7]?.PaymentMode : ''
                x.INT_8_Amount = x.paymentDetail[7]?.Amount ? x.paymentDetail[7]?.Amount : ''
                x.Paid = x.TotalAmount - x.DueAmount
                x.Balance = x.DueAmount
                worksheet.addRow(x);
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'AU1',
            };

            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=salereport_export.xlsx`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            console.log("Export...");
            await workbook.xlsx.write(res);
            return res.end();

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
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and billdetail.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT billdetail.*, customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.Title AS Title, customer.Sno AS MrdNo, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.Status = 1 AND billdetail.CompanyID = '${CompanyID}' ${searchString} AND billdetail.Quantity != 0 AND shop.Status = 1 ` + Parem

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.Status = 1  ${searchString} AND billdetail.CompanyID = ${CompanyID} ` + Parem)

            let [data] = await mysql2.pool.query(qry);

            console.log(qry, 'qry');

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.Status = 1 ${searchString}  AND billdetail.CompanyID = ${CompanyID} ` + Parem);

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
            console.log(err);
            next(err)
        }

    },
    getSalereportsDetailExport: async (req, res, next) => {
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
                    // "gst_details": []
                }], success: true, message: ""
            }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and billdetail.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT billdetail.*, customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.Title AS Title, customer.Sno AS MrdNo, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.Status = 1 AND billdetail.CompanyID = '${CompanyID}' ${searchString} AND billdetail.Quantity != 0 AND shop.Status = 1 ` + Parem

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.Status = 1  ${searchString} AND billdetail.CompanyID = ${CompanyID} ` + Parem)

            let [data] = await mysql2.pool.query(qry);


            // let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE billdetail.Status = 1 ${searchString}  AND billdetail.CompanyID = ${CompanyID} ` + Parem);

            // let [gstTypes] = await mysql2.pool.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

            // gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
            // const values = []

            // if (gstTypes.length) {
            //     for (const item of gstTypes) {
            //         if ((item.Name).toUpperCase() === 'CGST-SGST') {
            //             values.push(
            //                 {
            //                     GSTType: `CGST`,
            //                     Amount: 0
            //                 },
            //                 {
            //                     GSTType: `SGST`,
            //                     Amount: 0
            //                 }
            //             )
            //         } else {
            //             values.push({
            //                 GSTType: `${item.Name}`,
            //                 Amount: 0
            //             })
            //         }
            //     }

            // }

            // if (data2.length && values.length) {
            //     for (const item of data2) {
            //         values.forEach(e => {
            //             if (e.GSTType === item.GSTType) {
            //                 e.Amount += item.GSTAmount
            //             }

            //             // CGST-SGST

            //             if (item.GSTType === 'CGST-SGST') {

            //                 if (e.GSTType === 'CGST') {
            //                     e.Amount += item.GSTAmount / 2
            //                 }

            //                 if (e.GSTType === 'SGST') {
            //                     e.Amount += item.GSTAmount / 2
            //                 }
            //             }
            //         })

            //     }

            // }
            const values2 = []

            // if (gstTypes.length) {
            //     for (const item of gstTypes) {
            //         if ((item.Name).toUpperCase() === 'CGST-SGST') {
            //             values2.push(
            //                 {
            //                     GSTType: `CGST`,
            //                     Amount: 0
            //                 },
            //                 {
            //                     GSTType: `SGST`,
            //                     Amount: 0
            //                 }
            //             )
            //         } else {
            //             values2.push({
            //                 GSTType: `${item.Name}`,
            //                 Amount: 0
            //             })
            //         }
            //     }

            // }
            // && values2.length
            if (data.length) {
                for (let item of data) {
                    item.cGstAmount = 0
                    item.iGstAmount = 0
                    item.sGstAmount = 0
                    item.cGstPercentage = 0
                    item.iGstPercentage = 0
                    item.sGstPercentage = 0
                    if (item.GSTType === 'CGST-SGST') {
                        item.cGstAmount = item.GSTAmount / 2
                        item.sGstAmount = item.GSTAmount / 2
                        item.cGstPercentage = item.GSTPercentage / 2
                        item.sGstPercentage = item.GSTPercentage / 2
                    }
                    if (item.GSTType === 'IGST') {
                        item.iGstAmount = item.GSTAmount
                        item.iGstPercentage = item.GSTPercentage
                    }
                    // item.gst_details = []
                    // values2.forEach(e => {
                    //     if (e.GSTType === item.GSTType) {
                    //         e.Amount += item.GSTAmount
                    //         item.gst_details.push({
                    //             GSTType: item.GSTType,
                    //             Amount: item.GSTAmount
                    //         })
                    //     }

                    //     // CGST-SGST

                    //     if (item.GSTType === 'CGST-SGST') {

                    //         if (e.GSTType === 'CGST') {
                    //             e.Amount += item.GSTAmount / 2

                    //             item.gst_details.push({
                    //                 GSTType: 'CGST',
                    //                 Amount: item.GSTAmount / 2
                    //             })
                    //         }

                    //         if (e.GSTType === 'SGST') {
                    //             e.Amount += item.GSTAmount / 2

                    //             item.gst_details.push({
                    //                 GSTType: 'SGST',
                    //                 Amount: item.GSTAmount / 2
                    //             })
                    //         }
                    //     }
                    // })

                    // profit calculation
                    item.ModifyPurchasePrice = item.PurchasePrice * item.Quantity;
                    item.Profit = item.SubTotal - (item.PurchasePrice * item.Quantity)

                    response.calculation[0].totalPurchasePrice += item.ModifyPurchasePrice
                    response.calculation[0].totalProfit += item.Profit
                }



            }
            // response.calculation[0].gst_details = values2;
            response.calculation[0].totalPurchasePrice = response.calculation[0].totalPurchasePrice.toFixed(2) || 0
            response.calculation[0].totalProfit = response.calculation[0].totalProfit.toFixed(2) || 0
            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`sale_detailreport_export`);

            worksheet.columns = [
                { header: 'S.No', key: 'S_no', width: 8 },
                { header: 'InvoiceDate', key: 'InvoiceDate', width: 20 },
                { header: 'DeliveryDate', key: 'DeliveryDate', width: 20 },
                { header: 'InvoiceNo', key: 'BillInvoiceNo', width: 20 },
                { header: 'Customer Name', key: 'CustomerName', width: 30 },
                { header: 'MRDNo', key: 'MrdNo', width: 15 },
                { header: 'MobileNo', key: 'CustomerMoblieNo1', width: 15 },
                { header: 'ProductType Name', key: 'ProductTypeName', width: 20 },
                { header: 'Option', key: 'Optionsss', width: 15 },
                { header: 'HSNCode', key: 'HSNCode', width: 15 },
                { header: 'Product Name', key: 'ProductName', width: 30 },
                { header: 'Unit Price', key: 'UnitPrice', width: 15 },
                { header: 'Quantity', key: 'Quantity', width: 10 },
                { header: 'Discount Amount', key: 'DiscountAmount', width: 15 },
                { header: 'Sub Total', key: 'SubTotal', width: 15 },
                { header: 'TAX Type', key: 'GSTType', width: 10 },
                { header: 'TAX%', key: 'GSTPercentage', width: 10 },
                { header: 'TAX Amount', key: 'GSTAmount', width: 15 },
                { header: 'CGST%', key: 'cGstPercentage', width: 10 },
                { header: 'CGSTAmt', key: 'cGstAmount', width: 15 },
                { header: 'SGST%', key: 'sGstPercentage', width: 10 },
                { header: 'SGSTAmt', key: 'sGstAmount', width: 15 },
                { header: 'IGST%', key: 'iGstPercentage', width: 10 },
                { header: 'IGSTAmt', key: 'iGstAmount', width: 15 },
                { header: 'Grand Total', key: 'TotalAmount', width: 15 },
                { header: 'Barcode', key: 'Barcode', width: 15 },
                { header: 'Payment Status', key: 'PaymentStatus', width: 15 },
                { header: 'Product Status', key: 'ProductStatus', width: 15 },
                { header: 'Product DeliveryDate', key: 'ProductDeliveryDate', width: 20 },
                { header: 'Cust_TAXNo', key: 'Cust_TAXNo', width: 15 },
                { header: 'Status', key: 'Status', width: 10 },
                { header: 'Shop Name', key: 'ShopName', width: 30 },
                { header: 'PurchasePrice', key: 'ModifyPurchasePrice', width: 15 },
                { header: 'Profit', key: 'Profit', width: 10 }
            ];


            const d = {
                "S_no": '',
                "InvoiceDate": '',
                "DeliveryDate": '',
                "InvoiceNo": '',
                "CustomerName": '',
                "MRDNo": '',
                "MobileNo": '',
                "ProductTypeName": '',
                "Option": '',
                "HSNCode": '',
                "ProductName": '',
                "UnitPrice": '',
                "Quantity": Number(response.calculation[0].totalQty),
                "DiscountAmount": Number(response.calculation[0].totalDiscount),
                "SubTotal": Number(response.calculation[0].totalUnitPrice),
                "TAXType": '',
                "TAXPercentage": '',
                "GSTAmount": Number(response.calculation[0].totalGstAmount),
                "CGSTPercentage": '',
                "CGSTAmt": '',
                "SGSTPercentage": '',
                "SGSTAmt": '',
                "IGSTPercentage": '',
                "IGSTAmt": '',
                "TotalAmount": Number(response.calculation[0].totalAmount),
                "Barcode": '',
                "PaymentStatus": '',
                "ProductStatus": '',
                "ProductDeliveryDate": '',
                "Cust_TAXNo": '',
                "Status": '',
                "ShopName": '',
                "ModifyPurchasePrice": Number(response.calculation[0].totalPurchasePrice),
                "Profit": Number(response.calculation[0].totalProfit)
            };
            worksheet.addRow(d);
            let count = data.length;
            console.log("Start Exporting...");
            data.forEach((x) => {
                x.S_no = count--;
                x.InvoiceDate = moment(x.BillDate).format('YYYY-MM-DD HH:mm a');
                x.DeliveryDate = moment(x.DeliveryDate).format('YYYY-MM-DD HH:mm a');
                x.ProductStatus = x.ProductStatus === 0 ? 'Pending' : 'Deliverd'
                x.Status = ``
                if (x.Manual === 1) {
                    x.Status = 'Manual'
                } else if (x.PreOrder === 1) {
                    x.Status = 'PreOrder'
                } else {
                    x.Status = 'Stock'
                }
                worksheet.addRow(x);
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'AH1',
            };

            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=sale_detailreport_export.xlsx`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            console.log("Export...");
            await workbook.xlsx.write(res);
            return res.end();

            response.data = data
            response.message = "success";
            return res.send(response);



        } catch (err) {
            console.log(err);
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
            const response = { data: null, success: true, message: "", sumQty: 0 }
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

            let qry = `SELECT 0 AS Sel , barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,barcodemasternew.CurrentStatus,barcodemasternew.SupplierID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, barcodemasternew.Optionsss as Optionsss, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID WHERE  barcodemasternew.BillDetailID != 0 and barcodemasternew.PurchaseDetailID = 0 AND  barcodemasternew.SupplierID = 0 and billdetail.Status = 1 and barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.CurrentStatus = 'Pre Order' AND billdetail.PreOrder = 1  ${masterParam}  ${parem} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

            console.log(qry);

            const [data] = await mysql2.pool.query(qry)
            response.data = data
            response.message = "success";
            if (data) {
                data.forEach(x => {
                    response.sumQty += x.Quantity
                })
            }
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
            const response = { data: null, success: true, message: "", sumQty: 0 }
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

            let qry = `SELECT 0 AS Sel, barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,barcodemasternew.CurrentStatus,barcodemasternew.SupplierID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.PurchasePrice as UnitPrice, billdetail.Quantity, billdetail.Quantity as saleQuantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, barcodemasternew.Optionsss as Optionsss, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, supplier.Name as SupplierName, billdetail.WholeSale, billdetail.Manual, billdetail.PreOrder,barcodemasternew.WholeSalePrice, barcodemasternew.RetailPrice, barcodemasternew.SupplierDocNo  FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN supplier on supplier.ID = barcodemasternew.SupplierID WHERE  barcodemasternew.BillDetailID != 0 and barcodemasternew.PurchaseDetailID = 0 AND  barcodemasternew.SupplierID != 0 and barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.CurrentStatus = 'Pre Order' AND billdetail.PreOrder = 1   ${parem} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            if (data.length) {
                for (let Item of data) {
                    Item.DiscountAmount = 0
                    Item.DiscountPercentage = 0
                    Item.SubTotal = Item.UnitPrice * Item.Quantity - Item.DiscountAmount
                    Item.GSTAmount = gstAmount(Item.SubTotal, Item.GSTPercentage)
                    Item.TotalAmount = Item.SubTotal + Item.GSTAmount
                    response.sumQty += Item.Quantity
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
            const productListHVD = req.body.productList;

            printdata.todaydate = moment().format("DD/MM/YYYY");

            if (CompanyID !== 184) {
                let modifyList = [];
                let invoiceNos = [];

                productList.forEach(ell => {
                    ell.InvoiceDate = moment(ell.InvoiceDate).format("DD-MM-YYYY")
                    ell.DeliveryDate = moment(ell.DeliveryDate).format("DD-MM-YYYY")
                    ell.s = [ell.ProductName];
                    ell.R = [ell.Remark];
                    ell.o = [ell.Optionsss];

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
                        if (!existingItem.o.some(obj => obj.Optionsss === ell.Optionsss)) {
                            existingItem.o.push(ell.Optionsss);
                        }
                    }

                });

                printdata.productList = modifyList
            } else {
                printdata.productListHVD = productListHVD

                let totalQty = 0
                let gstTotal = 0
                let totalAmount = 0
                let totalPurchaseRate = 0

                for (var i = 0; i < printdata.productListHVD.length; i++) {
                    totalQty = totalQty + printdata.productListHVD[i].Quantity;
                    gstTotal = gstTotal + printdata.productListHVD[i].GSTAmount;
                    totalAmount = totalAmount + printdata.productListHVD[i].TotalAmount;
                    totalPurchaseRate = totalPurchaseRate + printdata.productListHVD[i].UnitPrice * printdata.productListHVD[i].Quantity;
                }

                printdata.totalQty = totalQty;
                printdata.gstTotal = gstTotal;
                printdata.totalAmount = totalAmount;
                printdata.totalPurchaseRate = totalPurchaseRate;
            }

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

            if (CompanyID === 184) {
                printdata.LogoURL = clientConfig.appURL + 'assest/hvd.jpeg';
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
                    let options;
                    if (CompanyID == 184) {
                        options = {
                            "height": "11.25in",
                            "width": "8.5in",
                            header: {
                                height: "0mm"
                            },
                            footer: {
                                height: "30mm",
                                contents: {
                                    last: ` <section style="width: 96%; border-top:1px solid #000;">
                                    <div style="width: 10%; float:right;line-height: 25px; text-align: right;">
                                        <div  >  ${printdata.totalQty}</div>
                                        <div  >   ${parseFloat(printdata.gstTotal).toFixed(2)}</div>
                                        <div  >  ${printdata.totalPurchaseRate}</div>
                                        <div  >   ${parseFloat(printdata.totalAmount).toFixed(2)}</div>
                                      </div>
                                     <div style="width: 20%; float:right; line-height: 25px;">
                                       <div style="text-align: left; font-weight: bold;font-size: 16px;"> Total Qty </div>
                                       <div style="text-align: left; font-weight: bold;font-size: 16px;"> Total GSTAmt </div>
                                       <div style="text-align: left; font-weight: bold;font-size: 16px;"> Total Purchase Rate </div>
                                       <div style="text-align: left; font-weight: bold;font-size: 16px;"> Total Amount </div>
                                     </div>


                                 </section>`,
                                },
                            },
                        };
                    } else {
                        options = {
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
                    }

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
            const [savePurchase] = await mysql2.pool.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${purchase.PaymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,0,${purchase.TotalAmount}, ${LoggedOnUser}, '${req.headers.currenttime}')`);

            console.log(connected("Data Save SuccessFUlly !!!"));


            //  save purchase detail data
            for (const item of PurchaseDetail) {

                // generate unique barcode
                item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},0,${item.WholeSale},'${item.BaseBarcode}',0,1,'${item.BaseBarcode}',0,0,'${item.UniqueBarcode}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)


                let saleCount = 0
                let count = 0
                saleCount = Number(item.saleQuantity)
                count = Number(item.Quantity) - saleCount

                const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set PurchaseDetailID = ${savePurchaseDetail.insertId}, CurrentStatus = 'Sold' where BillDetailID = ${item.BillDetailID}`)

                if (count !== 0 && count > 0) {
                    for (j = 0; j < count; j++) {
                        const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${savePurchaseDetail.insertId},'${item.GSTType}',${item.GSTPercentage}, '${item.Barcode}','${req.headers.currenttime}','Available', ${item.RetailPrice},0,0,${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '${req.headers.currenttime}')`)
                    }
                }



            }


            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Debit','${req.headers.currenttime}', 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

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

            let qry = `SELECT barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,barcodemasternew.CurrentStatus,barcodemasternew.SupplierID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, barcodemasternew.Optionsss as Optionsss, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, supplier.Name as SupplierName FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN supplier on supplier.ID = barcodemasternew.SupplierID WHERE  barcodemasternew.BillDetailID != 0 and barcodemasternew.PurchaseDetailID != 0 AND  barcodemasternew.SupplierID != 0 and barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.CurrentStatus = 'Sold' AND billdetail.PreOrder = 1   ${parem} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

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
            const response = { data: null, success: true, message: "", sumQty: 0 }
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
            if (data) {
                data.forEach(x => {
                    response.sumQty += x.Quantity
                })
            }
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
                ell.o = [ell.Optionsss];  // Initialize 'ell.s' as an array with the current ProductName.

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
                    if (!existingItem.o.some(obj => obj.Optionsss === ell.Optionsss)) {
                        existingItem.o.push(ell.Optionsss);
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
            const response = { data: null, success: true, message: "", sumQty: 0 }
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
            if (data) {
                data.forEach(x => {
                    response.sumQty += x.Quantity
                })
            }
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
    // cashcollectionreport: async (req, res, next) => {
    //     try {
    //         const response = { data: null, success: true, message: "", paymentMode: [], sumOfPaymentMode: 0, AmountReturnByDebit: 0, AmountReturnByCredit: 0, totalAmount: 0 }
    //         const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    //         const shopid = await shopID(req.headers) || 0;


    //         const { Date, ShopID, PaymentMode, PaymentStatus } = req.body;
    //         let shop = ``
    //         let shop2 = ``
    //         let paymentType = ``
    //         let paymentStatus = ``

    //         if (ShopID) {
    //             shop = ` and billmaster.ShopID = ${ShopID}`
    //             shop2 = ` and paymentmaster.ShopID = ${ShopID}`
    //         }
    //         if (PaymentMode) {
    //             paymentType = ` and paymentmaster.PaymentMode = '${PaymentMode}' `
    //         }
    //         if (PaymentStatus) {
    //             paymentStatus = ` and billmaster.PaymentStatus = '${PaymentStatus}'`
    //         }


    //         let qry = `select paymentmaster.CustomerID, paymentmaster.ShopID, paymentmaster.PaymentMode, paymentmaster.PaymentDate, paymentmaster.CardNo, paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentdetail.Amount, paymentdetail.DueAmount, billmaster.InvoiceNo, billmaster.BillDate,billmaster.DeliveryDate, billmaster.PaymentStatus, billmaster.TotalAmount, shop.Name as ShopName, shop.AreaName, customer.Name as CustomerName, customer.MobileNo1, paymentmaster.CreditType from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID left join billmaster on billmaster.ID = paymentdetail.BillMasterID left join shop on shop.ID = paymentmaster.ShopID left join customer on customer.ID = paymentmaster.CustomerID where  paymentmaster.CompanyID = '${CompanyID}' and paymentdetail.PaymentType IN ( 'Customer', 'Customer Credit' ) and paymentmaster.CreditType = 'Credit' and paymentmaster.PaymentMode != 'Payment Initiated'  ${shop} ${paymentStatus} ${paymentType} ` + Date + ` order by paymentdetail.BillMasterID desc`

    //         console.log(qry);
    //         const [data] = await mysql2.pool.query(qry)

    //         const [paymentMode] = await mysql2.pool.query(`select supportmaster.Name, 0 as Amount from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'PaymentModeType' order by ID desc`)

    //         response.paymentMode = paymentMode

    //         if (data) {
    //             for (let item of data) {
    //                 response.paymentMode.forEach(x => {
    //                     if (item.PaymentMode === x.Name && item.CreditType === 'Credit') {
    //                         x.Amount += item.Amount
    //                         response.sumOfPaymentMode += item.Amount
    //                     }
    //                 })

    //                 if (item.PaymentMode === 'Customer Credit') {
    //                     console.log('hii');
    //                     delete item
    //                 }

    //             }
    //         }

    //         const [debitReturn] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentdetail.PaymentType = 'Customer' and paymentdetail.Credit = 'Debit' and paymentdetail.CompanyID = ${CompanyID} ${shop2}` + Date)
    //         const [creditReturn] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentdetail.PaymentType = 'Customer Credit' and paymentdetail.Credit = 'Credit' and paymentdetail.CompanyID = ${CompanyID} ${shop2}` + Date)

    //         if (debitReturn[0].Amount !== null) {
    //             response.AmountReturnByDebit = debitReturn[0].Amount
    //         }
    //         if (creditReturn[0].Amount !== null) {
    //             response.AmountReturnByCredit = creditReturn[0].Amount
    //         }


    //         response.totalAmount = response.sumOfPaymentMode - response.AmountReturnByDebit - response.AmountReturnByCredit
    //         // response.sumOfPaymentMode = response.sumOfPaymentMode - response.AmountReturnByCredit
    //         response.data = data
    //         response.message = "success";
    //         return res.send(response);
    //     } catch (err) {
    //         console.log(err);
    //         next(err)
    //     }
    // },
    cashcollectionreport: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", paymentMode: [], sumOfPaymentMode: 0, AmountReturnByDebit: 0, AmountReturnByCredit: 0, totalExpense: 0, totalAmount: 0 };
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Date, ShopID, PaymentMode, PaymentStatus } = req.body;
            let shop = ``;
            let shop2 = ``;
            let paymentType = ``;
            let paymentStatus = ``;

            if (ShopID) {
                shop = ` and billmaster.ShopID = ${ShopID}`;
                shop2 = ` and paymentmaster.ShopID = ${ShopID}`;
            }
            if (PaymentMode) {
                paymentType = ` and paymentmaster.PaymentMode = '${PaymentMode}' `;
            }
            if (PaymentStatus) {
                paymentStatus = ` and billmaster.PaymentStatus = '${PaymentStatus}'`;
            }

            let qry = `select paymentmaster.CustomerID, paymentmaster.ShopID, paymentmaster.PaymentMode, paymentmaster.PaymentDate, paymentmaster.CardNo, paymentmaster.PaymentReferenceNo, paymentmaster.PayableAmount, paymentdetail.Amount, paymentdetail.DueAmount, billmaster.InvoiceNo, billmaster.BillDate,billmaster.DeliveryDate, billmaster.PaymentStatus, billmaster.TotalAmount, shop.Name as ShopName, shop.AreaName, customer.Name as CustomerName, customer.MobileNo1, paymentmaster.CreditType from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID left join billmaster on billmaster.ID = paymentdetail.BillMasterID left join shop on shop.ID = paymentmaster.ShopID left join customer on customer.ID = paymentmaster.CustomerID where  paymentmaster.CompanyID = '${CompanyID}' and paymentdetail.PaymentType IN ( 'Customer', 'Customer Credit' ) and paymentmaster.CreditType = 'Credit' and paymentmaster.PaymentMode != 'Payment Initiated'  ${shop} ${paymentStatus} ${paymentType} ` + Date + ` order by paymentdetail.BillMasterID desc`;

            console.log(qry);
            const [data] = await mysql2.pool.query(qry);

            const [paymentMode] = await mysql2.pool.query(`select supportmaster.Name, 0 as Amount from supportmaster where Status = 1 and CompanyID = '${CompanyID}' and TableName = 'PaymentModeType' order by ID desc`);

            response.paymentMode = paymentMode;

            if (data) {
                // Iterate through the array in reverse to avoid index issues when removing items
                for (let i = data.length - 1; i >= 0; i--) {
                    let item = data[i];

                    response.paymentMode.forEach(x => {
                        if (item.PaymentMode === x.Name && item.CreditType === 'Credit') {
                            x.Amount += item.Amount;
                            // response.sumOfPaymentMode += item.Amount;
                        }
                    });

                    if (item.PaymentMode === 'Customer Credit') {
                        data.splice(i, 1); // Remove 1 element at index i
                    }

                    if (item.PaymentMode.toUpperCase() == 'AMOUNT RETURN') {
                        response.sumOfPaymentMode -= item.Amount;
                    } else if (item.PaymentMode !== 'Customer Credit') {
                        response.sumOfPaymentMode += item.Amount;
                    }
                }
            }

            // const [debitReturn] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentdetail.PaymentType = 'Customer' and paymentdetail.Credit = 'Debit' and paymentdetail.CompanyID = ${CompanyID} ${shop2}` + Date);
            // const [creditReturn] = await mysql2.pool.query(`select SUM(paymentdetail.Amount) as Amount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentdetail.PaymentType = 'Customer Credit' and paymentdetail.Credit = 'Credit' and paymentdetail.CompanyID = ${CompanyID} ${shop2}` + Date);

            // if (debitReturn[0].Amount !== null) {
            //     response.AmountReturnByDebit = debitReturn[0].Amount;
            // }
            // if (creditReturn[0].Amount !== null) {
            //     response.AmountReturnByCredit = creditReturn[0].Amount;
            // }
            const [ExpenseData] = await mysql2.pool.query(`select SUM(paymentmaster.PaidAmount) as ExpenseAmount from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.Status = 1 and  paymentmaster.CompanyID = '${CompanyID}' and paymentdetail.PaymentType IN ( 'Expense' ) and paymentmaster.CreditType = 'Debit' and paymentmaster.PaymentMode != 'Payment Initiated'  ${shop2}  ${paymentType} ` + Date + ` order by paymentdetail.BillMasterID desc`);

            console.log("ExpenseData ====>", ExpenseData);

            response.totalExpense = ExpenseData[0].ExpenseAmount || 0
            response.totalAmount = response.sumOfPaymentMode;
            response.data = data;
            response.message = "success";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err);
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
    },
    updateVisitDateContactlensTable: async (req, res, next) => {
        try {


            const response = { data: null, success: true, message: "" }

            const data = [
                {
                    "ID": 8361,
                    "other": 44723,
                    "VisitDate": "2022-06-11"
                },
                {
                    "ID": 8362,
                    "other": 44890,
                    "VisitDate": "2022-11-25"
                },
                {
                    "ID": 8363,
                    "other": 44923,
                    "VisitDate": "2022-12-28"
                },
                {
                    "ID": 8364,
                    "other": 44706,
                    "VisitDate": "2022-05-25"
                },
                {
                    "ID": 8365,
                    "other": 44942,
                    "VisitDate": "2023-01-16"
                },
                {
                    "ID": 8366,
                    "other": 44854,
                    "VisitDate": "2022-10-20"
                },
                {
                    "ID": 8367,
                    "other": 44607,
                    "VisitDate": "2022-02-15"
                },
                {
                    "ID": 8368,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8369,
                    "other": 44810,
                    "VisitDate": "2022-09-06"
                },
                {
                    "ID": 8370,
                    "other": 44956,
                    "VisitDate": "2023-01-30"
                },
                {
                    "ID": 8371,
                    "other": 44738,
                    "VisitDate": "2022-06-26"
                },
                {
                    "ID": 8372,
                    "other": 44703,
                    "VisitDate": "2022-05-22"
                },
                {
                    "ID": 8373,
                    "other": 44915,
                    "VisitDate": "2022-12-20"
                },
                {
                    "ID": 8374,
                    "other": 44673,
                    "VisitDate": "2022-04-22"
                },
                {
                    "ID": 8375,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8376,
                    "other": 44707,
                    "VisitDate": "2022-05-26"
                },
                {
                    "ID": 8377,
                    "other": 44688,
                    "VisitDate": "2022-05-07"
                },
                {
                    "ID": 8378,
                    "other": 44749,
                    "VisitDate": "2022-07-07"
                },
                {
                    "ID": 8379,
                    "other": 44914,
                    "VisitDate": "2022-12-19"
                },
                {
                    "ID": 8380,
                    "other": 44613,
                    "VisitDate": "2022-02-21"
                },
                {
                    "ID": 8381,
                    "other": 44588,
                    "VisitDate": "2022-01-27"
                },
                {
                    "ID": 8382,
                    "other": 44840,
                    "VisitDate": "2022-10-06"
                },
                {
                    "ID": 8383,
                    "other": 44760,
                    "VisitDate": "2022-07-18"
                },
                {
                    "ID": 8384,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 8385,
                    "other": 44934,
                    "VisitDate": "2023-01-08"
                },
                {
                    "ID": 8386,
                    "other": 44936,
                    "VisitDate": "2023-01-10"
                },
                {
                    "ID": 8387,
                    "other": 44701,
                    "VisitDate": "2022-05-20"
                },
                {
                    "ID": 8388,
                    "other": 44870,
                    "VisitDate": "2022-11-05"
                },
                {
                    "ID": 8389,
                    "other": 44831,
                    "VisitDate": "2022-09-27"
                },
                {
                    "ID": 8390,
                    "other": 44763,
                    "VisitDate": "2022-07-21"
                },
                {
                    "ID": 8391,
                    "other": 44725,
                    "VisitDate": "2022-06-13"
                },
                {
                    "ID": 8392,
                    "other": 44802,
                    "VisitDate": "2022-08-29"
                },
                {
                    "ID": 8393,
                    "other": 44620,
                    "VisitDate": "2022-02-28"
                },
                {
                    "ID": 8394,
                    "other": 44942,
                    "VisitDate": "2023-01-16"
                },
                {
                    "ID": 8395,
                    "other": 44909,
                    "VisitDate": "2022-12-14"
                },
                {
                    "ID": 8396,
                    "other": 44964,
                    "VisitDate": "2023-02-07"
                },
                {
                    "ID": 8397,
                    "other": 44951,
                    "VisitDate": "2023-01-25"
                },
                {
                    "ID": 8398,
                    "other": 44839,
                    "VisitDate": "2022-10-05"
                },
                {
                    "ID": 8399,
                    "other": 44798,
                    "VisitDate": "2022-08-25"
                },
                {
                    "ID": 8400,
                    "other": 44867,
                    "VisitDate": "2022-11-02"
                },
                {
                    "ID": 8401,
                    "other": 44876,
                    "VisitDate": "2022-11-11"
                },
                {
                    "ID": 8402,
                    "other": 44583,
                    "VisitDate": "2022-01-22"
                },
                {
                    "ID": 8403,
                    "other": 44979,
                    "VisitDate": "2023-02-22"
                },
                {
                    "ID": 8404,
                    "other": 44800,
                    "VisitDate": "2022-08-27"
                },
                {
                    "ID": 8405,
                    "other": 44977,
                    "VisitDate": "2023-02-20"
                },
                {
                    "ID": 8406,
                    "other": 44845,
                    "VisitDate": "2022-10-11"
                },
                {
                    "ID": 8407,
                    "other": 44896,
                    "VisitDate": "2022-12-01"
                },
                {
                    "ID": 8408,
                    "other": 44699,
                    "VisitDate": "2022-05-18"
                },
                {
                    "ID": 8409,
                    "other": 44830,
                    "VisitDate": "2022-09-26"
                },
                {
                    "ID": 8410,
                    "other": 44700,
                    "VisitDate": "2022-05-19"
                },
                {
                    "ID": 8411,
                    "other": 44958,
                    "VisitDate": "2023-02-01"
                },
                {
                    "ID": 8412,
                    "other": 44826,
                    "VisitDate": "2022-09-22"
                },
                {
                    "ID": 8413,
                    "other": 44907,
                    "VisitDate": "2022-12-12"
                },
                {
                    "ID": 8414,
                    "other": 44900,
                    "VisitDate": "2022-12-05"
                },
                {
                    "ID": 8415,
                    "other": 44831,
                    "VisitDate": "2022-09-27"
                },
                {
                    "ID": 8416,
                    "other": 44713,
                    "VisitDate": "2022-06-01"
                },
                {
                    "ID": 8417,
                    "other": 44713,
                    "VisitDate": "2022-06-01"
                },
                {
                    "ID": 8418,
                    "other": 44723,
                    "VisitDate": "2022-06-11"
                },
                {
                    "ID": 8419,
                    "other": 44790,
                    "VisitDate": "2022-08-17"
                },
                {
                    "ID": 8420,
                    "other": 44813,
                    "VisitDate": "2022-09-09"
                },
                {
                    "ID": 8421,
                    "other": 44707,
                    "VisitDate": "2022-05-26"
                },
                {
                    "ID": 8422,
                    "other": 44721,
                    "VisitDate": "2022-06-09"
                },
                {
                    "ID": 8423,
                    "other": 44742,
                    "VisitDate": "2022-06-30"
                },
                {
                    "ID": 8424,
                    "other": 44600,
                    "VisitDate": "2022-02-08"
                },
                {
                    "ID": 8425,
                    "other": 44984,
                    "VisitDate": "2023-02-27"
                },
                {
                    "ID": 8426,
                    "other": 44772,
                    "VisitDate": "2022-07-30"
                },
                {
                    "ID": 8427,
                    "other": 44596,
                    "VisitDate": "2022-02-04"
                },
                {
                    "ID": 8428,
                    "other": 44853,
                    "VisitDate": "2022-10-19"
                },
                {
                    "ID": 8429,
                    "other": 44973,
                    "VisitDate": "2023-02-16"
                },
                {
                    "ID": 8430,
                    "other": 44767,
                    "VisitDate": "2022-07-25"
                },
                {
                    "ID": 8431,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 8432,
                    "other": 44894,
                    "VisitDate": "2022-11-29"
                },
                {
                    "ID": 8433,
                    "other": 44739,
                    "VisitDate": "2022-06-27"
                },
                {
                    "ID": 8434,
                    "other": 44614,
                    "VisitDate": "2022-02-22"
                },
                {
                    "ID": 8435,
                    "other": 44681,
                    "VisitDate": "2022-04-30"
                },
                {
                    "ID": 8436,
                    "other": 44739,
                    "VisitDate": "2022-06-27"
                },
                {
                    "ID": 8437,
                    "other": 44716,
                    "VisitDate": "2022-06-04"
                },
                {
                    "ID": 8438,
                    "other": 44614,
                    "VisitDate": "2022-02-22"
                },
                {
                    "ID": 8439,
                    "other": 44749,
                    "VisitDate": "2022-07-07"
                },
                {
                    "ID": 8440,
                    "other": 44845,
                    "VisitDate": "2022-10-11"
                },
                {
                    "ID": 8441,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8442,
                    "other": 44679,
                    "VisitDate": "2022-04-28"
                },
                {
                    "ID": 8443,
                    "other": 44821,
                    "VisitDate": "2022-09-17"
                },
                {
                    "ID": 8444,
                    "other": 44750,
                    "VisitDate": "2022-07-08"
                },
                {
                    "ID": 8445,
                    "other": 44750,
                    "VisitDate": "2022-07-08"
                },
                {
                    "ID": 8446,
                    "other": 44711,
                    "VisitDate": "2022-05-30"
                },
                {
                    "ID": 8447,
                    "other": 44757,
                    "VisitDate": "2022-07-15"
                },
                {
                    "ID": 8448,
                    "other": 44846,
                    "VisitDate": "2022-10-12"
                },
                {
                    "ID": 8449,
                    "other": 44699,
                    "VisitDate": "2022-05-18"
                },
                {
                    "ID": 8450,
                    "other": 44982,
                    "VisitDate": "2023-02-25"
                },
                {
                    "ID": 8451,
                    "other": 44826,
                    "VisitDate": "2022-09-22"
                },
                {
                    "ID": 8452,
                    "other": 44693,
                    "VisitDate": "2022-05-12"
                },
                {
                    "ID": 8453,
                    "other": 44944,
                    "VisitDate": "2023-01-18"
                },
                {
                    "ID": 8454,
                    "other": 44617,
                    "VisitDate": "2022-02-25"
                },
                {
                    "ID": 8455,
                    "other": 44853,
                    "VisitDate": "2022-10-19"
                },
                {
                    "ID": 8456,
                    "other": 44616,
                    "VisitDate": "2022-02-24"
                },
                {
                    "ID": 8457,
                    "other": 44949,
                    "VisitDate": "2023-01-23"
                },
                {
                    "ID": 8458,
                    "other": 44763,
                    "VisitDate": "2022-07-21"
                },
                {
                    "ID": 8459,
                    "other": 44921,
                    "VisitDate": "2022-12-26"
                },
                {
                    "ID": 8460,
                    "other": 44900,
                    "VisitDate": "2022-12-05"
                },
                {
                    "ID": 8461,
                    "other": 44977,
                    "VisitDate": "2023-02-20"
                },
                {
                    "ID": 8462,
                    "other": 44636,
                    "VisitDate": "2022-03-16"
                },
                {
                    "ID": 8463,
                    "other": 44693,
                    "VisitDate": "2022-05-12"
                },
                {
                    "ID": 8464,
                    "other": 44677,
                    "VisitDate": "2022-04-26"
                },
                {
                    "ID": 8465,
                    "other": 44890,
                    "VisitDate": "2022-11-25"
                },
                {
                    "ID": 8466,
                    "other": 44750,
                    "VisitDate": "2022-07-08"
                },
                {
                    "ID": 8467,
                    "other": 44642,
                    "VisitDate": "2022-03-22"
                },
                {
                    "ID": 8468,
                    "other": 44753,
                    "VisitDate": "2022-07-11"
                },
                {
                    "ID": 8469,
                    "other": 44671,
                    "VisitDate": "2022-04-20"
                },
                {
                    "ID": 8470,
                    "other": 44967,
                    "VisitDate": "2023-02-10"
                },
                {
                    "ID": 8471,
                    "other": 44690,
                    "VisitDate": "2022-05-09"
                },
                {
                    "ID": 8472,
                    "other": 44795,
                    "VisitDate": "2022-08-22"
                },
                {
                    "ID": 8473,
                    "other": 44874,
                    "VisitDate": "2022-11-09"
                },
                {
                    "ID": 8474,
                    "other": 44785,
                    "VisitDate": "2022-08-12"
                },
                {
                    "ID": 8475,
                    "other": 44670,
                    "VisitDate": "2022-04-19"
                },
                {
                    "ID": 8476,
                    "other": 44915,
                    "VisitDate": "2022-12-20"
                },
                {
                    "ID": 8477,
                    "other": 44597,
                    "VisitDate": "2022-02-05"
                },
                {
                    "ID": 8478,
                    "other": 44823,
                    "VisitDate": "2022-09-19"
                },
                {
                    "ID": 8479,
                    "other": 44802,
                    "VisitDate": "2022-08-29"
                },
                {
                    "ID": 8480,
                    "other": 44741,
                    "VisitDate": "2022-06-29"
                },
                {
                    "ID": 8481,
                    "other": 44691,
                    "VisitDate": "2022-05-10"
                },
                {
                    "ID": 8482,
                    "other": 44622,
                    "VisitDate": "2022-03-02"
                },
                {
                    "ID": 8483,
                    "other": 44748,
                    "VisitDate": "2022-07-06"
                },
                {
                    "ID": 8484,
                    "other": 44938,
                    "VisitDate": "2023-01-12"
                },
                {
                    "ID": 8485,
                    "other": 44851,
                    "VisitDate": "2022-10-17"
                },
                {
                    "ID": 8486,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8487,
                    "other": 44895,
                    "VisitDate": "2022-11-30"
                },
                {
                    "ID": 8488,
                    "other": 44699,
                    "VisitDate": "2022-05-18"
                },
                {
                    "ID": 8489,
                    "other": 44916,
                    "VisitDate": "2022-12-21"
                },
                {
                    "ID": 8490,
                    "other": 44683,
                    "VisitDate": "2022-05-02"
                },
                {
                    "ID": 8491,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8492,
                    "other": 44915,
                    "VisitDate": "2022-12-20"
                },
                {
                    "ID": 8493,
                    "other": 44630,
                    "VisitDate": "2022-03-10"
                },
                {
                    "ID": 8494,
                    "other": 44623,
                    "VisitDate": "2022-03-03"
                },
                {
                    "ID": 8495,
                    "other": 44683,
                    "VisitDate": "2022-05-02"
                },
                {
                    "ID": 8496,
                    "other": 44907,
                    "VisitDate": "2022-12-12"
                },
                {
                    "ID": 8497,
                    "other": 44830,
                    "VisitDate": "2022-09-26"
                },
                {
                    "ID": 8498,
                    "other": 44755,
                    "VisitDate": "2022-07-13"
                },
                {
                    "ID": 8499,
                    "other": 44957,
                    "VisitDate": "2023-01-31"
                },
                {
                    "ID": 8500,
                    "other": 44862,
                    "VisitDate": "2022-10-28"
                },
                {
                    "ID": 8501,
                    "other": 44778,
                    "VisitDate": "2022-08-05"
                },
                {
                    "ID": 8502,
                    "other": 44623,
                    "VisitDate": "2022-03-03"
                },
                {
                    "ID": 8503,
                    "other": 44936,
                    "VisitDate": "2023-01-10"
                },
                {
                    "ID": 8504,
                    "other": 44739,
                    "VisitDate": "2022-06-27"
                },
                {
                    "ID": 8505,
                    "other": 44708,
                    "VisitDate": "2022-05-27"
                },
                {
                    "ID": 8506,
                    "other": 44828,
                    "VisitDate": "2022-09-24"
                },
                {
                    "ID": 8507,
                    "other": 44956,
                    "VisitDate": "2023-01-30"
                },
                {
                    "ID": 8508,
                    "other": 44749,
                    "VisitDate": "2022-07-07"
                },
                {
                    "ID": 8509,
                    "other": 44889,
                    "VisitDate": "2022-11-24"
                },
                {
                    "ID": 8510,
                    "other": 44960,
                    "VisitDate": "2023-02-03"
                },
                {
                    "ID": 8511,
                    "other": 44621,
                    "VisitDate": "2022-03-01"
                },
                {
                    "ID": 8512,
                    "other": 44692,
                    "VisitDate": "2022-05-11"
                },
                {
                    "ID": 8513,
                    "other": 44597,
                    "VisitDate": "2022-02-05"
                },
                {
                    "ID": 8514,
                    "other": 44962,
                    "VisitDate": "2023-02-05"
                },
                {
                    "ID": 8515,
                    "other": 44881,
                    "VisitDate": "2022-11-16"
                },
                {
                    "ID": 8516,
                    "other": 44748,
                    "VisitDate": "2022-07-06"
                },
                {
                    "ID": 8517,
                    "other": 44713,
                    "VisitDate": "2022-06-01"
                },
                {
                    "ID": 8518,
                    "other": 44621,
                    "VisitDate": "2022-03-01"
                },
                {
                    "ID": 8519,
                    "other": 44838,
                    "VisitDate": "2022-10-04"
                },
                {
                    "ID": 8520,
                    "other": 44683,
                    "VisitDate": "2022-05-02"
                },
                {
                    "ID": 8521,
                    "other": 44683,
                    "VisitDate": "2022-05-02"
                },
                {
                    "ID": 8522,
                    "other": 44735,
                    "VisitDate": "2022-06-23"
                },
                {
                    "ID": 8523,
                    "other": 44763,
                    "VisitDate": "2022-07-21"
                },
                {
                    "ID": 8524,
                    "other": 44709,
                    "VisitDate": "2022-05-28"
                },
                {
                    "ID": 8525,
                    "other": 44740,
                    "VisitDate": "2022-06-28"
                },
                {
                    "ID": 8526,
                    "other": 44837,
                    "VisitDate": "2022-10-03"
                },
                {
                    "ID": 8527,
                    "other": 44921,
                    "VisitDate": "2022-12-26"
                },
                {
                    "ID": 8528,
                    "other": 44725,
                    "VisitDate": "2022-06-13"
                },
                {
                    "ID": 8529,
                    "other": 44884,
                    "VisitDate": "2022-11-19"
                },
                {
                    "ID": 8530,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8531,
                    "other": 44799,
                    "VisitDate": "2022-08-26"
                },
                {
                    "ID": 8532,
                    "other": 44845,
                    "VisitDate": "2022-10-11"
                },
                {
                    "ID": 8533,
                    "other": 44798,
                    "VisitDate": "2022-08-25"
                },
                {
                    "ID": 8534,
                    "other": 44846,
                    "VisitDate": "2022-10-12"
                },
                {
                    "ID": 8535,
                    "other": 44983,
                    "VisitDate": "2023-02-26"
                },
                {
                    "ID": 8536,
                    "other": 44707,
                    "VisitDate": "2022-05-26"
                },
                {
                    "ID": 8537,
                    "other": 44865,
                    "VisitDate": "2022-10-31"
                },
                {
                    "ID": 8538,
                    "other": 44664,
                    "VisitDate": "2022-04-13"
                },
                {
                    "ID": 8539,
                    "other": 44648,
                    "VisitDate": "2022-03-28"
                },
                {
                    "ID": 8540,
                    "other": 44959,
                    "VisitDate": "2023-02-02"
                },
                {
                    "ID": 8541,
                    "other": 44846,
                    "VisitDate": "2022-10-12"
                },
                {
                    "ID": 8542,
                    "other": 44789,
                    "VisitDate": "2022-08-16"
                },
                {
                    "ID": 8543,
                    "other": 44949,
                    "VisitDate": "2023-01-23"
                },
                {
                    "ID": 8544,
                    "other": 44739,
                    "VisitDate": "2022-06-27"
                },
                {
                    "ID": 8545,
                    "other": 44958,
                    "VisitDate": "2023-02-01"
                },
                {
                    "ID": 8546,
                    "other": 44915,
                    "VisitDate": "2022-12-20"
                },
                {
                    "ID": 8547,
                    "other": 44852,
                    "VisitDate": "2022-10-18"
                },
                {
                    "ID": 8548,
                    "other": 44943,
                    "VisitDate": "2023-01-17"
                },
                {
                    "ID": 8549,
                    "other": 44828,
                    "VisitDate": "2022-09-24"
                },
                {
                    "ID": 8550,
                    "other": 44649,
                    "VisitDate": "2022-03-29"
                },
                {
                    "ID": 8551,
                    "other": 44978,
                    "VisitDate": "2023-02-21"
                },
                {
                    "ID": 8552,
                    "other": 44664,
                    "VisitDate": "2022-04-13"
                },
                {
                    "ID": 8553,
                    "other": 44977,
                    "VisitDate": "2023-02-20"
                },
                {
                    "ID": 8554,
                    "other": 44623,
                    "VisitDate": "2022-03-03"
                },
                {
                    "ID": 8555,
                    "other": 44726,
                    "VisitDate": "2022-06-14"
                },
                {
                    "ID": 8556,
                    "other": 44979,
                    "VisitDate": "2023-02-22"
                },
                {
                    "ID": 8557,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8558,
                    "other": 44702,
                    "VisitDate": "2022-05-21"
                },
                {
                    "ID": 8559,
                    "other": 44768,
                    "VisitDate": "2022-07-26"
                },
                {
                    "ID": 8560,
                    "other": 44891,
                    "VisitDate": "2022-11-26"
                },
                {
                    "ID": 8561,
                    "other": 44884,
                    "VisitDate": "2022-11-19"
                },
                {
                    "ID": 8562,
                    "other": 44643,
                    "VisitDate": "2022-03-23"
                },
                {
                    "ID": 8563,
                    "other": 44952,
                    "VisitDate": "2023-01-26"
                },
                {
                    "ID": 8564,
                    "other": 44823,
                    "VisitDate": "2022-09-19"
                },
                {
                    "ID": 8565,
                    "other": 44849,
                    "VisitDate": "2022-10-15"
                },
                {
                    "ID": 8566,
                    "other": 44652,
                    "VisitDate": "2022-04-01"
                },
                {
                    "ID": 8567,
                    "other": 44853,
                    "VisitDate": "2022-10-19"
                },
                {
                    "ID": 8568,
                    "other": 44932,
                    "VisitDate": "2023-01-06"
                },
                {
                    "ID": 8569,
                    "other": 44933,
                    "VisitDate": "2023-01-07"
                },
                {
                    "ID": 8570,
                    "other": 44652,
                    "VisitDate": "2022-04-01"
                },
                {
                    "ID": 8571,
                    "other": 44669,
                    "VisitDate": "2022-04-18"
                },
                {
                    "ID": 8572,
                    "other": 44582,
                    "VisitDate": "2022-01-21"
                },
                {
                    "ID": 8573,
                    "other": 44930,
                    "VisitDate": "2023-01-04"
                },
                {
                    "ID": 8574,
                    "other": 44767,
                    "VisitDate": "2022-07-25"
                },
                {
                    "ID": 8575,
                    "other": 44849,
                    "VisitDate": "2022-10-15"
                },
                {
                    "ID": 8576,
                    "other": 44851,
                    "VisitDate": "2022-10-17"
                },
                {
                    "ID": 8577,
                    "other": 44613,
                    "VisitDate": "2022-02-21"
                },
                {
                    "ID": 8578,
                    "other": 44613,
                    "VisitDate": "2022-02-21"
                },
                {
                    "ID": 8579,
                    "other": 44965,
                    "VisitDate": "2023-02-08"
                },
                {
                    "ID": 8580,
                    "other": 44784,
                    "VisitDate": "2022-08-11"
                },
                {
                    "ID": 8581,
                    "other": 44788,
                    "VisitDate": "2022-08-15"
                },
                {
                    "ID": 8582,
                    "other": 44782,
                    "VisitDate": "2022-08-09"
                },
                {
                    "ID": 8583,
                    "other": 44942,
                    "VisitDate": "2023-01-16"
                },
                {
                    "ID": 8584,
                    "other": 44690,
                    "VisitDate": "2022-05-09"
                },
                {
                    "ID": 8585,
                    "other": 44727,
                    "VisitDate": "2022-06-15"
                },
                {
                    "ID": 8586,
                    "other": 44751,
                    "VisitDate": "2022-07-09"
                },
                {
                    "ID": 8587,
                    "other": 44924,
                    "VisitDate": "2022-12-29"
                },
                {
                    "ID": 8588,
                    "other": 44957,
                    "VisitDate": "2023-01-31"
                },
                {
                    "ID": 8589,
                    "other": 44742,
                    "VisitDate": "2022-06-30"
                },
                {
                    "ID": 8590,
                    "other": 44623,
                    "VisitDate": "2022-03-03"
                },
                {
                    "ID": 8591,
                    "other": 44827,
                    "VisitDate": "2022-09-23"
                },
                {
                    "ID": 8592,
                    "other": 44924,
                    "VisitDate": "2022-12-29"
                },
                {
                    "ID": 8593,
                    "other": 44727,
                    "VisitDate": "2022-06-15"
                },
                {
                    "ID": 8594,
                    "other": 44926,
                    "VisitDate": "2022-12-31"
                },
                {
                    "ID": 8595,
                    "other": 44596,
                    "VisitDate": "2022-02-04"
                },
                {
                    "ID": 8596,
                    "other": 44947,
                    "VisitDate": "2023-01-21"
                },
                {
                    "ID": 8597,
                    "other": 44734,
                    "VisitDate": "2022-06-22"
                },
                {
                    "ID": 8598,
                    "other": 44978,
                    "VisitDate": "2023-02-21"
                },
                {
                    "ID": 8599,
                    "other": 44903,
                    "VisitDate": "2022-12-08"
                },
                {
                    "ID": 8600,
                    "other": 44713,
                    "VisitDate": "2022-06-01"
                },
                {
                    "ID": 8601,
                    "other": 44887,
                    "VisitDate": "2022-11-22"
                },
                {
                    "ID": 8602,
                    "other": 44872,
                    "VisitDate": "2022-11-07"
                },
                {
                    "ID": 8603,
                    "other": 44854,
                    "VisitDate": "2022-10-20"
                },
                {
                    "ID": 8604,
                    "other": 44854,
                    "VisitDate": "2022-10-20"
                },
                {
                    "ID": 8605,
                    "other": 44688,
                    "VisitDate": "2022-05-07"
                },
                {
                    "ID": 8606,
                    "other": 44649,
                    "VisitDate": "2022-03-29"
                },
                {
                    "ID": 8607,
                    "other": 44657,
                    "VisitDate": "2022-04-06"
                },
                {
                    "ID": 8608,
                    "other": 44837,
                    "VisitDate": "2022-10-03"
                },
                {
                    "ID": 8609,
                    "other": 44744,
                    "VisitDate": "2022-07-02"
                },
                {
                    "ID": 8610,
                    "other": 44923,
                    "VisitDate": "2022-12-28"
                },
                {
                    "ID": 8611,
                    "other": 44625,
                    "VisitDate": "2022-03-05"
                },
                {
                    "ID": 8612,
                    "other": 44973,
                    "VisitDate": "2023-02-16"
                },
                {
                    "ID": 8613,
                    "other": 44733,
                    "VisitDate": "2022-06-21"
                },
                {
                    "ID": 8614,
                    "other": 44926,
                    "VisitDate": "2022-12-31"
                },
                {
                    "ID": 8615,
                    "other": 44713,
                    "VisitDate": "2022-06-01"
                },
                {
                    "ID": 8616,
                    "other": 44876,
                    "VisitDate": "2022-11-11"
                },
                {
                    "ID": 8617,
                    "other": 44907,
                    "VisitDate": "2022-12-12"
                },
                {
                    "ID": 8618,
                    "other": 44744,
                    "VisitDate": "2022-07-02"
                },
                {
                    "ID": 8619,
                    "other": 44924,
                    "VisitDate": "2022-12-29"
                },
                {
                    "ID": 8620,
                    "other": 44600,
                    "VisitDate": "2022-02-08"
                },
                {
                    "ID": 8621,
                    "other": 44838,
                    "VisitDate": "2022-10-04"
                },
                {
                    "ID": 8622,
                    "other": 44695,
                    "VisitDate": "2022-05-14"
                },
                {
                    "ID": 8623,
                    "other": 44777,
                    "VisitDate": "2022-08-04"
                },
                {
                    "ID": 8624,
                    "other": 44679,
                    "VisitDate": "2022-04-28"
                },
                {
                    "ID": 8625,
                    "other": 44590,
                    "VisitDate": "2022-01-29"
                },
                {
                    "ID": 8626,
                    "other": 44896,
                    "VisitDate": "2022-12-01"
                },
                {
                    "ID": 8627,
                    "other": 44657,
                    "VisitDate": "2022-04-06"
                },
                {
                    "ID": 8628,
                    "other": 44782,
                    "VisitDate": "2022-08-09"
                },
                {
                    "ID": 8629,
                    "other": 44977,
                    "VisitDate": "2023-02-20"
                },
                {
                    "ID": 8630,
                    "other": 44896,
                    "VisitDate": "2022-12-01"
                },
                {
                    "ID": 8631,
                    "other": 44942,
                    "VisitDate": "2023-01-16"
                },
                {
                    "ID": 8632,
                    "other": 44588,
                    "VisitDate": "2022-01-27"
                },
                {
                    "ID": 8633,
                    "other": 44921,
                    "VisitDate": "2022-12-26"
                },
                {
                    "ID": 8634,
                    "other": 44620,
                    "VisitDate": "2022-02-28"
                },
                {
                    "ID": 8635,
                    "other": 44664,
                    "VisitDate": "2022-04-13"
                },
                {
                    "ID": 8636,
                    "other": 44590,
                    "VisitDate": "2022-01-29"
                },
                {
                    "ID": 8637,
                    "other": 44953,
                    "VisitDate": "2023-01-27"
                },
                {
                    "ID": 8638,
                    "other": 44660,
                    "VisitDate": "2022-04-09"
                },
                {
                    "ID": 8639,
                    "other": 44887,
                    "VisitDate": "2022-11-22"
                },
                {
                    "ID": 8640,
                    "other": 44772,
                    "VisitDate": "2022-07-30"
                },
                {
                    "ID": 8641,
                    "other": 44960,
                    "VisitDate": "2023-02-03"
                },
                {
                    "ID": 8642,
                    "other": 44951,
                    "VisitDate": "2023-01-25"
                },
                {
                    "ID": 8643,
                    "other": 44873,
                    "VisitDate": "2022-11-08"
                },
                {
                    "ID": 8644,
                    "other": 44803,
                    "VisitDate": "2022-08-30"
                },
                {
                    "ID": 8645,
                    "other": 44673,
                    "VisitDate": "2022-04-22"
                },
                {
                    "ID": 8646,
                    "other": 44852,
                    "VisitDate": "2022-10-18"
                },
                {
                    "ID": 8647,
                    "other": 44672,
                    "VisitDate": "2022-04-21"
                },
                {
                    "ID": 8648,
                    "other": 44830,
                    "VisitDate": "2022-09-26"
                },
                {
                    "ID": 8649,
                    "other": 44971,
                    "VisitDate": "2023-02-14"
                },
                {
                    "ID": 8650,
                    "other": 44897,
                    "VisitDate": "2022-12-02"
                },
                {
                    "ID": 8651,
                    "other": 44975,
                    "VisitDate": "2023-02-18"
                },
                {
                    "ID": 8652,
                    "other": 44669,
                    "VisitDate": "2022-04-18"
                },
                {
                    "ID": 8653,
                    "other": 44918,
                    "VisitDate": "2022-12-23"
                },
                {
                    "ID": 8654,
                    "other": 44936,
                    "VisitDate": "2023-01-10"
                },
                {
                    "ID": 8655,
                    "other": 44664,
                    "VisitDate": "2022-04-13"
                },
                {
                    "ID": 8656,
                    "other": 44847,
                    "VisitDate": "2022-10-13"
                },
                {
                    "ID": 8657,
                    "other": 44746,
                    "VisitDate": "2022-07-04"
                },
                {
                    "ID": 8658,
                    "other": 44730,
                    "VisitDate": "2022-06-18"
                },
                {
                    "ID": 8659,
                    "other": 44835,
                    "VisitDate": "2022-10-01"
                },
                {
                    "ID": 8660,
                    "other": 44778,
                    "VisitDate": "2022-08-05"
                },
                {
                    "ID": 8661,
                    "other": 44641,
                    "VisitDate": "2022-03-21"
                },
                {
                    "ID": 8662,
                    "other": 44670,
                    "VisitDate": "2022-04-19"
                },
                {
                    "ID": 8663,
                    "other": 44670,
                    "VisitDate": "2022-04-19"
                },
                {
                    "ID": 8664,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 8665,
                    "other": 44821,
                    "VisitDate": "2022-09-17"
                },
                {
                    "ID": 8666,
                    "other": 44914,
                    "VisitDate": "2022-12-19"
                },
                {
                    "ID": 8667,
                    "other": 44662,
                    "VisitDate": "2022-04-11"
                },
                {
                    "ID": 8668,
                    "other": 44868,
                    "VisitDate": "2022-11-03"
                },
                {
                    "ID": 8669,
                    "other": 44926,
                    "VisitDate": "2022-12-31"
                },
                {
                    "ID": 8670,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 8671,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 8672,
                    "other": 44656,
                    "VisitDate": "2022-04-05"
                },
                {
                    "ID": 8673,
                    "other": 44656,
                    "VisitDate": "2022-04-05"
                },
                {
                    "ID": 8674,
                    "other": 44592,
                    "VisitDate": "2022-01-31"
                },
                {
                    "ID": 8675,
                    "other": 44721,
                    "VisitDate": "2022-06-09"
                },
                {
                    "ID": 8676,
                    "other": 44893,
                    "VisitDate": "2022-11-28"
                },
                {
                    "ID": 8677,
                    "other": 44685,
                    "VisitDate": "2022-05-04"
                },
                {
                    "ID": 8678,
                    "other": 44687,
                    "VisitDate": "2022-05-06"
                },
                {
                    "ID": 8679,
                    "other": 44932,
                    "VisitDate": "2023-01-06"
                },
                {
                    "ID": 8680,
                    "other": 44646,
                    "VisitDate": "2022-03-26"
                },
                {
                    "ID": 8681,
                    "other": 44891,
                    "VisitDate": "2022-11-26"
                },
                {
                    "ID": 8682,
                    "other": 44830,
                    "VisitDate": "2022-09-26"
                },
                {
                    "ID": 8683,
                    "other": 44641,
                    "VisitDate": "2022-03-21"
                },
                {
                    "ID": 8684,
                    "other": 44885,
                    "VisitDate": "2022-11-20"
                },
                {
                    "ID": 8685,
                    "other": 44778,
                    "VisitDate": "2022-08-05"
                },
                {
                    "ID": 8686,
                    "other": 44592,
                    "VisitDate": "2022-01-31"
                },
                {
                    "ID": 8687,
                    "other": 44673,
                    "VisitDate": "2022-04-22"
                },
                {
                    "ID": 8688,
                    "other": 44949,
                    "VisitDate": "2023-01-23"
                },
                {
                    "ID": 8689,
                    "other": 44828,
                    "VisitDate": "2022-09-24"
                },
                {
                    "ID": 8690,
                    "other": 44949,
                    "VisitDate": "2023-01-23"
                },
                {
                    "ID": 8691,
                    "other": 44823,
                    "VisitDate": "2022-09-19"
                },
                {
                    "ID": 8692,
                    "other": 44649,
                    "VisitDate": "2022-03-29"
                },
                {
                    "ID": 8693,
                    "other": 44714,
                    "VisitDate": "2022-06-02"
                },
                {
                    "ID": 8694,
                    "other": 44923,
                    "VisitDate": "2022-12-28"
                },
                {
                    "ID": 8695,
                    "other": 44733,
                    "VisitDate": "2022-06-21"
                },
                {
                    "ID": 8696,
                    "other": 44896,
                    "VisitDate": "2022-12-01"
                },
                {
                    "ID": 8697,
                    "other": 44666,
                    "VisitDate": "2022-04-15"
                },
                {
                    "ID": 8698,
                    "other": 44953,
                    "VisitDate": "2023-01-27"
                },
                {
                    "ID": 8699,
                    "other": 44688,
                    "VisitDate": "2022-05-07"
                },
                {
                    "ID": 8700,
                    "other": 44688,
                    "VisitDate": "2022-05-07"
                },
                {
                    "ID": 8701,
                    "other": 44702,
                    "VisitDate": "2022-05-21"
                },
                {
                    "ID": 8702,
                    "other": 44947,
                    "VisitDate": "2023-01-21"
                },
                {
                    "ID": 8703,
                    "other": 44631,
                    "VisitDate": "2022-03-11"
                },
                {
                    "ID": 8704,
                    "other": 44729,
                    "VisitDate": "2022-06-17"
                },
                {
                    "ID": 8705,
                    "other": 44875,
                    "VisitDate": "2022-11-10"
                },
                {
                    "ID": 8706,
                    "other": 44895,
                    "VisitDate": "2022-11-30"
                },
                {
                    "ID": 8707,
                    "other": 44641,
                    "VisitDate": "2022-03-21"
                },
                {
                    "ID": 8708,
                    "other": 44905,
                    "VisitDate": "2022-12-10"
                },
                {
                    "ID": 8709,
                    "other": 44771,
                    "VisitDate": "2022-07-29"
                },
                {
                    "ID": 8710,
                    "other": 44907,
                    "VisitDate": "2022-12-12"
                },
                {
                    "ID": 8711,
                    "other": 44825,
                    "VisitDate": "2022-09-21"
                },
                {
                    "ID": 8712,
                    "other": 44760,
                    "VisitDate": "2022-07-18"
                },
                {
                    "ID": 8713,
                    "other": 44876,
                    "VisitDate": "2022-11-11"
                },
                {
                    "ID": 8714,
                    "other": 44799,
                    "VisitDate": "2022-08-26"
                },
                {
                    "ID": 8715,
                    "other": 44629,
                    "VisitDate": "2022-03-09"
                },
                {
                    "ID": 8716,
                    "other": 44735,
                    "VisitDate": "2022-06-23"
                },
                {
                    "ID": 8717,
                    "other": 44588,
                    "VisitDate": "2022-01-27"
                },
                {
                    "ID": 8718,
                    "other": 44893,
                    "VisitDate": "2022-11-28"
                },
                {
                    "ID": 8719,
                    "other": 44939,
                    "VisitDate": "2023-01-13"
                },
                {
                    "ID": 8720,
                    "other": 44904,
                    "VisitDate": "2022-12-09"
                },
                {
                    "ID": 8721,
                    "other": 44704,
                    "VisitDate": "2022-05-23"
                },
                {
                    "ID": 8722,
                    "other": 44918,
                    "VisitDate": "2022-12-23"
                },
                {
                    "ID": 8723,
                    "other": 44664,
                    "VisitDate": "2022-04-13"
                },
                {
                    "ID": 8724,
                    "other": 44970,
                    "VisitDate": "2023-02-13"
                },
                {
                    "ID": 8725,
                    "other": 44763,
                    "VisitDate": "2022-07-21"
                },
                {
                    "ID": 8726,
                    "other": 44978,
                    "VisitDate": "2023-02-21"
                },
                {
                    "ID": 8727,
                    "other": 44904,
                    "VisitDate": "2022-12-09"
                },
                {
                    "ID": 8728,
                    "other": 44639,
                    "VisitDate": "2022-03-19"
                },
                {
                    "ID": 8729,
                    "other": 44725,
                    "VisitDate": "2022-06-13"
                },
                {
                    "ID": 8730,
                    "other": 44725,
                    "VisitDate": "2022-06-13"
                },
                {
                    "ID": 8731,
                    "other": 44636,
                    "VisitDate": "2022-03-16"
                },
                {
                    "ID": 8732,
                    "other": 44739,
                    "VisitDate": "2022-06-27"
                },
                {
                    "ID": 8733,
                    "other": 44912,
                    "VisitDate": "2022-12-17"
                },
                {
                    "ID": 8734,
                    "other": 44613,
                    "VisitDate": "2022-02-21"
                },
                {
                    "ID": 8735,
                    "other": 44641,
                    "VisitDate": "2022-03-21"
                },
                {
                    "ID": 8736,
                    "other": 44800,
                    "VisitDate": "2022-08-27"
                },
                {
                    "ID": 8737,
                    "other": 44922,
                    "VisitDate": "2022-12-27"
                },
                {
                    "ID": 8738,
                    "other": 44659,
                    "VisitDate": "2022-04-08"
                },
                {
                    "ID": 8739,
                    "other": 44831,
                    "VisitDate": "2022-09-27"
                },
                {
                    "ID": 8740,
                    "other": 44693,
                    "VisitDate": "2022-05-12"
                },
                {
                    "ID": 8741,
                    "other": 44728,
                    "VisitDate": "2022-06-16"
                },
                {
                    "ID": 8742,
                    "other": 44785,
                    "VisitDate": "2022-08-12"
                },
                {
                    "ID": 8743,
                    "other": 44872,
                    "VisitDate": "2022-11-07"
                },
                {
                    "ID": 8744,
                    "other": 44711,
                    "VisitDate": "2022-05-30"
                },
                {
                    "ID": 8745,
                    "other": 44900,
                    "VisitDate": "2022-12-05"
                },
                {
                    "ID": 8746,
                    "other": 44625,
                    "VisitDate": "2022-03-05"
                },
                {
                    "ID": 8747,
                    "other": 44697,
                    "VisitDate": "2022-05-16"
                },
                {
                    "ID": 8748,
                    "other": 44981,
                    "VisitDate": "2023-02-24"
                },
                {
                    "ID": 8749,
                    "other": 44620,
                    "VisitDate": "2022-02-28"
                },
                {
                    "ID": 8750,
                    "other": 44844,
                    "VisitDate": "2022-10-10"
                },
                {
                    "ID": 8751,
                    "other": 44622,
                    "VisitDate": "2022-03-02"
                },
                {
                    "ID": 8752,
                    "other": 44831,
                    "VisitDate": "2022-09-27"
                },
                {
                    "ID": 8753,
                    "other": 44831,
                    "VisitDate": "2022-09-27"
                },
                {
                    "ID": 8754,
                    "other": 44782,
                    "VisitDate": "2022-08-09"
                },
                {
                    "ID": 8755,
                    "other": 44975,
                    "VisitDate": "2023-02-18"
                },
                {
                    "ID": 8756,
                    "other": 44593,
                    "VisitDate": "2022-02-01"
                },
                {
                    "ID": 8757,
                    "other": 44673,
                    "VisitDate": "2022-04-22"
                },
                {
                    "ID": 8758,
                    "other": 44957,
                    "VisitDate": "2023-01-31"
                },
                {
                    "ID": 8759,
                    "other": 44968,
                    "VisitDate": "2023-02-11"
                },
                {
                    "ID": 8760,
                    "other": 44701,
                    "VisitDate": "2022-05-20"
                },
                {
                    "ID": 8761,
                    "other": 44751,
                    "VisitDate": "2022-07-09"
                },
                {
                    "ID": 8762,
                    "other": 44880,
                    "VisitDate": "2022-11-15"
                },
                {
                    "ID": 8763,
                    "other": 44656,
                    "VisitDate": "2022-04-05"
                },
                {
                    "ID": 8764,
                    "other": 44606,
                    "VisitDate": "2022-02-14"
                },
                {
                    "ID": 8765,
                    "other": 44812,
                    "VisitDate": "2022-09-08"
                },
                {
                    "ID": 8766,
                    "other": 44765,
                    "VisitDate": "2022-07-23"
                },
                {
                    "ID": 8767,
                    "other": 44620,
                    "VisitDate": "2022-02-28"
                },
                {
                    "ID": 8768,
                    "other": 44599,
                    "VisitDate": "2022-02-07"
                },
                {
                    "ID": 8769,
                    "other": 44891,
                    "VisitDate": "2022-11-26"
                },
                {
                    "ID": 8770,
                    "other": 44751,
                    "VisitDate": "2022-07-09"
                },
                {
                    "ID": 8771,
                    "other": 44930,
                    "VisitDate": "2023-01-04"
                },
                {
                    "ID": 8772,
                    "other": 44844,
                    "VisitDate": "2022-10-10"
                },
                {
                    "ID": 8773,
                    "other": 44774,
                    "VisitDate": "2022-08-01"
                },
                {
                    "ID": 8774,
                    "other": 44763,
                    "VisitDate": "2022-07-21"
                },
                {
                    "ID": 8775,
                    "other": 44628,
                    "VisitDate": "2022-03-08"
                },
                {
                    "ID": 8776,
                    "other": 44830,
                    "VisitDate": "2022-09-26"
                },
                {
                    "ID": 8777,
                    "other": 44915,
                    "VisitDate": "2022-12-20"
                },
                {
                    "ID": 8778,
                    "other": 44800,
                    "VisitDate": "2022-08-27"
                },
                {
                    "ID": 8779,
                    "other": 44604,
                    "VisitDate": "2022-02-12"
                },
                {
                    "ID": 8780,
                    "other": 44632,
                    "VisitDate": "2022-03-12"
                },
                {
                    "ID": 8781,
                    "other": 44644,
                    "VisitDate": "2022-03-24"
                },
                {
                    "ID": 8782,
                    "other": 44972,
                    "VisitDate": "2023-02-15"
                },
                {
                    "ID": 8783,
                    "other": 44601,
                    "VisitDate": "2022-02-09"
                },
                {
                    "ID": 8784,
                    "other": 44655,
                    "VisitDate": "2022-04-04"
                },
                {
                    "ID": 8785,
                    "other": 44883,
                    "VisitDate": "2022-11-18"
                },
                {
                    "ID": 8786,
                    "other": 44707,
                    "VisitDate": "2022-05-26"
                },
                {
                    "ID": 8787,
                    "other": 44732,
                    "VisitDate": "2022-06-20"
                },
                {
                    "ID": 8788,
                    "other": 44649,
                    "VisitDate": "2022-03-29"
                },
                {
                    "ID": 8789,
                    "other": 44637,
                    "VisitDate": "2022-03-17"
                },
                {
                    "ID": 8790,
                    "other": 44947,
                    "VisitDate": "2023-01-21"
                },
                {
                    "ID": 8791,
                    "other": 44665,
                    "VisitDate": "2022-04-14"
                },
                {
                    "ID": 8792,
                    "other": 44756,
                    "VisitDate": "2022-07-14"
                },
                {
                    "ID": 8793,
                    "other": 44950,
                    "VisitDate": "2023-01-24"
                },
                {
                    "ID": 8794,
                    "other": 44924,
                    "VisitDate": "2022-12-29"
                },
                {
                    "ID": 8795,
                    "other": 44873,
                    "VisitDate": "2022-11-08"
                },
                {
                    "ID": 8796,
                    "other": 44825,
                    "VisitDate": "2022-09-21"
                },
                {
                    "ID": 8797,
                    "other": 44684,
                    "VisitDate": "2022-05-03"
                },
                {
                    "ID": 8798,
                    "other": 44833,
                    "VisitDate": "2022-09-29"
                },
                {
                    "ID": 8799,
                    "other": 44730,
                    "VisitDate": "2022-06-18"
                },
                {
                    "ID": 8800,
                    "other": 44907,
                    "VisitDate": "2022-12-12"
                },
                {
                    "ID": 8801,
                    "other": 44846,
                    "VisitDate": "2022-10-12"
                },
                {
                    "ID": 8802,
                    "other": 44658,
                    "VisitDate": "2022-04-07"
                },
                {
                    "ID": 8803,
                    "other": 44774,
                    "VisitDate": "2022-08-01"
                },
                {
                    "ID": 8804,
                    "other": 44749,
                    "VisitDate": "2022-07-07"
                },
                {
                    "ID": 8805,
                    "other": 44727,
                    "VisitDate": "2022-06-15"
                },
                {
                    "ID": 8806,
                    "other": 44786,
                    "VisitDate": "2022-08-13"
                },
                {
                    "ID": 8807,
                    "other": 44658,
                    "VisitDate": "2022-04-07"
                },
                {
                    "ID": 8808,
                    "other": 44953,
                    "VisitDate": "2023-01-27"
                },
                {
                    "ID": 8809,
                    "other": 44770,
                    "VisitDate": "2022-07-28"
                },
                {
                    "ID": 8810,
                    "other": 44580,
                    "VisitDate": "2022-01-19"
                },
                {
                    "ID": 8811,
                    "other": 44786,
                    "VisitDate": "2022-08-13"
                },
                {
                    "ID": 8812,
                    "other": 44981,
                    "VisitDate": "2023-02-24"
                },
                {
                    "ID": 8813,
                    "other": 44937,
                    "VisitDate": "2023-01-11"
                },
                {
                    "ID": 8814,
                    "other": 44971,
                    "VisitDate": "2023-02-14"
                },
                {
                    "ID": 8815,
                    "other": 44891,
                    "VisitDate": "2022-11-26"
                },
                {
                    "ID": 8816,
                    "other": 44935,
                    "VisitDate": "2023-01-09"
                },
                {
                    "ID": 8817,
                    "other": 44754,
                    "VisitDate": "2022-07-12"
                },
                {
                    "ID": 8818,
                    "other": 44670,
                    "VisitDate": "2022-04-19"
                },
                {
                    "ID": 8819,
                    "other": 44870,
                    "VisitDate": "2022-11-05"
                },
                {
                    "ID": 8820,
                    "other": 44949,
                    "VisitDate": "2023-01-23"
                },
                {
                    "ID": 8821,
                    "other": 44608,
                    "VisitDate": "2022-02-16"
                },
                {
                    "ID": 8822,
                    "other": 44691,
                    "VisitDate": "2022-05-10"
                },
                {
                    "ID": 8823,
                    "other": 44888,
                    "VisitDate": "2022-11-23"
                },
                {
                    "ID": 8824,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 8825,
                    "other": 44670,
                    "VisitDate": "2022-04-19"
                },
                {
                    "ID": 8826,
                    "other": 44979,
                    "VisitDate": "2023-02-22"
                },
                {
                    "ID": 8827,
                    "other": 44884,
                    "VisitDate": "2022-11-19"
                },
                {
                    "ID": 8828,
                    "other": 44644,
                    "VisitDate": "2022-03-24"
                },
                {
                    "ID": 8829,
                    "other": 44721,
                    "VisitDate": "2022-06-09"
                },
                {
                    "ID": 8830,
                    "other": 44979,
                    "VisitDate": "2023-02-22"
                },
                {
                    "ID": 8831,
                    "other": 44666,
                    "VisitDate": "2022-04-15"
                },
                {
                    "ID": 8832,
                    "other": 44833,
                    "VisitDate": "2022-09-29"
                },
                {
                    "ID": 8833,
                    "other": 44700,
                    "VisitDate": "2022-05-19"
                },
                {
                    "ID": 8834,
                    "other": 44595,
                    "VisitDate": "2022-02-03"
                },
                {
                    "ID": 8835,
                    "other": 44945,
                    "VisitDate": "2023-01-19"
                },
                {
                    "ID": 8836,
                    "other": 44641,
                    "VisitDate": "2022-03-21"
                },
                {
                    "ID": 8837,
                    "other": 44832,
                    "VisitDate": "2022-09-28"
                },
                {
                    "ID": 8838,
                    "other": 44803,
                    "VisitDate": "2022-08-30"
                },
                {
                    "ID": 8839,
                    "other": 44882,
                    "VisitDate": "2022-11-17"
                },
                {
                    "ID": 8840,
                    "other": 44804,
                    "VisitDate": "2022-08-31"
                },
                {
                    "ID": 8841,
                    "other": 44631,
                    "VisitDate": "2022-03-11"
                },
                {
                    "ID": 8842,
                    "other": 44665,
                    "VisitDate": "2022-04-14"
                },
                {
                    "ID": 8843,
                    "other": 44807,
                    "VisitDate": "2022-09-03"
                },
                {
                    "ID": 8844,
                    "other": 44699,
                    "VisitDate": "2022-05-18"
                },
                {
                    "ID": 8845,
                    "other": 44868,
                    "VisitDate": "2022-11-03"
                },
                {
                    "ID": 8846,
                    "other": 44600,
                    "VisitDate": "2022-02-08"
                },
                {
                    "ID": 8847,
                    "other": 44921,
                    "VisitDate": "2022-12-26"
                },
                {
                    "ID": 8848,
                    "other": 44764,
                    "VisitDate": "2022-07-22"
                },
                {
                    "ID": 8849,
                    "other": 44785,
                    "VisitDate": "2022-08-12"
                },
                {
                    "ID": 8850,
                    "other": 44910,
                    "VisitDate": "2022-12-15"
                },
                {
                    "ID": 8851,
                    "other": 44947,
                    "VisitDate": "2023-01-21"
                },
                {
                    "ID": 8852,
                    "other": 44821,
                    "VisitDate": "2022-09-17"
                },
                {
                    "ID": 8853,
                    "other": 44702,
                    "VisitDate": "2022-05-21"
                },
                {
                    "ID": 8854,
                    "other": 44900,
                    "VisitDate": "2022-12-05"
                },
                {
                    "ID": 8855,
                    "other": 44716,
                    "VisitDate": "2022-06-04"
                },
                {
                    "ID": 8856,
                    "other": 44726,
                    "VisitDate": "2022-06-14"
                },
                {
                    "ID": 8857,
                    "other": 44881,
                    "VisitDate": "2022-11-16"
                },
                {
                    "ID": 8858,
                    "other": 44539,
                    "VisitDate": "2021-12-09"
                },
                {
                    "ID": 8859,
                    "other": 44767,
                    "VisitDate": "2022-07-25"
                },
                {
                    "ID": 8860,
                    "other": 44656,
                    "VisitDate": "2022-04-05"
                },
                {
                    "ID": 8861,
                    "other": 44910,
                    "VisitDate": "2022-12-15"
                },
                {
                    "ID": 8862,
                    "other": 44685,
                    "VisitDate": "2022-05-04"
                },
                {
                    "ID": 8863,
                    "other": 44798,
                    "VisitDate": "2022-08-25"
                },
                {
                    "ID": 8864,
                    "other": 44952,
                    "VisitDate": "2023-01-26"
                },
                {
                    "ID": 8865,
                    "other": 44737,
                    "VisitDate": "2022-06-25"
                },
                {
                    "ID": 8866,
                    "other": 44716,
                    "VisitDate": "2022-06-04"
                },
                {
                    "ID": 8867,
                    "other": 44846,
                    "VisitDate": "2022-10-12"
                },
                {
                    "ID": 8868,
                    "other": 44583,
                    "VisitDate": "2022-01-22"
                },
                {
                    "ID": 8869,
                    "other": 44902,
                    "VisitDate": "2022-12-07"
                },
                {
                    "ID": 8870,
                    "other": 44974,
                    "VisitDate": "2023-02-17"
                },
                {
                    "ID": 8871,
                    "other": 44715,
                    "VisitDate": "2022-06-03"
                },
                {
                    "ID": 8872,
                    "other": 44852,
                    "VisitDate": "2022-10-18"
                },
                {
                    "ID": 8873,
                    "other": 44918,
                    "VisitDate": "2022-12-23"
                },
                {
                    "ID": 8874,
                    "other": 44585,
                    "VisitDate": "2022-01-24"
                },
                {
                    "ID": 8875,
                    "other": 44804,
                    "VisitDate": "2022-08-31"
                },
                {
                    "ID": 8876,
                    "other": 44687,
                    "VisitDate": "2022-05-06"
                },
                {
                    "ID": 8877,
                    "other": 44583,
                    "VisitDate": "2022-01-22"
                },
                {
                    "ID": 8878,
                    "other": 44849,
                    "VisitDate": "2022-10-15"
                },
                {
                    "ID": 8879,
                    "other": 44623,
                    "VisitDate": "2022-03-03"
                },
                {
                    "ID": 8880,
                    "other": 44978,
                    "VisitDate": "2023-02-21"
                },
                {
                    "ID": 8881,
                    "other": 44604,
                    "VisitDate": "2022-02-12"
                },
                {
                    "ID": 8882,
                    "other": 44786,
                    "VisitDate": "2022-08-13"
                },
                {
                    "ID": 8883,
                    "other": 44655,
                    "VisitDate": "2022-04-04"
                },
                {
                    "ID": 8884,
                    "other": 44905,
                    "VisitDate": "2022-12-10"
                },
                {
                    "ID": 8885,
                    "other": 44772,
                    "VisitDate": "2022-07-30"
                },
                {
                    "ID": 8886,
                    "other": 44825,
                    "VisitDate": "2022-09-21"
                },
                {
                    "ID": 8887,
                    "other": 44631,
                    "VisitDate": "2022-03-11"
                },
                {
                    "ID": 8888,
                    "other": 44919,
                    "VisitDate": "2022-12-24"
                },
                {
                    "ID": 8889,
                    "other": 44826,
                    "VisitDate": "2022-09-22"
                },
                {
                    "ID": 8890,
                    "other": 44624,
                    "VisitDate": "2022-03-04"
                },
                {
                    "ID": 8891,
                    "other": 44848,
                    "VisitDate": "2022-10-14"
                },
                {
                    "ID": 8892,
                    "other": 44589,
                    "VisitDate": "2022-01-28"
                },
                {
                    "ID": 8893,
                    "other": 44894,
                    "VisitDate": "2022-11-29"
                },
                {
                    "ID": 8894,
                    "other": 44631,
                    "VisitDate": "2022-03-11"
                },
                {
                    "ID": 8895,
                    "other": 44919,
                    "VisitDate": "2022-12-24"
                },
                {
                    "ID": 8896,
                    "other": 44802,
                    "VisitDate": "2022-08-29"
                },
                {
                    "ID": 8897,
                    "other": 44889,
                    "VisitDate": "2022-11-24"
                },
                {
                    "ID": 8898,
                    "other": 44857,
                    "VisitDate": "2022-10-23"
                },
                {
                    "ID": 8899,
                    "other": 44620,
                    "VisitDate": "2022-02-28"
                },
                {
                    "ID": 8900,
                    "other": 44846,
                    "VisitDate": "2022-10-12"
                },
                {
                    "ID": 8901,
                    "other": 44875,
                    "VisitDate": "2022-11-10"
                },
                {
                    "ID": 8902,
                    "other": 44943,
                    "VisitDate": "2023-01-17"
                },
                {
                    "ID": 8903,
                    "other": 44644,
                    "VisitDate": "2022-03-24"
                },
                {
                    "ID": 8904,
                    "other": 44970,
                    "VisitDate": "2023-02-13"
                },
                {
                    "ID": 8905,
                    "other": 44716,
                    "VisitDate": "2022-06-04"
                },
                {
                    "ID": 8906,
                    "other": 44842,
                    "VisitDate": "2022-10-08"
                },
                {
                    "ID": 8907,
                    "other": 44683,
                    "VisitDate": "2022-05-02"
                },
                {
                    "ID": 8908,
                    "other": 44692,
                    "VisitDate": "2022-05-11"
                },
                {
                    "ID": 8909,
                    "other": 44938,
                    "VisitDate": "2023-01-12"
                },
                {
                    "ID": 8910,
                    "other": 44608,
                    "VisitDate": "2022-02-16"
                },
                {
                    "ID": 8911,
                    "other": 44958,
                    "VisitDate": "2023-02-01"
                },
                {
                    "ID": 8912,
                    "other": 44956,
                    "VisitDate": "2023-01-30"
                },
                {
                    "ID": 8913,
                    "other": 44897,
                    "VisitDate": "2022-12-02"
                },
                {
                    "ID": 8914,
                    "other": 44674,
                    "VisitDate": "2022-04-23"
                },
                {
                    "ID": 8915,
                    "other": 44967,
                    "VisitDate": "2023-02-10"
                },
                {
                    "ID": 8916,
                    "other": 44614,
                    "VisitDate": "2022-02-22"
                },
                {
                    "ID": 8917,
                    "other": 44926,
                    "VisitDate": "2022-12-31"
                },
                {
                    "ID": 8918,
                    "other": 44915,
                    "VisitDate": "2022-12-20"
                },
                {
                    "ID": 8919,
                    "other": 44648,
                    "VisitDate": "2022-03-28"
                },
                {
                    "ID": 8920,
                    "other": 44901,
                    "VisitDate": "2022-12-06"
                },
                {
                    "ID": 8921,
                    "other": 44680,
                    "VisitDate": "2022-04-29"
                },
                {
                    "ID": 8922,
                    "other": 44982,
                    "VisitDate": "2023-02-25"
                },
                {
                    "ID": 8923,
                    "other": 44981,
                    "VisitDate": "2023-02-24"
                },
                {
                    "ID": 8924,
                    "other": 44996,
                    "VisitDate": "2023-03-11"
                },
                {
                    "ID": 8925,
                    "other": 45010,
                    "VisitDate": "2023-03-25"
                },
                {
                    "ID": 8926,
                    "other": 45009,
                    "VisitDate": "2023-03-24"
                },
                {
                    "ID": 8927,
                    "other": 45007,
                    "VisitDate": "2023-03-22"
                },
                {
                    "ID": 8928,
                    "other": 45007,
                    "VisitDate": "2023-03-22"
                },
                {
                    "ID": 8929,
                    "other": 45013,
                    "VisitDate": "2023-03-28"
                },
                {
                    "ID": 8930,
                    "other": 45013,
                    "VisitDate": "2023-03-28"
                },
                {
                    "ID": 8931,
                    "other": 45013,
                    "VisitDate": "2023-03-28"
                },
                {
                    "ID": 8932,
                    "other": 45013,
                    "VisitDate": "2023-03-28"
                },
                {
                    "ID": 8933,
                    "other": 44987,
                    "VisitDate": "2023-03-02"
                },
                {
                    "ID": 8934,
                    "other": 44986,
                    "VisitDate": "2023-03-01"
                },
                {
                    "ID": 8935,
                    "other": 44987,
                    "VisitDate": "2023-03-02"
                },
                {
                    "ID": 8936,
                    "other": 44991,
                    "VisitDate": "2023-03-06"
                },
                {
                    "ID": 8937,
                    "other": 45015,
                    "VisitDate": "2023-03-30"
                },
                {
                    "ID": 8938,
                    "other": 44992,
                    "VisitDate": "2023-03-07"
                },
                {
                    "ID": 8939,
                    "other": 45012,
                    "VisitDate": "2023-03-27"
                },
                {
                    "ID": 8940,
                    "other": 45000,
                    "VisitDate": "2023-03-15"
                },
                {
                    "ID": 8941,
                    "other": 45003,
                    "VisitDate": "2023-03-18"
                },
                {
                    "ID": 8942,
                    "other": 45006,
                    "VisitDate": "2023-03-21"
                },
                {
                    "ID": 8943,
                    "other": 44996,
                    "VisitDate": "2023-03-11"
                },
                {
                    "ID": 8944,
                    "other": 44995,
                    "VisitDate": "2023-03-10"
                },
                {
                    "ID": 8945,
                    "other": 45002,
                    "VisitDate": "2023-03-17"
                },
                {
                    "ID": 8946,
                    "other": 44994,
                    "VisitDate": "2023-03-09"
                },
                {
                    "ID": 8947,
                    "other": 44989,
                    "VisitDate": "2023-03-04"
                },
                {
                    "ID": 8948,
                    "other": 45016,
                    "VisitDate": "2023-03-31"
                },
                {
                    "ID": 8949,
                    "other": 44994,
                    "VisitDate": "2023-03-09"
                },
                {
                    "ID": 8950,
                    "other": 44992,
                    "VisitDate": "2023-03-07"
                },
                {
                    "ID": 8951,
                    "other": 45015,
                    "VisitDate": "2023-03-30"
                },
                {
                    "ID": 8952,
                    "other": 45014,
                    "VisitDate": "2023-03-29"
                },
                {
                    "ID": 8953,
                    "other": 45000,
                    "VisitDate": "2023-03-15"
                },
                {
                    "ID": 8954,
                    "other": 45010,
                    "VisitDate": "2023-03-25"
                },
                {
                    "ID": 8955,
                    "other": 45022,
                    "VisitDate": "2023-04-06"
                },
                {
                    "ID": 8956,
                    "other": 45041,
                    "VisitDate": "2023-04-25"
                },
                {
                    "ID": 8957,
                    "other": 45036,
                    "VisitDate": "2023-04-20"
                },
                {
                    "ID": 8958,
                    "other": 45022,
                    "VisitDate": "2023-04-06"
                },
                {
                    "ID": 8959,
                    "other": 45034,
                    "VisitDate": "2023-04-18"
                },
                {
                    "ID": 8960,
                    "other": 45038,
                    "VisitDate": "2023-04-22"
                },
                {
                    "ID": 8961,
                    "other": 45040,
                    "VisitDate": "2023-04-24"
                },
                {
                    "ID": 8962,
                    "other": 45031,
                    "VisitDate": "2023-04-15"
                },
                {
                    "ID": 8963,
                    "other": 45029,
                    "VisitDate": "2023-04-13"
                },
                {
                    "ID": 8964,
                    "other": 45026,
                    "VisitDate": "2023-04-10"
                },
                {
                    "ID": 8965,
                    "other": 45026,
                    "VisitDate": "2023-04-10"
                },
                {
                    "ID": 8966,
                    "other": 45040,
                    "VisitDate": "2023-04-24"
                },
                {
                    "ID": 8967,
                    "other": 45033,
                    "VisitDate": "2023-04-17"
                },
                {
                    "ID": 8968,
                    "other": 45033,
                    "VisitDate": "2023-04-17"
                },
                {
                    "ID": 8969,
                    "other": 45038,
                    "VisitDate": "2023-04-22"
                },
                {
                    "ID": 8970,
                    "other": 45026,
                    "VisitDate": "2023-04-10"
                },
                {
                    "ID": 8971,
                    "other": 45036,
                    "VisitDate": "2023-04-20"
                },
                {
                    "ID": 8972,
                    "other": 45047,
                    "VisitDate": "2023-05-01"
                },
                {
                    "ID": 8973,
                    "other": 45030,
                    "VisitDate": "2023-04-14"
                },
                {
                    "ID": 8974,
                    "other": 45030,
                    "VisitDate": "2023-04-14"
                },
                {
                    "ID": 8975,
                    "other": 45030,
                    "VisitDate": "2023-04-14"
                },
                {
                    "ID": 8976,
                    "other": 45043,
                    "VisitDate": "2023-04-27"
                },
                {
                    "ID": 8977,
                    "other": 45030,
                    "VisitDate": "2023-04-14"
                },
                {
                    "ID": 8978,
                    "other": 45030,
                    "VisitDate": "2023-04-14"
                },
                {
                    "ID": 8979,
                    "other": 45037,
                    "VisitDate": "2023-04-21"
                },
                {
                    "ID": 8980,
                    "other": 45017,
                    "VisitDate": "2023-04-01"
                },
                {
                    "ID": 8981,
                    "other": 45041,
                    "VisitDate": "2023-04-25"
                },
                {
                    "ID": 8982,
                    "other": 45042,
                    "VisitDate": "2023-04-26"
                },
                {
                    "ID": 8983,
                    "other": 45059,
                    "VisitDate": "2023-05-13"
                },
                {
                    "ID": 8984,
                    "other": 45050,
                    "VisitDate": "2023-05-04"
                },
                {
                    "ID": 8985,
                    "other": 45056,
                    "VisitDate": "2023-05-10"
                },
                {
                    "ID": 8986,
                    "other": 45050,
                    "VisitDate": "2023-05-04"
                },
                {
                    "ID": 8987,
                    "other": 45049,
                    "VisitDate": "2023-05-03"
                },
                {
                    "ID": 8988,
                    "other": 45057,
                    "VisitDate": "2023-05-11"
                },
                {
                    "ID": 8989,
                    "other": 45063,
                    "VisitDate": "2023-05-17"
                },
                {
                    "ID": 8990,
                    "other": 45061,
                    "VisitDate": "2023-05-15"
                },
                {
                    "ID": 8991,
                    "other": 45059,
                    "VisitDate": "2023-05-13"
                },
                {
                    "ID": 8992,
                    "other": 45069,
                    "VisitDate": "2023-05-23"
                },
                {
                    "ID": 8993,
                    "other": 45069,
                    "VisitDate": "2023-05-23"
                },
                {
                    "ID": 8994,
                    "other": 45065,
                    "VisitDate": "2023-05-19"
                },
                {
                    "ID": 8995,
                    "other": 45061,
                    "VisitDate": "2023-05-15"
                },
                {
                    "ID": 8996,
                    "other": 45055,
                    "VisitDate": "2023-05-09"
                },
                {
                    "ID": 8997,
                    "other": 45047,
                    "VisitDate": "2023-05-01"
                },
                {
                    "ID": 8998,
                    "other": 45055,
                    "VisitDate": "2023-05-09"
                },
                {
                    "ID": 8999,
                    "other": 45047,
                    "VisitDate": "2023-05-01"
                },
                {
                    "ID": 9000,
                    "other": 45052,
                    "VisitDate": "2023-05-06"
                },
                {
                    "ID": 9001,
                    "other": 45052,
                    "VisitDate": "2023-05-06"
                },
                {
                    "ID": 9002,
                    "other": 45049,
                    "VisitDate": "2023-05-03"
                },
                {
                    "ID": 9003,
                    "other": 45048,
                    "VisitDate": "2023-05-02"
                },
                {
                    "ID": 9004,
                    "other": 45054,
                    "VisitDate": "2023-05-08"
                },
                {
                    "ID": 9005,
                    "other": 45052,
                    "VisitDate": "2023-05-06"
                },
                {
                    "ID": 9006,
                    "other": 44910,
                    "VisitDate": "2022-12-15"
                },
                {
                    "ID": 9007,
                    "other": 45061,
                    "VisitDate": "2023-05-15"
                },
                {
                    "ID": 9008,
                    "other": 45064,
                    "VisitDate": "2023-05-18"
                },
                {
                    "ID": 9009,
                    "other": 45066,
                    "VisitDate": "2023-05-20"
                },
                {
                    "ID": 9010,
                    "other": 45066,
                    "VisitDate": "2023-05-20"
                },
                {
                    "ID": 9011,
                    "other": 45062,
                    "VisitDate": "2023-05-16"
                },
                {
                    "ID": 9012,
                    "other": 45052,
                    "VisitDate": "2023-05-06"
                },
                {
                    "ID": 9013,
                    "other": 45054,
                    "VisitDate": "2023-05-08"
                },
                {
                    "ID": 9014,
                    "other": 45054,
                    "VisitDate": "2023-05-08"
                },
                {
                    "ID": 9015,
                    "other": 45091,
                    "VisitDate": "2023-06-14"
                },
                {
                    "ID": 9016,
                    "other": 44951,
                    "VisitDate": "2023-01-25"
                },
                {
                    "ID": 9017,
                    "other": 45075,
                    "VisitDate": "2023-05-29"
                },
                {
                    "ID": 9018,
                    "other": 45075,
                    "VisitDate": "2023-05-29"
                },
                {
                    "ID": 9019,
                    "other": 45103,
                    "VisitDate": "2023-06-26"
                },
                {
                    "ID": 9020,
                    "other": 45092,
                    "VisitDate": "2023-06-15"
                },
                {
                    "ID": 9021,
                    "other": 45103,
                    "VisitDate": "2023-06-26"
                },
                {
                    "ID": 9022,
                    "other": 45103,
                    "VisitDate": "2023-06-26"
                },
                {
                    "ID": 9023,
                    "other": 45104,
                    "VisitDate": "2023-06-27"
                },
                {
                    "ID": 9024,
                    "other": 45096,
                    "VisitDate": "2023-06-19"
                },
                {
                    "ID": 9025,
                    "other": 45098,
                    "VisitDate": "2023-06-21"
                },
                {
                    "ID": 9026,
                    "other": 45097,
                    "VisitDate": "2023-06-20"
                },
                {
                    "ID": 9027,
                    "other": 45097,
                    "VisitDate": "2023-06-20"
                },
                {
                    "ID": 9028,
                    "other": 45098,
                    "VisitDate": "2023-06-21"
                },
                {
                    "ID": 9029,
                    "other": 45098,
                    "VisitDate": "2023-06-21"
                },
                {
                    "ID": 9030,
                    "other": 45094,
                    "VisitDate": "2023-06-17"
                },
                {
                    "ID": 9031,
                    "other": 45110,
                    "VisitDate": "2023-07-03"
                },
                {
                    "ID": 9032,
                    "other": 45073,
                    "VisitDate": "2023-05-27"
                },
                {
                    "ID": 9033,
                    "other": 45062,
                    "VisitDate": "2023-05-16"
                },
                {
                    "ID": 9034,
                    "other": 45062,
                    "VisitDate": "2023-05-16"
                },
                {
                    "ID": 9035,
                    "other": 45094,
                    "VisitDate": "2023-06-17"
                },
                {
                    "ID": 9036,
                    "other": 45096,
                    "VisitDate": "2023-06-19"
                },
                {
                    "ID": 9037,
                    "other": 45092,
                    "VisitDate": "2023-06-15"
                },
                {
                    "ID": 9038,
                    "other": 45068,
                    "VisitDate": "2023-05-22"
                },
                {
                    "ID": 9039,
                    "other": 45056,
                    "VisitDate": "2023-05-10"
                },
                {
                    "ID": 9040,
                    "other": 45070,
                    "VisitDate": "2023-05-24"
                },
                {
                    "ID": 9041,
                    "other": 45072,
                    "VisitDate": "2023-05-26"
                },
                {
                    "ID": 9042,
                    "other": 45070,
                    "VisitDate": "2023-05-24"
                },
                {
                    "ID": 9043,
                    "other": 45051,
                    "VisitDate": "2023-05-05"
                },
                {
                    "ID": 9044,
                    "other": 45068,
                    "VisitDate": "2023-05-22"
                },
                {
                    "ID": 9045,
                    "other": 45078,
                    "VisitDate": "2023-06-01"
                },
                {
                    "ID": 9046,
                    "other": 45079,
                    "VisitDate": "2023-06-02"
                },
                {
                    "ID": 9047,
                    "other": 45078,
                    "VisitDate": "2023-06-01"
                },
                {
                    "ID": 9048,
                    "other": 45080,
                    "VisitDate": "2023-06-03"
                },
                {
                    "ID": 9049,
                    "other": 45083,
                    "VisitDate": "2023-06-06"
                },
                {
                    "ID": 9050,
                    "other": 45084,
                    "VisitDate": "2023-06-07"
                },
                {
                    "ID": 9051,
                    "other": 45078,
                    "VisitDate": "2023-06-01"
                },
                {
                    "ID": 9052,
                    "other": 45110,
                    "VisitDate": "2023-07-03"
                },
                {
                    "ID": 9053,
                    "other": 45084,
                    "VisitDate": "2023-06-07"
                },
                {
                    "ID": 9054,
                    "other": 45066,
                    "VisitDate": "2023-05-20"
                },
                {
                    "ID": 9055,
                    "other": 45097,
                    "VisitDate": "2023-06-20"
                },
                {
                    "ID": 9056,
                    "other": 45073,
                    "VisitDate": "2023-05-27"
                },
                {
                    "ID": 9057,
                    "other": 45072,
                    "VisitDate": "2023-05-26"
                },
                {
                    "ID": 9058,
                    "other": 45079,
                    "VisitDate": "2023-06-02"
                },
                {
                    "ID": 9059,
                    "other": 45097,
                    "VisitDate": "2023-06-20"
                },
                {
                    "ID": 9060,
                    "other": 45100,
                    "VisitDate": "2023-06-23"
                },
                {
                    "ID": 9061,
                    "other": 44950,
                    "VisitDate": "2023-01-24"
                },
                {
                    "ID": 9062,
                    "other": 44950,
                    "VisitDate": "2023-01-24"
                },
                {
                    "ID": 9063,
                    "other": 45100,
                    "VisitDate": "2023-06-23"
                },
                {
                    "ID": 9064,
                    "other": 45051,
                    "VisitDate": "2023-05-05"
                },
                {
                    "ID": 9065,
                    "other": 45094,
                    "VisitDate": "2023-06-17"
                },
                {
                    "ID": 9066,
                    "other": 45100,
                    "VisitDate": "2023-06-23"
                },
                {
                    "ID": 9067,
                    "other": 45093,
                    "VisitDate": "2023-06-16"
                },
                {
                    "ID": 9068,
                    "other": 45100,
                    "VisitDate": "2023-06-23"
                },
                {
                    "ID": 9069,
                    "other": 45100,
                    "VisitDate": "2023-06-23"
                },
                {
                    "ID": 9070,
                    "other": 45129,
                    "VisitDate": "2023-07-22"
                },
                {
                    "ID": 9071,
                    "other": 45132,
                    "VisitDate": "2023-07-25"
                },
                {
                    "ID": 9072,
                    "other": 45129,
                    "VisitDate": "2023-07-22"
                },
                {
                    "ID": 9073,
                    "other": 45110,
                    "VisitDate": "2023-07-03"
                },
                {
                    "ID": 9074,
                    "other": 45110,
                    "VisitDate": "2023-07-03"
                },
                {
                    "ID": 9075,
                    "other": 45113,
                    "VisitDate": "2023-07-06"
                },
                {
                    "ID": 9076,
                    "other": 45114,
                    "VisitDate": "2023-07-07"
                },
                {
                    "ID": 9077,
                    "other": 45112,
                    "VisitDate": "2023-07-05"
                },
                {
                    "ID": 9078,
                    "other": 45118,
                    "VisitDate": "2023-07-11"
                },
                {
                    "ID": 9079,
                    "other": 45119,
                    "VisitDate": "2023-07-12"
                },
                {
                    "ID": 9080,
                    "other": 45118,
                    "VisitDate": "2023-07-11"
                },
                {
                    "ID": 9081,
                    "other": 45119,
                    "VisitDate": "2023-07-12"
                },
                {
                    "ID": 9082,
                    "other": 45122,
                    "VisitDate": "2023-07-15"
                },
                {
                    "ID": 9083,
                    "other": 45124,
                    "VisitDate": "2023-07-17"
                },
                {
                    "ID": 9084,
                    "other": 45118,
                    "VisitDate": "2023-07-11"
                },
                {
                    "ID": 9085,
                    "other": 45124,
                    "VisitDate": "2023-07-17"
                },
                {
                    "ID": 9086,
                    "other": 45124,
                    "VisitDate": "2023-07-17"
                },
                {
                    "ID": 9087,
                    "other": 45127,
                    "VisitDate": "2023-07-20"
                },
                {
                    "ID": 9088,
                    "other": 45121,
                    "VisitDate": "2023-07-14"
                },
                {
                    "ID": 9089,
                    "other": 45093,
                    "VisitDate": "2023-06-16"
                },
                {
                    "ID": 9090,
                    "other": 45108,
                    "VisitDate": "2023-07-01"
                },
                {
                    "ID": 9091,
                    "other": 45122,
                    "VisitDate": "2023-07-15"
                },
                {
                    "ID": 9092,
                    "other": 45124,
                    "VisitDate": "2023-07-17"
                },
                {
                    "ID": 9093,
                    "other": 45111,
                    "VisitDate": "2023-07-04"
                },
                {
                    "ID": 9094,
                    "other": 45120,
                    "VisitDate": "2023-07-13"
                },
                {
                    "ID": 9095,
                    "other": 45117,
                    "VisitDate": "2023-07-10"
                },
                {
                    "ID": 9096,
                    "other": 45132,
                    "VisitDate": "2023-07-25"
                },
                {
                    "ID": 9097,
                    "other": 45133,
                    "VisitDate": "2023-07-26"
                },
                {
                    "ID": 9098,
                    "other": 45133,
                    "VisitDate": "2023-07-26"
                },
                {
                    "ID": 9099,
                    "other": 44650,
                    "VisitDate": "2022-03-30"
                },
                {
                    "ID": 9100,
                    "other": 45052,
                    "VisitDate": "2023-05-06"
                },
                {
                    "ID": 9101,
                    "other": 45136,
                    "VisitDate": "2023-07-29"
                },
                {
                    "ID": 9102,
                    "other": 45079,
                    "VisitDate": "2023-06-02"
                },
                {
                    "ID": 9103,
                    "other": 45138,
                    "VisitDate": "2023-07-31"
                },
                {
                    "ID": 9104,
                    "other": 45143,
                    "VisitDate": "2023-08-05"
                },
                {
                    "ID": 9105,
                    "other": 45143,
                    "VisitDate": "2023-08-05"
                },
                {
                    "ID": 9106,
                    "other": 45143,
                    "VisitDate": "2023-08-05"
                },
                {
                    "ID": 9107,
                    "other": 45141,
                    "VisitDate": "2023-08-03"
                },
                {
                    "ID": 9108,
                    "other": 45147,
                    "VisitDate": "2023-08-09"
                },
                {
                    "ID": 9109,
                    "other": 45143,
                    "VisitDate": "2023-08-05"
                },
                {
                    "ID": 9110,
                    "other": 45145,
                    "VisitDate": "2023-08-07"
                },
                {
                    "ID": 9111,
                    "other": 45149,
                    "VisitDate": "2023-08-11"
                },
                {
                    "ID": 9112,
                    "other": 45147,
                    "VisitDate": "2023-08-09"
                },
                {
                    "ID": 9113,
                    "other": 45142,
                    "VisitDate": "2023-08-04"
                },
                {
                    "ID": 9114,
                    "other": 45150,
                    "VisitDate": "2023-08-12"
                },
                {
                    "ID": 9115,
                    "other": 45150,
                    "VisitDate": "2023-08-12"
                },
                {
                    "ID": 9116,
                    "other": 45117,
                    "VisitDate": "2023-07-10"
                },
                {
                    "ID": 9117,
                    "other": 45152,
                    "VisitDate": "2023-08-14"
                },
                {
                    "ID": 9118,
                    "other": 45146,
                    "VisitDate": "2023-08-08"
                },
                {
                    "ID": 9119,
                    "other": 45146,
                    "VisitDate": "2023-08-08"
                },
                {
                    "ID": 9120,
                    "other": 45150,
                    "VisitDate": "2023-08-12"
                },
                {
                    "ID": 9121,
                    "other": 45159,
                    "VisitDate": "2023-08-21"
                },
                {
                    "ID": 9122,
                    "other": 45154,
                    "VisitDate": "2023-08-16"
                },
                {
                    "ID": 9123,
                    "other": 45154,
                    "VisitDate": "2023-08-16"
                },
                {
                    "ID": 9124,
                    "other": 45153,
                    "VisitDate": "2023-08-15"
                },
                {
                    "ID": 9125,
                    "other": 45154,
                    "VisitDate": "2023-08-16"
                },
                {
                    "ID": 9126,
                    "other": 45092,
                    "VisitDate": "2023-06-15"
                },
                {
                    "ID": 9127,
                    "other": 45154,
                    "VisitDate": "2023-08-16"
                },
                {
                    "ID": 9128,
                    "other": 45153,
                    "VisitDate": "2023-08-15"
                },
                {
                    "ID": 9129,
                    "other": 45145,
                    "VisitDate": "2023-08-07"
                },
                {
                    "ID": 9130,
                    "other": 45157,
                    "VisitDate": "2023-08-19"
                },
                {
                    "ID": 9131,
                    "other": 45156,
                    "VisitDate": "2023-08-18"
                },
                {
                    "ID": 9132,
                    "other": 45153,
                    "VisitDate": "2023-08-15"
                },
                {
                    "ID": 9133,
                    "other": 45157,
                    "VisitDate": "2023-08-19"
                },
                {
                    "ID": 9134,
                    "other": 45160,
                    "VisitDate": "2023-08-22"
                },
                {
                    "ID": 9135,
                    "other": 45161,
                    "VisitDate": "2023-08-23"
                },
                {
                    "ID": 9136,
                    "other": 45163,
                    "VisitDate": "2023-08-25"
                },
                {
                    "ID": 9137,
                    "other": 45166,
                    "VisitDate": "2023-08-28"
                },
                {
                    "ID": 9138,
                    "other": 45166,
                    "VisitDate": "2023-08-28"
                },
                {
                    "ID": 9139,
                    "other": 45199,
                    "VisitDate": "2023-09-30"
                },
                {
                    "ID": 9140,
                    "other": 45166,
                    "VisitDate": "2023-08-28"
                },
                {
                    "ID": 9141,
                    "other": 45167,
                    "VisitDate": "2023-08-29"
                },
                {
                    "ID": 9142,
                    "other": 45170,
                    "VisitDate": "2023-09-01"
                },
                {
                    "ID": 9143,
                    "other": 45156,
                    "VisitDate": "2023-08-18"
                },
                {
                    "ID": 9144,
                    "other": 45169,
                    "VisitDate": "2023-08-31"
                },
                {
                    "ID": 9145,
                    "other": 45166,
                    "VisitDate": "2023-08-28"
                },
                {
                    "ID": 9146,
                    "other": 45185,
                    "VisitDate": "2023-09-16"
                },
                {
                    "ID": 9147,
                    "other": 45187,
                    "VisitDate": "2023-09-18"
                },
                {
                    "ID": 9148,
                    "other": 45185,
                    "VisitDate": "2023-09-16"
                },
                {
                    "ID": 9149,
                    "other": 45182,
                    "VisitDate": "2023-09-13"
                },
                {
                    "ID": 9150,
                    "other": 45187,
                    "VisitDate": "2023-09-18"
                },
                {
                    "ID": 9151,
                    "other": 45181,
                    "VisitDate": "2023-09-12"
                },
                {
                    "ID": 9152,
                    "other": 45171,
                    "VisitDate": "2023-09-02"
                },
                {
                    "ID": 9153,
                    "other": 45180,
                    "VisitDate": "2023-09-11"
                },
                {
                    "ID": 9154,
                    "other": 45181,
                    "VisitDate": "2023-09-12"
                },
                {
                    "ID": 9155,
                    "other": 45182,
                    "VisitDate": "2023-09-13"
                },
                {
                    "ID": 9156,
                    "other": 45181,
                    "VisitDate": "2023-09-12"
                },
                {
                    "ID": 9157,
                    "other": 45122,
                    "VisitDate": "2023-07-15"
                },
                {
                    "ID": 9158,
                    "other": 45122,
                    "VisitDate": "2023-07-15"
                },
                {
                    "ID": 9159,
                    "other": 45184,
                    "VisitDate": "2023-09-15"
                },
                {
                    "ID": 9160,
                    "other": 45185,
                    "VisitDate": "2023-09-16"
                },
                {
                    "ID": 9161,
                    "other": 45177,
                    "VisitDate": "2023-09-08"
                },
                {
                    "ID": 9162,
                    "other": 45178,
                    "VisitDate": "2023-09-09"
                },
                {
                    "ID": 9163,
                    "other": 44651,
                    "VisitDate": "2022-03-31"
                },
                {
                    "ID": 9164,
                    "other": 45192,
                    "VisitDate": "2023-09-23"
                },
                {
                    "ID": 9165,
                    "other": 45194,
                    "VisitDate": "2023-09-25"
                },
                {
                    "ID": 9166,
                    "other": 45190,
                    "VisitDate": "2023-09-21"
                },
                {
                    "ID": 9167,
                    "other": 45189,
                    "VisitDate": "2023-09-20"
                },
                {
                    "ID": 9168,
                    "other": 45189,
                    "VisitDate": "2023-09-20"
                },
                {
                    "ID": 9169,
                    "other": 45195,
                    "VisitDate": "2023-09-26"
                },
                {
                    "ID": 9170,
                    "other": 45198,
                    "VisitDate": "2023-09-29"
                },
                {
                    "ID": 9171,
                    "other": 45197,
                    "VisitDate": "2023-09-28"
                },
                {
                    "ID": 9172,
                    "other": 45201,
                    "VisitDate": "2023-10-02"
                },
                {
                    "ID": 9173,
                    "other": 45145,
                    "VisitDate": "2023-08-07"
                },
                {
                    "ID": 9174,
                    "other": 45220,
                    "VisitDate": "2023-10-21"
                },
                {
                    "ID": 9175,
                    "other": 45201,
                    "VisitDate": "2023-10-02"
                },
                {
                    "ID": 9176,
                    "other": 45174,
                    "VisitDate": "2023-09-05"
                },
                {
                    "ID": 9177,
                    "other": 45185,
                    "VisitDate": "2023-09-16"
                },
                {
                    "ID": 9178,
                    "other": 45191,
                    "VisitDate": "2023-09-22"
                },
                {
                    "ID": 9179,
                    "other": 45191,
                    "VisitDate": "2023-09-22"
                },
                {
                    "ID": 9180,
                    "other": 45191,
                    "VisitDate": "2023-09-22"
                },
                {
                    "ID": 9181,
                    "other": 45206,
                    "VisitDate": "2023-10-07"
                },
                {
                    "ID": 9182,
                    "other": 45206,
                    "VisitDate": "2023-10-07"
                },
                {
                    "ID": 9183,
                    "other": 45206,
                    "VisitDate": "2023-10-07"
                },
                {
                    "ID": 9184,
                    "other": 45203,
                    "VisitDate": "2023-10-04"
                },
                {
                    "ID": 9185,
                    "other": 45204,
                    "VisitDate": "2023-10-05"
                },
                {
                    "ID": 9186,
                    "other": 45203,
                    "VisitDate": "2023-10-04"
                },
                {
                    "ID": 9187,
                    "other": 45202,
                    "VisitDate": "2023-10-03"
                },
                {
                    "ID": 9188,
                    "other": 45208,
                    "VisitDate": "2023-10-09"
                },
                {
                    "ID": 9189,
                    "other": 45209,
                    "VisitDate": "2023-10-10"
                },
                {
                    "ID": 9190,
                    "other": 45204,
                    "VisitDate": "2023-10-05"
                },
                {
                    "ID": 9191,
                    "other": 45212,
                    "VisitDate": "2023-10-13"
                },
                {
                    "ID": 9192,
                    "other": 45215,
                    "VisitDate": "2023-10-16"
                },
                {
                    "ID": 9193,
                    "other": 45215,
                    "VisitDate": "2023-10-16"
                },
                {
                    "ID": 9194,
                    "other": 45201,
                    "VisitDate": "2023-10-02"
                },
                {
                    "ID": 9195,
                    "other": 45201,
                    "VisitDate": "2023-10-02"
                },
                {
                    "ID": 9196,
                    "other": 45212,
                    "VisitDate": "2023-10-13"
                },
                {
                    "ID": 9197,
                    "other": 45213,
                    "VisitDate": "2023-10-14"
                },
                {
                    "ID": 9198,
                    "other": 45213,
                    "VisitDate": "2023-10-14"
                },
                {
                    "ID": 9199,
                    "other": 45215,
                    "VisitDate": "2023-10-16"
                },
                {
                    "ID": 9200,
                    "other": 45216,
                    "VisitDate": "2023-10-17"
                },
                {
                    "ID": 9201,
                    "other": 45218,
                    "VisitDate": "2023-10-19"
                },
                {
                    "ID": 9202,
                    "other": 45217,
                    "VisitDate": "2023-10-18"
                },
                {
                    "ID": 9203,
                    "other": 45217,
                    "VisitDate": "2023-10-18"
                },
                {
                    "ID": 9204,
                    "other": 45217,
                    "VisitDate": "2023-10-18"
                },
                {
                    "ID": 9205,
                    "other": 45211,
                    "VisitDate": "2023-10-12"
                },
                {
                    "ID": 9206,
                    "other": 45219,
                    "VisitDate": "2023-10-20"
                },
                {
                    "ID": 9207,
                    "other": 45218,
                    "VisitDate": "2023-10-19"
                },
                {
                    "ID": 9208,
                    "other": 45215,
                    "VisitDate": "2023-10-16"
                },
                {
                    "ID": 9209,
                    "other": 45106,
                    "VisitDate": "2023-06-29"
                },
                {
                    "ID": 9210,
                    "other": 45212,
                    "VisitDate": "2023-10-13"
                },
                {
                    "ID": 9211,
                    "other": 45215,
                    "VisitDate": "2023-10-16"
                },
                {
                    "ID": 9212,
                    "other": 45216,
                    "VisitDate": "2023-10-17"
                },
                {
                    "ID": 9213,
                    "other": 45211,
                    "VisitDate": "2023-10-12"
                },
                {
                    "ID": 9214,
                    "other": 45212,
                    "VisitDate": "2023-10-13"
                },
                {
                    "ID": 9215,
                    "other": 45198,
                    "VisitDate": "2023-09-29"
                },
                {
                    "ID": 9216,
                    "other": 45230,
                    "VisitDate": "2023-10-31"
                },
                {
                    "ID": 9217,
                    "other": 45224,
                    "VisitDate": "2023-10-25"
                },
                {
                    "ID": 9218,
                    "other": 45225,
                    "VisitDate": "2023-10-26"
                },
                {
                    "ID": 9219,
                    "other": 45229,
                    "VisitDate": "2023-10-30"
                },
                {
                    "ID": 9220,
                    "other": 45225,
                    "VisitDate": "2023-10-26"
                },
                {
                    "ID": 9221,
                    "other": 45222,
                    "VisitDate": "2023-10-23"
                },
                {
                    "ID": 9222,
                    "other": 45222,
                    "VisitDate": "2023-10-23"
                },
                {
                    "ID": 9223,
                    "other": 45223,
                    "VisitDate": "2023-10-24"
                },
                {
                    "ID": 9224,
                    "other": 45215,
                    "VisitDate": "2023-10-16"
                },
                {
                    "ID": 9225,
                    "other": 45219,
                    "VisitDate": "2023-10-20"
                },
                {
                    "ID": 9226,
                    "other": 45226,
                    "VisitDate": "2023-10-27"
                },
                {
                    "ID": 9227,
                    "other": 45235,
                    "VisitDate": "2023-11-05"
                },
                {
                    "ID": 9228,
                    "other": 45231,
                    "VisitDate": "2023-11-01"
                },
                {
                    "ID": 9229,
                    "other": 45231,
                    "VisitDate": "2023-11-01"
                },
                {
                    "ID": 9230,
                    "other": 45237,
                    "VisitDate": "2023-11-07"
                },
                {
                    "ID": 9231,
                    "other": 45226,
                    "VisitDate": "2023-10-27"
                },
                {
                    "ID": 9232,
                    "other": 45236,
                    "VisitDate": "2023-11-06"
                },
                {
                    "ID": 9233,
                    "other": 45232,
                    "VisitDate": "2023-11-02"
                },
                {
                    "ID": 9234,
                    "other": 45219,
                    "VisitDate": "2023-10-20"
                },
                {
                    "ID": 9235,
                    "other": 45234,
                    "VisitDate": "2023-11-04"
                },
                {
                    "ID": 9236,
                    "other": 45236,
                    "VisitDate": "2023-11-06"
                },
                {
                    "ID": 9237,
                    "other": 45235,
                    "VisitDate": "2023-11-05"
                },
                {
                    "ID": 9238,
                    "other": 45233,
                    "VisitDate": "2023-11-03"
                },
                {
                    "ID": 9239,
                    "other": 45232,
                    "VisitDate": "2023-11-02"
                },
                {
                    "ID": 9240,
                    "other": 45239,
                    "VisitDate": "2023-11-09"
                },
                {
                    "ID": 9241,
                    "other": 45238,
                    "VisitDate": "2023-11-08"
                },
                {
                    "ID": 9242,
                    "other": 45254,
                    "VisitDate": "2023-11-24"
                },
                {
                    "ID": 9243,
                    "other": 45240,
                    "VisitDate": "2023-11-10"
                },
                {
                    "ID": 9244,
                    "other": 45240,
                    "VisitDate": "2023-11-10"
                },
                {
                    "ID": 9245,
                    "other": 45241,
                    "VisitDate": "2023-11-11"
                },
                {
                    "ID": 9246,
                    "other": 45239,
                    "VisitDate": "2023-11-09"
                },
                {
                    "ID": 9247,
                    "other": 45231,
                    "VisitDate": "2023-11-01"
                },
                {
                    "ID": 9248,
                    "other": 45242,
                    "VisitDate": "2023-11-12"
                },
                {
                    "ID": 9249,
                    "other": 45240,
                    "VisitDate": "2023-11-10"
                },
                {
                    "ID": 9250,
                    "other": 45237,
                    "VisitDate": "2023-11-07"
                },
                {
                    "ID": 9251,
                    "other": 45253,
                    "VisitDate": "2023-11-23"
                },
                {
                    "ID": 9252,
                    "other": 45252,
                    "VisitDate": "2023-11-22"
                },
                {
                    "ID": 9253,
                    "other": 45253,
                    "VisitDate": "2023-11-23"
                },
                {
                    "ID": 9254,
                    "other": 45254,
                    "VisitDate": "2023-11-24"
                },
                {
                    "ID": 9255,
                    "other": 45239,
                    "VisitDate": "2023-11-09"
                },
                {
                    "ID": 9256,
                    "other": 45239,
                    "VisitDate": "2023-11-09"
                },
                {
                    "ID": 9257,
                    "other": 45239,
                    "VisitDate": "2023-11-09"
                },
                {
                    "ID": 9258,
                    "other": 45239,
                    "VisitDate": "2023-11-09"
                },
                {
                    "ID": 9259,
                    "other": 45237,
                    "VisitDate": "2023-11-07"
                },
                {
                    "ID": 9260,
                    "other": 45250,
                    "VisitDate": "2023-11-20"
                },
                {
                    "ID": 9261,
                    "other": 45258,
                    "VisitDate": "2023-11-28"
                },
                {
                    "ID": 9262,
                    "other": 45257,
                    "VisitDate": "2023-11-27"
                },
                {
                    "ID": 9263,
                    "other": 45259,
                    "VisitDate": "2023-11-29"
                },
                {
                    "ID": 9264,
                    "other": 45257,
                    "VisitDate": "2023-11-27"
                },
                {
                    "ID": 9265,
                    "other": 45255,
                    "VisitDate": "2023-11-25"
                },
                {
                    "ID": 9266,
                    "other": 45260,
                    "VisitDate": "2023-11-30"
                },
                {
                    "ID": 9267,
                    "other": 45250,
                    "VisitDate": "2023-11-20"
                },
                {
                    "ID": 9268,
                    "other": 45253,
                    "VisitDate": "2023-11-23"
                },
                {
                    "ID": 9269,
                    "other": 45252,
                    "VisitDate": "2023-11-22"
                },
                {
                    "ID": 9270,
                    "other": 45231,
                    "VisitDate": "2023-11-01"
                },
                {
                    "ID": 9271,
                    "other": 45260,
                    "VisitDate": "2023-11-30"
                },
                {
                    "ID": 9272,
                    "other": 45250,
                    "VisitDate": "2023-11-20"
                },
                {
                    "ID": 9273,
                    "other": 45238,
                    "VisitDate": "2023-11-08"
                },
                {
                    "ID": 9274,
                    "other": 44923,
                    "VisitDate": "2022-12-28"
                },
                {
                    "ID": 9275,
                    "other": 45252,
                    "VisitDate": "2023-11-22"
                },
                {
                    "ID": 9276,
                    "other": 45251,
                    "VisitDate": "2023-11-21"
                },
                {
                    "ID": 9277,
                    "other": 45238,
                    "VisitDate": "2023-11-08"
                },
                {
                    "ID": 9278,
                    "other": 45260,
                    "VisitDate": "2023-11-30"
                },
                {
                    "ID": 9279,
                    "other": 45252,
                    "VisitDate": "2023-11-22"
                }
            ]
            if (data.length) {
                for (let item of data) {
                    const [update] = await mysql2.pool.query(`update contact_lens_rx set VisitDate = '${item.VisitDate}' where ID = ${item.ID}`)

                    console.log(`update contact_lens_rx set VisitDate = '${item.VisitDate}' where ID = ${item.ID}`);

                }

            }

            console.log(data.length);

            response.message = "Updated"
            return res.send(response)
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    getLoyalityReport: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "Quantity": 0,
                    "TotalAmount": 0
                }
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const {
                UserType,
                UserID,
                FromDate,
                ToDate,
                ShopID,
                PaymentStatus
            } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (UserID === null || UserID === undefined || UserID == 0 || UserID === "") return res.send({ message: "Invalid UserID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })
            if (UserType !== 'Employee' && UserType !== 'Doctor') {
                return res.send({ message: "Invalid UserType Data" })
            }
            // if (PaymentStatus !== 'Paid' && PaymentStatus !== 'Unpaid') {
            //     return res.send({ message: "Invalid PaymentStatus Data" })
            // }

            let shopParams = ``

            if (ShopID !== 0) {
                shopParams = ` and commissionmaster.ShopID = ${ShopID}`
            }

            let dateParams = ``

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(commissionmaster.PurchaseDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
            }

            let paymentStatus = ``

            if (PaymentStatus !== 0) {
                paymentStatus = ` and commissionmaster.PaymentStatus = '${PaymentStatus}'`
            }

            let userJoin = ``
            let userFeild = ``

            if (UserType === 'Employee') {
                userJoin = `left join user on user.ID = commissionmaster.UserID`
                userFeild = `user.Name as UserName`
            }
            if (UserType === 'Doctor') {
                userJoin = `left join doctor on doctor.ID = commissionmaster.UserID`
                userFeild = `doctor.Name as UserName`
            }

            const [fetch] = await mysql2.pool.query(`select commissionmaster.*,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, ${userFeild} from commissionmaster left join shop on shop.ID = commissionmaster.ShopID ${userJoin} where commissionmaster.CompanyID = ${CompanyID} and commissionmaster.Status = 1 and commissionmaster.UserType = '${UserType}' and UserID = ${UserID} ${shopParams} ${dateParams} ${paymentStatus}`)

            if (fetch) {
                for (let item of fetch) {
                    response.calculation.Quantity += item.Quantity
                    response.calculation.TotalAmount += item.TotalAmount
                }
            }

            response.message = fetch.length !== 0 ? "data fetch successfully" : "data not found"
            response.data = fetch
            return res.send(response)
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    getLoyalityDetailReport: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "Quantity": 0,
                    "CommissionAmount": 0,
                    "BrandedCommissionAmount": 0,
                    "NonBrandedCommissionAmount": 0,
                }
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const {
                UserType,
                UserID,
                FromDate,
                ToDate,
                ShopID,
                PaymentStatus
            } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (UserID === null || UserID === undefined || UserID == 0 || UserID === "") return res.send({ message: "Invalid UserID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })
            if (UserType !== 'Employee' && UserType !== 'Doctor') {
                return res.send({ message: "Invalid UserType Data" })
            }
            // if (PaymentStatus !== 'Paid' && PaymentStatus !== 'Unpaid') {
            //     return res.send({ message: "Invalid PaymentStatus Data" })
            // }

            let shopParams = ``

            if (ShopID !== 0) {
                shopParams = ` and commissiondetail.ShopID = ${ShopID}`
            }

            let dateParams = ``

            if (FromDate && ToDate) {
                dateParams = ` and DATE_FORMAT(commissionmaster.PurchaseDate,"%Y-%m-%d") between '${FromDate}' and '${ToDate}'`
            }

            let paymentStatus = ``

            if (PaymentStatus !== 0) {
                paymentStatus = ` and commissionmaster.PaymentStatus = '${PaymentStatus}'`
            }

            let userJoin = ``
            let userFeild = ``

            if (UserType === 'Employee') {
                userJoin = `left join user on user.ID = commissiondetail.UserID`
                userFeild = `user.Name as UserName`
            }
            if (UserType === 'Doctor') {
                userJoin = `left join doctor on doctor.ID = commissiondetail.UserID`
                userFeild = `doctor.Name as UserName`
            }

            const [fetch] = await mysql2.pool.query(`select commissiondetail.*,billmaster.InvoiceNo as SaleInvoiceNo,commissionmaster.Quantity,commissionmaster.InvoiceNo as PaymentInvoiceNo, commissionmaster.PurchaseDate,CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, ${userFeild} from commissiondetail left join billmaster on billmaster.ID = commissiondetail.BillMasterID left join commissionmaster on commissionmaster.ID = commissiondetail.CommissionMasterID left join shop on shop.ID = commissiondetail.ShopID ${userJoin} where commissiondetail.CompanyID = ${CompanyID} and commissiondetail.Status = 1 and commissiondetail.UserType = '${UserType}' and commissiondetail.CommissionMasterID != 0 and commissiondetail.UserID = ${UserID} ${shopParams} ${dateParams} ${paymentStatus}`)

            if (fetch) {
                for (let item of fetch) {
                    response.calculation.Quantity += item.Quantity
                    response.calculation.CommissionAmount += item.CommissionAmount
                    response.calculation.NonBrandedCommissionAmount += item.NonBrandedCommissionAmount
                    response.calculation.BrandedCommissionAmount += item.BrandedCommissionAmount

                    if (item.CommissionType === 0) {
                        item.CommissionType = 'No Loyalty'
                    } else if (item.CommissionType === 1) {
                        item.CommissionType = 'Per Sale Loyalty'
                    } else if (item.CommissionType === 2) {
                        item.CommissionType = 'Per Item Loyalty'
                    }
                    if (item.CommissionMode === 1) {
                        item.CommissionMode = 'Percentage'
                    } else if (item.CommissionMode === 2) {
                        item.CommissionMode = 'Fixed Amount'
                    }
                }
            }

            response.message = fetch.length !== 0 ? "data fetch successfully" : "data not found"
            response.data = fetch
            return res.send(response)
        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    generateInvoiceNo: async (req, res, next) => {
        try {
            const response = {
                data: null, InvoiceNo: "", calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalPurchasePrice": 0,
                    "totalProfit": 0,
                    "iGstAmount": 0,
                    "cGstAmount": 0,
                    "sGstAmount": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem, Productsearch, FromDate, ToDate, ShopID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            if (ShopID === null || ShopID === undefined || ShopID === "" || ShopID.toString().toUpperCase() === "ALL") return res.send({ message: "Invalid Query ShopID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query FromDate Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query ToDate Data" })
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and billdetail.ProductName like '%${Productsearch}%'`
            }

            let shopParams = ``

            if (ShopID) {
                shopParams = ` and billmaster.ShopID = ${ShopID}`
            }

            let dateCheck = await validateSameMonthAndYear(FromDate, ToDate);

            if (!dateCheck) {
                return res.send({ success: false, message: `This GST PDF will not work in this date range, please select correct date` })
            }
            let fromDate = moment(FromDate).format("YYYY-MM-DD")
            let toDate = moment(ToDate).format("YYYY-MM-DD")
            let dateParams = ` and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between '${fromDate}' and '${toDate}'`

            const [fetchShop] = await mysql2.pool.query(`select ID, Sno from shop where CompanyID = ${CompanyID} and Status = 1 and ID = ${ShopID}`)

            if (!fetchShop.length) {
                return res.send({ success: false, message: `Shop not found` })
            }

            let InvoiceNo = `HVD/${new Date(FromDate).getFullYear().toString().slice(-2)}/${numberToMonth(new Date(FromDate).getMonth() + 1)}-${fetchShop[0].Sno}`

            response.InvoiceNo = InvoiceNo

            qry = `SELECT 0 as Sel, billdetail.IsGstFiled, billdetail.ID,billdetail.ProductName,billdetail.ProductTypeID,billdetail.ProductTypeName,billdetail.HSNCode,billdetail.UnitPrice,billdetail.Quantity,billdetail.SubTotal,billdetail.DiscountPercentage,billdetail.DiscountAmount,billdetail.GSTPercentage,billdetail.GSTType,billdetail.TotalAmount,billdetail.WholeSale,billdetail.Manual,billdetail.PreOrder,billdetail.BaseBarCode,billdetail.Barcode, billdetail.Status, billdetail.CancelStatus, billdetail.ProductStatus,billdetail.GSTAmount,billdetail.PurchasePrice,billmaster.CompanyID,customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Address as ShopAddress, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.CompanyID = '${CompanyID}' ${searchString} AND billdetail.Quantity != 0 AND shop.Status = 1 ${shopParams} ${dateParams} ` + Parem

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.CompanyID = ${CompanyID}  ${searchString} ${shopParams} ${dateParams} ` + Parem)

            let [data] = await mysql2.pool.query(qry);

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE  billdetail.CompanyID = ${CompanyID} ${searchString} ${shopParams} ${dateParams} ` + Parem);

            let [gstTypes] = await mysql2.pool.query(`select ID, Name, Status, TableName  from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                    item.iGstAmount = 0
                    item.iGstPercentage = 0
                    item.cGstAmount = 0
                    item.cGstPercentage = 0
                    item.sGstAmount = 0
                    item.sGstPercentage = 0
                    values2.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            e.Amount += item.GSTAmount
                            response.calculation[0].iGstAmount += item.GSTAmount
                            item.iGstAmount = item.GSTAmount
                            item.iGstPercentage = item.GSTPercentage
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2
                                response.calculation[0].cGstAmount += item.GSTAmount / 2
                                item.cGstAmount = item.GSTAmount / 2
                                item.cGstPercentage = item.GSTPercentage / 2
                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2
                                response.calculation[0].sGstAmount += item.GSTAmount / 2
                                item.sGstAmount = item.GSTAmount / 2
                                item.sGstPercentage = item.GSTPercentage / 2
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

            // return res.send(response);
            // Generate PDF
            const printdata = response;
            const invoiceNo = printdata.InvoiceNo;
            const invoiceDate = moment().format('DD-MM-YYYY');
            const dataList = printdata.data;
            const totalQty = printdata.calculation[0].totalQty;
            const totalGstAmount = printdata.calculation[0].totalGstAmount;
            const totalAmount = printdata.calculation[0].totalAmount;
            const totalDiscount = printdata.calculation[0].totalDiscount;
            const totalUnitPrice = printdata.calculation[0].totalUnitPrice;
            const totalPurchasePrice = printdata.calculation[0].totalPurchasePrice;
            const totalProfit = printdata.calculation[0].totalProfit;
            const gst_details = printdata.calculation[0].gst_details;

            let gst = []
            gst_details.forEach((e) => {
                if (e.Amount != 0) {
                    gst.push(e)
                }
            })

            dataList.forEach((s) => {
                s.UnitPrice = s.SubTotal / s.Quantity
            })

            printdata.invoiceNo = invoiceNo;
            printdata.invoiceDate = invoiceDate;
            printdata.dataList = dataList;
            printdata.ShopName = dataList[0].ShopName;
            printdata.AreaName = dataList[0].AreaName;
            printdata.ShopAddress = dataList[0].ShopAddress;
            printdata.totalQty = totalQty;
            printdata.totalGstAmount = totalGstAmount;
            printdata.totalAmount = totalAmount;
            printdata.totalDiscount = totalDiscount;
            printdata.totalUnitPrice = totalUnitPrice;
            printdata.totalPurchasePrice = totalPurchasePrice;
            printdata.totalProfit = totalProfit;
            printdata.gst_details = gst;

            if (CompanyID === 184) {
                printdata.LogoURL = clientConfig.appURL + 'assest/HVD_logo.png';
            } else {
                printdata.LogoURL = clientConfig.appURL + ''
            }

            var formatName = "GSTInvoice.ejs";
            var file = "GST" + "_" + "Invoice" + ".pdf";
            var fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        "header": {
                            "height": "0mm"
                        },
                        "footer": {
                            "height": "0mm",
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


        } catch (err) {
            console.log(err);
            next(err)
        }

    },


    generateInvoiceNoExcel: async (req, res, next) => {
        try {
            const response = {
                data: null, InvoiceNo: "", calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalPurchasePrice": 0,
                    "totalProfit": 0,
                    "iGstAmount": 0,
                    "cGstAmount": 0,
                    "sGstAmount": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem, Productsearch, FromDate, ToDate, ShopID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            if (ShopID === null || ShopID === undefined || ShopID === "" || ShopID.toString().toUpperCase() === "ALL") return res.send({ message: "Invalid Query ShopID Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query FromDate Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query ToDate Data" })
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and billdetail.ProductName like '%${Productsearch}%'`
            }

            let shopParams = ``

            if (ShopID) {
                shopParams = ` and billmaster.ShopID = ${ShopID}`
            }

            let dateCheck = await validateSameMonthAndYear(FromDate, ToDate);

            if (!dateCheck) {
                return res.send({ success: false, message: `This GST PDF will not work in this date range, please select correct date` })
            }
            let fromDate = moment(FromDate).format("YYYY-MM-DD")
            let toDate = moment(ToDate).format("YYYY-MM-DD")
            let dateParams = ` and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between '${fromDate}' and '${toDate}'`

            const [fetchShop] = await mysql2.pool.query(`select ID, Sno  from shop where CompanyID = ${CompanyID} and Status = 1 and ID = ${ShopID}`)

            if (!fetchShop.length) {
                return res.send({ success: false, message: `Shop not found` })
            }

            let InvoiceNo = `HVD/${new Date(FromDate).getFullYear().toString().slice(-2)}/${numberToMonth(new Date(FromDate).getMonth() + 1)}-${fetchShop[0].Sno}`

            response.InvoiceNo = InvoiceNo

            qry = `SELECT 0 as Sel, billdetail.IsGstFiled, billdetail.ID,billdetail.ProductName,billdetail.ProductTypeID,billdetail.ProductTypeName,billdetail.HSNCode,billdetail.UnitPrice,billdetail.Quantity,billdetail.SubTotal,billdetail.DiscountPercentage,billdetail.DiscountAmount,billdetail.GSTPercentage,billdetail.GSTType,billdetail.TotalAmount,billdetail.WholeSale,billdetail.Manual,billdetail.PreOrder,billdetail.BaseBarCode,billdetail.Barcode, billdetail.Status, billdetail.CancelStatus, billdetail.ProductStatus,billdetail.GSTAmount,billdetail.PurchasePrice,billmaster.CompanyID,customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Address as ShopAddress, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.CompanyID = '${CompanyID}' ${searchString} AND billdetail.Quantity != 0 AND shop.Status = 1 ${shopParams} ${dateParams} ` + Parem

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID
            left join user on user.ID = billmaster.Employee
            LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.CompanyID = ${CompanyID}  ${searchString} ${shopParams} ${dateParams} ` + Parem)

            let [data] = await mysql2.pool.query(qry);

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE  billdetail.CompanyID = ${CompanyID} ${searchString} ${shopParams} ${dateParams} ` + Parem);

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
                    item.iGstAmount = 0
                    item.iGstPercentage = 0
                    item.cGstAmount = 0
                    item.cGstPercentage = 0
                    item.sGstAmount = 0
                    item.sGstPercentage = 0
                    values2.forEach(e => {
                        if (e.GSTType === item.GSTType) {
                            e.Amount += item.GSTAmount
                            response.calculation[0].iGstAmount += item.GSTAmount
                            item.iGstAmount = item.GSTAmount
                            item.iGstPercentage = item.GSTPercentage
                            item.gst_details.push({
                                GSTType: item.GSTType,
                                Amount: item.GSTAmount
                            })
                        }

                        // CGST-SGST

                        if (item.GSTType === 'CGST-SGST') {

                            if (e.GSTType === 'CGST') {
                                e.Amount += item.GSTAmount / 2
                                response.calculation[0].cGstAmount += item.GSTAmount / 2
                                item.cGstAmount = item.GSTAmount / 2
                                item.cGstPercentage = item.GSTPercentage / 2
                                item.gst_details.push({
                                    GSTType: 'CGST',
                                    Amount: item.GSTAmount / 2
                                })
                            }

                            if (e.GSTType === 'SGST') {
                                e.Amount += item.GSTAmount / 2
                                response.calculation[0].sGstAmount += item.GSTAmount / 2
                                item.sGstAmount = item.GSTAmount / 2
                                item.sGstPercentage = item.GSTPercentage / 2
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

            // return res.send(response);
            // Generate PDF
            const printdata = response;
            const invoiceNo = printdata.InvoiceNo;
            const invoiceDate = moment().format('DD-MM-YYYY');
            const dataList = printdata.data;
            const totalQty = printdata.calculation[0].totalQty;
            const totalGstAmount = printdata.calculation[0].totalGstAmount;
            const totalAmount = printdata.calculation[0].totalAmount;
            const totalDiscount = printdata.calculation[0].totalDiscount;
            const totalUnitPrice = printdata.calculation[0].totalUnitPrice;
            const totalPurchasePrice = printdata.calculation[0].totalPurchasePrice;
            const totalProfit = printdata.calculation[0].totalProfit;
            const gst_details = printdata.calculation[0].gst_details;

            let gst = []
            gst_details.forEach((e) => {
                if (e.Amount != 0) {
                    gst.push(e)
                }
            })

            dataList.forEach((s) => {
                s.UnitPrice = s.SubTotal / s.Quantity
            })

            printdata.invoiceNo = invoiceNo;
            printdata.invoiceDate = invoiceDate;
            printdata.dataList = dataList;
            printdata.ShopName = dataList[0].ShopName;
            printdata.AreaName = dataList[0].AreaName;
            printdata.ShopAddress = dataList[0].ShopAddress;
            printdata.totalQty = totalQty;
            printdata.totalGstAmount = totalGstAmount;
            printdata.totalAmount = totalAmount;
            printdata.totalDiscount = totalDiscount;
            printdata.totalUnitPrice = totalUnitPrice;
            printdata.totalPurchasePrice = totalPurchasePrice;
            printdata.totalProfit = totalProfit;
            printdata.gst_details = gst;

            if (CompanyID === 184) {
                printdata.LogoURL = clientConfig.appURL + 'assest/HVD_logo.png';
            } else {
                printdata.LogoURL = clientConfig.appURL + ''
            }


            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`GST_Report_export`);

            const borderStyle = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            worksheet.mergeCells('A1:C1');
            worksheet.getCell('A1').value = 'LOGO';
            worksheet.getCell('A1').font = { bold: false, size: 12 };
            worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).height = 70; // Increase height as needed

            worksheet.mergeCells('D1:N1');
            worksheet.getCell('D1').value = `The Poona Blind Mens Association \nAddress: PBMA's H.V.Desai Eye Hospital, S.No.93/2, Tarawade Vasti,Mahammadwadi, Hadapsar, Pune-411060 \nPhone No:020-30114101/30114106, Email ID:accounts@hvdeh.org \nPAN No: AAATP1089N, GSTIN: 27ΑΑΑΤP1089N1Z2`;
            worksheet.getCell('D1').font = { bold: true, size: 12, color: { argb: '256DB7' } };
            worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).height = 70; // Increase height as needed
            worksheet.getColumn(2).width = 10;

            worksheet.getCell('O1').value = 'Original for Receipent';
            worksheet.getCell('O1').font = { bold: false, size: 10 };
            worksheet.getCell('O1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).height = 70; // Increase height as needed
            worksheet.getColumn(14).width = 20;

            worksheet.mergeCells('A2:O2');
            worksheet.getCell('A2').value = 'Tax Invoice';
            worksheet.getCell('A2').font = { bold: true, size: 15 };
            worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(2).height = 20;

            worksheet.mergeCells('A3:H3');
            worksheet.getCell('A3').value = 'Invoice Detail';
            worksheet.getCell('A3').font = { bold: true, size: 13 };
            worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(3).height = 20;

            worksheet.mergeCells('I3:N3');
            worksheet.getCell('I3').value = 'Bill Of Party';
            worksheet.getCell('I3').font = { bold: true, size: 13 };
            worksheet.getCell('I3').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(3).height = 20;

            worksheet.mergeCells('A4');
            worksheet.getCell('A4').value = 'Invoice No';
            worksheet.getCell('A4').font = { bold: false, size: 11 };
            worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(4).height = 20;
            worksheet.getColumn(1).width = 10;

            worksheet.mergeCells('B4:H4');
            worksheet.getCell('B4').value = printdata.invoiceNo;
            worksheet.getCell('B4').font = { bold: false, size: 11 };
            worksheet.getCell('B4').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(4).height = 20;

            worksheet.mergeCells('I4');
            worksheet.getCell('I4').value = 'Name';
            worksheet.getCell('I4').font = { bold: false, size: 11 };
            worksheet.getCell('I4').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(4).height = 20;

            worksheet.mergeCells('J4:N4');
            worksheet.getCell('J4').value = printdata.ShopName, printdata.AreaName;
            worksheet.getCell('J4').font = { bold: false, size: 11 };
            worksheet.getCell('J4').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(4).height = 20;

            worksheet.mergeCells('A5');
            worksheet.getCell('A5').value = 'Invoice date';
            worksheet.getCell('A5').font = { bold: false, size: 11 };
            worksheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(5).height = 20;
            worksheet.getColumn(1).width = 10;

            worksheet.mergeCells('B5:H5');
            worksheet.getCell('B5').value = printdata.invoiceDate;
            worksheet.getCell('B5').font = { bold: false, size: 11 };
            worksheet.getCell('B5').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(5).height = 20;

            worksheet.mergeCells('A6');
            worksheet.getCell('A6').value = 'State';
            worksheet.getCell('A6').font = { bold: false, size: 11 };
            worksheet.getCell('A6').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(6).height = 20;
            worksheet.getColumn(1).width = 10;

            worksheet.mergeCells('B6:E6');
            worksheet.getCell('B6').value = 'Maharashtra';
            worksheet.getCell('B6').font = { bold: false, size: 11 };
            worksheet.getCell('B6').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(6).height = 20;

            worksheet.mergeCells('F6:G6');
            worksheet.getCell('F6').value = 'Code';
            worksheet.getCell('F6').font = { bold: false, size: 11 };
            worksheet.getCell('F6').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(6).height = 20;

            worksheet.mergeCells('H6');
            worksheet.getCell('H6').value = '27';
            worksheet.getCell('H6').font = { bold: false, size: 11 };
            worksheet.getCell('H6').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(6).height = 20;

            worksheet.mergeCells('I5');
            worksheet.getCell('I5').value = 'Address';
            worksheet.getCell('I5').font = { bold: false, size: 11 };
            worksheet.getCell('I5').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(5).height = 20;

            worksheet.mergeCells('J5:N6');

            worksheet.getCell('J5').value = printdata.ShopAddress;
            worksheet.getCell('J5').font = { bold: false, size: 11 };
            worksheet.getCell('J5').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.getRow(5).height = 20;

            // Add headers for the table
            worksheet.getCell('A8').value = 'S.No';
            worksheet.getCell('B8').value = 'Product Name';
            worksheet.getCell('C8').value = 'HSN Code';
            worksheet.getCell('D8').value = 'Qty';
            worksheet.getCell('E8').value = 'Rate';
            worksheet.getCell('F8').value = 'Amount';
            worksheet.getCell('G8').value = 'Discount';
            worksheet.getCell('H8').value = 'Taxable Value';
            worksheet.mergeCells('I8:J8');
            worksheet.getCell('I8').value = 'CGST';
            worksheet.mergeCells('K8:L8');
            worksheet.getCell('K8').value = 'SGST';
            worksheet.mergeCells('M8:N8');
            worksheet.getCell('M8').value = 'IGST';
            worksheet.getCell('O8').value = 'Total';

            // Apply styling to headers
            worksheet.getRow(8).font = { bold: true };
            worksheet.getCell('A8:N8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }; // Yellow background

            for (let row = 8; row <= 8; row++) { // Header row
                for (let col = 1; col <= 13; col++) { // Columns A to L
                    const cell = worksheet.getCell(row, col);
                    cell.border = borderStyle;
                }
            }

            // worksheet.addRow(dataRow);

            // Apply borders to data rows
            const startRow = 8; // Start from the header row
            const endRow = 9; // Adjust based on the number of rows
            for (let row = startRow; row <= endRow; row++) {
                for (let col = 1; col <= 15; col++) { // Columns A to L
                    const cell = worksheet.getCell(row, col);
                    cell.border = borderStyle;
                }
            }

            worksheet.mergeCells('A9:H9');
            worksheet.getCell('A9').value = '';
            worksheet.getRow(10).font = { bold: true };


            worksheet.getCell('I9').value = 'Rate';
            worksheet.getRow(10).font = { bold: true };

            worksheet.getCell('J9').value = 'Amount';
            worksheet.getRow(10).font = { bold: true };

            worksheet.getCell('K9').value = 'Rate';
            worksheet.getRow(10).font = { bold: true };

            worksheet.getCell('L9').value = 'Amount';
            worksheet.getRow(10).font = { bold: true };

            worksheet.getCell('M9').value = 'Rate';
            worksheet.getRow(10).font = { bold: true };

            worksheet.getCell('N9').value = 'Amount';
            worksheet.getRow(10).font = { bold: true };

            let count = 1;
            // Start adding data rows from row 10
            let startRows = 10;
            console.log(printdata.dataList[1]);
            let CgstTotalAmt = 0;
            let SgstTotalAmt = 0;
            let IgstTotalAmt = 0;

            printdata.dataList.forEach((G) => {
                CgstTotalAmt += G.cGstAmount
                SgstTotalAmt += G.sGstAmount
                IgstTotalAmt += G.iGstAmount
            })


            printdata.dataList.forEach((x) => {
                x.S_no = count++;
                // Add the row to the worksheet starting at startRow
                const row = worksheet.getRow(startRows);
                row.values = [x.S_no, x.ProductName, x.HSNCode, x.Quantity, x.UnitPrice, x.SubTotal, x.DiscountAmount, x.SubTotal, x.cGstPercentage, x.cGstAmount, x.sGstPercentage, x.sGstAmount, x.iGstPercentage, x.iGstAmount, x.TotalAmount];
                // Apply border formatting if necessary
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                startRows++;
            });

            // Commit changes to the worksheet
            // worksheet.commit();

            // worksheet.getRow(2).eachCell((cell) => {
            //     cell.font = { bold: true };
            //     cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
            // });

            // Add footer similar to header
            const footerRow = worksheet.addRow([]);
            footerRow.height = 20;

            // Merge cells and set the value for 'Tax Invoice'
            worksheet.mergeCells(`A${footerRow.number}:C${footerRow.number}`);
            worksheet.getCell(`A${footerRow.number}`).value = 'Tax Invoice';
            worksheet.getCell(`A${footerRow.number}`).font = { bold: true };
            worksheet.getCell(`A${footerRow.number}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            // Set values for individual columns after merging
            worksheet.getCell(`D${footerRow.number}`).value = printdata.totalQty;
            worksheet.getCell(`D${footerRow.number}`).font = { bold: true };

            worksheet.getCell(`E${footerRow.number}`).value = ' ';
            worksheet.getCell(`E${footerRow.number}`).font = { bold: true };

            worksheet.getCell(`F${footerRow.number}`).value = printdata.totalUnitPrice;
            worksheet.getCell(`F${footerRow.number}`).font = { bold: true };

            worksheet.getCell(`G${footerRow.number}`).value = printdata.totalDiscount;
            worksheet.getCell(`G${footerRow.number}`).font = { bold: true };

            worksheet.getCell(`H${footerRow.number}`).value = printdata.totalGstAmount;
            worksheet.getCell(`H${footerRow.number}`).font = { bold: true };

            // Merge cells and set value for empty area
            worksheet.mergeCells(`I${footerRow.number}:N${footerRow.number}`);
            worksheet.getCell(`I${footerRow.number}`).value = '';
            worksheet.getCell(`I${footerRow.number}`).font = { bold: true };

            // Set value for 'O' column after merging
            worksheet.getCell(`O${footerRow.number}`).value = printdata.totalAmount;
            worksheet.getCell(`O${footerRow.number}`).font = { bold: true };

            // Merge cells A to K for the 'Total Invoice amount in words'
            worksheet.mergeCells(`A${footerRow.number + 1}:K${footerRow.number + 5}`);
            worksheet.getCell(`A${footerRow.number + 1}`).value = 'Total Invoice amount in words' + `\n` + numberToWords.toWords(printdata.totalAmount);
            worksheet.getCell(`A${footerRow.number + 1}`).font = { bold: true, size: 18 };
            worksheet.getCell(`A${footerRow.number + 1}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };



            worksheet.mergeCells(`L${footerRow.number + 1}:N${footerRow.number + 1}`);
            worksheet.getCell(`L${footerRow.number + 1}`).value = 'Total Amount before Tax';
            worksheet.getCell(`L${footerRow.number + 1}`).font = { bold: true };
            worksheet.getCell(`L${footerRow.number + 1}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.getCell(`O${footerRow.number + 1}`).value = printdata.totalUnitPrice;
            worksheet.getCell(`O${footerRow.number + 1}`).font = { bold: true };


            worksheet.mergeCells(`L${footerRow.number + 2}:N${footerRow.number + 2}`);
            worksheet.getCell(`L${footerRow.number + 2}`).value = 'Add:CGST	';
            worksheet.getCell(`L${footerRow.number + 2}`).font = { bold: true };
            worksheet.getCell(`L${footerRow.number + 2}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.getCell(`O${footerRow.number + 2}`).value = CgstTotalAmt;
            worksheet.getCell(`O${footerRow.number + 2}`).font = { bold: true };

            worksheet.mergeCells(`L${footerRow.number + 3}:N${footerRow.number + 3}`);
            worksheet.getCell(`L${footerRow.number + 3}`).value = 'Add:SGST';
            worksheet.getCell(`L${footerRow.number + 3}`).font = { bold: true };
            worksheet.getCell(`L${footerRow.number + 3}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.getCell(`O${footerRow.number + 3}`).value = SgstTotalAmt;
            worksheet.getCell(`O${footerRow.number + 3}`).font = { bold: true };

            worksheet.mergeCells(`L${footerRow.number + 4}:N${footerRow.number + 4}`);
            worksheet.getCell(`L${footerRow.number + 4}`).value = 'Total Amount Tax	';
            worksheet.getCell(`L${footerRow.number + 4}`).font = { bold: true };
            worksheet.getCell(`L${footerRow.number + 4}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.getCell(`O${footerRow.number + 4}`).value = printdata.totalGstAmount;
            worksheet.getCell(`O${footerRow.number + 4}`).font = { bold: true };

            worksheet.mergeCells(`L${footerRow.number + 5}:N${footerRow.number + 5}`);
            worksheet.getCell(`L${footerRow.number + 5}`).value = 'Total Amount After Tax';
            worksheet.getCell(`L${footerRow.number + 5}`).font = { bold: true };
            worksheet.getCell(`L${footerRow.number + 5}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.getCell(`O${footerRow.number + 5}`).value = printdata.totalAmount;
            worksheet.getCell(`O${footerRow.number + 5}`).font = { bold: true };


            worksheet.mergeCells(`A${footerRow.number + 6}:H${footerRow.number + 6}`);
            worksheet.getCell(`A${footerRow.number + 6}`).value = 'Bank Details';
            worksheet.getCell(`A${footerRow.number + 6}`).font = { bold: true, size: 14 };
            worksheet.getCell(`A${footerRow.number + 6}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`A${footerRow.number + 7}:H${footerRow.number + 7}`);
            worksheet.getCell(`A${footerRow.number + 7}`).value = `Cheque issued in the name of PBMA'S H. V. DESAI EYE HOSPITAL`;
            worksheet.getCell(`A${footerRow.number + 7}`).font = { bold: false, size: 12 };
            worksheet.getCell(`A${footerRow.number + 7}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`A${footerRow.number + 8}:H${footerRow.number + 8}`);
            worksheet.getCell(`A${footerRow.number + 8}`).value = `Bank NEFT : HDFC BANK, Mohammedwadi, Pune Branch`;
            worksheet.getCell(`A${footerRow.number + 8}`).font = { bold: false, size: 12 };
            worksheet.getCell(`A${footerRow.number + 8}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`A${footerRow.number + 9}:H${footerRow.number + 9}`);
            worksheet.getCell(`A${footerRow.number + 9}`).value = `Saving A/c No: 2 4 5 4 1 4 5 0 0 0 0 0 3 2 / IFSC CODE- HDFC0002454`;
            worksheet.getCell(`A${footerRow.number + 9}`).font = { bold: false, size: 12 };
            worksheet.getCell(`A${footerRow.number + 9}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`A${footerRow.number + 10}:H${footerRow.number + 10}`);
            worksheet.getCell(`A${footerRow.number + 10}`).value = `Terms & conditions `;
            worksheet.getCell(`A${footerRow.number + 10}`).font = { bold: false, size: 12 };
            worksheet.getCell(`A${footerRow.number + 10}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`I${footerRow.number + 6}:K${footerRow.number + 8}`);
            worksheet.getCell(`I${footerRow.number + 6}`).value = ' ';

            worksheet.mergeCells(`I${footerRow.number + 9}:K${footerRow.number + 10}`);
            worksheet.getCell(`I${footerRow.number + 9}`).value = `Common Seal`;
            worksheet.getCell(`I${footerRow.number + 9}`).font = { bold: false, size: 12 };
            worksheet.getCell(`I${footerRow.number + 9}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`L${footerRow.number + 6}:O${footerRow.number + 6}`);
            worksheet.getCell(`O${footerRow.number + 6}`).value = 'Ceritified that the particulars given above are true and correct	';
            worksheet.getCell(`O${footerRow.number + 6}`).font = { bold: false, size: 12 };
            worksheet.getCell(`O${footerRow.number + 6}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`L${footerRow.number + 7}:O${footerRow.number + 7}`);
            worksheet.getCell(`O${footerRow.number + 7}`).value = `The Poona Blind Men's Association`;
            worksheet.getCell(`O${footerRow.number + 7}`).font = { bold: true, size: 12 };
            worksheet.getCell(`O${footerRow.number + 7}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`L${footerRow.number + 8}:O${footerRow.number + 10}`);
            worksheet.getCell(`O${footerRow.number + 8}`).value = `Authorised signatory`;
            worksheet.getCell(`O${footerRow.number + 8}`).font = { bold: false, size: 12 };
            worksheet.getCell(`O${footerRow.number + 8}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`A${footerRow.number + 11}:C${footerRow.number + 11}`);
            worksheet.getCell(`A${footerRow.number + 11}`).value = `Declaration `;
            worksheet.getCell(`A${footerRow.number + 11}`).font = { bold: false, size: 10 };
            worksheet.getCell(`A${footerRow.number + 11}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            worksheet.mergeCells(`D${footerRow.number + 11}:O${footerRow.number + 11}`);
            worksheet.getCell(`D${footerRow.number + 11}`).value = `I hereby declare that the goods being purchased from the seller, as per description mentioned above, would be used within Maharashtra. `;
            worksheet.getCell(`D${footerRow.number + 11}`).font = { bold: false, size: 10 };
            worksheet.getCell(`D${footerRow.number + 11}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Purchase_report_export.xlsx`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

            await workbook.xlsx.write(res);


            return res.end();




        } catch (err) {
            console.log(err);
            next(err)
        }
    },

    getGstReport: async (req, res, next) => {
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
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and billdetail.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT 0 as Sel, billdetail.IsGstFiled, billdetail.ID,billdetail.ProductName,billdetail.ProductTypeID,billdetail.ProductTypeName,billdetail.HSNCode,billdetail.UnitPrice,billdetail.Quantity,billdetail.SubTotal,billdetail.DiscountPercentage,billdetail.DiscountAmount,billdetail.GSTPercentage,billdetail.GSTType,billdetail.TotalAmount,billdetail.WholeSale,billdetail.Manual,billdetail.PreOrder,billdetail.BaseBarCode,billdetail.Barcode, billdetail.Status, billdetail.CancelStatus, billdetail.ProductStatus,billdetail.GSTAmount,billdetail.PurchasePrice,billmaster.CompanyID,customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.CompanyID = '${CompanyID}' ${searchString} AND billdetail.Quantity != 0 AND shop.Status = 1 ` + Parem
            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.CompanyID = ${CompanyID}  ${searchString}  ` + Parem)
            let [data] = await mysql2.pool.query(qry);

            let [data2] = await mysql2.pool.query(`select * from billdetail left join billmaster on billmaster.ID = billdetail.billID LEFT JOIN customer ON customer.ID = billmaster.CustomerID LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee WHERE  billdetail.CompanyID = ${CompanyID} ${searchString} ` + Parem);

            let [gstTypes] = await mysql2.pool.query(`select ID, Name, Status, TableName from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
            console.log(err);
            next(err)
        }

    },
    getGstReportExport: async (req, res, next) => {
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalPurchasePrice": 0,
                    "totalProfit": 0
                }], success: true, message: ""
            }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and billdetail.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT 0 as Sel, billdetail.IsGstFiled, billdetail.ID,billdetail.ProductName,billdetail.ProductTypeID,billdetail.ProductTypeName,billdetail.HSNCode,billdetail.UnitPrice,billdetail.Quantity,billdetail.SubTotal,billdetail.DiscountPercentage,billdetail.DiscountAmount,billdetail.GSTPercentage,billdetail.GSTType,billdetail.TotalAmount,billdetail.WholeSale,billdetail.Manual,billdetail.PreOrder,billdetail.BaseBarCode,billdetail.Barcode, billdetail.Status, billdetail.CancelStatus, billdetail.ProductStatus,billdetail.GSTAmount,billdetail.PurchasePrice,billmaster.CompanyID,customer.Name AS CustomerName, customer.MobileNo1 AS CustomerMoblieNo1, customer.GSTNo AS GSTNo, billmaster.PaymentStatus AS PaymentStatus, billmaster.InvoiceNo AS BillInvoiceNo,billmaster.BillDate AS BillDate,billmaster.DeliveryDate AS DeliveryDate, user.Name as EmployeeName, shop.Name as ShopName, shop.AreaName,0 AS Profit , 0 AS ModifyPurchasePrice  FROM billdetail  LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID LEFT JOIN customer ON customer.ID = billmaster.CustomerID  LEFT JOIN shop ON shop.ID = billmaster.ShopID left join user on user.ID = billmaster.Employee  WHERE billdetail.CompanyID = '${CompanyID}' ${searchString} AND billdetail.Quantity != 0 AND shop.Status = 1 ` + Parem

            let [data] = await mysql2.pool.query(qry);

            let [datum] = await mysql2.pool.query(`SELECT SUM(billdetail.Quantity) as totalQty, SUM(billdetail.GSTAmount) as totalGstAmount, SUM(billdetail.TotalAmount) as totalAmount, SUM(billdetail.DiscountAmount) as totalDiscount, SUM(billdetail.SubTotal) as totalUnitPrice  FROM billmaster LEFT JOIN customer ON customer.ID = billmaster.CustomerID left join user on user.ID = billmaster.Employee LEFT JOIN billdetail ON billdetail.BillID = billmaster.ID  LEFT JOIN shop ON shop.ID = billmaster.ShopID WHERE billdetail.CompanyID = ${CompanyID}  ${searchString}  ` + Parem)


            if (data.length) {
                for (let item of data) {
                    // profit calculation
                    item.ModifyPurchasePrice = item.PurchasePrice * item.Quantity;
                    item.Profit = item.SubTotal - (item.PurchasePrice * item.Quantity)
                    response.calculation[0].totalPurchasePrice += item.ModifyPurchasePrice
                    response.calculation[0].totalProfit += item.Profit
                }
            }
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
            console.log(err);
            next(err)
        }

    },
    submitGstFile: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const { GstData } = req.body;

            if (!GstData && GstData.length === 0) {
                return res.send({ message: "Invalid GstData Data" })
            }

            if (GstData) {
                for (let item of GstData) {
                    if (!item.Sel || item.Sel === 0) {
                        return res.send({ message: "Invalid Sel Data" })
                    }
                    // if (!item.IsGstFiled) {
                    //     return res.send({ message: "Invalid IsGstFiled Data" })
                    // }
                    if (item.IsGstFiled !== 0) {
                        return res.send({ message: "Invalid IsGstFiled Data" })
                    }
                    if (!item.ID || item.ID === 0 || item.ID === null || item.ID === undefined) {
                        return res.send({ message: "Invalid ID Data" })
                    }

                    const [fetch] = await mysql2.pool.query(`select * from billdetail where CompanyID = ${CompanyID} and Status = 1 and IsGstFiled = 0 and ID = ${item.ID}`)

                    if (!fetch.length) {
                        return res.send({ message: `bill detail not found from ID :- ${item.ID}` })
                    }

                    const [update] = await mysql2.pool.query(`update billdetail set IsGstFiled = 1 where CompanyID = ${CompanyID} and ID = ${item.ID}`)

                    console.log(connected(` bill detail ID:- ${item.ID} successfully updated !!!`));


                }
            }

            response.data = GstData
            response.message = "data update successfully";

            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    getRewardReport: async (req, res, next) => {
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;


            qry = `select rewardmaster.*, CONCAT(ss.Name, '(', ss.AreaName, ')') AS ShopName, c.Name as CustomerName, billCustomer.Name as BillCustomerName from rewardmaster LEFT JOIN shop AS ss ON ss.ID = rewardmaster.ShopID LEFT JOIN customer AS c ON c.ID = rewardmaster.CustomerID left join billmaster on billmaster.InvoiceNo = rewardmaster.InvoiceNo left join customer as billCustomer on billCustomer.ID = billmaster.CustomerID  where rewardmaster.CompanyID = ${CompanyID} and rewardmaster.Status = 1  ${Parem}`;

            let [data] = await mysql2.pool.query(qry);
            response.data = data
            response.message = "success";
            return res.send(response);

        } catch (err) {
            next(err)
        }

    },
    getRewardBalance: async (req, res, next) => {
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const { RewardCustomerRefID, InvoiceNo } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (!RewardCustomerRefID || RewardCustomerRefID === 0) {
                return res.send({ success: false, message: "Invalid RewardCustomerRefID Data" });
            }
            if (!InvoiceNo) {
                return res.send({ success: false, message: "Invalid InvoiceNo Data" });
            }

            const [fetchCompany] = await mysql2.pool.query(`select companysetting.ID, companysetting.RewardExpiryDate,companysetting.RewardPercentage,companysetting.AppliedReward from companysetting where Status = 1 and ID = ${CompanyID}`);

            if (!fetchCompany.length) {
                return res.send({ success: false, message: "Invalid CompanyID Data" });
            }

            const [CreditBalance] = await mysql2.pool.query(`select SUM(rewardmaster.Amount) as Amount from rewardmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${RewardCustomerRefID} and CreditType='credit' and InvoiceNo != '${InvoiceNo}'`)

            const [DebitBalance] = await mysql2.pool.query(`select SUM(rewardmaster.Amount) as Amount from rewardmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${RewardCustomerRefID} and CreditType='debit'`)

            let Balance = CreditBalance[0]?.Amount - DebitBalance[0]?.Amount || 0;
            if (Balance < 0) {
                Balance = 0
            }
            console.log("RewardBal ===>", Balance);
            console.log("fetchCompany[0].AppliedReward ==== >", fetchCompany[0].AppliedReward);


            response.data = {
                RewardAmount: Balance.toFixed(2),
                RewardPercentage: fetchCompany[0].AppliedReward,
                AppliedRewardAmount: calculateAmount(Balance, fetchCompany[0].AppliedReward)
            }
            response.message = "success";
            return res.send(response);

        } catch (err) {
            next(err)
        }

    },
    sendOtpForAppliedReward: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: ""
            }

            const { RewardCustomerRefID, AppliedRewardAmount, ApplyReward, PaidAmount, PayableAmount, PaymentMode } = req.body;

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (!RewardCustomerRefID || RewardCustomerRefID === 0) {
                return res.send({ success: false, message: "Invalid RewardCustomerRefID Data" });
            }
            if (!AppliedRewardAmount || AppliedRewardAmount <= 0) {
                return res.send({ success: false, message: "Invalid AppliedRewardAmount Data" });
            }

            const [fetchCustomer] = await mysql2.pool.query(`select ID, Name, MobileNo1 from customer where CompanyID = ${CompanyID} and ID = ${RewardCustomerRefID}`);


            if (!fetchCustomer.length) {
                return res.send({ message: "Invalid RewardCustomerRefID Data" })
            }

            if (fetchCustomer[0].MobileNo1 === "" || fetchCustomer[0].MobileNo1 === null) {
                return res.send({ message: "Customer mobile no not found" })
            }

            if (PaymentMode !== "Customer Reward") {
                return res.send({ message: "Invalid PaymentMode Data" })
            }

            if (PaidAmount > AppliedRewardAmount) {
                return res.send({ success: false, message: "Invalid PaidAmount Data" });
            }
            if (PaidAmount > PayableAmount) {
                return res.send({ success: false, message: "Invalid PaidAmount Data" });
            }
            console.log(PaidAmount < 5);

            if (PaidAmount < 5) {
                return res.send({ success: false, message: "You can pay atleast rs 5" });
            }
            if (ApplyReward !== true) {
                return res.send({ success: false, message: "Invalid ApplyReward Data" });
            }

            const datum = {
                RewardCustomerRefID: RewardCustomerRefID,
                otp: generateOtp(4),
                Name: fetchCustomer[0].Name,
                MobileNo: fetchCustomer[0].MobileNo1
            }

            const [update] = await mysql2.pool.query(`update customer set Otp = '${datum.otp}' where CompanyID = ${CompanyID} and ID = ${datum.RewardCustomerRefID}`)
            response.data = {
                ...datum
            }
            response.message = `Your OTP for redeeming a ${PaidAmount} rupees reward is ${datum.otp}`;

            return res.send(response);

        } catch (err) {
            next(err)
        }

    },
    getDiscountSetting: async (req, res, next) => {
        try {
            const response = {
                data: {
                    DiscountType: 'percentage',
                    DiscountValue: 0
                }, success: true, message: ""
            }
            const { Quantity, ProductTypeID, ProductName } = req.body;

            console.log(req.body);

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = await shopID(req.headers) || 0;

            const [fetchDiscount] = await mysql2.pool.query(`select * from discountsetting where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${ShopID} and ProductTypeID = ${ProductTypeID} and ProductName LIKE '%${ProductName}%' order by ID desc limit 1`);


            const rangeDetails = [];


            if (fetchDiscount.length && ProductName.trim().toLowerCase() === fetchDiscount[0].ProductName.trim().toLowerCase()) {
                if (fetchDiscount[0].DiscountType === 'range') {
                    const srv = fetchDiscount[0].DiscountValue.split('/');
                    for (let i = 0; i < srv.length; i += 1) {
                        const elem = srv[i];
                        const rangeDet = {
                            qty: Number(elem.split('_')[0]),
                            type: elem.split('_')[1],
                            discountValue: Number(elem.split('_')[2]),
                        };
                        rangeDetails.push(rangeDet);
                    }
                    const rangeObj = getRangeObject(rangeDetails, Quantity);
                    if (rangeObj) {
                        response.data.DiscountType = rangeObj.type
                        response.data.DiscountValue = rangeObj.discountValue
                    }
                }

                if (fetchDiscount[0].DiscountType !== 'range') {
                    const rangeDet = {
                        qty: Quantity,
                        type: fetchDiscount[0].DiscountType,
                        discountValue: Number(fetchDiscount[0].DiscountValue) || 0,
                    };
                    rangeDetails.push(rangeDet);
                    const rangeObj = getRangeObject(rangeDetails, Quantity);
                    if (rangeObj) {
                        response.data.DiscountType = rangeObj.type
                        response.data.DiscountValue = rangeObj.discountValue
                    }
                }
            }

            response.message = 'data fetch successfully'
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }

    },
    saveDiscountSetting: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: ""
            }
            const { ProductTypeID, ProductName, DiscountType, DiscountValue } = req.body;

            console.log(req.body);

            if (ProductTypeID == null || ProductTypeID === undefined || ProductTypeID === 0) return res.send({ message: "Invalid Query ProductTypeID" })
            if (ProductName == null || ProductName === undefined || ProductName === "") return res.send({ message: "Invalid Query ProductName Data" })
            if (DiscountType == null || DiscountType === undefined) return res.send({ message: "Invalid Query DiscountType" })
            if (DiscountValue == null || DiscountValue === undefined) return res.send({ message: "Invalid Query DiscountValue" })


            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const checkExist = await doesExistDiscoutSetting(CompanyID, ShopID, req.body)

            if (checkExist) {
                return res.send({ success: false, message: `Discount setting already exist from ${ProductName}` });
            }

            const [save] = await mysql2.pool.query(`insert into discountsetting(CompanyID, ShopID, ProductTypeID, ProductName, DiscountType, DiscountValue, Status, CreatedBy, CreatedOn) values(${CompanyID}, ${ShopID}, ${ProductTypeID}, '${ProductName}', '${DiscountType}', '${DiscountValue}', 1, ${LoggedOnUser}, now())`);

            response.message = 'data save successfully'
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }

    },
    updateDiscountSetting: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: ""
            }
            const { ID, ProductTypeID, ProductName, DiscountType, DiscountValue } = req.body;

            console.log(req.body);

            if (ID == null || ID === undefined || ID === 0) return res.send({ message: "Invalid Query ID" })
            if (ProductTypeID == null || ProductTypeID === undefined || ProductTypeID === 0) return res.send({ message: "Invalid Query ProductTypeID" })
            if (ProductName == null || ProductName === undefined || ProductName === "") return res.send({ message: "Invalid Query ProductName Data" })
            if (DiscountType == null || DiscountType === undefined) return res.send({ message: "Invalid Query DiscountType" })
            if (DiscountValue == null || DiscountValue === undefined) return res.send({ message: "Invalid Query DiscountValue" })


            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const [doesExist] = await mysql2.pool.query(`select ID from discountsetting where CompanyID = ${CompanyID} and ShopID = ${ShopID} and Status = 1 and ID = ${ID}`)

            if (!doesExist.length) {
                return res.send({ message: "Discount setting does not exist from provided id" })
            }

            const checkExist = await doesExistDiscoutSettingUpdate(CompanyID, ShopID, ID, req.body)

            if (checkExist) {
                return res.send({ success: false, message: `Discount setting already exist from ${ProductName}` });
            }

            const [update] = await mysql2.pool.query(`update discountsetting set ProductTypeID = ${ProductTypeID}, ProductName = '${ProductName}', DiscountType = '${DiscountType}', DiscountValue = '${DiscountValue}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${ShopID}`);

            response.message = 'data update successfully'
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }

    },
    deleteDiscountSetting: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: ""
            }
            const { ID } = req.body;

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const [doesExist] = await mysql2.pool.query(`select ID from discountsetting where CompanyID = ${CompanyID} and ShopID = ${ShopID} and Status = 1 and ID = ${ID}`)

            if (!doesExist.length) {
                return res.send({ message: "Discount setting does not exist from provided id" })
            }

            const [deleteData] = await mysql2.pool.query(`update discountsetting set Status = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${ShopID}`);

            response.message = 'data delete successfully'
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }

    },
    getDiscountDataByID: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: ""
            }
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const ShopID = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const [fetch] = await mysql2.pool.query(`select * from discountsetting where ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${ShopID}`);

            response.data = fetch
            response.message = 'data fetch successfully'
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }

    },
    getDiscountList: async (req, res, next) => {
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
                shopId = `and discountsetting.ShopID = ${shopid}`
            }

            let qry = `SELECT discountsetting.*, shop.Name AS ShopName, shop.AreaName AS AreaName FROM discountsetting LEFT JOIN shop ON shop.ID = discountsetting.ShopID WHERE  discountsetting.CompanyID = ${CompanyID} and discountsetting.Status = 1  ${shopId}  Order By discountsetting.ID Desc `

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
    searchByFeildDiscountSettig: async (req, res, next) => {
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
                shopId = `and discountsetting.ShopID = ${shopid}`
            }


            let qry = `SELECT discountsetting.*, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM discountsetting LEFT JOIN shop ON shop.ID = discountsetting.ShopID LEFT JOIN user ON user.ID = discountsetting.CreatedBy LEFT JOIN user AS User1 ON User1.ID = discountsetting.UpdatedBy WHERE discountsetting.CompanyID = ${CompanyID} AND discountsetting.Status = 1 AND (discountsetting.ProductName LIKE '${searchQuery}%' ${shopId} OR discountsetting.DiscountType LIKE '%${searchQuery}%' ${shopId} OR discountsetting.DiscountValue LIKE '%${searchQuery}%' ${shopId})`;


            let [data] = await mysql2.pool.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length

            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    barCodeListBySearchStringSR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName, ShopID, CustomerID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            if (ShopID === "" || ShopID === undefined || ShopID === null || ShopID === 0) return res.send({ message: "Invalid Query ShopID Data" })

            if (CustomerID === "" || CustomerID === undefined || CustomerID === null) return res.send({ message: "Invalid Query CustomerID Data" })

            let SearchString = searchString.substring(0, searchString.length - 1) + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, billdetail.ProductName, billdetail.ProductTypeName, billdetail.ProductTypeID, billdetail.UnitPrice, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType,barcodemasternew.* FROM billdetail LEFT JOIN barcodemasternew ON barcodemasternew.BillDetailID = billdetail.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID  WHERE billdetail.ProductTypeName = '${ProductName}' ${shopMode} AND billdetail.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus IN ("Sold", "Not Available", "Pre Order") and billmaster.CustomerID = ${CustomerID} and barcodemasternew.ShopID = ${ShopID}  AND billdetail.Status = 1 and shop.Status = 1  And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let [BillData] = await mysql2.pool.query(qry);
            response.data = BillData;
            response.message = "Success";

            return res.send(response);


        } catch (err) {
            console.log(err);

            next(err)
        }
    },
    productDataByBarCodeNoSR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { Req, ShopMode, ShopID, CustomerID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (Req.SearchBarCode === "" || Req.SearchBarCode === undefined || Req.SearchBarCode === null) return res.send({ message: "Invalid Query Data" })

            if (ShopID === "" || ShopID === undefined || ShopID === null || ShopID === 0) return res.send({ message: "Invalid Query ShopID Data" })

            if (CustomerID === "" || CustomerID === undefined || CustomerID === null) return res.send({ message: "Invalid Query CustomerID Data" })

            let barCode = Req.SearchBarCode;
            let qry = "";
            let shopMode = "";
            if (ShopMode === "false") {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            } else {
                shopMode = " Group By barcodemasternew.ShopID ";
            }

            qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, billdetail.ProductName, billdetail.ProductTypeName, billdetail.ProductTypeID, billdetail.UnitPrice, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType,barcodemasternew.* FROM billdetail LEFT JOIN barcodemasternew ON barcodemasternew.BillDetailID = billdetail.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN billmaster ON billmaster.ID = billdetail.BillID  WHERE barcodemasternew.CurrentStatus IN ("Sold", "Not Available", "Pre Order")  ${shopMode} AND  billmaster.CustomerID = ${CustomerID} and barcodemasternew.Barcode = '${barCode}' and barcodemasternew.ShopID = ${ShopID}  AND billdetail.Status = 1 and shop.Status = 1  And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`;

            let [barCodeData] = await mysql2.pool.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    orderformrequest: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ShopID, ProductStatus } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;


            if (ShopID === "" || ShopID === undefined || ShopID === null || ShopID === 0) return res.send({ message: "Invalid Query ShopID Data" })

            if (ProductStatus === "" || ProductStatus === undefined || ProductStatus === null) return res.send({ message: "Invalid Query ProductStatus Data" })

            Params = ` and orderrequest.ProductStatus = '${ProductStatus}' and ( orderrequest.ShopID = ${ShopID} or orderrequest.OrderRequestShopID = ${ShopID})`

            qry = `select orderrequest.ID, orderrequest.ProductName,orderrequest.ProductTypeID, orderrequest.OrderRequestShopID, orderrequest.ShopID as OrderInvoiceShopID, orderrequest.ProductTypeName, orderrequest.HSNCode, orderrequest.Quantity, 0 as SaleQuantity, orderrequest.ProductStatus, orderrequest.Barcode, orderrequest.BaseBarCode, billmaster.InvoiceNo, customer.Name as CustomerName, customer.MobileNo1 as CustomerMobileNo, CONCAT(ss.Name, '(', ss.AreaName, ')') AS InvoiceShopName, CONCAT(ss2.Name, '(', ss2.AreaName, ')') AS OrderRequestShopName, billdetail.MeasurementID from orderrequest left join billmaster on billmaster.ID = orderrequest.BillMasterID left join customer on customer.ID = billmaster.CustomerID left join shop AS ss on ss.ID = orderrequest.ShopID left join shop AS ss2 on ss2.ID = orderrequest.OrderRequestShopID left join billdetail on billdetail.ID = orderrequest.BillDetailID where orderrequest.CompanyID = ${CompanyID}  ${Params}`;

            let [barCodeData] = await mysql2.pool.query(qry);
            response.data = barCodeData;
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    orderformsubmit: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, saleListData, OrderRequestShopID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (!saleListData) {
                return res.send({ success: false, message: "saleListData not found" });
            }
            if (!Array.isArray(saleListData)) {
                return res.send({ success: false, message: "invalid saleListData" });
            }

            const [fetchOrderRequest] = await mysql2.pool.query(`select * from orderrequest where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID}`);

            if (!fetchOrderRequest.length) {
                return res.send({ success: false, message: "Invalid ID, Order request not found" });
            }

            if (fetchOrderRequest[0].OrderRequestShopID !== shopid) {
                return res.send({ success: false, message: "Please select valid shop" });
            }

            if (fetchOrderRequest[0].ProductStatus !== "Order Request") {
                return res.send({ success: false, message: "You have already process this product" });
            }

            const [update] = await mysql2.pool.query(`update orderrequest set ProductStatus = 'Order Transfer', saleListData = '${JSON.stringify(saleListData)}' where ID = ${ID} and CompanyID = ${CompanyID}`)


            response.message = "Order Transfer successfully";
            response.data = {}
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
}

function getRangeObject(arr, qty) {
    const result = arr.filter((o) => qty >= o.qty && qty <= o.qty);
    return result ? result[0] : null; // or undefined
}
