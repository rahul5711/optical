const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
var moment = require("moment");
const { generateShopSequence, shopID } = require('../helpers/helper_function')
const axios = require("axios");

module.exports = {

    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const [doesCount] = await connection.query(`select ID, NoOfShops from company where Status = 1 and ID = ${CompanyID}`)

            const [doesShopCount] = await connection.query(`select ID from shop where Status = 1 and  CompanyID = ${CompanyID}`)

            if (
                doesCount.length > 0 &&
                !isNaN(Number(doesCount[0].NoOfShops)) &&
                doesShopCount.length >= Number(doesCount[0].NoOfShops)
            ) {
                return res.send({
                    message: `You can't create shop !! You have permission of ${Number(doesCount[0].NoOfShops)} shop`
                });
            }

            // if (doesShopCount.length === Number(doesCount[0].NoOfShops)) {
            //     return res.send({ message: `You can't create shop !! You have permission of ${Number(doesCount[0].NoOfShops)} shop` })
            // }

            const [shopSeries] = await connection.query(`select ID from shop where CompanyID = ${CompanyID}`)

            Body.Sno = shopSeries.length + 1


            const genShopSeq = await generateShopSequence();
            // console.log(`insert into shop (ShopSequence,Sno,CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,BillShopWise,RetailBill,WholesaleBill,BillName,AdminDiscount,WaterMark,Signature,DiscountSetting,ShopStatus,AppPassword,IsEmailConfiguration,PerOrder,Manual,Optometrist,ShowPower,ProductGST) values (${genShopSeq},${Body.Sno},${CompanyID},'${Body.Name}', '${Body.AreaName}', '${Body.Address}', '${Body.MobileNo1}','${Body.MobileNo1}','${Body.PhoneNo}','${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.BarcodeName}','${Body.Discount}','${Body.GSTnumber}','${Body.LogoURL}','${Body.ShopTiming}','${Body.WelcomeNote}',1,${LoggedOnUser}, now(),'${Body.HSNCode}','${Body.CustGSTNo}','${Body.Rate}','${Body.Discounts}','${Body.Tax}','${Body.SubTotal}','${Body.Total}','${Body.BillShopWise}','${Body.RetailBill}','${Body.WholesaleBill}','${Body.BillName}','${Body.AdminDiscount}','${Body.WaterMark}','${Body.Signature}','${Body.DiscountSetting}',${Body.ShopStatus} ,'${Body.AppPassword}','${Body.IsEmailConfiguration ? Body.IsEmailConfiguration : 'false'}','${Body.PerOrder}','${Body.Manual}','${Body.Optometrist}','${Body.ShowPower}','${Body.ProductGST}'`);

            const [saveData] = await connection.query(`insert into shop (ShopSequence,Sno,CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,BillShopWise,RetailBill,WholesaleBill,BillName,AdminDiscount,WaterMark,Signature,DiscountSetting,ShopStatus,AppPassword,IsEmailConfiguration,PerOrder,Manual,Optometrist,ShowPower,ProductGST) values (${genShopSeq},${Body.Sno},${CompanyID},'${Body.Name}', '${Body.AreaName}', '${Body.Address}', '${Body.MobileNo1}','${Body.MobileNo1}','${Body.PhoneNo}','${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.BarcodeName}','${Body.Discount}','${Body.GSTnumber}','${Body.LogoURL}','${Body.ShopTiming}','${Body.WelcomeNote}',1,${LoggedOnUser}, now(),'${Body.HSNCode}','${Body.CustGSTNo}','${Body.Rate}','${Body.Discounts}','${Body.Tax}','${Body.SubTotal}','${Body.Total}','${Body.BillShopWise}','${Body.RetailBill}','${Body.WholesaleBill}','${Body.BillName}','${Body.AdminDiscount}','${Body.WaterMark}','${Body.Signature}','${Body.DiscountSetting}',${Body.ShopStatus} ,'${Body.AppPassword}','${Body.IsEmailConfiguration ? Body.IsEmailConfiguration : 'false'}','${Body.PerOrder}','${Body.Manual}','${Body.Optometrist}','${Body.ShowPower}','${Body.ProductGST}')`)

            console.log(connected("Data Added SuccessFUlly !!!"));


            // invoice setting initiated for company

            const invoice = {
                ShopID: `${saveData.insertId}`,
                Retail: 1,
                WholeSale: 1,
                Service: 1,
                Order: 1,
                Ecommerce: 1
            }

            const [saveinvoice] = await connection.query(`insert into invoice(CompanyID, ShopID, Retail, WholeSale, Service, invoice.Order, Ecommerce, CreatedOn)values(${CompanyID},${invoice.ShopID},1,1,1,1,1, now())`);

            console.log(connected("Invoice Number Setting Initiated SuccessFully !!!"));

            // setting for creport
            let date = moment(new Date()).format("YYYY-MM-DD")
            let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");

            const [save_c_report_back_date] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, AcceptTransfer, ClosingStock)values('${back_date}', ${CompanyID},${saveData.insertId},0,0,0,0,0,0,0,0,0,0,0,0,0,0)`);
            const [save_c_report] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, AcceptTransfer, ClosingStock)values('${date}', ${CompanyID},${saveData.insertId},0,0,0,0,0,0,0,0,0,0,0,0,0,0)`);
            console.log(connected(`save_c_report Created SuccessFully !!!!`));

            response.message = "data save sucessfully"
            // response.data =  await connection.query(`select * from shop where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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

    list: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
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

            let qry = `select shop.*, user.Name as CreatedPerson, users.Name as UpdatedPerson from shop left join user on user.ID = shop.CreatedBy left join user as users on users.ID = shop.UpdatedBy where  shop.CompanyID = ${CompanyID}  order by ID desc`
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
    dropdownlist: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let qry = ``

            if (UserGroup === 'CompanyAdmin') {
                qry = `select ID, Name, AreaName, MobileNo1, Website, OrderRequest from shop where Status = 1 and CompanyID = ${CompanyID}  order by ID desc`;
            } else {
                qry = `SELECT shop.ID, shop.Name, shop.AreaName, shop.MobileNo1, shop.Website, shop.OrderRequest FROM shop LEFT JOIN usershop ON usershop.ShopID = shop.ID WHERE usershop.Status = 1 AND shop.CompanyID = ${CompanyID} AND usershop.UserID = ${UserID} order by shop.ID desc`
            }

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

            const [doesExist] = await connection.query(`select ID from shop where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "shop doesnot exist from this id " })
            }


            const [deleteShop] = await connection.query(`update shop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Shop Delete SuccessFUlly !!!");

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
    restore: async (req, res, next) => {
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

            const [doesExist] = await connection.query(`select ID from shop where Status = 0 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "shop doesnot exist from this id " })
            }


            const [restoreShop] = await connection.query(`update shop set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Shop Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"
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

    getShopById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [Shop] = await connection.query(`select * from shop where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (Shop.length) {
                if (Shop[0].Discount === 'false') {
                    Shop[0].Discount = false
                } else {
                    Shop[0].Discount = true
                }
                if (Shop[0].GSTnumber === 'false') {
                    Shop[0].GSTnumber = false
                } else {
                    Shop[0].GSTnumber = true
                }
                if (Shop[0].HSNCode === 'false') {
                    Shop[0].HSNCode = false
                } else {
                    Shop[0].HSNCode = true
                }
                if (Shop[0].CustGSTNo === 'false') {
                    Shop[0].CustGSTNo = false
                } else {
                    Shop[0].CustGSTNo = true
                }
                if (Shop[0].Rate === 'false') {
                    Shop[0].Rate = false
                } else {
                    Shop[0].Rate = true
                }
                if (Shop[0].Discounts === 'false') {
                    Shop[0].Discounts = false
                } else {
                    Shop[0].Discounts = true
                }
                if (Shop[0].Tax === 'false') {
                    Shop[0].Tax = false
                } else {
                    Shop[0].Tax = true
                }
                if (Shop[0].SubTotal === 'false') {
                    Shop[0].SubTotal = false
                } else {
                    Shop[0].SubTotal = true
                }
                if (Shop[0].Total === 'false') {
                    Shop[0].Total = false
                } else {
                    Shop[0].Total = true
                }
                if (Shop[0].BillShopWise === 'false') {
                    Shop[0].BillShopWise = false
                } else {
                    Shop[0].BillShopWise = true
                }
                if (Shop[0].AdminDiscount === 'false') {
                    Shop[0].AdminDiscount = false
                } else {
                    Shop[0].AdminDiscount = true
                }
                if (Shop[0].DiscountSetting === 'false') {
                    Shop[0].DiscountSetting = false
                } else {
                    Shop[0].DiscountSetting = true
                }
                if (Shop[0].PerOrder === 'false') {
                    Shop[0].PerOrder = false
                } else {
                    Shop[0].PerOrder = true
                }
                if (Shop[0].Manual === 'false') {
                    Shop[0].Manual = false
                } else {
                    Shop[0].Manual = true
                }
                if (Shop[0].Optometrist === 'false') {
                    Shop[0].Optometrist = false
                } else {
                    Shop[0].Optometrist = true
                }
                if (Shop[0].ShowPower === 'false') {
                    Shop[0].ShowPower = false
                } else {
                    Shop[0].ShowPower = true
                }
                if (Shop[0].ProductGST === 'false') {
                    Shop[0].ProductGST = false
                } else {
                    Shop[0].ProductGST = true
                }
                if (Shop[0].isWhatsappPaidService === 'false') {
                    Shop[0].isWhatsappPaidService = false
                } else {
                    Shop[0].isWhatsappPaidService = true
                }
            }

            response.message = "data fetch sucessfully"
            response.data = Shop
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
    update: async (req, res, next) => {
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
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            let checkShop = [];

            const orderRequest = Body?.OrderRequest === true || Body?.OrderRequest === "true";

            console.log("Body?.OrderRequest ====>", Body?.OrderRequest);

            if (orderRequest) {

                const [company] = await connection.query(
                    `SELECT OrderRequest FROM company WHERE ID = ? LIMIT 1`,
                    [CompanyID]
                );

                if (!company.length) {
                    return res.send({
                        success: false,
                        message: "Company not found"
                    });
                }

                const companyOrderPermission = company[0].OrderRequest === true || company[0].OrderRequest === "true";

                if (!companyOrderPermission) {
                    return res.send({
                        success: false,
                        message: "You don't have permission to create shop as warehouse"
                    });
                }

                [checkShop] = await connection.query(`SELECT Name FROM shop WHERE CompanyID = ? AND (OrderRequest = 1 OR OrderRequest = "true") LIMIT 1`, [CompanyID]);

                if (checkShop.length) {
                    return res.send({
                        success: false,
                        message: `You have already made warehouse shop: ${checkShop[0].Name}`
                    });
                }
            }

            const [Shop] = await connection.query(`update shop set Name = '${Body.Name}', AreaName = '${Body.AreaName}',Address = '${Body.Address}',MobileNo1='${Body.MobileNo1}',MobileNo2='${Body.MobileNo2}',PhoneNo='${Body.PhoneNo}',Email='${Body.Email}',Website='${Body.Website}',GSTNo='${Body.GSTNo}',CINNo='${Body.CINNo}',BarcodeName='${Body.BarcodeName}',Discount='${Body.Discount}',GSTnumber='${Body.GSTnumber}',LogoURL='${Body.LogoURL}',ShopTiming='${Body.ShopTiming}',WelcomeNote='${Body.WelcomeNote}',Status=1,UpdatedOn=now(),UpdatedBy='${LoggedOnUser}',HSNCode='${Body.HSNCode}',CustGSTNo='${Body.CustGSTNo}',Rate='${Body.Rate}',Discounts='${Body.Discounts}',Tax='${Body.Tax}',SubTotal='${Body.SubTotal}',Total='${Body.Total}',RetailBill='${Body.RetailBill}',WholesaleBill='${Body.WholesaleBill}',BillName='${Body.BillName}',AdminDiscount='${Body.AdminDiscount}',WaterMark='${Body.WaterMark}',Signature='${Body.Signature}',DiscountSetting='${Body.DiscountSetting}',ShopStatus=${Body.ShopStatus} , AppPassword='${Body.AppPassword}', IsEmailConfiguration='${Body.IsEmailConfiguration ? Body.IsEmailConfiguration : 'false'}', PerOrder='${Body.PerOrder}', Manual='${Body.Manual}' , Optometrist='${Body.Optometrist}' , ShowPower='${Body.ShowPower}' , ProductGST='${Body.ProductGST}', OrderRequest = '${Body.OrderRequest ? Body.OrderRequest : false}' where CompanyID = ${CompanyID} and ID = ${Body.ID} `)

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

    //  user shop

    saveUserShop: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.UserID) return res.send({ message: "Invalid Query Data" })
            if (!Body.ShopID) return res.send({ message: "Invalid Query Data" })
            if (!Body.RoleID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID from usershop where Status = 1 and UserID=${Body.UserID} and ShopID=${Body.ShopID}`);
            if (doesExist.length) {
                return res.send({ message: `User already has a role in this shop` });
            }


            const [saveData] = await connection.query(`insert into usershop (UserID,ShopID, RoleID,  Status,  CreatedBy, CreatedOn ) values (${Body.UserID},${Body.ShopID}, ${Body.RoleID},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            const [data] = await connection.query(`select usershop.*, role.Name as RoleName, shop.Name as ShopName, shop.AreaName as AreaName, user.Name as UserName from usershop left join role on role.ID = usershop.RoleID left join shop on shop.ID = usershop.ShopID left join user on user.ID = usershop.UserID where usershop.Status = 1 and usershop.UserID = ${Body.UserID} and usershop.ShopID = ${Body.ShopID} and usershop.ID = ${saveData.insertId}`)
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
    updateUserShop: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.UserID) return res.send({ message: "Invalid Query Data" })
            if (!Body.ShopID) return res.send({ message: "Invalid Query Data" })
            if (!Body.RoleID) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select ID from usershop where Status = 1 and UserID=${Body.UserID} and ShopID!=${Body.ShopID} and ID = ${Body.ID}`);

            if (doesExist.length) {
                return res.send({ message: `User have already role in this shop` });
            }

            const [updateData] = await connection.query(`update usershop set RoleID = ${Body.RoleID}, ShopID = ${Body.ShopID}, UpdatedBy=${LoggedOnUser}, UpdatedOn = now() where ID = ${Body.ID}`)

            // const saveData = await connection.query(`insert into usershop (UserID,ShopID, RoleID,  Status,  CreatedBy, CreatedOn ) values (${Body.UserID},${Body.ShopID}, ${Body.RoleID},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Updated SuccessFUlly !!!"));

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

    deleteUserShop: async (req, res, next) => {
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

            const [doesExist] = await connection.query(`select ID from usershop where Status = 1 and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "user shop doesnot exist of this user " })
            }


            const [deleteShop] = await connection.query(`update usershop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("User Shop Delete SuccessFUlly !!!");

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

    searchByFeild: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let qry = `select shop.*, user.Name as CreatedPerson, users.Name as UpdatedPerson from shop left join user on user.ID = shop.CreatedBy left join user as users on users.ID = shop.UpdatedBy where  shop.CompanyID = ${CompanyID} and shop.Name like '%${Body.searchQuery}%' OR  shop.CompanyID = ${CompanyID} and shop.MobileNo1 like '%${Body.searchQuery}%' OR  shop.CompanyID = ${CompanyID} and shop.AreaName like '%${Body.searchQuery}%' `

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

    // update whatsapp config

    updateWhatsappConfig: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (shopid == 0 || shopid === "0") {
                return res.status(200).json({ success: false, message: "Please select shop" });
            }
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const { isWhatsappPaidService, ApiKey, WhatsappArray } = Body;

            let qry = `update shop set isWhatsappPaidService = '${isWhatsappPaidService}', ApiKey = '${ApiKey}', WhatsappArray = '${JSON.stringify(WhatsappArray)}' where CompanyID = ${CompanyID} and ID = ${shopid}`


            let [data] = await connection.query(qry);

            response.message = "data update sucessfully"
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
    sendWhatsappTemplate: async (req, res, next) => {
        let connection;
        let DB;
        try {

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (shopid == 0 || shopid === "0") {
                return res.status(200).json({ success: false, message: "Please select shop" });
            }

            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            DB = await mysql2.pool.getConnection();

            const [Company] = await DB.query(`select IsPaidWhatsappMsg from company where ID = ${CompanyID}`);

            if (!Company.length) {
                return res.send({
                    success: false,
                    message: "Company not found."
                });
            }

            if (String(Company[0]?.IsPaidWhatsappMsg).toLowerCase() !== "true") {
                return res.send({
                    success: false,
                    message: "WhatsApp paid service is not enabled. Please contact the administrator."
                });
            }

            // const Templates = [
            //     {
            //         TemplateName: "Customer_Birthday",
            //         TemplateValue: "customer_birthday_new_1",
            //         Url: "",
            //         MessageText: "Hi ${CustomerName},Wish You Happy Birthday! Get Special Discount Today. ${ShopName} ${ShopNumber} Thank you for being a valued customer."
            //     },
            //     {
            //         TemplateName: "Customer_Anniversary",
            //         TemplateValue: "customer_anniversary_new",
            //         Url: "",
            //         MessageText: "Hi ${CustomerName},Happy Anniversary. May you love bird stay happy and blessed always. ${ShopName} ${ShopNumber} Thank you for being a valued customer."
            //     },
            //     {
            //         TemplateName: "Customer_Bill_Advance",
            //         TemplateValue: "invoice",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, Your invoice details are as follows: Invoice No.: ${InvoiceNo}, Total Bill Amount: ${BillAmount}, Total Paid Amount: ${PaidAmount}, Total Balance Amount: ${Balance}, Bill Date: ${BillDate}, Delivery Date: ${DeliveryDate}, ${ShopName} ${ShopNumber}. This is an automated invoice notification."
            //     },
            //     {
            //         TemplateName: "Customer_Bill_FinalDelivery",
            //         TemplateValue: "bill",
            //         Url: "document",
            //         MessageText: "Hi ${CustomerName}, Your purchase has been completed successfully. Your bill is available and attached to this message. Store: ${ShopName}, Contact: ${ShopNumber}. Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Bill_OrderReady",
            //         TemplateValue: "order_ready_new",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, Your order is ready for delivery. Please collect it at your earliest convenience. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Eye_Prescription",
            //         TemplateValue: "prescription",
            //         Url: "document",
            //         MessageText: "Hi ${CustomerName}, Your eye testing prescription is ready. Please find the attached PDF copy of your prescription. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Membership_Card",
            //         TemplateValue: "membership_card_1",
            //         Url: "document",
            //         MessageText: "Hi ${CustomerName}, Your membership card is ready. Please keep it for your future reference. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Reward_Points",
            //         TemplateValue: "reward_points_new",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, This is an account notification regarding your reward points. Current balance: ${Balance}, Status: Expiring soon. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Balance_Reminder",
            //         TemplateValue: "balance_reminder",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, This is a gentle reminder that your balance amount of ${Amount}/- has been pending for the last ${Days} days. Kindly clear the payment today. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Eye_Testing_Reminder",
            //         TemplateValue: "customer_eye_testing_reminder",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, This is a reminder that your eye testing appointment is due. Please contact us to schedule or confirm your appointment. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Contact_Lens_Expiry",
            //         TemplateValue: "customer_contact_lens_expiry",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, This is a reminder that your contact lenses are nearing their expiry date. Please contact us if you need assistance or a replacement. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Solution_Expiry",
            //         TemplateValue: "customer_solution_expiry",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, This is a reminder that your contact lens solution is nearing its expiry date. Please contact us if you need a replacement. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Comfort_Feedback",
            //         TemplateValue: "customer_comfort_feedback",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, We would like to know your experience with the product you recently purchased. Your feedback helps us improve our service. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Service_Reminder",
            //         TemplateValue: "customer_service_reminder",
            //         Url: "null",
            //         MessageText: "Hi ${CustomerName}, This is a reminder that your product service is due. Please contact us to schedule your service appointment. ${ShopName} ${ShopNumber} Thank you."
            //     },
            //     {
            //         TemplateName: "Customer_Credit_Note",
            //         TemplateValue: "customer_credit_note",
            //         Url: "document",
            //         MessageText: "Hi ${CustomerName}, Your credit note has been generated and is attached to this message. Please save it for your future reference. ${ShopName} ${ShopNumber} Thank you."
            //     }
            // ];


            const [rows] = await connection.query(`select isWhatsappPaidService, ApiKey, NameSpace, WhatsappNumber, WhatsappArray from shop where CompanyID = ${CompanyID} and ID = ${shopid}`);

            if (!rows.length) {
                return res.send({ success: false, message: "something went wrong" });
            }

            const {
                isWhatsappPaidService,
                ApiKey,
                NameSpace,
                WhatsappNumber,
                WhatsappArray
            } = rows[0];


            if (String(isWhatsappPaidService).toLowerCase() !== "true") {
                return res.send({
                    success: false,
                    message: "WhatsApp paid service is not enabled."
                });
            }

            if (!ApiKey || ApiKey.trim() === "") {
                return res.send({
                    success: false,
                    message: "WhatsApp API Key is not configured."
                });
            }

            if (!NameSpace || NameSpace.trim() === "") {
                return res.send({
                    success: false,
                    message: "WhatsApp Namespace is not configured."
                });
            }

            if (!WhatsappNumber || WhatsappNumber.trim() === "") {
                return res.send({
                    success: false,
                    message: "WhatsApp Number is not configured."
                });
            }

            let Templates = [];

            try {
                Templates = WhatsappArray ? JSON.parse(WhatsappArray) : [];
            } catch (err) {
                return res.send({
                    success: false,
                    message: "Invalid WhatsApp template configuration."
                });
            }

            if (!Templates.length) {
                return res.send({
                    success: false,
                    message: "WhatsApp templates not configured."
                });
            }

            // console.log("Templates :-", Templates)

            console.table({
                isWhatsappPaidService,
                ApiKey,
                NameSpace,
                WhatsappNumber
            })


            const response = {
                data: null,
                success: true,
                message: ""
            };


            const Body = req.body;


            if (!Body || Object.keys(Body).length === 0) {

                return res.send({
                    success: false,
                    message: "Invalid request data"
                });

            }


            const {
                MobileNo,
                TemplateValue,
                MediaURL,
                FileName,
                MediaType
            } = Body;



            if (!MobileNo) {

                return res.send({
                    success: false,
                    message: "MobileNo is required"
                });

            }



            if (!TemplateValue) {

                return res.send({
                    success: false,
                    message: "TemplateValue is required"
                });

            }



            /*
                Find Template
            */

            const Template = Templates.find(
                x => x.TemplateValue === TemplateValue
            );


            if (!Template) {

                return res.send({
                    success: false,
                    message: "Invalid TemplateValue"
                });

            }



            /*
                Extract Template Variables
            */

            const TemplateFields = [
                ...Template.MessageText.matchAll(/\$\{(.*?)\}/g)
            ].map(
                item => item[1]
            );



            /*
                Required Field Validation
            */

            let missingFields = [];


            TemplateFields.forEach(field => {

                if (
                    Body[field] === undefined ||
                    Body[field] === null ||
                    Body[field] === ""
                ) {

                    missingFields.push(field);

                }

            });



            if (missingFields.length > 0) {

                return res.send({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(", ")}`
                });

            }

            /*
                Media Validation
            */

            let isMediaRequired = Template.Url && Template.Url !== "null" && Template.Url !== "";

            // let isMediaRequired = false;

            // if (Template.Url === "") {
            //     isMediaRequired = true;
            // }

            if (isMediaRequired && !MediaURL) {
                return res.send({
                    success: false,
                    message: "MediaURL is required for this template"
                });
            }



            /*
                Create Components
            */

            let components = {};



            TemplateFields.forEach((field, index) => {
                components[`body_${index + 1}`] = {
                    type: "text",
                    value: String(Body[field])
                };
            });



            if (MediaURL) {
                if (MediaType === "image") {
                    components.header_1 = {
                        type: "image",
                        value: MediaURL
                    };
                } else if (MediaType === "video") {
                    components.header_1 = {
                        type: "video",
                        value: MediaURL
                    };
                } else {
                    components.header_1 = {
                        filename: FileName || "document.pdf",
                        type: "document",
                        value: MediaURL
                    };
                }
            }



            /*
                MSG91 Payload
            */

            const payload = {
                integrated_number: `${WhatsappNumber}`,
                content_type: "template",
                payload: {
                    messaging_product: "whatsapp",
                    type: "template",
                    template: {
                        name: TemplateValue,
                        language: {
                            code: "en",
                            policy: "deterministic"
                        },
                        namespace: `${NameSpace}`,
                        to_and_components: [
                            {
                                to: Array.isArray(MobileNo) ? MobileNo : [MobileNo],
                                components
                            }
                        ]
                    }
                }
            };

            console.log(JSON.stringify(payload))

            const apiResponse = await axios.post(
                "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
                payload,
                {
                    headers: {
                        authkey: `${ApiKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            response.data = apiResponse.data;
            response.message = "Whatsapp message sent successfully";
            return res.send(response);
        }
        catch (err) {
            console.log(err);
            next(err);
        } finally {
            if (DB) {
                try {
                    DB.release();
                    console.log("✅ MySQL pool connection released");
                } catch (releaseErr) {
                    console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
                }
            }
            if (connection) {
                try {
                    connection.release();
                    console.log("✅ Company DB connection released");
                } catch (releaseErr) {
                    console.error("⚠️ Error releasing company DB connection:", releaseErr);
                }
            }
        }
    },
    sendWhatsappBulkTemplate: async (req, res, next) => {
        let connection;
        let DB;
        try {

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            if (shopid == 0 || shopid === "0") {
                return res.status(200).json({
                    success: false,
                    message: "Please select shop"
                });
            }

            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();
            /*
            |--------------------------------------------------------------------------
            | Company WhatsApp Paid Service
            |--------------------------------------------------------------------------
            */

            DB = await mysql2.pool.getConnection();
            const [Company] = await DB.query(
                `SELECT IsPaidWhatsappMsg
             FROM company
             WHERE ID = ?`,
                [CompanyID]
            );

            if (!Company.length) {
                return res.send({
                    success: false,
                    message: "Company not found."
                });
            }

            if (
                String(Company[0]?.IsPaidWhatsappMsg).toLowerCase() !== "true"
            ) {
                return res.send({
                    success: false,
                    message: "WhatsApp paid service is not enabled. Please contact the administrator."
                });
            }


            /*
            |--------------------------------------------------------------------------
            | Get Shop WhatsApp Configuration
            |--------------------------------------------------------------------------
            */

            const [rows] = await connection.query(
                `SELECT
                isWhatsappPaidService,
                ApiKey,
                NameSpace,
                WhatsappNumber,
                WhatsappArray
             FROM shop
             WHERE CompanyID = ?
             AND ID = ?`,
                [CompanyID, shopid]
            );

            if (!rows.length) {
                return res.send({
                    success: false,
                    message: "Shop WhatsApp configuration not found."
                });
            }

            const {
                isWhatsappPaidService,
                ApiKey,
                NameSpace,
                WhatsappNumber,
                WhatsappArray
            } = rows[0];


            /*
            |--------------------------------------------------------------------------
            | Shop WhatsApp Validation
            |--------------------------------------------------------------------------
            */

            if (
                String(isWhatsappPaidService).toLowerCase() !== "true"
            ) {
                return res.send({
                    success: false,
                    message: "WhatsApp paid service is not enabled."
                });
            }

            if (!ApiKey || ApiKey.trim() === "") {
                return res.send({
                    success: false,
                    message: "WhatsApp API Key is not configured."
                });
            }

            if (!NameSpace || NameSpace.trim() === "") {
                return res.send({
                    success: false,
                    message: "WhatsApp Namespace is not configured."
                });
            }

            if (!WhatsappNumber || WhatsappNumber.trim() === "") {
                return res.send({
                    success: false,
                    message: "WhatsApp Number is not configured."
                });
            }


            /*
            |--------------------------------------------------------------------------
            | Parse WhatsApp Templates
            |--------------------------------------------------------------------------
            */

            let Templates = [];

            try {

                Templates = WhatsappArray
                    ? JSON.parse(WhatsappArray)
                    : [];

            } catch (err) {

                return res.send({
                    success: false,
                    message: "Invalid WhatsApp template configuration."
                });

            }


            if (!Templates.length) {

                return res.send({
                    success: false,
                    message: "WhatsApp templates not configured."
                });

            }


            /*
            |--------------------------------------------------------------------------
            | Request Body
            |--------------------------------------------------------------------------
            */

            const Body = req.body;

            if (!Body || Object.keys(Body).length === 0) {

                return res.send({
                    success: false,
                    message: "Invalid request data"
                });

            }


            const {
                MobileNo,
                TemplateValue,
                MediaURL,
                FileName,
                MediaType
            } = Body;


            /*
            |--------------------------------------------------------------------------
            | Common Validation
            |--------------------------------------------------------------------------
            */

            if (!MobileNo) {

                return res.send({
                    success: false,
                    message: "MobileNo is required"
                });

            }

            if (!TemplateValue) {

                return res.send({
                    success: false,
                    message: "TemplateValue is required"
                });

            }


            /*
            |--------------------------------------------------------------------------
            | Find Template
            |--------------------------------------------------------------------------
            */

            const Template = Templates.find(
                x => x.TemplateValue === TemplateValue
            );

            if (!Template) {

                return res.send({
                    success: false,
                    message: "Invalid TemplateValue"
                });

            }


            /*
            |--------------------------------------------------------------------------
            | Extract Template Variables
            |--------------------------------------------------------------------------
            |
            | Example:
            |
            | Hi ${CustomerName}
            | ${ShopName}
            | ${ShopNumber}
            |
            */

            const TemplateFields = [
                ...Template.MessageText.matchAll(/\$\{(.*?)\}/g)
            ].map(item => item[1]);


            /*
            |--------------------------------------------------------------------------
            | Mobile Numbers
            |--------------------------------------------------------------------------
            |
            | Request:
            |
            | MobileNo:
            | "919766666248,918777030367"
            |
            */

            let MobileNumbers = String(MobileNo)
                .split(",")
                .map(mobile => mobile.trim())
                .filter(Boolean);


            /*
            |--------------------------------------------------------------------------
            | Remove Duplicate Mobile Numbers
            |--------------------------------------------------------------------------
            */

            MobileNumbers = [...new Set(MobileNumbers)];


            if (!MobileNumbers.length) {

                return res.send({
                    success: false,
                    message: "Valid MobileNo is required"
                });

            }


            /*
            |--------------------------------------------------------------------------
            | Normalize Mobile Number
            |--------------------------------------------------------------------------
            |
            | 9766666248
            |        ↓
            | 919766666248
            |
            | Already 91:
            |
            | 919766666248
            |        ↓
            | 919766666248
            |
            */

            const normalizeMobileNumber = (mobile) => {

                let number = String(mobile)
                    .replace(/\D/g, "");

                // Indian 10 digit number
                if (number.length === 10) {
                    number = `91${number}`;
                }

                return number;
            };


            /*
            |--------------------------------------------------------------------------
            | Validate Mobile Numbers
            |--------------------------------------------------------------------------
            */

            const ValidMobileNumbers = [];
            const InvalidMobileNumbers = [];

            MobileNumbers.forEach(mobile => {

                const normalizedMobile = normalizeMobileNumber(mobile);

                /*
                 * Basic international WhatsApp number validation.
                 * Country code + number should normally be between
                 * 10 and 15 digits.
                 */

                if (
                    normalizedMobile.length >= 10 &&
                    normalizedMobile.length <= 15
                ) {

                    ValidMobileNumbers.push(normalizedMobile);

                } else {

                    InvalidMobileNumbers.push(mobile);

                }

            });


            if (!ValidMobileNumbers.length) {

                return res.send({
                    success: false,
                    message: "No valid mobile numbers found.",
                    invalidMobileNumbers: InvalidMobileNumbers
                });

            }


            /*
            |--------------------------------------------------------------------------
            | Find Customers From Database
            |--------------------------------------------------------------------------
            |
            | We search MobileNo1, MobileNo2 and PhoneNo.
            |
            */

            const CustomerConditions = [];
            const CustomerParams = [];

            ValidMobileNumbers.forEach(mobile => {

                const numberWithoutCountryCode =
                    mobile.startsWith("91") && mobile.length === 12
                        ? mobile.substring(2)
                        : mobile;

                CustomerConditions.push(`
                c.MobileNo1 IN (?, ?)
                OR c.MobileNo2 IN (?, ?)
                OR c.PhoneNo IN (?, ?)
            `);

                CustomerParams.push(
                    mobile,
                    numberWithoutCountryCode,
                    mobile,
                    numberWithoutCountryCode,
                    mobile,
                    numberWithoutCountryCode
                );

            });


            const CustomerWhereCondition =
                CustomerConditions.join(" OR ");


            /*
            |--------------------------------------------------------------------------
            | Fetch Customers
            |--------------------------------------------------------------------------
            */

            const [Customers] = await connection.query(
                `
            SELECT
                c.ID AS CustomerID,

                CASE
                    WHEN c.Title IS NULL OR c.Title = ''
                    THEN c.Name
                    ELSE CONCAT(c.Title, ' ', c.Name)
                END AS CustomerName,

                c.MobileNo1,
                c.MobileNo2,
                c.PhoneNo

            FROM customer c

            WHERE c.CompanyID = ?
            AND (
                ${CustomerWhereCondition}
            )
            `,
                [
                    CompanyID,
                    ...CustomerParams
                ]
            );


            /*
            |--------------------------------------------------------------------------
            | Create Customer Mobile Map
            |--------------------------------------------------------------------------
            */

            const CustomerMap = new Map();


            Customers.forEach(customer => {

                const customerName =
                    customer.CustomerName || "";

                const customerMobiles = [
                    customer.MobileNo1,
                    customer.MobileNo2,
                    customer.PhoneNo
                ];

                customerMobiles.forEach(mobile => {

                    if (!mobile) {
                        return;
                    }

                    const normalized = normalizeMobileNumber(mobile);

                    if (normalized) {

                        CustomerMap.set(
                            normalized,
                            {
                                CustomerID: customer.CustomerID,
                                CustomerName: customerName
                            }
                        );

                    }

                });

            });


            /*
            |--------------------------------------------------------------------------
            | Media Validation
            |--------------------------------------------------------------------------
            */

            const isMediaRequired =
                Template.Url &&
                String(Template.Url).toLowerCase() !== "null" &&
                String(Template.Url).trim() !== "";


            if (isMediaRequired && !MediaURL) {

                return res.send({
                    success: false,
                    message: "MediaURL is required for this template"
                });

            }


            /*
            |--------------------------------------------------------------------------
            | Send Message One By One
            |--------------------------------------------------------------------------
            */

            const results = [];

            for (const mobile of ValidMobileNumbers) {

                try {

                    /*
                    |--------------------------------------------------------------------------
                    | Find Customer
                    |--------------------------------------------------------------------------
                    */

                    const Customer = CustomerMap.get(mobile);


                    if (!Customer) {

                        results.push({
                            MobileNo: mobile,
                            success: false,
                            message: "Customer not found"
                        });

                        continue;

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | Template Body Validation
                    |--------------------------------------------------------------------------
                    |
                    | CustomerName is fetched from database.
                    |
                    */

                    const CustomerBody = {
                        ...Body,
                        CustomerName: Customer.CustomerName
                    };


                    /*
                    |--------------------------------------------------------------------------
                    | Validate Template Fields
                    |--------------------------------------------------------------------------
                    */

                    const missingFields = [];


                    TemplateFields.forEach(field => {

                        if (
                            CustomerBody[field] === undefined ||
                            CustomerBody[field] === null ||
                            String(CustomerBody[field]).trim() === ""
                        ) {

                            missingFields.push(field);

                        }

                    });


                    if (missingFields.length > 0) {

                        results.push({
                            MobileNo: mobile,
                            CustomerID: Customer.CustomerID,
                            CustomerName: Customer.CustomerName,
                            success: false,
                            message:
                                `Missing required fields: ${missingFields.join(", ")}`
                        });

                        continue;

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | Create Components
                    |--------------------------------------------------------------------------
                    */

                    const components = {};


                    /*
                    |--------------------------------------------------------------------------
                    | Body Components
                    |--------------------------------------------------------------------------
                    */

                    TemplateFields.forEach((field, index) => {

                        components[`body_${index + 1}`] = {
                            type: "text",
                            value: String(CustomerBody[field])
                        };

                    });


                    /*
                    |--------------------------------------------------------------------------
                    | Header Media
                    |--------------------------------------------------------------------------
                    */

                    if (MediaURL && isMediaRequired) {

                        const mediaType =
                            String(MediaType || Template.Url)
                                .toLowerCase();


                        if (mediaType === "image") {

                            components.header_1 = {
                                type: "image",
                                value: MediaURL
                            };

                        }
                        else if (mediaType === "video") {

                            components.header_1 = {
                                type: "video",
                                value: MediaURL
                            };

                        }
                        else {

                            components.header_1 = {
                                filename: FileName || "document.pdf",
                                type: "document",
                                value: MediaURL
                            };

                        }

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | MSG91 Payload
                    |--------------------------------------------------------------------------
                    */

                    const payload = {

                        integrated_number: String(WhatsappNumber),

                        content_type: "template",

                        payload: {

                            messaging_product: "whatsapp",

                            type: "template",

                            template: {

                                name: TemplateValue,

                                language: {
                                    code: "en",
                                    policy: "deterministic"
                                },

                                namespace: String(NameSpace),

                                to_and_components: [

                                    {
                                        to: [mobile],
                                        components
                                    }

                                ]

                            }

                        }

                    };


                    console.log(
                        `Sending WhatsApp to ${mobile} (${Customer.CustomerName})`
                    );

                    console.log(
                        JSON.stringify(payload)
                    );


                    /*
                    |--------------------------------------------------------------------------
                    | MSG91 API
                    |--------------------------------------------------------------------------
                    */

                    const apiResponse = await axios.post(

                        "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",

                        payload,

                        {
                            headers: {
                                authkey: String(ApiKey),
                                "Content-Type": "application/json"
                            }
                        }

                    );


                    /*
                    |--------------------------------------------------------------------------
                    | Success Result
                    |--------------------------------------------------------------------------
                    */

                    results.push({

                        MobileNo: mobile,

                        CustomerID: Customer.CustomerID,

                        CustomerName: Customer.CustomerName,

                        success: true,

                        message: "Whatsapp message sent successfully",

                        data: apiResponse.data

                    });


                }
                catch (error) {

                    /*
                    |--------------------------------------------------------------------------
                    | Individual Number Error
                    |--------------------------------------------------------------------------
                    |
                    | One customer's failure will NOT stop other messages.
                    |
                    */

                    console.error(
                        `WhatsApp failed for ${mobile}:`,
                        error?.response?.data || error.message
                    );


                    results.push({

                        MobileNo: mobile,

                        success: false,

                        message:
                            error?.response?.data?.message ||
                            error?.response?.data ||
                            error.message

                    });

                }

            }


            /*
            |--------------------------------------------------------------------------
            | Final Response
            |--------------------------------------------------------------------------
            */

            const successCount =
                results.filter(x => x.success).length;

            const failedCount =
                results.filter(x => !x.success).length;


            return res.send({

                success: successCount > 0,

                message:
                    `WhatsApp processing completed. ${successCount} sent, ${failedCount} failed.`,

                total: ValidMobileNumbers.length,

                successCount,

                failedCount,

                invalidMobileNumbers: InvalidMobileNumbers,

                data: results

            });


        }
        catch (err) {

            console.log(err);

            next(err);

        }
        finally {

            if (DB) {

                try {

                    DB.release();

                    console.log(
                        "✅ MySQL pool connection released"
                    );

                }
                catch (releaseErr) {

                    console.error(
                        "⚠️ Error releasing MySQL pool connection:",
                        releaseErr
                    );

                }

            }


            if (connection) {

                try {

                    connection.release();

                    console.log(
                        "✅ Company DB connection released"
                    );

                }
                catch (releaseErr) {

                    console.error(
                        "⚠️ Error releasing company DB connection:",
                        releaseErr
                    );

                }

            }

        }
    },
    fetchCustomerForWhatsapp: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null,
                success: true,
                message: ""
            };

            const Body = req.body;
            const CompanyID = req.user.CompanyID || 0;
            const shopid = await shopID(req.headers) || 0;

            if (!shopid || shopid == 0) {
                return res.status(200).json({
                    success: false,
                    message: "Please select shop"
                });
            }

            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const {
                CategoryID,
                ProductDescription = ""
            } = Body;

            let categoryFilter = "";

            /*
                Category Filter
            */

            if (CategoryID) {
                const [fetchCategory] = await connection.query(`SELECT Fromm, Too FROM customercategory WHERE CompanyID = ? AND Status = 1 AND CategoryID = ?`, [CompanyID, CategoryID]);
                if (fetchCategory.length) {
                    const { Fromm, Too } = fetchCategory[0];
                    categoryFilter = ` AND billmaster.TotalAmount BETWEEN ${Fromm} AND ${Too}`;
                }
            }

            /*
                Fetch Distinct Customers
            */

            const [fetchCustomer] = await connection.query(
                `SELECT
                c.ID AS CustomerID,
                c.Email AS Email,
                CASE
                    WHEN c.Title IS NULL OR c.Title = ''
                    THEN c.Name
                    ELSE CONCAT(c.Title,' ',c.Name)
                END AS CustomerName,
                CASE
                    WHEN c.MobileNo1 IS NOT NULL
                     AND c.MobileNo1 <> ''
                    THEN c.MobileNo1
                    WHEN c.MobileNo2 IS NOT NULL
                     AND c.MobileNo2 <> ''
                    THEN c.MobileNo2
                    WHEN c.PhoneNo IS NOT NULL
                     AND c.PhoneNo <> ''
                    THEN c.PhoneNo
                    ELSE ''
                END AS Mobile,
                CONCAT(
                    COALESCE(shop.Name,''),
                    CASE
                        WHEN shop.Name IS NOT NULL
                         AND shop.AreaName IS NOT NULL
                        THEN '('
                        ELSE ''
                    END,
                    COALESCE(shop.AreaName,''),
                    CASE
                        WHEN shop.Name IS NOT NULL
                         AND shop.AreaName IS NOT NULL
                        THEN ')'
                        ELSE ''
                    END
                ) AS ShopName

            FROM billmaster
            INNER JOIN customer c
                ON c.ID = billmaster.CustomerID
            LEFT JOIN shop
                ON shop.ID = billmaster.ShopID
            LEFT JOIN billdetail
                ON billdetail.BillID = billmaster.ID
                AND billdetail.Status = 1
            WHERE
                billmaster.CompanyID = ?
                AND billmaster.Status = 1
                AND billmaster.ShopID = ?
                ${categoryFilter}
                ${ProductDescription}
            GROUP BY billmaster.CustomerID
            HAVING Mobile <> ''
            ORDER BY CustomerName ASC`,
                [CompanyID, shopid]
            );

            response.data = fetchCustomer;
            response.message = "Customer data fetched successfully";

            return res.status(200).json(response);

        }
        catch (error) {
            console.log(error);
            next(error);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    },
}