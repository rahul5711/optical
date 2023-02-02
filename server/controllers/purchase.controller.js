const createError = require('http-errors')
const mysql = require('../helpers/db')
const _ = require("lodash")
const { generateBarcode, generateUniqueBarcode, doesExistProduct, shopID, gstDetail } = require('../helpers/helper_function')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;


module.exports = {
    create: async (req, res, next) => {
        const connection = await mysql.connection();
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

            const savePaymentDetail = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${supplierId},${CompanyID},0,${purchase.TotalAmount},'Vendor','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
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
    update: async (req, res, next) => {
        const connection = await mysql.connection();
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

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            console.log(connected("Payment Update SuccessFUlly !!!"));


            response.message = "data update sucessfully"
            response.data = purchase.ID
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
    getPurchaseById: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null, Charge: null }, success: true, message: "" }
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
            response.result.PurchaseMaster[0].gst_detail = gst_detail || []
            response.result.PurchaseDetail = PurchaseDetail
            response.result.Charge = Charge
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

            let qry = `select purchasemasternew.*, supplier.Name as SupplierName,  supplier.GSTNo as GSTNo, users1.Name as CreatedPerson,shop.Name as ShopName, shop.AreaName as AreaName, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = ${CompanyID} ${shopId} order by purchasemasternew.ID desc`
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

    delete: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

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
    deleteProduct: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

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

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const fetchPurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const PurchaseDetail = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
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
    deleteCharge: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { result: { Charge: null, PurchaseMaster: null }, success: true, message: "" }

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

            const updatePaymentDetail = await connection.query(`update paymentdetail set Amount = 0 , DueAmount = ${Body.PurchaseMaster.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where ID = ${doesCheckPayment[0].ID}`)

            const fetchPurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail


            const deleteCharge = await connection.query(`update purchasecharge set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Charge Delete SuccessFUlly !!!");

            const Charge = await connection.query(`select * from purchasecharge where PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.Charge = Charge;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
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

            let shopId = ``

            if (shopid !== 0) {
                shopId = `and purchasemasternew.ShopID = ${shopid}`
            }


            let qry = `select purchasemasternew.*, supplier.Name as SupplierName, supplier.GSTNo as GSTNo,shop.Name as ShopName, shop.AreaName as AreaName, users1.Name as CreatedPerson, users.Name as UpdatedPerson from purchasemasternew left join user as users1 on users1.ID = purchasemasternew.CreatedBy left join user as users on users.ID = purchasemasternew.UpdatedBy left join supplier on supplier.ID = purchasemasternew.SupplierID left join shop on shop.ID = purchasemasternew.ShopID where purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId} and purchasemasternew.InvoiceNo like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId}  and supplier.Name like '%${Body.searchQuery}%' OR purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0 and purchasemasternew.CompanyID = '${CompanyID}' ${shopId}  and supplier.GSTNo like '%${Body.searchQuery}%' `

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
    paymentHistory: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, InvoiceNo } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (ID === null || ID === undefined) return res.send({ message: "Invalid Query Data" })
            if (InvoiceNo === null || InvoiceNo === undefined) return res.send({ message: "Invalid Query Data" })

            let qry = `SELECT paymentdetail.*, purchasemasternew.*, paymentmaster.PaymentType AS PaymentType, paymentmaster.PaymentMode AS PaymentMode, paymentmaster.PaidAmount, paymentdetail.DueAmount AS Dueamount FROM paymentdetail LEFT JOIN purchasemasternew ON purchasemasternew.ID = paymentdetail.BillMasterID LEFT JOIN paymentmaster  ON paymentmaster.ID = paymentdetail.PaymentMasterID WHERE paymentdetail.PaymentType = 'Vendor' AND purchasemasternew.ID = ${ID} AND paymentdetail.BillID = '${InvoiceNo}' and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.ShopID = ${shopid}`

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

    barCodeListBySearchString: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1  and shop.Status = 1 and purchasemasternew.PStatus = 0  And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let purchaseData = await connection.query(qry);
            response.data = purchaseData;
            response.message = "Success";

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

    productDataByBarCodeNo: async (req, res, next) => {
        const connection = await mysql.connection();
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

            let barCodeData = await connection.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
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

    transferProduct: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { ProductName, Barcode, BarCodeCount, TransferCount, Remark, ToShopID, TransferFromShop } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            const TransferStatus = "Transfer Initiated";
            const AcceptanceCode = Math.floor(Math.random() * 100000000);

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

            let xferData = await connection.query(qry);
            let xferID = xferData.insertId;

            let selectedRows = await connection.query(
                `SELECT ID FROM barcodemasternew WHERE CurrentStatus = "Available" AND ShopID = ${TransferFromShop} AND Barcode = '${Barcode}' AND PreOrder = '0' and CompanyID ='${CompanyID}' LIMIT ${TransferCount}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await connection.query(
                        `UPDATE barcodemasternew SET TransferID= ${xferID}, CurrentStatus = 'Transfer Pending', TransferStatus = 'Transfer Pending', TransferToShop=${ToShopID}, UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let xferList = await connection.query(qry1);
            response.data = xferList;
            response.message = "Success";
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

    acceptTransfer: async (req, res, next) => {
        const connection = await mysql.connection();
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


            const doesExist = await connection.query(`select * from transfermaster where ID = ${ID} and AcceptanceCode  = '${AcceptanceCode}' and CompanyID = ${CompanyID} and TransferStatus = 'Transfer Initiated'`)

            if (!doesExist.length) {
                return res.send({ success: true, message: `Invalid AcceptanceCode` })
            }

            let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID} and AcceptanceCode = '${AcceptanceCode}'`;

            let xferData = await connection.query(qry);
            let xferID = xferData.insertId;

            let selectedRows = await connection.query(
                `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and CompanyID =${CompanyID}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await connection.query(
                        `UPDATE barcodemasternew SET ShopID = ${TransferToShop}, CurrentStatus = 'Available', TransferStatus = 'Available', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let xferList = await connection.query(qry1);
            response.data = xferList;
            response.message = "Success";
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
    cancelTransfer: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, TransferFromShop, Remark } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const TransferStatus = "Transfer Cancelled";

            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (TransferFromShop === "" || TransferFromShop === undefined || TransferFromShop === null) return res.send({ message: "Invalid Query Data" })


            const doesExist = await connection.query(`select * from transfermaster where ID = ${ID} and CompanyID = ${CompanyID} and TransferStatus = 'Transfer Initiated'`)

            if (!doesExist.length) {
                return res.send({ success: true, message: `Invalid Query` })
            }

            let qry = `Update transfermaster SET DateCompleted = now(),TransferStatus = '${TransferStatus}', UpdatedBy = ${LoggedOnUser}, UpdatedOn = now(), Remark = '${Remark}' where ID = ${ID}`;

            let xferData = await connection.query(qry);
            let xferID = xferData.insertId;

            let selectedRows = await connection.query(
                `SELECT * FROM barcodemasternew WHERE TransferID = ${ID} and CurrentStatus = 'Transfer Pending' and ShopID = ${TransferFromShop} and CompanyID =${CompanyID}`
            );

            await Promise.all(
                selectedRows.map(async (ele) => {
                    await connection.query(
                        `UPDATE barcodemasternew SET TransferID= 0, CurrentStatus = 'Available', TransferStatus = 'Transfer Cancelled', UpdatedBy = ${LoggedOnUser}, updatedOn = now() WHERE ID = ${ele.ID}`
                    );
                })
            );

            let qry1 = `SELECT transfermaster.*, shop.Name AS FromShop,ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON user.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${TransferFromShop} or transfermaster.TransferToShop = ${TransferFromShop}) Order By transfermaster.ID Desc`
            let xferList = await connection.query(qry1);
            response.data = xferList;
            response.message = "Success";
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

    getTransferList: async (req, res, next) => {
        const connection = await mysql.connection();
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

            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, ShopTo.AreaName as ToAreaName,shop.AreaName as FromAreaName, User.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN User ON User.ID = transfermaster.CreatedBy LEFT JOIN User AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID} and transfermaster.TransferStatus = 'Transfer Initiated' and (transfermaster.TransferFromShop = ${shop} or transfermaster.TransferToShop = ${shop}) Order By transfermaster.ID Desc`;

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.data = data;
            response.count = count.length
            response.success = "Success";

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
    getproductTransferReport: async (req, res, next) => {
        const connection = await mysql.connection();
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

            qry = `SELECT transfermaster.*, shop.Name AS FromShop, ShopTo.Name AS ToShop, shop.AreaName AS AreaName, ShopTo.AreaName AS ToAreaName, user.Name AS CreatedByUser, UserUpdate.Name AS UpdatedByUser FROM transfermaster LEFT JOIN shop ON Shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON User.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID}  ` + Parem + ` Order By transfermaster.ID Desc`;

            let data = await connection.query(qry);

            let datum = await connection.query(`SELECT SUM(transfermaster.TransferCount) as totalQty FROM transfermaster LEFT JOIN shop ON Shop.ID = TransferFromShop LEFT JOIN shop AS ShopTo ON ShopTo.ID = TransferToShop LEFT JOIN user ON User.ID = transfermaster.CreatedBy LEFT JOIN user AS UserUpdate ON UserUpdate.ID = transfermaster.UpdatedBy WHERE transfermaster.CompanyID = ${CompanyID}  ` + Parem + ` Order By transfermaster.ID Desc`)

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0

            response.data = data;
            response.success = true;
            response.message = 'Success';

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

    // search

    barcodeDataByBarcodeNo: async (req, res, next) => {
        const connection = await mysql.connection();
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

            qry = `SELECT barcodemasternew.* , company.Name AS CompanyName, shop.Name AS ShopName, shop.AreaName AS AreaName, shop.BarcodeName AS BarcodeShopName, purchasedetailnew.ProductName , purchasedetailnew.ProductTypeName, purchasedetailnew.BaseBarCode AS BarCode, purchasedetailnew.UniqueBarcode, purchasedetailnew.UnitPrice, purchasedetailnew.ProductName, purchasedetailnew.Quantity ,purchasemasternew.InvoiceNo,supplier.Name AS SupplierName   FROM barcodemasternew LEFT JOIN company ON company.ID = barcodemasternew.CompanyID LEFT JOIN shop ON Shop.ID = barcodemasternew.ShopID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE barcodemasternew.CurrentStatus != 'Pre Order' and  purchasedetailnew.Status = 1 and purchasemasternew.PStatus = 0 AND barcodemasternew.CompanyID = ${CompanyID}  ${shopMode} ${mode1}`;

            let barcodelist = await connection.query(qry);
            response.data = barcodelist;
            response.message = "success";

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

    barCodeListBySearchStringSearch: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1 and shop.Status = 1 And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let purchaseData = await connection.query(qry);

            let barcodelist = []

            if (purchaseData.length) {

                for (const b of purchaseData) {
                    let mode1 = `And barcodemasternew.Barcode = '${b.Barcode}'`;
                    let Barcodes = await connection.query(`SELECT barcodemasternew.* , company.Name AS CompanyName, shop.Name AS ShopName, shop.AreaName AS AreaName, shop.BarcodeName AS BarcodeShopName, purchasedetailnew.ProductName , purchasedetailnew.ProductTypeName, purchasedetailnew.BaseBarCode AS BarCode, purchasedetailnew.UniqueBarcode, purchasedetailnew.UnitPrice, purchasedetailnew.ProductName, purchasedetailnew.Quantity ,purchasemasternew.InvoiceNo,supplier.Name AS SupplierName   FROM barcodemasternew LEFT JOIN company ON company.ID = barcodemasternew.CompanyID LEFT JOIN shop ON Shop.ID = barcodemasternew.ShopID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE barcodemasternew.CurrentStatus != 'Pre Order' and  purchasedetailnew.Status = 1 AND barcodemasternew.CompanyID = ${CompanyID}  ${shopMode} ${mode1}`)

                    if (Barcodes) {
                        Barcodes.forEach(e => {
                            barcodelist.push(e)
                        })
                    }
                }
            }


            response.data = barcodelist;
            response.message = "Success";

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

    updateBarcode: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, Barcode, Remark, CurrentStatus } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (ID === "" || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })
            if (Barcode === "" || Barcode === undefined || Barcode === null) return res.send({ message: "Invalid Query Data" })
            if (CurrentStatus === "" || CurrentStatus === undefined || CurrentStatus === null) return res.send({ message: "Invalid Query Data" })

            qry = `Update barcodemasternew set CurrentStatus = '${CurrentStatus}' , Barcode = '${Barcode}' , Remark = '${Remark}' Where ID = ${ID}`;

            let barcode = await connection.query(qry);
            response.data = [];
            response.message = "success";
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


    // Inventory summary

    getInventorySummary: async (req, res, next) => {
        const connection = await mysql.connection();
        try {

            const response = { data: null, success: true, message: "" }
            const { Parem } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (Parem === "" || Parem === undefined || Parem === null) return res.send({ message: "Invalid Query Data" })

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count,purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasemasternew.PStatus =0 and purchasedetailnew.Status = 1 ` + Parem + " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";

            let data = await connection.query(qry);
            response.data = data
            response.message = "success";
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

    updateInventorySummary: async (req, res, next) => {
        const connection = await mysql.connection();
        try {

            const response = { data: null, success: true, message: "" }
            const { PurchaseDetailID, BrandType } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (BrandType === "" || BrandType === undefined || BrandType === null) return res.send({ message: "Invalid Query Data" })
            if (PurchaseDetailID === "" || PurchaseDetailID === undefined || PurchaseDetailID === null) return res.send({ message: "Invalid Query Data" })

            qry = `update purchasedetailnew set BrandType = ${BrandType}, UpdatedBy=${LoggedOnUser}, CreatedOn=now() where ID = ${PurchaseDetailID} and CompanyID = ${CompanyID}`

            let data = await connection.query(qry);
            response.data = []
            response.message = "success";
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


    // Purchase Reports

    getPurchasereports: async (req, res, next) => {
        const connection = await mysql.connection();
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

            qry = `SELECT purchasemasternew.*, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo FROM purchasemasternew  LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID WHERE purchasemasternew.Status = 1 and purchasemasternew.PStatus = 0  AND purchasemasternew.CompanyID = ${CompanyID}  ` + Parem;




            let datum = await connection.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.SubTotal) as totalUnitPrice  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1  AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem)

            let data = await connection.query(qry);


            qry2 = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and purchasemasternew.PStatus = 0  AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem;

            let data2 = await connection.query(qry2);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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


            response.calculation[0].gst_details = values;

            response.calculation[0].totalQty = datum[0].totalQty ? datum[0].totalQty : 0
            response.calculation[0].totalGstAmount = datum[0].totalGstAmount ? datum[0].totalGstAmount : 0
            response.calculation[0].totalAmount = datum[0].totalAmount ? datum[0].totalAmount : 0
            response.calculation[0].totalDiscount = datum[0].totalDiscount ? datum[0].totalDiscount : 0
            response.calculation[0].totalUnitPrice = datum[0].totalUnitPrice ? datum[0].totalUnitPrice : 0
            response.data = data
            response.message = "success";
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

    getPurchasereportsDetail: async (req, res, next) => {
        const connection = await mysql.connection();
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

            qry = `SELECT purchasedetailnew.*,purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus, shop.Name AS ShopName,  shop.AreaName AS AreaName, supplier.Name AS SupplierName,supplier.GSTNo AS SupplierGSTNo,product.HSNCode AS HSNcode  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1 and purchasemasternew.PStatus = 0  AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem;




            let datum = await connection.query(`SELECT SUM(purchasedetailnew.Quantity) as totalQty, SUM(purchasedetailnew.GSTAmount) as totalGstAmount, SUM(purchasedetailnew.TotalAmount) as totalAmount, SUM(purchasedetailnew.DiscountAmount) as totalDiscount, SUM(purchasedetailnew.SubTotal) as totalUnitPrice  FROM purchasedetailnew INNER JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN shop ON shop.ID = purchasemasternew.ShopID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID LEFT JOIN product ON product.ID = purchasedetailnew.ProductTypeID WHERE purchasedetailnew.Status = 1  AND purchasedetailnew.CompanyID = ${CompanyID}  ` + Parem)

            let data = await connection.query(qry);


            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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


    // pre order

    createPreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
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
            const savePurchase = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

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

                const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            //  save barcode

            let detailDataForBarCode = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

            if (detailDataForBarCode.length) {
                for (const item of detailDataForBarCode) {
                    const barcode = Number(item.BaseBarCode) * 1000
                    let count = 0;
                    count = 1;
                    for (j = 0; j < count; j++) {
                        const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(),1)`)
                    }
                }
            }

            console.log(connected("Barcode Data Save SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = savePurchase.insertId
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

    listPreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
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

    getPurchaseByIdPreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { result: { PurchaseMaster: null, PurchaseDetail: null }, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined || ID === null) return res.send({ message: "Invalid Query Data" })

            const PurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${ID} and CompanyID = ${CompanyID} and ShopID = ${shopid} and PStatus = 1`)

            const PurchaseDetail = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${ID} and CompanyID = ${CompanyID}`)



            const gst_detail = await gstDetail(CompanyID, ID) || []

            response.message = "data fetch sucessfully"
            response.result.PurchaseMaster = PurchaseMaster
            response.result.PurchaseMaster[0].gst_detail = gst_detail || []
            response.result.PurchaseDetail = PurchaseDetail
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

    deletePreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

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

    deleteProductPreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { result: { PurchaseDetail: null, PurchaseMaster: null }, success: true, message: "" }

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




            const deletePurchasedetail = await connection.query(`update purchasedetailnew set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Product Delete SuccessFUlly !!!");

            // update purchasemaster
            const updatePurchaseMaster = await connection.query(`update purchasemasternew set Quantity = ${Body.PurchaseMaster.Quantity}, SubTotal = ${Body.PurchaseMaster.SubTotal}, DiscountAmount = ${Body.PurchaseMaster.DiscountAmount}, GSTAmount=${Body.PurchaseMaster.GSTAmount}, TotalAmount = ${Body.PurchaseMaster.TotalAmount} , UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${Body.PurchaseMaster.InvoiceNo}' and ShopID = ${shopid}`)



            const fetchPurchaseMaster = await connection.query(`select * from purchasemasternew  where Status = 1 and ID = ${Body.PurchaseMaster.ID} and CompanyID = ${CompanyID} and ShopID = ${shopid}`)

            const gst_detail = await gstDetail(CompanyID, Body.PurchaseMaster.ID) || []

            fetchPurchaseMaster[0].gst_detail = gst_detail

            const PurchaseDetail = await connection.query(`select * from purchasedetailnew where  PurchaseID = ${doesExist[0].PurchaseID} and CompanyID = ${CompanyID}`)
            response.result.PurchaseDetail = PurchaseDetail;
            response.result.PurchaseMaster = fetchPurchaseMaster;
            response.message = "data delete sucessfully"
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

    updatePreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
        try {

            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const currentStatus = "PreOrder";
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

            if (PurchaseMaster.preOrder === false || PurchaseMaster.preOrder === "false" || !PurchaseMaster?.preOrder || PurchaseMaster?.preOrder === null) return res.send({ message: "Invalid Query Data preOrder" })


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



            // update purchasemaster
            const updatePurchaseMaster = await connection.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${purchase.ID}`)

            console.log(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${PurchaseMaster.InvoiceNo}' and ShopID = ${shopid} and ID=${purchase.ID}`);

            console.log(connected("Purchase Update SuccessFUlly !!!"));

            // add new product

            for (const item of purchaseDetail) {
                if (item.ID === null) {
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

                    const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.SubTotal},${item.DiscountPercentage},${item.DiscountAmount},${item.GSTPercentage},${item.GSTAmount},'${item.GSTType}',${item.TotalAmount},${item.RetailPrice},${item.WholeSalePrice},${item.Multiple},${item.WholeSale},'${baseBarCode}',${item.Ledger},1,'${baseBarCode}',0,${item.BrandType},'${item.UniqueBarcode}','${item.ProductExpDate}',0,0,${LoggedOnUser},now())`)


                    let detailDataForBarCode = await connection.query(
                        `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
                    );

                    await Promise.all(
                        detailDataForBarCode.map(async (item) => {
                            const barcode = Number(item.BaseBarCode) * 1000
                            let count = 0;
                            count = 1;
                            for (j = 0; j < count; j++) {
                                const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${shopid},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(), 1)`)
                            }
                        })
                    )


                }
            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));


            response.message = "data update sucessfully"
            response.data = purchase.ID
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

    searchByFeildPreOrder: async (req, res, next) => {
        const connection = await mysql.connection();
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

    // product inventory report

    getProductInventoryReport: async (req, res, next) => {
        const connection = await mysql.connection();
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

            qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasedetailnew.Status = 1  ` +
                Parem +
                " Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID" + " HAVING barcodemasternew.Status = 1";

            let data = await connection.query(qry);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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

    // product expiry report
    getProductExpiryReport: async (req, res, next) => {
        const connection = await mysql.connection();
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

            let data = await connection.query(qry);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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

    // purchase charge report

    getPurchaseChargeReport: async (req, res, next) => {
        const connection = await mysql.connection();
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

            let data = await connection.query(qry);

            let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)

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

    // purchase return

    barCodeListBySearchStringPR: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const { searchString, ShopMode, ProductName } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (searchString === "" || searchString === undefined || searchString === null) return res.send({ message: "Invalid Query Data" })

            let SearchString = searchString + "%";
            let shopMode = ``;

            if (ShopMode === "false" || ShopMode === false) {
                shopMode = " And barcodemasternew.ShopID = " + shopid;
            }
            if (ShopMode === "true" || ShopMode === true) {
                shopMode = " ";
            }

            const qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.Name as ShopName,shop.AreaName, purchasedetailnew.ProductName, purchasedetailnew.UnitPrice, purchasedetailnew.DiscountPercentage, purchasedetailnew.DiscountAmount,purchasedetailnew.GSTPercentage, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType,barcodemasternew.* FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE purchasedetailnew.ProductTypeName = '${ProductName}' ${shopMode} AND purchasedetailnew.ProductName LIKE '${SearchString}' AND barcodemasternew.CurrentStatus = "Available"   AND purchasedetailnew.Status = 1  and shop.Status = 1 and purchasemasternew.PStatus = 0  And barcodemasternew.CompanyID = '${CompanyID}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`

            let purchaseData = await connection.query(qry);
            response.data = purchaseData;
            response.message = "Success";

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

    productDataByBarCodeNoPR: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            console.log(req.body);
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
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.UnitPrice, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.GSTAmount, purchasedetailnew.DiscountAmount, purchasedetailnew.DiscountPercentage,purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE CurrentStatus = "Available" AND barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1  and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = '${CompanyID}' ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount,purchasedetailnew.UnitPrice, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice,purchasedetailnew.DiscountAmount, purchasedetailnew.DiscountPercentage, purchasedetailnew.ProductTypeID, barcodemasternew.*  FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.Barcode = '${barCode}' and PurchaseDetail.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = '${CompanyID}'`;
            }

            let barCodeData = await connection.query(qry);
            response.data = barCodeData[0];
            response.message = "Success";
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
