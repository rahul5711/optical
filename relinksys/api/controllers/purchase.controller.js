const createError = require('http-errors')
const _ = require("lodash")
const { generateBarcode, generateUniqueBarcode, doesExistProduct, shopID, gstDetail, doesExistProduct2, update_c_report_setting, update_c_report, amt_update_c_report, getTotalAmountByBarcode, getProductCountByBarcodeNumber, getLocatedProductCountByBarcodeNumber } = require('../helpers/helper_function')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
let ejs = require("ejs");
let path = require("path");
let pdf = require("html-pdf");
var TinyURL = require('tinyurl');
const clientConfig = require("../helpers/constants");
const { log } = require('console')
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
const ExcelJS = require('exceljs');
var moment = require("moment");
const { json } = require('express');


function isValidDate(dateString) {
    // First check for the pattern
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    // Check the ranges of month and year
    if (year < 1000 || year > 3000 || month == 0 || month > 12) return false;

    var daysInMonth = new Date(year, month, 0).getDate();
    return day > 0 && day <= daysInMonth;
}

function numberToMonth(number) {
    const months = {
        1: "January",
        2: "February",
        3: "March",
        4: "April",
        5: "May",
        6: "June",
        7: "July",
        8: "August",
        9: "September",
        10: "October",
        11: "November",
        12: "December"
    };

    if (months.hasOwnProperty(number)) {
        return months[number];
    } else {
        return "Invalid month number";
    }
}

module.exports = {

    create: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";
            const paymentStatus = "Unpaid"
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                PurchaseMaster,
                PurchaseDetail,
                Charge
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            // if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID !== null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            // if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            const [doesExistInvoiceNo] = await connection.query(`select ID from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }

            let purchaseDetail = JSON.parse(PurchaseDetail).reverse();

            // if (purchaseDetail.length === 0) {
            //     return res.send({ message: "Invalid Query Data purchaseDetail" })
            // }

            const purchase = {
                ID: null,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: shopid,
                PurchaseDate: PurchaseMaster.PurchaseDate ? PurchaseMaster.PurchaseDate : now(),
                PaymentStatus: paymentStatus,
                InvoiceNo: PurchaseMaster.InvoiceNo,
                GSTNo: PurchaseMaster.GSTNo ? PurchaseMaster.GSTNo : '',
                Quantity: PurchaseMaster.Quantity,
                SubTotal: PurchaseMaster.SubTotal,
                DiscountAmount: PurchaseMaster.DiscountAmount,
                GSTAmount: PurchaseMaster.GSTAmount,
                TotalAmount: PurchaseMaster.TotalAmount,
                Status: 1,
                PStatus: 1,
                isGrid: PurchaseMaster.isGrid == true ? 1 : 0,
                DueAmount: PurchaseMaster.DueAmount,
                RoundOff: PurchaseMaster.RoundOff ? Number(PurchaseMaster.RoundOff) : 0
            }

            const supplierId = purchase.SupplierID;

            //  save purchase data
            const [savePurchase] = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,RoundOff,Status,PStatus, isGrid,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},${purchase.RoundOff},1,0,${purchase.isGrid},${purchase.TotalAmount}, ${LoggedOnUser}, '${req.headers.currenttime}')`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            //  console.log("purchaseDetail ===========>", purchaseDetail);
            //  save purchase detail data

            if (purchaseDetail.length) {
                for (const item of purchaseDetail) {
                    const doesProduct = await doesExistProduct(CompanyID, item)

                    // generate unique barcode
                    item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                    // baseBarcode initiated if same product exist or not condition
                    let baseBarCode = 0;
                    if (doesProduct !== 0) {
                        baseBarCode = doesProduct
                    } else {
                        baseBarCode = await generateBarcode(CompanyID, 'SB')
                    }

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, shopid, item.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, item.TotalAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                    const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)


                }
                console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

                //  save barcode

                let [detailDataForBarCode] = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId} and CompanyID = ${CompanyID}`)

                if (detailDataForBarCode.length) {
                    for (const item of detailDataForBarCode) {
                        const barcode = Number(item.BaseBarCode)
                        let count = 0;
                        count = item.Quantity;
                        for (j = 0; j < count; j++) {
                            const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','${req.headers.currenttime}','${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '${req.headers.currenttime}')`)
                        }
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));

            //  save charge

            if (Charge.length) {
                for (const c of Charge) {
                    const [saveCharge] = await connection.query(`insert into purchasecharge (PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${savePurchase.insertId}, '${c.ChargeType}', ${CompanyID}, '${c.Description}', ${c.Price}, ${c.GSTPercentage}, ${c.GSTAmount}, '${c.GSTType}', ${c.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}')`)
                }

                console.log(connected("Charge Data Save SuccessFUlly !!!"));
            }

            const [savePaymentMaster] = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Debit','${req.headers.currenttime}', 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            const [savePaymentDetail] = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    update: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";
            const paymentStatus = "Unpaid"
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const {
                PurchaseMaster,
                PurchaseDetail,
                Charge
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            // if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID === null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            // if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            const [doesExistInvoiceNo] = await connection.query(`select ID from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)


            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }



            const [doesExistSystemID] = await connection.query(`select ID, SystemID from purchasemasternew where Status = 1  and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${PurchaseMaster.ID}`)

            //  console.log("doesExistSystemID =======>", doesExistSystemID);

            if (doesExistSystemID[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            let purchaseDetail = JSON.parse(PurchaseDetail).reverse();

            // if (purchaseDetail.length === 0) {
            //     return res.send({ message: "Invalid Query Data purchaseDetail" })
            // }
            const purchase = {
                ID: PurchaseMaster.ID,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: shopid,
                PaymentStatus: paymentStatus,
                GSTNo: PurchaseMaster.GSTNo ? PurchaseMaster.GSTNo : '',
                Quantity: PurchaseMaster.Quantity,
                SubTotal: PurchaseMaster.SubTotal,
                DiscountAmount: PurchaseMaster.DiscountAmount,
                GSTAmount: PurchaseMaster.GSTAmount,
                TotalAmount: PurchaseMaster.TotalAmount,
                Status: 1,
                PStatus: 1,
                DueAmount: PurchaseMaster.DueAmount,
                RoundOff: PurchaseMaster.RoundOff ? Number(PurchaseMaster.RoundOff) : 0
            }

            const supplierId = purchase.SupplierID;

            const [doesCheckPayment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Vendor' and BillMasterID = ${PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Add Product !!, You have Already Paid Amount of this Invoice` })
            }

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, RoundOff = ${purchase.RoundOff},  UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}', InvoiceNo = '${PurchaseMaster.InvoiceNo}', PurchaseDate = '${PurchaseMaster.PurchaseDate}' where CompanyID = ${CompanyID}  and ShopID = ${shopid} and ID=${purchase.ID}`)

            console.log(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, RoundOff = ${purchase.RoundOff}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' , PurchaseDate = '${PurchaseMaster.PurchaseDate}' and ShopID = ${shopid} and ID=${purchase.ID}`);

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            // add new product

            let shouldUpdatePayment = false

            if (purchaseDetail.length) {
                for (const item of purchaseDetail) {
                    if (item.ID === null) {
                        shouldUpdatePayment = true
                        const doesProduct = await doesExistProduct(CompanyID, item)

                        // generate unique barcode
                        item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                        // baseBarcode initiated if same product exist or not condition
                        let baseBarCode = 0;
                        if (doesProduct !== 0) {
                            baseBarCode = doesProduct
                        } else {
                            baseBarCode = await generateBarcode(CompanyID, 'SB')
                        }

                        // update c report setting

                        const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                        const var_update_c_report = await update_c_report(CompanyID, shopid, item.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                        const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, item.TotalAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                        const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)

                        let [detailDataForBarCode] = await connection.query(
                            `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' and CompanyID = ${CompanyID} ORDER BY ID DESC LIMIT 1`
                        );

                        await Promise.all(
                            detailDataForBarCode.map(async (item) => {
                                const barcode = Number(item.BaseBarCode)
                                let count = 0;
                                count = item.Quantity;
                                for (j = 0; j < count; j++) {
                                    const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','${req.headers.currenttime}','${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '${req.headers.currenttime}')`)
                                }
                            })
                        )


                    }
                }
                console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));
            }

            //  update charges

            if (Charge.length) {
                for (const c of Charge) {
                    if (c.ID === null) {
                        shouldUpdatePayment = true
                        const [saveCharge] = await connection.query(`insert into purchasecharge (PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn) values (${purchase.ID}, '${c.ChargeType}', ${CompanyID}, '${c.Description}', ${c.Price}, ${c.GSTPercentage}, ${c.GSTAmount}, '${c.GSTType}', ${c.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}')`)
                    }

                }
                console.log(connected("Charge Data Save SuccessFUlly !!!"));
            }

            //  update payment

            if (shouldUpdatePayment) {
                const [updatePaymentMaster] = await connection.query(`update paymentmaster set PayableAmount = ${PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

                const [updatePaymentDetail] = await connection.query(`update paymentdetail set BillID = '${PurchaseMaster.InvoiceNo}', Amount = 0 , DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)

                console.log(connected("Payment Update SuccessFUlly !!!"));
            }




            response.message = "data update sucessfully"
            response.data = purchase.ID
            return res.send(response);



        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getPurchaseById: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null, Charge: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} `)

            const [PurchaseDetail] = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${ID} and CompanyID = ${CompanyID}  order by purchasedetailnew.ID desc`)

            const [Charge] = await connection.query(`select * from purchasecharge where PurchaseID = ${ID} and CompanyID = ${CompanyID}`)

            const gst_detail = await gstDetail(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = gst_detail || []
            response.result.PurchaseDetail = PurchaseDetail
            response.result.Charge = Charge
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    list: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;
            let shopId = ``
            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }

            let isGrid = ` `
            Body.isGrid ? Body.isGrid : 0

            if (Body.isGrid && Body.isGrid !== 0) {
                isGrid = ` and purchasemasternew.isGrid = ${Body.isGrid} `
            }

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and supplier.Name != 'PreOrder Supplier' ${isGrid} and purchasemasternew.CompanyID = ${CompanyID} ${shopId} order by purchasemasternew.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    purchaseHistoryBySupplier: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, sumData: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { SupplierID } = req.body

            if (!SupplierID || SupplierID === undefined || SupplierID === null) return res.send({ message: "Invalid Query Data" })

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.SupplierID = ${SupplierID}  order by purchasemasternew.ID desc`

            let [data] = await connection.query(qry);

            let SumQry = `select SUM(purchasemasternew.Quantity) as Quantity, SUM(purchasemasternew.SubTotal) as SubTotal, SUM(purchasemasternew.DiscountAmount) as DiscountAmount, SUM(purchasemasternew.GSTAmount) as GSTAmount, SUM(purchasemasternew.TotalAmount) as TotalAmount , SUM(purchasemasternew.DueAmount) as DueAmount from purchasemasternew  where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.SupplierID = ${SupplierID}  order by purchasemasternew.ID desc`


            let [sumData] = await connection.query(SumQry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.sumData = sumData
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    delete: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, SystemID from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "purchase doesnot exist from this id " })
            }

            if (doesExist[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }


            const [doesExistProduct] = await connection.query(`select ID from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID} and PurchaseID = ${Body.ID}`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await connection.query(`update purchasemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    deleteProduct: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, SystemID, Quantity,PurchaseID, TotalAmount from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            // old software condition
            // if (doesExist[0].SystemID !== "0") {
            //     return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            // }

            const [doesExistProductQty] = await connection.query(`select ID from barcodemasternew where Status = 1 and CompanyID = ${CompanyID} and PurchaseDetailID = ${Body.ID} and CurrentStatus = 'Available'`)

            if (doesExist[0].Quantity !== doesExistProductQty.length) {
                // return res.send({ message: `You have product already sold` })
                return res.send({ message: `You can't delete this product` })
            }

            const [doesCheckPayment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Product !!, You have Already Paid Amount of this Invoice` })
            }




            const [deletePurchasedetail] = await connection.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            const [deleteBarcodeMasterNew] = await connection.query(`update barcodemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where PurchaseDetailID = ${Body.ID} and CompanyID = ${CompanyID} and CurrentStatus = 'Available'`)

            console.log("Barcode Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount}, DueAmount = ${Body.PurchaseMaster.TotalAmount}, RoundOff = ${Body.PurchaseMaster.RoundOff ? Number(Body.PurchaseMaster.RoundOff) : 0}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const [updatePaymentMaster] = await connection.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

            const [updatePaymentDetail] = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)

            const [fetchPurchaseMaster] = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)

            // update c report setting

            const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

            const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, doesExist[0].Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
            const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, doesExist[0].TotalAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    updateProduct: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, SystemID, Quantity, PurchaseID, TotalAmount from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            if (doesExist[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const [doesCheckPayment] = await connection.query(`select ID, PaymentMasterID from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Product !!, You have Already Paid Amount of this Invoice` })
            }


            const [doesExistProductQty] = await connection.query(`select ID from barcodemasternew where Status = 1 and CompanyID = ${CompanyID} and PurchaseDetailID = ${Body.ID} and CurrentStatus = 'Available'`)

            if (doesExist[0].Quantity !== doesExistProductQty.length) {
                return res.send({ message: `You have product already sold` })
            }

            Body.Multiple = 0
            const doesProduct = await doesExistProduct2(CompanyID, Body)

            if (doesProduct !== 0) {
                return res.send({ message: `Product Already Exist With Same Barcode Number, Please Change Purchase Price OR Retail Price` })
            }

            const uniqueBarcode = await generateUniqueBarcode(CompanyID, Body.PurchaseMaster.SupplierID, Body)


            const [updatePurchasedetail] = await connection.query(`update purchasedetailnew set UnitPrice=${Body.UnitPrice}, SubTotal=${Body.SubTotal},DiscountPercentage=${Body.DiscountPercentage},DiscountAmount=${Body.DiscountAmount},GSTPercentage=${Body.GSTPercentage},GSTAmount=${Body.GSTAmount},GSTType='${Body.GSTType}',TotalAmount=${Body.TotalAmount},RetailPrice=${Body.RetailPrice},WholeSalePrice=${Body.WholeSalePrice},BrandType='${Body.BrandType}', UniqueBarcode='${uniqueBarcode}', UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Update SuccessFUlly !!!");


            const [updateBarcode] = await connection.query(`update barcodemasternew set RetailPrice=${Body.RetailPrice},WholeSalePrice=${Body.WholeSalePrice}, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where PurchaseDetailID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Barcode Update SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount},RoundOff = ${Body.PurchaseMaster.RoundOff ? Number(Body.PurchaseMaster.RoundOff) : 0} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const [updatePaymentMaster] = await connection.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

            const [updatePaymentDetail] = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)

            const [fetchPurchaseMaster] = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)

            let totalAmount = Number(Body.TotalAmount) - Number(doesExist[0].TotalAmount)

            const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)


            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data update product sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    deleteCharge: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { Charge: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID, SystemID, PurchaseID, TotalAmount from purchasecharge where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "charge doesnot exist from this id " })
            }

            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })


            const [doesExistPurchaseMaster] = await connection.query(`select ID, SystemID  from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.PurchaseMaster.ID}`)

            if (!doesExistPurchaseMaster.length) {
                return res.send({ message: "purchasemaster doesnot exist from this id " })
            }

            // old software condition
            if (doesExistPurchaseMaster[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const [doesCheckPayment] = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Charge !!, You have Already Paid Amount of this Invoice` })
            }

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount},RoundOff = ${Body.PurchaseMaster.RoundOff ? Number(Body.PurchaseMaster.RoundOff) : 0} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const [updatePaymentMaster] = await connection.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID} and CompanyID = ${CompanyID}`)

            const [updatePaymentDetail] = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID} and CompanyID = ${CompanyID}`)

            const [fetchPurchaseMaster] = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail


            const [deleteCharge] = await connection.query(`update purchasecharge set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Charge Delete SuccessFUlly !!!");

            const [Charge] = await connection.query(`select * from purchasecharge where PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.Charge = Charge;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    purchaseDetailPDF: async (req, res, next) => {
        let connection;
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const printdata = req.body
            const PurchaseMasters = req.body.PurchaseMaster;
            const PurchaseDetail = req.body.PurchaseDetails;
            const PurchaseCharges = req.body.PurchaseCharge;

            printdata.PurchaseMaster = PurchaseMasters
            printdata.PurchaseDetails = PurchaseDetail
            printdata.PurchaseCharge = PurchaseCharges

            const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [supplier] = await connection.query(`select * from supplier where CompanyID = ${CompanyID} and ID = ${PurchaseMasters.SupplierID}`)
            const [billformate] = await connection.query(`select * from billformate where CompanyID = ${CompanyID}`)

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
            printdata.shopdetails = shopdetails[0]
            printdata.companysetting = companysetting[0]


            printdata.shopdetails = shopdetails[0]
            printdata.supplier = supplier[0]
            printdata.companysetting = companysetting[0]

            var fileName = "";
            if (!printdata.companysetting.LogoURL) {
                printdata.LogoURL = clientConfig.appURL + '../assest/no-image.png';
            } else {
                if (CompanyID === 1) {
                    printdata.LogoURL = clientConfig.appURL + 'assest/hvd.jpeg';
                } else {
                    printdata.LogoURL = clientConfig.appURL + printdata.shopdetails.LogoURL;
                }
            }
            // printdata.LogoURL1 = clientConfig.appURL + '../assest/relinksyslogo.png';
            // printdata.web = clientConfig.appURL + '../assest/web.png';
            // printdata.mail = clientConfig.appURL + '../assest/mail.png';
            // printdata.call = clientConfig.appURL + '../assest/call.png';
            // var formatName = "relinksys.ejs";
            var formatName = "PurchasePDF.ejs";
            var file = 'Supplier_Purchase' + "_" + CompanyID + ".pdf";
            fileName = "uploads/" + file;

            console.log(fileName);

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options = {
                        format: 'A4',
                        orientation: 'portrait',
                        type: "pdf"
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
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },

    purchaseRetrunPDF: async (req, res, next) => {
        let connection;
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const printdata = req.body
            const PurchaseMasters = req.body.PurchaseMaster;
            const PurchaseDetail = req.body.PurchaseDetails;
            const PurchaseCharges = req.body.PurchaseCharge;

            printdata.PurchaseMaster = PurchaseMasters
            printdata.PurchaseDetails = PurchaseDetail
            console.log(printdata.PurchaseDetails);
            printdata.PurchaseCharge = PurchaseCharges

            const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [supplier] = await connection.query(`select * from supplier where CompanyID = ${CompanyID} and ID = ${PurchaseMasters.SupplierID}`)
            const [billformate] = await connection.query(`select * from billformate where CompanyID = ${CompanyID}`)

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
            printdata.shopdetails = shopdetails[0]
            printdata.companysetting = companysetting[0]


            printdata.shopdetails = shopdetails[0]
            printdata.supplier = supplier[0]
            printdata.companysetting = companysetting[0]

            var fileName = "";
            if (!printdata.companysetting.LogoURL) {
                printdata.LogoURL = clientConfig.appURL + '../assest/no-image.png';
            } else {
                printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;
            }

            var formatName = "PurchaseRetrunPDF.ejs";
            var file = 'ProductReturn' + "_" + CompanyID + ".pdf";
            fileName = "uploads/" + file;

            console.log(fileName);

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options = {
                        format: 'A4',
                        orientation: 'portrait',
                        type: "pdf"
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
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },

    PrintBarcode: async (req, res, next) => {
        let connection;
        try {
            let bracodeData = req.body
            let modifyBarcode = []

            for (var i = 0; i < bracodeData.Quantity; i++) {
                modifyBarcode.push(bracodeData)
            }

            const printdata = modifyBarcode;

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)

            const [barcodeFormate] = await connection.query(`select * from barcodesetting where CompanyID = ${CompanyID}`)
            const [barcode] = await connection.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and PurchaseDetailID = ${printdata[0].ID}`)
            printdata.barcodeFormate = barcodeFormate[0];
            printdata.MRPHide = printdata.barcodeFormate.MRPHide;
            printdata.taxHide = printdata.barcodeFormate.taxHide;
            printdata.productNameHide = printdata.barcodeFormate.productNameHide;
            printdata.specialCodeHide = printdata.barcodeFormate.specialCodeHide;
            printdata.modelName = printdata.barcodeFormate.modelName;

            printdata.shopdetails = shopdetails[0]
            printdata[0].BarcodeName = shopdetails[0].BarcodeName
            printdata[0].Barcode = barcode[0].Barcode

            printdata[0].ProductUniqueBarcode = printdata[0].UniqueBarcode;

            let ProductFullName = printdata[0].ProductName;
            let ProductBrandName = printdata[0].ProductName.split("/")[1];
            let ProductModelName = printdata[0].ProductName.split("/")[2]?.substr(0, 15);
            printdata[0].ProductBrandName = ProductBrandName;
            printdata[0].ProductModelName = ProductModelName;
            printdata[0].ProductFullName = ProductFullName;

            printdata.CompanyID = CompanyID;
            printdata.CompanyBarcode = companysetting[0].BarCode
            console.log(printdata.CompanyBarcode, 'printdata.CompanyBarcode');

            var file = "barcode" + CompanyID + ".pdf";
            var formatName = "barcode.ejs";
            var appURL = clientConfig.appURL;

            // var appURL = clientConfig.appURL;
            var fileName = "";
            fileName = "uploads/" + file;
            let url = appURL + "/uploads/" + file;
            let updateUrl = url;

            ejs.renderFile(
                path.join(appRoot, "./views/", formatName), { data: printdata },
                (err, data) => {
                    if (err) {
                        res.send(err);
                    } else {
                        let options;

                        if (printdata.CompanyBarcode == 0 || printdata.CompanyBarcode == 2) {
                            options = {
                                //    printdata.CompanyID == 64 only this company ke liye option he
                                height: "1.00in",
                                width: "5.00in",
                                margin: {
                                    top: "0in",
                                    right: "0in",
                                    bottom: "0in",
                                    left: "0in"
                                },
                                timeout: 600000,
                                // "height": "0.70in",
                                // "width": "4.90in",
                            };
                        }

                        else if (printdata.CompanyBarcode == 1 || printdata.CompanyBarcode == 3 || printdata.CompanyBarcode == 8 || printdata.CompanyBarcode == 9) {
                            options = {
                                "height": "0.70in",
                                "width": "4.41in",
                                timeout: 600000,
                            };


                        }

                        else if (printdata.CompanyBarcode == 4) {
                            options = {
                                "height": "25mm",
                                "width": "60mm",
                                timeout: 600000,
                            };
                        }

                        else if (printdata.CompanyBarcode == 6) {
                            options = {
                                "height": "24mm",
                                "width": "36mm",
                                timeout: 600000,
                            };
                        }

                        else if (printdata.CompanyBarcode == 7) {
                            options = {
                                "height": "27mm",
                                "width": "38mm",
                                timeout: 600000,
                            };
                        }

                        console.log(printdata.CompanyBarcode, 'printdata.CompanyBarcode');
                        console.log(options);

                        options.timeout = 540000,  // in milliseconds
                            pdf.create(data, options).toFile(fileName, function (err, data) {
                                if (err) {
                                    console.log(err, 'err');
                                    res.send(err);
                                } else {
                                    res.json(updateUrl);
                                }
                            });

                    }
                }
            );
            return
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },


    AllPrintBarcode: async (req, res, next) => {
        let connection;
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            let printdata = req.body
            console.log(printdata,'printdataprintdataprintdata');
            
            const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
            const [barcodeFormate] = await connection.query(`select * from barcodesetting where CompanyID = ${CompanyID}`)
            const [companySetting] = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [supplier] = await connection.query(`select * from supplier where CompanyID = ${CompanyID} and ID = ${printdata[0].SupplierID}`)

            printdata.forEach(ele => {

                let ProductBrandName, ProductModelName;

                if (ele.ProductTypeName !== 'SUNGLASSES' && ele.ProductTypeName !== 'SUNGLASS' && ele.ProductTypeName !== 'Frames#1') {
                    [ProductBrandName, ProductModelName] = ele.ProductName.split("/").slice(1, 6);
                } else {
                    [ProductBrandName, ProductModelName] = ele.ProductName.split("/").slice(0, 4);
                }

                // ele.ProductFullName = ele.ProductName.split("/").slice(2,6);
                ele.ProductFullName = ele.ProductName;

                if (ProductBrandName !== undefined) {
                    ele.ProductBrandName = ProductBrandName.substring(0, 15)
                } else {
                    ele.ProductBrandName = ProductBrandName
                }
                if (ProductModelName !== undefined) {
                    ele.ProductModelName = ProductModelName.substring(0, 15)
                } else {
                    ele.ProductModelName = ProductModelName
                }
                ele.ProductUniqueBarcode = ele.UniqueBarcode;

                if (ele.BaseBarCode == null) {
                    ele.Barcode = ele.Barcode;
                } else {
                    ele.Barcode = ele.BaseBarCode;
                }

                ele.BarcodeName = shopdetails[0].BarcodeName;
                ele.SupplierName = supplier[0].Name;

            });

            if (printdata.length > 0) {
                const [barcodeFormate] = await connection.query(`select * from barcodesetting where CompanyID = ${CompanyID}`)
                printdata.barcodeFormate = barcodeFormate[0];
                printdata.BillHeader = `${Number(printdata.barcodeFormate.billHeader)}`;
                printdata.BarcodeHeight = `${Number(printdata.barcodeFormate.barcodeHeight)}in`;
                printdata.barcodeWidth = `${Number(printdata.barcodeFormate.barcodeWidth)}in`;
                printdata.barcodePadding = `${Number(printdata.barcodeFormate.barcodePadding)}px`;
                printdata.barcodeMargin = `${Number(printdata.barcodeFormate.barcodeMargin)}px`;
                printdata.barcodeNameFontSize = `${Number(printdata.barcodeFormate.barcodeNameFontSize)}px`;
                printdata.floatLeftSide = printdata.barcodeFormate.floatLeftSide;
                printdata.floatRightSide = printdata.barcodeFormate.floatRightSide;
                printdata.incTaxFontSize = `${Number(printdata.barcodeFormate.incTaxFontSize)}px`;
                printdata.leftWidth = `${Number(printdata.barcodeFormate.leftWidth)}%`;
                printdata.rightWidth = `${Number(printdata.barcodeFormate.rightWidth)}%`;
                printdata.barHeight = `${Number(printdata.barcodeFormate.barHeight)}px`;
                printdata.barWidth = `${Number(printdata.barcodeFormate.barWidth)}px`;
                printdata.barFontSize = `${Number(printdata.barcodeFormate.barFontSize)}px`;
                printdata.barMarginTop = `${Number(printdata.barcodeFormate.barMarginTop)}px`;
                printdata.mrpFontSize = `${Number(printdata.barcodeFormate.mrpFontSize)}px`;
                printdata.mrpLineHeight = `${Number(printdata.barcodeFormate.mrpLineHeight)}px`;
                printdata.productBrandFontSize = `${Number(printdata.barcodeFormate.productBrandFontSize)}px`;
                printdata.productModelFontSize = `${Number(printdata.barcodeFormate.productModelFontSize)}px`;
                printdata.marginBottom = `${Number(printdata.barcodeFormate.marginBottom)}px`;
                printdata.marginLeft = `${Number(printdata.barcodeFormate.marginLeft)}px`;
                printdata.marginRight = `${Number(printdata.barcodeFormate.marginRight)}px`;
                printdata.marginTop = `${Number(printdata.barcodeFormate.marginTop)}px`;
                printdata.paddingBottom = `${Number(printdata.barcodeFormate.paddingBottom)}px`;
                printdata.paddingLeft = `${Number(printdata.barcodeFormate.paddingLeft)}px`;
                printdata.paddingRight = `${Number(printdata.barcodeFormate.paddingRight)}px`;
                printdata.paddingTop = `${Number(printdata.barcodeFormate.paddingTop)}px`;

                printdata.MRPHide = printdata.barcodeFormate.MRPHide;
                printdata.taxHide = printdata.barcodeFormate.taxHide;
                printdata.productNameHide = printdata.barcodeFormate.productNameHide;
                printdata.specialCodeHide = printdata.barcodeFormate.specialCodeHide;
                printdata.modelName = printdata.barcodeFormate.modelName;

                printdata.CompanyID = CompanyID;
                printdata.shopdetails = shopdetails
                printdata.LogoURL = clientConfig.appURL + printdata.shopdetails[0].LogoURL;

                printdata.CompanyBarcode = companySetting[0].BarCode

                let file = "barcode" + CompanyID + ".pdf";
                let formatName = "barcode.ejs";
                let appURL = clientConfig.appURL;
                let fileName = "";
                fileName = "uploads/" + file;
                let url = appURL + "/uploads/" + file;
                let updateUrl = url;
                // TinyURL.shorten(url, function (res) {
                //     updateUrl = res;
                // });

                ejs.renderFile(
                    path.join(appRoot, "./views/", formatName), { data: printdata },
                    async (err, data) => {
                        if (err) {
                            res.send(err);
                        } else {

                            let options;

                            if (printdata.CompanyBarcode == 0 || printdata.CompanyBarcode == 2) {
                                options = {
                                    //    printdata.CompanyID == 64 only this company ke liye option he
                                    height: "1.00in",
                                    width: "5.00in",
                                    margin: {
                                        top: "0in",
                                        right: "0in",
                                        bottom: "0in",
                                        left: "0in"
                                    },
                                    timeout: 600000,
                                    // "height": "0.70in",
                                    // "width": "4.90in",
                                };
                            }

                            else if (printdata.CompanyBarcode == 1 || printdata.CompanyBarcode == 3 || printdata.CompanyBarcode == 8 || printdata.CompanyBarcode == 9) {
                                options = {
                                    "height": "0.70in",
                                    "width": "4.41in",
                                    timeout: 600000,
                                };


                            }

                            else if (printdata.CompanyBarcode == 4) {
                                options = {
                                    "height": "25mm",
                                    "width": "60mm",
                                    timeout: 600000,
                                };
                            }

                            else if (printdata.CompanyBarcode == 6) {
                                options = {
                                    "height": "24mm",
                                    "width": "36mm",
                                    timeout: 600000,
                                };
                            }

                            else if (printdata.CompanyBarcode == 7) {
                                options = {
                                    "height": "27mm",
                                    "width": "38mm",
                                    timeout: 600000,
                                };
                            }

                            pdf.create(data, options).toFile(fileName, function (err, data) {
                                if (err) {
                                    console.log(err, 'err');
                                    res.send(err);
                                } else {
                                    res.json(updateUrl);
                                }
                            });
                        }
                    }
                );
                return
            }
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },




    searchByFeild: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shopId = ``
            let isGrid = ` `
            Body.isGrid ? Body.isGrid : 0
            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }
            if (Body.isGrid && Body.isGrid !== 0) {
                isGrid = ` and purchasemasternew.isGrid = ${Body.isGrid} `
            }


            let qry = `select purchasemasternew.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and supplier.Name != 'PreOrder Supplier' and purchasemasternew.CompanyID = ${CompanyID} ${shopId} ${isGrid} and purchasemasternew.InvoiceNo like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and supplier.Name != 'PreOrder Supplier' and purchasemasternew.CompanyID = ${CompanyID} ${shopId} ${isGrid}  and supplier.Name like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and supplier.Name != 'PreOrder Supplier'  and purchasemasternew.CompanyID = ${CompanyID} ${shopId} ${isGrid}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    paymentHistory: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, InvoiceNo } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })
            if (InvoiceNo === null || InvoiceNo === undefined) return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT paymentdetail.*, purchasemasternew.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN purchasemasternew ON purchasemasternew.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType = 'Vendor' AND purchasemasternew.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and purchasemasternew.CompanyID = ${CompanyID}`
            // and purchasemasternew.ShopID = ${shopid}

            let [data] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    barCodeListBySearchString: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString.substring(0, searchString.length - 1) + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, barcodemasternew.*, purchasemasternew.SupplierID FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1  and shop.Status = 1   And barcodemasternew.CompanyID = ${CompanyID} GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            console.log(qry);
            let [purchaseData] = await connection.query(qry);
            response.data = purchaseData;
            response.message = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    productDataByBarCodeNo: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { Req, PreOrder, ShopMode } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Req.SearchBarCode === "" || Req.SearchBarCode === undefined || Req.SearchBarCode === null) return res.send({ message: "Invalid Query Data" })

            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                let searchParams = ``
                if (Req?.searchString !== null && Req?.searchString !== "" && Req?.searchString !== undefined) {
                    searchParams = ` and purchasedetailnew.ProductName = '${Req.searchString}' `
                }

                if (ShopMode === "false") {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID Left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE CurrentStatus = "Available" AND barcodemasternew.Barcode = '${barCode}' ${searchParams} and purchasedetailnew.Status = 1 and barcodemasternew.Status = 1  and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = ${CompanyID} ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.Barcode = '${barCode}' and PurchaseDetail.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = ${CompanyID}`;
            }

            let [barCodeData] = await connection.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    transferProduct: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { ProductName, Barcode, BarCodeCount, TransferCount, Remark, ToShopID, TransferFromShop } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const TransferStatus = "Transfer Initiated";
            const AcceptanceCode = Math.floor(100000 + Math.random() * 900000);  //Math.floor(Math.random() * 100000000);

            if (ProductName === "" || ProductName === undefined || ProductName === null) return res.send({ message: "Invalid Query Data" })
            if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
            if (BarCodeCount === "" || BarCodeCount === undefined || BarCodeCount === 0) return res.send({ message: "Invalid Query Data" })
            if (TransferCount === "" || TransferCount === undefined || TransferCount === 0) return res.send({ message: "Invalid Query Data" })
            if (ToShopID === "" || ToShopID === undefined || ToShopID === null) return res.send({ message: "Invalid Query Data" })
            if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })

            if (shopid !== TransferFromShop) {
                return res.send({ message: "Invalid TransferFromShop Data" })
            }
            if (shopid === ToShopID) {
                return res.send({ message: "Invalid ToShopID Data" })
            }

            if (!(BarCodeCount >= TransferCount)) {
                return res.send({ message: `You Can't Transfer More Than ${BarCodeCount}` })
            }

            let qry = `insert into transfermaster ( CompanyID, ProductName, BarCode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop, AcceptanceCode, DateStarted, TransferStatus, CreatedBy, CreatedOn) values (${CompanyID}, '${ProductName}', '${Barcode}', ${BarCodeCount}, ${TransferCount},  '${Remark}',  ${ToShopID},${TransferFromShop}, '${AcceptanceCode}', now(),  '${TransferStatus}',${LoggedOnUser}, now())`;

            let [xferData] = await connection.query(qry);
            let xferID = xferData.insertId;

            let [selectedRows] = await connection.query(`
                SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CurrentStatus = "Available" and barcodemasternew.Status = 1  AND barcodemasternew.ShopID = ${TransferFromShop} AND barcodemasternew.Barcode = '${Barcode}' AND barcodemasternew.PreOrder = '0' and CONCAT(purchasedetailnew.ProductTypeName,"/",purchasedetailnew.ProductName ) = '${ProductName}' and barcodemasternew.CompanyID =${CompanyID} LIMIT ${TransferCount}`
            );

            console.log("transferProduct ====> ", selectedRows);

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await connection.query(
                        `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Transfer Pending', TransferStatus = 'Transfer Pending', TransferToShop=${ToShopID}, UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.RefID = 0 and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let [xferList] = await connection.query(qry1);


            // update c report setting

            const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

            const var_update_c_report = await update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, TransferCount, 0, 0, req.headers.currenttime)

            const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)
            console.log(totalAmount, " ===== > transferProduct");
            const var_amt_update_c_report = await amt_update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(TransferCount) * Number(totalAmount), 0, 0, req.headers.currenttime)

            response.data = xferList;
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    acceptTransfer: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, TransferFromShop, TransferToShop, Remark, AcceptanceCode } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const TransferStatus = "Transfer Completed";
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })
            if (TransferToShop === "" || TransferToShop === undefined || TransferToShop === null) return res.send({ message: "Invalid Query Data" })
            if (AcceptanceCode === "" || AcceptanceCode === undefined || AcceptanceCode === null || AcceptanceCode.trim() === "") return res.send({ message: "Invalid Query Data" })


            const [doesExist] = await connection.query(`select * from transfermaster where ID = ${ID} and AcceptanceCode  = '${AcceptanceCode}' and CompanyID = ${CompanyID} and RefID = 0 and TransferStatus = 'Transfer Initiated'`)

            if (!doesExist.length) {
                return res.send({ success: true, message: `Invalid AcceptanceCode` })
            }

            let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID} and RefID = 0 and AcceptanceCode = '${AcceptanceCode}' and CompanyID = ${CompanyID}`;

            let [xferData] = await connection.query(qry);
            let xferID = xferData.insertId;

            let [selectedRows] = await connection.query(
                `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and Status = 1 and CompanyID =${CompanyID}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await connection.query(
                        `UPDATE barcodemasternew SET ShopID = ${TransferToShop}, CurrentStatus = 'Available', TransferStatus = 'Available', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.RefID = 0 and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let [xferList] = await connection.query(qry1);
            response.data = xferList;

            // update c report setting

            const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

            const var_update_c_report = await update_c_report(CompanyID, doesExist[0].TransferToShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, doesExist[0].TransferCount, req.headers.currenttime)

            const totalAmount = await getTotalAmountByBarcode(CompanyID, doesExist[0].BarCode)
            console.log(totalAmount, " ===== > transferProduct");
            const var_amt_update_c_report = await amt_update_c_report(CompanyID, doesExist[0].TransferToShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(doesExist[0].TransferCount) * Number(totalAmount), req.headers.currenttime)
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    cancelTransfer: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, TransferFromShop, Remark } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const TransferStatus = "Transfer Cancelled";
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })


            const [doesExist] = await connection.query(`select * from transfermaster where ID = ${ID} and CompanyID = ${CompanyID} and TransferStatus = 'Transfer Initiated'`)

            if (!doesExist.length) {
                return res.send({ success: true, message: `Invalid Query` })
            }

            let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID} and RefID = 0 and CompanyID = ${CompanyID}`;

            let [xferData] = await connection.query(qry);
            let xferID = xferData.insertId;

            let [selectedRows] = await connection.query(
                `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and CompanyID =${CompanyID} and Status = 1`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await connection.query(
                        `UPDATE barcodemasternew SET TransferID= 0, CurrentStatus = 'Available', TransferStatus = 'Transfer Cancelled', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.RefID = 0 and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let [xferList] = await connection.query(qry1);
            response.data = xferList;

            // update c report setting

            const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

            const var_update_c_report = await update_c_report(CompanyID, doesExist[0].TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, doesExist[0].TransferCount, 0, req.headers.currenttime)

            const totalAmount = await getTotalAmountByBarcode(CompanyID, doesExist[0].BarCode)

            const var_amt_update_c_report = await amt_update_c_report(CompanyID, doesExist[0].TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(doesExist[0].TransferCount) * Number(totalAmount), 0, req.headers.currenttime)

            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    getTransferList: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const { ID, currentPage, itemsPerPage } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let shop = ``

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            if (ID === "" || ID === null || ID === undefined) {
                shop = shopid
            } else {
                shop = ID
            }

            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.RefID = 0 and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${shop} or transfermaster.TransferToShop = ${shop}) Order By transfermaster.ID Desc`;

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.data = data;
            response.count = count.length
            response.success = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getproductTransferReport: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, calculation: [{
                    "totalQty": 0
                }], success: true, message: ""
            }
            let { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            // Parem = `and DATE_FORMAT(transfermaster.DateStarted,"%Y-%m-%d") between '2023-01-05' and '2023-01-05'`

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and transfermaster.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, shop.AreaName AS AreaName, ShopTo.AreaName AS ToAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID}  ${searchString} ` + Parem + ` Order By transfermaster.ID Desc`;

            let [data] = await connection.query(qry);

            let [datum] = await connection.query(`SELECT SUM(transfermaster.TransferCount) as totalQty FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID}  ${searchString} ` + Parem + ` Order By transfermaster.ID Desc`)

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0

            response.data = data;
            response.success = true;
            response.message = 'Success';

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    transferProductPDF: async (req, res, next) => {
        let connection;
        try {
            var printdata = req.body;
            printdata.TXdata = printdata;
            var PassNo = Math.trunc(Math.random() * 10000).toString();
            printdata.PassNo = PassNo;

            printdata.forEach(e => {
                let pro = e.ProductName.replace(/\//g, " ");
                e.ProductName = pro;
            });
            var fileName = "";
            var file = "TransferProduct" + "_" + printdata[0].CompanyID + ".pdf";
            var formatName = "TransferProduct.ejs";
            // var appURL = "http://navient.in:50060/";
            fileName = "uploads/" + file;

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
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    bulkTransferProductPDF: async (req, res, next) => {
        let connection;
        try {
            var printdata = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            printdata.TXdata = JSON.parse(printdata.xDetail)
            printdata.TXdata.forEach((t) => {
                t.DateStarted = moment(t.DateStarted).format('DD-MM-YYYY hh:mm:ss A')
            })

            const [TransferFromShop] = await connection.query(`select * from shop where ID = ${printdata.xMaster.TransferFromShop}`)
            const [TransferToShop] = await connection.query(`select * from shop where ID = ${printdata.xMaster.TransferToShop}`)

            printdata.xMaster.TransferFromShop = TransferFromShop[0].Name
            printdata.xMaster.TransferToShop = TransferToShop[0].Name

            printdata.MXdata = printdata.xMaster

            var fileName = "";
            var file = "TransferProduct" + "_" + printdata.MXdata.InvoiceNo + "_" + printdata.MXdata.CompanyID + ".pdf";
            var formatName = "TransferProductBulk.ejs";
            // var appURL = "http://navient.in:50060/";
            fileName = "uploads/" + file;

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
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    // bulk transfer

    bulkTransferProduct: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            let { xMaster, xDetail } = req.body;
            const x_Detail = JSON.parse(xDetail);
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            xMaster.TransferStatus = "Transfer Initiated";
            xMaster.AcceptanceCode = Math.floor(100000 + Math.random() * 900000);
            xMaster.InvoiceNo = Math.floor(100000 + Math.random() * 900000);

            if (!x_Detail.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.Quantity === "" || xMaster.Quantity === undefined || xMaster.Quantity === 0) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (shopid !== xMaster.TransferFromShop) {
                return res.send({ message: "Invalid TransferFromShop Data" })
            }
            if (shopid === xMaster.TransferToShop) {
                return res.send({ message: "Invalid TransferToShop Data" })
            }

            if (x_Detail) {
                for (let x of x_Detail) {
                    const { ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;
                    if (ProductName === "" || ProductName === undefined || ProductName === null) return res.send({ message: "Invalid Query Data" })
                    if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
                    if (BarCodeCount === "" || BarCodeCount === undefined || BarCodeCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferCount === "" || TransferCount === undefined || TransferCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferToShop === "" || TransferToShop === undefined || TransferToShop === null) return res.send({ message: "Invalid Query Data" })
                    if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })
                    if (shopid !== TransferFromShop) {
                        return res.send({ message: "Invalid TransferFromShop Data" })
                    }
                    if (shopid === TransferToShop) {
                        return res.send({ message: "Invalid TransferToShop Data" })
                    }
                    if (xMaster.TransferToShop !== TransferToShop) {
                        return res.send({ message: "Invalid TransferToShop Data" })
                    }
                    if (!(BarCodeCount >= TransferCount)) {
                        return res.send({ message: `You Can't Transfer More Than ${BarCodeCount}` })
                    }
                }
            }


            let [saveTransfer] = await connection.query(`insert into transfer(CompanyID,Quantity,InvoiceNo, Remark, TransferToShop, TransferFromShop, AcceptanceCode, TransferStatus, Status, CreatedBy, CreatedOn) values (${CompanyID}, ${xMaster.Quantity}, '${xMaster.InvoiceNo}', '${xMaster.Remark}',${xMaster.TransferToShop},${xMaster.TransferFromShop}, '${xMaster.AcceptanceCode}','${xMaster.TransferStatus}' ,1,${LoggedOnUser}, now())`)

            let RefID = saveTransfer.insertId;

            if (x_Detail) {
                for (let x of x_Detail) {

                    const { ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;
                    let qry = `insert into transfermaster ( CompanyID,RefID, ProductName, BarCode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop, AcceptanceCode, DateStarted, TransferStatus, CreatedBy, CreatedOn) values (${CompanyID},${RefID}, '${ProductName}', '${Barcode}', ${BarCodeCount}, ${TransferCount},  '${Remark}',${TransferToShop},${TransferFromShop}, '${xMaster.AcceptanceCode}', now(),  '${xMaster.TransferStatus}',${LoggedOnUser}, now())`;

                    let [xferData] = await connection.query(qry);

                    let xferID = xferData.insertId;

                    let [selectedRows] = await connection.query(`
                        SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CurrentStatus = "Available" and barcodemasternew.Status = 1  AND barcodemasternew.ShopID = ${TransferFromShop} AND barcodemasternew.Barcode = '${Barcode}' AND barcodemasternew.PreOrder = '0' and CONCAT(purchasedetailnew.ProductTypeName,"/",purchasedetailnew.ProductName ) = '${ProductName}' and barcodemasternew.CompanyID =${CompanyID} LIMIT ${TransferCount}`
                    );

                    console.log("transferProduct ====> ", selectedRows);

                    if (selectedRows) {
                        for (let ele of selectedRows) {
                            await connection.query(
                                `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Transfer Pending', TransferStatus = 'Transfer Pending', TransferToShop=${TransferToShop}, UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                            );
                        }

                    }

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, TransferCount, 0, 0, req.headers.currenttime)

                    const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)
                    console.log(totalAmount, " ===== > transferProduct");
                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(TransferCount) * Number(totalAmount), 0, 0, req.headers.currenttime)

                }
            }
            response.data = { RefID }
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    bulkTransferProductList: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const { ID, currentPage, itemsPerPage } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            qry = `SELECT transfer.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName, shop.AreaName as FromAreaName, user.Name AS CreatedByUser, CASE WHEN transfer.TransferFromShop = ${shopid} THEN true ELSE false END AS is_cancel, CASE WHEN transfer.TransferToShop = ${shopid} THEN true ELSE false END AS is_accept FROM transfer LEFT JOIN shop ON shop.ID = transfer.TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = transfer.TransferToShop LEFT JOIN user ON user.ID = transfer.CreatedBy WHERE transfer.CompanyID = ${CompanyID} AND transfer.TransferStatus = 'Transfer Initiated' and (transfer.TransferFromShop = ${shopid} or transfer.TransferToShop = ${shopid}) ORDER BY transfer.ID DESC`;

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.data = data;
            response.count = count.length
            response.success = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    bulkTransferProductByID: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const { ID } = req.body;
            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let [master] = await connection.query(`select * from transfer where CompanyID = ${CompanyID} and ID = ${ID}`);
            if (!master.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName, shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser, transfermaster.BarCode AS Barcode  , CASE WHEN transfermaster.TransferFromShop = ${shopid} THEN true ELSE false END AS is_cancel, CASE WHEN transfermaster.TransferToShop = ${shopid} THEN true ELSE false END AS is_accept FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} AND transfermaster.RefID != 0 AND transfermaster.TransferStatus = 'Transfer Initiated' AND transfermaster.RefID = ${ID}`;

            let [data] = await connection.query(qry);

            response.data = {
                data: data,
                master: master
            };
            response.success = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    bulkTransferProductCancel: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            let { xMaster, xDetail } = req.body;
            const x_Detail = JSON.parse(xDetail);
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let TransferStatus = "Transfer Cancelled";

            if (!x_Detail.length || x_Detail.length > 1) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.Quantity === "" || xMaster.Quantity === undefined) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.ID === "" || xMaster.ID === undefined || xMaster.ID === null) return res.send({ message: "Invalid Query Data" })
            if (shopid !== xMaster.TransferFromShop) {
                return res.send({ message: "Invalid TransferFromShop Data" })
            }
            let [master] = await connection.query(`select * from transfer where CompanyID = ${CompanyID} and ID = ${xMaster.ID}`);
            if (!master.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (master[0].TransferStatus !== 'Transfer Initiated') {
                return res.send({ message: "Invalid Query Data" })
            }
            if (master[0].Quantity === xMaster.Quantity) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (x_Detail) {
                for (let x of x_Detail) {
                    const { ID, ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;
                    if (ID === "" || ID === undefined || ID === null || ID === 0) return res.send({ message: "Invalid Query Data" })
                    if (ProductName === "" || ProductName === undefined || ProductName === null) return res.send({ message: "Invalid Query Data" })
                    if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
                    if (BarCodeCount === "" || BarCodeCount === undefined || BarCodeCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferCount === "" || TransferCount === undefined || TransferCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferToShop === "" || TransferToShop === undefined || TransferToShop === null) return res.send({ message: "Invalid Query Data" })
                    if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })
                    if (shopid !== TransferFromShop) {
                        return res.send({ message: "Invalid TransferFromShop Data" })
                    }
                }
            }



            if (x_Detail) {
                for (let x of x_Detail) {

                    const { ID, ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;

                    let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID} and RefID = ${xMaster.ID} and CompanyID = ${CompanyID}`;

                    let [xferData] = await connection.query(qry);
                    let xferID = xferData.insertId || ID;

                    let [selectedRows] = await connection.query(
                        `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and CompanyID =${CompanyID} and Status = 1`
                    );

                    console.log("transferProduct ====> ", selectedRows);

                    if (selectedRows) {
                        for (let ele of selectedRows) {
                            await connection.query(
                                `UPDATE barcodemasternew SET TransferID= 0, CurrentStatus = 'Available', TransferStatus = 'Transfer Cancelled', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                            );
                        }

                    }

                    // update c report setting

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, TransferCount, 0, req.headers.currenttime)

                    const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)

                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(TransferCount) * Number(totalAmount), 0, req.headers.currenttime)

                }
            }
            let [data] = await connection.query(`SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName, shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser, CASE WHEN transfermaster.TransferFromShop = ${shopid} THEN true ELSE false END AS is_cancel, CASE WHEN transfermaster.TransferToShop = ${shopid} THEN true ELSE false END AS is_accept FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} AND transfermaster.RefID != 0 AND transfermaster.TransferStatus = 'Transfer Initiated' AND transfermaster.RefID = ${xMaster.ID}`);
            response.data = {
                data: data,
                master: master
            }
            let masterStatus = `Transfer Initiated`
            if (data.length === 0) {
                masterStatus = `Transfer Cancelled`
            }

            let [updateTransfer] = await connection.query(`update transfer set Quantity = ${xMaster.Quantity}, TransferStatus = '${masterStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where CompanyID = ${CompanyID} and ID = ${xMaster.ID}`)

            response.message = "Success";
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    bulkTransferProductUpdate: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            let { xMaster, xDetail } = req.body;
            const x_Detail = JSON.parse(xDetail);
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let TransferStatus = "Transfer Cancelled";

            if (!x_Detail.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.Quantity === "" || xMaster.Quantity === undefined || xMaster.Quantity === 0) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.ID === "" || xMaster.ID === undefined || xMaster.ID === null) return res.send({ message: "Invalid Query Data" })
            if (shopid !== xMaster.TransferFromShop) {
                return res.send({ message: "Invalid TransferFromShop Data" })
            }
            let [master] = await connection.query(`select * from transfer where CompanyID = ${CompanyID} and ID = ${xMaster.ID}`);
            if (!master.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (master[0].TransferStatus !== 'Transfer Initiated') {
                return res.send({ message: "Invalid Query Data" })
            }
            if (master[0].Quantity === xMaster.Quantity) {
                return res.send({ message: "Invalid Query Data" })
            }

            if (x_Detail) {
                for (let x of x_Detail) {
                    const { ID, ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;
                    if (ProductName === "" || ProductName === undefined || ProductName === null) return res.send({ message: "Invalid Query Data" })
                    if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
                    if (BarCodeCount === "" || BarCodeCount === undefined || BarCodeCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferCount === "" || TransferCount === undefined || TransferCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferToShop === "" || TransferToShop === undefined || TransferToShop === null) return res.send({ message: "Invalid Query Data" })
                    if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })
                    if (shopid !== TransferFromShop) {
                        return res.send({ message: "Invalid TransferFromShop Data" })
                    }
                    if (shopid === TransferToShop) {
                        return res.send({ message: "Invalid TransferToShop Data" })
                    }
                    if (xMaster.TransferToShop !== TransferToShop) {
                        return res.send({ message: "Invalid TransferToShop Data" })
                    }
                    if (!(BarCodeCount >= TransferCount)) {
                        return res.send({ message: `You Can't Transfer More Than ${BarCodeCount}` })
                    }
                }
            }


            if (x_Detail) {
                for (let x of x_Detail) {
                    const { ID, ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;
                    if (ID === null) {
                        let qry = `insert into transfermaster ( CompanyID,RefID, ProductName, BarCode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop, AcceptanceCode, DateStarted, TransferStatus, CreatedBy, CreatedOn) values (${CompanyID},${xMaster.ID}, '${ProductName}', '${Barcode}', ${BarCodeCount}, ${TransferCount},  '${Remark}',${TransferToShop},${TransferFromShop}, '${xMaster.AcceptanceCode}', now(),  '${xMaster.TransferStatus}',${LoggedOnUser}, now())`;

                        let [xferData] = await connection.query(qry);

                        let xferID = xferData.insertId;

                        let [selectedRows] = await connection.query(`
                            SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CurrentStatus = "Available" and barcodemasternew.Status = 1  AND barcodemasternew.ShopID = ${TransferFromShop} AND barcodemasternew.Barcode = '${Barcode}' AND barcodemasternew.PreOrder = '0' and CONCAT(purchasedetailnew.ProductTypeName,"/",purchasedetailnew.ProductName ) = '${ProductName}' and barcodemasternew.CompanyID =${CompanyID} LIMIT ${TransferCount}`
                        );

                        console.log("transferProduct ====> ", selectedRows);

                        if (selectedRows) {
                            for (let ele of selectedRows) {
                                await connection.query(
                                    `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Transfer Pending', TransferStatus = 'Transfer Pending', TransferToShop=${TransferToShop}, UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                                );
                            }

                        }

                        // update c report setting

                        const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

                        const var_update_c_report = await update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, TransferCount, 0, 0, req.headers.currenttime)

                        const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)
                        console.log(totalAmount, " ===== > transferProduct");
                        const var_amt_update_c_report = await amt_update_c_report(CompanyID, TransferFromShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(TransferCount) * Number(totalAmount), 0, 0, req.headers.currenttime)
                    }
                }
            }
            let [data] = await connection.query(`SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName, shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser, CASE WHEN transfermaster.TransferFromShop = ${shopid} THEN true ELSE false END AS is_cancel, CASE WHEN transfermaster.TransferToShop = ${shopid} THEN true ELSE false END AS is_accept FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} AND transfermaster.RefID != 0 AND transfermaster.TransferStatus = 'Transfer Initiated' AND transfermaster.RefID = ${xMaster.ID}`);
            response.data = {
                data: data,
                master: master
            }

            let [updateTransfer] = await connection.query(`update transfer set Quantity = ${xMaster.Quantity}, UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where CompanyID = ${CompanyID} and ID = ${xMaster.ID}`)

            response.message = "Success";
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    bulkTransferProductAccept: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            let { xMaster, xDetail } = req.body;
            const x_Detail = JSON.parse(xDetail);
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let TransferStatus = "Transfer Completed";

            if (!x_Detail.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.Quantity === "" || xMaster.Quantity === undefined || xMaster.Quantity === 0) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.ID === "" || xMaster.ID === undefined || xMaster.ID === null) return res.send({ message: "Invalid Query Data" })
            if (shopid !== xMaster.TransferToShop) {
                return res.send({ message: "Invalid TransferToShop Data" })
            }
            let [master] = await connection.query(`select * from transfer where CompanyID = ${CompanyID} and AcceptanceCode  = '${xMaster.AcceptanceCode}' and TransferStatus = 'Transfer Initiated' and ID = ${xMaster.ID}`);
            if (!master.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (master[0].TransferStatus !== 'Transfer Initiated') {
                return res.send({ message: "Invalid Query Data" })
            }
            if (master[0].Quantity !== xMaster.Quantity) {
                return res.send({ message: "Invalid Query Data11" })
            }

            if (x_Detail) {
                for (let x of x_Detail) {
                    const { ID, ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop } = x;
                    if (ID === "" || ID === undefined || ID === null || ID === 0) return res.send({ message: "Invalid Query Data" })
                    if (ProductName === "" || ProductName === undefined || ProductName === null) return res.send({ message: "Invalid Query Data" })
                    if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
                    if (BarCodeCount === "" || BarCodeCount === undefined || BarCodeCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferCount === "" || TransferCount === undefined || TransferCount === 0) return res.send({ message: "Invalid Query Data" })
                    if (TransferToShop === "" || TransferToShop === undefined || TransferToShop === null) return res.send({ message: "Invalid Query Data" })
                    if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })
                    if (shopid !== TransferToShop) {
                        return res.send({ message: "Invalid TransferToShop Data" })
                    }
                }
            }


            let [updateTransfer] = await connection.query(`update transfer set TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now() where CompanyID = ${CompanyID} and ID = ${xMaster.ID}`)

            if (x_Detail) {
                for (let x of x_Detail) {

                    const { ID, ProductName, Barcode, BarCodeCount, TransferCount, Remark, TransferToShop, TransferFromShop, AcceptanceCode } = x;

                    let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID} and RefID = ${xMaster.ID} and AcceptanceCode = '${AcceptanceCode}'`;

                    let [xferData] = await connection.query(qry);
                    let xferID = xferData.insertId || ID;

                    let [selectedRows] = await connection.query(
                        `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and Status = 1 and CompanyID =${CompanyID}`
                    );

                    console.log("transferProduct ====> ", selectedRows);

                    if (selectedRows) {
                        for (let ele of selectedRows) {
                            await connection.query(
                                `UPDATE barcodemasternew SET ShopID = ${TransferToShop}, CurrentStatus = 'Available', TransferStatus = 'Available', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID} and Status = 1 and CompanyID = ${CompanyID}`
                            );
                        }

                    }

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, TransferFromShop, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, TransferToShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, TransferCount, req.headers.currenttime)

                    const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)
                    console.log(totalAmount, " ===== > transferProduct");
                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, TransferToShop, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, Number(TransferCount) * Number(totalAmount), req.headers.currenttime)

                }
            }
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    // search

    barcodeDataByBarcodeNo: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const { Barcode, mode, ShopMode, searchString } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let shopMode = ``;
            let mode1 = ``;
            let searchParam = ``;

            if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })

            if (searchString !== null && searchString !== "" && searchString !== undefined) {
                searchParam = ` and purchasedetailnew.ProductName = '${searchString}' `
            }

            if (mode === 'search') {
                mode1 = `And barcodemasternew.Barcode = '${Barcode}'`;

            }
            // else {
            //     mode1 = `And barcodemasternew.PurchaseDetailID = '${PurchaseDetailID}'`;
            // }

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = `And barcodemasternew.ShopID = '${shopid}'`;
            }

            qry = `SELECT barcodemasternew.* , company.Name AS CompanyName, shop.Name AS ShopName, shop.AreaName AS AreaName, shop.BarcodeName AS BarcodeShopName, purchasedetailnew.ProductName , purchasedetailnew.ProductTypeName, purchasedetailnew.BaseBarCode AS BarCode, purchasedetailnew.UniqueBarcode, purchasedetailnew.UnitPrice, purchasedetailnew.ProductName, purchasedetailnew.Quantity ,purchasemasternew.InvoiceNo,supplier.Name AS SupplierName   FROM barcodemasternew LEFT JOIN company ON company.ID = barcodemasternew.CompanyID LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE barcodemasternew.CurrentStatus != 'Pre Order' and  purchasedetailnew.Status = 1 AND barcodemasternew.CompanyID = ${CompanyID}  ${shopMode} ${searchParam} ${mode1}`;

            let [barcodelist] = await connection.query(qry);
            response.data = barcodelist;
            response.message = "success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    barCodeListBySearchStringSearch: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString.substring(0, searchString.length - 1) + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1 and shop.Status = 1 And barcodemasternew.CompanyID = ${CompanyID} GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let [purchaseData] = await connection.query(qry);

            let barcodelist = []

            if (purchaseData.length) {

                for (const b of purchaseData) {
                    let mode1 = `And barcodemasternew.Barcode = '${b.Barcode}'`;
                    let [Barcodes] = await connection.query(`SELECT barcodemasternew.* , company.Name AS CompanyName, shop.Name AS ShopName, shop.AreaName AS AreaName, shop.BarcodeName AS BarcodeShopName, purchasedetailnew.ProductName , purchasedetailnew.ProductTypeName, purchasedetailnew.BaseBarCode AS BarCode, purchasedetailnew.UniqueBarcode, purchasedetailnew.UnitPrice, purchasedetailnew.ProductName, purchasedetailnew.Quantity ,purchasemasternew.InvoiceNo,supplier.Name AS SupplierName   FROM barcodemasternew LEFT JOIN company ON company.ID = barcodemasternew.CompanyID LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE barcodemasternew.CurrentStatus != 'Pre Order' and  purchasedetailnew.Status = 1 AND barcodemasternew.CompanyID = ${CompanyID}  ${shopMode} ${mode1}`)

                    if (Barcodes) {
                        Barcodes.forEach(e => {
                            barcodelist.push(e)
                        })
                    }
                }
            }


            response.data = barcodelist;
            response.message = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    updateBarcode: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, Barcode, Remark, CurrentStatus, CompanyID, ShopID, ProductName } = req.body;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
            if (CurrentStatus === "" || CurrentStatus === undefined || CurrentStatus === null) return res.send({ message: "Invalid Query Data" })

            const [doesCheck] = await connection.query(`select * from barcodemasternew where ID = ${ID}`)

            if (doesCheck[0].CurrentStatus === 'Available' && CurrentStatus !== 'Available') {
                // update c report setting

                const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, req.headers.currenttime)

                const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)

                const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 * Number(totalAmount), 0, 0, 0, req.headers.currenttime)

            } else {
                // update c report setting

                const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, req.headers.currenttime)

                const totalAmount = await getTotalAmountByBarcode(CompanyID, Barcode)

                const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1 * Number(totalAmount), 0, 0, 0, req.headers.currenttime)
            }

            qry = `Update barcodemasternew set CurrentStatus = '${CurrentStatus}' , Barcode = '${Barcode}' , Remark = '${Remark}' Where ID = ${ID}`;

            let [barcode] = await connection.query(qry);


            response.data = [];
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },


    // Inventory summary

    getInventorySummary: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }


            qry = `SELECT COUNT(barcodemasternew.ID) AS Count,purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasemasternew.PStatus =0 and purchasedetailnew.Status = 1  ${searchString} ` + Parem + " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";

            let [data] = await connection.query(qry);
            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    updateInventorySummary: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const { PurchaseDetailID, BrandType } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (BrandType === "" || BrandType === undefined || BrandType === null) return res.send({ message: "Invalid Query Data" })
            if (PurchaseDetailID === "" || PurchaseDetailID === undefined || PurchaseDetailID === null) return res.send({ message: "Invalid Query Data" })

            qry = `update purchasedetailnew set BrandType = ${BrandType}, UpdatedBy=${LoggedOnUser}, CreatedOn=now() where ID = ${PurchaseDetailID} and CompanyID = ${CompanyID}`

            let [data] = await connection.query(qry);
            response.data = []
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },


    // Purchase Reports

    getPurchasereports: async (req, res, next) => {
        let connection;
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT purchasemasternew.*, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo FROM purchasemasternew  LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE purchasemasternew.Status = 1 and supplier.Name != 'PreOrder Supplier'  AND purchasemasternew.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await connection.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.SubTotal) as totalUnitPrice  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier' AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await connection.query(qry);


            qry2 = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier' AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem;

            let [data2] = await connection.query(qry2);

            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
            const values2 = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    values2.push({
                        GSTType: `${item.Name}`,
                        GSTAmount: 0
                    })
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

            if (data.length) {
                for (let item of data) {
                    item.gst_details = []
                    item.gst_detailssss = []
                    for (let item2 of data2) {
                        if (item.ID === item2.PurchaseID) {
                            item.gst_details.push({
                                "GSTType": item2.GSTType,
                                "GSTAmount": item2.GSTAmount,
                                "InvoiceNo": item2.InvoiceNo,
                            })

                        }
                    }
                }
            }


            response.calculation[0].gst_details = values;

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice : 0
            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getPurchasereportsExport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0
                }], success: true, message: ""
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT purchasemasternew.*,'CGST-SGST' as GSTType, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo FROM purchasemasternew  LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE purchasemasternew.Status = 1 and supplier.Name != 'PreOrder Supplier'  AND purchasemasternew.CompanyID = ${CompanyID}  ${Parem}`;

            let [data] = await connection.query(qry);


            let [datum] = await connection.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.SubTotal) as totalUnitPrice  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier' AND purchasedetailnew.CompanyID = ${CompanyID}  ${Parem}`)

            if (data.length) {
                for (let item of data) {
                    let [fetchGstType] = await connection.query(`select * from purchasedetailnew where CompanyID = ${CompanyID} and PurchaseID = ${item.ID} LIMIT 1`)

                    if (fetchGstType.length) {
                        item.GSTType = fetchGstType[0]?.GSTType
                    }

                    item.cGstAmount = 0
                    item.iGstAmount = 0
                    item.sGstAmount = 0

                    if (item.GSTType === 'CGST-SGST') {
                        item.cGstAmount += item.GSTAmount / 2
                        item.sGstAmount += item.GSTAmount / 2
                    }

                    if (item.GSTType !== 'CGST-SGST') {
                        item.iGstAmount += item.GSTAmount
                    }
                }
            }



            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`purchasereport_export`);

            worksheet.columns = [
                { header: 'S.No', key: 'S_no', width: 8 },
                { header: 'Supplier', key: 'SupplierName', width: 30 },
                { header: 'Current Shop', key: 'CurrentShop', width: 35 },
                { header: 'InvoiceNo', key: 'InvoiceNo', width: 20 },
                { header: 'Invoice Date', key: 'InvoiceDate', width: 25 },
                { header: 'Payment Status', key: 'PaymentStatus', width: 25 },
                { header: 'Quantity', key: 'Quantity', width: 10 },
                { header: 'Discount', key: 'DiscountAmount', width: 15 },
                { header: 'Sub Total', key: 'SubTotal', width: 15 },
                { header: 'TAX Amount', key: 'GSTAmount', width: 15 },
                { header: 'IGST', key: 'iGstAmount', width: 10 },
                { header: 'SGST', key: 'sGstAmount', width: 10 },
                { header: 'CGST', key: 'cGstAmount', width: 10 },
                { header: 'Grand Total', key: 'TotalAmount', width: 15 },
                { header: 'Supplier TAX No', key: 'SupplierGSTNo', width: 20 }
            ];
            let count = 1;
            const d = {
                "S_no": '',
                "Supplier": '',
                "CurrentShop": '',
                "InvoiceNo": '',
                "InvoiceDate": '',
                "PaymentStatus": '',
                "Quantity": Number(response.calculation[0].totalQty),
                "DiscountAmount": Number(response.calculation[0].totalDiscount),
                "SubTotal": Number(response.calculation[0].totalUnitPrice),
                "GSTAmount": Number(response.calculation[0].totalGstAmount),
                "IGST": '',
                "SGST": '',
                "CGST": '',
                "TotalAmount": Number(response.calculation[0].totalAmount),
                "SupplierTAXNo": ''
            };

            worksheet.addRow(d);
            console.log("Start Exporting...");
            data.forEach((x) => {
                x.S_no = count++;
                x.CurrentShop = `${x.ShopName}(${x.AreaName})`
                x.InvoiceDate = moment(x.PurchaseDate).format('YYYY-MM-DD HH:mm a');
                worksheet.addRow(x);
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'O1',
            };

            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Purchase_report_export.xlsx`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            console.log("Export...");
            await workbook.xlsx.write(res);
            return res.end();

            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    getPurchasereportsDetail: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalRetailPrice": 0,
                    "totalWholeSalePrice": 0,
                    "totalSubTotalPrice": 0,
                    "gst_details": []
                }], success: true, message: ""
            }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier'  AND purchasedetailnew.CompanyID = ${CompanyID}  ${searchString}` + Parem;

            let [datum] = await connection.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.UnitPrice) as totalUnitPrice, SUM(purchasedetailnew.RetailPrice) as totalRetailPrice,SUM(purchasedetailnew.SubTotal) as totalSubTotalPrice, SUM(purchasedetailnew.WholeSalePrice) as totalWholeSalePrice FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier' AND purchasedetailnew.CompanyID = ${CompanyID} ${searchString}` + Parem)

            let [data] = await connection.query(qry);


            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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


            response.calculation[0].gst_details = values;

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice : 0
            // response.calculation[0].totalRetailPrice = datum[0].totalRetailPrice ? datum[0].totalRetailPrice : 0
            // response.calculation[0].totalWholeSalePrice = datum[0].totalWholeSalePrice ? datum[0].totalWholeSalePrice : 0
            response.calculation[0].totalSubTotalPrice = datum[0].totalSubTotalPrice ? datum[0].totalSubTotalPrice : 0

            if (data.length && values.length) {
                for (const item of data) {
                    response.calculation[0].totalRetailPrice += item.Quantity * item.RetailPrice
                    response.calculation[0].totalWholeSalePrice += item.Quantity * item.WholeSalePrice
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




            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getPurchasereportsDetailExport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalRetailPrice": 0,
                    "totalWholeSalePrice": 0,
                    "totalSubTotalPrice": 0,
                }], success: true, message: ""
            }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier'  AND purchasedetailnew.CompanyID = ${CompanyID}  ${searchString}` + Parem;

            let [datum] = await connection.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.UnitPrice) as totalUnitPrice, SUM(purchasedetailnew.RetailPrice) as totalRetailPrice,SUM(purchasedetailnew.SubTotal) as totalSubTotalPrice, SUM(purchasedetailnew.WholeSalePrice) as totalWholeSalePrice FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier' AND purchasedetailnew.CompanyID = ${CompanyID} ${searchString}` + Parem)

            let [data] = await connection.query(qry);


            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount.toFixed(2) : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount.toFixed(2) : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount.toFixed(2) : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice.toFixed(2) : 0
            response.calculation[0].totalSubTotalPrice = datum[0].totalSubTotalPrice ? datum[0].totalSubTotalPrice.toFixed(2) : 0

            if (data.length) {
                for (let item of data) {
                    response.calculation[0].totalRetailPrice += item.Quantity * item.RetailPrice
                    response.calculation[0].totalWholeSalePrice += item.Quantity * item.WholeSalePrice
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
                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`purchase_productType_report_export`);
            worksheet.columns = [
                { header: 'S.No', key: 'S_no', width: 8 },
                { header: 'InvoiceNo', key: 'InvoiceNo', width: 20 },
                { header: 'Invoice Date', key: 'InvoiceDate', width: 25 },
                { header: 'Supplier', key: 'SupplierName', width: 30 },
                { header: 'TAX No', key: 'SupplierGSTNo', width: 30 },
                { header: 'Product Type', key: 'ProductTypeName', width: 20 },
                { header: 'HSN Code', key: 'HSNcode', width: 15 },
                { header: 'Product', key: 'ProductName', width: 30 },
                { header: 'Qty', key: 'Quantity', width: 10 },
                { header: 'Unit Price', key: 'UnitPrice', width: 15 },
                { header: 'Dis', key: 'DiscountAmount', width: 15 },
                { header: 'Sub Total (Price Before Tax)', key: 'SubTotal', width: 30 },
                { header: 'TAX Type', key: 'GSTType', width: 15 },
                { header: 'TAX%', key: 'GSTPercentage', width: 10 },
                { header: 'TAX Amt', key: 'GSTAmount', width: 15 },
                { header: 'CGST%', key: 'cGstPercentage', width: 10 },
                { header: 'CGST Amt', key: 'cGstAmount', width: 15 },
                { header: 'SGST%', key: 'sGstPercentage', width: 10 },
                { header: 'SGST Amt', key: 'sGstAmount', width: 15 },
                { header: 'IGST%', key: 'iGstPercentage', width: 10 },
                { header: 'IGST Amt', key: 'iGstAmount', width: 15 },
                { header: 'Grand Total', key: 'TotalAmount', width: 15 },
                { header: 'Bar Code', key: 'BaseBarCode', width: 15 },
                { header: 'Payment Status', key: 'PaymentStatus', width: 15 },
                { header: 'Retail Per_Pc Price', key: 'RetailPrice', width: 20 },
                { header: 'Retail Total Price', key: 'RetailTotalPrice', width: 20 },
                { header: 'Whole Sale Per_Pc Price', key: 'WholeSalePrice', width: 20 },
                { header: 'Whole Sale Total Price', key: 'WholeSaleTotalPrice', width: 20 },
                { header: 'Current Shop', key: 'CurrentShop', width: 35 }
            ];

            const d = {
                "S_no": '',
                "InvoiceNo": '',
                "InvoiceDate": '',
                "Supplier": '',
                "TAXNo": '',
                "ProductType": '',
                "HSNCode": '',
                "Product": '',
                "Quantity": Number(response.calculation[0].totalQty),
                "UnitPrice": Number(response.calculation[0].totalUnitPrice),
                "DiscountAmount": Number(response.calculation[0].totalDiscount),
                "SubTotal": Number(response.calculation[0].totalSubTotalPrice),
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
                "BarCode": '',
                "PaymentStatus": '',
                "RetailPerPcPrice": '',
                "RetailTotalPrice": Number(response.calculation[0].totalRetailPrice),
                "WholeSalePerPcPrice": '',
                "WholeSaleTotalPrice": Number(response.calculation[0].totalWholeSalePrice),
                "CurrentShop": ''
            };

            worksheet.addRow(d);
            let count = 1
            console.log("Start Exporting...");
            data.forEach((x) => {
                x.S_no = count++;
                x.CurrentShop = `${x.ShopName}(${x.AreaName})`
                x.RetailTotalPrice = x.Quantity * x.RetailPrice
                x.WholeSaleTotalPrice = x.Quantity * x.WholeSalePrice
                x.InvoiceDate = moment(x.PurchaseDate).format('YYYY-MM-DD HH:mm a');
                worksheet.addRow(x);
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'AC1',
            };

            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=purchase_productType_report_export.xlsx`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            console.log("Export...");
            await workbook.xlsx.write(res);
            return res.end();
            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },


    // Purchase return report

    getPurchasereturnreports: async (req, res, next) => {
        let connection;
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT purchasereturn.*, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo FROM purchasereturn  LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID WHERE purchasereturn.Status = 1 AND purchasereturn.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await connection.query(`SELECT SUM(purchasereturndetail.Quantity) as totalQty, SUM(purchasereturndetail.GSTAmount) as totalGstAmount, SUM(purchasereturndetail.TotalAmount) as totalAmount, SUM(purchasereturndetail.DiscountAmount) as totalDiscount, SUM(purchasereturndetail.SubTotal) as totalUnitPrice  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID WHERE purchasereturndetail.Status = 1  AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await connection.query(qry);


            qry2 = `SELECT purchasereturndetail.*,purchasereturn.SystemCn, purchasereturn.SupplierCn, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID LEFT JOIN product ON product.ID = purchasereturndetail.ProductTypeID WHERE purchasereturndetail.Status = 1  AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem;

            let [data2] = await connection.query(qry2);

            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
            const values2 = []

            if (gstTypes.length) {
                for (const item of gstTypes) {
                    values2.push({
                        GSTType: `${item.Name}`,
                        GSTAmount: 0
                    })
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

            if (data.length) {
                for (let item of data) {
                    item.gst_details = []
                    item.gst_detailssss = []
                    for (let item2 of data2) {
                        if (item.ID === item2.ReturnID) {
                            item.gst_details.push({
                                "GSTType": item2.GSTType,
                                "GSTAmount": item2.GSTAmount,
                                "InvoiceNo": item2.InvoiceNo,
                            })

                        }
                    }
                }
            }


            response.calculation[0].gst_details = values;

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice : 0
            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    getPurchasereturndetailreports: async (req, res, next) => {
        let connection;
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT purchasereturndetail.*,purchasereturn.SystemCn, purchasereturn.SupplierCn, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID LEFT JOIN product ON product.ID = purchasereturndetail.ProductTypeID WHERE purchasereturndetail.Status = 1 AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await connection.query(`SELECT SUM(purchasereturndetail.Quantity) as totalQty, SUM(purchasereturndetail.GSTAmount) as totalGstAmount, SUM(purchasereturndetail.TotalAmount) as totalAmount, SUM(purchasereturndetail.DiscountAmount) as totalDiscount, SUM(purchasereturndetail.SubTotal) as totalUnitPrice  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID LEFT JOIN product ON product.ID = purchasereturndetail.ProductTypeID WHERE purchasereturndetail.Status = 1  AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await connection.query(qry);


            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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


            response.calculation[0].gst_details = values;

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice : 0

            if (data.length && values.length) {
                for (const item of data) {
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




            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    setProductExpiryDate: async (req, res, next) => {
        let connection;
        try {
            // return res.send({success: false, message: `it is temp function`})
            const { CompanyID } = req.body;
            console.log(`hii setProductExpiryDate`);
            if (CompanyID === "" || CompanyID === undefined || CompanyID === null) return res.send({ message: "Invalid Query Data" })

            const [data] = await connection.query(`select * from purchasedetailnew where CompanyID = ${CompanyID}`)

            if (data) {
                for (const item of data) {
                    let pName = item.ProductName.split("/")
                    console.log(pName[pName.length - 1], isValidDate(pName[pName.length - 1]));

                    if (isValidDate(pName[pName.length - 1])) {
                        const [update] = await connection.query(`update purchasedetailnew set ProductExpDate = '${pName[pName.length - 1]}', UpdatedBy = ${item.CreatedBy}, UpdatedOn = now() where ID = ${item.ID}`)
                    }
                }
            }

            return res.send(data)


        } catch (error) {
            console.log(error);
            next(error)
        }
    },



    // pre order

    createPreOrder: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Pre Order";
            const paymentStatus = "Unpaid"

            const {
                PurchaseMaster,
                PurchaseDetail,
                Charge
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID !== null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })

            if (PurchaseMaster.preOrder === false || PurchaseMaster.preOrder === "false" || !PurchaseMaster?.preOrder || PurchaseMaster?.preOrder === null) return res.send({ message: "Invalid Query Data preOrder" })

            const [doesExistInvoiceNo] = await connection.query(`select ID from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }

            const purchaseDetail = JSON.parse(PurchaseDetail);

            if (purchaseDetail.length === 0) {
                return res.send({ message: "Invalid Query Data purchaseDetail" })
            }

            const purchase = {
                ID: null,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: shopid,
                PurchaseDate: PurchaseMaster.PurchaseDate ? PurchaseMaster.PurchaseDate : now(),
                PaymentStatus: paymentStatus,
                InvoiceNo: PurchaseMaster.InvoiceNo,
                GSTNo: PurchaseMaster.GSTNo ? PurchaseMaster.GSTNo : '',
                Quantity: 1,
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
            const [savePurchase] = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            //  save purchase detail data
            for (const item of purchaseDetail) {
                const doesProduct = await doesExistProduct(CompanyID, item)

                // generate unique barcode
                item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                // baseBarcode initiated if same product exist or not condition
                let baseBarCode = 0;
                if (doesProduct !== 0) {
                    baseBarCode = doesProduct
                } else {
                    baseBarCode = await generateBarcode(CompanyID, 'PB')
                }

                const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            //  save barcode

            let [detailDataForBarCode] = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

            if (detailDataForBarCode.length) {
                for (const item of detailDataForBarCode) {
                    const barcode = Number(item.BaseBarCode)
                    let count = 0;
                    count = 1;
                    for (j = 0; j < count; j++) {
                        const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(),1)`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    listPreOrder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 1 and supplier.Name = 'PreOrder Supplier' and purchasemasternew.CompanyID = ${CompanyID} ${shopId} order by purchasemasternew.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    listPreOrderDummy: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let Parem = Body.Parem;
            let Productsearch = Body.Productsearch;
            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            if (Parem === '' || Parem === undefined) {
                Parem = ``
            }

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            let qry = `select purchasedetailnew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasedetailnew LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID left join user as users1 on users1.ID = purchasedetailnew.CreatedBy left join user as users on users.ID = purchasedetailnew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 1 and purchasedetailnew.Status = 1 and purchasemasternew.CompanyID = ${CompanyID} ${searchString} ${shopId}  ${Parem} order by purchasedetailnew.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            if (data.length) {
                for (let item of data) {
                    item.PurchaseMasterData = {}
                    const [purchasedata] = await connection.query(`SELECT purchasemasternew.*, supplier.Name AS SupplierName,  supplier.GSTNo AS GSTNo, users1.Name AS CreatedPerson,shop.Name AS ShopName, shop.AreaName AS AreaName, users.Name AS UpdatedPerson FROM purchasemasternew LEFT JOIN user AS users1 ON users1.ID = purchasemasternew.CreatedBy LEFT JOIN user AS users ON users.ID = purchasemasternew.UpdatedBy LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID WHERE purchasemasternew.Status = 1 AND purchasemasternew.PStatus = 1 and purchasemasternew.ID = ${item.PurchaseID} and purchasemasternew.CompanyID = ${CompanyID} ${shopId} `)
                    item.PurchaseMasterData = purchasedata[0]
                }

            }

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    deletePreOrderDummy: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const {
                PurchaseMaster,
                PurchaseDetail,
            } = req.body;

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set  Quantity = ${PurchaseMaster.Quantity}, SubTotal = ${PurchaseMaster.SubTotal}, DiscountAmount = ${PurchaseMaster.DiscountAmount}, GSTAmount=${PurchaseMaster.GSTAmount}, TotalAmount = ${PurchaseMaster.TotalAmount}, DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${PurchaseMaster.ID}`)

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            const [deletePurchasedetail] = await connection.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${PurchaseDetail.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            const [deleteBarcode] = await connection.query(`update barcodemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where purchaseDetailID = ${PurchaseDetail.ID} and CompanyID = ${CompanyID}`)

            console.log("Barcode Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    deleteAllPreOrderDummy: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const {
                PurchaseMaster,
                PurchaseDetail,
            } = req.body;
            console.log(PurchaseMaster, 'PurchaseMaster========================');
            console.log(PurchaseMaster, 'PurchaseDetail========================');

            // check

            if (!PurchaseDetail.length) {
                return res.send({ message: "Invalid Query Data1" })
            }

            for (const item of PurchaseDetail) {
                if (!item.Sel || item.Sel == 0) {
                    return res.send({ message: "Invalid Query Data2" })
                }

                if (item.Status == 1) {
                    return res.send({ message: "Invalid Query Data3" })
                }
            }

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set  Quantity = ${PurchaseMaster.Quantity}, SubTotal = ${PurchaseMaster.SubTotal}, DiscountAmount = ${PurchaseMaster.DiscountAmount}, GSTAmount=${PurchaseMaster.GSTAmount}, TotalAmount = ${PurchaseMaster.TotalAmount}, DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${PurchaseMaster.ID}`)

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            for (const item of PurchaseDetail) {

                const [deletePurchasedetail] = await connection.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${item.ID} and CompanyID = ${CompanyID}`)

                console.log("Product Delete SuccessFUlly !!!");

                const [deleteBarcode] = await connection.query(`update barcodemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where purchaseDetailID = ${item.ID} and CompanyID = ${CompanyID}`)

                console.log("Barcode Delete SuccessFUlly !!!");
            }



            response.message = "data delete sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    updatePreOrderDummy: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const {
                PurchaseMaster,
                PurchaseDetail,
            } = req.body;

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set  Quantity = ${PurchaseMaster.Quantity}, SubTotal = ${PurchaseMaster.SubTotal}, DiscountAmount = ${PurchaseMaster.DiscountAmount}, GSTAmount=${PurchaseMaster.GSTAmount}, TotalAmount = ${PurchaseMaster.TotalAmount}, DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${PurchaseMaster.ID}`)

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            const [updatePurchasedetail] = await connection.query(`update purchasedetailnew set UnitPrice=${PurchaseDetail.UnitPrice}, Quantity=${PurchaseDetail.Quantity}, SubTotal=${PurchaseDetail.SubTotal},DiscountPercentage=${PurchaseDetail.DiscountPercentage},DiscountAmount=${PurchaseDetail.DiscountAmount},GSTPercentage=${PurchaseDetail.GSTPercentage},GSTAmount=${PurchaseDetail.GSTAmount},GSTType='${PurchaseDetail.GSTType}',  TotalAmount = ${PurchaseDetail.TotalAmount}, RetailPrice=${PurchaseDetail.RetailPrice},WholeSalePrice=${PurchaseDetail.WholeSalePrice}, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${PurchaseDetail.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Update SuccessFUlly !!!");

            const [updateBarcodeMaster] = await connection.query(`update barcodemasternew set RetailPrice=${PurchaseDetail.RetailPrice}, WholeSalePrice=${PurchaseDetail.WholeSalePrice} where CompanyID = ${CompanyID} and PurchaseDetailID = ${PurchaseDetail.ID}`)

            console.log("Barcode Master Update SuccessFUlly !!!");

            response.message = "data update sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    getPurchaseByIdPreOrder: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid} and PStatus = 1`)

            const [PurchaseDetail] = await connection.query(`select 0 as Sel, purchasedetailnew.* from purchasedetailnew where  PurchaseID = ${ID} and CompanyID = ${CompanyID}`)



            const gst_detail = await gstDetail(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = gst_detail || []
            response.result.PurchaseDetail = PurchaseDetail
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    deletePreOrder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select * from purchasemasternew where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "purchase doesnot exist from this id " })
            }


            const [doesExistProduct] = await connection.query(`select * from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID} and PurchaseID = ${Body.ID}`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await connection.query(`update purchasemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    deleteProductPreOrder: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select * from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }




            const [deletePurchasedetail] = await connection.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)



            const [fetchPurchaseMaster] = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    updatePreOrder: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Pre Order";
            const paymentStatus = "Unpaid"
            console.log(req.body, 'pre');
            const {
                PurchaseMaster,
                PurchaseDetail,
                Charge
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID === null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })

            if (PurchaseMaster.preOrder === false || PurchaseMaster.preOrder === "false" || !PurchaseMaster?.preOrder || PurchaseMaster?.preOrder === null) return res.send({ message: "Invalid Query Data preOrder" })


            const [doesExistInvoiceNo] = await connection.query(`select ID from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }

            const purchaseDetail = JSON.parse(PurchaseDetail);

            if (purchaseDetail.length === 0) {
                return res.send({ message: "Invalid Query Data purchaseDetail" })
            }

            const purchase = {
                ID: PurchaseMaster.ID,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: shopid,
                PaymentStatus: paymentStatus,
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



            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${purchase.ID}`)

            console.log(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${purchase.ID}`);

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            // add new product

            for (const item of purchaseDetail) {
                if (item.ID === null) {
                    const doesProduct = await doesExistProduct(CompanyID, item)

                    // generate unique barcode
                    item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                    // baseBarcode initiated if same product exist or not condition
                    let baseBarCode = 0;
                    if (doesProduct !== 0) {
                        baseBarCode = doesProduct
                    } else {
                        baseBarCode = await generateBarcode(CompanyID, 'PB')
                    }

                    const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


                    let [detailDataForBarCode] = await connection.query(
                        `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
                    );

                    await Promise.all(
                        detailDataForBarCode.map(async (item) => {
                            const barcode = Number(item.BaseBarCode)
                            let count = 0;
                            count = 1;
                            for (j = 0; j < count; j++) {
                                const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(), 1)`)
                            }
                        })
                    )


                }
            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));


            response.message = "data update sucessfully"
            response.data = purchase.ID
            return res.send(response);



        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    searchByFeildPreOrder: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }


            let qry = `select purchasemasternew.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} ${shopId} and purchasemasternew.InvoiceNo like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    // product inventory report

    getProductInventoryReport: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalSubTotal": 0,
                    "totalRetailPrice": 0,
                    "totalWholeSalePrice": 0,
                    "gst_details": []
                }]
            }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const Body = req.body;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} ${searchString} AND purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier'  ` + Parem + " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";
            let [data] = await connection.query(qry);

            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                    item.DiscountAmount = item.UnitPrice * item.Count * item.DiscountPercentage / 100
                    item.SubTotal = (item.Count * item.UnitPrice) - item.DiscountAmount
                    item.GSTAmount = (item.UnitPrice * item.Count - item.DiscountAmount) * item.GSTPercentage / 100
                    item.TotalAmount = item.SubTotal + item.GSTAmount

                    response.calculation[0].totalQty += item.Count
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.TotalAmount
                    response.calculation[0].totalDiscount += item.DiscountAmount
                    response.calculation[0].totalUnitPrice += item.UnitPrice
                    response.calculation[0].totalSubTotal += item.SubTotal
                    response.calculation[0].totalRetailPrice += item.Count * item.RetailPrice
                    response.calculation[0].totalWholeSalePrice += item.Count * item.WholeSalePrice


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
            return res.send(response);



        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    getProductInventoryReportExport: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "totalSubTotal": 0,
                    "totalRetailPrice": 0,
                    "totalWholeSalePrice": 0,
                    "gst_details": []
                }]
            }
            const { Parem, Productsearch } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const Body = req.body;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            if (Productsearch === undefined || Productsearch === null) {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} ${searchString} AND purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier'  ` + Parem + " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";
            let [data] = await connection.query(qry);

            // let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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

            if (data.length) {
                for (const item of data) {
                    item.DiscountAmount = item.UnitPrice * item.Count * item.DiscountPercentage / 100
                    item.SubTotal = (item.Count * item.UnitPrice) - item.DiscountAmount
                    item.GSTAmount = (item.UnitPrice * item.Count - item.DiscountAmount) * item.GSTPercentage / 100
                    item.TotalAmount = item.SubTotal + item.GSTAmount

                    response.calculation[0].totalQty += item.Count
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.TotalAmount
                    response.calculation[0].totalDiscount += item.DiscountAmount
                    response.calculation[0].totalUnitPrice += item.UnitPrice
                    response.calculation[0].totalSubTotal += item.SubTotal
                    response.calculation[0].totalRetailPrice += item.Count * item.RetailPrice
                    response.calculation[0].totalWholeSalePrice += item.Count * item.WholeSalePrice


                    // if (values) {
                    //     values.forEach(e => {
                    //         if (e.GSTType === item.GSTType) {
                    //             e.Amount += item.GSTAmount
                    //         }

                    //         // CGST-SGST

                    //         if (item.GSTType === 'CGST-SGST') {

                    //             if (e.GSTType === 'CGST') {
                    //                 e.Amount += item.GSTAmount / 2
                    //             }

                    //             if (e.GSTType === 'SGST') {
                    //                 e.Amount += item.GSTAmount / 2
                    //             }
                    //         }
                    //     })
                    // }

                }


            }


            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`inventory_report_export`);

            worksheet.columns = [
                { header: 'S.No', key: 'S_no', width: 8 },
                { header: 'InvoiceNo', key: 'InvoiceNo', width: 25 },
                { header: 'Invoice Date', key: 'InvoiceDate', width: 20 },
                { header: 'Current Shop', key: 'CurrentShop', width: 30 },
                { header: 'Supplier', key: 'SupplierName', width: 25 },
                { header: 'Product Category', key: 'ProductTypeName', width: 20 },
                { header: 'Product Name', key: 'ProductName', width: 30 },
                { header: 'Status', key: 'CurrentStatus', width: 15 },
                { header: 'Barcode', key: 'Barcode', width: 15 },
                { header: 'Quantity', key: 'Quantity', width: 10 },
                { header: 'Unit Price', key: 'UnitPrice', width: 15 },
                { header: 'Discount', key: 'DiscountAmount', width: 15 },
                { header: 'Sub Total', key: 'SubTotal', width: 15 },
                { header: 'TAX Type', key: 'GSTType', width: 10 },
                { header: 'TAX%', key: 'GSTPercentage', width: 10 },
                { header: 'TAX Amount', key: 'GSTAmount', width: 15 },
                { header: 'Grand Total', key: 'TotalAmount', width: 15 },
                { header: 'Retail Per_Pc Price', key: 'RetailPrice', width: 20 },
                { header: 'Retail Total Price', key: 'RetailTotalPrice', width: 20 },
                { header: 'WholeSale Per_Pc Price', key: 'WholeSalePrice', width: 20 },
                { header: 'WholeSale Total Price', key: 'WholeSaleTotalPrice', width: 20 }
            ];

            const d = {
                "S_no": '',
                "InvoiceNo": '',
                "InvoiceDate": '',
                "CurrentShop": '',
                "Supplier": '',
                "ProductCategory": '',
                "ProductName": '',
                "Status": '',
                "Barcode": '',
                "Quantity": response.calculation[0].totalQty,
                "UnitPrice": response.calculation[0].totalUnitPrice,
                "DiscountAmount": response.calculation[0].totalDiscount,
                "SubTotal": response.calculation[0].totalSubTotal,
                "TAXType": '',
                "TAXPercentage": '',
                "GSTAmount": response.calculation[0].totalGstAmount,
                "TotalAmount": response.calculation[0].totalAmount,
                "RetailPerPcPrice": '',
                "RetailTotalPrice": response.calculation[0].totalRetailPrice,
                "WholeSalePerPcPrice": '',
                "WholeSaleTotalPrice": response.calculation[0].totalWholeSalePrice
            };


            worksheet.addRow(d);
            let count = 1;
            console.log("Start Exporting...");
            data.forEach((x) => {
                x.S_no = count++;
                x.CurrentShop = `${x.ShopName}(${x.AreaName})`
                x.RetailTotalPrice = x.Count * x.RetailPrice
                x.WholeSaleTotalPrice = x.Count * x.WholeSalePrice
                x.InvoiceDate = moment(x.PurchaseDate).format('YYYY-MM-DD HH:mm a');
                worksheet.addRow(x);
            });

            worksheet.autoFilter = {
                from: 'A1',
                to: 'U1',
            };

            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Inventory_report_export.xlsx`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            console.log("Export...");
            await workbook.xlsx.write(res);
            return res.end();


            // response.calculation[0].gst_details = values;
            response.data = data
            response.message = "success";
            return res.send(response);



        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },

    // product expiry report
    getProductExpiryReport: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalUnitPrice": 0,
                    "gst_details": []
                }]
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const Body = req.body;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID, purchasedetailnew.ProductExpDate FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasedetailnew.Status = 1 and purchasedetailnew.ProductExpDate != '0000-00-00' ` +
                Parem +
                " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";

            let [data] = await connection.query(qry);

            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                    item.DiscountAmount = item.UnitPrice * item.Count * item.DiscountPercentage / 100
                    item.SubTotal = (item.Count * item.UnitPrice) - item.DiscountAmount
                    item.GSTAmount = (item.UnitPrice * item.Count - item.DiscountAmount) * item.GSTPercentage / 100
                    item.TotalAmount = item.SubTotal + item.GSTAmount

                    response.calculation[0].totalQty += item.Count
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.TotalAmount
                    response.calculation[0].totalDiscount += item.DiscountAmount
                    response.calculation[0].totalUnitPrice += item.UnitPrice

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
            return res.send(response);



        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },

    // purchase charge report

    getPurchaseChargeReport: async (req, res, next) => {
        let connection;
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
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const Body = req.body;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            qry = `SELECT purchasecharge.*, purchasemasternew.InvoiceNo, purchasemasternew.ShopID,shop.Name AS ShopName,shop.AreaName AS AreaName FROM purchasecharge LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasecharge.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID WHERE purchasecharge.CompanyID = ${CompanyID} AND purchasecharge.Status = 1 ` + Parem;

            let [data] = await connection.query(qry);

            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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
                    response.calculation[0].totalAmount += item.Amount

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
            return res.send(response);



        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },

    // purchase return

    barCodeListBySearchStringPR: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName, ShopID, SupplierID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            if (ShopID === "" || ShopID === undefined || ShopID === null || ShopID === 0) return res.send({ message: "Invalid Query ShopID Data" })

            if (SupplierID === "" || SupplierID === undefined || SupplierID === null) return res.send({ message: "Invalid Query SupplierID Data" })

            let SearchString = searchString.substring(0, searchString.length - 1) + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.ProductTypeID, purchasedetailnew.UnitPrice, purchasedetailnew.DiscountPercentage, purchasedetailnew.DiscountAmount,purchasedetailnew.GSTPercentage, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType,barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available" and purchasemasternew.SupplierID = ${SupplierID} and barcodemasternew.ShopID = ${ShopID}  AND purchasedetailnew.Status = 1  and shop.Status = 1  And barcodemasternew.CompanyID = ${CompanyID} GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let [purchaseData] = await connection.query(qry);
            response.data = purchaseData;
            response.message = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    productDataByBarCodeNoPR: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { Req, PreOrder, ShopMode, ShopID, SupplierID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            if (Req.SearchBarCode === "" || Req.SearchBarCode === undefined || Req.SearchBarCode === null) return res.send({ message: "Invalid Query Data" })

            if (ShopID === "" || ShopID === undefined || ShopID === null || ShopID === 0) return res.send({ message: "Invalid Query ShopID Data" })

            if (SupplierID === "" || SupplierID === undefined || SupplierID === null) return res.send({ message: "Invalid Query SupplierID Data" })

            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === "false") {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.UnitPrice, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.GSTAmount, purchasedetailnew.DiscountAmount, purchasedetailnew.DiscountPercentage,purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID,purchasemasternew.InvoiceNo, barcodemasternew.*, purchasemasternew.ShopID  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE CurrentStatus = "Available"  and purchasemasternew.SupplierID = ${SupplierID} and barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1  and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = ${CompanyID} ${shopMode} and purchasemasternew.ShopID = ${shopid}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount,purchasedetailnew.UnitPrice, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice,purchasedetailnew.DiscountAmount, purchasedetailnew.DiscountPercentage, purchasedetailnew.ProductTypeID,purchasemasternew.InvoiceNo, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE barcodemasternew.Barcode = '${barCode}' and PurchaseDetail.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = ${CompanyID}`;
            }

            let [barCodeData] = await connection.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    savePurchaseReturn: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const {
                PurchaseMaster,
                PurchaseDetail
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.ShopID || PurchaseMaster.ShopID === undefined) return res.send({ message: "Invalid ShopID Data" })

            if (!PurchaseMaster.SystemCn || PurchaseMaster.SystemCn === undefined || PurchaseMaster.SystemCn.trim() === "") return res.send({ message: "Invalid SystemCn Data" })

            if (PurchaseMaster.ID !== null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            if (PurchaseMaster.ShopID !== shopid) {
                return res.send({ message: " Selected Shop Should Be Header Shop" })
            }

            // return res.send({ success: false, message: "We are facing some technical issue, please try again after some time." })

            const [doesExistSystemCn] = await connection.query(`select * from purchasereturn  where Status = 1 and SystemCn = '${PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            if (doesExistSystemCn.length) {
                return res.send({ message: `PurchaseReturn Already exist from this SystemCn ${PurchaseMaster.SystemCn}` })
            }

            const purchaseDetail = JSON.parse(PurchaseDetail);

            if (purchaseDetail.length === 0) {
                return res.send({ message: "Invalid Query Data purchaseDetail" })
            }

            const purchasereturn = {
                ID: null,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: PurchaseMaster.ShopID,
                SystemCn: PurchaseMaster.SystemCn,
                Quantity: PurchaseMaster.Quantity,
                SubTotal: PurchaseMaster.SubTotal,
                DiscountAmount: PurchaseMaster.DiscountAmount,
                GSTAmount: PurchaseMaster.GSTAmount,
                TotalAmount: PurchaseMaster.TotalAmount,
                PurchaseDate: PurchaseMaster.PurchaseDate || '',
                Status: 1,
                SupplierCn: "",
            }

            //  save purchasereturn data
            const [savePurchaseReturn] = await connection.query(`insert into purchasereturn(SupplierID,CompanyID,ShopID,SystemCn,SupplierCn,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,CreatedBy,CreatedOn,PurchaseDate)values(${purchasereturn.SupplierID},${purchasereturn.CompanyID},${purchasereturn.ShopID},'${purchasereturn.SystemCn}','${purchasereturn.SupplierCn}',${purchasereturn.Quantity},${purchasereturn.SubTotal},${purchasereturn.DiscountAmount},${purchasereturn.GSTAmount},${purchasereturn.TotalAmount},1,${LoggedOnUser}, now(), '${purchasereturn.PurchaseDate}')`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            //  save purchase return detail data
            for (const item of purchaseDetail) {

                const [savePurchaseDetail] = await connection.query(`insert into purchasereturndetail(ReturnID,CompanyID,PurchaseDetailID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,Barcode,Status,CreatedBy,CreatedOn,Remark)values(${savePurchaseReturn.insertId},${CompanyID},${item.PurchaseDetailID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},'${item.Barcode}',1, ${LoggedOnUser},now(),'${item.Remark}')`)


                let count = 0;
                count = item.Quantity;

                let [fetch] = await connection.query(`select barcodemasternew.ID from barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID where barcodemasternew.Status = 1 and barcodemasternew.Barcode = '${item.Barcode}' and purchasedetailnew.ProductName = '${item.ProductName}' and barcodemasternew.CurrentStatus = 'Available' and barcodemasternew.CompanyID = ${CompanyID} and barcodemasternew.ShopID = ${shopid} limit ${count}`)

                for (const ele of fetch) {
                    let [updateBarcode] = await connection.query(`update barcodemasternew set CurrentStatus = 'Return To Supplier', BillDetailID = ${savePurchaseDetail.insertId} where Status = 1 and Barcode = '${item.Barcode}' and CurrentStatus = 'Available' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${ele.ID}`)
                }




                // update c report setting

                const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, count, 0, 0, 0, req.headers.currenttime)
                const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, item.TotalAmount, 0, 0, 0, req.headers.currenttime)

                console.log(`Barcode No ${item.Barcode} update successfully`);

            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchaseReturn.insertId
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    updatePurchaseReturn: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }
            // return res.send({ success: false, message: "We are facing some technical issue, please try again after some time." })
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const {
                PurchaseMaster,
                PurchaseDetail
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.SystemCn || PurchaseMaster.SystemCn === undefined) return res.send({ message: "Invalid SystemCn Data" })

            if (!PurchaseMaster.ShopID || PurchaseMaster.ShopID === undefined) return res.send({ message: "Invalid ShopID Data" })

            if (PurchaseMaster.ID === null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            const [doesExistSystemCn] = await connection.query(`select * from purchasereturn where Status = 1 and SystemCn = '${PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)

            if (doesExistSystemCn.length) {
                return res.send({ message: `Purchase Already exist from this SystemCn ${PurchaseMaster.SystemCn}` })
            }

            const [doesExistSupplierCn] = await connection.query(`select * from purchasereturn where Status = 1 and SystemCn = '${PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${PurchaseMaster.ID}`)

            console.log(PurchaseMaster.ShopID);
            console.log(shopid);
            console.log(typeof (PurchaseMaster.ShopID));
            console.log(typeof (shopid));

            if (PurchaseMaster.ShopID !== shopid) {
                return res.send({ message: " Selected Shop Should Be Header Shop" })
            }


            if (doesExistSupplierCn[0].SupplierCn !== "") {
                return res.send({ message: `You have already added supplierCn ${PurchaseMaster.SupplierCn}` })
            }

            const purchaseDetail = JSON.parse(PurchaseDetail);

            if (purchaseDetail.length === 0) {
                return res.send({ message: "Invalid Query Data purchaseDetail" })
            }

            const purchase = {
                ID: PurchaseMaster.ID,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: CompanyID,
                ShopID: PurchaseMaster.ShopID,
                Quantity: PurchaseMaster.Quantity,
                SubTotal: PurchaseMaster.SubTotal,
                DiscountAmount: PurchaseMaster.DiscountAmount,
                GSTAmount: PurchaseMaster.GSTAmount,
                TotalAmount: PurchaseMaster.TotalAmount,
                PurchaseDate: PurchaseMaster.PurchaseDate || '',
                Status: 1,
            }

            const supplierId = purchase.SupplierID;

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasereturn set Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now(), PurchaseDate='${purchase.PurchaseDate}' where CompanyID = ${CompanyID} and ShopID = ${purchase.ShopID} and ID = ${purchase.ID}`)


            //  save purchase return detail data
            for (const item of purchaseDetail) {

                if (item.ID === null) {

                    const [savePurchaseDetail] = await connection.query(`insert into purchasereturndetail(ReturnID,CompanyID,PurchaseDetailID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,Barcode,Status,CreatedBy,CreatedOn,Remark)values(${purchase.ID},${CompanyID},${item.PurchaseDetailID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},'${item.Barcode}',1,${LoggedOnUser},now(),'${item.Remark}')`)


                    let count = 0;
                    count = item.Quantity;

                    let [fetch] = await connection.query(`select barcodemasternew.ID from barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID where barcodemasternew.Status = 1 and barcodemasternew.Barcode = '${item.Barcode}' and purchasedetailnew.ProductName = '${item.ProductName}' and barcodemasternew.CurrentStatus = 'Available' and barcodemasternew.CompanyID = ${CompanyID} and barcodemasternew.ShopID = ${shopid} limit ${count}`)


                    for (const ele of fetch) {
                        let [updateBarcode] = await connection.query(`update barcodemasternew set CurrentStatus = 'Return To Supplier', BillDetailID = ${savePurchaseDetail.insertId} where Status = 1 and Barcode = '${item.Barcode}' and CurrentStatus = 'Available' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${ele.ID}`)
                    }

                    // update c report setting

                    const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                    const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, count, 0, 0, 0, req.headers.currenttime)
                    const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, item.TotalAmount, 0, 0, 0, req.headers.currenttime)

                    console.log(`Barcode No ${item.Barcode} update successfully`);

                }

            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = purchase.ID
            return res.send(response);



        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    purchasereturnlist: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasereturn.ShopID = ${shopid}`
            }

            let qry = `select purchasereturn.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasereturn left join user as users1 on users1.ID = purchasereturn.CreatedBy left join user as users on users.ID = purchasereturn.UpdatedBy left join supplier on supplier.ID = purchasereturn.SupplierID left join shop on shop.ID = purchasereturn.ShopID where purchasereturn.Status = 1  and purchasereturn.CompanyID = ${CompanyID} ${shopId} order by purchasereturn.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    getPurchaseReturnById: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await connection.query(`select * from purchasereturn  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const [PurchaseDetail2] = await connection.query(`select purchasereturndetail.*, purchasemasternew.InvoiceNo from purchasereturndetail left join purchasedetailnew on purchasedetailnew.ID = purchasereturndetail.PurchaseDetailID left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID  where  purchasereturndetail.ReturnID = ${ID} and purchasereturndetail.CompanyID = ${CompanyID}`)

            const [PurchaseDetail] = await connection.query(`select * from purchasereturndetail where  Status = 1 and ReturnID = ${ID} and CompanyID = ${CompanyID}`)


            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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

            if (PurchaseDetail.length) {
                for (const item of PurchaseDetail) {

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

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = values || []
            response.result.PurchaseDetail = PurchaseDetail2
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    deleteProductPR: async (req, res, next) => {
        let connection;
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.SystemCn.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select * from purchasereturndetail where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }


            const [doesExistSystemCn] = await connection.query(`select * from purchasereturn where Status = 1 and SystemCn = '${Body.PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${Body.PurchaseMaster.ID}`)


            if (doesExistSystemCn[0].SupplierCn !== "") {
                return res.send({ message: `You have already added supplierCn ${Body.PurchaseMaster.SupplierCn}` })
            }


            const [deletePurchasedetail] = await connection.query(`update purchasereturndetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await connection.query(`update purchasereturn set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and SystemCn = '${Body.PurchaseMaster.SystemCn}' and ShopID = ${Body.PurchaseMaster.ShopID}`)

            // update barcode

            const [updateBarcode] = await connection.query(`update barcodemasternew set CurrentStatus = 'Available' , BillDetailID = 0  where BillDetailID = ${Body.ID}`)


            const [fetchPurchaseMaster] = await connection.query(`select * from purchasereturn  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${Body.PurchaseMaster.ShopID}`)

            const [PurchaseDetail2] = await connection.query(`select * from purchasereturndetail where ReturnID = ${doesExist[0].ReturnID} and CompanyID = ${CompanyID}`)

            const [PurchaseDetail] = await connection.query(`select * from purchasereturndetail where Status = 1 and ReturnID = ${doesExist[0].ReturnID} and CompanyID = ${CompanyID}`)

            let [gstTypes] = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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

            if (PurchaseDetail.length) {
                for (const item of PurchaseDetail) {

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
            // update c report setting

            const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

            const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, 0, 0, 0, 0, 0, 0, -doesExist[0].Quantity, 0, 0, 0, req.headers.currenttime)
            fetchPurchaseMaster[0].gst_detail = values
            response.result.PurchaseDetail = PurchaseDetail2;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    searchByFeildPR: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasereturn.ShopID = ${shopid}`
            }


            let qry = `select purchasereturn.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasereturn left join user as users1 on users1.ID = purchasereturn.CreatedBy left join user as users on users.ID = purchasereturn.UpdatedBy left join supplier on supplier.ID = purchasereturn.SupplierID left join shop on shop.ID = purchasereturn.ShopID where purchasereturn.Status = 1 and purchasereturn.CompanyID = ${CompanyID} ${shopId} and purchasereturn.SystemCn like '%${Body.searchQuery}%' OR purchasereturn.Status = 1 and purchasereturn.CompanyID = ${CompanyID} ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasereturn.Status = 1  and purchasereturn.CompanyID = ${CompanyID} ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    deletePR: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select * from purchasereturn where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "purchasereturn doesnot exist from this id " })
            }

            if (doesExist[0].SupplierCn !== "") {
                return res.send({ message: "You have already added supplierCn" })
            }


            const [doesExistProduct] = await connection.query(`select * from purchasereturndetail where Status = 1 and CompanyID = ${CompanyID} and ReturnID = ${Body.ID}`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await connection.query(`update purchasereturn set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Return Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    supplierCnPR: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const { PurchaseDate, SupplierCn, ID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (SupplierCn === null || SupplierCn === undefined) return res.send({ message: "Invalid Query Data" })

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select * from purchasereturn where Status = 1 and CompanyID = ${CompanyID} and ID = '${ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchasereturn doesnot exist from this id " })
            }

            const [doesCheckCn] = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${SupplierCn.trim()}' and PaymentType = 'Vendor Credit' and Credit = 'Credit'`)

            if (doesCheckCn.length) {
                return res.send({ message: `PurchaseReturn Already exist from this SupplierCn ${SupplierCn}` })
            }

            let supplierId = doesExist[0].SupplierID


            let [update] = await connection.query(`update purchasereturn set SupplierCn = '${SupplierCn}', PurchaseDate = '${PurchaseDate}', CreatedOn=now(), UpdatedBy=${LoggedOnUser} where ID =${ID}`)

            console.log("Purchase Return Update SuccessFUlly !!!");


            const [savePaymentMaster] = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Credit',now(), 'Vendor Credit', '', '', ${doesExist[0].TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${SupplierCn}',${ID},${supplierId},${CompanyID},${doesExist[0].TotalAmount},0,'Vendor Credit','Credit',1,${LoggedOnUser}, now())`)

            const [saveVendorCredit] = await connection.query(`insert into vendorcredit(CompanyID, ShopID, SupplierID, CreditNumber, CreditDate, Amount, Remark, Is_Return, Status, CreatedBy, CreatedOn)values(${CompanyID}, ${shopid},${supplierId}, '${SupplierCn}', now(), ${doesExist[0].TotalAmount}, 'Amount Credited By Product Return From CN No ${SupplierCn}', 1, 1, ${LoggedOnUser}, now())`)

            console.log(connected("Vendor Credit SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    setbarcodemaster: async (req, res, next) => {
        let connection;
        try {
            return
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";


            //  save barcode

            let [detailDataForBarCode] = await connection.query(`SELECT * FROM purchasedetailnew WHERE CompanyID = ${CompanyID} AND BaseBarCode IN (
                '10000351',
                '10000352',
                '10000353',
                '10000354',
                '10000355',
                '10000356',
                '10000357',
                '10000358',
                '10000359',
                '10000360',
                '10000361',
                '10000362',
                '10000363',
                '10000364',
                '10000365',
                '10000366',
                '10000367',
                '10000368',
                '10000369',
                '10000370',
                '10000371',
                '10000372',
                '10000373',
                '10000374',
                '10000375',
                '10000376',
                '10000377',
                '10000378',
                '10000379',
                '10000380',
                '10000381',
                '10000382',
                '10000383',
                '10000384',
                '10000385',
                '10000386',
                '10000387',
                '10000388',
                '10000389',
                '10000390',
                '10000391',
                '10000392',
                '10000393',
                '10000394'
                )`)


            if (detailDataForBarCode.length) {
                for (const item of detailDataForBarCode) {
                    const barcode = Number(item.BaseBarCode)
                    let count = 0;
                    count = item.Quantity;
                    for (j = 0; j < count; j++) {
                        const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','2023-12-06 16:08:59','${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '2023-12-06 16:08:59')`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));



            response.message = "data save sucessfully"
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getInvoicePayment: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;

            let { PaymentType, PayeeName, PurchaseID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.PaymentType) return res.send({ message: "Invalid Query Data" })
            if (!Body.PayeeName) return res.send({ message: "Invalid Query Data" })
            if (!Body.PurchaseID) return res.send({ message: "Invalid Query Data" })

            let qry = ``
            let totalDueAmount = 0
            let totalCreditAmount = 0
            let creditCreditAmount = 0
            let creditDebitAmount = 0

            if (PaymentType === 'Supplier') {

                const [credit] = await connection.query(`select SUM(vendorcredit.Amount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${PayeeName}`);

                const [debit] = await connection.query(`select SUM(vendorcredit.PaidAmount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID}  and SupplierID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await connection.query(`select SUM(purchasemasternew.DueAmount) as due from purchasemasternew where CompanyID = ${CompanyID} and SupplierID = ${PayeeName} and PStatus = 0 and Status = 1 and ID = ${PurchaseID}`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }


                qry = `select supplier.Name as PayeeName, shop.Name as ShopName, shop.AreaName, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.GSTNo, purchasemasternew.DiscountAmount, purchasemasternew.GSTAmount, purchasemasternew.PaymentStatus, purchasemasternew.TotalAmount, purchasemasternew.DueAmount, ( purchasemasternew.TotalAmount - purchasemasternew.DueAmount) as PaidAmount, purchasemasternew.ID  from purchasemasternew left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.SupplierID = ${PayeeName} and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.PaymentStatus = 'Unpaid' and purchasemasternew.DueAmount != 0 and purchasemasternew.Status = 1 and purchasemasternew.ID = ${PurchaseID}`

                const [data] = await connection.query(qry)
                response.data = data


            }

            totalCreditAmount = creditCreditAmount - creditDebitAmount

            response.totalCreditAmount = totalCreditAmount
            response.totalDueAmount = totalDueAmount
            response.message = "data fetch sucessfully"
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    paymentHistoryByPurchaseID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            const { SupplierID, PurchaseID } = req.body

            if (SupplierID === null || SupplierID === undefined || SupplierID == 0 || SupplierID === "") return res.send({ message: "Invalid Query Data" })
            if (PurchaseID === null || PurchaseID === undefined || PurchaseID == 0 || PurchaseID === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await connection.query(`select paymentdetail.amount as Amount, paymentmaster.PaymentDate as PaymentDate, paymentmaster.PaymentType AS PaymentType,paymentmaster.PaymentMode as PaymentMode, paymentmaster.CardNo as CardNo, paymentmaster.PaymentReferenceNo as PaymentReferenceNo, paymentdetail.Credit as Type from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.CustomerID = ${SupplierID} and paymentmaster.PaymentType = 'Supplier' and paymentmaster.Status = 1 and paymentdetail.BillMasterID = ${PurchaseID}`)

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getCountInventoryReport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "OpeningStock": 0, "AddPurchase": 0, "DeletePurchase": 0, "AddSale": 0, "DeleteSale": 0, "OtherDeleteStock": 0, "InitiateTransfer": 0, "CancelTransfer": 0, "AcceptTransfer": 0, "ClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const { ShopID, DateParam } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (DateParam === null || DateParam === undefined || DateParam == 0 || DateParam === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await connection.query(`SELECT creport.CompanyID, creport.ShopID, creport.DATE, creport.OpeningStock, creport.AddPurchase, creport.DeletePurchase, creport.AddSale, creport.DeleteSale, creport.OtherDeleteStock, creport.InitiateTransfer, creport.CancelTransfer, creport.AcceptTransfer, creport.ClosingStock, CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName FROM creport left join shop on shop.ID = creport.ShopID WHERE creport.CompanyID = ${CompanyID} and creport.ShopID IN (${ShopID})  ${DateParam}  `)

            if (data.length) {
                response.calculation.OpeningStock = data[0].OpeningStock
                response.calculation.ClosingStock = data[data.length - 1].ClosingStock
            }

            let [datum] = await connection.query(`SELECT SUM(AddPurchase) AS TotalAddPurchase,
            SUM(DeletePurchase) AS TotalDeletePurchase,
            SUM(AddSale) AS TotalAddSale,
            SUM(DeleteSale) AS TotalDeleteSale,
            SUM(OtherDeleteStock) AS TotalOtherDeleteStock,
            SUM(InitiateTransfer) AS TotalInitiateTransfer,
            SUM(CancelTransfer) AS TotalCancelTransfer,
            SUM(AcceptTransfer) AS TotalAcceptTransfer FROM creport WHERE CompanyID = ${CompanyID} and ShopID IN (${ShopID})  ${DateParam}  `)

            if (datum) {
                response.calculation.AddPurchase = datum[0].TotalAddPurchase
                response.calculation.DeletePurchase = datum[0].TotalDeletePurchase
                response.calculation.AddSale = datum[0].TotalAddSale
                response.calculation.DeleteSale = datum[0].TotalDeleteSale
                response.calculation.OtherDeleteStock = datum[0].TotalOtherDeleteStock
                response.calculation.InitiateTransfer = datum[0].TotalInitiateTransfer
                response.calculation.CancelTransfer = datum[0].TotalCancelTransfer
                response.calculation.AcceptTransfer = datum[0].TotalAcceptTransfer
            }

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getCountInventoryReportMonthWise: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "OpeningStock": 0, "AddPurchase": 0, "DeletePurchase": 0, "AddSale": 0, "DeleteSale": 0, "OtherDeleteStock": 0, "InitiateTransfer": 0, "CancelTransfer": 0, "AcceptTransfer": 0, "ClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const { ShopID, FromDate, ToDate } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await connection.query(`SELECT YEAR(c.DATE) AS YEAR, MONTH(c.DATE) AS MONTH, c.CompanyID, c.ShopID, (SELECT OpeningStock FROM creport WHERE creport.CompanyID = ${CompanyID} AND creport.ShopID IN (${ShopID}) AND YEAR(creport.DATE) = YEAR(c.DATE) AND MONTH(creport.DATE) = MONTH(c.DATE) AND creport.DATE BETWEEN '${FromDate}' AND '${ToDate}' LIMIT 1) AS OpeningStock, SUM(c.AddPurchase) AS TotalAddPurchase, SUM(c.DeletePurchase) AS TotalDeletePurchase, SUM(c.AddSale) AS TotalAddSale, SUM(c.DeleteSale) AS TotalDeleteSale, SUM(c.OtherDeleteStock) AS TotalOtherDeleteStock, SUM(c.InitiateTransfer) AS TotalInitiateTransfer, SUM(c.CancelTransfer) AS TotalCancelTransfer, SUM(c.AcceptTransfer) AS TotalAcceptTransfer, (SELECT ClosingStock FROM creport WHERE creport.CompanyID = ${CompanyID} AND creport.ShopID IN (${ShopID}) AND YEAR(creport.DATE) = YEAR(c.DATE) AND MONTH(creport.DATE) = MONTH(c.DATE) AND DATE BETWEEN '${FromDate}' AND '${ToDate}' ORDER BY creport.DATE DESC LIMIT 1) AS ClosingStock, CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName FROM creport c LEFT JOIN shop ON shop.ID = c.ShopID WHERE c.CompanyID = ${CompanyID} AND c.ShopID IN (${ShopID}) AND c.DATE BETWEEN '${FromDate}' AND '${ToDate}' GROUP BY YEAR(c.DATE), MONTH(c.DATE), c.CompanyID, c.ShopID ORDER BY YEAR, MONTH;
            `)


            if (data.length) {
                response.calculation.OpeningStock = data[0].OpeningStock
                response.calculation.ClosingStock = data[data.length - 1].ClosingStock
            }

            if (data) {
                for (let item of data) {
                    item.MonthYear = `${numberToMonth(item.MONTH)}-${item.YEAR}`
                    response.calculation.AddPurchase += Number(item.TotalAddPurchase)
                    response.calculation.DeletePurchase += Number(item.TotalDeletePurchase)
                    response.calculation.AddSale += Number(item.TotalAddSale)
                    response.calculation.DeleteSale += Number(item.TotalDeleteSale)
                    response.calculation.OtherDeleteStock += Number(item.TotalOtherDeleteStock)
                    response.calculation.InitiateTransfer += Number(item.TotalInitiateTransfer)
                    response.calculation.CancelTransfer += Number(item.TotalCancelTransfer)
                    response.calculation.AcceptTransfer += Number(item.TotalAcceptTransfer)

                }
            }

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getAmountInventoryReportMonthWise: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "AmtOpeningStock": 0, "AmtAddPurchase": 0, "AmtDeletePurchase": 0, "AmtAddSale": 0, "AmtDeleteSale": 0, "AmtOtherDeleteStock": 0, "AmtInitiateTransfer": 0, "AmtCancelTransfer": 0, "AmtAcceptTransfer": 0, "AmtClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const { ShopID, FromDate, ToDate } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await connection.query(`SELECT YEAR(c.DATE) AS YEAR, MONTH(c.DATE) AS MONTH, c.CompanyID, c.ShopID, (SELECT AmtOpeningStock FROM creport WHERE creport.CompanyID = ${CompanyID} AND creport.ShopID IN (${ShopID}) AND YEAR(creport.DATE) = YEAR(c.DATE) AND MONTH(creport.DATE) = MONTH(c.DATE) AND creport.DATE BETWEEN '${FromDate}' AND '${ToDate}' LIMIT 1) AS AmtOpeningStock, SUM(c.AmtAddPurchase) AS TotalAddPurchase, SUM(c.AmtDeletePurchase) AS TotalDeletePurchase, SUM(c.AmtAddSale) AS TotalAddSale, SUM(c.AmtDeleteSale) AS TotalDeleteSale, SUM(c.AmtOtherDeleteStock) AS TotalOtherDeleteStock, SUM(c.AmtInitiateTransfer) AS TotalInitiateTransfer, SUM(c.AmtCancelTransfer) AS TotalCancelTransfer, SUM(c.AmtAcceptTransfer) AS TotalAcceptTransfer, (SELECT AmtClosingStock FROM creport WHERE creport.CompanyID = ${CompanyID} AND creport.ShopID IN (${ShopID}) AND YEAR(creport.DATE) = YEAR(c.DATE) AND MONTH(creport.DATE) = MONTH(c.DATE) AND creport.DATE BETWEEN '${FromDate}' AND '${ToDate}' ORDER BY creport.DATE DESC LIMIT 1) AS AmtClosingStock, CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName FROM creport c LEFT JOIN shop ON shop.ID = c.ShopID WHERE c.CompanyID = ${CompanyID} AND c.ShopID IN (${ShopID}) AND c.DATE BETWEEN '${FromDate}' AND '${ToDate}' GROUP BY YEAR(c.DATE), MONTH(c.DATE), c.CompanyID, c.ShopID ORDER BY YEAR, MONTH;
            `)

            if (data.length) {
                response.calculation.AmtOpeningStock = data[0].AmtOpeningStock
                response.calculation.AmtClosingStock = data[data.length - 1].AmtClosingStock
            }

            if (data) {
                for (let item of data) {
                    item.MonthYear = `${numberToMonth(item.MONTH)}-${item.YEAR}`
                    response.calculation.AmtAddPurchase += Number(item.TotalAddPurchase)
                    response.calculation.AmtDeletePurchase += Number(item.TotalDeletePurchase)
                    response.calculation.AmtAddSale += Number(item.TotalAddSale)
                    response.calculation.AmtDeleteSale += Number(item.TotalDeleteSale)
                    response.calculation.AmtOtherDeleteStock += Number(item.TotalOtherDeleteStock)
                    response.calculation.AmtInitiateTransfer += Number(item.TotalInitiateTransfer)
                    response.calculation.AmtCancelTransfer += Number(item.TotalCancelTransfer)
                    response.calculation.AmtAcceptTransfer += Number(item.TotalAcceptTransfer)

                }
            }

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getAmountInventoryReport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "AmtOpeningStock": 0, "AmtAddPurchase": 0, "AmtDeletePurchase": 0, "AmtAddSale": 0, "AmtDeleteSale": 0, "AmtOtherDeleteStock": 0, "AmtInitiateTransfer": 0, "AmtCancelTransfer": 0, "AmtAcceptTransfer": 0, "AmtClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const { ShopID, DateParam } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (DateParam === null || DateParam === undefined || DateParam == 0 || DateParam === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await connection.query(`SELECT creport.CompanyID, creport.ShopID, creport.DATE, creport.AmtOpeningStock, creport.AmtAddPurchase, creport.AmtDeletePurchase, creport.AmtAddSale, creport.AmtDeleteSale, creport.AmtOtherDeleteStock, creport.AmtInitiateTransfer, creport.AmtCancelTransfer, creport.AmtAcceptTransfer, creport.AmtClosingStock, CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName FROM creport left join shop on shop.ID = creport.ShopID WHERE creport.CompanyID = ${CompanyID} and creport.ShopID IN (${ShopID})  ${DateParam}  `)

            if (data.length) {
                response.calculation.AmtOpeningStock = data[0].AmtOpeningStock
                response.calculation.AmtClosingStock = data[data.length - 1].AmtClosingStock
            }

            let [datum] = await connection.query(`SELECT SUM(AmtAddPurchase) AS TotalAddPurchase,
            SUM(AmtDeletePurchase) AS TotalDeletePurchase,
            SUM(AmtAddSale) AS TotalAddSale,
            SUM(AmtDeleteSale) AS TotalDeleteSale,
            SUM(AmtOtherDeleteStock) AS TotalOtherDeleteStock,
            SUM(AmtInitiateTransfer) AS TotalInitiateTransfer,
            SUM(AmtCancelTransfer) AS TotalCancelTransfer,
            SUM(AmtAcceptTransfer) AS TotalAcceptTransfer FROM creport WHERE CompanyID = ${CompanyID} and ShopID IN (${ShopID})  ${DateParam}  `)

            if (datum) {
                response.calculation.AmtAddPurchase = datum[0].TotalAddPurchase
                response.calculation.AmtDeletePurchase = datum[0].TotalDeletePurchase
                response.calculation.AmtAddSale = datum[0].TotalAddSale
                response.calculation.AmtDeleteSale = datum[0].TotalDeleteSale
                response.calculation.AmtOtherDeleteStock = datum[0].TotalOtherDeleteStock
                response.calculation.AmtInitiateTransfer = datum[0].TotalInitiateTransfer
                response.calculation.AmtCancelTransfer = datum[0].TotalCancelTransfer
                response.calculation.AmtAcceptTransfer = datum[0].TotalAcceptTransfer
            }

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    updateProductPrice: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const { ProductData } = req.body

            if (!ProductData) return res.send({ message: "Invalid Query Data" })
            if (ProductData.length === 0) return res.send({ message: "Invalid Query Data" })

            for (let item of ProductData) {
                if (!item.PurchaseDetailID || item.PurchaseDetailID === 0 || item.PurchaseDetailID === null) {
                    return res.send({ message: "Invalid Query PurchaseDetailID" })
                }
                if (!item.Count || item.Count === 0 || item.Count === null) {
                    return res.send({ message: "Invalid Query Count/Available Barcode" })
                }

                if (!item.Barcode || item.Barcode === 0 || item.Barcode === null || item.Barcode === '') {
                    return res.send({ message: "Invalid Query Barcode no" })
                }
                if (item.RetailPrice === undefined || item.RetailPrice === null || item.RetailPrice === '') {
                    return res.send({ message: "Invalid Query RetailPrice" })
                }
                if (item.WholeSalePrice === undefined || item.WholeSalePrice === null || item.WholeSalePrice === '') {
                    return res.send({ message: "Invalid Query WholeSalePrice" })
                }

                let [fetchBarcode] = await connection.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and PurchaseDetailID = ${item.PurchaseDetailID} and ShopID = ${item.ShopID} and Status = 1 and CurrentStatus = 'Available' and Barcode = '${item.Barcode}'`)

                if (fetchBarcode.length !== item.Count) {
                    return res.send({ message: `Invalid Query Count/Available Barcode :- ${item.Barcode}` })
                }

                const [update] = await connection.query(`update barcodemasternew set RetailPrice = ${item.RetailPrice}, WholeSalePrice = ${item.WholeSalePrice}, UpdatedOn=now() where CompanyID = ${CompanyID} and PurchaseDetailID = ${item.PurchaseDetailID} and Status = 1 and CurrentStatus = 'Available' and Barcode = '${item.Barcode}' `)

            }


            response.data = []
            response.message = "data update successfully";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getVendorDuePayment: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalQty": 0,
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "totalDiscount": 0,
                    "totalSubTotal": 0,
                    "totalDueAmount": 0,
                    "totalPaidAmount": 0
                }]
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })
            let qry = `SELECT purchasemasternew.*, CONCAT(ss.Name, '(', ss.AreaName, ')') AS ShopName, s.Name AS SupplierName FROM purchasemasternew LEFT JOIN shop AS ss ON ss.ID = purchasemasternew.ShopID LEFT JOIN supplier AS s ON s.ID = purchasemasternew.SupplierID WHERE purchasemasternew.CompanyID = ${CompanyID} AND purchasemasternew.Status = 1 AND s.Name != 'PreOrder Supplier'  ${Parem}`;

            let [data] = await connection.query(qry);

            let [datum] = await connection.query(`SELECT SUM(purchasemasternew.Quantity) AS totalQty, SUM(purchasemasternew.GSTAmount) AS totalGstAmount, SUM(purchasemasternew.TotalAmount) AS totalAmount, SUM(purchasemasternew.DiscountAmount) AS totalDiscount, SUM(purchasemasternew.SubTotal) AS totalSubTotal, SUM(purchasemasternew.DueAmount) AS totalDueAmount FROM purchasemasternew LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE purchasemasternew.Status = 1 AND supplier.Name != 'PreOrder Supplier' AND purchasemasternew.CompanyID = ${CompanyID}  ${Parem}`)

            if (datum) {
                response.calculation[0].totalQty = datum[0].totalQty
                response.calculation[0].totalGstAmount = datum[0].totalGstAmount
                response.calculation[0].totalAmount = datum[0].totalAmount
                response.calculation[0].totalDiscount = datum[0].totalDiscount
                response.calculation[0].totalSubTotal = datum[0].totalSubTotal
                response.calculation[0].totalDueAmount = datum[0].totalDueAmount
                response.calculation[0].totalPaidAmount = response.calculation[0].totalAmount - response.calculation[0].totalDueAmount
            }

            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },

    getPhysicalStockProductList: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalAvailableQty": 0,
                    "totalPhysicalQty": 0
                }]
            }
            const { Parem, Productsearch } = req.body;

            console.log("getPhysicalStockProductList =====>", req.body);
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and barcodemasternew.ShopID = ${shopid}`
                }
            }

            if (shopid === 0 || shopid === '0' || shopid === 'all') {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT 0 as PhysicalAvailable,0 as QtyDiff, COUNT(barcodemasternew.ID) AS Available,purchasedetailnew.ID as PurchaseDetailID ,supplier.Name AS SupplierName,CONCAT(shop.Name, ' ', IFNULL(CONCAT('(', shop.AreaName, ')'), '()')) AS ShopName, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeID,purchasedetailnew.ProductTypeName,purchasedetailnew.WholeSalePrice,purchasedetailnew.RetailPrice, barcodemasternew.Barcode,barcodemasternew.Status, barcodemasternew.CurrentStatus as ProductStatus, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} ${searchString} AND purchasedetailnew.Status = 1 and barcodemasternew.CurrentStatus = 'Available' and supplier.Name != 'PreOrder Supplier'  ` + Parem + " Group By barcodemasternew.Barcode, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";

            console.log(qry);

            let [data] = await connection.query(qry);

            if (data.length) {
                for (const item of data) {
                    response.calculation[0].totalAvailableQty += item.Available || 0
                }
            }

            response.message = "data fetch successfully";
            response.data = data
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    savePhysicalStockProduct: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const { xMaster, xDetail } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            if (!xDetail.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.TotalAvailableQty === "" || xMaster.TotalAvailableQty === undefined || xMaster.TotalAvailableQty === 0) {
                return res.send({ message: "Invalid Query Data" })
            }

            const [saveMaster] = await connection.query(`INSERT INTO physicalstockcheckmaster(CompanyID, ShopID, InvoiceNo, InvoiceDate, TotalAvailableQty, TotalPhysicalQty, TotalQtyDiff, Remark, Status, CreatedBy,CreatedOn) values(${CompanyID}, ${shopid}, '${xMaster.InvoiceNo}', '${xMaster.InvoiceDate}', ${xMaster.TotalAvailableQty},${xMaster.TotalPhysicalQty}, ${xMaster.TotalQtyDiff}, '${xMaster.Remark}', 1,${LoggedOnUser}, now())`);

            // insertId

            for (let item of xDetail) {
                const [saveDetail] = await connection.query(`INSERT INTO physicalstockcheckdetail(MasterID,CompanyID,ShopID,ProductTypeID,ProductTypeName,ProductName,Barcode,RetailPrice,WholeSalePrice,AvailableQty,PhysicalAvailableQty,QtyDiff, Status,CreatedBy,CreatedOn) values(${saveMaster.insertId},${CompanyID},${shopid},${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}','${item.Barcode}',${item.RetailPrice},${item.WholeSalePrice},${item.AvailableQty},${item.PhysicalAvailableQty},${item.QtyDiff}, 1,${LoggedOnUser}, now())`)
            }

            response.message = "data save successfully";
            response.data = saveMaster.insertId
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    getPhysicalStockProductByID: async (req, res, next) => {
        let connection;
        try {

            const response = { result: { xMaster: null, xDetail: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [fetchMaster] = await connection.query(`select * from physicalstockcheckmaster  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} `)

            const [fetchDetail] = await connection.query(`select *, AvailableQty AS Available,PhysicalAvailableQty AS PhysicalAvailable  from physicalstockcheckdetail where MasterID = ${ID} and CompanyID = ${CompanyID}  order by physicalstockcheckdetail.ID desc`)

            response.message = "data fetch sucessfully"
            response.result.xMaster = fetchMaster
            response.result.xDetail = fetchDetail
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    getPhysicalStockCheckList: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;
            let shopId = ``
            if (shopid !== 0) {
                shopId = `and physicalstockcheckmaster.ShopID = ${shopid}`
            }

            let qry = `select physicalstockcheckmaster.*, users1.Name as CreatedPerson,CONCAT(shop.Name, ' ', IFNULL(CONCAT('(', shop.AreaName, ')'), '()')) AS ShopName, users.Name as UpdatedPerson from physicalstockcheckmaster left join user as users1 on users1.ID = physicalstockcheckmaster.CreatedBy left join user as users on users.ID = physicalstockcheckmaster.UpdatedBy left join shop on shop.ID = physicalstockcheckmaster.ShopID where physicalstockcheckmaster.Status = 1 and physicalstockcheckmaster.CompanyID = ${CompanyID} ${shopId} order by physicalstockcheckmaster.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getPhysicalStockCheckReport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: [{
                    TotalAvailableQty: 0,
                    TotalPhysicalQty: 0,
                    TotalDiffQty: 0
                }],
            }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `select physicalstockcheckmaster.*, users1.Name as CreatedPerson,CONCAT(shop.Name, ' ', IFNULL(CONCAT('(', shop.AreaName, ')'), '()')) AS ShopName, users.Name as UpdatedPerson from physicalstockcheckmaster left join user as users1 on users1.ID = physicalstockcheckmaster.CreatedBy left join user as users on users.ID = physicalstockcheckmaster.UpdatedBy left join shop on shop.ID = physicalstockcheckmaster.ShopID where physicalstockcheckmaster.Status = 1 and physicalstockcheckmaster.CompanyID = ${CompanyID} ` + Parem;

            let [data] = await connection.query(qry);


            if (data.length) {
                for (let item of data) {
                    response.calculation[0].TotalAvailableQty += Number(item.TotalAvailableQty);
                    response.calculation[0].TotalPhysicalQty += Number(item.TotalPhysicalQty);
                    response.calculation[0].TotalDiffQty += Number(item.TotalQtyDiff);
                }
            }


            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    searchByFeildPhysicalStockCheckList: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shopId = ``

            if (shopid !== 0) {
                shopId = ` and physicalstockcheckmaster.ShopID = ${shopid}`
            }

            let qry = `select physicalstockcheckmaster.*, users1.Name as CreatedPerson,CONCAT(shop.Name, ' ', IFNULL(CONCAT('(', shop.AreaName, ')'), '()')) AS ShopName, users.Name as UpdatedPerson from physicalstockcheckmaster left join user as users1 on users1.ID = physicalstockcheckmaster.CreatedBy left join user as users on users.ID = physicalstockcheckmaster.UpdatedBy left join shop on shop.ID = physicalstockcheckmaster.ShopID where physicalstockcheckmaster.Status = 1 and physicalstockcheckmaster.CompanyID = ${CompanyID} ${shopId} and physicalstockcheckmaster.InvoiceNo like '%${Body.searchQuery}%'`

            let [data] = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    updatePhysicalStockProduct: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const { xMaster, xDetail } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            if (!xDetail.length) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!xMaster.ID) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (xMaster.TotalAvailableQty === "" || xMaster.TotalAvailableQty === undefined || xMaster.TotalAvailableQty === 0) {
                return res.send({ message: "Invalid Query Data" })
            }

            const [doesExist] = await connection.query(`select * from physicalstockcheckmaster where CompanyID = ${CompanyID} and ShopID = ${shopid} and Status = 1 and ID = ${xMaster.ID}`);

            if (!doesExist.length) {
                return res.send({ message: "Invalid ID Data" })
            }

            const [updateMaster] = await connection.query(`Update physicalstockcheckmaster set InvoiceNo='${xMaster.InvoiceNo}', InvoiceDate='${xMaster.InvoiceDate}', TotalAvailableQty=${xMaster.TotalAvailableQty}, TotalPhysicalQty=${xMaster.TotalPhysicalQty}, TotalQtyDiff=${xMaster.TotalQtyDiff}, Remark='${xMaster.Remark}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${xMaster.ID}`);

            // insertId

            for (let item of xDetail) {
                const [updateDetail] = await connection.query(`update physicalstockcheckdetail set AvailableQty=${item.AvailableQty},PhysicalAvailableQty=${item.PhysicalAvailableQty},QtyDiff=${item.QtyDiff} where ID = ${item.ID} and CompanyID = ${CompanyID}`)
            }

            response.message = "data update successfully";
            response.data = xMaster.ID
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },


    // location set api's

    getLocationStockProductList: async (req, res, next) => {
        let connection;
        try {

            const response = {
                calculation: [{
                    TotalQty: 0,
                    LocatedQty: 0,
                    UnlocatedQty: 0
                }],
                data: null, success: true, message: "",
            }
            const { Parem, Productsearch } = req.body;
            // const CompanyID = 1;
            // const shopid = 1;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            if (shopid === 0 || shopid === '0' || shopid === 'all') {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let searchString = ``
            if (Productsearch) {
                searchString = ` and purchasedetailnew.ProductName like '%${Productsearch}%'`
            }

            qry = `SELECT COUNT(barcodemasternew.ID) AS TotalQty, 0 as Located, COUNT(barcodemasternew.ID) AS Unloacted,purchasedetailnew.ID as PurchaseDetailID ,supplier.Name AS SupplierName, shop.ID as ShopID, CONCAT(shop.Name, ' ', IFNULL(CONCAT('(', shop.AreaName, ')'), '()')) AS ShopName, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeID,purchasedetailnew.ProductTypeName,purchasedetailnew.WholeSalePrice,purchasedetailnew.RetailPrice, barcodemasternew.Barcode,barcodemasternew.Status, barcodemasternew.CurrentStatus as ProductStatus, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} ${searchString} AND purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier'  ` + Parem + " GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID, barcodemasternew.CurrentStatus " + " HAVING barcodemasternew.Status = 1 and barcodemasternew.CurrentStatus = 'Available'";

            console.log(qry, '================================================================log')
            let [data] = await connection.query(qry);

            if (data.length) {
                for (let item of data) {
                    const [fetch] = await connection.query(`select SUM(Qty) as Located from locationmaster where CompanyID = ${CompanyID} and ShopID = ${shopid} and Barcode = '${item.Barcode}' and Status = 1`);

                    if (fetch[0].Located !== null) {
                        item.Located = Number(fetch[0].Located);
                        item.Unloacted = item.TotalQty - item.Located;
                    }

                    response.calculation[0].TotalQty += item.TotalQty
                    response.calculation[0].LocatedQty += item.Located
                    response.calculation[0].UnlocatedQty += item.Unloacted

                }
            }

            response.message = "data fetch successfully";
            response.data = data
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    saveProductLocation: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const {
                ProductTypeID,
                ProductTypeName,
                ProductName,
                Barcode,
                LocationID,
                Qty
            } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            if (shopid === 0 || shopid === '0' || shopid === 'all') {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let [data] = await connection.query(`INSERT INTO locationmaster(CompanyID, ShopID, ProductTypeID, ProductTypeName, ProductName, Barcode, LocationID, Qty, Status, CreatedBy, CreatedOn, UpdatedBy, UpdatedOn)values(${CompanyID}, ${shopid}, ${ProductTypeID}, '${ProductTypeName}','${ProductName}','${Barcode}',${LocationID}, ${Qty}, 1, ${LoggedOnUser}, now(), ${LoggedOnUser}, now())`);

            response.message = "data save successfully";
            response.data = data.insertId
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    updateProductLocation: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const {
                ID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                Barcode,
                LocationID,
                Qty
            } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            if (shopid === 0 || shopid === '0' || shopid === 'all') {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let [data] = await connection.query(`UPDATE locationmaster set LocationID = ${LocationID}, Qty = ${Qty}, UpdatedBy= ${LoggedOnUser}, UpdatedOn = now() where ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`);

            response.message = "data update successfully";
            response.data = ID
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    deleteProductLocation: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: ""
            }
            const {
                ID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                Barcode,
                LocationID,
                Qty
            } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            if (shopid === 0 || shopid === '0' || shopid === 'all') {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let [data] = await connection.query(`UPDATE locationmaster set Status = 0, UpdatedBy= ${LoggedOnUser}, UpdatedOn = now() where ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`);

            response.message = "data delete successfully";
            response.data = ID
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    getProductLocationByBarcodeNumber: async (req, res, next) => {
        let connection;
        try {

            const response = {
                calculation: [{
                    TotalQty: 0,
                    LocatedQty: 0,
                    UnlocatedQty: 0
                }],
                data: null, success: false, message: "",
            }
            const {
                Barcode
            } = req.body;
            console.log(Barcode, '===============================Barcode');

            // const CompanyID = 1;
            // const shopid = 1;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            if (shopid === 0 || shopid === '0' || shopid === 'all') {
                return res.send({ success: false, message: "Invalid Query Data" })
            }

            let [data] = await connection.query(`select locationmaster.*, supportmaster.Name as LocationName from locationmaster left join supportmaster on supportmaster.ID = locationmaster.LocationID  where locationmaster.CompanyID = ${CompanyID} and locationmaster.ShopID = ${shopid} and locationmaster.Barcode = '${Barcode}' and locationmaster.Status = 1 and locationmaster.Qty > 0`);
            console.log(data);

            if (data.length) {
                const getProductQty = await getProductCountByBarcodeNumber(data[0].Barcode, CompanyID, shopid);
                response.calculation[0].TotalQty = getProductQty;
                const getLocatedQty = await getLocatedProductCountByBarcodeNumber(data[0].Barcode, CompanyID, shopid)
                if (getLocatedQty) {
                    response.calculation[0].LocatedQty = getLocatedQty
                }
                response.calculation[0].UnlocatedQty = response.calculation[0].TotalQty - response.calculation[0].LocatedQty
                response.success = true;

            }

            response.message = "data fetch successfully";
            response.data = data
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    getPurchaseReportMonthYearWise: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: {
                    "Amount": 0,
                    "Paid": 0,
                    "Balance": 0,
                    "BillCount": 0,
                    "ProductQty": 0,
                }
            }
            const { Parem, Type } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            let qry = ``

            if (Type === 'YearWise') {
                qry = `SELECT DATE_FORMAT(PurchaseDate, '%Y') AS YEAR, ROUND(SUM(TotalAmount), 2) AS Amount, ROUND(SUM(TotalAmount) - SUM(DueAmount), 2) AS Paid, ROUND(SUM(DueAmount), 2) AS Balance, COUNT(ID) AS BillCount, SUM(Quantity) AS ProductQty FROM purchasemasternew WHERE purchasemasternew.status = 1 AND purchasemasternew.CompanyID = ${CompanyID} ${Parem} GROUP BY DATE_FORMAT(PurchaseDate, '%Y') ORDER BY DATE_FORMAT(PurchaseDate, '%Y')`
            } else if (Type === 'YearMonthWise') {
                qry = `SELECT DATE_FORMAT(PurchaseDate, '%M-%Y') AS MonthYear, ROUND(SUM(TotalAmount), 2) AS Amount, ROUND(SUM(TotalAmount), 2) - ROUND(SUM(DueAmount),2) AS Paid, ROUND(SUM(DueAmount),2) AS Balance, COUNT(ID) AS BillCount, SUM(Quantity) AS ProductQty, GROUP_CONCAT(ID) AS PurchaseMasterIds FROM purchasemasternew WHERE purchasemasternew.status = 1 AND purchasemasternew.CompanyID = ${CompanyID} ${Parem} GROUP BY DATE_FORMAT(PurchaseDate, '%M - %Y') ORDER BY DATE_FORMAT(PurchaseDate, '%Y-%m')`;
            } else {
                qry = `SELECT DATE_FORMAT(PurchaseDate, '%M-%Y') AS MonthYear, ROUND(SUM(TotalAmount), 2) AS Amount, ROUND(SUM(TotalAmount), 2) - ROUND(SUM(DueAmount),2) AS Paid, ROUND(SUM(DueAmount),2) AS Balance, COUNT(ID) AS BillCount, SUM(Quantity) AS ProductQty, GROUP_CONCAT(ID) AS PurchaseMasterIds FROM purchasemasternew WHERE purchasemasternew.status = 1 AND purchasemasternew.CompanyID = ${CompanyID} ${Parem} GROUP BY DATE_FORMAT(PurchaseDate, '%M - %Y') ORDER BY DATE_FORMAT(PurchaseDate, '%Y-%m')`;
            }


            let [data] = await connection.query(qry);

            if (data.length) {
                for (let item of data) {
                    response.calculation.Amount += item.Amount
                    response.calculation.Paid += item.Paid
                    response.calculation.Balance += item.Balance
                    response.calculation.BillCount += item.BillCount
                    response.calculation.ProductQty += item.ProductQty
                }
            }

            response.data = data
            response.message = "success";
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    getPurchaseReportMonthYearWiseDetails: async (req, res, next) => {
        let connection;
        try {

            const response = {
                data: null, success: true, message: "", calculation: {
                    "Amount": 0,
                    "Paid": 0,
                    "Balance": 0
                }
            }
            const { PurchaseMasterIds } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            qry = `SELECT DATE(purchasemasternew.PurchaseDate) AS PurchaseDate, ROUND(SUM(purchasemasternew.TotalAmount),2) AS Amount, ROUND(SUM(purchasemasternew.TotalAmount - purchasemasternew.DueAmount),2) AS Paid, ROUND(SUM(purchasemasternew.DueAmount),2) AS Balance FROM purchasemasternew WHERE purchasemasternew.status = 1 AND purchasemasternew.CompanyID = ${CompanyID} AND purchasemasternew.ID IN (${PurchaseMasterIds}) GROUP BY DATE(purchasemasternew.PurchaseDate)`;

            let [data] = await connection.query(qry);

            if (data.length) {
                for (let item of data) {
                    response.calculation.Amount += item.Amount
                    response.calculation.Paid += item.Paid
                    response.calculation.Balance += item.Balance
                }
            }

            response.data = data
            response.message = "success";
            return res.send(response);

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
}
