const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const { shopID } = require('../helpers/helper_function')
const mysql2 = require('../database')

module.exports = {
    save: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (Body.PhotoURL == null) {
                Body.PhotoURL = ''
            }

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            // if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
            //     return res.send({ message: "Invalid Query Data" })
            // }
            let shop = ``

            const [fetchCompanySetting] = await mysql2.pool.query(`select FitterShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].FitterShopWise === 'true' && (shopid === "0" || shopid === 0)) {
                return res.send({ message: "Invalid shop id, please select shop" });
            }

            if (fetchCompanySetting[0].FitterShopWise === 'true') {
                shop = ` and fitter.ShopID = ${shopid}`
            }

            const [doesExist] = await mysql2.pool.query(`select ID from fitter where Status = 1 and MobileNo1 = '${Body.MobileNo1}' and CompanyID = ${CompanyID} ${shop}`)

            if (doesExist.length) {
                return res.send({ message: `mobile number already exist ` })
            }

            const [saveData] = await mysql2.pool.query(`insert into fitter (CompanyID, ShopID, Name,  MobileNo1,  MobileNo2,  PhoneNo,  Email,  Address,  Website,  PhotoURL,  CINNO, GSTNo,  Fax, ContactPerson, Remark,  DOB,  Anniversary, Status, CreatedBy , CreatedOn ) values (${CompanyID}, ${shopid}, '${Body.Name}',  '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}','${Body.Email}', '${Body.Address}', '${Body.Website}','${Body.PhotoURL}','${Body.CINNo}','${Body.GSTNo}','${Body.Fax}','${Body.ContactPerson}','${Body.Remark}','${Body.DOB}', '${Body.Anniversary}', 1 , '${LoggedOnUser}', now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    update: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            const [doesExistFitter] = await mysql2.pool.query(`select ID from fitter where MobileNo1 = '${Body.MobileNo1}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistFitter.length) return res.send({ message: `Fitter Already exist from this MobileNo1 ${Body.MobileNo1}` })

            const [saveData] = await mysql2.pool.query(`update fitter set Name = '${Body.Name}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', GSTNo='${Body.GSTNo}', Email='${Body.Email}', Website='${Body.Website}', CINNo='${Body.CINNo}', Fax='${Body.Fax}', PhotoURL='${Body.PhotoURL}', ContactPerson='${Body.ContactPerson}', Remark='${Body.Remark}', DOB='${Body.DOB}', Anniversary='${Body.Anniversary}',Status=1,UpdatedBy=${LoggedOnUser},UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Updated SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    list: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers)
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select FitterShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].FitterShopWise === 'true') {
                shop = ` and fitter.ShopID = ${shopid}`
            }


            let qry = `select fitter.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from fitter left join user as users1 on users1.ID = fitter.CreatedBy left join user as users on users.ID = fitter.UpdatedBy where fitter.Status = 1 ${shop} and fitter.CompanyID = '${CompanyID}'  order by fitter.ID desc`
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

            const [doesExist] = await mysql2.pool.query(`select * from fitter where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "fitter doesnot exist from this id " })
            }


            const [deleteFitter] = await mysql2.pool.query(`update fitter set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Fitter Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            const [data] = await mysql2.pool.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    dropdownlist: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';
            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select FitterShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].FitterShopWise === 'true') {
                shop = ` and fitter.ShopID = ${shopid}`
            }


            let [data] = await mysql2.pool.query(`select fitter.ID, fitter.Name, fitter.MobileNo1 from fitter left join fitterassignedshop on fitterassignedshop.FitterID = fitter.ID where fitter.Status = 1 and fitter.CompanyID = ${CompanyID} ${shop} and fitterassignedshop.ShopID = ${shopid}`);
            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    getRateCard: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.FitterID) res.send({ message: "Invalid Query Data" })
            response.message = "data fetch sucessfully"
            const [data] = await mysql2.pool.query(`select fitterratecard.FitterID, fitterratecard.LensType, fitterratecard.Rate, fitterassignedshop.ShopID  from fitterratecard left join fitterassignedshop on fitterassignedshop.FitterID = fitterratecard.FitterID where  fitterratecard.Status = 1 and fitterratecard.FitterID = ${Body.FitterID} and fitterratecard.CompanyID = ${CompanyID} and fitterassignedshop.Status = 1 `)
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getFitterById: async (req, res, next) => {

        try {
            const response = { data: null, RateCard: [], AssignedShop: [], success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [fitter] = await mysql2.pool.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = fitter
            const [RateCard] = await mysql2.pool.query(`select * from fitterratecard where  Status = 1 and FitterID = ${Body.ID} and CompanyID = ${CompanyID} `)
            response.RateCard = RateCard

            const [AssignedShop] = await mysql2.pool.query(`SELECT fitterassignedshop.*,  shop.Name AS ShopName, shop.AreaName AS AreaName  FROM fitterassignedshop  LEFT JOIN shop ON shop.ID = fitterassignedshop.ShopID WHERE fitterassignedshop.Status = 1 AND fitterassignedshop.FitterID = ${Body.ID} `)
            response.AssignedShop = AssignedShop

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    saveRateCard: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.LensType) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from fitterratecard where Status = 1 and CompanyID = ${CompanyID} and FitterID = ${Body.FitterID} and LensType='${Body.LensType}'`);

            if (doesExist.length) {
                return res.send({ message: `User have already LensType in this shop` });
            }

            const [saveData] = await mysql2.pool.query(`insert into fitterratecard (CompanyID, FitterID,  LensType,  Rate,  Status,  CreatedBy, CreatedOn ) values (${CompanyID}, ${Body.FitterID}, '${Body.LensType}', ${Body.Rate},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    deleteRateCard: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from fitterratecard where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "fitter doesnot exist from this id " })
            }


            const [deleteFitter] = await mysql2.pool.query(`update fitterratecard set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Fitter Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            const [data] = await mysql2.pool.query(`select * from fitterratecard where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            response.data = data
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    saveFitterAssignedShop: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.FitterID) return res.send({ message: "Invalid Query Data" })
            const [doesExist] = await mysql2.pool.query(`select ID from fitterassignedshop where Status = 1 and FitterID=${Body.FitterID} and ShopID=${Body.ShopID}`);

            if (doesExist.length) {
                return res.send({ message: `User have already FitterAssignedShop in this shop` });
            }

            const [saveData] = await mysql2.pool.query(`insert into fitterassignedshop (CompanyID,ShopID, FitterID, Status,  CreatedBy, CreatedOn ) values (${CompanyID}, ${Body.ShopID}, ${Body.FitterID},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    deleteFitterAssignedShop: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from fitterassignedshop where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "fitter doesnot exist from this id " })
            }


            const [deleteFitter] = await mysql2.pool.query(`update fitterassignedshop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("FitterAssignedShop Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            const [data] = await mysql2.pool.query(`select * from fitterassignedshop where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            response.data = data
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
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select FitterShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].FitterShopWise === 'true') {
                shop = ` and fitter.ShopID = ${shopid}`
            }

            let qry = `select fitter.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from fitter left join user as users1 on users1.ID = fitter.CreatedBy left join user as users on users.ID = fitter.UpdatedBy where fitter.Status = 1 ${shop} and fitter.CompanyID = '${CompanyID}' and fitter.Name like '%${Body.searchQuery}%' OR fitter.Status = 1 ${shop} and fitter.CompanyID = '${CompanyID}' and fitter.MobileNo1 like '%${Body.searchQuery}%' `

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    // fitter Invoice

    getFitterInvoice: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Parem } = req.body;


            let parem = ``
            let productTypes = ` and billdetail.ProductTypeName IN ('Lens', 'Frame','Sunglases')`
            if (Parem !== undefined) {
                parem = Parem
            }


            let qry = `SELECT 0 AS Sel , barcodemasternew.ID, barcodemasternew.Barcode, barcodemasternew.BillDetailID, barcodemasternew.PurchaseDetailID, billdetail.BillID,billdetail.BaseBarcode, shop.Name AS ShopName, shop.AreaName, billdetail.ProductName, billdetail.ProductTypeID, billdetail.ProductTypeName, billdetail.HSNCode, billdetail.UnitPrice, billdetail.Quantity, billdetail.SubTotal, billdetail.DiscountPercentage, billdetail.DiscountAmount,billdetail.GSTPercentage, billdetail.GSTAmount, billdetail.GSTType, billdetail.TotalAmount, barcodemasternew.MeasurementID, barcodemasternew.CreatedOn, barcodemasternew.CreatedBy, user.Name AS CreatedPerson, customer.Name as CustomerName, customer.MobileNo1, customer.Sno as MRDNo, billmaster.BillDate as InvoiceDate, billmaster.DeliveryDate, billmaster.InvoiceNo, barcodemasternew.LensType, barcodemasternew.FitterCost,barcodemasternew.FitterID,barcodemasternew.FitterStatus, barcodemasternew.Optionsss as Optionsss, barcodemasternew.FitterDocNo, barcodemasternew.Remark, fitter.Name as FitterName FROM  barcodemasternew LEFT JOIN billdetail ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN billmaster on billmaster.ID = billdetail.BillID LEFT JOIN customer on customer.ID = billmaster.CustomerID LEFT JOIN user ON user.ID =  barcodemasternew.CreatedBy LEFT JOIN shop ON shop.ID =  barcodemasternew.ShopID LEFT JOIN fitter ON fitter.ID =  barcodemasternew.FitterID WHERE  barcodemasternew.FitterID != 0 and barcodemasternew.FitterStatus = 'complete' and barcodemasternew.BillDetailID != 0 and billdetail.Status = 1 and barcodemasternew.ShopID = ${shopid}  and barcodemasternew.CompanyID = ${CompanyID}   ${parem} ${productTypes} GROUP BY barcodemasternew.BillDetailID ORDER BY barcodemasternew.ID DESC`

            console.log(qry);

            const [data] = await mysql2.pool.query(qry)
            response.data = data
            response.message = "success";
            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    saveFitterInvoice: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            let {
                FitterMaster,
                FitterDetail,
            } = req.body;

            FitterDetail = JSON.parse(req.body.FitterDetail)

            if (!FitterMaster || FitterMaster === undefined) return res.send({ message: "Invalid FitterMaster Data" })

            if (!FitterDetail || FitterDetail === undefined) return res.send({ message: "Invalid FitterDetail Data" })

            if (!FitterMaster.FitterID || FitterMaster.FitterID === undefined) return res.send({ message: "Invalid FitterID Data" })

            if (!FitterMaster.PurchaseDate || FitterMaster.PurchaseDate === undefined) return res.send({ message: "Invalid PurchaseDate Data" })

            if (!FitterMaster.InvoiceNo || FitterMaster.InvoiceNo === undefined || FitterMaster.InvoiceNo.trim() === "") return res.send({ message: "Invalid InvoiceNo Data" })

            if (FitterMaster.Quantity == 0 || !FitterMaster?.Quantity || FitterMaster?.Quantity === null) return res.send({ message: "Invalid Query Data Quantity" })

            const [doesExistInvoiceNo] = await mysql2.pool.query(`select ID from fittermaster where Status = 1 and InvoiceNo = '${FitterMaster.InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${FitterMaster.ShopID}`)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${FitterMaster.InvoiceNo}` })
            }

            if (FitterDetail.length === 0) {
                return res.send({ message: "Invalid Query Data FitterDetail" })
            }

            const purchase = {
                ID: null,
                FitterID: FitterMaster.FitterID,
                CompanyID: CompanyID,
                ShopID: FitterMaster.ShopID,
                PurchaseDate: FitterMaster.PurchaseDate ? FitterMaster.PurchaseDate : now(),
                PaymentStatus: FitterMaster.PaymentStatus,
                InvoiceNo: FitterMaster.InvoiceNo,
                GSTNo: FitterMaster.GSTNo ? FitterMaster.GSTNo : '',
                Quantity: FitterMaster.Quantity,
                SubTotal: FitterMaster.SubTotal,
                GSTAmount: FitterMaster.GSTAmount,
                GSTPercentage: FitterMaster.GSTPercentage,
                GSTType: FitterMaster.GSTType,
                TotalAmount: FitterMaster.TotalAmount,
                Status: 1,
                PStatus: 1,
                DueAmount: FitterMaster.DueAmount
            }

            //  save purchase data
            const [savePurchase] = await mysql2.pool.query(`insert into fittermaster(FitterID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,GSTAmount,GSTPercentage,GSTType,TotalAmount,PStatus,Status,DueAmount,CreatedBy,CreatedOn)values(${purchase.FitterID},${purchase.CompanyID},${purchase.ShopID},'${purchase.PurchaseDate}','${purchase.PaymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.GSTAmount},${purchase.GSTPercentage},'${purchase.GSTType}',${purchase.TotalAmount},1,1,${purchase.DueAmount}, ${LoggedOnUser}, now())`);

            console.log(connected("Data Save SuccessFUlly !!!"));


            for (const item of FitterDetail) {
                const [savePurchaseDetail] = await mysql2.pool.query(`insert into fitterdetail(FitterMasterID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,TotalAmount,Status, CustomerInvoice, BarcodeID, LensType, AssignedOn,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${item.ProductName}',${item.ProductTypeID},'${item.ProductTypeName}', ${item.UnitPrice},${item.Quantity},${item.TotalAmount},1,'${item.InvoiceNo}','${item.Barcode}','${item.LensType}','${item.CreatedOn}',${LoggedOnUser},now())`)

                const [updateBarcode] = await mysql2.pool.query(`update barcodemasternew set FitterStatus='invoice', UpdatedOn=now() where BillDetailID = ${item.BillDetailID}`)
            }
            console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

            const [savePaymentMaster] = await mysql2.pool.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${purchase.FitterID}, ${CompanyID}, ${purchase.ShopID}, 'Fitter','Debit',now(), 'Payment Initiated', '', '', ${purchase.TotalAmount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await mysql2.pool.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${purchase.InvoiceNo}',${savePurchase.insertId},${purchase.FitterID},${CompanyID},0,${purchase.TotalAmount},'Fitter','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = purchase.FitterID
            return res.send(response);


        } catch (err) {
            next(err)
        }
    },
    getFitterInvoiceList: async (req, res, next) => {

        try {
            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "gst_details": []
                }]
            }
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
                shopId = `and fittermaster.ShopID = ${shopid}`
            }

            let qry = `SELECT fittermaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM fittermaster LEFT JOIN shop ON shop.ID = fittermaster.ShopID LEFT JOIN user ON user.ID = fittermaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = fittermaster.UpdatedBy LEFT JOIN fitter AS Customer1 ON Customer1.ID = fittermaster.FitterID WHERE  fittermaster.CompanyID = ${CompanyID} ${shopId}  AND fittermaster.Status = 1   Order By fittermaster.ID Desc `

            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`
            let finalQuery = qry + skipQuery;

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

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

            if (data.length) {
                for (const item of data) {
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.TotalAmount

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

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    getFitterInvoiceListByID: async (req, res, next) => {

        try {
            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalGstAmount": 0,
                    "totalAmount": 0,
                    "gst_details": []
                }]
            }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const Body = req.body;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let ID = Body.FitterID;
            let shopId = ``
            if (shopid !== 0) {
                shopId = `and fittermaster.ShopID = ${shopid}`
            }

            let qry = `SELECT fittermaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM fittermaster LEFT JOIN shop ON shop.ID = fittermaster.ShopID LEFT JOIN user ON user.ID = fittermaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = fittermaster.UpdatedBy LEFT JOIN fitter AS Customer1 ON Customer1.ID = fittermaster.FitterID WHERE  fittermaster.CompanyID = ${CompanyID} ${shopId}  and fittermaster.FitterID = ${ID} AND fittermaster.Status = 1   Order By fittermaster.ID Desc `

            let finalQuery = qry;

            let [data] = await mysql2.pool.query(finalQuery);

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

            if (data.length) {
                for (const item of data) {
                    response.calculation[0].totalGstAmount += item.GSTAmount
                    response.calculation[0].totalAmount += item.TotalAmount

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

            response.message = "data fetch sucessfully"
            response.data = data
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    getFitterInvoiceDetailByID: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { ID } = req.body;

            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })



            let master = `SELECT fittermaster.*, Customer1.Name AS CustomerName, Customer1.MobileNo1 AS CustomerMob, shop.Name AS ShopName, shop.AreaName AS AreaName, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser FROM fittermaster LEFT JOIN shop ON shop.ID = fittermaster.ShopID LEFT JOIN user ON user.ID = fittermaster.CreatedBy LEFT JOIN user AS User1 ON User1.ID = fittermaster.UpdatedBy LEFT JOIN fitter AS Customer1 ON Customer1.ID = fittermaster.FitterID WHERE fittermaster.CompanyID = ${CompanyID} and fittermaster.ID = ${ID} AND fittermaster.Status = 1`

            let detail = `select fitterdetail.*, Customer.Name as CustomerName, customer.MobileNo1, billmaster.BillDate, shop.Name as ShopName, shop.AreaName from fitterdetail left join billmaster on billmaster.InvoiceNo = fitterdetail.CustomerInvoice left join customer on customer.ID = billmaster.CustomerID left join shop on shop.ID = billmaster.ShopID where fitterdetail.CompanyID = ${CompanyID} and fitterdetail.Status=1 and fitterdetail.FitterMasterID = ${ID}`


            const [FitterMaster] = await mysql2.pool.query(master)
            const [FitterDetail] = await mysql2.pool.query(detail)

            response.message = "data fetch sucessfully"
            response.FitterMaster = FitterMaster
            response.FitterDetail = FitterDetail
            return res.send(response);



        } catch (err) {
            next(err)
        }
    },
    updateFitterInvoiceNo: async (req, res, next) => {

        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            console.log(req.body);
            const { ID, InvoiceNo, PaymentStatus, TotalAmount, GSTAmount, GSTPercentage, GSTType, DueAmount } = req.body;

            if (!PaymentStatus || PaymentStatus !== 'Unpaid') {
                return res.send({ message: `you have already paid amount` })

            }

            if (!ID || ID === undefined) return res.send({ message: "Invalid ID Data" })
            if (!InvoiceNo || InvoiceNo === undefined) return res.send({ message: "Invalid InvoiceNo Data" })

            const [doesExistInvoiceNo] = await mysql2.pool.query(`select ID from fittermaster where Status = 1 and InvoiceNo = '${InvoiceNo}' and CompanyID = ${CompanyID} and ShopID = ${shopid} and ID != ${ID} `)

            if (doesExistInvoiceNo.length) {
                return res.send({ message: `Purchase Already exist from this InvoiceNo ${InvoiceNo}` })
            }

            const [updateFitterMaster] = await mysql2.pool.query(`update fittermaster set InvoiceNo='${InvoiceNo}', GSTPercentage = ${GSTPercentage}, GSTAmount=${GSTAmount}, GSTType = '${GSTType}', TotalAmount=${TotalAmount}, DueAmount=${DueAmount}, UpdatedOn=now(), UpdatedBy=${LoggedOnUser} where ID = ${ID}`)

            const [updatePaymentDetail] = await mysql2.pool.query(`update paymentdetail set BillID='${InvoiceNo}', DueAmount = ${DueAmount}, UpdatedOn=now(), UpdatedBy=${LoggedOnUser} where BillMasterID = ${ID}`)

            const [fetchPaymentID] = await mysql2.pool.query(`select ID, PaymentMasterID from paymentdetail where  BillMasterID = ${ID}`)

            const [updatePayment] = await mysql2.pool.query(`update paymentmaster set PayableAmount = ${DueAmount}, UpdatedOn=now(), UpdatedBy=${LoggedOnUser} where ID = ${fetchPaymentID[0].PaymentMasterID}`)

            response.message = "data update sucessfully"
            return res.send(response);


        } catch (err) {
            next(err)
        }
    }

}
