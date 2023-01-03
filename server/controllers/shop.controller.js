const createError = require('http-errors')
const getConnection = require('../helpers/db')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;


module.exports = {

    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Name)) return res.send({ message: "Invalid Query Data" })

            const doesCount = await connection.query(`select * from company where Status = 1 and ID = ${CompanyID}`)

            const doesShopCount = await connection.query(`select * from shop where CompanyID = ${CompanyID}`)

            if (doesShopCount.length === Number(doesCount[0].NoOfShops)) {
                return res.send({ message: `You Can't Create Shop !! You Have permission Of ${Number(doesCount[0].NoOfShops)} Shop` })
            }

            const saveData = await connection.query(`insert into shop (CompanyID,Name, AreaName,  Address,  MobileNo1, MobileNo2 , PhoneNo, Email, Website, GSTNo,CINNo, BarcodeName, Discount, GSTnumber, LogoURL, ShopTiming, WelcomeNote, Status,CreatedBy,CreatedOn,HSNCode,CustGSTNo,Rate,Discounts,Tax, SubTotal,Total,ShopStatus ) values (${CompanyID},'${Body.Name}', '${Body.AreaName}', '${Body.Address}', '${Body.MobileNo1}','${Body.MobileNo1}','${Body.PhoneNo}','${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.BarcodeName}','${Body.Discount}','${Body.GSTnumber}','${Body.LogoURL}','${Body.ShopTiming}','${Body.WelcomeNote}',1,${LoggedOnUser}, now(),'${Body.HSNCode}','${Body.CustGSTNo}','${Body.Rate}','${Body.Discounts}','${Body.Tax}','${Body.SubTotal}','${Body.Total}',${Body.ShopStatus})`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            // response.data =  await connection.query(`select * from shop where Status = 1 and CompanyID = '${CompanyID}' order by ID desc`)
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
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select shop.*, user.Name as CreatedPerson, users.Name as UpdatedPerson from shop left join user on user.ID = shop.CreatedBy left join user as users on users.ID = shop.UpdatedBy where shop.Status = 1 and shop.CompanyID = '${CompanyID}'  order by ID desc`
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
            return error
        }
    },
    dropdownlist: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            let qry = ``
            
            if (UserGroup === 'CompanyAdmin') {
                qry = `select * from shop where Status = 1 and CompanyID = '${CompanyID}'  order by ID desc`;
            } else {
                qry = `SELECT * FROM shop LEFT JOIN usershop ON usershop.ShopID = shop.ID WHERE usershop.Status = 1 AND shop.CompanyID = ${CompanyID} AND usershop.UserID = ${UserID} order by shop.ID desc`
            }

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
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from shop where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "shop doesnot exist from this id " })
            }


            const deleteShop = await connection.query(`update shop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Shop Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    restore: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from shop where Status = 0 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "shop doesnot exist from this id " })
            }


            const restoreShop = await connection.query(`update shop set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Shop Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    getShopById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const Shop = await connection.query(`select * from shop where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

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
            }

            response.message = "data fetch sucessfully"
            response.data = Shop
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const Shop = await connection.query(`update shop set Name = '${Body.Name}', AreaName = '${Body.AreaName}',Address = '${Body.Address}',MobileNo1='${Body.MobileNo1}',MobileNo2='${Body.MobileNo2}',PhoneNo='${Body.PhoneNo}',Email='${Body.Email}',Website='${Body.Website}',GSTNo='${Body.GSTNo}',CINNo='${Body.CINNo}',BarcodeName='${Body.BarcodeName}',Discount='${Body.Discount}',GSTnumber='${Body.GSTnumber}',LogoURL='${Body.LogoURL}',ShopTiming='${Body.ShopTiming}',WelcomeNote='${Body.WelcomeNote}',Status=1,UpdatedOn=now(),UpdatedBy='${LoggedOnUser}',HSNCode='${Body.HSNCode}',CustGSTNo='${Body.CustGSTNo}',Rate='${Body.Rate}',Discounts='${Body.Discounts}',Tax='${Body.Tax}',SubTotal='${Body.SubTotal}',Total='${Body.Total}',ShopStatus=${Body.ShopStatus} where ID = ${Body.ID} `)

            response.message = "data update sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    //  user shop 

    saveUserShop: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.UserID) return res.send({ message: "Invalid Query Data" })
            if (!Body.ShopID) return res.send({ message: "Invalid Query Data" })
            if (!Body.RoleID) return res.send({ message: "Invalid Query Data" })

            doesExist = await connection.query(`select * from usershop where Status = 1 and UserID=${Body.UserID} and ShopID=${Body.ShopID}`);

            if (doesExist.length) {
               return res.send({message: `User have already role in this shop`});
            }


            const saveData = await connection.query(`insert into usershop (UserID,ShopID, RoleID,  Status,  CreatedBy, CreatedOn ) values (${Body.UserID},${Body.ShopID}, ${Body.RoleID},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data =  await connection.query(`select usershop.*, role.Name as RoleName, shop.Name as ShopName, shop.AreaName as AreaName, user.Name as UserName from usershop left join role on role.ID = usershop.RoleID left join shop on shop.ID = usershop.ShopID left join user on user.ID = usershop.UserID where usershop.Status = 1 and usershop.UserID = ${Body.UserID} and usershop.ShopID = ${Body.ShopID} and usershop.ID = ${saveData.insertId}`)
            connection.release()
            return res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },
    updateUserShop: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.UserID) return res.send({ message: "Invalid Query Data" })
            if (!Body.ShopID) return res.send({ message: "Invalid Query Data" })
            if (!Body.RoleID) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            // doesExist = await connection.query(`select * from usershop where Status = 1 and UserID=${Body.UserID} and ShopID=${Body.ShopID} and ID = ${Body.ID}`);

            // if (doesExist.length) {
            //    return res.send({message: `User have already role in this shop`});
            // }

            const updateData = await connection.query(`update usershop set RoleID = ${Body.RoleID}, ShopID = ${Body.ShopID}, UpdatedBy=${LoggedOnUser}, UpdatedOn = now() where ID = ${Body.ID}`)

            // const saveData = await connection.query(`insert into usershop (UserID,ShopID, RoleID,  Status,  CreatedBy, CreatedOn ) values (${Body.UserID},${Body.ShopID}, ${Body.RoleID},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Updated SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            connection.release()
            return res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    deleteUserShop: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from usershop where Status = 1 and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "user shop doesnot exist of this user " })
            }


            const deleteShop = await connection.query(`update usershop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("User Shop Delete SuccessFUlly !!!");

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
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select shop.*, user.Name as CreatedPerson, users.Name as UpdatedPerson from shop left join user on user.ID = shop.CreatedBy left join user as users on users.ID = shop.UpdatedBy where shop.Status = 1 and shop.CompanyID = '${CompanyID}' and shop.Name like '%${Body.searchQuery}%' OR shop.Status = 1 and shop.CompanyID = '${CompanyID}' and shop.MobileNo1 like '%${Body.searchQuery}%' OR shop.Status = 1 and shop.CompanyID = '${CompanyID}' and shop.AreaName like '%${Body.searchQuery}%' `

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
    }

}