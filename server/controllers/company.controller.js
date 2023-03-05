const createError = require('http-errors')
const mysql = require('../helpers/db')
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
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            console.log(Body);
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })


            const doesExist = await connection.query(`select * from company where Email = '${Body.Email}' and Status = 1`)
            if (doesExist.length) return res.send({ message: `Company Already exist from this Email ${Body.Email}` })


            const doesExistUser = await connection.query(`select * from User where Email = '${Body.User.Email}' and Status = 1`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.User.Email}` })

            const doesExistLoginName = await connection.query(`select * from User where LoginName = '${Body.User.LoginName}'`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.User.LoginName}` })

            if (_.isEmpty(Body.User.Password)) res.send({ message: "Invalid Query Data" })

            const saveCompany = await connection.query(`insert into company (Name,  MobileNo1,  MobileNo2,  PhoneNo,  Address, Country, State, City,  Email,  Website,  GSTNo,  CINNo,  LogoURL,  Remark, SRemark, CAmount,  Plan, Version, NoOfShops,  EffectiveDate,  CancellationDate, EmailMsg, WhatsappMsg, WholeSale,RetailPrice,  Status, CreatedBy , CreatedOn ) values ('${Body.CompanyName}', '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}', '${Body.Address}', '${Body.Country}', '${Body.State}', '${Body.City}', '${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.LogoURL}','${Body.Remark}','${Body.SRemark}','${Body.CAmount}',${Body.Plan},'${Body.Version}',${Body.NoOfShops}, '${Body.EffectiveDate}', '${Body.CancellationDate}', '${Body.EmailMsg}',  '${Body.WhatsappMsg}','${Body.WholeSale}', '${Body.RetailPrice}', 1 , ${LoggedOnUser}, now())`)

            console.log(connected("Company Added SuccessFUlly !!!"));

            const pass = await pass_init.hash_password(Body.User.Password)

            const saveUser = await connection.query(`insert into User(CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${saveCompany.insertId},'${Body.User.Name}','CompanyAdmin','${Body.User.DOB}','${Body.User.Anniversary}','${Body.User.MobileNo1}','${Body.User.MobileNo2}','${Body.User.PhoneNo}','${Body.User.Email}','${Body.User.Address}','${Body.User.Branch}','${Body.User.PhotoURL}','${Body.User.Document}','${Body.User.LoginName}','${pass}',1,0,0,now(),now(),${Body.User.CommissionType},${Body.User.CommissionMode},${Body.User.CommissionValue},${Body.User.CommissionValueNB})`)

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
                WelComeNote: `[{"NoteType":"retail","Content":"No Return once sold. No Cash Refund."},{"NoteType":"retail","Content":"50% Advance at the time of booking the order."},{"NoteType":"retail","Content":"Please collect your  spects within 15 days from the date of order."},{"NoteType":"retail","Content":"Free Computerized EYES* Testing Facility Available."},{"NoteType":"retail","Content":"Repairing work at customer risk."}]`,
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


            const product = await connection.query(`SELECT ${saveCompany.insertId} as CompanyID ,product.Name, product.HSNCode, product.GSTPercentage,product.GSTType, product.Status, 0 AS CreatedBy, NOW() AS CreatedOn FROM product WHERE Status = 1 AND CompanyID = 0`)
            let result = []
            if (product) {
                result = JSON.parse(JSON.stringify(product))
            }

            if (result) {

                for (const item of result) {
                    const saveProduct = await connection.query(`insert into product(CompanyID, Name, HSNCode,GSTPercentage,GSTType,Status,CreatedBy,CreatedOn) values(${saveCompany.insertId}, '${item.Name}', '${item.HSNCode}',${item.GSTPercentage}, '${item.GSTType}', 1, 0, now())`)
                }

                console.log(connected("Product Assign SuccessFully !!!!"));

            }

            const productSpec = await connection.query(`select * from productspec where Status = 1 and CompanyID = 0`)
            let result2 = []
            if (productSpec) {
                result2 = JSON.parse(JSON.stringify(productSpec))
            }

            if (result2) {

                for (const item of result2) {
                    if (item.Type === 'DropDown') {
                        item.SptTableName = item.ProductName + Math.floor(Math.random() * 999999) + 1;
                    } else {
                        item.SptTableName = ''
                    }
                    if (item.Type === 'DropDown') {
                        const saveSpec = await connection.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', ${saveCompany.insertId}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now())`)
                    } else if (item.Type !== 'DropDown') {
                        const saveSpec = await connection.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', ${saveCompany.insertId}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now())`)
                    }
                }

                console.log(connected("ProductSpec Assign SuccessFully !!!!"));

            }

            const support_data = await connection.query(`select * from productspec where Status = 1 and CompanyID = 0 and Type = 'DropDown'`)
            let support_data_result = []
            if (support_data) {
                support_data_result = JSON.parse(JSON.stringify(support_data))
            }

            let complete_data = []

            if (support_data_result) {
                complete_data = []
                for (const item of support_data_result) {

                    let result = await connection.query(`select * from specspttable where Status = 1 and TableName = '${item.SptTableName}'`)
                    if (result) {
                        result = JSON.parse(JSON.stringify(result))
                        for (const item2 of result) {
                            item2.ProductName = item.ProductName;
                            item2.Name = item.Name;
                            complete_data.push(item2)
                        }

                    }
                }
            }

            if (complete_data) {
                for (const item of complete_data) {
                    let TableName = await connection.query(`select * from productspec where Status = 1 and ProductName = '${item.ProductName}' and Type = 'DropDown' and Name = '${item.Name}' and CompanyID = ${saveCompany.insertId}`)
                    if (TableName) {
                        TableName = JSON.parse(JSON.stringify(TableName))
                    }
                    item.SptTableName = TableName[0].SptTableName

                    let saveData = await connection.query(`insert into SpecSptTable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${item.SptTableName}','${item.RefID}','${item.TableValue}',1,now(),0)`)
                }

                console.log(connected("Spec Data Assign SuccessFully !!!!"));

            }


            let suport_master_table = []
            let suport_master_table_data = await connection.query(`select * from supportmaster where Status =1 and CompanyID = 0`)

            if (suport_master_table_data) {
                suport_master_table = JSON.parse(JSON.stringify(suport_master_table_data))
            }

            if (suport_master_table) {
                for (const item of suport_master_table) {
                    let result = await connection.query(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${item.Name}', '${item.TableName}', '${saveCompany.insertId}', 1, '0', now())`)
                }

                console.log(connected("suport_master_table_data Data Assign SuccessFully !!!!"));


            }


            //  barcode initiated for company

            const barcode = { CompanyID: saveCompany.insertId, SB: '10000', PB: '90000', MB: '00001' }

            const savebarcode = await connection.query(`insert into barcode(CompanyID, SB, PB, MB, Status, CreatedBy, CreatedOn)values(${barcode.CompanyID}, '${barcode.SB}', '${barcode.PB}', '${barcode.MB}',1,0,now())`)

            console.log(connected("Barcode Initiated SuccessFully !!!"));

            const Company = await connection.query(`select * from company where ID = ${saveCompany.insertId}`)
            const User = await connection.query(`select * from User where ID = ${saveUser.insertId}`)


            response.message = "data save sucessfully"
            response.Company = Company[0]
            response.User = User[0]
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
    updatePassword: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

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
            // connection.release()
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

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })


            const doesExist = await connection.query(`select * from company where Email = '${Body.Email}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExist.length) return res.send({ message: `Company Already exist from this Email ${Body.Email}` })


            const doesExistUser = await connection.query(`select * from User where Email = '${Body.User.Email}' and Status = 1 and ID != ${Body.User.ID}`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.User.Email}` })

            const doesExistLoginName = await connection.query(`select * from User where LoginName = '${Body.User.LoginName}' and ID != ${Body.User.ID}`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.User.LoginName}` })

            const updateCompany = await connection.query(`update company set Name = '${Body.CompanyName}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', Country='${Body.Country}', State='${Body.State}',City='${Body.City}', Website='${Body.Website}', GSTNo='${Body.GSTNo}', CINNo='${Body.CINNo}', LogoURL='${Body.LogoURL}', Remark='${Body.Remark}', SRemark='${Body.SRemark}', CAmount='${Body.CAmount}',  Plan=${Body.Plan}, Version='${Body.Version}', NoOfShops=${Body.NoOfShops}, EffectiveDate='${Body.EffectiveDate}', CancellationDate='${Body.CancellationDate}',EmailMsg='${Body.EmailMsg}', WhatsappMsg='${Body.WhatsappMsg}', WholeSale='${Body.WholeSale}', RetailPrice='${Body.RetailPrice}', Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Updated SuccessFUlly !!!");


            const updateUser = await connection.query(`update user set Name = '${Body.User.Name}',DOB = '${Body.User.DOB}',Anniversary = '${Body.User.Anniversary}',PhotoURL = '${Body.User.PhotoURL}',MobileNo1 = '${Body.User.MobileNo1}',MobileNo2 = '${Body.User.MobileNo2}',PhoneNo = '${Body.User.PhoneNo}',Address = '${Body.User.Address}' where CompanyID = ${Body.ID} and UserGroup = 'CompanyAdmin'`)

            console.log("User Updated SuccessFUlly !!!");


            const Company = await connection.query(`select * from company where ID = ${Body.ID}`)

            response.message = "data update sucessfully"
            response.data = Company[0]
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
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from company where Status = 1 and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            const deleteCompany = await connection.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Delete SuccessFUlly !!!");

            const deleteUser = await connection.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)

            console.log("User Delete SuccessFUlly !!!");

            const deleteShop = await connection.query(`update shop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)

            console.log("Shop Delete SuccessFUlly !!!");

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
    deactive: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from company where Status = 1 and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            const deleteCompany = await connection.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Deactive SuccessFUlly !!!");

            response.message = "data deactive sucessfully"
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
    activecompany: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const doesExist = await connection.query(`select * from company where Status = 0 and ID = '${Body.ID}'`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            const activeCompany = await connection.query(`update company set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Active SuccessFUlly !!!");

            response.message = "data active sucessfully"
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
    getCompanyById: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })


            const Company = await connection.query(`select company.*, company.Name as CompanyName, user.DOB, user.Anniversary, user.LoginName, user.PhotoURL, user.Name  from company left join user on user.CompanyID = company.ID where company.ID = ${Body.ID} and company.Status = 1`)

            const User = await connection.query(`SELECT * FROM user where companyID = ${Body.ID} and user.Status = 1`)

            if (Company[0].WhatsappMsg === 'false') {
                Company[0].WhatsappMsg = false
            } else {
                Company[0].WhatsappMsg = true
            }

            if (Company[0].EmailMsg === 'false') {
                Company[0].EmailMsg = false
            } else {
                Company[0].EmailMsg = true
            }

            if (Company[0].WholeSale === 'false') {
                Company[0].WholeSale = false
            } else {
                Company[0].WholeSale = true
            }

            if (Company[0].RetailPrice === 'false') {
                Company[0].RetailPrice = false
            } else {
                Company[0].RetailPrice = true
            }
            response.message = "data fetch sucessfully"
            response.data = Company
            response.user = User
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

    list: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select company.*, user.Name as OwnerName, user.PhotoURL AS PhotoURL, user.LoginName from company left join user on user.CompanyID = company.ID where  user.UserGroup = 'CompanyAdmin' order by company.ID desc`
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
    Deactivelist: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select company.*, user.Name as OwnerName, user.LoginName from company left join user on user.CompanyID = company.ID where company.Status = 0 and user.UserGroup = 'CompanyAdmin' order by company.ID desc`
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
    LoginHistory: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }
            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup = 'CompanyAdmin' order by loginhistory.ID desc`
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
    getUser: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select * from user where Status = 1 and UserGroup != 'Employee' order by ID desc`
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
    updatecompanysetting: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })
            // Body.WelComeNote = JSON.stringify(Body.WelComeNote) || '[]'
            // Body.SmsSetting = JSON.stringify(Body.SmsSetting) || '[]'

            const updateCompanySetting = await connection.query(`update companysetting set CompanyID = ${Body.CompanyID} , CompanyLanguage = '${Body.CompanyLanguage}' ,  CompanyCurrency = '${Body.CompanyCurrency}' , CurrencyFormat = '${Body.CurrencyFormat}' , DateFormat = '${Body.DateFormat}' , CompanyTagline = '${Body.CompanyTagline}', BillHeader = '${Body.BillHeader}' , BillFooter = '${Body.BillFooter}' ,  RewardsPointValidity = '${Body.RewardsPointValidity}' , EmailReport = ${Body.EmailReport} , MessageReport = ${Body.MessageReport} , LogoURL = '${Body.LogoURL}' , WatermarkLogoURL = '${Body.WatermarkLogoURL}', WholeSalePrice = '${Body.WholeSalePrice}' , RetailRate = '${Body.RetailRate}',Color1 = '${Body.Color1}',HSNCode = '${Body.HSNCode}',Discount = '${Body.Discount}',GSTNo = '${Body.GSTNo}',Rate = '${Body.Rate}',SubTotal = '${Body.SubTotal}',Total = '${Body.Total}',CGSTSGST = '${Body.CGSTSGST}',Composite = '${Body.Composite}', InvoiceOption = '${Body.InvoiceOption}', Locale = '${Body.Locale}', LoginTimeStart = '${Body.LoginTimeStart}', LoginTimeEnd = '${Body.LoginTimeEnd}',BillFormat = '${Body.BillFormat}', Status = 1 , UpdatedOn = now(), UpdatedBy = '${LoggedOnUser}', WelComeNote = '${Body.WelComeNote}' , SenderID = '${Body.SenderID}' , SmsSetting = '${Body.SmsSetting}', year = '${Body.year}', month = '${Body.month}', partycode = '${Body.partycode}', DataFormat = '${Body.DataFormat}', type = '${Body.type}', RewardExpiryDate = '${Body.RewardExpiryDate}', RewardPercentage = '${Body.RewardPercentage}', AppliedReward = '${Body.AppliedReward}' , MobileNo = '${Body.MobileNo}', FontApi = '${Body.FontApi}', FontsStyle = '${Body.FontsStyle}', BarCode = '${Body.BarCode}' , FeedbackDate = '${Body.FeedbackDate}' , ServiceDate = '${Body.ServiceDate}', DeliveryDay = '${Body.DeliveryDay}' , AppliedDiscount = '${Body.AppliedDiscount}' where ID = ${Body.ID}`)

            console.log("Company Setting Updated SuccessFUlly !!!");


            response.message = "data update sucessfully"
            const data = await connection.query(`select * from companysetting where ID = ${Body.ID}`)
            // data[0].WelComeNote = JSON.parse(data[0].WelComeNote) || []
            // data[0].SmsSetting = JSON.parse(data[0].SmsSetting) || []
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

    searchByFeild: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select company.*, user.Name as OwnerName from company left join user on user.CompanyID = company.ID where company.Status = 1 and company.Status = 1 and user.UserGroup = 'CompanyAdmin' and user.Status = 1 and  user.Name like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1  and user.MobileNo1 like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1 and company.Name like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1 and company.MobileNo1 like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1  and company.Email like '%${Body.searchQuery}%'`

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

    searchByFeildAdmin: async (req, res, next) => {
        const connection = await mysql.connection();
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup = 'CompanyAdmin' and user.Name like '%${Body.searchQuery}%' OR loginhistory.Status = 1 and user.UserGroup = 'CompanyAdmin' and company.Name like '%${Body.searchQuery}%'`

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
    }

}