const createError = require('http-errors')
const _ = require("lodash")
const { generateBarcode, generateUniqueBarcode, doesExistProduct, shopID, gstDetail, gstDetailQuotation, doesExistProduct2, update_c_report_setting, update_c_report, amt_update_c_report, getTotalAmountByBarcode } = require('../helpers/helper_function')
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
                PurchaseDetail
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID !== null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternewpo where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Po Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
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
            const [savePurchase] = await mysql2.pool.query(`insert into purchasemasternewpo(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, '${req.headers.currenttime}')`);

            console.log(connected("Data Save SuccessFUlly !!!"));

            console.log("purchaseDetail ===========>", purchaseDetail);
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
                    baseBarCode = 'xxxxx'
                }

                const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnewpo(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)


            }
            console.log(connected("PurchaseDetail Po Data Save SuccessFUlly !!!"));

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
            } = req.body;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })

            if (!PurchaseDetail || PurchaseDetail === undefined) return res.send({ message: "Invalid purchaseDetail Data" })

            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID === null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.Quantity == 0 || !PurchaseMaster?.Quantity || PurchaseMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternewpo where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and SupplierID = '${PurchaseMaster.SupplierID}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)


            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Po Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
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

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternewpo set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}', InvoiceNo = '${PurchaseMaster.InvoiceNo}', PurchaseDate = '${PurchaseMaster.PurchaseDate}' where CompanyID = ${CompanyID}  and ShopID = ${shopid} and ID=${purchase.ID}`)

            console.log(connected("Purchase Po Update SuccessFUlly !!!"));

            // add new product

            let shouldUpdatePayment = false

            for (const item of purchaseDetail) {
                if (item.ID === null) {
                    shouldUpdatePayment = true
                    const doesProduct = 0

                    // generate unique barcode
                    item.UniqueBarcode = await generateUniqueBarcode(CompanyID, supplierId, item)

                    // baseBarcode initiated if same product exist or not condition
                    let baseBarCode = 0;
                    if (doesProduct !== 0) {
                        baseBarCode = doesProduct
                    } else {
                        baseBarCode = 'xxxxx'
                    }

                    const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnewpo(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},'${req.headers.currenttime}')`)
                }
            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

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
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null}, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const [PurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternewpo  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} `)

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnewpo where  PurchaseID = ${ID} and CompanyID = ${CompanyID}  order by purchasedetailnewpo.ID desc`)

            const gst_detail = await gstDetailQuotation(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = gst_detail || []
            response.result.PurchaseDetail = PurchaseDetail
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
                shopId = `and purchasemasternewpo.ShopID = ${shopid}`
            }

            let qry = `select purchasemasternewpo.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternewpo left join user as users1 on users1.ID = purchasemasternewpo.CreatedBy left join user as users on users.ID = purchasemasternewpo.UpdatedBy left join supplier on supplier.ID = purchasemasternewpo.SupplierID left join shop on shop.ID = purchasemasternewpo.ShopID where purchasemasternewpo.Status = 1 and supplier.Name != 'PreOrder Supplier' and purchasemasternewpo.CompanyID = ${CompanyID} ${shopId} order by purchasemasternewpo.ID desc`
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
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select * from purchasemasternewpo where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchase po doesnot exist from this id " })
            }



            const [doesExistProduct] = await mysql2.pool.query(`select * from purchasedetailnewpo where Status = 1 and CompanyID = '${CompanyID}' and PurchaseID = '${Body.ID}'`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const [deletePurchase] = await mysql2.pool.query(`update purchasemasternewpo set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Po Delete SuccessFUlly !!!");

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

            const [doesExist] = await mysql2.pool.query(`select * from purchasedetailnewpo where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }


            const [deletePurchasedetail] = await mysql2.pool.query(`update purchasedetailnewpo set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const [updatePurchaseMaster] = await mysql2.pool.query(`update purchasemasternewpo set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount}, DueAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)



            const [fetchPurchaseMaster] = await mysql2.pool.query(`select * from purchasemasternewpo  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail =  []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const [PurchaseDetail] = await mysql2.pool.query(`select * from purchasedetailnewpo where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)

            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
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

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternewpo.ShopID = ${shopid}`
            }


            let qry = `select purchasemasternewpo.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasemasternewpo left join user as users1 on users1.ID = purchasemasternewpo.CreatedBy left join user as users on users.ID = purchasemasternewpo.UpdatedBy left join supplier on supplier.ID = purchasemasternewpo.SupplierID left join shop on shop.ID = purchasemasternewpo.ShopID where purchasemasternewpo.Status = 1 and supplier.Name != 'PreOrder Supplier' and purchasemasternewpo.CompanyID = '${CompanyID}' ${shopId} and purchasemasternewpo.InvoiceNo like '%${Body.searchQuery}%' OR purchasemasternewpo.Status = 1 and supplier.Name != 'PreOrder Supplier' and purchasemasternewpo.CompanyID = '${CompanyID}' ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasemasternewpo.Status = 1 and supplier.Name != 'PreOrder Supplier'  and purchasemasternewpo.CompanyID = '${CompanyID}' ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
}