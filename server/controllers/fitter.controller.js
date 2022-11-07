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
            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })   
            } 
            if (!Body.MobileNo1 || Body.MobileNo1 === "" || Body.MobileNo1 === undefined || Body.MobileNo1 === null) {
                return res.send({ message: "Invalid Query Data" })
            } 

            doesExist = await connection.query(`select * from fitter where Status = 1 and MobileNo1 = '${Body.MobileNo1}' and CompanyID = ${CompanyID}`)

            if (doesExist.length) {
               return res.send({message : `fitter already exist from this number ${Body.MobileNo1}`}) 
            }

            const saveData = await connection.query(`insert into fitter (CompanyID, ShopID, Name,  MobileNo1,  MobileNo2,  PhoneNo,  Email,  Address,  Website,  PhotoURL,  CINNO, GSTNo,  Fax, ContactPerson, Remark,  DOB,  Anniversary, Status, CreatedBy , CreatedOn ) values ('${CompanyID}', '${Body.ShopID}', '${Body.Name}',  '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}','${Body.Email}', '${Body.Address}', '${Body.Website}','${Body.PhotoURL}','${Body.CINNo}','${Body.GSTNo}','${Body.Fax}','${Body.ContactPerson}','${Body.Remark}','${Body.DOB}', '${Body.Anniversary}', 1 , '${LoggedOnUser.ID}', now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data =  saveData.insertId;
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

            const doesExistFitter = await connection.query(`select * from fitter where MobileNo1 = '${Body.MobileNo1}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistFitter.length) return res.send({ message: `Fitter Already exist from this MobileNo1 ${Body.MobileNo1}` })

            const saveData = await connection.query(`update fitter set Name = '${Body.Name}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', GSTNo='${Body.GSTNo}', Email='${Body.Email}', Website='${Body.Website}', CINNo='${Body.CINNo}', Fax='${Body.Fax}', PhotoURL='${Body.PhotoURL}', ContactPerson='${Body.ContactPerson}', Remark='${Body.Remark}', DOB='${Body.DOB}', Anniversary='${Body.Anniversary}',Status=1,UpdatedBy=${LoggedOnUser},UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log(connected("Data Updated SuccessFUlly !!!"));

            response.message = "data update sucessfully"
            response.data = []
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

            let qry = `select fitter.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from fitter left join user as users1 on users1.ID = fitter.CreatedBy left join user as users on users.ID = fitter.UpdatedBy where fitter.Status = 1 and fitter.CompanyID = '${CompanyID}'  order by fitter.ID desc`
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

            const doesExist = await connection.query(`select * from fitter where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "fitter doesnot exist from this id " })
            }


            const deleteFitter = await connection.query(`update fitter set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Fitter Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
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
            

            let data = await connection.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID}`);
            response.message = "data fetch sucessfully"
            response.data = data
            connection.release()
            res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    getFitterById: async (req, res, next) => {
        try {
            const response = { data: null, RateCard: [], AssignedShop: [], success: true, message: "" }
            const connection = await getConnection.connection();
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const fitter = await connection.query(`select * from fitter where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)
            
            response.message = "data fetch sucessfully"
            response.data = fitter
            response.RateCard = await connection.query(`select * from fitterratecard where  Status = 1 and FitterID = ${Body.ID} and CompanyID = ${CompanyID} `)
            response.AssignedShop = await connection.query(`SELECT fitterassignedshop.*,  shop.Name AS ShopName, shop.AreaName AS AreaName  FROM fitterassignedshop  LEFT JOIN shop ON shop.ID = fitterassignedshop.ShopID WHERE fitterassignedshop.Status = 1 AND fitterassignedshop.FitterID = ${Body.ID} `)
           
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    saveRateCard: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.LensType) return res.send({ message: "Invalid Query Data" })
           
            doesExist = await connection.query(`select * from fitterratecard where Status = 1 and LensType='${Body.LensType}' and ID = ${Body.ID}`);

            if (doesExist.length) {
               return res.send({message: `User have already LensType in this shop`});
            }

            const saveData = await connection.query(`insert into fitterratecard (CompanyID, FitterID,  LensType,  Rate,  Status,  CreatedBy, CreatedOn ) values (${CompanyID}, ${Body.FitterID}, '${Body.LensType}', ${Body.Rate},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;
            connection.release()
            return res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    deleteRateCard: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from fitterratecard where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "fitter doesnot exist from this id " })
            }


            const deleteFitter = await connection.query(`update fitterratecard set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Fitter Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from fitterratecard where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    saveFitterAssignedShop: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.FitterID) return res.send({ message: "Invalid Query Data" })
            doesExist = await connection.query(`select * from fitterassignedshop where Status = 1 and FitterID=${Body.FitterID} and ShopID=${Body.ShopID}`);

            if (doesExist.length) {
               return res.send({message: `User have already FitterAssignedShop in this shop`});
            }

            const saveData = await connection.query(`insert into fitterassignedshop (CompanyID,ShopID, FitterID, Status,  CreatedBy, CreatedOn ) values (${CompanyID}, ${Body.ShopID}, ${Body.FitterID},1,${LoggedOnUser}, now())`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;
            connection.release()
            return res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },

    deleteFitterAssignedShop: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from fitterassignedshop where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "fitter doesnot exist from this id " })
            }


            const deleteFitter = await connection.query(`update fitterassignedshop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("FitterAssignedShop Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            response.data = await connection.query(`select * from fitterassignedshop where Status = 1 and CompanyID = ${CompanyID} order by ID desc`)
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

}
