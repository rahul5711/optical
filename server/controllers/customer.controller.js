const createError = require('http-errors')
const mysql = require('../helpers/db')
const pass_init = require('../helpers/generate_password')
const { Idd, generateVisitNo, shopID } = require('../helpers/helper_function')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
let ejs = require("ejs");
let path = require("path");
let pdf = require("html-pdf");
var TinyURL = require('tinyurl');
const clientConfig = require("../helpers/constants");

module.exports = {
    save: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "", CustomerID: null, spectacle_rx: [], contact_lens_rx: [], other_rx: [] }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { Name, Sno, MobileNo1, MobileNo2, PhoneNo, Address, GSTNo, Email, PhotoURL, DOB, RefferedByDoc, Age, Anniversary, ReferenceType, Gender, Other, Remarks, VisitDate, spectacle_rx, contact_lens_rx, other_rx, tablename } = req.body

            if (Name.trim() == "" || Name === undefined) {
                return res.send({ message: "Invalid Name" })
            }
            if (tablename === undefined || tablename.trim() === "") {
                return res.send({ message: "Invalid tablename, kindly send tablename spectacle_rx , contact_lens_rx or other_rx" })
            }


            const Id = await Idd(req)
            const customer = await connection.query(`insert into customer(ShopID,Idd,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,RefferedByDoc,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Status,CreatedBy,CreatedOn,VisitDate) values(${shopid},'${Id}', '${Name}','${Sno}',${CompanyID},'${MobileNo1}','${MobileNo2}','${PhoneNo}','${Address}','${GSTNo}','${Email}','${PhotoURL}','${DOB}','${RefferedByDoc}','${Age}','${Anniversary}','${ReferenceType}','${Gender}','${Other}','${Remarks}',1,'${LoggedOnUser}',now(),'${VisitDate}')`);

            console.log(connected("Customer Added SuccessFUlly !!!"));


            if (tablename === 'spectacle_rx') {
                //  spectacle_rx object data

                const spectacle = spectacle_rx;

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
                    ExpiryDate: spectacle.ExpiryDate ? spectacle.ExpiryDate : ''
                }


                const saveSpec = await connection.query(`insert into spectacle_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_Prism,L_Prism,Lens,Shade,Frame,VertexDistance,RefractiveIndex,FittingHeight,ConstantUse,NearWork,DistanceWork,UploadBy,PhotoURL,FileURL,Family,RefferedByDoc,Reminder,ExpiryDate,Status,CreatedBy,CreatedOn) values(${specDatum.VisitNo}, ${CompanyID}, ${specDatum.CustomerID},'${specDatum.REDPSPH}','${specDatum.REDPCYL}','${specDatum.REDPAxis}','${specDatum.REDPVA}','${specDatum.LEDPSPH}','${specDatum.LEDPCYL}','${specDatum.LEDPAxis}','${specDatum.LEDPVA}','${specDatum.RENPSPH}','${specDatum.RENPCYL}','${specDatum.RENPAxis}','${specDatum.RENPVA}','${specDatum.LENPSPH}','${specDatum.LENPCYL}','${specDatum.LENPAxis}','${specDatum.LENPVA}','${specDatum.REPD}','${specDatum.LEPD}','${specDatum.R_Addition}','${specDatum.L_Addition}','${specDatum.R_Prism}','${specDatum.L_Prism}','${specDatum.Lens}','${specDatum.Shade}','${specDatum.Frame}','${specDatum.VertexDistance}','${specDatum.RefractiveIndex}','${specDatum.FittingHeight}',${specDatum.ConstantUse},${specDatum.NearWork},${specDatum.DistanceWork},'${specDatum.UploadBy}','${specDatum.PhotoURL}','${specDatum.FileURL}','${specDatum.Family}','${specDatum.RefferedByDoc}','${specDatum.Reminder}','${specDatum.ExpiryDate}',1,${LoggedOnUser},now())`)

                console.log(connected("Customer Spec Added SuccessFUlly !!!"));

                response.spectacle_rx = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${customer.insertId} and Status = 1 order by ID desc`)

            } else if (tablename === 'contact_lens_rx') {
                // contact_lens_rx object data

                const contact = contact_lens_rx

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
                    RefferedByDoc: contact.RefferedByDoc ? contact.RefferedByDoc : ''
                }

                const saveContact = await connection.query(`insert into contact_lens_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_KR,L_KR,R_HVID,L_HVID,R_CS,L_CS,R_BC,L_BC,R_Diameter,L_Diameter,BR,Material,Modality,Other,ConstantUse,NearWork,DistanceWork,Multifocal,PhotoURL,FileURL,Family,RefferedByDoc,Status,CreatedBy,CreatedOn) values (${contactDatum.VisitNo}, ${CompanyID}, ${contactDatum.CustomerID},'${contactDatum.REDPSPH}','${contactDatum.REDPCYL}','${contactDatum.REDPAxis}','${contactDatum.REDPVA}','${contactDatum.LEDPSPH}','${contactDatum.LEDPCYL}','${contactDatum.LEDPAxis}','${contactDatum.LEDPVA}','${contactDatum.RENPSPH}','${contactDatum.RENPCYL}','${contactDatum.RENPAxis}','${contactDatum.RENPVA}','${contactDatum.LENPSPH}','${contactDatum.LENPCYL}','${contactDatum.LENPAxis}','${contactDatum.LENPVA}','${contactDatum.REPD}','${contactDatum.LEPD}','${contactDatum.R_Addition}','${contactDatum.L_Addition}','${contactDatum.R_KR}','${contactDatum.L_KR}','${contactDatum.R_HVID}','${contactDatum.L_HVID}','${contactDatum.R_CS}','${contactDatum.L_CS}','${contactDatum.R_BC}','${contactDatum.L_BC}','${contactDatum.R_Diameter}','${contactDatum.L_Diameter}','${contactDatum.BR}','${contactDatum.Material}','${contactDatum.Modality}','${contactDatum.Other}',${contactDatum.ConstantUse},${contactDatum.NearWork},${contactDatum.DistanceWork},${contactDatum.Multifocal},'${contactDatum.PhotoURL}','${contactDatum.FileURL}','${contactDatum.Family}','${contactDatum.RefferedByDoc}',1,${LoggedOnUser},now())`)

                console.log(connected("Customer Contact Added SuccessFUlly !!!"));

                response.spectacle_rx = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${customer.insertId} and Status = 1 order by ID desc`);

            } else if (tablename === 'other_rx') {

                // other_rx other_rx object

                const other = other_rx

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
                    FileURL: other.FileURL ? other.FileURL : ''
                }

                const saveOther = await connection.query(`insert into other_rx(CustomerID,CompanyID,VisitNo,BP,Sugar,IOL_Power,Operation,R_VN,L_VN,R_TN,L_TN,R_KR,L_KR,Treatment,Diagnosis,Family,RefferedByDoc,FileURL,Status,CreatedBy,CreatedOn) values (${otherDatum.CustomerID},${CompanyID},${otherDatum.VisitNo},'${otherDatum.BP}','${otherDatum.Sugar}','${otherDatum.IOL_Power}','${otherDatum.Operation}','${otherDatum.R_VN}','${otherDatum.L_VN}','${otherDatum.R_TN}','${otherDatum.L_TN}','${otherDatum.R_KR}','${otherDatum.L_KR}','${otherDatum.Treatment}','${otherDatum.Diagnosis}','${otherDatum.Family}','${otherDatum.RefferedByDoc}','${otherDatum.FileURL}',1,${LoggedOnUser}, now())`)

                console.log(connected("Customer Other Added SuccessFUlly !!!"));

                response.other_rx = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${customer.insertId} and Status = 1 order by ID desc`)

            }

            response.CustomerID = customer.insertId,
                response.message = "data save sucessfully",
                response.data = await connection.query(`select customer.*, shop.Name as ShopName, shop.AreaName as AreaName from customer left join shop on shop.ID = customer.ShopID where customer.CompanyID = ${CompanyID} and customer.ID = ${customer.insertId}`)

            return res.send(response)

        } catch (err) {
            next(err)
        }
    },
    list: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select customer.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson, shop.Name as ShopName, shop.AreaName as AreaName from customer left join user as users1 on users1.ID = customer.CreatedBy left join user as users on users.ID = customer.UpdatedBy left join shop on shop.ID = customer.ShopID where customer.Status = 1 and customer.CompanyID = '${CompanyID}'  order by customer.ID desc`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            let data = await connection.query(finalQuery);
            let count = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = count.length

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    delete: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from customer where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "customer doesnot exist from this id " })
            }


            const deleteCustomer = await connection.query(`update customer set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Customer Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    restore: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })

            if (!Body.ID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from customer where Status = 0 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "customer doesnot exist from this id " })
            }


            const restoreCustomer = await connection.query(`update customer set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Customer Restore SuccessFUlly !!!");

            response.message = "data restore sucessfully"

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    searchByFeild: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select customer.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson, shop.Name as ShopName, shop.AreaName as AreaName from customer left join user as users1 on users1.ID = customer.CreatedBy left join user as users on users.ID = customer.UpdatedBy left join shop on shop.ID = customer.ShopID where customer.Status = 1 and customer.CompanyID = '${CompanyID}' and customer.Name like '%${Body.searchQuery}%' OR customer.Status = 1 and customer.CompanyID = '${CompanyID}' and customer.MobileNo1 like '%${Body.searchQuery}%' OR customer.Status = 1 and customer.CompanyID = '${CompanyID}' and shop.Name like '%${Body.searchQuery}%' `

            let data = await connection.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length

            return res.send(response);


        } catch (err) {
            next(err)
        }
    },

    getCustomerById: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "", spectacle_rx: [], contact_lens_rx: [], other_rx: [] }
            const { CustomerID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!CustomerID) return res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from customer where Status = 1 and CompanyID = '${CompanyID}' and ID = '${CustomerID}'`)

            if (!doesExist.length) {
                return res.send({ message: "customer doesnot exist from this id " })
            }

            response.data = doesExist || [];
            response.spectacle_rx = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`) || [];
            response.contact_lens_rx = await connection.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`) || [];
            response.other_rx = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`) || [];
            response.message = 'data fetch successfully'
            return res.send(response)
        } catch (err) {
            next(err)
        }
    },
    deleteSpec: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const { ID, tablename, CustomerID } = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            if (_.isEmpty(req.body)) return res.send({ message: "Invalid Query Data" })
            if (!ID) return res.send({ message: "Invalid Query Data" })
            if (!CustomerID) return res.send({ message: "Invalid Query Data" })
            if (tablename === undefined || tablename.trim() === "") {
                return res.send({ message: "Invalid tablename, kindly send tablename spectacle_rx , contact_lens_rx or other_rx" })
            }

            if (tablename === 'spectacle_rx') {
                const deletespectacle_rx = await connection.query(`update spectacle_rx set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${ID} and CompanyID = ${CompanyID}`)
                response.spectacle_rx = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`);

            } else if (tablename === 'contact_lens_rx') {
                const deletecontact_lens_rx = await connection.query(`update contact_lens_rx set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${ID} and CompanyID = ${CompanyID}`)
                response.contact_lens_rx = await connection.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`);
            } else if (tablename === 'other_rx') {
                const deleteother_rx = await connection.query(`update other_rx set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${ID} and CompanyID = ${CompanyID}`)
                response.other_rx = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and Status = 1 order by ID desc`);
            }

            response.message = 'data delete successfully'
            return res.send(response)
        } catch (err) {
            next(err)
        }
    },

    update: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "", CustomerID: null, spectacle_rx: [], contact_lens_rx: [], other_rx: [] }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const { ID, Name, Sno, MobileNo1, MobileNo2, PhoneNo, Address, GSTNo, Email, PhotoURL, DOB, RefferedByDoc, Age, Anniversary, ReferenceType, Gender, Other, Remarks, VisitDate, spectacle_rx, contact_lens_rx, other_rx, tablename } = req.body

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

            const update = await connection.query(`update customer set Name='${Name}', Sno='${Sno}', MobileNo1='${MobileNo1}', MobileNo2='${MobileNo2}', PhoneNo='${PhoneNo}', Address='${Address}', GSTNo='${GSTNo}', Email='${Email}', PhotoURL='${PhotoURL}', DOB='${DOB}', RefferedByDoc='${RefferedByDoc}', Age='${Age}', Anniversary='${Anniversary}', ReferenceType='${ReferenceType}', Gender='${Gender}', Other='${Other}', Remarks='${Remarks}', VisitDate='${VisitDate}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and ID = ${ID}`)

            console.log(connected("Customer Updated SuccessFUlly !!!"));


            if (tablename === 'spectacle_rx') {
                const spectacle = spectacle_rx;
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
                    ExpiryDate: spectacle.ExpiryDate ? spectacle.ExpiryDate : ''
                }
                if (spectacle_rx.ID === null || spectacle_rx.ID === 'null') {
                    const saveSpec = await connection.query(`insert into spectacle_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_Prism,L_Prism,Lens,Shade,Frame,VertexDistance,RefractiveIndex,FittingHeight,ConstantUse,NearWork,DistanceWork,UploadBy,PhotoURL,FileURL,Family,RefferedByDoc,Reminder,ExpiryDate,Status,CreatedBy,CreatedOn) values(${specDatum.VisitNo}, ${CompanyID}, ${specDatum.CustomerID},'${specDatum.REDPSPH}','${specDatum.REDPCYL}','${specDatum.REDPAxis}','${specDatum.REDPVA}','${specDatum.LEDPSPH}','${specDatum.LEDPCYL}','${specDatum.LEDPAxis}','${specDatum.LEDPVA}','${specDatum.RENPSPH}','${specDatum.RENPCYL}','${specDatum.RENPAxis}','${specDatum.RENPVA}','${specDatum.LENPSPH}','${specDatum.LENPCYL}','${specDatum.LENPAxis}','${specDatum.LENPVA}','${specDatum.REPD}','${specDatum.LEPD}','${specDatum.R_Addition}','${specDatum.L_Addition}','${specDatum.R_Prism}','${specDatum.L_Prism}','${specDatum.Lens}','${specDatum.Shade}','${specDatum.Frame}','${specDatum.VertexDistance}','${specDatum.RefractiveIndex}','${specDatum.FittingHeight}',${specDatum.ConstantUse},${specDatum.NearWork},${specDatum.DistanceWork},'${specDatum.UploadBy}','${specDatum.PhotoURL}','${specDatum.FileURL}','${specDatum.Family}','${specDatum.RefferedByDoc}','${specDatum.Reminder}','${specDatum.ExpiryDate}',1,${LoggedOnUser},now())`)

                    console.log(connected("Customer Spec Added SuccessFUlly !!!"));
                } else if (spectacle_rx.ID !== null || spectacle_rx.ID !== 'null' || spectacle_rx.ID !== undefined) {
                    // update
                    const updateSpec = await connection.query(`update spectacle_rx set REDPSPH = '${specDatum.REDPSPH}', REDPCYL = '${specDatum.REDPCYL}', REDPAxis = '${specDatum.REDPAxis}', REDPVA = '${specDatum.REDPVA}', LEDPSPH = '${specDatum.LEDPSPH}', LEDPCYL = '${specDatum.LEDPCYL}', LEDPAxis = '${specDatum.LEDPAxis}', LEDPVA = '${specDatum.LEDPVA}',  RENPSPH = '${specDatum.RENPSPH}', RENPCYL = '${specDatum.RENPCYL}',  RENPAxis = '${specDatum.RENPAxis}', RENPVA = '${specDatum.RENPVA}', LENPSPH = '${specDatum.LENPSPH}', LENPCYL = '${specDatum.LENPCYL}', LENPAxis = '${specDatum.LENPAxis}', LENPVA = '${specDatum.LENPVA}', REPD = '${specDatum.REPD}', LEPD = '${specDatum.LEPD}', R_Addition = '${specDatum.R_Addition}' , L_Addition = '${specDatum.L_Addition}', R_Prism = '${specDatum.R_Prism}', L_Prism = '${specDatum.L_Prism}', Lens = '${specDatum.Lens}', Shade = '${specDatum.Shade}', Frame = '${specDatum.Frame}', VertexDistance = '${specDatum.VertexDistance}', RefractiveIndex = '${specDatum.RefractiveIndex}', FittingHeight = '${specDatum.FittingHeight}', ConstantUse = ${specDatum.ConstantUse}, NearWork = ${specDatum.NearWork}, DistanceWork = ${specDatum.DistanceWork}, UploadBy = '${specDatum.UploadBy}', PhotoURL = '${specDatum.PhotoURL}', FileURL = '${specDatum.FileURL}', Family = '${specDatum.Family}',RefferedByDoc = '${specDatum.RefferedByDoc}',Reminder = '${specDatum.Reminder}',ExpiryDate = '${specDatum.ExpiryDate}',  UpdatedBy = '${LoggedOnUser}', Updatedon = now()  where CompanyID = ${CompanyID} and CustomerID = ${ID} and ID =${spectacle_rx.ID}`)

                    console.log(connected("Customer Spec Update SuccessFUlly !!!"));
                }

                response.spectacle_rx = await connection.query(`select * from spectacle_rx where CompanyID = ${CompanyID} and CustomerID = ${ID} and Status = 1 order by ID desc`)

            }

            if (tablename === 'contact_lens_rx') {
                const contact = contact_lens_rx
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
                    RefferedByDoc: contact.RefferedByDoc ? contact.RefferedByDoc : ''
                }
                if (contact_lens_rx.ID === null || contact_lens_rx.ID === 'null') {


                    const saveContact = await connection.query(`insert into contact_lens_rx(VisitNo,CompanyID,CustomerID,REDPSPH,REDPCYL,REDPAxis,REDPVA,LEDPSPH,LEDPCYL,LEDPAxis,LEDPVA,RENPSPH,RENPCYL,RENPAxis,RENPVA,LENPSPH,LENPCYL,LENPAxis,LENPVA,REPD,LEPD,R_Addition,L_Addition,R_KR,L_KR,R_HVID,L_HVID,R_CS,L_CS,R_BC,L_BC,R_Diameter,L_Diameter,BR,Material,Modality,Other,ConstantUse,NearWork,DistanceWork,Multifocal,PhotoURL,FileURL,Family,RefferedByDoc,Status,CreatedBy,CreatedOn) values (${contactDatum.VisitNo}, ${CompanyID}, ${contactDatum.CustomerID},'${contactDatum.REDPSPH}','${contactDatum.REDPCYL}','${contactDatum.REDPAxis}','${contactDatum.REDPVA}','${contactDatum.LEDPSPH}','${contactDatum.LEDPCYL}','${contactDatum.LEDPAxis}','${contactDatum.LEDPVA}','${contactDatum.RENPSPH}','${contactDatum.RENPCYL}','${contactDatum.RENPAxis}','${contactDatum.RENPVA}','${contactDatum.LENPSPH}','${contactDatum.LENPCYL}','${contactDatum.LENPAxis}','${contactDatum.LENPVA}','${contactDatum.REPD}','${contactDatum.LEPD}','${contactDatum.R_Addition}','${contactDatum.L_Addition}','${contactDatum.R_KR}','${contactDatum.L_KR}','${contactDatum.R_HVID}','${contactDatum.L_HVID}','${contactDatum.R_CS}','${contactDatum.L_CS}','${contactDatum.R_BC}','${contactDatum.L_BC}','${contactDatum.R_Diameter}','${contactDatum.L_Diameter}','${contactDatum.BR}','${contactDatum.Material}','${contactDatum.Modality}','${contactDatum.Other}',${contactDatum.ConstantUse},${contactDatum.NearWork},${contactDatum.DistanceWork},${contactDatum.Multifocal},'${contactDatum.PhotoURL}','${contactDatum.FileURL}','${contactDatum.Family}','${contactDatum.RefferedByDoc}',1,${LoggedOnUser},now())`)

                    console.log(connected("Customer Contact Added SuccessFUlly !!!"));


                } else if (contact_lens_rx.ID !== null || contact_lens_rx.ID !== 'null' || contact_lens_rx.ID !== undefined) {
                    // update
                    const updateSpec = await connection.query(`update contact_lens_rx set REDPSPH='${contactDatum.REDPSPH}', REDPCYL='${contactDatum.REDPCYL}', REDPAxis='${contactDatum.REDPAxis}', REDPVA='${contactDatum.REDPVA}', LEDPSPH='${contactDatum.LEDPSPH}', LEDPCYL='${contactDatum.LEDPCYL}', LEDPAxis='${contactDatum.LEDPAxis}', LEDPVA='${contactDatum.LEDPVA}', RENPSPH='${contactDatum.RENPSPH}', RENPCYL='${contactDatum.RENPCYL}', RENPAxis='${contactDatum.RENPAxis}', RENPVA='${contactDatum.RENPVA}', LENPSPH='${contactDatum.LENPSPH}', LENPCYL='${contactDatum.LENPCYL}', LENPAxis='${contactDatum.LENPAxis}', LENPVA='${contactDatum.LENPVA}', REPD='${contactDatum.REPD}', LEPD='${contactDatum.LEPD}', R_Addition='${contactDatum.R_Addition}', L_Addition='${contactDatum.L_Addition}', R_KR='${contactDatum.R_KR}', L_KR='${contactDatum.L_KR}', R_HVID='${contactDatum.R_HVID}', L_HVID='${contactDatum.L_HVID}', R_CS='${contactDatum.R_CS}', L_CS='${contactDatum.L_CS}', R_BC='${contactDatum.R_BC}', L_BC='${contactDatum.L_BC}', R_Diameter='${contactDatum.R_Diameter}', L_Diameter='${contactDatum.L_Diameter}', BR='${contactDatum.BR}', Material='${contactDatum.Material}', Modality='${contactDatum.Modality}', Other='${contactDatum.Other}', ConstantUse=${contactDatum.ConstantUse}, NearWork=${contactDatum.NearWork}, DistanceWork=${contactDatum.DistanceWork}, Multifocal=${contactDatum.Multifocal}, PhotoURL='${contactDatum.PhotoURL}', FileURL='${contactDatum.FileURL}', Family='${contactDatum.Family}', RefferedByDoc='${contactDatum.RefferedByDoc}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID=${contact_lens_rx.ID} and CustomerID = ${ID} and CompanyID = ${CompanyID}`)

                    console.log(connected("Customer Spec Update SuccessFUlly !!!"));

                }

                response.contact_lens_rx = await connection.query(`select * from contact_lens_rx where CompanyID = ${CompanyID} and CustomerID = ${ID} and Status = 1 order by ID desc`);
            }

            if (tablename === 'other_rx') {
                const other = other_rx
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
                    FileURL: other.FileURL ? other.FileURL : ''
                }
                if (other_rx.ID === null || other_rx.ID === 'null') {

                    const saveOther = await connection.query(`insert into other_rx(CustomerID,CompanyID,VisitNo,BP,Sugar,IOL_Power,Operation,R_VN,L_VN,R_TN,L_TN,R_KR,L_KR,Treatment,Diagnosis,Family,RefferedByDoc,FileURL,Status,CreatedBy,CreatedOn) values (${otherDatum.CustomerID},${CompanyID},${otherDatum.VisitNo},'${otherDatum.BP}','${otherDatum.Sugar}','${otherDatum.IOL_Power}','${otherDatum.Operation}','${otherDatum.R_VN}','${otherDatum.L_VN}','${otherDatum.R_TN}','${otherDatum.L_TN}','${otherDatum.R_KR}','${otherDatum.L_KR}','${otherDatum.Treatment}','${otherDatum.Diagnosis}','${otherDatum.Family}','${otherDatum.RefferedByDoc}','${otherDatum.FileURL}',1,${LoggedOnUser}, now())`)

                    console.log(connected("Customer Other Added SuccessFUlly !!!"));


                } else if (other_rx.ID !== null || other_rx.ID !== 'null' || other_rx.ID !== undefined) {
                    //  update
                    const updateSpec = await connection.query(`update other_rx set BP='${otherDatum.BP}', Sugar='${otherDatum.Sugar}', IOL_Power='${otherDatum.IOL_Power}', Operation='${otherDatum.Operation}', R_VN='${otherDatum.R_VN}', L_VN='${otherDatum.L_VN}', R_TN='${otherDatum.R_TN}', L_TN='${otherDatum.L_TN}', R_KR='${otherDatum.R_KR}', L_KR='${otherDatum.L_KR}', Treatment='${otherDatum.Treatment}', Diagnosis='${otherDatum.Diagnosis}', Family='${otherDatum.Family}', RefferedByDoc='${otherDatum.RefferedByDoc}', FileURL='${otherDatum.FileURL}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where ID=${other_rx.ID} and CustomerID =${ID} and CompanyID=${CompanyID}`)

                    console.log(connected("Customer Spec Update SuccessFUlly !!!"));

                }

                response.other_rx = await connection.query(`select * from other_rx where CompanyID = ${CompanyID} and CustomerID = ${ID} and Status = 1 order by ID desc`)
            }

            response.CustomerID = ID,
                response.message = "data update sucessfully",
                response.data = await connection.query(`select * from customer where CompanyID = ${CompanyID} and ID = ${ID}`)

            return res.send(response)


        } catch (err) {
            next(err)
        }
    },

    dropdownlist: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            let qry = `select customer.ID as ID, customer.Name as Name from customer where customer.Status = 1 and customer.CompanyID = '${CompanyID}'  order by customer.ID desc limit 100`


            let finalQuery = qry ;

            let data = await connection.query(finalQuery);

            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    customerGSTNumber: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            let qry = `select customer.ID as ID, customer.Name as Name, customer.GSTNo as GSTNumber from customer where customer.Status = 1 and customer.GSTNo != '' and customer.CompanyID = '${CompanyID}'  order by customer.ID desc`


            let finalQuery = qry ;

            let data = await connection.query(finalQuery);

            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },

    getMeasurementByCustomer: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { CustomerID, type } = req.body;

            if (CustomerID === "" || CustomerID === undefined) {
                return res.send({ message: "Invalid CustomerID" })
            }
            if (type === "" || type === undefined) {
                return res.send({ message: "Invalid type" })
            }

            let check = false
            if ( type === "Lens" ) {
                check = true
            } else if (type === "ContactLens" ) {
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

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    getMeasurementByCustomerForDropDown: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const { CustomerID, type } = req.body;

            if (CustomerID === "" || CustomerID === undefined) {
                return res.send({ message: "Invalid CustomerID" })
            }
            if (type === "" || type === undefined) {
                return res.send({ message: "Invalid type" })
            }

            let check = false
            if ( type === "Lens" ) {
                check = true
            } else if (type === "ContactLens" ) {
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

            let data = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
    customerPowerPDF:async (req, res, next) => {
        const connection = mysql;
        try {
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            const printdata = req.body
            const customer = req.body.customer
            const spectacle = req.body.spectacle
            const contact = req.body.contact
            const other = req.body.other




            const shopdetails = await connection.query(`select * from shop where ID = ${shopid}`)
            const companysetting = await connection.query(`select * from companysetting where CompanyID = ${CompanyID}`)


            printdata.shopdetails = shopdetails[0]
            printdata.companysetting = companysetting[0]
             console.log(shopdetails);

            var fileName = "";

            if(!printdata.companysetting.LogoURL){
                printdata.LogoURL = clientConfig.appURL + '../assest/no-image.png';
            }else{
                printdata.LogoURL = clientConfig.appURL + printdata.companysetting.LogoURL;
            }
            
            var formatName = "customerPowerPDF.ejs";
            var file = formatName + "_" + CompanyID + "-" + customer.ID + ".pdf";
            fileName = "uploads/" + file;

            console.log(fileName);

            ejs.renderFile(path.join(appRoot, './views/', formatName), { data: printdata }, (err, data) => {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    let options = {
                        "height": "11.25in",
                        "width": "8.5in",
                        header: {
                            height: "0mm"
                        },
                        footer: {
                            height: "0mm",
                            contents: {
                                last: ``,
                            },
                        },
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
        }

    },

    customerSearch: async (req, res, next) => {
        const connection = mysql;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            console.log( req.body); 
            const { searchString } = req.body
            
            let qry = `select customer.ID as ID, customer.Idd, customer.Name as Name, customer.MobileNo1, customer.MobileNo2  from customer where customer.Status = 1 and customer.Name like '%${searchString}%' OR customer.MobileNo1 like'%${searchString}%' OR customer.MobileNo2 like '%${searchString}%' OR customer.Idd like '%${searchString}%' and customer.CompanyID = '${CompanyID}'  order by customer.ID desc`


            let finalQuery = qry ;

            let data = await connection.query(finalQuery);

            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);

        } catch (err) {
            next(err)
        }
    },
}
