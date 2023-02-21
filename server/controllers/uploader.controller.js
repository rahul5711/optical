const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID, discountAmount, gstAmount, generateUniqueBarcode, doesExistProduct, generateBarcode } = require('../helpers/helper_function')

var multer = require("multer")
var path = require("path")
var fs = require("fs")
var xlsx = require('node-xlsx')

module.exports = {
    saveFileRecord: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, originalname, fileName, download, path, destination, Type } = req.body

            if (ID !== null) return res.send({ message: "Invalid ID Data" })
            if (!originalname || originalname === undefined || originalname.trim() === "") return res.send({ message: "Invalid originalname Data" })
            if (!fileName || fileName === undefined || fileName.trim() === "") return res.send({ message: "Invalid fileName Data" })
            if (!download || download === undefined || download.trim() === "") return res.send({ message: "Invalid download Data" })
            if (!path || path === undefined || path.trim() === "") return res.send({ message: "Invalid path Data" })
            if (!destination || destination === undefined || destination.trim() === "") return res.send({ message: "Invalid destination Data" })
            if (!Type || Type === undefined || Type.trim() === "") return res.send({ message: "Invalid Type Data" })

            const save = await connection.query(`insert into files(CompanyID, ShopID, originalname, fileName, download,path,destination, Type, Process, PurchaseMaster, UniqueBarcode, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},'${originalname}','${fileName}','${download}','${path}','${destination}','${Type}',0,0,0,1,${LoggedOnUser},now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = []
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
    list: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { currentPage, itemsPerPage, Type } = req.body

            let page = currentPage;
            let limit = itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select * from files where CompanyID = ${CompanyID} and ShopID = ${shopid} and Type = '${Type}' order by id desc`

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
    updateFileRecord: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, key, value, Type } = req.body

            if (ID === null || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (!key || key === undefined || key.trim() === "") return res.send({ message: "Invalid key Data" })
            if (!value || value === undefined) return res.send({ message: "Invalid value Data" })
            if (!Type || Type === undefined || Type.trim() === "") return res.send({ message: "Invalid Type Data" })

            const update = await connection.query(`update files set ${key} = ${value}, CreatedBy=${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and ID = ${ID} and Type='${Type}'`)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
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
    deleteFileRecord: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID } = req.body

            if (ID === null || ID === undefined) return res.send({ message: "Invalid ID Data" })

            const doesExist = await connection.query(`select * from files where ID = ${ID} and CompanyID = ${CompanyID}`)

            if (doesExist.length && doesExist[0].Process === 1) {
                return res.send({message : "you have already processed this file."})
            }


            const deleteData = await connection.query(`delete from files where ID = ${ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = []
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

    processPurchaseFile: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination,
                PurchaseMaster
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            PurchaseMaster.CompanyID = CompanyID;

            if (!PurchaseMaster || PurchaseMaster === undefined) return res.send({ message: "Invalid purchaseMaseter Data" })


            if (!PurchaseMaster.SupplierID || PurchaseMaster.SupplierID === undefined) return res.send({ message: "Invalid SupplierID Data" })

            if (!PurchaseMaster.PurchaseDate || PurchaseMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!PurchaseMaster.InvoiceNo || PurchaseMaster.InvoiceNo === undefined || PurchaseMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (PurchaseMaster.ID !== null || PurchaseMaster.ID === undefined) return res.send({ message: "Invalid Query Data" })

            if (PurchaseMaster.ShopID == 0 || !PurchaseMaster?.ShopID || PurchaseMaster?.ShopID === null) return res.send({ message: "Invalid Query Data ShopID" })


            const doesExistInvoiceNo = await connection.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${PurchaseMaster.CompanyID} and ShopID = ${PurchaseMaster.ShopID}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${PurchaseMaster.InvoiceNo}` })
            }


            const purchase = {
                ID: null,
                SupplierID: PurchaseMaster.SupplierID,
                CompanyID: PurchaseMaster.CompanyID,
                ShopID: PurchaseMaster.ShopID,
                PurchaseDate: PurchaseMaster.PurchaseDate,
                InvoiceNo: PurchaseMaster.InvoiceNo,
                Quantity: 0,
                SubTotal: 0,
                DiscountAmount: 0,
                GSTAmount: 0,
                TotalAmount: 0,
                preOrder: 0,
                PStatus: 0,
                GSTNo: PurchaseMaster.PurchaseMaster || ""
            }

            const currentStatus = "Available";
            const paymentStatus = "Unpaid"
            const supplierId = purchase.SupplierID;

            filepath = destination + '/' + filename

            const sheets = xlsx.parse(filepath) // parses a file
            sheets[0].data = sheets[0].data.filter((el) => el.length > 0);
            let fileData = []
            let processedFileData = []
            for (const sheet of sheets) {
                fileData = [...fileData, ...sheet.data]
            }

            for (const fd of fileData) {
                let newData = {
                    "ProductName": fd[0],
                    "ProductTypeName": fd[1],
                    "UnitPrice": fd[2],
                    "Quantity": fd[3],
                    "DiscountPercentage": fd[4],
                    "GSTPercentage": fd[5],
                    "GSTType": fd[6],
                    "RetailPrice": fd[7],
                    "WholeSalePrice": fd[8],
                    "WholeSale": fd[9],
                    "BrandType": fd[10],
                    "BarcodeExist": fd[11],
                    "BaseBarCode": fd[12]
                }

                newData.ProductExpDate = ""
                newData.Ledger = 0
                newData.DiscountAmount = 0
                newData.GSTAmount = 0
                newData.SubTotal = 0
                newData.TotalAmount = 0
                newData.ProductTypeID = 0
                newData.Multiple = 0
                processedFileData.push(newData)
            }

            processedFileData.reverse()
            processedFileData.pop()
            processedFileData.reverse()


            const body = processedFileData
            if (!body.length) {
                console.log('syncing done....')
                return
            } else {
                const data = body
                if (!(data && data.length)) {
                    return next(createError.BadRequest())
                }
                for (const datum of data) {

                    // product

                    let productName = datum.ProductTypeName

                    const doesExistProductName = await connection.query(`select * from product where CompanyID = ${PurchaseMaster.CompanyID} and Name = '${productName}'`)

                    if (doesExistProductName.length) {
                        datum.ProductTypeID = doesExistProductName[0].ID
                    } else {
                        const saveProduct = await connection.query(`insert into product(CompanyID,Name, HSNCode, GSTPercentage, GSTType, Status, CreatedBy, CreatedOn) values (${PurchaseMaster.CompanyID},'${productName}', '', 0, 'None', 1, ${LoggedOnUser}, now())`)

                        console.log(connected("Product Save SuccessFUlly !!!"));

                        datum.ProductTypeID = saveProduct.insertId
                    }

                    // generate unique barcode
                    datum.UniqueBarcode = await generateUniqueBarcode(PurchaseMaster.CompanyID, supplierId, datum)


                    // base barcode

                    const doesProduct = await doesExistProduct(PurchaseMaster.CompanyID, datum)

                    let basebarCode = 0

                    if (datum.BarcodeExist === 0 && doesProduct === 0) {
                        basebarCode = await generateBarcode(PurchaseMaster.CompanyID, 'SB')
                    } else if (doesProduct !== 0 && datum.BarcodeExist === 0) {
                        basebarCode = doesProduct
                    } else {
                        basebarCode = datum.BaseBarCode
                    }

                    datum.BaseBarCode = basebarCode


                    // calcultaion

                    datum.DiscountAmount = await discountAmount(datum)
                    datum.SubTotal = datum.UnitPrice * datum.Quantity - datum.DiscountAmount
                    datum.GSTAmount = await gstAmount(datum.SubTotal, datum.GSTPercentage)
                    datum.TotalAmount = datum.SubTotal + datum.GSTAmount

                    // purchase master update

                    purchase.GSTAmount += datum.GSTAmount
                    purchase.Quantity += datum.Quantity
                    purchase.DiscountAmount += datum.DiscountAmount
                    purchase.SubTotal += datum.SubTotal
                    purchase.TotalAmount += datum.TotalAmount

                }


                //  save purchase data
                const savePurchase = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,0,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

                console.log(connected("Data Save SuccessFUlly !!!"));


                for (const item of data) {
                    const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${purchase.CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${item.BaseBarCode}',${item.Ledger},1,'${item.BaseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)
                }

                console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));


                //  save barcode

                let detailDataForBarCode = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

                if (detailDataForBarCode.length) {
                    for (const item of detailDataForBarCode) {
                        const barcode = Number(item.BaseBarCode) * 1000
                        let count = 0;
                        count = item.Quantity;
                        for (j = 0; j < count; j++) {
                            const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${item.CompanyID},${purchase.ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now())`)
                        }
                    }
                }

                console.log(connected("Barcode Data Save SuccessFUlly !!!"));

                const savePaymentMaster = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${purchase.CompanyID}, ${purchase.ShopID}, 'Supplier','Debit',now(), 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

                const savePaymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${purchase.CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)

                console.log(connected("Payment Initiate SuccessFUlly !!!"));

                response.message = "data save sucessfully"
                response.data = []
                // connection.release()
                return res.send(response)

            }

        } catch (err) {
            await connection.query("ROLLBACK");
            console.log("ROLLBACK at querySignUp", err);
            throw err;
        } finally {
            await connection.release();
        }
    }

}
