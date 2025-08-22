const createError = require('http-errors')
const { Idd, generateVisitNo, shopID, getCustomerRewardBalance } = require('../helpers/helper_function')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
let ejs = require("ejs");
let path = require("path");
let pdf = require("html-pdf");
var TinyURL = require('tinyurl');
const clientConfig = require("../helpers/constants");
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
var moment = require("moment");
function rearrangeString(str) {
    // Split the input string into an array of words
    let words = str.split(' ');

    // Reverse the order of the words
    let reversedWords = words.reverse();

    // Join the words back into a single string
    return reversedWords.join(' ');
}
module.exports = {
    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", CustomerID: null, spectacle_rx: [], contact_lens_rx: [], other_rx: [] }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { Title, Name, Sno, MobileNo1, MobileNo2, PhoneNo, Address, GSTNo, Email, PhotoURL, DOB, RefferedByDoc, Age, Anniversary, ReferenceType, Gender, Other, Remarks, VisitDate, spectacle_rx, contact_lens_rx, other_rx, tablename } = req.body

            if (Name.trim() == "" || Name === undefined) {
                return res.send({ message: "Invalid Name" })
            }
            if (tablename === undefined || tablename.trim() === "") {
                return res.send({ message: "Invalid tablename, kindly send tablename spectacle_rx , contact_lens_rx or other_rx" })
            }

            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)


            if (fetchCompanySetting[0].CustomerShopWise === 'true' && (shopid === "0" || shopid === 0)) {
                return res.send({ message: "Invalid shop id, please select shop" });
            }



            const Id = await Idd(req);

            const [customer] = await connection.query(`insert into customer(ShopID,Idd,Title,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,RefferedByDoc,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Status,CreatedBy,CreatedOn,VisitDate) values(${shopid},'${Id}','${Title}', '${Name}','${Sno}',${CompanyID},'${MobileNo1}','${MobileNo2}','${PhoneNo}','${Address}','${GSTNo}','${Email}','${PhotoURL}','${DOB}','${RefferedByDoc}','${Age}','${Anniversary}','${ReferenceType}','${Gender}','${Other}','${Remarks}',1,'${LoggedOnUser}',now(),'${VisitDate}')`);

            console.log(connected("Customer Added SuccessFUlly !!!"));


            if (tablename === 'spectacle_rx') {
                //  spectacle_rx object data

                const spectacle = spectacle_rx;
                const vDate = spectacle.VisitDate ? new Date(spectacle.VisitDate) : new Date()
                const specDatum = {
                    ID: null,
                    VisitNo: 1,
                    CustomerID: customer.insertId,
                    REDPSPH: spectacle.REDPSPH ? spectacle.REDPSPH : '',
                    REDPCYL: spectacle.REDPCYL ? spectacle.REDPCYL : '',
                    REDPAxis: spectacle.REDPAxis ? spectacle.REDPAxis : '',
                    REDPVA: spectacle.REDPVA ? spectacle.REDPVA : '',
                    LEDPSPH: spectacle.LEDPSPH ? spectacle.LEDPSPH : '',
                    LEDPCYL: spectacle.LEDPCYL ? spectacle.LEDPCYL : '',
                    LEDPAxis: spectacle.LEDPAxis ? spectacle.LEDPAxis : '',
                    LEDPVA: spectacle.LEDPVA ? spectacle.LEDPVA : '',
                    RENPSPH: spectacle.RENPSPH ? spectacle.RENPSPH : '',
                    RENPCYL: spectacle.RENPCYL ? spectacle.RENPCYL : '',
                    RENPAxis: spectacle.RENPAxis ? spectacle.RENPAxis : '',
                    RENPVA: spectacle.RENPVA ? spectacle.RENPVA : '',
                    LENPSPH: spectacle.LENPSPH ? spectacle.LENPSPH : '',
                    LENPCYL: spectacle.LENPCYL ? spectacle.LENPCYL : '',
                    LENPAxis: spectacle.LENPAxis ? spectacle.LENPAxis : '',
                    LENPVA: spectacle.LENPVA ? spectacle.LENPVA : '',
                    REPD: spectacle.REPD ? spectacle.REPD : '',
                    LEPD: spectacle.LEPD ? spectacle.LEPD : '',
                    R_Addition: spectacle.R_Addition ? spectacle.R_Addition : '',
                    L_Addition: spectacle.L_Addition ? spectacle.L_Addition : '',
                    R_Prism: spectacle.R_Prism ? spectacle.R_Prism : '',
                    L_Prism: spectacle.L_Prism ? spectacle.L_Prism : '',
                    Lens: spectacle.Lens ? spectacle.Lens : '',
                    Shade: spectacle.Shade ? spectacle.Shade : '',
                    Frame: spectacle.Frame ? spectacle.Frame : '',
                    VertexDistance: spectacle.VertexDistance ? spectacle.VertexDistance : '',
                    RefractiveIndex: spectacle.RefractiveIndex ? spectacle.RefractiveIndex : '',
                    FittingHeight: spectacle.FittingHeight ? spectacle.FittingHeight : '',
                    ConstantUse: spectacle.ConstantUse ? spectacle.ConstantUse : 0,
                    NearWork: spectacle.NearWork ? spectacle.NearWork : 0,
                    DistanceWork: spectacle.DistanceWork ? spectacle.DistanceWork : 0,
                    UploadBy: spectacle.UploadBy ? spectacle.UploadBy : '',
                    PhotoURL: spectacle.PhotoURL ? spectacle.PhotoURL : '',
                    FileURL: spectacle.FileURL ? spectacle.FileURL : '',
                    Family: spectacle.Family ? spectacle.Family : '',
                    RefferedByDoc: spectacle.RefferedByDoc ? spectacle.RefferedByDoc : '',
                    Reminder: spectacle.Reminder ? spectacle.Reminder : '',
                    ExpiryDate: spectacle.ExpiryDate ? spectacle.ExpiryDate : '',
                    VisitDate: moment(vDate).format("YYYY-MM-DD")
                }


                const [saveSpec] = await connection.query(`insert into spectacle_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_Prism,L_Prism,Lens,Shade,Frame,VertexDistance,RefractiveIndex,FittingHeight,ConstantUse,NearWork,DistanceWork,UploadBy,PhotoURL,FileURL,Family,RefferedByDoc,Reminder,ExpiryDate,Status,CreatedBy,CreatedOn, VisitDate) values(${specDatum.VisitNo}, ${CompanyID}, ${specDatum.CustomerID},'${specDatum.REDPSPH}','${specDatum.REDPCYL}','${specDatum.REDPAxis}','${specDatum.REDPVA}','${specDatum.LEDPSPH}','${specDatum.LEDPCYL}','${specDatum.LEDPAxis}','${specDatum.LEDPVA}','${specDatum.RENPSPH}','${specDatum.RENPCYL}','${specDatum.RENPAxis}','${specDatum.RENPVA}','${specDatum.LENPSPH}','${specDatum.LENPCYL}','${specDatum.LENPAxis}','${specDatum.LENPVA}','${specDatum.REPD}','${specDatum.LEPD}','${specDatum.R_Addition}','${specDatum.L_Addition}','${specDatum.R_Prism}','${specDatum.L_Prism}','${specDatum.Lens}','${specDatum.Shade}','${specDatum.Frame}','${specDatum.VertexDistance}','${specDatum.RefractiveIndex}','${specDatum.FittingHeight}',${specDatum.ConstantUse},${specDatum.NearWork},${specDatum.DistanceWork},'${specDatum.UploadBy}','${specDatum.PhotoURL}','${specDatum.FileURL}','${specDatum.Family}','${specDatum.RefferedByDoc}','${specDatum.Reminder}','${specDatum.ExpiryDate}',1,${LoggedOnUser},now(), '${specDatum.VisitDate}')`)

                console.log(connected("Customer Spec Added SuccessFUlly !!!"));

                // const [spectacle_rx2] = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${customer.insertId} and Status = 1 order by ID desc`)
                response.spectacle_rx = spectacle_rx

            } else if (tablename === 'contact_lens_rx') {
                // contact_lens_rx object data

                const contact = contact_lens_rx
                const vDate = contact.VisitDate ? new Date(contact.VisitDate) : new Date()
                const contactDatum = {
                    ID: null,
                    VisitNo: 1,
                    CustomerID: customer.insertId,
                    REDPSPH: contact.REDPSPH ? contact.REDPSPH : '',
                    REDPCYL: contact.REDPCYL ? contact.REDPCYL : '',
                    REDPAxis: contact.REDPAxis ? contact.REDPAxis : '',
                    REDPVA: contact.REDPVA ? contact.REDPVA : '',
                    LEDPSPH: contact.LEDPSPH ? contact.LEDPSPH : '',
                    LEDPCYL: contact.LEDPCYL ? contact.LEDPCYL : '',
                    LEDPAxis: contact.LEDPAxis ? contact.LEDPAxis : '',
                    LEDPVA: contact.LEDPVA ? contact.LEDPVA : '',
                    RENPSPH: contact.RENPSPH ? contact.RENPSPH : '',
                    RENPCYL: contact.RENPCYL ? contact.RENPCYL : '',
                    RENPAxis: contact.RENPAxis ? contact.RENPAxis : '',
                    RENPVA: contact.RENPVA ? contact.RENPVA : '',
                    LENPSPH: contact.LENPSPH ? contact.LENPSPH : '',
                    LENPCYL: contact.LENPCYL ? contact.LENPCYL : '',
                    LENPAxis: contact.LENPAxis ? contact.LENPAxis : '',
                    LENPVA: contact.LENPVA ? contact.LENPVA : '',
                    REPD: contact.REPD ? contact.REPD : '',
                    LEPD: contact.LEPD ? contact.LEPD : '',
                    R_Addition: contact.R_Addition ? contact.R_Addition : '',
                    L_Addition: contact.L_Addition ? contact.L_Addition : '',
                    R_KR: contact.R_KR ? contact.R_KR : '',
                    L_KR: contact.L_KR ? contact.L_KR : '',
                    R_HVID: contact.R_HVID ? contact.R_HVID : '',
                    L_HVID: contact.L_HVID ? contact.L_HVID : '',
                    R_CS: contact.R_CS ? contact.R_CS : '',
                    L_CS: contact.L_CS ? contact.L_CS : '',
                    R_BC: contact.R_BC ? contact.R_BC : '',
                    L_BC: contact.L_BC ? contact.L_BC : '',
                    R_Diameter: contact.R_Diameter ? contact.R_Diameter : '',
                    L_Diameter: contact.L_Diameter ? contact.L_Diameter : '',
                    BR: contact.BR ? contact.BR : '',
                    Material: contact.Material ? contact.Material : '',
                    Modality: contact.Modality ? contact.Modality : '',
                    Other: contact.Other ? contact.Other : '',
                    ConstantUse: contact.ConstantUse ? contact.ConstantUse : 0,
                    NearWork: contact.NearWork ? contact.NearWork : 0,
                    DistanceWork: contact.DistanceWork ? contact.DistanceWork : 0,
                    Multifocal: contact.Multifocal ? contact.Multifocal : 0,
                    PhotoURL: contact.PhotoURL ? contact.PhotoURL : '',
                    FileURL: contact.FileURL ? contact.FileURL : '',
                    Family: contact.Family ? contact.Family : '',
                    RefferedByDoc: contact.RefferedByDoc ? contact.RefferedByDoc : '',
                    VisitDate: moment(vDate).format("YYYY-MM-DD")
                }

                const [saveContact] = await connection.query(`insert into contact_lens_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_KR,L_KR,R_HVID,L_HVID,R_CS,L_CS,R_BC,L_BC,R_Diameter,L_Diameter,BR,Material,Modality,Other,ConstantUse,NearWork,DistanceWork,Multifocal,PhotoURL,FileURL,Family,RefferedByDoc,Status,CreatedBy,CreatedOn, VisitDate) values (${contactDatum.VisitNo}, ${CompanyID}, ${contactDatum.CustomerID},'${contactDatum.REDPSPH}','${contactDatum.REDPCYL}','${contactDatum.REDPAxis}','${contactDatum.REDPVA}','${contactDatum.LEDPSPH}','${contactDatum.LEDPCYL}','${contactDatum.LEDPAxis}','${contactDatum.LEDPVA}','${contactDatum.RENPSPH}','${contactDatum.RENPCYL}','${contactDatum.RENPAxis}','${contactDatum.RENPVA}','${contactDatum.LENPSPH}','${contactDatum.LENPCYL}','${contactDatum.LENPAxis}','${contactDatum.LENPVA}','${contactDatum.REPD}','${contactDatum.LEPD}','${contactDatum.R_Addition}','${contactDatum.L_Addition}','${contactDatum.R_KR}','${contactDatum.L_KR}','${contactDatum.R_HVID}','${contactDatum.L_HVID}','${contactDatum.R_CS}','${contactDatum.L_CS}','${contactDatum.R_BC}','${contactDatum.L_BC}','${contactDatum.R_Diameter}','${contactDatum.L_Diameter}','${contactDatum.BR}','${contactDatum.Material}','${contactDatum.Modality}','${contactDatum.Other}',${contactDatum.ConstantUse},${contactDatum.NearWork},${contactDatum.DistanceWork},${contactDatum.Multifocal},'${contactDatum.PhotoURL}','${contactDatum.FileURL}','${contactDatum.Family}','${contactDatum.RefferedByDoc}',1,${LoggedOnUser},now(),'${contactDatum.VisitDate}')`)

                console.log(connected("Customer Contact Added SuccessFUlly !!!"));

                // const [spectacle_rx2] = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${customer.insertId} and Status = 1 order by ID desc`);
                response.contact_lens_rx = contact_lens_rx

            } else if (tablename === 'other_rx') {

                // other_rx other_rx object

                const other = other_rx
                const vDate = other.VisitDate ? new Date(other.VisitDate) : new Date()
                const otherDatum = {
                    ID: null,
                    VisitNo: 1,
                    CustomerID: customer.insertId,
                    BP: other.BP ? other.BP : '',
                    Sugar: other.Sugar ? other.Sugar : '',
                    IOL_Power: other.IOL_Power ? other.IOL_Power : '',
                    Operation: other.Operation ? other.Operation : '',
                    R_VN: other.R_VN ? other.R_VN : '',
                    L_VN: other.L_VN ? other.L_VN : '',
                    R_TN: other.R_TN ? other.R_TN : '',
                    L_TN: other.L_TN ? other.L_TN : '',
                    R_KR: other.R_KR ? other.R_KR : '',
                    L_KR: other.L_KR ? other.L_KR : '',
                    Treatment: other.Treatment ? other.Treatment : '',
                    Diagnosis: other.Diagnosis ? other.Diagnosis : '',
                    Family: other.Family ? other.Family : '',
                    RefferedByDoc: other.RefferedByDoc ? other.RefferedByDoc : '',
                    FileURL: other.FileURL ? other.FileURL : '',
                    VisitDate: moment(vDate).format("YYYY-MM-DD")
                }

                const [saveOther] = await connection.query(`insert into other_rx(CustomerID,CompanyID,VisitNo,BP,Sugar,IOL_Power,Operation,R_VN,L_VN,R_TN,L_TN,R_KR,L_KR,Treatment,Diagnosis,Family,RefferedByDoc,FileURL,Status,CreatedBy,CreatedOn, VisitDate) values (${otherDatum.CustomerID},${CompanyID},${otherDatum.VisitNo},'${otherDatum.BP}','${otherDatum.Sugar}','${otherDatum.IOL_Power}','${otherDatum.Operation}','${otherDatum.R_VN}','${otherDatum.L_VN}','${otherDatum.R_TN}','${otherDatum.L_TN}','${otherDatum.R_KR}','${otherDatum.L_KR}','${otherDatum.Treatment}','${otherDatum.Diagnosis}','${otherDatum.Family}','${otherDatum.RefferedByDoc}','${otherDatum.FileURL}',1,${LoggedOnUser}, now(), '${otherDatum.VisitDate}')`)

                console.log(connected("Customer Other Added SuccessFUlly !!!"));

                // const [other_rx2] = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${customer.insertId} and Status = 1 order by ID desc`)
                response.other_rx = other_rx

            }

            response.CustomerID = customer.insertId,
                response.message = "data save sucessfully",
                [data] = await connection.query(`select customer.*, shop.Name as ShopName, shop.AreaName as AreaName from customer left join shop on shop.ID = customer.ShopID where customer.CompanyID = ${CompanyID} and customer.ID = ${customer.insertId}`)
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
    list: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)

            if (fetchCompanySetting[0].CustomerShopWise === 'true') {
                shop = ` and customer.ShopID = ${shopid}`
            }

            let qry = `select customer.*, 0 as rewardBalance, users1.Name as CreatedPerson, users.Name as UpdatedPerson, shop.Name as ShopName, shop.AreaName as AreaName from customer left join user as users1 on users1.ID = customer.CreatedBy left join user as users on users.ID = customer.UpdatedBy left join shop on shop.ID = customer.ShopID where customer.Status = 1 and customer.CompanyID = ${CompanyID} ${shop}  order by customer.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [data] = await connection.query(finalQuery);
            let [count] = await connection.query(qry);

            for (let item of data) {
                item.rewardBalance = await getCustomerRewardBalance(item.ID, item.CompanyID);
            }

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

            const [doesExist] = await connection.query(`select ID from customer where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "customer doesnot exist from this id " })
            }

            const [doesExistBill] = await connection.query(`select ID from billmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${Body.ID}`)

            if (doesExistBill.length) {
                return res.send({ message: `You can't delete customer. Please delete the bill first` })
            }


            const [deleteCustomer] = await connection.query(`update customer set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Customer Delete SuccessFUlly !!!");

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

            const [doesExist] = await connection.query(`select ID from customer where Status = 0 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "customer doesnot exist from this id " })
            }


            const [restoreCustomer] = await connection.query(`update customer set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Customer Restore SuccessFUlly !!!");

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

    searchByFeild: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].CustomerShopWise === 'true') {
                shop = ` and customer.ShopID = ${shopid}`
            }


            let qry = `select customer.*, 0 as rewardBalance, users1.Name as CreatedPerson, users.Name as UpdatedPerson, shop.Name as ShopName, shop.AreaName as AreaName from customer left join user as users1 on users1.ID = customer.CreatedBy left join user as users on users.ID = customer.UpdatedBy left join shop on shop.ID = customer.ShopID where customer.Status = 1 ${shop} and customer.CompanyID = ${CompanyID} and customer.Name like '%${Body.searchQuery}%' OR customer.Status = 1 and customer.CompanyID = ${CompanyID} and customer.MobileNo1 like '%${Body.searchQuery}%' OR customer.Status = 1 ${shop} and customer.CompanyID = ${CompanyID} and customer.MobileNo2 like '%${Body.searchQuery}%' OR customer.Status = 1 ${shop} and customer.CompanyID = ${CompanyID} and shop.Name like '%${Body.searchQuery}%'`

            let [data] = await connection.query(qry);

            for (let item of data) {
                item.rewardBalance = await getCustomerRewardBalance(item.ID, item.CompanyID);
            }

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

    searchByCustomerID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].CustomerShopWise === 'true') {
                shop = ` and customer.ShopID = ${shopid}`
            }


            let qry = `select customer.*, 0 as rewardBalance, users1.Name as CreatedPerson, users.Name as UpdatedPerson, shop.Name as ShopName, shop.AreaName as AreaName from customer left join user as users1 on users1.ID = customer.CreatedBy left join user as users on users.ID = customer.UpdatedBy left join shop on shop.ID = customer.ShopID where customer.Status = 1 ${shop} and customer.CompanyID = ${CompanyID} and customer.Idd like '%${Body.searchQuery}%' `

            let [data] = await connection.query(qry);

            for (let item of data) {
                item.rewardBalance = await getCustomerRewardBalance(item.ID, item.CompanyID);
            }

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

    getCustomerById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", spectacle_rx: [], contact_lens_rx: [], other_rx: [], rewardBalance: 0 }
            const { CustomerID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!CustomerID) return res.send({ message: "Invalid Query Data" })

            const [doesExist] = await connection.query(`select * from customer where Status = 1 and CompanyID = ${CompanyID} and ID = ${CustomerID}`)

            if (!doesExist.length) {
                return res.send({ message: "customer doesnot exist from this id " })
            }

            response.data = doesExist || [];
            const [spectacle_rx] = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`) || [];

            const [contact_lens_rx] = await connection.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`) || [];
            response.contact_lens_rx = contact_lens_rx

            const [other_rx] = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`) || [];
            response.other_rx = other_rx
            response.spectacle_rx = spectacle_rx
            response.rewardBalance = await getCustomerRewardBalance(CustomerID, CompanyID)
            response.message = 'data fetch successfully'
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
    deleteSpec: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, tablename, CustomerID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!ID) return res.send({ message: "Invalid Query Data" })
            if (!CustomerID) return res.send({ message: "Invalid Query Data" })
            if (tablename === undefined || tablename.trim() === "") {
                return res.send({ message: "Invalid tablename, kindly send tablename spectacle_rx , contact_lens_rx or other_rx" })
            }

            if (tablename === 'spectacle_rx') {
                const [deletespectacle_rx] = await connection.query(`update spectacle_rx set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${ID} and CompanyID = ${CompanyID}`)
                response.spectacle_rx = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`);

            } else if (tablename === 'contact_lens_rx') {
                const [deletecontact_lens_rx] = await connection.query(`update contact_lens_rx set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${ID} and CompanyID = ${CompanyID}`)
                response.contact_lens_rx = await connection.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`);
            } else if (tablename === 'other_rx') {
                const [deleteother_rx] = await connection.query(`update other_rx set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${ID} and CompanyID = ${CompanyID}`)
                response.other_rx = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`);
            }

            response.message = 'data delete successfully'
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
            const response = { data: null, success: true, message: "", CustomerID: null, spectacle_rx: [], contact_lens_rx: [], other_rx: [] }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { ID, Title, Name, Sno, MobileNo1, MobileNo2, PhoneNo, Address, GSTNo, Email, PhotoURL, DOB, RefferedByDoc, Age, Anniversary, ReferenceType, Gender, Other, Remarks, VisitDate, spectacle_rx, contact_lens_rx, other_rx, tablename } = req.body

            if (Name.trim() === "" || Name === undefined) {
                return res.send({ message: "Invalid Name" })
            }
            if (tablename.trim() === "" || tablename === undefined) {
                return res.send({ message: "Invalid tablename, kindly send tablename spectacle_rx , contact_lens_rx or other_rx" })
            }

            if (!ID) return res.send({ message: "Invalid Query Data" })

            if (tablename === 'spectacle_rx' || tablename === 'contact_lens_rx' || tablename === 'other_rx') {
                if (spectacle_rx?.ID === undefined && contact_lens_rx?.ID === undefined && other_rx?.ID === undefined) {
                    return res.send({ message: "Invalid Query Data" })
                }
            }
            // if (tablename === 'contact_lens_rx') {
            //     if (contact_lens_rx.ID === undefined) {
            //         return res.send({ message: "Invalid Query Data" })
            //     }
            // }
            // if (tablename === 'other_rx') {
            //     if (other_rx.ID === undefined) {
            //         return res.send({ message: "Invalid Query Data" })
            //     }
            // }

            const [update] = await connection.query(`update customer set Name='${Name}', Title='${Title}', Sno='${Sno}', MobileNo1='${MobileNo1}', MobileNo2='${MobileNo2}', PhoneNo='${PhoneNo}', Address='${Address}', GSTNo='${GSTNo}', Email='${Email}', PhotoURL='${PhotoURL}', DOB='${DOB}', RefferedByDoc='${RefferedByDoc}', Age='${Age}', Anniversary='${Anniversary}', ReferenceType='${ReferenceType}', Gender='${Gender}', Other='${Other}', Remarks='${Remarks}', VisitDate='${VisitDate}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and ID = ${ID}`)

            console.log(connected("Customer Updated SuccessFUlly !!!"));


            if (tablename === 'spectacle_rx') {
                const spectacle = spectacle_rx;
                const vDate = spectacle.VisitDate ? new Date(spectacle.VisitDate) : new Date()
                console.log(vDate);
                const specDatum = {
                    ID: null,
                    VisitNo: await generateVisitNo(CompanyID, ID, tablename),
                    CustomerID: ID,
                    REDPSPH: spectacle.REDPSPH ? spectacle.REDPSPH : '',
                    REDPCYL: spectacle.REDPCYL ? spectacle.REDPCYL : '',
                    REDPAxis: spectacle.REDPAxis ? spectacle.REDPAxis : '',
                    REDPVA: spectacle.REDPVA ? spectacle.REDPVA : '',
                    LEDPSPH: spectacle.LEDPSPH ? spectacle.LEDPSPH : '',
                    LEDPCYL: spectacle.LEDPCYL ? spectacle.LEDPCYL : '',
                    LEDPAxis: spectacle.LEDPAxis ? spectacle.LEDPAxis : '',
                    LEDPVA: spectacle.LEDPVA ? spectacle.LEDPVA : '',
                    RENPSPH: spectacle.RENPSPH ? spectacle.RENPSPH : '',
                    RENPCYL: spectacle.RENPCYL ? spectacle.RENPCYL : '',
                    RENPAxis: spectacle.RENPAxis ? spectacle.RENPAxis : '',
                    RENPVA: spectacle.RENPVA ? spectacle.RENPVA : '',
                    LENPSPH: spectacle.LENPSPH ? spectacle.LENPSPH : '',
                    LENPCYL: spectacle.LENPCYL ? spectacle.LENPCYL : '',
                    LENPAxis: spectacle.LENPAxis ? spectacle.LENPAxis : '',
                    LENPVA: spectacle.LENPVA ? spectacle.LENPVA : '',
                    REPD: spectacle.REPD ? spectacle.REPD : '',
                    LEPD: spectacle.LEPD ? spectacle.LEPD : '',
                    R_Addition: spectacle.R_Addition ? spectacle.R_Addition : '',
                    L_Addition: spectacle.L_Addition ? spectacle.L_Addition : '',
                    R_Prism: spectacle.R_Prism ? spectacle.R_Prism : '',
                    L_Prism: spectacle.L_Prism ? spectacle.L_Prism : '',
                    Lens: spectacle.Lens ? spectacle.Lens : '',
                    Shade: spectacle.Shade ? spectacle.Shade : '',
                    Frame: spectacle.Frame ? spectacle.Frame : '',
                    VertexDistance: spectacle.VertexDistance ? spectacle.VertexDistance : '',
                    RefractiveIndex: spectacle.RefractiveIndex ? spectacle.RefractiveIndex : '',
                    FittingHeight: spectacle.FittingHeight ? spectacle.FittingHeight : '',
                    ConstantUse: spectacle.ConstantUse ? spectacle.ConstantUse : 0,
                    NearWork: spectacle.NearWork ? spectacle.NearWork : 0,
                    DistanceWork: spectacle.DistanceWork ? spectacle.DistanceWork : 0,
                    UploadBy: spectacle.UploadBy ? spectacle.UploadBy : '',
                    PhotoURL: spectacle.PhotoURL ? spectacle.PhotoURL : '',
                    FileURL: spectacle.FileURL ? spectacle.FileURL : '',
                    Family: spectacle.Family ? spectacle.Family : '',
                    RefferedByDoc: spectacle.RefferedByDoc ? spectacle.RefferedByDoc : '',
                    Reminder: spectacle.Reminder ? spectacle.Reminder : '',
                    ExpiryDate: spectacle.ExpiryDate ? spectacle.ExpiryDate : '',
                    VisitDate: moment(vDate).format("YYYY-MM-DD")
                }
                if (spectacle_rx.ID === null || spectacle_rx.ID === 'null' || spectacle_rx.ID.toString().trim() === '') {
                    const [saveSpec] = await connection.query(`insert into spectacle_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_Prism,L_Prism,Lens,Shade,Frame,VertexDistance,RefractiveIndex,FittingHeight,ConstantUse,NearWork,DistanceWork,UploadBy,PhotoURL,FileURL,Family,RefferedByDoc,Reminder,ExpiryDate,Status,CreatedBy,CreatedOn, VisitDate) values(${specDatum.VisitNo}, ${CompanyID}, ${specDatum.CustomerID},'${specDatum.REDPSPH}','${specDatum.REDPCYL}','${specDatum.REDPAxis}','${specDatum.REDPVA}','${specDatum.LEDPSPH}','${specDatum.LEDPCYL}','${specDatum.LEDPAxis}','${specDatum.LEDPVA}','${specDatum.RENPSPH}','${specDatum.RENPCYL}','${specDatum.RENPAxis}','${specDatum.RENPVA}','${specDatum.LENPSPH}','${specDatum.LENPCYL}','${specDatum.LENPAxis}','${specDatum.LENPVA}','${specDatum.REPD}','${specDatum.LEPD}','${specDatum.R_Addition}','${specDatum.L_Addition}','${specDatum.R_Prism}','${specDatum.L_Prism}','${specDatum.Lens}','${specDatum.Shade}','${specDatum.Frame}','${specDatum.VertexDistance}','${specDatum.RefractiveIndex}','${specDatum.FittingHeight}',${specDatum.ConstantUse},${specDatum.NearWork},${specDatum.DistanceWork},'${specDatum.UploadBy}','${specDatum.PhotoURL}','${specDatum.FileURL}','${specDatum.Family}','${specDatum.RefferedByDoc}','${specDatum.Reminder}','${specDatum.ExpiryDate}',1,${LoggedOnUser},now(), '${specDatum.VisitDate}')`)

                    console.log(connected("Customer Spec Added SuccessFUlly !!!"));
                } else if (spectacle_rx.ID !== null || spectacle_rx.ID !== 'null' || spectacle_rx.ID !== undefined) {
                    // update
                    const [updateSpec] = await connection.query(`update spectacle_rx set REDPSPH = '${specDatum.REDPSPH}', REDPCYL = '${specDatum.REDPCYL}', REDPAxis = '${specDatum.REDPAxis}', REDPVA = '${specDatum.REDPVA}', LEDPSPH = '${specDatum.LEDPSPH}', LEDPCYL = '${specDatum.LEDPCYL}', LEDPAxis = '${specDatum.LEDPAxis}', LEDPVA = '${specDatum.LEDPVA}',  RENPSPH = '${specDatum.RENPSPH}', RENPCYL = '${specDatum.RENPCYL}',  RENPAxis = '${specDatum.RENPAxis}', RENPVA = '${specDatum.RENPVA}', LENPSPH = '${specDatum.LENPSPH}', LENPCYL = '${specDatum.LENPCYL}', LENPAxis = '${specDatum.LENPAxis}', LENPVA = '${specDatum.LENPVA}', REPD = '${specDatum.REPD}', LEPD = '${specDatum.LEPD}', R_Addition = '${specDatum.R_Addition}' , L_Addition = '${specDatum.L_Addition}', R_Prism = '${specDatum.R_Prism}', L_Prism = '${specDatum.L_Prism}', Lens = '${specDatum.Lens}', Shade = '${specDatum.Shade}', Frame = '${specDatum.Frame}', VertexDistance = '${specDatum.VertexDistance}', RefractiveIndex = '${specDatum.RefractiveIndex}', FittingHeight = '${specDatum.FittingHeight}', ConstantUse = ${specDatum.ConstantUse}, NearWork = ${specDatum.NearWork}, DistanceWork = ${specDatum.DistanceWork}, UploadBy = '${specDatum.UploadBy}', PhotoURL = '${specDatum.PhotoURL}', FileURL = '${specDatum.FileURL}', Family = '${specDatum.Family}',RefferedByDoc = '${specDatum.RefferedByDoc}',Reminder = '${specDatum.Reminder}',ExpiryDate = '${specDatum.ExpiryDate}', VisitDate = '${specDatum.VisitDate}', UpdatedBy = '${LoggedOnUser}', Updatedon = now()  where CompanyID = ${CompanyID} and CustomerID = ${ID} and ID =${spectacle_rx.ID}`)

                    console.log(connected("Customer Spec Update SuccessFUlly !!!"));
                }

                // const [spectacle_rx2] = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${ID} and Status = 1 order by ID desc`)
                response.spectacle_rx = spectacle_rx

            }

            if (tablename === 'contact_lens_rx') {
                const contact = contact_lens_rx
                const vDate = contact.VisitDate ? new Date(contact.VisitDate) : new Date()
                const contactDatum = {
                    ID: null,
                    VisitNo: await generateVisitNo(CompanyID, ID, tablename),
                    CustomerID: ID,
                    REDPSPH: contact.REDPSPH ? contact.REDPSPH : '',
                    REDPCYL: contact.REDPCYL ? contact.REDPCYL : '',
                    REDPAxis: contact.REDPAxis ? contact.REDPAxis : '',
                    REDPVA: contact.REDPVA ? contact.REDPVA : '',
                    LEDPSPH: contact.LEDPSPH ? contact.LEDPSPH : '',
                    LEDPCYL: contact.LEDPCYL ? contact.LEDPCYL : '',
                    LEDPAxis: contact.LEDPAxis ? contact.LEDPAxis : '',
                    LEDPVA: contact.LEDPVA ? contact.LEDPVA : '',
                    RENPSPH: contact.RENPSPH ? contact.RENPSPH : '',
                    RENPCYL: contact.RENPCYL ? contact.RENPCYL : '',
                    RENPAxis: contact.RENPAxis ? contact.RENPAxis : '',
                    RENPVA: contact.RENPVA ? contact.RENPVA : '',
                    LENPSPH: contact.LENPSPH ? contact.LENPSPH : '',
                    LENPCYL: contact.LENPCYL ? contact.LENPCYL : '',
                    LENPAxis: contact.LENPAxis ? contact.LENPAxis : '',
                    LENPVA: contact.LENPVA ? contact.LENPVA : '',
                    REPD: contact.REPD ? contact.REPD : '',
                    LEPD: contact.LEPD ? contact.LEPD : '',
                    R_Addition: contact.R_Addition ? contact.R_Addition : '',
                    L_Addition: contact.L_Addition ? contact.L_Addition : '',
                    R_KR: contact.R_KR ? contact.R_KR : '',
                    L_KR: contact.L_KR ? contact.L_KR : '',
                    R_HVID: contact.R_HVID ? contact.R_HVID : '',
                    L_HVID: contact.L_HVID ? contact.L_HVID : '',
                    R_CS: contact.R_CS ? contact.R_CS : '',
                    L_CS: contact.L_CS ? contact.L_CS : '',
                    R_BC: contact.R_BC ? contact.R_BC : '',
                    L_BC: contact.L_BC ? contact.L_BC : '',
                    R_Diameter: contact.R_Diameter ? contact.R_Diameter : '',
                    L_Diameter: contact.L_Diameter ? contact.L_Diameter : '',
                    BR: contact.BR ? contact.BR : '',
                    Material: contact.Material ? contact.Material : '',
                    Modality: contact.Modality ? contact.Modality : '',
                    Other: contact.Other ? contact.Other : '',
                    ConstantUse: contact.ConstantUse ? contact.ConstantUse : 0,
                    NearWork: contact.NearWork ? contact.NearWork : 0,
                    DistanceWork: contact.DistanceWork ? contact.DistanceWork : 0,
                    Multifocal: contact.Multifocal ? contact.Multifocal : 0,
                    PhotoURL: contact.PhotoURL ? contact.PhotoURL : '',
                    FileURL: contact.FileURL ? contact.FileURL : '',
                    Family: contact.Family ? contact.Family : '',
                    RefferedByDoc: contact.RefferedByDoc ? contact.RefferedByDoc : '',
                    VisitDate: moment(vDate).format("YYYY-MM-DD")
                }
                if (contact_lens_rx.ID === null || contact_lens_rx.ID === 'null' || contact_lens_rx.ID.toString().trim() === '') {


                    const [saveContact] = await connection.query(`insert into contact_lens_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_KR,L_KR,R_HVID,L_HVID,R_CS,L_CS,R_BC,L_BC,R_Diameter,L_Diameter,BR,Material,Modality,Other,ConstantUse,NearWork,DistanceWork,Multifocal,PhotoURL,FileURL,Family,RefferedByDoc,Status,CreatedBy,CreatedOn,VisitDate) values (${contactDatum.VisitNo}, ${CompanyID}, ${contactDatum.CustomerID},'${contactDatum.REDPSPH}','${contactDatum.REDPCYL}','${contactDatum.REDPAxis}','${contactDatum.REDPVA}','${contactDatum.LEDPSPH}','${contactDatum.LEDPCYL}','${contactDatum.LEDPAxis}','${contactDatum.LEDPVA}','${contactDatum.RENPSPH}','${contactDatum.RENPCYL}','${contactDatum.RENPAxis}','${contactDatum.RENPVA}','${contactDatum.LENPSPH}','${contactDatum.LENPCYL}','${contactDatum.LENPAxis}','${contactDatum.LENPVA}','${contactDatum.REPD}','${contactDatum.LEPD}','${contactDatum.R_Addition}','${contactDatum.L_Addition}','${contactDatum.R_KR}','${contactDatum.L_KR}','${contactDatum.R_HVID}','${contactDatum.L_HVID}','${contactDatum.R_CS}','${contactDatum.L_CS}','${contactDatum.R_BC}','${contactDatum.L_BC}','${contactDatum.R_Diameter}','${contactDatum.L_Diameter}','${contactDatum.BR}','${contactDatum.Material}','${contactDatum.Modality}','${contactDatum.Other}',${contactDatum.ConstantUse},${contactDatum.NearWork},${contactDatum.DistanceWork},${contactDatum.Multifocal},'${contactDatum.PhotoURL}','${contactDatum.FileURL}','${contactDatum.Family}','${contactDatum.RefferedByDoc}',1,${LoggedOnUser},now(),'${contactDatum.VisitDate}')`)

                    console.log(connected("Customer Contact Added SuccessFUlly !!!"));


                } else if (contact_lens_rx.ID !== null || contact_lens_rx.ID !== 'null' || contact_lens_rx.ID !== undefined) {
                    // update
                    const [updateSpec] = await connection.query(`update contact_lens_rx set REDPSPH='${contactDatum.REDPSPH}', REDPCYL='${contactDatum.REDPCYL}', REDPAxis='${contactDatum.REDPAxis}', REDPVA='${contactDatum.REDPVA}', LEDPSPH='${contactDatum.LEDPSPH}', LEDPCYL='${contactDatum.LEDPCYL}', LEDPAxis='${contactDatum.LEDPAxis}', LEDPVA='${contactDatum.LEDPVA}', RENPSPH='${contactDatum.RENPSPH}', RENPCYL='${contactDatum.RENPCYL}', RENPAxis='${contactDatum.RENPAxis}', RENPVA='${contactDatum.RENPVA}', LENPSPH='${contactDatum.LENPSPH}', LENPCYL='${contactDatum.LENPCYL}', LENPAxis='${contactDatum.LENPAxis}', LENPVA='${contactDatum.LENPVA}', REPD='${contactDatum.REPD}', LEPD='${contactDatum.LEPD}', R_Addition='${contactDatum.R_Addition}', L_Addition='${contactDatum.L_Addition}', R_KR='${contactDatum.R_KR}', L_KR='${contactDatum.L_KR}', R_HVID='${contactDatum.R_HVID}', L_HVID='${contactDatum.L_HVID}', R_CS='${contactDatum.R_CS}', L_CS='${contactDatum.L_CS}', R_BC='${contactDatum.R_BC}', L_BC='${contactDatum.L_BC}', R_Diameter='${contactDatum.R_Diameter}', L_Diameter='${contactDatum.L_Diameter}', BR='${contactDatum.BR}', Material='${contactDatum.Material}', Modality='${contactDatum.Modality}', Other='${contactDatum.Other}', ConstantUse=${contactDatum.ConstantUse}, NearWork=${contactDatum.NearWork}, DistanceWork=${contactDatum.DistanceWork}, Multifocal=${contactDatum.Multifocal}, PhotoURL='${contactDatum.PhotoURL}', FileURL='${contactDatum.FileURL}', Family='${contactDatum.Family}', RefferedByDoc='${contactDatum.RefferedByDoc}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now(), VisitDate='${contactDatum.VisitDate}' where ID=${contact_lens_rx.ID} and CustomerID = ${ID} and CompanyID = ${CompanyID}`)

                    console.log(connected("Customer Spec Update SuccessFUlly !!!"));

                }

                // const [contact_lens_rx2] = await connection.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${ID} and Status = 1 order by ID desc`);
                response.contact_lens_rx = contact_lens_rx
            }

            if (tablename === 'other_rx') {
                const other = other_rx
                const vDate = other.VisitDate ? new Date(other.VisitDate) : new Date()
                const otherDatum = {
                    ID: null,
                    VisitNo: await generateVisitNo(CompanyID, ID, tablename),
                    CustomerID: ID,
                    BP: other.BP ? other.BP : '',
                    Sugar: other.Sugar ? other.Sugar : '',
                    IOL_Power: other.IOL_Power ? other.IOL_Power : '',
                    Operation: other.Operation ? other.Operation : '',
                    R_VN: other.R_VN ? other.R_VN : '',
                    L_VN: other.L_VN ? other.L_VN : '',
                    R_TN: other.R_TN ? other.R_TN : '',
                    L_TN: other.L_TN ? other.L_TN : '',
                    R_KR: other.R_KR ? other.R_KR : '',
                    L_KR: other.L_KR ? other.L_KR : '',
                    Treatment: other.Treatment ? other.Treatment : '',
                    Diagnosis: other.Diagnosis ? other.Diagnosis : '',
                    Family: other.Family ? other.Family : '',
                    RefferedByDoc: other.RefferedByDoc ? other.RefferedByDoc : '',
                    FileURL: other.FileURL ? other.FileURL : '',
                    VisitDate: moment(vDate).format("YYYY-MM-DD")
                }
                if (other_rx.ID === null || other_rx.ID === 'null' || other_rx.ID.toString().trim() === '') {

                    const [saveOther] = await connection.query(`insert into other_rx(CustomerID,CompanyID,VisitNo,BP,Sugar,IOL_Power,Operation,R_VN,L_VN,R_TN,L_TN,R_KR,L_KR,Treatment,Diagnosis,Family,RefferedByDoc,FileURL,Status,CreatedBy,CreatedOn,VisitDate) values (${otherDatum.CustomerID},${CompanyID},${otherDatum.VisitNo},'${otherDatum.BP}','${otherDatum.Sugar}','${otherDatum.IOL_Power}','${otherDatum.Operation}','${otherDatum.R_VN}','${otherDatum.L_VN}','${otherDatum.R_TN}','${otherDatum.L_TN}','${otherDatum.R_KR}','${otherDatum.L_KR}','${otherDatum.Treatment}','${otherDatum.Diagnosis}','${otherDatum.Family}','${otherDatum.RefferedByDoc}','${otherDatum.FileURL}',1,${LoggedOnUser}, now(),'${otherDatum.VisitDate}')`)

                    console.log(connected("Customer Other Added SuccessFUlly !!!"));


                } else if (other_rx.ID !== null || other_rx.ID !== 'null' || other_rx.ID !== undefined) {
                    //  update
                    const [updateSpec] = await connection.query(`update other_rx set BP='${otherDatum.BP}', Sugar='${otherDatum.Sugar}', IOL_Power='${otherDatum.IOL_Power}', Operation='${otherDatum.Operation}', R_VN='${otherDatum.R_VN}', L_VN='${otherDatum.L_VN}', R_TN='${otherDatum.R_TN}', L_TN='${otherDatum.L_TN}', R_KR='${otherDatum.R_KR}', L_KR='${otherDatum.L_KR}', Treatment='${otherDatum.Treatment}', Diagnosis='${otherDatum.Diagnosis}', Family='${otherDatum.Family}', RefferedByDoc='${otherDatum.RefferedByDoc}', FileURL='${otherDatum.FileURL}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now(), VisitDate='${otherDatum.VisitDate}' where ID=${other_rx.ID} and CustomerID =${ID} and CompanyID=${CompanyID}`)

                    console.log(connected("Customer Spec Update SuccessFUlly !!!"));

                }

                // const [other_rx2] = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${ID} and Status = 1 order by ID desc`)
                response.other_rx = other_rx
            }

            let [data] = await connection.query(`select * from customer where CompanyID = ${CompanyID} and ID = ${ID}`)
            response.CustomerID = ID,
                response.message = "data update sucessfully",
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

    dropdownlist: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].CustomerShopWise === 'true') {
                shop = ` and customer.ShopID = ${shopid}`
            }

            let qry = `select customer.ID as ID, customer.Name as Name, customer.MobileNo1 from customer where customer.Status = 1 and customer.CompanyID = ${CompanyID} ${shop} order by customer.ID desc limit 100`


            let finalQuery = qry;

            let [data] = await connection.query(finalQuery);

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

    customerGSTNumber: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].CustomerShopWise === 'true') {
                shop = ` and customer.ShopID = ${shopid}`
            }

            let qry = `select customer.ID as ID, customer.Name as Name, customer.GSTNo as GSTNumber from customer where customer.Status = 1 and customer.GSTNo != '' and customer.CompanyID = ${CompanyID} ${shop}  order by customer.ID desc`


            let finalQuery = qry;

            let [data] = await connection.query(finalQuery);

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

    getMeasurementByCustomer: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { CustomerID, type } = req.body;

            if (CustomerID === "" || CustomerID === undefined) {
                return res.send({ message: "Invalid CustomerID" })
            }
            if (type === "" || type === undefined) {
                return res.send({ message: "Invalid type" })
            }

            let check = false
            if (type === "Lens") {
                check = true
            } else if (type === "ContactLens") {
                check = true
            }


            if (!check) {
                return res.send({ message: `Invalid type , Accept Only :- Lens ||  ContactLens` })
            }

            let tableName = ''

            if (type === "ContactLens") {
                tableName = 'contact_lens_rx'
            } else {
                tableName = 'spectacle_rx'
            }

            let qry = `select * from ${tableName} where Status = 1 and CustomerID = ${CustomerID} and CompanyID = ${CompanyID} order by ID desc limit 1`

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
    getMeasurementByCustomerForDropDown: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { CustomerID, type } = req.body;

            if (CustomerID === "" || CustomerID === undefined) {
                return res.send({ message: "Invalid CustomerID" })
            }
            if (type === "" || type === undefined) {
                return res.send({ message: "Invalid type" })
            }

            let check = false
            if (type === "Lens") {
                check = true
            } else if (type === "ContactLens") {
                check = true
            }


            if (!check) {
                return res.send({ message: `Invalid type , Accept Only :- Lens ||  ContactLens` })
            }

            let tableName = ''

            if (type === "ContactLens") {
                tableName = 'contact_lens_rx'
            } else {
                tableName = 'spectacle_rx'
            }

            let qry = `select * from ${tableName} where Status = 1 and CustomerID = ${CustomerID} and CompanyID = ${CompanyID} order by ID desc`

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
    customerPowerPDF: async (req, res, next) => {
        let connection;
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const printdata = req.body

            let powerList = []
            console.log(printdata);
            if (printdata.otherSpec === true) {
                powerList = printdata.spectacle
            } if (printdata.otherContant === true) {
                powerList = printdata.contact
            } if (printdata.otherNoPower === true) {
                powerList = []
            }
            printdata.powerList = powerList
            const customer = req.body.customer

            const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
            const [companysetting] = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)
            const [billformate] = await connection.query(`select * from billformate where CompanyID = ${CompanyID}`)

            printdata.billformate = billformate[0]
            printdata.BillHeader = `${Number(printdata.billformate.BillHeader)}`;
            printdata.Color = printdata.billformate.Color;
            printdata.ShopNameBold = `${Number(printdata.billformate.ShopNameBold)}`;
            printdata.HeaderWidth = `${Number(printdata.billformate.HeaderWidth)}px`;
            printdata.HeaderHeight = `${Number(printdata.billformate.HeaderHeight)}px`;
            printdata.HeaderPadding = `${Number(printdata.billformate.HeaderPadding)}px`;
            printdata.HeaderMargin = `${Number(printdata.billformate.HeaderMargin)}px`;
            printdata.ImageWidth = `${Number(printdata.billformate.ImageWidth)}px`;
            printdata.ImageHeight = `${Number(printdata.billformate.ImageHeight)}px`;
            printdata.ImageAlign = printdata.billformate.ImageAlign;
            printdata.ShopNameFont = `${Number(printdata.billformate.ShopNameFont)}px`;
            printdata.ShopDetailFont = `${Number(printdata.billformate.ShopDetailFont)}px`;
            printdata.LineSpace = `${Number(printdata.billformate.LineSpace)}px`;
            printdata.CustomerFont = `${Number(printdata.billformate.CustomerFont)}px`;
            printdata.CustomerLineSpace = `${Number(printdata.billformate.CustomerLineSpace)}px`;
            printdata.TableHeading = `${Number(printdata.billformate.TableHeading)}px`;
            printdata.TableBody = `${Number(printdata.billformate.TableBody)}px`;
            printdata.NoteFont = `${Number(printdata.billformate.NoteFont)}px`;
            printdata.NoteLineSpace = `${Number(printdata.billformate.NoteLineSpace)}px`;
            printdata.WaterMarkWidth = `${Number(printdata.billformate.WaterMarkWidth)}px`;
            printdata.WaterMarkHeigh = `${Number(printdata.billformate.WaterMarkHeigh)}px`;
            printdata.WaterMarkOpecity = `${Number(printdata.billformate.WaterMarkOpecity)}`;
            printdata.WaterMarkLeft = `${Number(printdata.billformate.WaterMarkLeft)}%`;
            printdata.WaterMarkRight = `${Number(printdata.billformate.WaterMarkRight)}%`;

            printdata.billformate = billformate[0]
            printdata.shopdetails = shopdetails[0]
            printdata.companysetting = companysetting[0]


            const ShopWelComeNote = JSON.parse(printdata.shopdetails.WelcomeNote);

            printdata.powerNoteShop = ShopWelComeNote.filter((ele) => {
                if (ele.NoteType === "CustomerPower") {
                    return true;
                }
                return false;
            });

            var fileName = "";

            printdata.LogoURL = clientConfig.appURL + printdata.shopdetails.LogoURL;
            printdata.WaterMark = clientConfig.appURL + printdata.shopdetails.WaterMark;
            printdata.Signature = clientConfig.appURL + printdata.shopdetails.Signature;

            printdata.PmLogo = clientConfig.appURL + '/assest/pm.png';

            var formatName = "customerPowerPDF.ejs";
            var file = printdata.mode + "-" + 'Power' + "_" + CompanyID + "-" + customer.ID + ".pdf";
            if (CompanyID === 78) {
                if (printdata.mode === 'other') {
                    formatName = "NavjyotiOther.ejs";
                } else {
                    formatName = "customerPowerPDF.ejs"
                }
            }
            if (CompanyID === 55) {
                if (printdata.mode === 'other') {
                    formatName = "ShriRamOther.ejs";
                } else {
                    formatName = "customerPowerPDF.ejs"
                }
            }
            if (CompanyID === 129) {
                if (printdata.mode === 'spectacle') {
                    formatName = "aaradhay.ejs";
                } else {
                    formatName = "customerPowerPDF.ejs"
                }
            }

            var file = printdata.mode + "-" + 'Power' + "_" + CompanyID + "-" + customer.ID + ".pdf";
            fileName = "uploads/" + file;



            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options
                    if (CompanyID == 169) {
                        options = {
                            "height": "1.9in",
                            "width": "3.14in",
                        };
                    } else {
                        options = {
                            format: "A4",
                            orientation: "portrait",
                        };
                    }

                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

            return

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },

    membershipCard: async (req, res, next) => {
        let connection;
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const printdata = req.body
            const customer = req.body.customer
            const expiry = moment(req.body.expiry).format("YYYY-MM-DD");
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
            printdata.shopdetails = shopdetails[0]

            printdata.LogoURL = clientConfig.appURL + printdata.shopdetails.LogoURL;
            printdata.WaterMark = clientConfig.appURL + printdata.shopdetails.WaterMark;

            var formatName = "membershipCard.ejs";
            var file = 'MemberShipCard' + "_" + CompanyID + "-" + customer.ID + ".pdf";
            fileName = "uploads/" + file;

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options

                    options = {
                        "height": "1.9in",
                        "width": "3.14in",
                    }

                    pdf.create(data, options).toFile(fileName, function (err, data) {
                        if (err) {
                            res.send(err);
                        } else {
                            res.json(file);
                        }
                    });
                }
            });

            return

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    },
    customerSearch: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            console.log(req.body);
            const { Name, MobileNo1, Address, Sno } = req.body

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].CustomerShopWise === 'true') {
                shop = ` and customer.ShopID = ${shopid}`
            }

            let qry = ``

            if (CompanyID == "249") {
                qry = `SELECT customer.ID AS ID, customer.Idd, customer.Name AS Name, customer.MobileNo1 AS MobileNo1, customer.MobileNo2 AS MobileNo2, customer.Sno AS Sno, customer.Address AS Address, customer.Title AS Title, CASE WHEN customer.MobileNo1 LIKE '%${MobileNo1}%' THEN customer.MobileNo1 WHEN customer.MobileNo2 LIKE '%${MobileNo1}%' THEN customer.MobileNo2 ELSE NULL END AS MatchedMobile FROM customer WHERE customer.Status = 1 ${shop} AND customer.CompanyID = ${CompanyID} AND customer.Name LIKE '%${Name}%' AND (customer.MobileNo1 LIKE '%${MobileNo1}%' OR customer.MobileNo2 LIKE '%${MobileNo1}%') AND customer.Address LIKE '%${Address}%' AND customer.Sno LIKE '%${Sno}%' ORDER BY customer.ID DESC`
            } else {
                qry = `SELECT customer.ID AS ID, customer.Idd, customer.Name AS Name, customer.MobileNo1 AS MobileNo1, customer.MobileNo2 AS MobileNo2, customer.Sno AS Sno, customer.Address AS Address, customer.Title AS Title, CASE WHEN customer.MobileNo1 LIKE '%${MobileNo1}%' THEN customer.MobileNo1 WHEN customer.MobileNo2 LIKE '%${MobileNo1}%' THEN customer.MobileNo2 ELSE NULL END AS MatchedMobile FROM customer WHERE customer.Status = 1 ${shop} AND customer.CompanyID = ${CompanyID} AND customer.Name LIKE '%${Name}%' AND (customer.MobileNo1 LIKE '%${MobileNo1}%' OR customer.MobileNo2 LIKE '%${MobileNo1}%') AND customer.Address LIKE '%${Address}%' AND customer.Sno LIKE '%${Sno}%' ORDER BY CASE WHEN customer.Name = '${Name}' THEN 1 WHEN customer.Name LIKE '${Name}%' THEN 2 WHEN customer.Name LIKE '%${Name}%' THEN 3 WHEN customer.MobileNo1 = '${MobileNo1}' THEN 4 WHEN customer.MobileNo2 = '${MobileNo1}' THEN 5 WHEN customer.MobileNo1 LIKE '${MobileNo1}%' THEN 6 WHEN customer.MobileNo2 LIKE '${MobileNo1}%' THEN 7 WHEN customer.MobileNo1 LIKE '%${MobileNo1}%' THEN 8 WHEN customer.MobileNo2 LIKE '%${MobileNo1}%' THEN 9 ELSE 10 END,SUBSTRING_INDEX(customer.Name, ' ', 1) ASC, LENGTH(customer.Name) ASC,SUBSTRING_INDEX(customer.Name, ' ', -1) ASC, customer.ID DESC`
            }

            console.log("customer search ---->", CompanyID, qry);


            let finalQuery = qry;
            let [data] = await connection.query(finalQuery);

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
    updateExpiryAndVisitDate: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = 0
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [data] = await connection.query(`select * from spectacle_rx`)

            if (data) {
                let count = 0
                for (let item of data) {
                    count += 1
                    console.log("count ======>", count);
                    let createDate = moment(item.CreatedOn).format("YYYY-MM-DD");

                    if (item.VisitDate === "0000-00-00") {

                        const [update] = await connection.query(`update spectacle_rx set VisitDate = '${moment(item.CreatedOn).format("YYYY-MM-DD")}', UpdatedBy = '${item.CreatedBy}', UpdatedOn = now() where ID = ${item.ID}`)

                        const [update2] = await connection.query(`update spectacle_rx set ExpiryDate = '${moment(item.CreatedOn).add(item.Reminder, "months").format("YYYY-MM-DD")}', UpdatedBy = '${item.CreatedBy}', UpdatedOn = now() where ID = ${item.ID}`)


                    }

                    if (item.VisitDate !== "0000-00-00" && item.ExpiryDate === "0000-00-00") {
                        const [update2] = await connection.query(`update spectacle_rx set ExpiryDate = '${moment(item.VisitDate).add(item.Reminder, "months").format("YYYY-MM-DD")}', UpdatedBy = '${item.CreatedBy}', UpdatedOn = now() where ID = ${item.ID}`)

                    }



                }
            }

            response.message = "data update sucessfully"
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
    updateVisitDateInContactLenRx: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = 0
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [data] = await connection.query(`select * from contact_lens_rx`)

            if (data) {
                let count = 0
                for (let item of data) {
                    count += 1
                    console.log("count ======>", count);
                    let createDate = moment(item.CreatedOn).format("YYYY-MM-DD");


                    const [update] = await connection.query(`update contact_lens_rx set VisitDate = '${moment(item.CreatedOn).format("YYYY-MM-DD")}', UpdatedBy = '${item.CreatedBy}', UpdatedOn = now() where ID = ${item.ID}`)

                }
            }

            response.message = "data update sucessfully"
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
    getEyeTestingReport: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { From, To, Type, Employee, ShopID } = req.body;

            if (From === "" || From === undefined || From === null) return res.send({ message: "Invalid Query Data" })
            if (To === "" || To === undefined || To === null) return res.send({ message: "Invalid Query Data" })
            if (Employee === "" || Employee === undefined || Employee === null) return res.send({ message: "Invalid Query Data" })
            if (ShopID === "" || ShopID === undefined || ShopID === null) return res.send({ message: "Invalid Query Data" })

            let qry = ``;
            let shopFilter = ``
            let employeeFilter = ``
            if (ShopID === 'All') {
                shopFilter = ``
            } else {
                shopFilter = ` and customer.ShopID = ${ShopID}`
            }

            // spectacle_rx , contact_lens_rx
            if (Type === 'spectacle_rx') {
                if (Employee === 'All') {
                    employeeFilter = ``
                } else {
                    employeeFilter = `and spectacle_rx.CreatedBy = ${Employee}`
                }

                qry = `select spectacle_rx.*, customer.Name as CustomerName, customer.MobileNo1 as CustomerMobileNo1, shop.Name as ShopName, shop.AreaName, user.Name as CreatedPerson from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID left join shop on shop.ID = customer.ShopID left join user on user.ID = spectacle_rx.CreatedBy where spectacle_rx.Status = 1 and customer.Status = 1 and spectacle_rx.CompanyID = ${CompanyID} ${shopFilter}  ${employeeFilter} and spectacle_rx.VisitDate between '${From}' and '${To}'`;

            } else if (Type === 'contact_lens_rx') {
                if (Employee === 'All') {
                    employeeFilter = ``
                } else {
                    employeeFilter = `contact_lens_rx.CreatedBy = ${Employee}`
                }

                qry = `select contact_lens_rx.*, customer.Name as CustomerName, customer.MobileNo1 as CustomerMobileNo1, shop.Name as ShopName, shop.AreaName, user.Name as CreatedPerson from contact_lens_rx left join customer on customer.ID = contact_lens_rx.CustomerID left join shop on shop.ID = customer.ShopID left join user on user.ID = contact_lens_rx.CreatedBy where contact_lens_rx.Status = 1 and customer.Status = 1 and contact_lens_rx.CompanyID = ${CompanyID} ${shopFilter}  ${employeeFilter} and contact_lens_rx.VisitDate between '${From}' and '${To}'`;

            } else if (Type === 'contact_lens_rx') {
                if (Employee === 'All') {
                    employeeFilter = ``
                } else {
                    employeeFilter = `contact_lens_rx.CreatedBy = ${Employee}`
                }

                qry = `select contact_lens_rx.*, customer.Name as CustomerName, customer.MobileNo1 as CustomerMobileNo1, shop.Name as ShopName, shop.AreaName, user.Name as CreatedPerson from contact_lens_rx left join customer on customer.ID = contact_lens_rx.CustomerID left join shop on shop.ID = customer.ShopID left join user on user.ID = contact_lens_rx.CreatedBy where contact_lens_rx.Status = 1 and customer.Status = 1 and contact_lens_rx.CompanyID = ${CompanyID} ${shopFilter}  ${employeeFilter} and contact_lens_rx.VisitDate between '${From}' and '${To}'`;

            } else {
                return res.send({ message: "Invalid Type Data" })
            }

            // console.log(qry);
            const [datum] = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = datum


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


    // all customer data export api
    // getEyeTestingReport: async (req, res, next) => {
    //   let connection;
    //     try {
    //         const response = { data: null, success: true, message: "" }
    //         const LoggedOnUser = req.user.ID ? req.user.ID : 0;
    //         const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

    //         const { From, To, Type, Employee, ShopID } = req.body;

    //         const dataQuery = `SELECT customer.*, user.Name AS CreatedByUser, User1.Name AS UpdatedByUser,shop.Name AS ShopName , shop.AreaName AS AreaName FROM customer
    //         LEFT JOIN user ON user.ID = customer.CreatedBy
    //         LEFT JOIN user AS User1 ON User1.ID = customer.UpdatedBy
    //         LEFT JOIN shop ON shop.ID = customer.ID WHERE  customer.CompanyID  = ${CompanyID} AND  customer.Status = 1 `;

    //         const spectacleRxQuery = `SELECT * FROM spectacle_rx WHERE CompanyID = ${CompanyID} and spectacle_rx.Status = 1`;

    //         const contactLensRxQuery = `SELECT * FROM contact_lens_rx WHERE CompanyID = ${CompanyID} and contact_lens_rx.Status = 1`;

    //         const [customerData] = await connection.query(dataQuery);
    //         const [spectacleRxData] = await connection.query(spectacleRxQuery);
    //         const [contactLensRxData] = await connection.query(contactLensRxQuery);

    //         // Iterate over customer data and append spectacle_rx and contact_lens_rx data
    //         customerData.forEach(customer => {
    //             customer.contact_lens_rx = contactLensRxData.filter(el => el.CustomerID === customer.ID);
    //             customer.spectacle_rx = spectacleRxData.filter(e => e.CustomerID === customer.ID);
    //         });

    //          console.log(customerData);

    //         response.message = "data fetched successfully"
    //         response.data = customerData;

    //         return res.send(response);
    //     } catch (err) {
    //         next(err)
    //     } finally {
    //        if (connection) {
    //            connection.release(); // Always release the connection
    //            connection.destroy();
    //        }
    //   }
    // }

    exportCustomerData: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [data] = await connection.query(`SELECT customer.ID AS CustomerID, customer.CompanyID, customer.ShopID, CONCAT(COALESCE(shop.Name, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN '(' ELSE '' END, COALESCE(shop.AreaName, ''), CASE WHEN shop.Name IS NOT NULL AND shop.AreaName IS NOT NULL THEN ')' ELSE '' END) AS ShopName, customer.Sno AS MRDNO, customer.Idd AS Sno, customer.Name, customer.Email, customer.MobileNo1, customer.MobileNo2, customer.PhoneNo, customer.Address, customer.GSTNo, customer.Age, customer.Anniversary, customer.DOB, customer.RefferedByDoc, customer.ReferenceType, customer.Gender, CASE WHEN customer.Category IS NULL THEN '' ELSE customer.Category END AS Category, customer.Other, customer.Remarks, customer.Status, customer.CreatedOn, CASE WHEN customer.UpdatedOn IS NULL THEN '0000-00-00' ELSE customer.UpdatedOn END AS UpdatedOn, customer.VisitDate FROM customer LEFT JOIN shop ON shop.ID = customer.ShopID WHERE customer.Status = 1 AND customer.CompanyID = ${CompanyID}`);

            response.message = "customer data export sucessfully"
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
    exportCustomerPower: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { Type } = req.body;

            if (Type === undefined || Type.trim() === "") {
                return res.send({ message: "Invalid Type, kindly send Type spectacle_rx , contact_lens_rx or other_rx" })
            }

            if (Type !== "spectacle_rx" && Type !== "contact_lens_rx" && Type !== "other_rx") {
                return res.send({ message: "Invalid Type, Type must be spectacle_rx, contact_lens_rx, or other_rx" });
            }
            let data = []

            if (Type === 'spectacle_rx') {
                [data] = await connection.query(`select spectacle_rx.*, customer.Name as CustomerName,customer.MobileNo1 as MobileNo1,customer.MobileNo2 as MobileNo2, customer.Idd AS Sno from spectacle_rx left join customer on customer.ID = spectacle_rx.CustomerID where spectacle_rx.Status = 1 and spectacle_rx.CompanyID = ${CompanyID}`);
            }
            if (Type === 'contact_lens_rx') {
                [data] = await connection.query(`select contact_lens_rx.*, customer.Name as CustomerName ,customer.MobileNo1 as MobileNo1,customer.MobileNo2 as MobileNo2, customer.Idd AS Sno from contact_lens_rx left join customer on customer.ID = contact_lens_rx.CustomerID where contact_lens_rx.Status = 1 and contact_lens_rx.CompanyID = ${CompanyID}`);
            }
            if (Type === 'other_rx') {
                [data] = await connection.query(`select other_rx.*, customer.Name as CustomerName,customer.MobileNo1 as MobileNo1,customer.MobileNo2 as MobileNo2, customer.Idd AS Sno from other_rx left join customer on customer.ID = other_rx.CustomerID where other_rx.Status = 1 and other_rx.CompanyID = ${CompanyID}`);
            }

            response.message = "customer power data export sucessfully"
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
    saveCategory: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { CategoryID, Fromm, Too } = req.body;
            if (!CategoryID || CategoryID === 0 || CategoryID === null) return res.send({ message: "Invalid Query Data" })
            if (!Fromm || Fromm === 0 || Fromm === null || Fromm === '') return res.send({ message: "Invalid Query Data" })
            if (!Too || Too === 0 || Too === null || Too === '') return res.send({ message: "Invalid Query Data" })

            const [checkCategory] = await connection.query(`select ID, Name, Status,TableName  from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'CustomerCategory' and ID = ${CategoryID}`)

            if (!checkCategory.length) {
                return res.send({ message: "Invalid Query CategoryID Data" })
            }

            const [fetch] = await connection.query(`select ID from customercategory where CompanyID = ${CompanyID} and Status = 1 and CategoryID = ${CategoryID}`)

            if (fetch.length) {
                return res.send({ message: "Invalid Query CategoryID Data, Category already exist" })
            }
            const [fetch2] = await connection.query(`select ID from customercategory where CompanyID = ${CompanyID} and Status = 1 and Fromm = '${Fromm}' and Too = '${Too}'`)

            if (fetch2.length) {
                return res.send({ message: `Invalid Query Data, Category already exist from this range.` })
            }
            const [fetch3] = await connection.query(`select ID from customercategory where CompanyID = ${CompanyID} and Status = 1 and Too = '${Fromm}'`)

            if (fetch3.length) {
                return res.send({ message: `Invalid Query Data, Category Range Invalid` })
            }

            const [save] = await connection.query(`insert into customercategory(CompanyID,CategoryID, Fromm, Too, Status, CreatedOn, CreatedBy) values(${CompanyID}, ${CategoryID},'${Fromm}', '${Too}', 1, now(), ${LoggedOnUser})`)


            response.message = "data save successfully";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getCategoryList: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();


            const [fetch] = await connection.query(`select customercategory.*, supportmaster.Name AS Category FROM customercategory
            LEFT JOIN supportmaster ON  supportmaster.ID = customercategory.CategoryID 
            WHERE customercategory.CompanyID = ${CompanyID} AND customercategory.Status = 1 ORDER BY CategoryID DESC`)

            response.data = fetch
            response.message = "data fetch successfully";
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
    deleteAllCategory: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [update] = await connection.query(`update customercategory set Status = 0, UpdatedOn=now(), UpdatedBy=${LoggedOnUser} where CompanyID = ${CompanyID}`)

            response.message = "data delete successfully";
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
    getCustomerCategory: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { CustomerID } = req.body;
            if (!CustomerID || CustomerID === 0 || CustomerID === null) return res.send({ message: "Invalid Query Data" })


            const [fetch] = await connection.query(`select ID from customer where CompanyID = ${CompanyID} and Status = 1 and ID = ${CustomerID}`)

            if (!fetch.length) {
                return res.send({ message: "Invalid Query CustomerID Data, Customer not found" })
            }

            const [fetchBill] = await connection.query(`select MAX(TotalAmount) as Amount from billmaster where CompanyID = ${CompanyID} and Status = 1 and CustomerID = ${CustomerID}`)

            let amount = 0

            if (fetchBill.length) {
                amount = Number(fetchBill[0].Amount)
            }

            const [fetchCategory] = await connection.query(`select ID, CategoryID from customercategory where CompanyID = ${CompanyID} and Status = 1 and Fromm <= ${amount} and Too >= ${amount}`)


            if (!fetchCategory.length) {
                response.data = {
                    Category: 'NA'
                }
                response.message = "data fetch successfully";
                return res.send(response);
            }

            const [fetchCategoryValue] = await connection.query(`select ID, Name from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'CustomerCategory' and ID = ${fetchCategory[0].CategoryID}`)

            if (!fetchCategoryValue.length) {
                response.data = {
                    Category: 'NA'
                }
                response.message = "data fetch successfully";
                return res.send(response);
            }

            response.data = {
                Category: fetchCategoryValue[0].Name
            }
            response.message = "data fetch successfully";
            return res.send(response);
        } catch (err) {
            console.log(err);
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    saveCustomerCredit: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            console.log(req.body);
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.CustomerID) res.send({ message: "Invalid CustomerID" })
            if (!Body.ShopID) res.send({ message: "Invalid ShopID" })
            if (!Body.CreditNumber) res.send({ message: "Invalid CreditNumber" })
            if (!Body.Amount) res.send({ message: "Invalid Query Amount" })
            if (!Body.CreditDate) res.send({ message: "Invalid CreditDate" })
            console.table({ ...Body, shopid: shopid })
            const [doesCheckCn] = await connection.query(`select ID from paymentdetail where CompanyID = ${CompanyID} and BillID = '${Body.CreditNumber.trim()}' and PaymentType = 'Manual Customer Credit' and Credit = 'Debit'`)

            if (doesCheckCn.length) {
                return res.send({ message: `Manual Customer Credit Already exist from this CreditNumber ${Body.CreditNumber}` })
            }

            const [saveCustomerCredit] = await connection.query(`insert into customercredit(CompanyID, ShopID,CustomerID, CreditNumber, CreditDate, Amount, Remark, Is_Return, Status, CreatedBy, CreatedOn)values(${CompanyID}, ${Body.ShopID ? Body.ShopID : shopid}, ${Body.CustomerID}, '${Body.CreditNumber}', '${Body.CreditDate}', ${Body.Amount}, '${Body.Remark ? Body.Remark : `Amount Credited By CreditNumber ${Body.CreditNumber}`}', 0, 1, ${LoggedOnUser}, now())`)

            const [savePaymentMaster] = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${Body.CustomerID}, ${CompanyID}, ${Body.ShopID ? Body.ShopID : shopid}, 'Customer','Debit',now(), 'Manual Customer Credit', '', '', ${Body.Amount}, 0, '',1,${LoggedOnUser}, now())`)

            const [savePaymentDetail] = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${Body.CreditNumber}',${saveCustomerCredit.insertId},${Body.CustomerID},${CompanyID},${Body.Amount},0,'Manual Customer Credit','Debit',1,${LoggedOnUser}, now())`)

            console.log(connected("Manual Customer Credit Added SuccessFUlly !!!"));

            response.message = "manual customer credit save sucessfully"
            return res.send(response);

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    customerCreditReport: async (req, res, next) => {
        let connection;
        try {
            const response = {
                data: null, success: true, message: "", calculation: [{
                    "totalAmount": 0,
                    "totalPaidAmount": 0,
                    "totalBalance": 0
                }]
            }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const { Parem } = req.body

            let params = ``
            if (Parem !== undefined) {
                params = Parem
            }

            sumQry = `select SUM(Amount) as Amount, SUM(PaidAmount) as PaidAmount, ( SUM(Amount) - SUM(PaidAmount) ) as Balance from customercredit where customercredit.CompanyID = ${CompanyID}` + params;

            const [datum] = await connection.query(sumQry);


            qry = `select customercredit.*, customer.Name as CustomerName, shop.Name as ShopName, shop.AreaName from customercredit left join shop on shop.ID = customercredit.ShopID left join customer on customer.ID = customercredit.CustomerID where customercredit.CompanyID = ${CompanyID} ` + params;

            response.message = 'data fetch successfully'
            response.calculation[0].totalAmount = datum[0].Amount || 0
            response.calculation[0].totalPaidAmount = datum[0].PaidAmount || 0
            response.calculation[0].totalBalance = datum[0].Balance || 0

            const [data] = await connection.query(qry)
            response.data = data

            return res.send(response)

        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    // patient record

    savePatientRecord: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const { ID, CustomerID, Type, Comprehensive, Binocular, Contact, lowVision } = req.body;

            if (ID !== null) {
                return res.status(200).json({ message: 'ID must be null.' });
            }

            if (!CustomerID || typeof CustomerID !== 'number' || CustomerID <= 0) {
                return res.status(400).json({ message: 'Valid CustomerID is required.' });
            }

            let qry = ``;

            if (Type === 'Comprehensive') {
                if (!Comprehensive || Object.keys(Comprehensive).length === 0) {
                    return res.status(200).json({ message: 'Comprehensive data is required.' });
                }

                qry = `INSERT INTO patientrecord 
                (CompanyID, CustomerID, Comprehensive, Binocular, Contact, lowVision, CreatedBy, CreatedOn)
                VALUES (
                    ${CompanyID},
                    ${CustomerID},
                    '${JSON.stringify(Comprehensive)}',
                    '${JSON.stringify({})}',
                    '${JSON.stringify({})}',
                    '${JSON.stringify({})}',
                    ${LoggedOnUser},
                    now()
                )`;

            } else if (Type === 'Binocular') {
                if (!Binocular || Object.keys(Binocular).length === 0) {
                    return res.status(200).json({ message: 'Binocular data is required.' });
                }

                qry = `INSERT INTO patientrecord 
                (CompanyID, CustomerID, Comprehensive, Binocular, Contact, lowVision, CreatedBy, CreatedOn)
                VALUES (
                    ${CompanyID},
                    ${CustomerID},
                    '${JSON.stringify({})}',
                    '${JSON.stringify(Binocular)}',
                    '${JSON.stringify({})}',
                    '${JSON.stringify({})}',
                    ${LoggedOnUser},
                    now()
                )`;

            } else if (Type === 'Contact') {
                if (!Contact || Object.keys(Contact).length === 0) {
                    return res.status(200).json({ message: 'Contact data is required.' });
                }

                qry = `INSERT INTO patientrecord 
                (CompanyID, CustomerID, Comprehensive, Binocular, Contact, lowVision, CreatedBy, CreatedOn)
                VALUES (
                    ${CompanyID},
                    ${CustomerID},
                    '${JSON.stringify({})}',
                    '${JSON.stringify({})}',
                    '${JSON.stringify(Contact)}',
                    '${JSON.stringify({})}',
                    ${LoggedOnUser},
                    now()
                )`;

            } else if (Type === 'lowVision') {
                if (!lowVision || Object.keys(lowVision).length === 0) {
                    return res.status(200).json({ message: 'Low Vision data is required.' });
                }

                qry = `INSERT INTO patientrecord 
                (CompanyID, CustomerID, Comprehensive, Binocular, Contact, lowVision, CreatedBy, CreatedOn)
                VALUES (
                    ${CompanyID},
                    ${CustomerID},
                    '${JSON.stringify({})}',
                    '${JSON.stringify({})}',
                    '${JSON.stringify({})}',
                    '${JSON.stringify(lowVision)}',
                    ${LoggedOnUser},
                    now()
                )`;

            } else {
                return res.status(200).json({ message: 'Invalid Type specified.' });
            }

            // Execute query
            const [save] = await connection.query(qry);

            response.data = save.insertId

            response.message = "Patient record saved successfully";
            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
                connection.destroy();
            }
        }
    },
    updatePatientRecord: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const { ID, CustomerID, Type, Comprehensive, Binocular, Contact, lowVision } = req.body;

            // Validation: ID must be valid for update
            if (!ID || typeof ID !== 'number' || ID <= 0) {
                return res.status(200).json({ success: false, message: 'Valid ID is required for update.' });
            }

            if (!CustomerID || typeof CustomerID !== 'number' || CustomerID <= 0) {
                return res.status(200).json({ success: false, message: 'Valid CustomerID is required.' });
            }

            let qry = ``;

            if (Type === 'Comprehensive') {
                if (!Comprehensive || Object.keys(Comprehensive).length === 0) {
                    return res.status(200).json({ success: false, message: 'Comprehensive data is required.' });
                }

                qry = `UPDATE patientrecord SET 
                Comprehensive = '${JSON.stringify(Comprehensive)}',
                Binocular = '${JSON.stringify({})}',
                Contact = '${JSON.stringify({})}',
                lowVision = '${JSON.stringify({})}',
                UpdatedBy = ${LoggedOnUser},
                UpdatedOn = now()
                WHERE ID = ${ID} AND CompanyID = ${CompanyID}`;

            } else if (Type === 'Binocular') {
                if (!Binocular || Object.keys(Binocular).length === 0) {
                    return res.status(200).json({ success: false, message: 'Binocular data is required.' });
                }

                qry = `UPDATE patientrecord SET 
                Comprehensive = '${JSON.stringify({})}',
                Binocular = '${JSON.stringify(Binocular)}',
                Contact = '${JSON.stringify({})}',
                lowVision = '${JSON.stringify({})}',
                UpdatedBy = ${LoggedOnUser},
                UpdatedOn = now()
                WHERE ID = ${ID} AND CompanyID = ${CompanyID}`;

            } else if (Type === 'Contact') {
                if (!Contact || Object.keys(Contact).length === 0) {
                    return res.status(200).json({ success: false, message: 'Contact data is required.' });
                }

                qry = `UPDATE patientrecord SET 
                Comprehensive = '${JSON.stringify({})}',
                Binocular = '${JSON.stringify({})}',
                Contact = '${JSON.stringify(Contact)}',
                lowVision = '${JSON.stringify({})}',
                UpdatedBy = ${LoggedOnUser},
                UpdatedOn = now()
                WHERE ID = ${ID} AND CompanyID = ${CompanyID}`;

            } else if (Type === 'lowVision') {
                if (!lowVision || Object.keys(lowVision).length === 0) {
                    return res.status(200).json({ success: false, message: 'Low Vision data is required.' });
                }

                qry = `UPDATE patientrecord SET 
                Comprehensive = '${JSON.stringify({})}',
                Binocular = '${JSON.stringify({})}',
                Contact = '${JSON.stringify({})}',
                lowVision = '${JSON.stringify(lowVision)}',
                UpdatedBy = ${LoggedOnUser},
                UpdatedOn = now()
                WHERE ID = ${ID} AND CompanyID = ${CompanyID}`;

            } else {
                return res.status(200).json({ success: false, message: 'Invalid Type specified.' });
            }

            // Execute query
            const [result] = await connection.query(qry);

            if (result.affectedRows === 0) {
                return res.status(200).json({ success: false, message: 'Record not found or not updated.' });
            }

            response.message = "Patient record updated successfully";
            return res.status(200).json(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
                connection.destroy();
            }
        }
    },
    getPatientRecordList: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const { CustomerID, Type, currentPage, itemsPerPage } = req.body;

            let page = currentPage || 1;
            let limit = itemsPerPage || 10;
            let skip = page * limit - limit;

            if (!Type || !["Comprehensive", "Binocular", "Contact", "lowVision"].includes(Type)) {
                return res.status(200).json({ success: false, message: "Valid Type is required (Comprehensive, Binocular, Contact, lowVision)" });
            }

            let field = '';
            if (Type === 'Comprehensive') field = 'Comprehensive';
            else if (Type === 'Binocular') field = 'Binocular';
            else if (Type === 'Contact') field = 'Contact';
            else if (Type === 'lowVision') field = 'lowVision';

            let qry = `SELECT patientrecord.ID, patientrecord.CompanyID, patientrecord.CustomerID, ${field}, patientrecord.CreatedOn, CASE WHEN customer.Title IS NULL OR customer.Title = '' THEN customer.Name ELSE CONCAT(customer.Title, ' ', customer.Name) END AS CustomerName, CASE WHEN customer.MobileNo1 IS NOT NULL AND customer.MobileNo1 <> '' THEN customer.MobileNo1 WHEN customer.PhoneNo IS NOT NULL AND customer.PhoneNo <> '' THEN customer.PhoneNo ELSE "" END AS Mobile FROM patientrecord LEFT JOIN customer on customer.ID = patientrecord.CustomerID  WHERE patientrecord.CompanyID = ${CompanyID} and patientrecord.${field}Status = 1  AND patientrecord.${field} IS NOT NULL AND patientrecord.${field} <> '{}'`;

            if (CustomerID && Number(CustomerID) > 0) {
                qry += ` AND patientrecord.CustomerID = ${CustomerID}`;
            }

            qry += ` ORDER BY patientrecord.CreatedOn DESC`;


            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let [rows] = await connection.query(finalQuery);

            let [count] = await connection.query(qry);

            // Optional: Parse the JSON field before sending
            const data = rows.map(row => ({
                ID: row.ID,
                CustomerID: row.CustomerID,
                CustomerName: row.CustomerName,
                Mobile: row.Mobile,
                Type: row.Type,
                [field]: JSON.parse(row[field] || '{}'),
                CreatedOn: row.CreatedOn
            }));

            response.data = data;
            response.count = count.length
            response.message = "Patient records fetched successfully";
            return res.status(200).json(response);

        } catch (err) {
            console.log(err);
            next(err);
        } finally {
            if (connection) {
                connection.release();
                connection.destroy();
            }
        }
    },
    deletePatientRecord: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const CompanyID = req.user.CompanyID || 0;
            const LoggedOnUser = req.user.ID || 0;
            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const { ID, Type } = req.body;

            // Validation
            if (!ID || typeof ID !== 'number' || ID <= 0) {
                return res.status(200).json({ success: false, message: 'Valid ID is required for deletion.' });
            }


            const typeMap = {
                'Comprehensive': { field: 'Comprehensive', status: 'ComprehensiveStatus' },
                'Binocular': { field: 'Binocular', status: 'BinocularStatus' },
                'Contact': { field: 'Contact', status: 'ContactStatus' },
                'lowVision': { field: 'lowVision', status: 'lowVisionStatus' }
            };

            const typeInfo = typeMap[Type];

            if (!typeInfo) {
                return res.status(200).json({ success: false, message: 'Invalid Type specified.' });
            }

            const qry = `UPDATE patientrecord SET ${typeInfo.status} = 0,UpdatedBy = ${LoggedOnUser},UpdatedOn = now() WHERE ID = ${ID} AND CompanyID = ${CompanyID}`;

            const [result] = await connection.query(qry);

            if (result.affectedRows === 0) {
                return res.status(200).json({ success: false, message: 'Record not found or not updated.' });
            }

            response.message = `${Type} data deleted successfully`;
            return res.status(200).json(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
                connection.destroy();
            }
        }
    },

     optometristPDF: async (req, res, next) => {
            let connection;
            try {
                const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
                const shopid = await shopID(req.headers) || 0;
                // const db = await dbConfig.dbByCompanyID(CompanyID);
                const db = req.db;
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();
                const printdata = req.body

                const [shopdetails] = await connection.query(`select * from shop where ID = ${shopid}`)
                const [customer] = await connection.query(`select * from customer where ID = ${printdata.ID} and Status = 1 and CompanyID = ${CompanyID}`)

                const [companysetting] = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)
                const [billformate] = await connection.query(`select * from billformate where CompanyID = ${CompanyID}`)

                const [comprehensive] = await connection.query(`SELECT patientrecord.ID, patientrecord.CompanyID, patientrecord.CustomerID, patientrecord.Comprehensive AS comprehensive FROM patientrecord WHERE ComprehensiveStatus = 1 and CustomerID = ${printdata.ID} AND CompanyID = ${CompanyID} AND patientrecord.Comprehensive != '{}'  ORDER BY patientrecord.CreatedOn DESC`)

                const [binocular] = await connection.query(`SELECT patientrecord.ID, patientrecord.CompanyID, patientrecord.CustomerID, patientrecord.Binocular AS binocular FROM patientrecord WHERE BinocularStatus = 1 and CustomerID = ${printdata.ID} AND CompanyID = ${CompanyID} AND patientrecord.Binocular != '{}' ORDER BY patientrecord.CreatedOn DESC`)

                const [contact] = await connection.query(`SELECT patientrecord.ID, patientrecord.CompanyID, patientrecord.CustomerID, patientrecord.Contact AS contact FROM patientrecord WHERE ContactStatus = 1 and CustomerID = ${printdata.ID} AND CompanyID = ${CompanyID} AND patientrecord.Contact != '{}' ORDER BY patientrecord.CreatedOn DESC`)

                const [lowvision] = await connection.query(`SELECT patientrecord.ID, patientrecord.CompanyID, patientrecord.CustomerID, patientrecord.lowVision AS lowvision FROM patientrecord WHERE lowVisionStatus = 1 and CustomerID = ${printdata.ID} AND CompanyID = ${CompanyID} AND patientrecord.lowVision != '{}' ORDER BY patientrecord.CreatedOn DESC`)

              

                ComP = (comprehensive[0] && comprehensive[0].comprehensive)
                    ? JSON.parse(comprehensive[0].comprehensive)
                    : '';

                BinP = (binocular[0] && binocular[0].binocular)
                    ? JSON.parse(binocular[0].binocular)
                    : '';

                ConP = (contact[0] && contact[0].contact)
                    ? JSON.parse(contact[0].contact)
                    : '';

                LowP = (lowvision[0] && lowvision[0].lowvision)
                    ? JSON.parse(lowvision[0].lowvision)
                    : '';


                var fileName = "";
                printdata.shopdetails = shopdetails[0]
                printdata.customerdetails = customer[0]
                printdata.LogoURL = clientConfig.appURL + printdata.shopdetails.LogoURL;
                    
                var formatName = "optometristPDF.ejs";
                var file = 'optometristPDF' + "_" + printdata.ID + ".pdf";
                fileName = "uploads/" + file;
    
                console.log(fileName);
    
                ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        let options = {
                           format: 'A4',
                            orientation: 'portrait',
                            type: "pdf",
                            padding: {
                                top: '0mm',
                                right: '0mm',
                                bottom: '0mm',
                                left: '0mm'
                              },
                            margin: {
                                top: '0mm',
                                right: '0mm',
                                bottom: '0mm',
                                left: '0mm'
                              },
                            header: {
                                 margin: '0',
                            padding: '0',
                                height: "100px",
                                contents: ''
                            },
                            footer: {
                                 margin: '0',
                            padding: '0',
                                height: "100px",
                                contents: ''
                            }
                        };
                        pdf.create(data, options).toFile(fileName, function (err, data) {
                            if (err) {
                                res.send(err);
                            } else {
                                res.json(file);
                            }
                        });
                    }
                });
                return
            } catch (err) {
                next(err)
            } finally {
                if (connection) {
                    connection.release(); // Always release the connection
                    connection.destroy();
                }
            }
    
        },

}
