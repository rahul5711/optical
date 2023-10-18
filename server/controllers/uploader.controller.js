const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID, discountAmount, gstAmount, generateUniqueBarcode, doesExistProduct, generateBarcode } = require('../helpers/helper_function')
const { Idd } = require('../helpers/helper_function')

var multer = require("multer")
var path = require("path")
var fs = require("fs")
var xlsx = require('node-xlsx')
const mysql2 = require('../database');
const { count } = require('console');

module.exports = {
    saveFileRecord: async (req, res, next) => {
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

            const [save] = await mysql2.pool.query(`insert into files(CompanyID, ShopID, originalname, fileName, download,path,destination, Type, Process, PurchaseMaster, UniqueBarcode, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},'${originalname}','${fileName}','${download}','${path}','${destination}','${Type}',0,0,0,1,${LoggedOnUser},now())`)

            console.log(connected("Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    list: async (req, res, next) => {
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
    updateFileRecord: async (req, res, next) => {
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

            const [update] = await mysql2.pool.query(`update files set ${key} = ${value}, CreatedBy=${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and ID = ${ID} and Type='${Type}'`)

            console.log(connected("Data Update SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    deleteFileRecord: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID } = req.body

            if (ID === null || ID === undefined) return res.send({ message: "Invalid ID Data" })

            const [doesExist] = await mysql2.pool.query(`select * from files where ID = ${ID} and CompanyID = ${CompanyID}`)

            if (doesExist.length && doesExist[0].Process === 1) {
                return res.send({ message: "you have already processed this file." })
            }


            const [deleteData] = await mysql2.pool.query(`delete from files where ID = ${ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Delete SuccessFUlly !!!"));

            response.message = "data delete sucessfully"
            response.data = []
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },

    processPurchaseFile: async (req, res, next) => {
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


            const [doesExistInvoiceNo] = await mysql2.pool.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${PurchaseMaster.CompanyID} and ShopID = ${PurchaseMaster.ShopID}`)

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

                // if (fd[6] !== "CGST-SGST" && fd[6] !== "IGST" && fd[6] !== "None" && fd[6] === "GSTType") {
                //   return res.send({success : false , message : "Invalid GSTType, You Can Add CGST-SGST , IGST OR None"})
                // }
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
                    "WholeSale": fd[9] ? fd[9] : 0,
                    "BrandType": fd[10] ? fd[10] : 0,
                    "BarcodeExist": fd[11] ? fd[11] : 0,
                    "BaseBarCode": fd[12],
                    "ProductExpDate": fd[13]
                }

                // newData.ProductExpDate = ""
                newData.Ledger = 0
                newData.DiscountAmount = 0
                newData.GSTAmount = 0
                newData.SubTotal = 0
                newData.TotalAmount = 0
                newData.ProductTypeID = 0
                newData.Multiple = 0

                if (newData.GSTType !== "CGST-SGST" && newData.GSTType !== "IGST" && newData.GSTType !== "None" && newData.GSTType !== "GSTType") {
                    return res.send({ success: false, message: "Invalid GSTType, You Can Add CGST-SGST , IGST OR None, Duplicate Invoice Number" })
                }

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

                    const [doesExistProductName] = await mysql2.pool.query(`select * from product where CompanyID = ${PurchaseMaster.CompanyID} and Name = '${productName}'`)

                    if (doesExistProductName.length) {
                        datum.ProductTypeID = doesExistProductName[0].ID
                    } else {
                        const [saveProduct] = await mysql2.pool.query(`insert into product(CompanyID,Name, HSNCode, GSTPercentage, GSTType, Status, CreatedBy, CreatedOn) values (${PurchaseMaster.CompanyID},'${productName}', '', 0, 'None', 1, ${LoggedOnUser}, now())`)

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
                const [savePurchase] = await mysql2.pool.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,0,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

                console.log(connected("Data Save SuccessFUlly !!!"));


                for (const item of data) {
                    console.log(item);
                    const [savePurchaseDetail] = await mysql2.pool.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn, Is_Upload, BarcodeExist)values(${savePurchase.insertId},${purchase.CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${item.BaseBarCode}',${item.Ledger},1,'${item.BaseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}',${item.ProductExpDate},0,0,${LoggedOnUser},now(), 1, ${item.BarcodeExist === 0 ? 0 : 1})`)
                }

                console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));


                //  save barcode

                let [detailDataForBarCode] = await mysql2.pool.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

                if (detailDataForBarCode.length) {
                    for (const item of detailDataForBarCode) {
                        let barcode = 0
                        console.log(item.BarcodeExist, 'item.BarcodeExistitem.BarcodeExistitem.BarcodeExist');
                        if (item.BarcodeExist === 1) {
                            barcode = item.BaseBarCode
                        } else if (item.BarcodeExist === 0) {
                            barcode = Number(item.BaseBarCode)
                        }
                        let count = 0;
                        count = item.Quantity;
                        for (j = 0; j < count; j++) {
                            const [saveBarcode] = await mysql2.pool.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${item.CompanyID},${purchase.ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now())`)
                        }
                    }
                }

                console.log(connected("Barcode Data Save SuccessFUlly !!!"));

                const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${purchase.CompanyID}, ${purchase.ShopID}, 'Supplier','Debit',now(), 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

                const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${purchase.CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)

                console.log(connected("Payment Initiate SuccessFUlly !!!"));

                response.message = "data save sucessfully"
                response.data = savePurchase.insertId
                return res.send(response)

            }

        } catch (err) {
            next(err)
        }
    },

    processCustomerFile: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;


            filepath = destination + '/' + filename

            const sheets = xlsx.parse(filepath) // parses a file
            sheets[0].data = sheets[0].data.filter((el) => el.length > 0);
            let fileData = []
            let processedFileData = []
            for (const sheet of sheets) {
                fileData = [...fileData, ...sheet.data]
            }


            let count = 0
            for (const fd of fileData) {
                count += 1
                console.log(count);
                let newData = {
                    "SystemID": `${CompanyID}-${fd[0]}` ? `${CompanyID}-${fd[0]}` : "",
                    "Name": fd[1] ? fd[1] : "",
                    "MobileNo1": fd[2] ? fd[2] : "",
                    "MobileNo2": fd[3] ? fd[3] : "",
                    "PhoneNo": fd[4] ? fd[4] : "",
                    "Address": fd[5] ? fd[5] : "",
                    "Email": fd[6] ? fd[6] : "",
                    "DOB": fd[7] ? fd[7] : '"0000-00-00"',
                    "Age": fd[8] ? fd[8] : 0,
                    "Anniversary": fd[9] ? fd[9] : '"0000-00-00"',
                    "Gender": fd[10] ? fd[10] : "",
                    "VisitDate": fd[11] ? fd[11] : '"0000-00-00"'
                }

                newData.Idd = 0
                newData.CompanyID = CompanyID
                newData.Sno = `${CompanyID}-${fd[0]}` ? `${CompanyID}-${fd[0]}` : ""
                newData.PhotoURL = ""
                newData.RefferedByDoc = ""
                newData.ReferenceType = ""
                newData.Other = ""
                newData.Remarks = fd[12] ? fd[12] : ''
                newData.Category = fd[13] ? fd[13] : ''
                newData.GSTNo = ""
                // console.log(newData);
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

                    const [customerCount] = await mysql2.pool.query(`select * from customer where CompanyID = ${CompanyID}`)

                    let Idd = customerCount.length

                    let Id = Idd + 1
                    // let Id = await Idd(req)
                    console.log(Id);
                    datum.Idd = Id

                    let remark = datum.Remarks.toString().replace(/[\r\n]/gm, '');
                    let addr = datum.Address.toString().replace(/[\r\n]/gm, '');

                    const [customer] = await mysql2.pool.query(`insert into customer(SystemID,ShopID,Idd,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,RefferedByDoc,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Category,Status,CreatedBy,CreatedOn,VisitDate) values('${datum.SystemID}',${shopid},'${datum.Idd}', '${datum.Name}','${datum.Sno}',${datum.CompanyID},'${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${addr}','${datum.GSTNo}','${datum.Email}','${datum.PhotoURL}',${datum.DOB},'${datum.RefferedByDoc}','${datum.Age}',${datum.Anniversary},'${datum.ReferenceType}','${datum.Gender}','${datum.Other}',' ${remark.toString()} ','${datum.Category}',1,'${LoggedOnUser}',now(),${datum.VisitDate})`);

                    console.log(connected("Customer Added SuccessFUlly !!!"));
                }

            }

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response)
            // mysql2.pool.release()

        } catch (err) {
            console.log(err);
            next(err)
        }
    },
    processSupplierFile: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;


            filepath = destination + '/' + filename

            const sheets = xlsx.parse(filepath) // parses a file
            sheets[0].data = sheets[0].data.filter((el) => el.length > 0);
            let fileData = []
            let processedFileData = []
            for (const sheet of sheets) {
                fileData = [...fileData, ...sheet.data]
            }


            let count = 0
            for (const fd of fileData) {
                count += 1
                console.log(count);
                let newData = {
                    "Name": fd[0] ? fd[0] : "",
                    "MobileNo1": fd[1] ? fd[1] : "",
                    "MobileNo2": fd[2] ? fd[2] : "",
                    "PhoneNo": fd[3] ? fd[3] : "",
                    "Address": fd[4] ? fd[4] : "",
                    "GSTNo": fd[5] ? fd[5] : "",
                    "GSTType": fd[6] ? fd[6] : "None",
                    "Email": fd[7] ? fd[7] : "",
                    "Website": fd[8] ? fd[8] : "",
                    "CINNo": fd[9] ? fd[9] : "",
                    "Fax": fd[10] ? fd[10] : "",
                    "PhotoURL": fd[11] ? fd[11] : "",
                    "ContactPerson": fd[12] ? fd[12] : "",
                    "Remark": fd[13] ? fd[13] : "",
                    "DOB": fd[14] ? fd[14] : '"0000-00-00"',
                    "Anniversary": fd[15] ? fd[15] : '"0000-00-00"',
                    "Gender": fd[16] ? fd[16] : "",
                    "VisitDate": fd[17] ? fd[17] : '"0000-00-00"'
                }

                newData.CompanyID = CompanyID
                newData.Sno = 0
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

                    let remark = datum.Remark.toString().replace(/[\r\n]/gm, '');
                    let addr = datum.Address.toString().replace(/[\r\n]/gm, '');

                    const [dataCount] = await mysql2.pool.query(`select * from supplier where CompanyID = ${CompanyID}`)
                    let sno = dataCount.length + 1
                    datum.Sno = sno
                    const [saveData] = await mysql2.pool.query(`insert into supplier (Sno,Name, CompanyID,  MobileNo1, MobileNo2 , PhoneNo, Address,GSTNo, Email,Website ,CINNo,Fax,PhotoURL,ContactPerson,Remark,GSTType,DOB,Anniversary, Status,CreatedBy,CreatedOn) values ('${datum.Sno}','${datum.Name}', ${datum.CompanyID}, '${datum.MobileNo1}', '${datum.MobileNo2}', '${datum.PhoneNo}','${addr}','${datum.GSTNo}','${datum.Email}','${datum.Website}','${datum.CINNo}','${datum.Fax}','${datum.PhotoURL}','${datum.ContactPerson}','${remark}','${datum.GSTType}','${datum.DOB}','${datum.Anniversary}',1,${LoggedOnUser}, now())`)

                    console.log(connected("Supplier Added SuccessFUlly !!!"));
                }

            }

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response)

        } catch (err) {
            next(err)
        }
    },
    processCusSpectacleFile: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;


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
                    "SystemID": `${CompanyID}-${fd[0]}` || 0,
                    "REDPSPH": fd[1] || '',
                    "REDPCYL": fd[2] || '',
                    "REDPAxis": fd[3] || '',
                    "REDPVA": fd[4] || '',
                    "LEDPSPH": fd[5] || '',
                    "LEDPCYL": fd[6] || '',
                    "LEDPAxis": fd[7] || '',
                    "LEDPVA": fd[8] || '',
                    "RENPSPH": fd[9] || '',
                    "RENPCYL": fd[10] || '',
                    "RENPAxis": fd[11] || '',
                    "RENPVA": fd[12] || '',
                    "LENPSPH": fd[13] || '',
                    "LENPCYL": fd[14] || '',
                    "LENPAxis": fd[15] || '',
                    "LENPVA": fd[16] || '',
                    "REPD": fd[17] || '',
                    "LEPD": fd[18] || '',
                    "R_Addition": fd[19] || '',
                    "L_Addition": fd[20] || '',
                    "R_Prism": fd[21] || '',
                    "L_Prism": fd[22] || '',
                    "Lens": fd[23] || '',
                    "Shade": fd[24] || '',
                    "Frame": fd[25] || '',
                    "VertexDistance": fd[26] || '',
                    "RefractiveIndex": fd[27] || '',
                    "FittingHeight": fd[28] || '',
                    "ConstantUse": fd[29] || 0,
                    "NearWork": fd[30] || 0,
                    "DistanceWork": fd[31] || 0,
                    "UploadBy": 'Upload',
                    "PhotoURL": '',
                    "FileURL": '',
                    "Family": 'Self',
                    "RefferedByDoc": 'Self',
                    "Reminder": '6',
                    "ExpiryDate": fd[32] ? fd[32] : "0000-00-00",
                    "VisitDate": fd[33] ? fd[33] : "0000-00-00",
                }
                newData.VisitNo = 1,
                    newData.CompanyID = CompanyID,
                    newData.CustomerID = 0
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

                    const [cID] = await mysql2.pool.query(`select * from customer where CompanyID = ${CompanyID} and SystemID = '${datum.SystemID}'`)
                    if (cID.length) {
                        datum.CustomerID = cID[0].ID

                        const [saveSpec] = await mysql2.pool.query(`insert into spectacle_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_Prism,L_Prism,Lens,Shade,Frame,VertexDistance,RefractiveIndex,FittingHeight,ConstantUse,NearWork,DistanceWork,UploadBy,PhotoURL,FileURL,Family,RefferedByDoc,Reminder,ExpiryDate,VisitDate,Status,CreatedBy,CreatedOn) values(${datum.VisitNo}, ${CompanyID}, ${datum.CustomerID},'${datum.REDPSPH}','${datum.REDPCYL}','${datum.REDPAxis}','${datum.REDPVA}','${datum.LEDPSPH}','${datum.LEDPCYL}','${datum.LEDPAxis}','${datum.LEDPVA}','${datum.RENPSPH}','${datum.RENPCYL}','${datum.RENPAxis}','${datum.RENPVA}','${datum.LENPSPH}','${datum.LENPCYL}','${datum.LENPAxis}','${datum.LENPVA}','${datum.REPD}','${datum.LEPD}','${datum.R_Addition}','${datum.L_Addition}','${datum.R_Prism}','${datum.L_Prism}','${datum.Lens}','${datum.Shade}','${datum.Frame}','${datum.VertexDistance}','${datum.RefractiveIndex}','${datum.FittingHeight}',${datum.ConstantUse},${datum.NearWork},${datum.DistanceWork},'${datum.UploadBy}','${datum.PhotoURL}','${datum.FileURL}','${datum.Family}','${datum.RefferedByDoc}','${datum.Reminder}',${datum.ExpiryDate},${datum.VisitDate},1,${LoggedOnUser},now())`)

                    }
                }

                console.log(connected("Customer Spec Added SuccessFUlly !!!"));
            }

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    processCusContactFile: async (req, res, next) => {

        try {

            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;


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
                    "SystemID": `${CompanyID}-${fd[0]}` || 0,
                    "REDPSPH": fd[1] || '',
                    "REDPCYL": fd[2] || '',
                    "REDPAxis": fd[3] || '',
                    "REDPVA": fd[4] || '',
                    "LEDPSPH": fd[5] || '',
                    "LEDPCYL": fd[6] || '',
                    "LEDPAxis": fd[7] || '',
                    "LEDPVA": fd[8] || '',
                    "RENPSPH": fd[9] || '',
                    "RENPCYL": fd[10] || '',
                    "RENPAxis": fd[11] || '',
                    "RENPVA": fd[12] || '',
                    "LENPSPH": fd[13] || '',
                    "LENPCYL": fd[14] || '',
                    "LENPAxis": fd[15] || '',
                    "LENPVA": fd[16] || '',
                    "REPD": fd[17] || '',
                    "LEPD": fd[18] || '',
                    "R_Addition": fd[19] || '',
                    "L_Addition": fd[20] || '',
                    "R_KR": fd[21] || '',
                    "L_KR": fd[22] || '',
                    "R_HVID": fd[23] || '',
                    "L_HVID": fd[24] || '',
                    "R_CS": fd[25] || '',
                    "L_CS": fd[26] || '',
                    "R_BC": fd[27] || '',
                    "L_BC": fd[28] || '',
                    "R_Diameter": fd[29] || '',
                    "L_Diameter": fd[30] || '',
                    "BR": fd[31] || '',
                    "Material": fd[32] || '',
                    "Modality": fd[33] || '',
                    "Other": fd[34] || '',
                    "ConstantUse": fd[35] || 0,
                    "NearWork": fd[36] || 0,
                    "DistanceWork": fd[37] || 0,
                    "Multifocal": fd[38] || 0,
                    "UploadBy": 'Upload',
                    "PhotoURL": '',
                    "FileURL": '',
                    "Family": 'Self',
                    "RefferedByDoc": 'Self',
                    "Reminder": '6',
                    "ExpiryDate": fd[39] || "0000-00-00",
                    "VisitDate": fd[40] || "0000-00-00",
                }
                newData.VisitNo = 1,
                    newData.CompanyID = CompanyID,
                    newData.CustomerID = 0
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
                    console.log(datum);

                    const [cID] = await mysql2.pool.query(`select * from customer where CompanyID = ${CompanyID} and SystemID = '${datum.SystemID}'`)

                    if (cID.length) {
                        datum.CustomerID = cID[0].ID
                        const [saveContact] = await mysql2.pool.query(`insert into contact_lens_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_KR,L_KR,R_HVID,L_HVID,R_CS,L_CS,R_BC,L_BC,R_Diameter,L_Diameter,BR,Material,Modality,Other,ConstantUse,NearWork,DistanceWork,Multifocal,PhotoURL,FileURL,Family,RefferedByDoc,Status,CreatedBy,CreatedOn, ExpiryDate, VisitDate) values (${datum.VisitNo}, ${CompanyID}, ${datum.CustomerID},'${datum.REDPSPH}','${datum.REDPCYL}','${datum.REDPAxis}','${datum.REDPVA}','${datum.LEDPSPH}','${datum.LEDPCYL}','${datum.LEDPAxis}','${datum.LEDPVA}','${datum.RENPSPH}','${datum.RENPCYL}','${datum.RENPAxis}','${datum.RENPVA}','${datum.LENPSPH}','${datum.LENPCYL}','${datum.LENPAxis}','${datum.LENPVA}','${datum.REPD}','${datum.LEPD}','${datum.R_Addition}','${datum.L_Addition}','${datum.R_KR}','${datum.L_KR}','${datum.R_HVID}','${datum.L_HVID}','${datum.R_CS}','${datum.L_CS}','${datum.R_BC}','${datum.L_BC}','${datum.R_Diameter}','${datum.L_Diameter}','${datum.BR}','${datum.Material}','${datum.Modality}','${datum.Other}',${datum.ConstantUse},${datum.NearWork},${datum.DistanceWork},${datum.Multifocal},'${datum.PhotoURL}','${datum.FileURL}','${datum.Family}','${datum.RefferedByDoc}',1,${LoggedOnUser},now(), ${datum.ExpiryDate},${datum.VisitDate})`)



                    }
                }

                console.log(connected("Customer Contact Added SuccessFUlly !!!"));
            }

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    processBillMaster: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;


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
                    "SystemID": `${CompanyID}-${fd[0]}` || 0,
                    "BillNo": fd[1] || '',
                    "SerialNo": fd[2] || '',
                    "BillDate": fd[3] || '',
                    "DeliveryDate": fd[4] || '',
                    "Qty": fd[5] || 0,
                    "SubTotal": fd[6] || 0,
                    "GSTPercentage": fd[7] || 0,
                    "GST": fd[8] || 0,
                    "AdditionalDiscountPercentage": fd[9] || 0,
                    "AdditionalDiscount": fd[10] || 0,
                    "GrandTotal": fd[11] || 0,
                    "Paid": fd[12] || 0,
                    "Balance": fd[13] || 0,

                }
                newData.CompanyID = CompanyID,
                    newData.CustomerID = 0
                processedFileData.push(newData)
            }

            processedFileData.reverse()
            processedFileData.pop()
            processedFileData.reverse()
            let count = 0
            const body = processedFileData
            let data = []
            if (!body.length) {
                console.log('syncing done....')
                return
            } else {
                data = body

                if (!(data && data.length)) {
                    return next(createError.BadRequest())
                }

                for (let datum of data) {
                    count += 1

                    console.log("checking", count);

                    if (!datum.SystemID || datum.SystemID === 0) {
                        return res.send({ message: "Invalid Query SystemID" })
                    }
                    if (!datum.BillNo || datum.BillNo === '') {
                        return res.send({ message: "Invalid Query BillNo" })
                    }
                    if (!datum.Qty || datum.Qty === 0) {
                        return res.send({ message: "Invalid Query Qty" })
                    }


                    const [fetchCustomer] = await mysql2.pool.query(`select * from customer where CompanyID = ${CompanyID} and SystemID = '${datum.SystemID}'`)

                    if (fetchCustomer.length === 0) {
                        return res.send({ message: `Invalid SystemID, Customer Not Found From ${datum.SystemID}` })
                    }

                    datum.CustomerID = fetchCustomer[0].ID

                    const [fetchBillMaster] = await mysql2.pool.query(`select * from oldbillmaster where CustomerID = ${datum.CustomerID} and CompanyID = ${CompanyID} and BillNo = '${datum.BillNo}'`)

                    if (fetchBillMaster.length) {
                        return res.send({ message: `Invalid BillNo, Bill Already Found From Provided Bill No :- ${datum.BillNo}` })
                    }
                }


            }


            count = 0
            // save data
            for (let datum of data) {
                count += 1

                console.log("data saving", count);
                const [saveData] = await mysql2.pool.query(`insert into oldbillmaster(SystemID, CompanyID, ShopID, CustomerID, BillNo, SerialNo, BillDate, DeliveryDate, Qty, SubTotal, GSTPercentage, GST, AdditionalDiscountPercentage, AdditionalDiscount, GrandTotal,Paid,Balance, CreatedBy, CreatedOn) values('${datum.SystemID}', ${datum.CompanyID}, ${shopid} , ${datum.CustomerID}, '${datum.BillNo}', '${datum.SerialNo}', ${datum.BillDate} ,${datum.DeliveryDate}, ${datum.Qty}, ${datum.SubTotal}, ${datum.GSTPercentage}, ${datum.GST}, ${datum.AdditionalDiscountPercentage}, ${datum.AdditionalDiscount}, ${datum.GrandTotal},${datum.Paid},${datum.Balance}, ${LoggedOnUser}, now())`)
            }

            console.log(connected("Customer Bill Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    processBillDetail: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const {
                filename,
                originalname,
                path,
                destination
            } = req.body

            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;


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
                    "BillNo": fd[0] || '',
                    "ProductDescription": fd[1] || '',
                    "UnitPrice": fd[2] || 0,
                    "Qty": fd[3] || 0,
                    "DiscountPercentage": fd[4] || 0,
                    "Discount": fd[5] || 0,
                    "SubTotal": fd[6] || 0,
                    "GSTPercentage": fd[7] || 0,
                    "GST": fd[8] || 0,
                    "Amount": fd[9] || 0

                }
                newData.CompanyID = CompanyID,
                    newData.CustomerID = 0
                newData.BillMasterID = 0
                processedFileData.push(newData)
            }

            processedFileData.reverse()
            processedFileData.pop()
            processedFileData.reverse()

            const body = processedFileData

            let data = []
            if (!body.length) {
                console.log('syncing done....')
                return
            } else {
                data = body

                if (!(data && data.length)) {
                    return next(createError.BadRequest())
                }

                for (let datum of data) {
                    if (!datum.BillNo || datum.BillNo === '') {
                        return res.send({ message: "Invalid Query BillNo" })
                    }
                    if (!datum.Qty || datum.Qty === 0) {
                        return res.send({ message: "Invalid Query Qty" })
                    }

                    const [fetchBillMaster] = await mysql2.pool.query(`select * from oldbillmaster where CompanyID = ${CompanyID} and BillNo = '${datum.BillNo}'`)

                    if (!fetchBillMaster.length) {
                        return res.send({ message: `Invalid BillNo, Bill Not Found From Provided Bill No ${datum.BillNo}` })
                    }

                    datum.BillMasterID = fetchBillMaster[0].ID
                    datum.CustomerID = fetchBillMaster[0].CustomerID
                }


            }


            // save data
            count = 0

            for (let datum of data) {
                count += 1
                console.log(`data  saving :- ${count}`);
                const [saveData] = await mysql2.pool.query(`insert into oldbilldetail(BillMasterID, CompanyID, CustomerID, ProductDescription, UnitPrice, Qty, DiscountPercentage, Discount, SubTotal, GSTPercentage, GST, Amount, CreatedBy, CreatedOn) values(${datum.BillMasterID}, ${datum.CompanyID}, ${datum.CustomerID}, '${datum.ProductDescription}',${datum.UnitPrice}, ${datum.Qty}, ${datum.DiscountPercentage},${datum.Discount},${datum.SubTotal}, ${datum.GSTPercentage}, ${datum.GST}, ${datum.Amount}, ${LoggedOnUser}, now())`)
            }

            console.log(connected("Customer Bill Detail Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = []
            return res.send(response);
        } catch (error) {
            next(error)
        }
    }

}
