const createError = require('http-errors')
const getConnection = require('../helpers/db')
const _ = require("lodash")
const { generateBarcode, generateUniqueBarcode, doesExistProduct, shopID, gstDetail } = require('../helpers/helper_function')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;


module.exports = {
    create: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
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


            const doesExistInvoiceNo = await connection.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

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
            const savePurchase = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,0,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

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
                    baseBarCode = await generateBarcode(CompanyID, 'SB')
                }

                const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


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
                        const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now())`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));

            //  save charge

            if (Charge.length) {
                for (const c of Charge) {
                    const saveCharge = await connection.query(`insert into purchasecharge (PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${savePurchase.insertId}, '${c.ChargeType}', ${CompanyID}, '${c.Description}', ${c.Price}, ${c.GSTPercentage}, ${c.GSTAmount}, '${c.GSTType}', ${c.TotalAmount}, 1, ${LoggedOnUser}, now())`)
                }

                console.log(connected("Charge Data Save SuccessFUlly !!!"));
            }

            const savePaymentMaster = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${supplierId}, ${CompanyID}, ${shopid}, 'Supplier','Debit',now(), 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const savePaymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${CompanyID},${purchase.TotalAmount},${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error
        }
    },
    update: async (req, res, next) => {
        try {

            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
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


            const doesExistInvoiceNo = await connection.query(`select * from purchasemasternew where Status = 1 and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${PurchaseMaster.ID}`)

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

            const doesCheckPayment = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${PurchaseMaster.InvoiceNo}' and BillMasterID = ${PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Charge !!, You have Already Paid Amount of this Invoice` })
            }

            // update purchasemaster
            const updatePurchaseMaster = await connection.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${purchase.ID}`)

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
                        baseBarCode = await generateBarcode(CompanyID, 'SB')
                    }

                    const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


                    let detailDataForBarCode = await connection.query(
                        `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
                    );

                    await Promise.all(
                        detailDataForBarCode.map(async (item) => {
                            const barcode = Number(item.BaseBarCode) * 1000
                            let count = 0;
                            count = item.Quantity;
                            for (j = 0; j < count; j++) {
                                const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now())`)
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
                        const saveCharge = await connection.query(`insert into purchasecharge (PurchaseID, ChargeType,CompanyID,Description, Amount, GSTPercentage, GSTAmount, GSTType, TotalAmount, Status,CreatedBy,CreatedOn ) values (${purchase.ID}, '${c.ChargeType}', ${CompanyID}, '${c.Description}', ${c.Price}, ${c.GSTPercentage}, ${c.GSTAmount}, '${c.GSTType}', ${c.TotalAmount}, 1, ${LoggedOnUser}, now())`)
                    }

                }
                console.log(connected("Charge Data Save SuccessFUlly !!!"));


            }

            //  update payment

            const updatePaymentMaster = await connection.query(`update paymentmaster set PayableAmount = ${PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = ${PurchaseMaster.TotalAmount} , DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            console.log(connected("Payment Update SuccessFUlly !!!"));


            response.message = "data update sucessfully"
            response.data = purchase.ID
            connection.release()
            return res.send(response)


        } catch (error) {
            console.log(error);
            return error
        }
    },
    getPurchaseById: async (req, res, next) => {
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null, Charge: null }, success: true, message: "" }
            const connection = await getConnection.connection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const PurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const PurchaseDetail = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${ID} and CompanyID = ${CompanyID}`)

            const Charge = await connection.query(`select * from purchasecharge where PurchaseID = ${ID} and CompanyID = ${CompanyID}`)

            const gst_detail = await gstDetail(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = gst_detail
            response.result.PurchaseDetail = PurchaseDetail
            response.result.Charge = Charge
            connection.release()
            return res.send(response)

        } catch (error) {
            console.log(error);
            return error
        }
    },
    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and ShopID = ${shopid}`
            }

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.CompanyID = ${CompanyID} ${shopId} order by purchasemasternew.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            connection.release()
            res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from purchasemasternew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "purchase doesnot exist from this id " })
            }


            const doesExistProduct = await connection.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and PurchaseID = '${Body.ID}'`)

            if (doesExistProduct.length) {
                return res.send({ message: `First you'll have to delete product` })
            }


            const deletePurchase = await connection.query(`update purchasemasternew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Purchase Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    deleteProduct: async (req, res, next) => {
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })


            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from purchasedetailnew where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "product doesnot exist from this id " })
            }

            const doesCheckPayment = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Product !!, You have Already Paid Amount of this Invoice` })
            }


            const doesExistProductQty = await connection.query(`select * from barcodemasternew where Status = 1 and CompanyID = '${CompanyID}' and PurchaseDetailID = '${Body.ID}' and CurrentStatus = 'Available'`)

            if (doesExist[0].Quantity !== doesExistProductQty.length) {
                return res.send({ message: `You have product already sold` })
            }

            const deletePurchasedetail = await connection.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const updatePurchaseMaster = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const updatePaymentMaster = await connection.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = ${Body.PurchaseMaster.TotalAmount} , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const fetchPurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const PurchaseDetail = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },
    deleteCharge: async (req, res, next) => {
        try {
            const response = { result: { Charge: null, PurchaseMaster: null }, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from purchasecharge where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "charge doesnot exist from this id " })
            }

            if (Body.PurchaseMaster.ID === null || Body.PurchaseMaster.InvoiceNo.trim() === '' || !Body.PurchaseMaster) return res.send({ message: "Invalid Query Data" })

            const doesCheckPayment = await connection.query(`select * from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.PurchaseMaster.InvoiceNo}' and BillMasterID = ${Body.PurchaseMaster.ID}`)

            if (doesCheckPayment.length > 1) {
                return res.send({ message: `You Can't Delete Charge !!, You have Already Paid Amount of this Invoice` })
            }

            // update purchasemaster
            const updatePurchaseMaster = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)

            //  update payment

            const updatePaymentMaster = await connection.query(`update paymentmaster set PayableAmount = ${Body.PurchaseMaster.TotalAmount} , PaidAmount = 0, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].PaymentMasterID}`)

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = ${Body.PurchaseMaster.TotalAmount} , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const fetchPurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail


            const deleteCharge = await connection.query(`update purchasecharge set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Charge Delete SuccessFUlly !!!");

            const Charge = await connection.query(`select * from purchasecharge where PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.Charge = Charge;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    searchByFeild: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const connection = await getConnection.connection();
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

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            connection.release()
            res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },
    paymentHistory: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: ""}
            const connection = await getConnection.connection();
            const {ID, InvoiceNo} = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })
            if (InvoiceNo === null || InvoiceNo === undefined) return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT paymentdetail.*, purchasemasternew.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN purchasemasternew ON purchasemasternew.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType = 'Vendor' AND purchasemasternew.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.ShopID = ${shopid}`

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            connection.release()
            res.send(response)

        } catch (error) {
            console.log(error);
            return error

        }
    },


}