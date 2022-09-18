const createError = require('http-errors')
const getConnection = require('../helpers/db')
const pass_init = require('../helpers/generate_password')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;

function match(password, p) {
    return bcrypt.compare(password, p)
    // return password == this.password

}

module.exports = {


    create: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (_.isEmpty(Body.Password)) res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from company where Email = '${Body.Email}' and Status = 1`)
            if (doesExist.length) return res.send({ message: `Company Already exist from this Email ${Body.Email}` })


            const doesExistUser = await connection.query(`select * from User where Email = '${Body.Email}' and Status = 1`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.Email}` })

            const doesExistLoginName = await connection.query(`select * from User where LoginName = '${Body.LoginName}'`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.LoginName}` })

            const saveCompany = await connection.query(`insert into company (Name,  MobileNo1,  MobileNo2,  PhoneNo,  Address, Country, State, City,  Email,  Website,  GSTNo,  CINNo,  LogoURL,  Remark,  Plan, Version, NoOfShops,  EffectiveDate,  CancellationDate, EmailMsg, WhatsappMsg, WholeSale,RetailPrice,  Status, CreatedBy , CreatedOn ) values ('${Body.CompanyName}', '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}', '${Body.Address}', '${Body.Country}', '${Body.State}', '${Body.City}', '${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.LogoURL}','${Body.Remark}',${Body.Plan},'${Body.Version}',${Body.NoOfShops}, '${Body.EffectiveDate}', '${Body.CancellationDate}', '${Body.EmailMsg}',  '${Body.WhatsappMsg}','${Body.WholeSale}', '${Body.RetailPrice}', 1 , ${LoggedOnUser}, now())`)

            console.log(connected("Company Added SuccessFUlly !!!"));

            const pass = await pass_init.hash_password(Body.Password)

            const saveUser = await connection.query(`insert into User(CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${saveCompany.insertId},'${Body.Name}','CompanyAdmin','${Body.DOB}','${Body.Anniversary}','${Body.MobileNo1}','${Body.MobileNo2}','${Body.PhoneNo}','${Body.Email}','${Body.Address}','${Body.Branch}','${Body.PhotoURL}','${Body.Document}','${Body.LoginName}','${pass}',1,0,0,now(),now(),${Body.CommissionType},${Body.CommissionMode},${Body.CommissionValue},${Body.CommissionValueNB})`)

            console.log(connected("CompanyAdmin User Save SuccessFUlly !!!"));

            // save Company setting

            const datum = {
                CompanyID: `${saveCompany.insertId}`,
                CompanyLanguage: "English",
                CompanyCurrency: "INR",
                CurrencyFormat: "4.2-2",
                DateFormat: "llll",
                CompanyTagline: "",
                BillHeader: "",
                BillFooter: "",
                RewardsPointValidity: "",
                EmailReport: 0,
                MessageReport: 0,
                LogoURL: "",
                WatermarkLogoURL: "",
                LoginTimeStart: "09:00",
                LoginTimeEnd: "22:30",
                Status: 1,
                CreatedBy: 0,
                CreatedOn: now(),
                UpdatedBy: 0,
                UpdatedOn: now(),
                InvoiceOption: "",
                Locale: "en-IN",
                WholeSalePrice: "false",
                RetailRate: "false",
                Composite: "false",
                WelComeNote: `[{"NoteType":"retail","Content":"No Return once sold. No Cash Refund."},{"NoteType":"retail","Content":"50% Advance at the time of booking the order."},{"NoteType":"retail","Content":"Please collect your  spects within 15 days from the date of order."},{"NoteType":"retail","Content":"No risk for breakage at the time of repairing."},{"NoteType":"retail","Content":"Free Computerized EYES* Testing Facility Available."},{"NoteType":"retail","Content":"Repairing work at customer risk."}]`,
                HSNCode: "false",
                Discount: "false",
                GSTNo: "false",
                BillFormat: "",
                SenderID: "",
                SmsSetting: `[{"MessageName":"CustomerOrder","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerDelivery","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerBill","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerCreditNote","MessageID":"","Required":true,"MessageText":""},{"MessageName":"Birthday","MessageID":"","Required":true,"MessageText":""},{"MessageName":"Anniversary","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerEyeTesting","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerContactlensExp","MessageID":"","Required":true,"MessageText":""}]`,
                year: "true",
                month: "true",
                partycode: "true",
                type: "true",
                Rate: "true",
                SubTotal: "false",
                Total: "false",
                CGSTSGST: "false",
                Color1: "#d00c35",
                DataFormat: "0",
                RewardExpiryDate: "120",
                RewardPercentage: "0",
                AppliedReward: "0",
                MobileNo: "",
                FontsStyle: "",
                FontApi: "",
                BarCode: "1",
                FeedbackDate: "7",
                ServiceDate: "180",
                DeliveryDay: "0",
                AppliedDiscount: "false"
            }


            const saveCompanySetting = await connection.query(`insert into companysetting (CompanyID,  CompanyLanguage, CompanyCurrency,CurrencyFormat,DateFormat,CompanyTagline,BillHeader,BillFooter,RewardsPointValidity,EmailReport,MessageReport,LogoURL, WatermarkLogoURL, LoginTimeStart, LoginTimeEnd,Status, CreatedBy , CreatedOn,InvoiceOption, Locale,WholeSalePrice, RetailRate,Composite,WelComeNote,HSNCode,Discount,GSTNo,BillFormat,SenderID, SmsSetting, year, month, partycode, type,Rate,SubTotal,Total,CGSTSGST,Color1,DataFormat,RewardExpiryDate,RewardPercentage,AppliedReward,MobileNo,FontApi,FontsStyle,BarCode,FeedbackDate,ServiceDate,DeliveryDay,AppliedDiscount) values ('${datum.CompanyID}', '${datum.CompanyLanguage}', '${datum.CompanyCurrency}', '${datum.CurrencyFormat}', '${datum.DateFormat}','${datum.CompanyTagline}','${datum.BillHeader}','${datum.BillFooter}','${datum.RewardsPointValidity}','${datum.EmailReport}','${datum.MessageReport}','${datum.LogoURL}','${datum.WatermarkLogoURL}','${datum.LoginTimeStart}', '${datum.LoginTimeEnd}', 1, 0, now(),'${datum.InvoiceOption}', '${datum.Locale}','${datum.WholeSalePrice}','${datum.RetailRate}','${datum.Composite}','${datum.WelComeNote}','${datum.HSNCode}','${datum.Discount}','${datum.GSTNo}','${datum.BillFormat}','${datum.SenderID}', '${datum.SmsSetting}', '${datum.year}', '${datum.month}', '${datum.partycode}','${datum.type}','${datum.Rate}','${datum.SubTotal}','${datum.Total}','${datum.CGSTSGST}','${datum.Color1}','${datum.DataFormat}','${datum.RewardExpiryDate}','${datum.RewardPercentage}','${datum.AppliedReward}','${datum.MobileNo}','${datum.FontApi}','${datum.FontsStyle}','${datum.BarCode}','${datum.FeedbackDate}','${datum.ServiceDate}','${datum.DeliveryDay}','${datum.AppliedDiscount}')`)


            console.log(connected("CompanySetting Save SuccessFUlly !!!"));


            const Company = await connection.query(`select * from company where ID = ${saveCompany.insertId}`)
            const User = await connection.query(`select * from User where ID = ${saveUser.insertId}`)


            response.message = "data save sucessfully"
            response.Company = Company[0]
            response.User = User[0]
            connection.release()
            return res.send(response)
        } catch (error) {
            console.log(error);
            return error
        }
    },
    updatePassword: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (!Body.Password) return res.send({ message: "Invalid Query Data" })

            const pass = await pass_init.hash_password(Body.Password)

            doesExist = await connection.query(`select * from user where ID = '${Body.ID}' and Status = 1`)

            if (!doesExist.length) {
                return res.send({ message: "User does not exists" })
            }

            const updateUser = await connection.query(`update user set Password = '${pass}' where ID = ${Body.ID}`)

            console.log(connected("User Password Updated SuccessFUlly !!!"));


            const User = await connection.query(`select * from user where ID = ${Body.ID}`)



            response.message = "data update sucessfully"
            response.data = User[0]
            res.send(response)
            connection.release()
        } catch (error) {
            return error
        }
    },
    update: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const updateCompany = await connection.query(`update company set Name = '${Body.CompanyName}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', Country='${Body.Country}', State='${Body.State}',City='${Body.City}', Website='${Body.Website}', GSTNo='${Body.GSTNo}', CINNo='${Body.CINNo}', LogoURL='${Body.LogoURL}', Remark='${Body.Remark}',  Plan=${Body.Plan}, Version='${Body.Version}', NoOfShops=${Body.NoOfShops}, EffectiveDate='${Body.EffectiveDate}', CancellationDate='${Body.CancellationDate}',EmailMsg='${Body.EmailMsg}', WhatsappMsg='${Body.WhatsappMsg}', WholeSale='${Body.WholeSale}', RetailPrice='${Body.RetailPrice}', Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Updated SuccessFUlly !!!");


            const Company = await connection.query(`select * from company where ID = ${Body.ID}`)



            response.message = "data update sucessfully"
            response.data = Company[0]
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    delete: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from company where Status = 1 and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            console.log(doesExist, 'cc');

            const deleteCompany = await connection.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Delete SuccessFUlly !!!");

            const deleteUser = await connection.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)

            console.log("User Delete SuccessFUlly !!!");

            const deleteShop = await connection.query(`update shop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)

            console.log("Shop Delete SuccessFUlly !!!");

            response.message = "data delete sucessfully"
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },
    getCompanyById: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            const LoggedOnUser = 0;

            console.log(Body.ID);

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })


            const Company = await connection.query(`select * from company where ID = ${Body.ID} and Status = 1`)


            response.message = "data fetch sucessfully"
            response.data = Company
            connection.release()
            res.send(response)
        } catch (error) {
            return error
        }
    },

    list: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            console.log(req.user.CompanyID , 'req');
            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select * from company where Status = 1`
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
    getUser: async (req, res, next) => {
        try {
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select * from user where Status = 1 and UserGroup = 'CompanyAdmin'`
            let skipQuery = ` LIMIT  ${limit} OFFSET ${skip}`


            let finalQuery = qry + skipQuery;

            console.log(finalQuery);

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
    }

}