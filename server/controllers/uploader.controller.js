const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID, discountAmount, gstAmount, generateUniqueBarcode, doesExistProduct, generateBarcode } = require('../helpers/helper_function')
const { Idd } = require('../helpers/helper_function')

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
                return res.send({ message: "you have already processed this file." })
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
                    "WholeSale": fd[9],
                    "BrandType": fd[10],
                    "BarcodeExist": fd[11],
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
                    return res.send({ success: false, message: "Invalid GSTType, You Can Add CGST-SGST , IGST OR None" })
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
                    console.log(item);
                    const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${purchase.CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${item.BaseBarCode}',${item.Ledger},1,'${item.BaseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}',${item.ProductExpDate},0,0,${LoggedOnUser},now())`)
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
                response.data = savePurchase.insertId
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
    },

    processCustomerFile: async (req, res, next) => {
        const connection = await mysql.connection();
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
                newData.Sno = ""
                newData.PhotoURL = ""
                newData.RefferedByDoc = ""
                newData.ReferenceType = ""
                newData.Other = ""
                newData.Remarks = ""
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

                    const customerCount = await connection.query(`select * from customer where CompanyID = ${CompanyID}`)

                    let Idd = customerCount.length

                    let Id = Idd + 1
                    // let Id = await Idd(req)
                    console.log(Id);
                    datum.Idd = Id

                    const customer = await connection.query(`insert into customer(SystemID,ShopID,Idd,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,RefferedByDoc,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Status,CreatedBy,CreatedOn,VisitDate) values('${datum.SystemID}',${shopid},'${datum.Idd}', '${datum.Name}','${datum.Sno}',${datum.CompanyID},'${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${datum.Address}','${datum.GSTNo}','${datum.Email}','${datum.PhotoURL}',${datum.DOB},'${datum.RefferedByDoc}','${datum.Age}',${datum.Anniversary},'${datum.ReferenceType}','${datum.Gender}','${datum.Other}','${datum.Remarks}',1,'${LoggedOnUser}',now(),${datum.VisitDate})`);

                    console.log(connected("Customer Added SuccessFUlly !!!"));
                }

            }

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
    processCusSpectacleFile: async (req, res, next) => {
        const connection = await mysql.connection();
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
                    "ConstantUse": fd[29] || '',
                    "NearWork": fd[30] || '',
                    "DistanceWork": fd[31] || '',
                    "UploadBy": 'Upload',
                    "PhotoURL": '',
                    "FileURL": '',
                    "Family": 'Self',
                    "RefferedByDoc": 'Self',
                    "Reminder": '6',
                    "ExpiryDate": '"0000-00-00"',
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

                    const cID = await connection.query(`select * from customer where CompanyID = ${CompanyID} and SystemID = '${datum.SystemID}'`)
                    if (cID.length) {
                        datum.CustomerID = cID[0].ID

                        const saveSpec = await connection.query(`insert into spectacle_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_Prism,L_Prism,Lens,Shade,Frame,VertexDistance,RefractiveIndex,FittingHeight,ConstantUse,NearWork,DistanceWork,UploadBy,PhotoURL,FileURL,Family,RefferedByDoc,Reminder,ExpiryDate,Status,CreatedBy,CreatedOn) values(${datum.VisitNo}, ${CompanyID}, ${datum.CustomerID},'${datum.REDPSPH}','${datum.REDPCYL}','${datum.REDPAxis}','${datum.REDPVA}','${datum.LEDPSPH}','${datum.LEDPCYL}','${datum.LEDPAxis}','${datum.LEDPVA}','${datum.RENPSPH}','${datum.RENPCYL}','${datum.RENPAxis}','${datum.RENPVA}','${datum.LENPSPH}','${datum.LENPCYL}','${datum.LENPAxis}','${datum.LENPVA}','${datum.REPD}','${datum.LEPD}','${datum.R_Addition}','${datum.L_Addition}','${datum.R_Prism}','${datum.L_Prism}','${datum.Lens}','${datum.Shade}','${datum.Frame}','${datum.VertexDistance}','${datum.RefractiveIndex}','${datum.FittingHeight}','${datum.ConstantUse}','${datum.NearWork}','${datum.DistanceWork}','${datum.UploadBy}','${datum.PhotoURL}','${datum.FileURL}','${datum.Family}','${datum.RefferedByDoc}','${datum.Reminder}','${datum.ExpiryDate}',1,${LoggedOnUser},now())`)

                    }
                }

                console.log(connected("Customer Spec Added SuccessFUlly !!!"));
            }

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
    processCusContactFile: async (req, res, next) => {
        const connection = await mysql.connection();

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
                    "ConstantUse": fd[35] || '',
                    "NearWork": fd[36] || '',
                    "DistanceWork": fd[37] || '',
                    "Multifocal": fd[38] || '',
                    "UploadBy": 'Upload',
                    "PhotoURL": '',
                    "FileURL": '',
                    "Family": 'Self',
                    "RefferedByDoc": 'Self',
                    "Reminder": '6',
                    "ExpiryDate": '"0000-00-00"',
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

                    const cID = await connection.query(`select * from customer where CompanyID = ${CompanyID} and SystemID = '${datum.SystemID}'`)

                    if (cID.length) {
                        datum.CustomerID = cID[0].ID
                        const saveContact = await connection.query(`insert into contact_lens_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_KR,L_KR,R_HVID,L_HVID,R_CS,L_CS,R_BC,L_BC,R_Diameter,L_Diameter,BR,Material,Modality,Other,ConstantUse,NearWork,DistanceWork,Multifocal,PhotoURL,FileURL,Family,RefferedByDoc,Status,CreatedBy,CreatedOn) values (${datum.VisitNo}, ${CompanyID}, ${datum.CustomerID},'${datum.REDPSPH}','${datum.REDPCYL}','${datum.REDPAxis}','${datum.REDPVA}','${datum.LEDPSPH}','${datum.LEDPCYL}','${datum.LEDPAxis}','${datum.LEDPVA}','${datum.RENPSPH}','${datum.RENPCYL}','${datum.RENPAxis}','${datum.RENPVA}','${datum.LENPSPH}','${datum.LENPCYL}','${datum.LENPAxis}','${datum.LENPVA}','${datum.REPD}','${datum.LEPD}','${datum.R_Addition}','${datum.L_Addition}','${datum.R_KR}','${datum.L_KR}','${datum.R_HVID}','${datum.L_HVID}','${datum.R_CS}','${datum.L_CS}','${datum.R_BC}','${datum.L_BC}','${datum.R_Diameter}','${datum.L_Diameter}','${datum.BR}','${datum.Material}','${datum.Modality}','${datum.Other}','${datum.ConstantUse}','${datum.NearWork}','${datum.DistanceWork}','${datum.Multifocal}','${datum.PhotoURL}','${datum.FileURL}','${datum.Family}','${datum.RefferedByDoc}',1,${LoggedOnUser},now())`)



                    }
                }

                console.log(connected("Customer Contact Added SuccessFUlly !!!"));
            }

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
    }

}
