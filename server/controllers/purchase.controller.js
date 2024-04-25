const createError = require('http-errors')
const _ = require("lodash")
const { generateBarcode, generateUniqueBarcode, doesExistProduct, shopID, gstDetail, doesExistProduct2, update_c_report_setting, update_c_report, amt_update_c_report, getTotalAmountByBarcode } = require('../helpers/helper_function')
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
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";
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


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }

            const purchaseDetail = JSON.parse(PurchaseDetail).reverse();

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
            const [savePurchase] = await mysql2.pool.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,0,${purchase.TotalAmount}, ${LoggedOnUser}, '${req.headers.currenttime}')`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            console.log("purchaseDetail ===========>", purchaseDetail);
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
                    baseBarCode = await generateBarcode(CompanyID, 'SB')
                }

                // update c report setting

                const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                const var_update_c_report = await update_c_report(CompanyID, shopid, item.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, item.TotalAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)


            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            //  save barcode

            let [detailDataForBarCode] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

            if (detailDataForBarCode.length) {
                for (const item of detailDataForBarCode) {
                    const barcode = Number(item.BaseBarCode)
                    let count = 0;
                    count = item.Quantity;
                    for (j = 0; j < count; j++) {
                        const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','${req.headers.currenttime}','${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '${req.headers.currenttime}')`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));

            //  save charge

            if (Charge.length) {
                for (const c of Charge) {
                    const [saveCharge] = await mysql2.pool.query(`insert into purchasecharge (PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${savePurchase.insertId}, '${c.ChargeType}', ${CompanyID}, '${c.Description}', ${c.Price}, ${c.GSTPercentage}, ${c.GSTAmount}, '${c.GSTType}', ${c.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}')`)
                }

                console.log(connected("Charge Data Save SuccessFUlly !!!"));
            }

            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Debit','${req.headers.currenttime}', 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    update: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";
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

            if (PurchaseMaster.ID === null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)


            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }



            const [doesExistSystemID] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1  and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${PurchaseMaster.ID}`)

            console.log("doesExistSystemID =======>", doesExistSystemID);

            if (doesExistSystemID[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const purchaseDetail = JSON.parse(PurchaseDetail).reverse();

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

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and PaymentType = 'Vendor' and BillMasterID = ${PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Add Product !!, You have Already Paid Amount of this Invoice` })
            }

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}', InvoiceNo = '${PurchaseMaster.InvoiceNo}', PurchaseDate = '${PurchaseMaster.PurchaseDate}' where CompanyID = ${CompanyID}  and ShopID = ${shopid} and ID=${purchase.ID}`)

            console.log(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' , PurchaseDate = '${PurchaseMaster.PurchaseDate}' and ShopID = ${shopid} and ID=${purchase.ID}`);

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            // add new product

            let shouldUpdatePayment = false

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

                    const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)

                    let [detailDataForBarCode] = await mysql2.pool.query(
                        `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
                    );

                    await Promise.all(
                        detailDataForBarCode.map(async (item) => {
                            const barcode = Number(item.BaseBarCode)
                            let count = 0;
                            count = item.Quantity;
                            for (j = 0; j < count; j++) {
                                const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','${req.headers.currenttime}','${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '${req.headers.currenttime}')`)
                            }
                        })
                    )


                }
            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            //  update charges

            if (Charge.length) {
                for (const c of Charge) {
                    if (c.ID === null) {
                        shouldUpdatePayment = true
                        const [saveCharge] = await mysql2.pool.query(`insert into purchasecharge (PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${purchase.ID}, '${c.ChargeType}', ${CompanyID}, '${c.Description}', ${c.Price}, ${c.GSTPercentage}, ${c.GSTAmount}, '${c.GSTType}', ${c.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}')`)
                    }

                }
                console.log(connected("Charge Data Save SuccessFUlly !!!"));
            }

            //  update payment

            if (shouldUpdatePayment) {
                const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].PaymentMasterID}`)

                const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set BillID = '${PurchaseMaster.InvoiceNo}', Amount = 0 , DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' where ID = ${doesCheckPayment[0].ID}`)

                console.log(connected("Payment Update SuccessFUlly !!!"));
            }




            response.message = "data update sucessfully"
            response.data = purchase.ID
            return res.send(response);



        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    getPurchaseById: async (req, res, next) => {
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null, Charge: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternew  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} `)

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnew where  PurchaseID = ${ID} and CompanyID = ${CompanyID}  order by purchasedetailnew.ID desc`)

            const [Charge] = await mysql2.pool.query(`select * from purchasecharge where PurchaseID = ${ID} and CompanyID = ${CompanyID}`)

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
        }
    },
    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.CompanyID = ${CompanyID} ${shopId} order by purchasemasternew.ID desc`
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
    purchaseHistoryBySupplier: async (req, res, next) => {
        try {
            const response = { data: null, sumData: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { SupplierID } = req.body

            if (!SupplierID || SupplierID === undefined || SupplierID === null) return res.send({ message: "Invalid Query Data" })

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.SupplierID = ${SupplierID}  order by purchasemasternew.ID desc`

            let [data] = await mysql2.pool.query(qry);

            let SumQry = `select SUM(purchasemasternew.Quantity) as Quantity, SUM(purchasemasternew.SubTotal) as SubTotal, SUM(purchasemasternew.DiscountAmount) as DiscountAmount, SUM(purchasemasternew.GSTAmount) as GSTAmount, SUM(purchasemasternew.TotalAmount) as TotalAmount , SUM(purchasemasternew.DueAmount) as DueAmount from purchasemasternew  where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.SupplierID = ${SupplierID}  order by purchasemasternew.ID desc`


            let [sumData] = await mysql2.pool.query(SumQry);
            response.message = "data fetch sucessfully"
            response.data = data
            response.sumData = sumData
            return res.send(response);

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

            const [doesExist] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchase doesnot exist from this id " })
            }

            if (doesExist[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }


            const [doesExistProduct] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and PurchaseID = '${Body.ID}'`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await mysql2.pool.query(`update purchasemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    deleteProduct: async (req, res, next) => {
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            // old software condition
            // if (doesExist[0].SystemID !== "0") {
            //     return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            // }

            const [doesExistProductQty] = await mysql2.pool.query(`select * from barcodemasternew where Status = 1 and CompanyID = '${CompanyID}' and PurchaseDetailID = '${Body.ID}' and CurrentStatus = 'Available'`)

            if (doesExist[0].Quantity !== doesExistProductQty.length) {
                // return res.send({ message: `You have product already sold` })
                return res.send({ message: `You can't delete this product` })
            }

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Product !!, You have Already Paid Amount of this Invoice` })
            }




            const [deletePurchasedetail] = await mysql2.pool.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            const [deleteBarcodeMasterNew] = await mysql2.pool.query(`update barcodemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where PurchaseDetailID = ${Body.ID} and CompanyID = ${CompanyID} and CurrentStatus = 'Available'`)

            console.log("Barcode Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount}, DueAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const [fetchPurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)

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
        }
    },

    updateProduct: async (req, res, next) => {
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            if (doesExist[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Product !!, You have Already Paid Amount of this Invoice` })
            }


            const [doesExistProductQty] = await mysql2.pool.query(`select * from barcodemasternew where Status = 1 and CompanyID = '${CompanyID}' and PurchaseDetailID = '${Body.ID}' and CurrentStatus = 'Available'`)

            if (doesExist[0].Quantity !== doesExistProductQty.length) {
                return res.send({ message: `You have product already sold` })
            }

            Body.Multiple = 0
            const doesProduct = await doesExistProduct2(CompanyID, Body)

            if (doesProduct !== 0) {
                return res.send({ message: `Product Already Exist With Same Barcode Number, Please Change Purchase Price OR Retail Price` })
            }

            const uniqueBarcode = await generateUniqueBarcode(CompanyID, Body.PurchaseMaster.SupplierID, Body)


            const [updatePurchasedetail] = await mysql2.pool.query(`update purchasedetailnew set UnitPrice=${Body.UnitPrice}, SubTotal=${Body.SubTotal},DiscountPercentage=${Body.DiscountPercentage},DiscountAmount=${Body.DiscountAmount},GSTPercentage=${Body.GSTPercentage},GSTAmount=${Body.GSTAmount},GSTType='${Body.GSTType}',TotalAmount=${Body.TotalAmount},RetailPrice=${Body.RetailPrice},WholeSalePrice=${Body.WholeSalePrice},BrandType='${Body.BrandType}', UniqueBarcode='${uniqueBarcode}', UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Update SuccessFUlly !!!");


            const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set RetailPrice=${Body.RetailPrice},WholeSalePrice=${Body.WholeSalePrice}, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where PurchaseDetailID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Barcode Update SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const [fetchPurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)

            let totalAmount = Number(Body.TotalAmount) - Number(doesExist[0].TotalAmount)

            const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)


            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data update product sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    deleteCharge: async (req, res, next) => {
        try {
            const response = { result: { Charge: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasecharge where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "charge doesnot exist from this id " })
            }

            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })


            const [doesExistPurchaseMaster] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and ID = ${Body.PurchaseMaster.ID}`)

            if (!doesExistPurchaseMaster.length) {
                return res.send({ message: "purchasemaster doesnot exist from this id " })
            }

            // old software condition
            if (doesExistPurchaseMaster[0].SystemID !== "0") {
                return res.send({ message: `You can't edit this invoice! This is an import invoice from old software, Please contact OPTICAL GURU TEAM` })
            }

            const [doesCheckPayment] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Charge !!, You have Already Paid Amount of this Invoice` })
            }

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const [updatePaymentMaster] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const [fetchPurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail


            const [deleteCharge] = await mysql2.pool.query(`update purchasecharge set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Charge Delete SuccessFUlly !!!");

            const [Charge] = await mysql2.pool.query(`select * from purchasecharge where PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.Charge = Charge;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    purchaseDetailPDF: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const printdata = req.body
            const PurchaseMasters = req.body.PurchaseMaster;
            const PurchaseDetail = req.body.PurchaseDetails;
            const PurchaseCharges = req.body.PurchaseCharge;

            printdata.PurchaseMaster = PurchaseMasters
            printdata.PurchaseDetails = PurchaseDetail
            printdata.PurchaseCharge = PurchaseCharges

            const [shopdetails] = await mysql2.pool.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await mysql2.pool.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [supplier] = await mysql2.pool.query(`select * from supplier where CompanyID = ${CompanyID} and ID = ${PurchaseMasters.SupplierID}`)
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
        }

    },

    purchaseRetrunPDF: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const printdata = req.body
            const PurchaseMasters = req.body.PurchaseMaster;
            const PurchaseDetail = req.body.PurchaseDetails;
            const PurchaseCharges = req.body.PurchaseCharge;

            printdata.PurchaseMaster = PurchaseMasters
            printdata.PurchaseDetails = PurchaseDetail
            console.log(printdata.PurchaseDetails);
            printdata.PurchaseCharge = PurchaseCharges

            const [shopdetails] = await mysql2.pool.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await mysql2.pool.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [supplier] = await mysql2.pool.query(`select * from supplier where CompanyID = ${CompanyID} and ID = ${PurchaseMasters.SupplierID}`)
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
        }

    },

    PrintBarcode: async (req, res, next) => {
        try {
            let bracodeData = req.body
            let modifyBarcode = []

            for (var i = 0; i < bracodeData.Quantity; i++) {
                modifyBarcode.push(bracodeData)
            }

            const printdata = modifyBarcode;

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const [shopdetails] = await mysql2.pool.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await mysql2.pool.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [barcode] = await mysql2.pool.query(`select * from barcodemasternew where CompanyID = ${CompanyID} and PurchaseDetailID = ${printdata[0].ID}`)

            printdata.shopdetails = shopdetails[0]
            printdata[0].BarcodeName = shopdetails[0].BarcodeName
            printdata[0].Barcode = barcode[0].Barcode
            printdata.companysetting = companysetting[0]
            printdata[0].ProductUniqueBarcode = printdata[0].UniqueBarcode;

            let ProductFullName = printdata[0].ProductName;
            let ProductBrandName = printdata[0].ProductName.split("/")[1];
            let ProductModelName = printdata[0].ProductName.split("/")[2]?.substr(0, 15);
            printdata[0].ProductBrandName = ProductBrandName;
            printdata[0].ProductModelName = ProductModelName;
            printdata[0].ProductFullName = ProductFullName;

            printdata.CompanyID = CompanyID;
            printdata.CompanyBarcode = 5
            var file = "barcode" + CompanyID + ".pdf";
            var formatName = "barcode.ejs";
            var appURL = clientConfig.appURL;
            console.log(printdata);
            // var appURL = clientConfig.appURL;
            var fileName = "";
            fileName = "uploads/" + file;
            let url = appURL + "/uploads/" + file;
            let updateUrl = '';
            TinyURL.shorten(url, function (res) {
                updateUrl = res;
            });

            ejs.renderFile(
                path.join(appRoot, "./views/", formatName), { data: printdata },
                (err, data) => {
                    if (err) {
                        res.send(err);
                    } else {
                        let options;
                        if (printdata.CompanyID == 20 || printdata.CompanyID == 19 || printdata.CompanyID == 64) {
                            if (printdata.CompanyBarcode == 5) {
                                options = {
                                    "height": "0.70in",
                                    "width": "4.90in",
                                    // "height": "0.90in",
                                    // "width": "6.00in",
                                };
                            }
                        } else {
                            if (printdata.CompanyBarcode == 5) {
                                options = {
                                    "height": "0.70in",
                                    "width": "4.41in",
                                    // "height": "0.90in",
                                    // "width": "6.00in",
                                };
                            }
                        }

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
        }
    },

    AllPrintBarcode: async (req, res, next) => {
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            let printdata = req.body
            const [shopdetails] = await mysql2.pool.query(`select * from shop where ID = ${shopid}`)

            // printdata.forEach(ele => {
            //     if (ele.ProductTypeName !== 'SUNGLASSES' && ele.ProductTypeName !== 'SUNGLASS' && ele.ProductTypeName !== 'Frames#1') {
            //         let ProductBrandName = ele.ProductName.split("/")[1];
            //         let ProductModelName = ele.ProductName.split("/")[2];
            //         let ProductFullName = ele.ProductName
            //         let Barcode = ele.BaseBarCode
            //         let BarcodeName = shopdetails[0].BarcodeName

            //         ele.ProductBrandName = ProductBrandName;
            //         ele.ProductModelName = ProductModelName;
            //         ele.ProductFullName = ProductFullName;
            //         ele.Barcode = Barcode;
            //         ele.BarcodeName = BarcodeName;

            //     } else {
            //         let ProductBrandName = ele.ProductName.split("/")[0];
            //         let ProductModelName = ele.ProductName.split("/")[1];
            //         let ProductFullName = ele.ProductName
            //         let Barcode = ele.BaseBarCode
            //         let BarcodeName = shopdetails[0].BarcodeName

            //         ele.ProductFullName = ProductFullName;
            //         ele.ProductBrandName = ProductBrandName;
            //         ele.ProductModelName = ProductModelName;
            //         ele.Barcode = Barcode;
            //         ele.BarcodeName = BarcodeName;
            //     }
            // })

            printdata.forEach(ele => {

                let ProductBrandName, ProductModelName;

                if (ele.ProductTypeName !== 'SUNGLASSES' && ele.ProductTypeName !== 'SUNGLASS' && ele.ProductTypeName !== 'Frames#1') {
                    [ProductBrandName, ProductModelName] = ele.ProductName.split("/").slice(1, 3);
                } else {
                    [ProductBrandName, ProductModelName] = ele.ProductName.split("/").slice(0, 2);
                }


                ele.ProductFullName = ele.ProductName;
                ele.ProductBrandName = ProductBrandName.substring(0, 14);
                ele.ProductModelName = ProductModelName !== undefined ? ProductModelName.substring(0, 18) : '';
                ele.ProductUniqueBarcode = ele.UniqueBarcode;
                ele.Barcode = ele.BaseBarCode;
                ele.BarcodeName = shopdetails[0].BarcodeName;
            });

            if (printdata.length > 0) {
                const [barcodeFormate] = await mysql2.pool.query(`select * from barcodesetting where CompanyID = ${CompanyID}`)
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

                console.log(printdata.MRPHide);
                printdata.CompanyID = CompanyID;
                printdata.CompanyBarcode = 5
                var file = "barcode" + CompanyID + ".pdf";
                var formatName = "barcode.ejs";
                var appURL = clientConfig.appURL;

                // var appURL = clientConfig.appURL;
                var fileName = "";
                fileName = "uploads/" + file;
                let url = appURL + "/uploads/" + file;
                let updateUrl = '';
                TinyURL.shorten(url, function (res) {
                    updateUrl = res;
                });

                ejs.renderFile(
                    path.join(appRoot, "./views/", formatName), { data: printdata },
                    (err, data) => {
                        if (err) {
                            res.send(err);
                        } else {
                            let options;

                            if (printdata.CompanyID == 20 || printdata.CompanyID == 19 || printdata.CompanyID == 64) {
                                if (printdata.CompanyBarcode == 5) {
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
                                        // "height": "0.70in",
                                        // "width": "4.90in",
                                    };
                                    //    options = {
                                    //    height: "0.70in",
                                    //    width: "4.90in",
                                    // };
                                }
                            } else {
                                if (printdata.CompanyBarcode == 5) {
                                    options = {
                                        "height": "0.70in",
                                        "width": "4.41in",
                                    };
                                    console.log(options);
                                }
                            }


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
            }
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

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }


            let qry = `select purchasemasternew.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId} and purchasemasternew.InvoiceNo like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
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

            let qry = `SELECT paymentdetail.*, purchasemasternew.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN purchasemasternew ON purchasemasternew.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType = 'Vendor' AND purchasemasternew.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and purchasemasternew.CompanyID = ${CompanyID}`
            // and purchasemasternew.ShopID = ${shopid}

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    barCodeListBySearchString: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString.substring(0, searchString.length - 1) + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1  and shop.Status = 1 and purchasemasternew.PStatus = 0  And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            console.log(qry);
            let [purchaseData] = await mysql2.pool.query(qry);
            response.data = purchaseData;
            response.message = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    productDataByBarCodeNo: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { Req, PreOrder, ShopMode } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (Req.SearchBarCode === "" || Req.SearchBarCode === undefined || Req.SearchBarCode === null) return res.send({ message: "Invalid Query Data" })

            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                if (ShopMode === "false") {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE CurrentStatus = "Available" AND barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1  and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.Barcode = '${barCode}' and PurchaseDetail.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;
            }

            let [barCodeData] = await mysql2.pool.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    transferProduct: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ProductName, Barcode, BarCodeCount, TransferCount, Remark, ToShopID, TransferFromShop } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

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

            let [xferData] = await mysql2.pool.query(qry);
            let xferID = xferData.insertId;

            let [selectedRows] = await mysql2.pool.query(
                `SELECT ID FROM barcodemasternew WHERE CurrentStatus = "Available" AND ShopID = ${TransferFromShop} AND Barcode = '${Barcode}' AND PreOrder = '0' and CompanyID ='${CompanyID}' LIMIT ${TransferCount}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await mysql2.pool.query(
                        `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Transfer Pending', TransferStatus = 'Transfer Pending', TransferToShop=${ToShopID}, UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let [xferList] = await mysql2.pool.query(qry1);


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
        }
    },

    acceptTransfer: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, TransferFromShop, TransferToShop, Remark, AcceptanceCode } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const TransferStatus = "Transfer Completed";

            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })
            if (TransferToShop === "" || TransferToShop === undefined || TransferToShop === null) return res.send({ message: "Invalid Query Data" })
            if (AcceptanceCode === "" || AcceptanceCode === undefined || AcceptanceCode === null || AcceptanceCode.trim() === "") return res.send({ message: "Invalid Query Data" })


            const [doesExist] = await mysql2.pool.query(`select * from transfermaster where ID = ${ID} and AcceptanceCode  = '${AcceptanceCode}' and CompanyID = ${CompanyID} and TransferStatus = 'Transfer Initiated'`)

            if (!doesExist.length) {
                return res.send({ success: true, message: `Invalid AcceptanceCode` })
            }

            let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID} and AcceptanceCode = '${AcceptanceCode}'`;

            let [xferData] = await mysql2.pool.query(qry);
            let xferID = xferData.insertId;

            let [selectedRows] = await mysql2.pool.query(
                `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and CompanyID =${CompanyID}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await mysql2.pool.query(
                        `UPDATE barcodemasternew SET ShopID = ${TransferToShop}, CurrentStatus = 'Available', TransferStatus = 'Available', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let [xferList] = await mysql2.pool.query(qry1);
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
        }
    },
    cancelTransfer: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, TransferFromShop, Remark } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const TransferStatus = "Transfer Cancelled";

            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })


            const [doesExist] = await mysql2.pool.query(`select * from transfermaster where ID = ${ID} and CompanyID = ${CompanyID} and TransferStatus = 'Transfer Initiated'`)

            if (!doesExist.length) {
                return res.send({ success: true, message: `Invalid Query` })
            }

            let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID}`;

            let [xferData] = await mysql2.pool.query(qry);
            let xferID = xferData.insertId;

            let [selectedRows] = await mysql2.pool.query(
                `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and CompanyID =${CompanyID}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await mysql2.pool.query(
                        `UPDATE barcodemasternew SET TransferID= 0, CurrentStatus = 'Available', TransferStatus = 'Transfer Cancelled', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let [xferList] = await mysql2.pool.query(qry1);
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
        }
    },

    getTransferList: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const { ID, currentPage, itemsPerPage } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            let shop = ``

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            if (ID === "" || ID === null || ID === undefined) {
                shop = shopid
            } else {
                shop = ID
            }

            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${shop} or transfermaster.TransferToShop = ${shop}) Order By transfermaster.ID Desc`;

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            response.data = data;
            response.count = count.length
            response.success = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getproductTransferReport: async (req, res, next) => {
        try {

            const response = {
                data: null, calculation: [{
                    "totalQty": 0
                }], success: true, message: ""
            }
            let { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            // Parem = `and DATE_FORMAT(transfermaster.DateStarted,"%Y-%m-%d") between '2023-01-05' and '2023-01-05'`

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, shop.AreaName AS AreaName, ShopTo.AreaName AS ToAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID}  ` + Parem + ` Order By transfermaster.ID Desc`;

            let [data] = await mysql2.pool.query(qry);

            let [datum] = await mysql2.pool.query(`SELECT SUM(transfermaster.TransferCount) as totalQty FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID}  ` + Parem + ` Order By transfermaster.ID Desc`)

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0

            response.data = data;
            response.success = true;
            response.message = 'Success';

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    transferProductPDF: async (req, res, next) => {
        try {
            var printdata = req.body;
            printdata.TXdata = printdata;
            var PassNo = Math.trunc(Math.random() * 10000).toString();
            printdata.PassNo = PassNo;
            console.log(printdata);
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
        }
    },

    // search

    barcodeDataByBarcodeNo: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const { Barcode, mode, ShopMode } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            let shopMode = ``;
            let mode1 = ``;

            if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })

            if (mode === 'search') {
                mode1 = `And barcodemasternew.Barcode = '${Barcode}'`;

            }
            // else {
            //     mode1 = `And barcodemasternew.PurchaseDetailID = '${PurchaseDetailID}'`;
            // }

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = `And barcodemasternew.ShopID = '${shopid}'`;
            }

            qry = `SELECT barcodemasternew.* , company.Name AS CompanyName, shop.Name AS ShopName, shop.AreaName AS AreaName, shop.BarcodeName AS BarcodeShopName, purchasedetailnew.ProductName , purchasedetailnew.ProductTypeName, purchasedetailnew.BaseBarCode AS BarCode, purchasedetailnew.UniqueBarcode, purchasedetailnew.UnitPrice, purchasedetailnew.ProductName, purchasedetailnew.Quantity ,purchasemasternew.InvoiceNo,supplier.Name AS SupplierName   FROM barcodemasternew LEFT JOIN company ON company.ID = barcodemasternew.CompanyID LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE barcodemasternew.CurrentStatus != 'Pre Order' and  purchasedetailnew.Status = 1 and purchasemasternew.PStatus = 0 AND barcodemasternew.CompanyID = ${CompanyID}  ${shopMode} ${mode1}`;

            let [barcodelist] = await mysql2.pool.query(qry);
            response.data = barcodelist;
            response.message = "success";

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    barCodeListBySearchStringSearch: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString.substring(0, searchString.length - 1) + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1 and shop.Status = 1 And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let [purchaseData] = await mysql2.pool.query(qry);

            let barcodelist = []

            if (purchaseData.length) {

                for (const b of purchaseData) {
                    let mode1 = `And barcodemasternew.Barcode = '${b.Barcode}'`;
                    let [Barcodes] = await mysql2.pool.query(`SELECT barcodemasternew.* , company.Name AS CompanyName, shop.Name AS ShopName, shop.AreaName AS AreaName, shop.BarcodeName AS BarcodeShopName, purchasedetailnew.ProductName , purchasedetailnew.ProductTypeName, purchasedetailnew.BaseBarCode AS BarCode, purchasedetailnew.UniqueBarcode, purchasedetailnew.UnitPrice, purchasedetailnew.ProductName, purchasedetailnew.Quantity ,purchasemasternew.InvoiceNo,supplier.Name AS SupplierName   FROM barcodemasternew LEFT JOIN company ON company.ID = barcodemasternew.CompanyID LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE barcodemasternew.CurrentStatus != 'Pre Order' and  purchasedetailnew.Status = 1 AND barcodemasternew.CompanyID = ${CompanyID}  ${shopMode} ${mode1}`)

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
        }
    },

    updateBarcode: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, Barcode, Remark, CurrentStatus, CompanyID, ShopID } = req.body;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
            if (CurrentStatus === "" || CurrentStatus === undefined || CurrentStatus === null) return res.send({ message: "Invalid Query Data" })

            const [doesCheck] = await mysql2.pool.query(`select * from barcodemasternew where ID = ${ID}`)

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

            let [barcode] = await mysql2.pool.query(qry);


            response.data = [];
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },


    // Inventory summary

    getInventorySummary: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count,purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasemasternew.PStatus =0 and purchasedetailnew.Status = 1 ` + Parem + " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";

            let [data] = await mysql2.pool.query(qry);
            response.data = data
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    updateInventorySummary: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const { PurchaseDetailID, BrandType } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (BrandType === "" || BrandType === undefined || BrandType === null) return res.send({ message: "Invalid Query Data" })
            if (PurchaseDetailID === "" || PurchaseDetailID === undefined || PurchaseDetailID === null) return res.send({ message: "Invalid Query Data" })

            qry = `update purchasedetailnew set BrandType = ${BrandType}, UpdatedBy=${LoggedOnUser}, CreatedOn=now() where ID = ${PurchaseDetailID} and CompanyID = ${CompanyID}`

            let [data] = await mysql2.pool.query(qry);
            response.data = []
            response.message = "success";
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },


    // Purchase Reports

    getPurchasereports: async (req, res, next) => {
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

            qry = `SELECT purchasemasternew.*, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo FROM purchasemasternew  LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE purchasemasternew.Status = 1  AND purchasemasternew.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await mysql2.pool.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.SubTotal) as totalUnitPrice  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await mysql2.pool.query(qry);


            qry2 = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1  AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem;

            let [data2] = await mysql2.pool.query(qry2);

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
        }
    },

    getPurchasereportsDetail: async (req, res, next) => {
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
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1  AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await mysql2.pool.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.UnitPrice) as totalUnitPrice, SUM(purchasedetailnew.RetailPrice) as totalRetailPrice,SUM(purchasedetailnew.SubTotal) as totalSubTotalPrice, SUM(purchasedetailnew.WholeSalePrice) as totalWholeSalePrice FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem)

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
        }
    },


    // Purchase return report

    getPurchasereturnreports: async (req, res, next) => {
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

            qry = `SELECT purchasereturn.*, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo FROM purchasereturn  LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID WHERE purchasereturn.Status = 1 AND purchasereturn.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await mysql2.pool.query(`SELECT SUM(purchasereturndetail.Quantity) as totalQty, SUM(purchasereturndetail.GSTAmount) as totalGstAmount, SUM(purchasereturndetail.TotalAmount) as totalAmount, SUM(purchasereturndetail.DiscountAmount) as totalDiscount, SUM(purchasereturndetail.SubTotal) as totalUnitPrice  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID WHERE purchasereturndetail.Status = 1  AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem)

            let [data] = await mysql2.pool.query(qry);


            qry2 = `SELECT purchasereturndetail.*,purchasereturn.SystemCn, purchasereturn.SupplierCn, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID LEFT JOIN product ON product.ID = purchasereturndetail.ProductTypeID WHERE purchasereturndetail.Status = 1  AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem;

            let [data2] = await mysql2.pool.query(qry2);

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
        }
    },

    getPurchasereturndetailreports: async (req, res, next) => {
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

            qry = `SELECT purchasereturndetail.*,purchasereturn.SystemCn, purchasereturn.SupplierCn, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID LEFT JOIN product ON product.ID = purchasereturndetail.ProductTypeID WHERE purchasereturndetail.Status = 1 AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem;




            let [datum] = await mysql2.pool.query(`SELECT SUM(purchasereturndetail.Quantity) as totalQty, SUM(purchasereturndetail.GSTAmount) as totalGstAmount, SUM(purchasereturndetail.TotalAmount) as totalAmount, SUM(purchasereturndetail.DiscountAmount) as totalDiscount, SUM(purchasereturndetail.SubTotal) as totalUnitPrice  FROM purchasereturndetail INNER JOIN purchasereturn ON purchasereturn.ID = purchasereturndetail.ReturnID LEFT JOIN shop ON shop.ID = purchasereturn.ShopID LEFT JOIN supplier ON supplier.ID = purchasereturn.SupplierID LEFT JOIN product ON product.ID = purchasereturndetail.ProductTypeID WHERE purchasereturndetail.Status = 1  AND purchasereturndetail.CompanyID = ${CompanyID}  ` + Parem)

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
        }
    },

    setProductExpiryDate: async (req, res, next) => {
        try {
            // return res.send({success: false, message: `it is temp function`})
            const { CompanyID } = req.body;
            console.log(`hii setProductExpiryDate`);
            if (CompanyID === "" || CompanyID === undefined || CompanyID === null) return res.send({ message: "Invalid Query Data" })

            const [data] = await mysql2.pool.query(`select * from purchasedetailnew where CompanyID = ${CompanyID}`)

            if (data) {
                for (const item of data) {
                    let pName = item.ProductName.split("/")
                    console.log(pName[pName.length - 1], isValidDate(pName[pName.length - 1]));

                    if (isValidDate(pName[pName.length - 1])) {
                        const [update] = await mysql2.pool.query(`update purchasedetailnew set ProductExpDate = '${pName[pName.length - 1]}', UpdatedBy = ${item.CreatedBy}, UpdatedOn = now() where ID = ${item.ID}`)
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
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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

            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

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
            const [savePurchase] = await mysql2.pool.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            //  save purchase detail data
            for (const item of purchaseDetail) {
                const doesProduct = 0

                // generate unique barcode
                item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                // baseBarcode initiated if same product exist or not condition
                let baseBarCode = 0;
                if (doesProduct !== 0) {
                    baseBarCode = doesProduct
                } else {
                    baseBarCode = await generateBarcode(CompanyID, 'PB')
                }

                const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            //  save barcode

            let [detailDataForBarCode] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

            if (detailDataForBarCode.length) {
                for (const item of detailDataForBarCode) {
                    const barcode = Number(item.BaseBarCode)
                    let count = 0;
                    count = 1;
                    for (j = 0; j < count; j++) {
                        const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(),1)`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    listPreOrder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 1 and purchasemasternew.CompanyID = ${CompanyID} ${shopId} order by purchasemasternew.ID desc`
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
    listPreOrderDummy: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let Parem = Body.Parem;
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

            let qry = `select purchasedetailnew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasedetailnew LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID left join user as users1 on users1.ID = purchasedetailnew.CreatedBy left join user as users on users.ID = purchasedetailnew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 1 and purchasedetailnew.Status = 1 and purchasemasternew.CompanyID = ${CompanyID} ${shopId}  ${Parem} order by purchasedetailnew.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

            if (data.length) {
                for (let item of data) {
                    item.PurchaseMasterData = {}
                    const [purchasedata] = await mysql2.pool.query(`SELECT purchasemasternew.*, supplier.Name AS SupplierName,  supplier.GSTNo AS GSTNo, users1.Name AS CreatedPerson,shop.Name AS ShopName, shop.AreaName AS AreaName, users.Name AS UpdatedPerson FROM purchasemasternew LEFT JOIN user AS users1 ON users1.ID = purchasemasternew.CreatedBy LEFT JOIN user AS users ON users.ID = purchasemasternew.UpdatedBy LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID WHERE purchasemasternew.Status = 1 AND purchasemasternew.PStatus = 1 and purchasemasternew.ID = ${item.PurchaseID} and purchasemasternew.CompanyID = ${CompanyID} ${shopId} `)
                    item.PurchaseMasterData = purchasedata[0]
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
    deletePreOrderDummy: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const {
                PurchaseMaster,
                PurchaseDetail,
            } = req.body;

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set  Quantity = ${PurchaseMaster.Quantity}, SubTotal = ${PurchaseMaster.SubTotal}, DiscountAmount = ${PurchaseMaster.DiscountAmount}, GSTAmount=${PurchaseMaster.GSTAmount}, TotalAmount = ${PurchaseMaster.TotalAmount}, DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${PurchaseMaster.ID}`)

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            const [deletePurchasedetail] = await mysql2.pool.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${PurchaseDetail.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            const [deleteBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where purchaseDetailID = ${PurchaseDetail.ID} and CompanyID = ${CompanyID}`)

            console.log("Barcode Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    deleteAllPreOrderDummy: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set  Quantity = ${PurchaseMaster.Quantity}, SubTotal = ${PurchaseMaster.SubTotal}, DiscountAmount = ${PurchaseMaster.DiscountAmount}, GSTAmount=${PurchaseMaster.GSTAmount}, TotalAmount = ${PurchaseMaster.TotalAmount}, DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${PurchaseMaster.ID}`)

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            for (const item of PurchaseDetail) {

                const [deletePurchasedetail] = await mysql2.pool.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${item.ID} and CompanyID = ${CompanyID}`)

                console.log("Product Delete SuccessFUlly !!!");

                const [deleteBarcode] = await mysql2.pool.query(`update barcodemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where purchaseDetailID = ${item.ID} and CompanyID = ${CompanyID}`)

                console.log("Barcode Delete SuccessFUlly !!!");
            }



            response.message = "data delete sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    updatePreOrderDummy: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0

            const {
                PurchaseMaster,
                PurchaseDetail,
            } = req.body;

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set  Quantity = ${PurchaseMaster.Quantity}, SubTotal = ${PurchaseMaster.SubTotal}, DiscountAmount = ${PurchaseMaster.DiscountAmount}, GSTAmount=${PurchaseMaster.GSTAmount}, TotalAmount = ${PurchaseMaster.TotalAmount}, DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${PurchaseMaster.ID}`)

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            const [updatePurchasedetail] = await mysql2.pool.query(`update purchasedetailnew set UnitPrice=${PurchaseDetail.UnitPrice}, Quantity=${PurchaseDetail.Quantity}, SubTotal=${PurchaseDetail.SubTotal},DiscountPercentage=${PurchaseDetail.DiscountPercentage},DiscountAmount=${PurchaseDetail.DiscountAmount},GSTPercentage=${PurchaseDetail.GSTPercentage},GSTAmount=${PurchaseDetail.GSTAmount},GSTType='${PurchaseDetail.GSTType}',  TotalAmount = ${PurchaseDetail.TotalAmount}, RetailPrice=${PurchaseDetail.RetailPrice},WholeSalePrice=${PurchaseDetail.WholeSalePrice}, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${PurchaseDetail.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Update SuccessFUlly !!!");


            response.message = "data update sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    getPurchaseByIdPreOrder: async (req, res, next) => {
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternew  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid} and PStatus = 1`)

            const [PurchaseDetail] = await mysql2.pool.query(`select 0 as Sel, purchasedetailnew.* from purchasedetailnew where  PurchaseID = ${ID} and CompanyID = ${CompanyID}`)



            const gst_detail = await gstDetail(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = gst_detail || []
            response.result.PurchaseDetail = PurchaseDetail
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    deletePreOrder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchase doesnot exist from this id " })
            }


            const [doesExistProduct] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and PurchaseID = '${Body.ID}'`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await mysql2.pool.query(`update purchasemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    deleteProductPreOrder: async (req, res, next) => {
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }




            const [deletePurchasedetail] = await mysql2.pool.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)



            const [fetchPurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    updatePreOrder: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)

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
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${purchase.ID}`)

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

                    const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


                    let [detailDataForBarCode] = await mysql2.pool.query(
                        `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
                    );

                    await Promise.all(
                        detailDataForBarCode.map(async (item) => {
                            const barcode = Number(item.BaseBarCode)
                            let count = 0;
                            count = 1;
                            for (j = 0; j < count; j++) {
                                const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(), 1)`)
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
        }
    },

    searchByFeildPreOrder: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }


            let qry = `select purchasemasternew.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId} and purchasemasternew.InvoiceNo like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    // product inventory report

    getProductInventoryReport: async (req, res, next) => {
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
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const Body = req.body;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasedetailnew.Status = 1  ` +
                Parem +
                " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";
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
                    response.calculation[0].totalRetailPrice += item.Quantity * item.RetailPrice
                    response.calculation[0].totalWholeSalePrice += item.Quantity * item.WholeSalePrice


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
        }

    },

    // product expiry report
    getProductExpiryReport: async (req, res, next) => {
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
        }

    },

    // purchase charge report

    getPurchaseChargeReport: async (req, res, next) => {
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
            const Body = req.body;

            let shopId = ``

            if (Parem === "" || Parem === undefined || Parem === null) {
                if (shopid !== 0) {
                    shopId = `and purchasemasternew.ShopID = ${shopid}`
                }
            }

            qry = `SELECT purchasecharge.*, purchasemasternew.InvoiceNo, purchasemasternew.ShopID,shop.Name AS ShopName,shop.AreaName AS AreaName FROM purchasecharge LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasecharge.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID WHERE purchasecharge.CompanyID = ${CompanyID} AND purchasecharge.Status = 1 ` + Parem;

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
        }

    },

    // purchase return

    barCodeListBySearchStringPR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName, ShopID, SupplierID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.ProductTypeID, purchasedetailnew.UnitPrice, purchasedetailnew.DiscountPercentage, purchasedetailnew.DiscountAmount,purchasedetailnew.GSTPercentage, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType,barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available" and purchasemasternew.SupplierID = ${SupplierID} and barcodemasternew.ShopID = ${ShopID}  AND purchasedetailnew.Status = 1  and shop.Status = 1 and purchasemasternew.PStatus = 0  And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let [purchaseData] = await mysql2.pool.query(qry);
            response.data = purchaseData;
            response.message = "Success";

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    productDataByBarCodeNoPR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const { Req, PreOrder, ShopMode, ShopID, SupplierID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.UnitPrice, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.GSTAmount, purchasedetailnew.DiscountAmount, purchasedetailnew.DiscountPercentage,purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID,purchasemasternew.InvoiceNo, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE CurrentStatus = "Available"  and purchasemasternew.SupplierID = ${SupplierID} and barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1  and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount,purchasedetailnew.UnitPrice, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice,purchasedetailnew.DiscountAmount, purchasedetailnew.DiscountPercentage, purchasedetailnew.ProductTypeID,purchasemasternew.InvoiceNo, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID WHERE barcodemasternew.Barcode = '${barCode}' and PurchaseDetail.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;
            }

            let [barCodeData] = await mysql2.pool.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    savePurchaseReturn: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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

            const [doesExistSystemCn] = await mysql2.pool.query(`select * from purchasereturn  where Status = 1 and SystemCn = '${PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

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
            const [savePurchaseReturn] = await mysql2.pool.query(`insert into purchasereturn(SupplierID,CompanyID,ShopID,SystemCn,SupplierCn,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,CreatedBy,CreatedOn,PurchaseDate)values(${purchasereturn.SupplierID},${purchasereturn.CompanyID},${purchasereturn.ShopID},'${purchasereturn.SystemCn}','${purchasereturn.SupplierCn}',${purchasereturn.Quantity},${purchasereturn.SubTotal},${purchasereturn.DiscountAmount},${purchasereturn.GSTAmount},${purchasereturn.TotalAmount},1,${LoggedOnUser}, now(), '${purchasereturn.PurchaseDate}')`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            //  save purchase return detail data
            for (const item of purchaseDetail) {

                const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasereturndetail(ReturnID,CompanyID,PurchaseDetailID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,Barcode,Status,CreatedBy,CreatedOn,Remark)values(${savePurchaseReturn.insertId},${CompanyID},${item.PurchaseDetailID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},'${item.Barcode}',1, ${LoggedOnUser},now(),'${item.Remark}')`)


                let count = 0;
                count = item.Quantity;

                let [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus = 'Return To Supplier', BillDetailID = ${savePurchaseDetail.insertId} where Status = 1 and Barcode = '${item.Barcode}' and CurrentStatus = 'Available' and CompanyID = ${CompanyID} and ShopID = ${shopid} limit ${count}`)

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
        }
    },

    updatePurchaseReturn: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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


            const [doesExistSystemCn] = await mysql2.pool.query(`select * from purchasereturn where Status = 1 and SystemCn = '${PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)

            if (doesExistSystemCn.length) {
                return res.send({ message: `Purchase Already exist from this SystemCn ${PurchaseMaster.SystemCn}` })
            }

            const [doesExistSupplierCn] = await mysql2.pool.query(`select * from purchasereturn where Status = 1 and SystemCn = '${PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${PurchaseMaster.ID}`)


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
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasereturn set Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now(), PurchaseDate='${purchase.PurchaseDate}' where CompanyID = ${CompanyID} and ShopID = ${purchase.ShopID} and ID = ${purchase.ID}`)


            //  save purchase return detail data
            for (const item of purchaseDetail) {

                if (item.ID === null) {

                    const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasereturndetail(ReturnID,CompanyID,PurchaseDetailID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,Barcode,Status,CreatedBy,CreatedOn,Remark)values(${purchase.ID},${CompanyID},${item.PurchaseDetailID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},'${item.Barcode}',1,${LoggedOnUser},now(),'${item.Remark}')`)


                    let count = 0;
                    count = item.Quantity;

                    let [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus = 'Return To Supplier', BillDetailID = ${savePurchaseDetail.insertId} where Status = 1 and Barcode = '${item.Barcode}' and CurrentStatus = 'Available' limit ${count}`)

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
        }
    },

    purchasereturnlist: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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

    getPurchaseReturnById: async (req, res, next) => {
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await mysql2.pool.query(`select * from purchasereturn  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const [PurchaseDetail2] = await mysql2.pool.query(`select purchasereturndetail.*, purchasemasternew.InvoiceNo from purchasereturndetail left join purchasedetailnew on purchasedetailnew.ID = purchasereturndetail.PurchaseDetailID left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID  where  purchasereturndetail.ReturnID = ${ID} and purchasereturndetail.CompanyID = ${CompanyID}`)

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasereturndetail where  Status = 1 and ReturnID = ${ID} and CompanyID = ${CompanyID}`)


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
        }
    },

    deleteProductPR: async (req, res, next) => {
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.SystemCn.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasereturndetail where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }


            const [doesExistSystemCn] = await mysql2.pool.query(`select * from purchasereturn where Status = 1 and SystemCn = '${Body.PurchaseMaster.SystemCn}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID = ${Body.PurchaseMaster.ID}`)


            if (doesExistSystemCn[0].SupplierCn !== "") {
                return res.send({ message: `You have already added supplierCn ${Body.PurchaseMaster.SupplierCn}` })
            }


            const [deletePurchasedetail] = await mysql2.pool.query(`update purchasereturndetail set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasereturn set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and SystemCn = '${Body.PurchaseMaster.SystemCn}' and ShopID = ${Body.PurchaseMaster.ShopID}`)

            // update barcode

            const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set CurrentStatus = 'Available' , BillDetailID = 0  where BillDetailID = ${Body.ID}`)


            const [fetchPurchaseMaster] = await mysql2.pool.query(`select * from purchasereturn  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${Body.PurchaseMaster.ShopID}`)

            const [PurchaseDetail2] = await mysql2.pool.query(`select * from purchasereturndetail where ReturnID = ${doesExist[0].ReturnID} and CompanyID = ${CompanyID}`)

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasereturndetail where Status = 1 and ReturnID = ${doesExist[0].ReturnID} and CompanyID = ${CompanyID}`)

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
        }
    },

    searchByFeildPR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasereturn.ShopID = ${shopid}`
            }


            let qry = `select purchasereturn.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasereturn left join user as users1 on users1.ID = purchasereturn.CreatedBy left join user as users on users.ID = purchasereturn.UpdatedBy left join supplier on supplier.ID = purchasereturn.SupplierID left join shop on shop.ID = purchasereturn.ShopID where purchasereturn.Status = 1 and purchasereturn.CompanyID = '${CompanyID}' ${shopId} and purchasereturn.SystemCn like '%${Body.searchQuery}%' OR purchasereturn.Status = 1 and purchasereturn.CompanyID = '${CompanyID}' ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasereturn.Status = 1  and purchasereturn.CompanyID = '${CompanyID}' ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    deletePR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasereturn where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchasereturn doesnot exist from this id " })
            }

            if (doesExist[0].SupplierCn !== "") {
                return res.send({ message: "You have already added supplierCn" })
            }


            const [doesExistProduct] = await mysql2.pool.query(`select * from purchasereturndetail where Status = 1 and CompanyID = '${CompanyID}' and ReturnID = '${Body.ID}'`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await mysql2.pool.query(`update purchasereturn set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Return Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    supplierCnPR: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const { PurchaseDate, SupplierCn, ID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (SupplierCn === null || SupplierCn === undefined) return res.send({ message: "Invalid Query Data" })

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasereturn where Status = 1 and CompanyID = '${CompanyID}' and ID = '${ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchasereturn doesnot exist from this id " })
            }

            const [doesCheckCn] = await mysql2.pool.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${SupplierCn.trim()}' and PaymentType = 'Vendor Credit' and Credit = 'Credit'`)

            if (doesCheckCn.length) {
                return res.send({ message: `PurchaseReturn Already exist from this SupplierCn ${SupplierCn}` })
            }

            let supplierId = doesExist[0].SupplierID


            let [update] = await mysql2.pool.query(`update purchasereturn set SupplierCn = '${SupplierCn}', PurchaseDate = '${PurchaseDate}', CreatedOn=now(), UpdatedBy=${LoggedOnUser} where ID =${ID}`)

            console.log("Purchase Return Update SuccessFUlly !!!");


            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Credit',now(), 'Vendor Credit', '', '', ${doesExist[0].TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${SupplierCn}',${ID},${supplierId},${CompanyID},${doesExist[0].TotalAmount},0,'Vendor Credit','Credit',1,${LoggedOnUser}, now())`)

            const [saveVendorCredit] = await mysql2.pool.query(`insert into vendorcredit(CompanyID, ShopID, SupplierID, CreditNumber, CreditDate, Amount, Remark, Is_Return, Status, CreatedBy, CreatedOn)values(${CompanyID}, ${shopid},${supplierId}, '${SupplierCn}', now(), ${doesExist[0].TotalAmount}, 'Amount Credited By Product Return From CN No ${SupplierCn}', 1, 1, ${LoggedOnUser}, now())`)

            console.log(connected("Vendor Credit SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    setbarcodemaster: async (req, res, next) => {
        try {
            return
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "Available";


            //  save barcode

            let [detailDataForBarCode] = await mysql2.pool.query(`SELECT * FROM purchasedetailnew WHERE CompanyID = ${CompanyID} AND BaseBarCode IN (
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
                        const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}','2023-12-06 16:08:59','${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, '2023-12-06 16:08:59')`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));



            response.message = "data save sucessfully"
            return res.send(response);


        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    getInvoicePayment: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;

            let { PaymentType, PayeeName, PurchaseID } = req.body
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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

                const [credit] = await mysql2.pool.query(`select SUM(vendorcredit.Amount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID} and SupplierID = ${PayeeName}`);

                const [debit] = await mysql2.pool.query(`select SUM(vendorcredit.PaidAmount) as CreditAmount from vendorcredit where CompanyID = ${CompanyID}  and SupplierID = ${PayeeName}`);

                if (credit[0].CreditAmount !== null) {
                    creditCreditAmount = credit[0].CreditAmount
                }
                if (debit[0].CreditAmount !== null) {
                    creditDebitAmount = debit[0].CreditAmount
                }

                const [due] = await mysql2.pool.query(`select SUM(purchasemasternew.DueAmount) as due from purchasemasternew where CompanyID = ${CompanyID} and SupplierID = ${PayeeName} and PStatus = 0 and Status = 1 and ID = ${PurchaseID}`)

                if (due[0].due !== null) {
                    totalDueAmount = due[0].due
                }


                qry = `select supplier.Name as PayeeName, shop.Name as ShopName, shop.AreaName, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.GSTNo, purchasemasternew.DiscountAmount, purchasemasternew.GSTAmount, purchasemasternew.PaymentStatus, purchasemasternew.TotalAmount, purchasemasternew.DueAmount, ( purchasemasternew.TotalAmount - purchasemasternew.DueAmount) as PaidAmount, purchasemasternew.ID  from purchasemasternew left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.SupplierID = ${PayeeName} and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.PaymentStatus = 'Unpaid' and purchasemasternew.DueAmount != 0 and purchasemasternew.Status = 1 and purchasemasternew.ID = ${PurchaseID}`

                const [data] = await mysql2.pool.query(qry)
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
        }
    },
    paymentHistoryByPurchaseID: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { SupplierID, PurchaseID } = req.body

            if (SupplierID === null || SupplierID === undefined || SupplierID == 0 || SupplierID === "") return res.send({ message: "Invalid Query Data" })
            if (PurchaseID === null || PurchaseID === undefined || PurchaseID == 0 || PurchaseID === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await mysql2.pool.query(`select paymentdetail.amount as Amount, paymentmaster.PaymentDate as PaymentDate, paymentmaster.PaymentType AS PaymentType,paymentmaster.PaymentMode as PaymentMode, paymentmaster.CardNo as CardNo, paymentmaster.PaymentReferenceNo as PaymentReferenceNo, paymentdetail.Credit as Type from paymentdetail left join paymentmaster on paymentmaster.ID = paymentdetail.PaymentMasterID where paymentmaster.CustomerID = ${SupplierID} and paymentmaster.PaymentType = 'Supplier' and paymentmaster.Status = 1 and paymentdetail.BillMasterID = ${PurchaseID}`)

            response.data = data
            response.message = "success";
            return res.send(response);
        } catch (err) {
            next(err)
        }
    },
    getCountInventoryReport: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "OpeningStock": 0, "AddPurchase": 0, "DeletePurchase": 0, "AddSale": 0, "DeleteSale": 0, "OtherDeleteStock": 0, "InitiateTransfer": 0, "CancelTransfer": 0, "AcceptTransfer": 0, "ClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { ShopID, DateParam } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (DateParam === null || DateParam === undefined || DateParam == 0 || DateParam === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await mysql2.pool.query(`SELECT CompanyID, ShopID, DATE, OpeningStock, AddPurchase, DeletePurchase, AddSale, DeleteSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock FROM creport WHERE CompanyID = ${CompanyID} and ShopID = ${ShopID}  ${DateParam}  `)

            if (data.length) {
                response.calculation.OpeningStock = data[0].OpeningStock
                response.calculation.ClosingStock = data[data.length - 1].ClosingStock
            }

            let [datum] = await mysql2.pool.query(`SELECT SUM(AddPurchase) AS TotalAddPurchase,
            SUM(DeletePurchase) AS TotalDeletePurchase,
            SUM(AddSale) AS TotalAddSale,
            SUM(DeleteSale) AS TotalDeleteSale,
            SUM(OtherDeleteStock) AS TotalOtherDeleteStock,
            SUM(InitiateTransfer) AS TotalInitiateTransfer,
            SUM(CancelTransfer) AS TotalCancelTransfer,
            SUM(AcceptTransfer) AS TotalAcceptTransfer FROM creport WHERE CompanyID = ${CompanyID} and ShopID = ${ShopID}  ${DateParam}  `)

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
        }
    },
    getCountInventoryReportMonthWise: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "OpeningStock": 0, "AddPurchase": 0, "DeletePurchase": 0, "AddSale": 0, "DeleteSale": 0, "OtherDeleteStock": 0, "InitiateTransfer": 0, "CancelTransfer": 0, "AcceptTransfer": 0, "ClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { ShopID, FromDate, ToDate } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await mysql2.pool.query(`SELECT YEAR(c.DATE) AS YEAR, MONTH(c.DATE) AS MONTH, CompanyID, ShopID, (SELECT OpeningStock FROM creport WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND YEAR(DATE) = YEAR(c.DATE) AND MONTH(DATE) = MONTH(c.DATE) AND DATE BETWEEN '${FromDate}' AND '${ToDate}' LIMIT 1) AS OpeningStock, SUM(AddPurchase) AS TotalAddPurchase, SUM(DeletePurchase) AS TotalDeletePurchase, SUM(AddSale) AS TotalAddSale, SUM(DeleteSale) AS TotalDeleteSale, SUM(OtherDeleteStock) AS TotalOtherDeleteStock, SUM(InitiateTransfer) AS TotalInitiateTransfer, SUM(CancelTransfer) AS TotalCancelTransfer, SUM(AcceptTransfer) AS TotalAcceptTransfer, (SELECT ClosingStock FROM creport WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND YEAR(DATE) = YEAR(c.DATE) AND MONTH(DATE) = MONTH(c.DATE) AND DATE BETWEEN '${FromDate}' AND '${ToDate}' ORDER BY DATE DESC LIMIT 1) AS ClosingStock FROM creport c WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND DATE BETWEEN '${FromDate}' AND '${ToDate}' GROUP BY YEAR(c.DATE), MONTH(c.DATE), CompanyID, ShopID ORDER BY YEAR, MONTH;
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
        }
    },
    getAmountInventoryReportMonthWise: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "AmtOpeningStock": 0, "AmtAddPurchase": 0, "AmtDeletePurchase": 0, "AmtAddSale": 0, "AmtDeleteSale": 0, "AmtOtherDeleteStock": 0, "AmtInitiateTransfer": 0, "AmtCancelTransfer": 0, "AmtAcceptTransfer": 0, "AmtClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { ShopID, FromDate, ToDate } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (FromDate === null || FromDate === undefined || FromDate == 0 || FromDate === "") return res.send({ message: "Invalid Query Data" })
            if (ToDate === null || ToDate === undefined || ToDate == 0 || ToDate === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await mysql2.pool.query(`SELECT YEAR(c.DATE) AS YEAR, MONTH(c.DATE) AS MONTH, CompanyID, ShopID, (SELECT AmtOpeningStock FROM creport WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND YEAR(DATE) = YEAR(c.DATE) AND MONTH(DATE) = MONTH(c.DATE) AND DATE BETWEEN '${FromDate}' AND '${ToDate}' LIMIT 1) AS AmtOpeningStock, SUM(AmtAddPurchase) AS TotalAddPurchase, SUM(AmtDeletePurchase) AS TotalDeletePurchase, SUM(AmtAddSale) AS TotalAddSale, SUM(AmtDeleteSale) AS TotalDeleteSale, SUM(AmtOtherDeleteStock) AS TotalOtherDeleteStock, SUM(AmtInitiateTransfer) AS TotalInitiateTransfer, SUM(AmtCancelTransfer) AS TotalCancelTransfer, SUM(AmtAcceptTransfer) AS TotalAcceptTransfer, (SELECT AmtClosingStock FROM creport WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND YEAR(DATE) = YEAR(c.DATE) AND MONTH(DATE) = MONTH(c.DATE) AND DATE BETWEEN '${FromDate}' AND '${ToDate}' ORDER BY DATE DESC LIMIT 1) AS AmtClosingStock FROM creport c WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND DATE BETWEEN '${FromDate}' AND '${ToDate}' GROUP BY YEAR(c.DATE), MONTH(c.DATE), CompanyID, ShopID ORDER BY YEAR, MONTH;
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
        }
    },
    getAmountInventoryReport: async (req, res, next) => {
        try {
            const response = {
                data: null, success: true, message: "", calculation: {
                    "AmtOpeningStock": 0, "AmtAddPurchase": 0, "AmtDeletePurchase": 0, "AmtAddSale": 0, "AmtDeleteSale": 0, "AmtOtherDeleteStock": 0, "AmtInitiateTransfer": 0, "AmtCancelTransfer": 0, "AmtAcceptTransfer": 0, "AmtClosingStock": 0
                }
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { ShopID, DateParam } = req.body

            if (ShopID === null || ShopID === undefined || ShopID === "") return res.send({ message: "Invalid Query Data" })
            if (DateParam === null || DateParam === undefined || DateParam == 0 || DateParam === "") return res.send({ message: "Invalid Query Data" })

            let [data] = await mysql2.pool.query(`SELECT CompanyID, ShopID, DATE, AmtOpeningStock, AmtAddPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock FROM creport WHERE CompanyID = ${CompanyID} and ShopID = ${ShopID}  ${DateParam}  `)

            if (data.length) {
                response.calculation.AmtOpeningStock = data[0].AmtOpeningStock
                response.calculation.AmtClosingStock = data[data.length - 1].AmtClosingStock
            }

            let [datum] = await mysql2.pool.query(`SELECT SUM(AmtAddPurchase) AS TotalAddPurchase,
            SUM(AmtDeletePurchase) AS TotalDeletePurchase,
            SUM(AmtAddSale) AS TotalAddSale,
            SUM(AmtDeleteSale) AS TotalDeleteSale,
            SUM(AmtOtherDeleteStock) AS TotalOtherDeleteStock,
            SUM(AmtInitiateTransfer) AS TotalInitiateTransfer,
            SUM(AmtCancelTransfer) AS TotalCancelTransfer,
            SUM(AmtAcceptTransfer) AS TotalAcceptTransfer FROM creport WHERE CompanyID = ${CompanyID} and ShopID = ${ShopID}  ${DateParam}  `)

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
        }
    },
}
