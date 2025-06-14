const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
var moment = require("moment");
const { generateShopSequence } = require('../helpers/helper_function')

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

            if (doesShopCount.length === Number(doesCount[0].NoOfShops)) {
                return res.send({ message: `You can't create shop !! You have permission of ${Number(doesCount[0].NoOfShops)} shop` })
            }

            const [shopSeries] = await connection.query(`select ID from shop where CompanyID = ${CompanyID}`)

            Body.Sno = shopSeries.length + 1


            const genShopSeq = await generateShopSequence();
console.log(`insert into shop (ShopSequence,Sno,CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,BillShopWise,RetailBill,WholesaleBill,BillName,AdminDiscount,WaterMark,Signature,DiscountSetting,ShopStatus,AppPassword,IsEmailConfiguration,PerOrder,Manual) values (${genShopSeq},${Body.Sno},${CompanyID},'${Body.Name}', '${Body.AreaName}', '${Body.Address}', '${Body.MobileNo1}','${Body.MobileNo1}','${Body.PhoneNo}','${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.BarcodeName}','${Body.Discount}','${Body.GSTnumber}','${Body.LogoURL}','${Body.ShopTiming}','${Body.WelcomeNote}',1,${LoggedOnUser}, now(),'${Body.HSNCode}','${Body.CustGSTNo}','${Body.Rate}','${Body.Discounts}','${Body.Tax}','${Body.SubTotal}','${Body.Total}','${Body.BillShopWise}','${Body.RetailBill}','${Body.WholesaleBill}','${Body.BillName}','${Body.AdminDiscount}','${Body.WaterMark}','${Body.Signature}','${Body.DiscountSetting}',${Body.ShopStatus} ,'${Body.AppPassword}','${Body.IsEmailConfiguration ? Body.IsEmailConfiguration : 'false'}','${Body.PerOrder}','${Body.Manual}'`);

            const [saveData] = await connection.query(`insert into shop (ShopSequence,Sno,CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,BillShopWise,RetailBill,WholesaleBill,BillName,AdminDiscount,WaterMark,Signature,DiscountSetting,ShopStatus,AppPassword,IsEmailConfiguration,PerOrder,Manual) values (${genShopSeq},${Body.Sno},${CompanyID},'${Body.Name}', '${Body.AreaName}', '${Body.Address}', '${Body.MobileNo1}','${Body.MobileNo1}','${Body.PhoneNo}','${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.BarcodeName}','${Body.Discount}','${Body.GSTnumber}','${Body.LogoURL}','${Body.ShopTiming}','${Body.WelcomeNote}',1,${LoggedOnUser}, now(),'${Body.HSNCode}','${Body.CustGSTNo}','${Body.Rate}','${Body.Discounts}','${Body.Tax}','${Body.SubTotal}','${Body.Total}','${Body.BillShopWise}','${Body.RetailBill}','${Body.WholesaleBill}','${Body.BillName}','${Body.AdminDiscount}','${Body.WaterMark}','${Body.Signature}','${Body.DiscountSetting}',${Body.ShopStatus} ,'${Body.AppPassword}','${Body.IsEmailConfiguration ? Body.IsEmailConfiguration : 'false'}','${Body.PerOrder}','${Body.Manual}')`)

            console.log(connected("Data Added SuccessFUlly !!!"));


            // invoice setting initiated for company

            const invoice = {
                ShopID: `${saveData.insertId}`,
                Retail: 1,
                WholeSale: 1,
                Service: 1,
                Order: 1
            }

            const [saveinvoice] = await connection.query(`insert into invoice(CompanyID, ShopID, Retail, WholeSale, Service, invoice.Order, CreatedOn)values(${CompanyID},${invoice.ShopID},1,1,1,1, now())`);

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
                qry = `select ID, Name, AreaName, MobileNo1, Website from shop where Status = 1 and CompanyID = ${CompanyID}  order by ID desc`;
            } else {
                qry = `SELECT shop.ID, shop.Name, shop.AreaName, shop.MobileNo1, shop.Website FROM shop LEFT JOIN usershop ON usershop.ShopID = shop.ID WHERE usershop.Status = 1 AND shop.CompanyID = ${CompanyID} AND usershop.UserID = ${UserID} order by shop.ID desc`
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

            const [Shop] = await connection.query(`update shop set Name = '${Body.Name}', AreaName = '${Body.AreaName}',Address = '${Body.Address}',MobileNo1='${Body.MobileNo1}',MobileNo2='${Body.MobileNo2}',PhoneNo='${Body.PhoneNo}',Email='${Body.Email}',Website='${Body.Website}',GSTNo='${Body.GSTNo}',CINNo='${Body.CINNo}',BarcodeName='${Body.BarcodeName}',Discount='${Body.Discount}',GSTnumber='${Body.GSTnumber}',LogoURL='${Body.LogoURL}',ShopTiming='${Body.ShopTiming}',WelcomeNote='${Body.WelcomeNote}',Status=1,UpdatedOn=now(),UpdatedBy='${LoggedOnUser}',HSNCode='${Body.HSNCode}',CustGSTNo='${Body.CustGSTNo}',Rate='${Body.Rate}',Discounts='${Body.Discounts}',Tax='${Body.Tax}',SubTotal='${Body.SubTotal}',Total='${Body.Total}',RetailBill='${Body.RetailBill}',WholesaleBill='${Body.WholesaleBill}',BillName='${Body.BillName}',AdminDiscount='${Body.AdminDiscount}',WaterMark='${Body.WaterMark}',Signature='${Body.Signature}',DiscountSetting='${Body.DiscountSetting}',ShopStatus=${Body.ShopStatus} , AppPassword='${Body.AppPassword}', IsEmailConfiguration='${Body.IsEmailConfiguration ? Body.IsEmailConfiguration : 'false'}', PerOrder='${Body.PerOrder}', Manual='${Body.Manual}' where ID = ${Body.ID} `)

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
    }

}