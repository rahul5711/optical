const createError = require('http-errors')
const _ = require("lodash")
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const pass_init = require('../helpers/generate_password')
const mysql2 = require('../database');
const { shopID } = require('../helpers/helper_function');


module.exports = {
    save: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.Name || Body.Name.trim() === "" || Body.Name === undefined || Body.Name === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            let shop = ``

            const [fetchCompanySetting] = await mysql2.pool.query(`select DoctorShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].DoctorShopWise === 'true' && (shopid === "0" || shopid === 0)) {
                return res.send({ message: "Invalid shop id, please select shop" });
            }

            if (fetchCompanySetting[0].DoctorShopWise === 'true') {
                shop = ` and doctor.ShopID = ${shopid}`
            }


            const [doesExist] = await mysql2.pool.query(`select ID from doctor where Status = 1 and Name = '${Body.Name}' and CompanyID = ${CompanyID} ${shop}`)

            if (doesExist.length) {
                return res.send({ message: `doctor already exist from this name ${Body.Name}` })
            }

            const pass = await pass_init.hash_password(Body.Password)


            const datum = {
                Name: req.body.Name ? req.body.Name : '',
                Designation: req.body.Designation ? req.body.Designation : '',
                Qualification: req.body.Qualification ? req.body.Qualification : '',
                HospitalName: req.body.HospitalName ? req.body.HospitalName : '',
                MobileNo1: req.body.MobileNo1 ? req.body.MobileNo1 : '',
                MobileNo2: req.body.MobileNo2 ? req.body.MobileNo2 : '',
                PhoneNo: req.body.PhoneNo ? req.body.PhoneNo : '',
                Email: req.body.Email ? req.body.Email : '',
                Address: req.body.Address ? req.body.Address : '',
                Branch: req.body.Branch ? req.body.Branch : '',
                Landmark: req.body.Landmark ? req.body.Landmark : '',
                PhotoURL: req.body.PhotoURL ? req.body.PhotoURL : '',
                DoctorType: req.body.DoctorType ? req.body.DoctorType : '',
                DoctorLoyalty: req.body.DoctorLoyalty ? req.body.DoctorLoyalty : '',
                LoyaltyPerPatient: req.body.LoyaltyPerPatient ? req.body.LoyaltyPerPatient : '',
                LoginPermission: req.body.LoginPermission ? req.body.LoginPermission : '',
                LoginName: req.body.LoginName ? req.body.LoginName : '',
                Password: req.body.Password ? req.body.Password : '',
                CommissionType: req.body.CommissionType ? req.body.CommissionType : 0,
                CommissionMode: req.body.CommissionMode ? req.body.CommissionMode : 0,
                CommissionValue: req.body.CommissionValue ? req.body.CommissionValue : 0,
                CommissionValueNB: req.body.CommissionValueNB ? req.body.CommissionValueNB : 0,
                DOB: req.body.DOB ? req.body.DOB : '',
                Anniversary: req.body.Anniversary ? req.body.Anniversary : ''

            }


            const [saveData] = await mysql2.pool.query(`insert into doctor (CompanyID, ShopID, Name, UserGroup, Designation,Qualification,HospitalName,MobileNo1, MobileNo2 , PhoneNo,Email,Address ,Branch,Landmark,PhotoURL,DoctorType,DoctorLoyalty,LoyaltyPerPatient,LoginPermission,LoginName,Password, Status,CreatedBy,CreatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB,DOB,Anniversary) values (${CompanyID},${shopid},'${datum.Name}','Doctor', '${datum.Designation}', '${datum.Qualification}', '${datum.HospitalName}','${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${datum.Email}','${datum.Address}','${datum.Branch}','${datum.Landmark}','${Body.PhotoURL}','${datum.DoctorType}','${datum.DoctorLoyalty}','${datum.LoyaltyPerPatient}',1,'${datum.LoginName}','${pass}',1,${LoggedOnUser}, now(),${datum.CommissionType},${datum.CommissionMode},${datum.CommissionValue},${datum.CommissionValueNB},'${datum.DOB}','${datum.Anniversary}')`)

            console.log(connected("Data Added SuccessFUlly !!!"));

            response.message = "data save sucessfully"
            response.data = saveData.insertId;

            return res.send(response);
        } catch (err) {
            console.log(err);
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

            const [doesExistDoctor] = await mysql2.pool.query(`select ID from doctor where Name = '${Body.Name}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExistDoctor.length) return res.send({ message: `Doctor Already exist from this Name ${Body.Name}` })

            // const [doesExistLoginName] = await mysql2.pool.query(`select * from doctor where LoginName = '${Body.LoginName}' and Status = 1 and ID != ${Body.ID}`)
            // if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.LoginName}` })

            const datum = {
                Name: req.body.Name ? req.body.Name : '',
                Designation: req.body.Designation ? req.body.Designation : '',
                Qualification: req.body.Qualification ? req.body.Qualification : '',
                HospitalName: req.body.HospitalName ? req.body.HospitalName : '',
                MobileNo1: req.body.MobileNo1 ? req.body.MobileNo1 : '',
                MobileNo2: req.body.MobileNo2 ? req.body.MobileNo2 : '',
                PhoneNo: req.body.PhoneNo ? req.body.PhoneNo : '',
                Email: req.body.Email ? req.body.Email : '',
                Address: req.body.Address ? req.body.Address : '',
                Branch: req.body.Branch ? req.body.Branch : '',
                Landmark: req.body.Landmark ? req.body.Landmark : '',
                PhotoURL: req.body.PhotoURL ? req.body.PhotoURL : '',
                DoctorType: req.body.DoctorType ? req.body.DoctorType : '',
                DoctorLoyalty: req.body.DoctorLoyalty ? req.body.DoctorLoyalty : '',
                LoyaltyPerPatient: req.body.LoyaltyPerPatient ? req.body.LoyaltyPerPatient : '',
                LoginPermission: req.body.LoginPermission ? req.body.LoginPermission : '',
                LoginName: req.body.LoginName ? req.body.LoginName : '',
                Password: req.body.Password ? req.body.Password : '',
                CommissionType: req.body.CommissionType ? req.body.CommissionType : 0,
                CommissionMode: req.body.CommissionMode ? req.body.CommissionMode : 0,
                CommissionValue: req.body.CommissionValue ? req.body.CommissionValue : 0,
                CommissionValueNB: req.body.CommissionValueNB ? req.body.CommissionValueNB : 0,
                DOB: req.body.DOB ? req.body.DOB : '',
                Anniversary: req.body.Anniversary ? req.body.Anniversary : ''

            }

            const [updateDoctor] = await mysql2.pool.query(`update doctor set Name = '${Body.Name}',Designation = '${datum.Designation}',Qualification = '${datum.Qualification}',HospitalName = '${datum.HospitalName}',MobileNo1 = '${datum.MobileNo1}',MobileNo2 = '${datum.MobileNo2}',PhoneNo = '${datum.PhoneNo}',Email = '${datum.Email}',Address='${datum.Address}',Branch='${datum.Branch}',Landmark='${datum.Landmark}',PhotoURL='${datum.PhotoURL}',DoctorType='${datum.DoctorType}', DoctorLoyalty='${datum.DoctorLoyalty}', LoyaltyPerPatient='${datum.LoyaltyPerPatient}', LoginPermission='${datum.LoginPermission}', LoginName='${datum.LoginName}', Status = 1, UpdatedBy=${LoggedOnUser},UpdatedOn=now(), CommissionType = ${datum.CommissionType},CommissionMode=${datum.CommissionMode},CommissionValue=${datum.CommissionValue},CommissionValueNB=${datum.CommissionValueNB},DOB='${datum.DOB}',Anniversary='${datum.Anniversary}' where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Doctor Updated SuccessFUlly !!!");
            response.message = "data update sucessfully"


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
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            const shopid = await shopID(req.headers)

            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select DoctorShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].DoctorShopWise === 'true') {
                shop = ` and doctor.ShopID = ${shopid}`
            }

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select doctor.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from doctor left join user as users1 on users1.ID = doctor.CreatedBy left join user as users on users.ID = doctor.UpdatedBy where doctor.Status = 1 ${shop} and doctor.CompanyID = '${CompanyID}'  order by doctor.ID desc`
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

    dropdownlist: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const UserID = req.user.ID ? req.user.ID : 0;
            const UserGroup = req.user.UserGroup ? req.user.UserGroup : 'CompanyAdmin';

            const shopid = await shopID(req.headers) || 0;


            let shop = ``
            const [fetchCompanySetting] = await mysql2.pool.query(`select DoctorShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].DoctorShopWise === 'true') {
                shop = ` and doctor.ShopID = ${shopid}`
            }


            let [data] = await mysql2.pool.query(`select ID, Name, MobileNo1 from doctor where Status = 1 ${shop} and CompanyID = ${CompanyID} order by ID desc `);
            response.message = "data fetch sucessfully"
            response.data = data


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

            const [doesExist] = await mysql2.pool.query(`select ID from doctor where Status = 1 and CompanyID = '${CompanyID}' and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "doctor doesnot exist from this id " })
            }


            const [deleteDoctor] = await mysql2.pool.query(`update doctor set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID} and CompanyID = ${CompanyID}`)

            console.log("Doctor Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"


            return res.send(response);
        } catch (err) {
            next(err)
        }
    },

    getDoctorById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [Doctor] = await mysql2.pool.query(`select * from doctor where Status = 1 and CompanyID = ${CompanyID} and ID = ${Body.ID}`)

            response.message = "data fetch sucessfully"
            response.data = Doctor

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
            const [fetchCompanySetting] = await mysql2.pool.query(`select DoctorShopWise from companysetting where CompanyID = ${CompanyID}`)



            if (fetchCompanySetting[0].DoctorShopWise === 'true') {
                shop = ` and doctor.ShopID = ${shopid}`
            }


            let qry = `select doctor.*, users1.Name as CreatedPerson, users.Name as UpdatedPerson from doctor left join user as users1 on users1.ID = doctor.CreatedBy left join user as users on users.ID = doctor.UpdatedBy where doctor.Status = 1 ${shop} and doctor.CompanyID = '${CompanyID}' and doctor.Name like '%${Body.searchQuery}%' OR doctor.Status = 1 ${shop} and doctor.CompanyID = '${CompanyID}' and doctor.MobileNo1 like '%${Body.searchQuery}%' OR doctor.Status = 1 ${shop} and doctor.CompanyID = '${CompanyID}' and doctor.HospitalName like '%${Body.searchQuery}%'`

            let [data] = await mysql2.pool.query(qry);

            response.message = "data fetch sucessfully"
            response.data = data
            response.count = data.length


            return res.send(response);

        } catch (err) {
            next(err)
        }
    }
}