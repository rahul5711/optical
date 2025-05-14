const createError = require('http-errors')
const pass_init = require('../helpers/generate_password')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
var moment = require("moment");

function match(password, p) {
    return bcrypt.compare(password, p)
    // return password == this.password

}

function formatIDs(fetchInvoice) {
    // Extract BillMasterID values
    var IDs = fetchInvoice.map(function (item) {
        return item.ID;
    });

    // Format output
    var output = '(' + IDs.join(', ') + ')';

    return output;
}

module.exports = {
    create: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            let Body = req.body;
            const LoggedOnUser = 0;
            const { user } = req

            const db = await dbConfig.db(Body.DBkey);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();


            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })


            const [doesExist] = await mysql2.pool.query(`select * from company where Email = '${Body.Email}' and Status = 1`)
            if (doesExist.length) return res.send({ message: `Company Already exist from this Email ${Body.Email}` })


            const [doesExistUser] = await mysql2.pool.query(`select * from user where Email = '${Body.User.Email}' and Status = 1`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.User.Email}` })

            const [doesExistLoginName] = await mysql2.pool.query(`select * from user where LoginName = '${Body.User.LoginName}'`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.User.LoginName}` })

            if (_.isEmpty(Body.User.Password)) res.send({ message: "Invalid Query Data" })

            const [saveCompany] = await mysql2.pool.query(`insert into company (Name,  MobileNo1,  MobileNo2,  PhoneNo,  Address, Country, State, City,  Email,  Website,  GSTNo,  CINNo,  LogoURL,  Remark, SRemark, CAmount,  Plan, Version, NoOfShops,  EffectiveDate,  CancellationDate, EmailMsg, WhatsappMsg, WholeSale,RetailPrice,  Status, CompanyStatus, CreatedBy , CreatedOn, Code, DBkey,PrimeMembership,PhotoClick,CustomerCategory,EmployeeCommission,LoginHistory,DiscountSetting,Quotation,ProductTransfer,BulkTransfer,PettyCash,LocationTracker,StockCheck,RecycleBin,AllExcelImport ) values ('${Body.CompanyName}', '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}', '${Body.Address}', '${Body.Country}', '${Body.State}', '${Body.City}', '${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.LogoURL}','${Body.Remark}','${Body.SRemark}','${Body.CAmount}',${Body.Plan},'${Body.Version}',${Body.NoOfShops}, '${Body.EffectiveDate}', '${Body.CancellationDate}', '${Body.EmailMsg}',  '${Body.WhatsappMsg}','${Body.WholeSale}', '${Body.RetailPrice}', 1, ${Body.CompanyStatus} , ${LoggedOnUser}, now(), '${Body.Code ? Body.Code : 91}', '${Body.DBkey}','${Body.PrimeMembership}','${Body.PhotoClick}','${Body.CustomerCategory}','${Body.EmployeeCommission}','${Body.LoginHistory}','${Body.DiscountSetting}','${Body.Quotation}','${Body.ProductTransfer}','${Body.BulkTransfer}','${Body.PettyCash}','${Body.LocationTracker}','${Body.StockCheck}','${Body.RecycleBin}','${Body.AllExcelImport}' )`)

            const [saveCompany2] = await connection.query(`insert into company (ID,Name,  MobileNo1,  MobileNo2,  PhoneNo,  Address, Country, State, City,  Email,  Website,  GSTNo,  CINNo,  LogoURL,  Remark, SRemark, CAmount,  Plan, Version, NoOfShops,  EffectiveDate,  CancellationDate, EmailMsg, WhatsappMsg, WholeSale,RetailPrice,  Status, CreatedBy , CreatedOn, Code, PrimeMembership,PhotoClick,CustomerCategory,EmployeeCommission,LoginHistory,DiscountSetting,Quotation,ProductTransfer,BulkTransfer,PettyCash,LocationTracker,StockCheck,RecycleBin,AllExcelImport ) values (${saveCompany.insertId},'${Body.CompanyName}', '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}', '${Body.Address}', '${Body.Country}', '${Body.State}', '${Body.City}', '${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.LogoURL}','${Body.Remark}','${Body.SRemark}','${Body.CAmount}',${Body.Plan},'${Body.Version}',${Body.NoOfShops}, '${Body.EffectiveDate}', '${Body.CancellationDate}', '${Body.EmailMsg}',  '${Body.WhatsappMsg}','${Body.WholeSale}', '${Body.RetailPrice}', 1 , ${LoggedOnUser}, now(), '${Body.Code ? Body.Code : 91}', '${Body.PrimeMembership}','${Body.PhotoClick}','${Body.CustomerCategory}','${Body.EmployeeCommission}','${Body.LoginHistory}','${Body.DiscountSetting}','${Body.Quotation}','${Body.ProductTransfer}','${Body.BulkTransfer}','${Body.PettyCash}','${Body.LocationTracker}','${Body.StockCheck}','${Body.RecycleBin}','${Body.AllExcelImport}')`)

            console.log(connected("Company Added SuccessFUlly !!!"));
            console.log(connected("Company2 Added SuccessFUlly !!!"));

            const pass = await pass_init.hash_password(Body.User.Password)

            const [saveUser] = await mysql2.pool.query(`insert into user(CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${saveCompany.insertId},'${Body.User.Name}','CompanyAdmin','${Body.User.DOB}','${Body.User.Anniversary}','${Body.User.MobileNo1}','${Body.User.MobileNo2}','${Body.User.PhoneNo}','${Body.User.Email}','${Body.User.Address}','${Body.User.Branch}','${Body.User.PhotoURL}','${Body.User.Document}','${Body.User.LoginName}','${pass}',1,0,0,now(),now(),${Body.User.CommissionType},${Body.User.CommissionMode},${Body.User.CommissionValue},${Body.User.CommissionValueNB})`)

            const [saveUser2] = await connection.query(`insert into user(ID,CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${saveUser.insertId},${saveCompany.insertId},'${Body.User.Name}','CompanyAdmin','${Body.User.DOB}','${Body.User.Anniversary}','${Body.User.MobileNo1}','${Body.User.MobileNo2}','${Body.User.PhoneNo}','${Body.User.Email}','${Body.User.Address}','${Body.User.Branch}','${Body.User.PhotoURL}','${Body.User.Document}','${Body.User.LoginName}','${pass}',1,0,0,now(),now(),${Body.User.CommissionType},${Body.User.CommissionMode},${Body.User.CommissionValue},${Body.User.CommissionValueNB})`)

            console.log(connected("CompanyAdmin User Save SuccessFUlly !!!"));

            // save Company setting

            const datum = {
                CompanyID: `${saveCompany.insertId}`,
                CompanyLanguage: "English",
                CompanyCurrency: "INR",
                CurrencyFormat: "1.2-2",
                DateFormat: "DD-MM-YYYY h:mm a",
                CompanyTagline: "",
                BillHeader: "",
                BillFooter: "",
                RewardsPointValidity: "",
                EmailReport: 0,
                MessageReport: 0,
                LogoURL: "null",
                WatermarkLogoURL: "null",
                LoginTimeStart: "10:00",
                LoginTimeEnd: "22:00",
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
                BillFormat: "invoice.ejs",
                SenderID: "",
                SmsSetting: `[{"MessageName":"CustomerOrder","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerDelivery","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerBill","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerCreditNote","MessageID":"","Required":true,"MessageText":""},{"MessageName":"Birthday","MessageID":"","Required":true,"MessageText":""},{"MessageName":"Anniversary","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerEyeTesting","MessageID":"","Required":true,"MessageText":""},{"MessageName":"CustomerContactlensExp","MessageID":"","Required":true,"MessageText":""}]`,
                WhatsappSetting: `[{"MessageName1":"Customer_Birthday","MessageText1":"Wish You Happy Birthday! Get Special Discount Today."},{"MessageName1":"Customer_Anniversary","MessageText1":"Happy Anniversary. May you love bird stay happy and blessed always."},{"MessageName1":"Customer_Bill Advance","MessageText1":"Thankyou for shopping with us. We appreciate your trust and business."},{"MessageName1":"Customer_Bill FinalDelivery","MessageText1":"Thankyou for shopping with us. We hope you had good experience. Please Visit Again !"},{"MessageName1":"Customer_Bill OrderReady","MessageText1":"Your order is ready for delivery Please collect it soon."},{"MessageName1":"Customer_Eye Testing","MessageText1":"Just a Gental reminder about your *FREE EYE TESTING* is coming up. Please contact."},{"MessageName1":"Customer_Eye Prescription","MessageText1":"We know the world is full of choices. Thank you for choosing us! For your Eye Testing. We hope you like our services."},{"MessageName1":"Customer_Contactlens Expiry","MessageText1":"Just a Gental reminder about your contact lens Expiry, Please Contact"},{"MessageName1":"Customer_Solution Expiry","MessageText1":"Just a Gental reminder about your Contact Lens Solution Expiry, Please Contact"},{"MessageName1":"Customer_Credit Note","MessageText1":"We appreciate your understanding and value your continued relationship. Please save your credit note"},{"MessageName1":"Customer_Comfort Feedback","MessageText1":"We are curious to know about the comfort and quality of Product that u bought from our store."},{"MessageName1":"Customer_Service","MessageText1":"Just a Gental reminder about your FREE service is coming up. Please contact."}]`,
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
                AppliedDiscount: "false",
                BillingFlow: 1
            }



            const [saveCompanySetting] = await connection.query(`insert into companysetting (CompanyID,  CompanyLanguage, CompanyCurrency,CurrencyFormat,DateFormat,CompanyTagline,BillHeader,BillFooter,RewardsPointValidity,EmailReport,MessageReport,LogoURL, WatermarkLogoURL, LoginTimeStart, LoginTimeEnd,Status, CreatedBy , CreatedOn,InvoiceOption, Locale,WholeSalePrice, RetailRate,Composite,WelComeNote,HSNCode,Discount,GSTNo,BillFormat,SenderID, SmsSetting,WhatsappSetting,EmailSetting,year, month, partycode, type,Rate,SubTotal,Total,CGSTSGST,Color1,DataFormat,RewardExpiryDate,RewardPercentage,AppliedReward,MobileNo,FontApi,FontsStyle,BarCode,FeedbackDate,ServiceDate,DeliveryDay,AppliedDiscount, BillingFlow, IsBirthDayReminder, IsAnniversaryReminder, IsCustomerOrderPendingReminder, IsEyeTesingReminder, IsSolutionExpiryReminder, IsContactLensExpiryReminder, IsComfortFeedBackReminder, IsServiceReminder) values ('${datum.CompanyID}', '${datum.CompanyLanguage}', '${datum.CompanyCurrency}', '${datum.CurrencyFormat}', '${datum.DateFormat}','${datum.CompanyTagline}','${datum.BillHeader}','${datum.BillFooter}','${datum.RewardsPointValidity}','${datum.EmailReport}','${datum.MessageReport}','${datum.LogoURL}','${datum.WatermarkLogoURL}','${datum.LoginTimeStart}', '${datum.LoginTimeEnd}', 1, 0, now(),'${datum.InvoiceOption}', '${datum.Locale}','${datum.WholeSalePrice}','${datum.RetailRate}','${datum.Composite}','${datum.WelComeNote}','${datum.HSNCode}','${datum.Discount}','${datum.GSTNo}','${datum.BillFormat}','${datum.SenderID}', '${datum.SmsSetting}','${datum.WhatsappSetting}','${datum.EmailSetting ? datum.EmailSetting : []}', '${datum.year}', '${datum.month}', '${datum.partycode}','${datum.type}','${datum.Rate}','${datum.SubTotal}','${datum.Total}','${datum.CGSTSGST}','${datum.Color1}','${datum.DataFormat}','${datum.RewardExpiryDate}','${datum.RewardPercentage}','${datum.AppliedReward}','${datum.MobileNo}','${datum.FontApi}','${datum.FontsStyle}','${datum.BarCode}','${datum.FeedbackDate}','${datum.ServiceDate}','${datum.DeliveryDay}','${datum.AppliedDiscount}', ${datum.BillingFlow},'${Body.IsBirthDayReminder}','${Body.IsAnniversaryReminder}','${Body.IsCustomerOrderPendingReminder}','${Body.IsEyeTesingReminder}','${Body.IsSolutionExpiryReminder}','${Body.IsContactLensExpiryReminder}','${Body.IsComfortFeedBackReminder}','${Body.IsServiceReminder}')`)


            console.log(connected("CompanySetting Save SuccessFUlly !!!"));


            // support start

            if (Body.dataAssign === true) {

                const [product] = await mysql2.pool.query(`SELECT ${saveCompany.insertId} as CompanyID ,product.Name, product.HSNCode, product.GSTPercentage,product.GSTType, product.Status, 0 AS CreatedBy, NOW() AS CreatedOn FROM product WHERE Status = 1 AND CompanyID = 0`)
                let result = []
                if (product) {
                    result = JSON.parse(JSON.stringify(product))
                }

                if (result) {

                    for (const item of result) {
                        const [saveProduct] = await connection.query(`insert into product(CompanyID, Name, HSNCode,GSTPercentage,GSTType,Status,CreatedBy,CreatedOn) values(${saveCompany.insertId}, '${item.Name}', '${item.HSNCode}',${item.GSTPercentage}, '${item.GSTType}', 1, 0, now())`)
                    }

                    console.log(connected("Product Assign SuccessFully !!!!"));

                }

                const [productSpec] = await mysql2.pool.query(`select * from productspec where Status = 1 and CompanyID = 0`)
                let result2 = []
                if (productSpec) {
                    result2 = JSON.parse(JSON.stringify(productSpec))
                }

                if (result2) {

                    for (let item of result2) {
                        console.log("item.Type =============>", item.Type);
                        if (item.Type === 'DropDown') {
                            item.SptTableName = item.ProductName + Math.floor(Math.random() * 999999) + 1;
                        } else {
                            item.SptTableName = '0'
                        }
                        console.log("item.SptTableName =============>", item.SptTableName);
                        if (item.Type === 'DropDown') {
                            const [saveSpec] = await connection.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn, Required)values('${item.ProductName}', ${saveCompany.insertId}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now(),${item.Required})`)
                        } else if (item.Type !== 'DropDown') {
                            const [saveSpec] = await connection.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn,Required)values('${item.ProductName}', ${saveCompany.insertId}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now(),${item.Required})`)
                        }
                    }

                    console.log(connected("ProductSpec Assign SuccessFully !!!!"));

                }

                const [support_data] = await mysql2.pool.query(`select * from productspec where Status = 1 and CompanyID = 0 and Type = 'DropDown'`)
                let support_data_result = []
                if (support_data) {
                    support_data_result = JSON.parse(JSON.stringify(support_data))
                }

                let complete_data = []

                if (support_data_result) {
                    complete_data = []
                    for (const item of support_data_result) {

                        let [result] = await mysql2.pool.query(`select * from specspttable where Status = 1 and TableName = '${item.SptTableName}'`)
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
                        let [TableName] = await connection.query(`select * from productspec where Status = 1 and ProductName = '${item.ProductName}' and Type = 'DropDown' and Name = '${item.Name}' and CompanyID = ${saveCompany.insertId}`)
                        if (TableName) {
                            TableName = JSON.parse(JSON.stringify(TableName))
                        }
                        item.SptTableName = TableName[0].SptTableName

                        let [saveData] = await connection.query(`insert into specspttable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${item.SptTableName}','${item.RefID}','${item.TableValue}',1,now(),0)`)
                    }

                    console.log(connected("Spec Data Assign SuccessFully !!!!"));

                }


                let suport_master_table = []
                let [suport_master_table_data] = await mysql2.pool.query(`select * from supportmaster where Status =1 and CompanyID = 0`)

                if (suport_master_table_data) {
                    suport_master_table = JSON.parse(JSON.stringify(suport_master_table_data))
                }

                if (suport_master_table) {
                    for (const item of suport_master_table) {
                        let [result] = await connection.query(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${item.Name}', '${item.TableName}', '${saveCompany.insertId}', 1, '0', now())`)
                    }

                    console.log(connected("suport_master_table_data Data Assign SuccessFully !!!!"));


                }
            }

            // support end


            // Customer Category

            const [fetchCategory] = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = ${saveCompany.insertId} and TableName = 'CustomerCategory'`);

            if (!fetchCategory.length) {

                let suport_master_table = []
                let [suport_master_table_data] = await mysql2.pool.query(`select * from supportmaster where Status =1 and CompanyID = 0 and TableName = 'CustomerCategory'`)

                if (suport_master_table_data) {
                    suport_master_table = JSON.parse(JSON.stringify(suport_master_table_data))
                }

                if (suport_master_table) {
                    for (const item of suport_master_table) {
                        let [result] = await connection.query(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${item.Name}', '${item.TableName}', '${saveCompany.insertId}', 1, '0', now())`)
                    }
                }
                console.log(connected("suport_master_table_data Data Assign SuccessFully !!!!"));
            }



            // customercategory start

            const [againFetchCategory] = await connection.query(`select * from supportmaster where Status = 1 and CompanyID = ${saveCompany.insertId} and TableName = 'CustomerCategory'`);

            let dataList = [
                { CompanyID: `${saveCompany.insertId}`, CategoryID: 0, Fromm: 0, Too: 500, },
                { CompanyID: `${saveCompany.insertId}`, CategoryID: 0, Fromm: 501, Too: 2000, },
                { CompanyID: `${saveCompany.insertId}`, CategoryID: 0, Fromm: 2001, Too: 4000, },
                { CompanyID: `${saveCompany.insertId}`, CategoryID: 0, Fromm: 4001, Too: 7000, },
                { CompanyID: `${saveCompany.insertId}`, CategoryID: 0, Fromm: 7001, Too: 100000, }
            ]

            if (dataList && againFetchCategory) {
                for (let i = 0; i < dataList.length; i++) {
                    dataList[i].CategoryID = againFetchCategory[i].ID
                    const [saveCategory] = await connection.query(`insert into customercategory(CompanyID,CategoryID, Fromm, Too, Status, CreatedOn, CreatedBy) values(${dataList[i].CompanyID}, ${dataList[i].CategoryID},'${dataList[i].Fromm}', '${dataList[i].Too}', 1, now(), ${LoggedOnUser})`)
                }
                console.log(connected("Customer Category SuccessFully !!!!"));
            }

            //  save bill formate

            const billFormate = {
                BillHeader: '3',
                HeaderWidth: '980',
                HeaderHeight: '170',
                HeaderPadding: '5',
                HeaderMargin: '5',
                ImageWidth: '200',
                ImageHeight: '150',
                ImageAlign: 'center',
                ShopNameFont: '25',
                ShopNameBold: '600',
                Color: 'red',
                ShopDetailFont: '17',
                LineSpace: '25',
                CustomerFont: '16',
                CustomerLineSpace: '22',
                TableHeading: '17',
                TableBody: '15',
                NoteFont: '15.5',
                NoteLineSpace: '25',
                WaterMarkWidth: '400',
                WaterMarkHeigh: '400',
                WaterMarkOpecity: '0.1',
                WaterMarkLeft: '25',
                WaterMarkRight: '0'
            };

            const [saveBillFormate] = await connection.query(`insert into billformate(CompanyID, BillHeader, HeaderWidth, HeaderHeight, HeaderPadding, HeaderMargin, ImageWidth, ImageHeight, ImageAlign, ShopNameFont, ShopNameBold, Color, ShopDetailFont, LineSpace, CustomerFont, CustomerLineSpace, TableHeading, TableBody,NoteFont,NoteLineSpace,WaterMarkWidth,WaterMarkHeigh,WaterMarkOpecity,WaterMarkLeft,WaterMarkRight, Status, CreatedOn, CreatedBy)values(${saveCompany.insertId}, '${billFormate.BillHeader}', '${billFormate.HeaderWidth}', '${billFormate.HeaderHeight}', '${billFormate.HeaderPadding}', '${billFormate.HeaderMargin}', '${billFormate.ImageWidth}', '${billFormate.ImageHeight}', '${billFormate.ImageAlign}',  '${billFormate.ShopNameFont}', '${billFormate.ShopNameBold}', '${billFormate.Color}', '${billFormate.ShopDetailFont}', '${billFormate.LineSpace}', '${billFormate.CustomerFont}', '${billFormate.CustomerLineSpace}', '${billFormate.TableHeading}','${billFormate.TablebillFormate}', '${billFormate.NoteFont}','${billFormate.NoteLineSpace}','${billFormate.WaterMarkWidth}','${billFormate.WaterMarkHeigh}','${billFormate.WaterMarkOpecity}','${billFormate.WaterMarkLeft}','${billFormate.WaterMarkRight}', 1,now(),${LoggedOnUser})`)

            console.log(connected("Bill Formate Save SuccessFully !!!!"));


            // save barcodesetting

            const labelSettings = {
                barFontSize: '15',
                barHeight: '45',
                barMarginTop: '-15',
                barWidth: '1',
                barcodeHeight: '0.7',
                barcodeMargin: '0',
                barcodeNameFontSize: '15',
                barcodePadding: '0',
                barcodeWidth: '4.41',
                billHeader: '0',
                floatLeftSide: 'Left',
                floatRightSide: 'Right',
                incTaxFontSize: '10',
                leftWidth: '50',
                mrpFontSize: '16',
                mrpLineHeight: '15',
                marginBottom: '0',
                marginLeft: '0',
                marginRight: '0',
                marginTop: '0',
                paddingBottom: '0',
                paddingLeft: '0',
                paddingRight: '0',
                paddingTop: '0',
                productBrandFontSize: '10',
                productModelFontSize: '10',
                rightWidth: '50',
                MRPHide: 'true',
                taxHide: 'true',
                productNameHide: 'true',
                specialCodeHide: 'false',
                modelName: 'true'
            };

            const [saveBarcodeSetting] = await connection.query(`insert into barcodesetting (CompanyID, barFontSize,  barHeight,  barMarginTop,  barWidth,  barcodeHeight, barcodeMargin, barcodeNameFontSize, barcodePadding,  barcodeWidth,  billHeader,  floatLeftSide,  floatRightSide,  incTaxFontSize,  leftWidth, mrpFontSize, mrpLineHeight,  marginBottom, marginLeft, marginRight,  marginTop,  paddingBottom, paddingLeft, paddingRight, paddingTop,productBrandFontSize,productModelFontSize, rightWidth, MRPHide, taxHide, productNameHide, specialCodeHide, modelName,  Status, CreatedBy , CreatedOn ) values ('${saveCompany.insertId}','${labelSettings.barFontSize}', '${labelSettings.barHeight}', '${labelSettings.barMarginTop}', '${labelSettings.barWidth}', '${labelSettings.barcodeHeight}', '${labelSettings.barcodeMargin}', '${labelSettings.barcodeNameFontSize}', '${labelSettings.barcodePadding}', '${labelSettings.barcodeWidth}','${labelSettings.billHeader}','${labelSettings.floatLeftSide}','${labelSettings.floatRightSide}','${labelSettings.incTaxFontSize}','${labelSettings.leftWidth}','${labelSettings.mrpFontSize}','${labelSettings.mrpLineHeight}','${labelSettings.marginBottom}','${labelSettings.marginLeft}','${labelSettings.marginRight}', '${labelSettings.marginTop}', '${labelSettings.paddingBottom}', '${labelSettings.paddingLeft}',  '${labelSettings.paddingRight}','${labelSettings.paddingTop}', '${labelSettings.productBrandFontSize}', '${labelSettings.productModelFontSize}', '${labelSettings.rightWidth}', '${labelSettings.MRPHide}','${labelSettings.taxHide}','${labelSettings.productNameHide}','${labelSettings.specialCodeHide}','${labelSettings.modelName}',1 , ${LoggedOnUser}, now())`)

            console.log(connected("Barcode Setting Save SuccessFully !!!!"));


            // save supplier for preorder

            const [savesupplier] = await connection.query(`insert into supplier (Sno,Name, CompanyID,  MobileNo1, MobileNo2 , PhoneNo, Address,GSTNo, Email,Website ,CINNo,Fax,PhotoURL,ContactPerson,Remark,GSTType,DOB,Anniversary, Status,CreatedBy,CreatedOn) values ('1','PreOrder Supplier', ${saveCompany.insertId}, 'xxxxxxxxxx', 'xxxxxxxxxx', 'xxxxxxxxxx','Pune','${Body.GSTNo}','${Body.Email}','${Body.Website}','${Body.CINNo}','${Body.Fax}','${Body.PhotoURL}','${Body.ContactPerson}','${Body.Remark}','${Body.GSTType}','${Body.DOB}','${Body.Anniversary}',1,${LoggedOnUser}, now())`)

            console.log(connected("Supplier Save SuccessFully !!!"));


            //  barcode initiated for company

            const barcode = { CompanyID: `${saveCompany.insertId}`, SB: '10000000', PB: '90000000', MB: '00001000' }

            const [savebarcode] = await connection.query(`insert into barcode(CompanyID, SB, PB, MB, Status, CreatedBy, CreatedOn)values(${barcode.CompanyID}, '${barcode.SB}', '${barcode.PB}', '${barcode.MB}',1,0,now())`)

            console.log(connected("Barcode Initiated SuccessFully !!!"));



            // invoice setting initiated for company

            const invoice = {
                ShopID: 0,
                Retail: 1,
                WholeSale: 1,
                Service: 1,
                Order: 1
            }

            const [saveinvoice] = await connection.query(`insert into invoice(CompanyID, ShopID, Retail, WholeSale, Service, invoice.Order, CreatedOn)values(${saveCompany.insertId},0,1,1,1,1,now())`);

            console.log(connected("Invoice Number Setting Initiated SuccessFully !!!"));

            // save default role and permission for company

            const roleData = {
                Name: "EMPLOYEE",
                CompanyID: `${saveCompany.insertId}`,
                Status: 1,
                Permission: `[
                    {"ModuleName":"CompanyInfo","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Employee","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"EmployeeList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Shop","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ShopList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"RolePermission","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CompanySetting","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SmsSetting","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"LoginHistory","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"RecycleBin","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductType","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductMaster","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"AddManagement","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ChargeManagement","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ServiceManagement","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Supplier","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SupplierList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Purchase","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PurchaseList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PurchaseReturn","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PurchaseReturnList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductTransfer","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"OrderPrice","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"OrderPriceList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SearchOrderPriceList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"StockAdjustment","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"BrandNonBrandAssign","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CustomerBill","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"BillingSearch","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"Customer","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"CustomerSearch","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"Doctor","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"DoctorList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Loyalty","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"LoyaltyInvoice","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SupplierOrder","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PurchaseConvert","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SupplierOrderList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Fitter","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"FitterList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"FitterOrder","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"FitterInvoice","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"FitterInvoiceList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Payment","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PaymentList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Payroll","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"payrollList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Expense","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"ExpenseList","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"PettyCashReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SaleReport","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"SaleProductReport","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"SaleServiceReport","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"PurchaseReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PurchaseProductReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PurchaseChargeReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},{"ModuleName":"PurchaseProductExpiryReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"InventoryReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductSummaryReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductTransferReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductReturnReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},{"ModuleName":"ProductReturnProductTypeReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"EyeTestReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"InventoryExcelImport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CustomerExcelImport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"Reminder","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"Quotation","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"QuotationList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"BulkTransfer","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"BulkTransferList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"LensGrid","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"LensGridList","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CustomerPower","MView":true,"Edit":true,"Add":true,"View":true,"Delete":false},
                    {"ModuleName":"LocationTracker","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"Physical","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"PhysicalList","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"ProductCancelReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ProductPendingReport","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"ProductExpiryReport","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"CashCollectionReport","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"SupplierDueAmonutReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"OpeningClosingStockQTY","MView":true,"Edit":true,"Add":true,"View":true,"Delete":true},
                    {"ModuleName":"OpeningClosingStockAMT","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CustomerReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CustomerLedgerReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SupplierLedgerReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"FitterLedgerReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"EmployeeLedgerReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"DoctorLedgerReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"LoyalityReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"LoyalityDetailReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"OldSaleReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"OldSaleDetailReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"GSTFilingReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"PettyCashCashCounterReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"OpeningClosingReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"CustomerRewardReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"ExpensesReport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false},
                    {"ModuleName":"SupplierExcelImport","MView":false,"Edit":false,"Add":false,"View":false,"Delete":false}]`
            }

            const [saveRoleData] = await connection.query(`insert into role(Name,CompanyID,Permission,Status,CreatedBy,CreatedOn)values('${roleData.Name}', ${roleData.CompanyID}, '${roleData.Permission}', 1, '${LoggedOnUser}', now())`)

            console.log(connected("Default Employee Role  Initiated SuccessFully !!!"));


            // setting for creport
            let date = moment(new Date()).format("YYYY-MM-DD")
            let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");

            const [save_c_report_back_date] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, AcceptTransfer, ClosingStock)values('${back_date}', ${saveCompany.insertId},0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)`);
            console.log(connected(`save_c_report Created SuccessFully !!!!`));

            const [save_c_report] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, AcceptTransfer, ClosingStock)values('${date}', ${saveCompany.insertId},0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)`);
            console.log(connected(`save_c_report Created SuccessFully !!!!`));

            const [Company] = await mysql2.pool.query(`select * from company where ID = ${saveCompany.insertId}`)
            const [User] = await mysql2.pool.query(`select * from user where ID = ${saveUser.insertId}`)


            response.message = "data save sucessfully"
            response.Company = Company[0]
            response.User = User[0]
            return res.send(response)
        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    updatePassword: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.ID) return res.send({ message: "Invalid Query Data" })
            if (!Body.Password) return res.send({ message: "Invalid Query Data" })

            const pass = await pass_init.hash_password(Body.Password)

            const [doesExist] = await mysql2.pool.query(`select ID, CompanyID from user where ID = ${Body.ID} and Status = 1`)

            if (!doesExist.length) {
                return res.send({ message: "User does not exists" })
            }



            const [updateUser] = await mysql2.pool.query(`update user set Password = '${pass}' where ID = ${Body.ID}`)

            console.log(connected("User Password Updated SuccessFUlly !!!"));

            if (doesExist.length && doesExist[0].CompanyID !== 0) {
                const db = await dbConfig.dbByCompanyID(doesExist[0].CompanyID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();

                const [updateUser] = await connection.query(`update user set Password = '${pass}' where CompanyID = ${doesExist[0].CompanyID} and UserGroup = 'CompanyAdmin'`)
            }

            const [User] = await mysql2.pool.query(`select * from user where ID = ${Body.ID}`)



            response.message = "data update sucessfully"
            response.data = User[0]
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
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })


            const [doesExist] = await mysql2.pool.query(`select ID from company where Email = '${Body.Email}' and Status = 1 and ID != ${Body.ID}`)
            if (doesExist.length) return res.send({ message: `Company Already exist from this Email ${Body.Email}` })


            const [doesExistUser] = await mysql2.pool.query(`select ID from user where Email = '${Body.User.Email}' and Status = 1 and ID != ${Body.User.ID}`)
            if (doesExistUser.length) return res.send({ message: `User Already exist from this Email ${Body.User.Email}` })

            const [doesExistLoginName] = await mysql2.pool.query(`select ID from user where LoginName = '${Body.User.LoginName}' and ID != ${Body.User.ID}`)
            if (doesExistLoginName.length) return res.send({ message: `LoginName Already exist from this LoginName ${Body.User.LoginName}` })


            const db = await dbConfig.dbByCompanyID(Body.ID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();


            const [updateCompany] = await mysql2.pool.query(`update company set Name = '${Body.CompanyName}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', Country='${Body.Country}', State='${Body.State}',City='${Body.City}', Website='${Body.Website}', GSTNo='${Body.GSTNo}', CINNo='${Body.CINNo}', LogoURL='${Body.LogoURL}', Remark='${Body.Remark}', SRemark='${Body.SRemark}', CAmount='${Body.CAmount}',  Plan=${Body.Plan}, Version='${Body.Version}', NoOfShops=${Body.NoOfShops}, EffectiveDate='${Body.EffectiveDate}', CancellationDate='${Body.CancellationDate}',EmailMsg='${Body.EmailMsg}', WhatsappMsg='${Body.WhatsappMsg}', WholeSale='${Body.WholeSale}', RetailPrice='${Body.RetailPrice}', Status=1, CompanyStatus=${Body.CompanyStatus}, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now(), Code = '${Body.Code ? Body.Code : 91}', PrimeMembership = '${Body.PrimeMembership}',PhotoClick = '${Body.PhotoClick}',CustomerCategory = '${Body.CustomerCategory}',EmployeeCommission = '${Body.EmployeeCommission}',LoginHistory = '${Body.LoginHistory}',DiscountSetting = '${Body.DiscountSetting}',Quotation = '${Body.Quotation}',ProductTransfer = '${Body.ProductTransfer}',BulkTransfer = '${Body.BulkTransfer}',PettyCash = '${Body.PettyCash}',LocationTracker = '${Body.LocationTracker}',StockCheck = '${Body.StockCheck}',RecycleBin = '${Body.RecycleBin}',AllExcelImport = '${Body.AllExcelImport}' where ID = ${Body.ID}`)

            console.log("Company Updated SuccessFUlly !!!");

            const [updateCompany2] = await connection.query(`update company set Name = '${Body.CompanyName}', MobileNo1='${Body.MobileNo1}', MobileNo2='${Body.MobileNo2}', PhoneNo='${Body.PhoneNo}', Address='${Body.Address}', Country='${Body.Country}', State='${Body.State}',City='${Body.City}', Website='${Body.Website}', GSTNo='${Body.GSTNo}', CINNo='${Body.CINNo}', LogoURL='${Body.LogoURL}', Remark='${Body.Remark}', SRemark='${Body.SRemark}', CAmount='${Body.CAmount}',  Plan=${Body.Plan}, Version='${Body.Version}', NoOfShops=${Body.NoOfShops}, EffectiveDate='${Body.EffectiveDate}', CancellationDate='${Body.CancellationDate}',EmailMsg='${Body.EmailMsg}', WhatsappMsg='${Body.WhatsappMsg}', WholeSale='${Body.WholeSale}', RetailPrice='${Body.RetailPrice}', Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now(), Code = '${Body.Code ? Body.Code : 91}', PrimeMembership = '${Body.PrimeMembership}',PhotoClick = '${Body.PhotoClick}',CustomerCategory = '${Body.CustomerCategory}',EmployeeCommission = '${Body.EmployeeCommission}',LoginHistory = '${Body.LoginHistory}',DiscountSetting = '${Body.DiscountSetting}',Quotation = '${Body.Quotation}',ProductTransfer = '${Body.ProductTransfer}',BulkTransfer = '${Body.BulkTransfer}',PettyCash = '${Body.PettyCash}',LocationTracker = '${Body.LocationTracker}',StockCheck = '${Body.StockCheck}',RecycleBin = '${Body.RecycleBin}',AllExcelImport = '${Body.AllExcelImport}' where ID = ${Body.ID}`)

            console.log("Company2 Updated SuccessFUlly !!!");


            const [updateUser] = await mysql2.pool.query(`update user set Name = '${Body.User.Name}',DOB = '${Body.User.DOB}',Anniversary = '${Body.User.Anniversary}',PhotoURL = '${Body.User.PhotoURL}',MobileNo1 = '${Body.User.MobileNo1}',MobileNo2 = '${Body.User.MobileNo2}',PhoneNo = '${Body.User.PhoneNo}',Address = '${Body.User.Address}' where CompanyID = ${Body.ID} and UserGroup = 'CompanyAdmin'`)

            console.log("User Updated SuccessFUlly !!!");

            const [updateUser2] = await connection.query(`update user set Name = '${Body.User.Name}',DOB = '${Body.User.DOB}',Anniversary = '${Body.User.Anniversary}',PhotoURL = '${Body.User.PhotoURL}',MobileNo1 = '${Body.User.MobileNo1}',MobileNo2 = '${Body.User.MobileNo2}',PhoneNo = '${Body.User.PhoneNo}',Address = '${Body.User.Address}' where CompanyID = ${Body.ID} and UserGroup = 'CompanyAdmin'`)

            console.log("User2 Updated SuccessFUlly !!!");


            const [updateCompanySetting] = await connection.query(`update companysetting set IsBirthDayReminder = '${Body.IsBirthDayReminder}', IsAnniversaryReminder = '${Body.IsAnniversaryReminder}',IsCustomerOrderPendingReminder = '${Body.IsCustomerOrderPendingReminder}',IsEyeTesingReminder = '${Body.IsEyeTesingReminder}',IsSolutionExpiryReminder = '${Body.IsSolutionExpiryReminder}',IsContactLensExpiryReminder = '${Body.IsContactLensExpiryReminder}',IsComfortFeedBackReminder = '${Body.IsComfortFeedBackReminder}',IsServiceReminder = '${Body.IsServiceReminder}' where CompanyID = ${Body.ID}`);

            console.log("Company Setting Updated SuccessFUlly !!!");



            const [Company] = await mysql2.pool.query(`select * from company where ID = ${Body.ID}`)

            response.message = "data update sucessfully"
            response.data = Company[0]

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
    updatePlan: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const db = await dbConfig.dbByCompanyID(Body.ID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();


            const [updateCompany] = await mysql2.pool.query(`update company set PrimeMembership = '${Body.PrimeMembership}',PhotoClick = '${Body.PhotoClick}',CustomerCategory = '${Body.CustomerCategory}',EmployeeCommission = '${Body.EmployeeCommission}',LoginHistory = '${Body.LoginHistory}',DiscountSetting = '${Body.DiscountSetting}',Quotation = '${Body.Quotation}',ProductTransfer = '${Body.ProductTransfer}',BulkTransfer = '${Body.BulkTransfer}',PettyCash = '${Body.PettyCash}',LocationTracker = '${Body.LocationTracker}',StockCheck = '${Body.StockCheck}',RecycleBin = '${Body.RecycleBin}',AllExcelImport = '${Body.AllExcelImport}' where ID = ${Body.ID}`)

            console.log("Company Updated SuccessFUlly !!!");

            const [updateCompany2] = await connection.query(`update company set PrimeMembership = '${Body.PrimeMembership}',PhotoClick = '${Body.PhotoClick}',CustomerCategory = '${Body.CustomerCategory}',EmployeeCommission = '${Body.EmployeeCommission}',LoginHistory = '${Body.LoginHistory}',DiscountSetting = '${Body.DiscountSetting}',Quotation = '${Body.Quotation}',ProductTransfer = '${Body.ProductTransfer}',BulkTransfer = '${Body.BulkTransfer}',PettyCash = '${Body.PettyCash}',LocationTracker = '${Body.LocationTracker}',StockCheck = '${Body.StockCheck}',RecycleBin = '${Body.RecycleBin}',AllExcelImport = '${Body.AllExcelImport}' where ID = ${Body.ID}`)

            console.log("Company2 Updated SuccessFUlly !!!");


            const [Company] = await mysql2.pool.query(`select * from company where ID = ${Body.ID}`)

            response.message = "data update sucessfully"
            response.data = Company[0]

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
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from company where Status = 1 and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            const db = await dbConfig.dbByCompanyID(Body.ID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [deleteCompany] = await mysql2.pool.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            const [deleteCompany2] = await connection.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Delete SuccessFUlly !!!");

            const [deleteUser] = await mysql2.pool.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)
            const [deleteUser2] = await connection.query(`update user set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)

            console.log("User Delete SuccessFUlly !!!");

            const [deleteShop] = await connection.query(`update shop set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${Body.ID}`)

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
    deactive: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from company where Status = 1 and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            const db = await dbConfig.dbByCompanyID(Body.ID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [deleteCompany] = await mysql2.pool.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Deactive SuccessFUlly !!!");

            const [deleteCompany2] = await connection.query(`update company set Status=0, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company2 Deactive SuccessFUlly !!!");

            response.message = "data deactive sucessfully"
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
    activecompany: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            if (!Body.ID) res.send({ message: "Invalid Query Data" })

            const [doesExist] = await mysql2.pool.query(`select ID from company where Status = 0 and ID = ${Body.ID}`)

            if (!doesExist.length) {
                return res.send({ message: "company doesnot exist from this id " })
            }

            const db = await dbConfig.dbByCompanyID(Body.ID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [activeCompany] = await mysql2.pool.query(`update company set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company Active SuccessFUlly !!!");


            const [activeCompany2] = await connection.query(`update company set Status=1, UpdatedBy= ${LoggedOnUser}, UpdatedOn=now() where ID = ${Body.ID}`)

            console.log("Company2 Active SuccessFUlly !!!");

            response.message = "data active sucessfully"
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
    updateBarcodeSetting: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            console.log(Body);
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const [doesExist] = await connection.query(`select ID from barcodesetting where Status = 1 and CompanyID = ${CompanyID}`)
            let message = "data save sucessfully";
            if (!doesExist.length) {
                message = "data save sucessfully";
                const [saveCompany] = await connection.query(`insert into barcodesetting (CompanyID, barFontSize,  barHeight,  barMarginTop,  barWidth,  barcodeHeight, barcodeMargin, barcodeNameFontSize, barcodePadding,  barcodeWidth,  billHeader,  floatLeftSide,  floatRightSide,  incTaxFontSize,  leftWidth, mrpFontSize, mrpLineHeight,  marginBottom, marginLeft, marginRight,  marginTop,  paddingBottom, paddingLeft, paddingRight, paddingTop,productBrandFontSize,productModelFontSize, rightWidth, MRPHide, taxHide, productNameHide, specialCodeHide, modelName,  Status, CreatedBy , CreatedOn ) values (${CompanyID},'${Body.barFontSize}', '${Body.barHeight}', '${Body.barMarginTop}', '${Body.barWidth}', '${Body.barcodeHeight}', '${Body.barcodeMargin}', '${Body.barcodeNameFontSize}', '${Body.barcodePadding}', '${Body.barcodeWidth}','${Body.billHeader}','${Body.floatLeftSide}','${Body.floatRightSide}','${Body.incTaxFontSize}','${Body.leftWidth}','${Body.mrpFontSize}','${Body.mrpLineHeight}','${Body.marginBottom}','${Body.marginLeft}','${Body.marginRight}', '${Body.marginTop}', '${Body.paddingBottom}', '${Body.paddingLeft}',  '${Body.paddingRight}','${Body.paddingTop}', '${Body.productBrandFontSize}', '${Body.productModelFontSize}', '${Body.rightWidth}', '${Body.MRPHide}','${Body.taxHide}','${Body.productNameHide}','${Body.specialCodeHide}','${Body.modelName}',1 , ${LoggedOnUser}, now())`)

            } else {
                message = "data update successfully"
                const [updateCompany] = await connection.query(`update barcodesetting set barFontSize='${Body.barFontSize}', barHeight='${Body.barHeight}', barMarginTop='${Body.barMarginTop}', barWidth='${Body.barWidth}', barcodeHeight='${Body.barcodeHeight}', barcodeMargin='${Body.barcodeMargin}', barcodeNameFontSize='${Body.barcodeNameFontSize}', barcodePadding='${Body.barcodePadding}', barcodeWidth='${Body.barcodeWidth}', billHeader='${Body.billHeader}', floatLeftSide='${Body.floatLeftSide}', floatRightSide='${Body.floatRightSide}', incTaxFontSize='${Body.incTaxFontSize}', leftWidth='${Body.leftWidth}', mrpFontSize='${Body.mrpFontSize}', mrpLineHeight='${Body.mrpLineHeight}', marginBottom='${Body.marginBottom}', marginLeft='${Body.marginLeft}', marginRight='${Body.marginRight}', marginTop='${Body.marginTop}', paddingBottom='${Body.paddingBottom}', paddingLeft='${Body.paddingLeft}', paddingRight='${Body.paddingRight}', paddingTop='${Body.paddingTop}', productBrandFontSize='${Body.productBrandFontSize}', productModelFontSize='${Body.productModelFontSize}', rightWidth='${Body.rightWidth}', MRPHide='${Body.MRPHide}', taxHide='${Body.taxHide}', productNameHide='${Body.productNameHide}', specialCodeHide='${Body.specialCodeHide}', modelName='${Body.modelName}', UpdatedBy=${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID}`)

            }
            response.message = message
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
    getBarcodeSettingByCompanyID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (!CompanyID) res.send({ message: "Invalid Query Data" })

            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [fetchData] = await connection.query(`select * from barcodesetting where CompanyID = ${CompanyID}`)

            response.message = "data fetch sucessfully"
            response.data = fetchData
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
    getCompanyById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })


            const [Company] = await mysql2.pool.query(`select company.*, company.Name as CompanyName, user.DOB, user.Anniversary, user.LoginName, user.PhotoURL, user.Name  from company left join user on user.CompanyID = company.ID where company.ID = ${Body.ID}`)

            const [User] = await mysql2.pool.query(`SELECT * FROM user where companyID = ${Body.ID} and user.Status = 1`)

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
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            let page = Body.currentPage;
            let limit = Body.itemsPerPage;
            let skip = page * limit - limit;

            let qry = `select company.*, user.Name as OwnerName, user.PhotoURL AS PhotoURL, user.LoginName, dbconfiguration.DisplayName as AssignDataBaseName from company left join user on user.CompanyID = company.ID left join dbconfiguration on dbconfiguration.DBKey = company.DBKey where  user.UserGroup = 'CompanyAdmin' order by company.ID desc`
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

            let qry = `select ID, Name from company  order by company.ID desc`


            let [data] = await mysql2.pool.query(qry);

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
    Deactivelist: async (req, res, next) => {
        let connection;
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
            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

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
    LoginHistory: async (req, res, next) => {
        let connection;
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


            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

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
    LoginHistoryDetails: async (req, res, next) => {
        let connection;
        try {
            const response = { nonActiveData: [], data: [], count: { ActiveCount: 0, NonActiveCount: 0 }, success: true, message: "" }
            const { DateParem, CompanyParam, CompanyStatusParam } = req.body;
            if (DateParem === "" || DateParem === undefined || DateParem === null) {
                return res.send({ message: "Invalid Query Data" })
            }
            const [fetchCompanies] = await mysql2.pool.query(`select company.ID AS ID, company.Name as Name, MobileNo1 as Mobile, supportmaster.Name AS CompanyStatus from company LEFT JOIN supportmaster ON supportmaster.ID  = company.CompanyStatus  where company.Status = 1 ${CompanyParam} ${CompanyStatusParam} order by ID desc`);
            if (fetchCompanies) {
                for (let item of fetchCompanies) {
                    const [countDetails] = await mysql2.pool.query(`select count(ID) as Count from loginhistory where CompanyID = ${item.ID} ${DateParem}`)
                    let Obj = {
                        CompanyID: item.ID,
                        Name: item.Name,
                        CompanyStatus: item.CompanyStatus,
                        Mobile: item.Mobile,
                        LoginCount: countDetails[0].Count || 0,
                        Details: []
                    }

                    const [FetchDetails] = await mysql2.pool.query(`select user.Name as UserName, user.UserGroup, company.Name as CompanyName,  loginhistory.LoginTime, loginhistory.IpAddress, loginhistory.Comment from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and loginhistory.CompanyID = ${item.ID} ${DateParem}  order by loginhistory.ID desc`);

                    if (FetchDetails.length) {
                        Obj.Details = FetchDetails || []
                    }

                    if (Obj.LoginCount > 0) {
                        response.data.push(Obj)
                    } else {
                        response.nonActiveData.push(Obj)
                    }


                }
            }

            response.count.ActiveCount = response.data.length
            response.count.NonActiveCount = response.nonActiveData.length

            response.message = "data fetch sucessfully"
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
    getUser: async (req, res, next) => {
        let connection;
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

            let [data] = await mysql2.pool.query(finalQuery);
            let [count] = await mysql2.pool.query(qry);

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
    updatecompanysetting: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            const LoggedOnUser = 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            // console.log(Body);


            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.ID) res.send({ message: "Invalid Query Data" })
            // Body.WelComeNote = JSON.stringify(Body.WelComeNote) || '[]'
            // Body.SmsSetting = JSON.stringify(Body.SmsSetting) || '[]'

            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [updateCompanySetting] = await connection.query(`update companysetting set CompanyID = ${Body.CompanyID} , CompanyLanguage = '${Body.CompanyLanguage}' ,  CompanyCurrency = '${Body.CompanyCurrency}' , CurrencyFormat = '${Body.CurrencyFormat}' , DateFormat = '${Body.DateFormat}' , CompanyTagline = '${Body.CompanyTagline}', BillHeader = '${Body.BillHeader}' , BillFooter = '${Body.BillFooter}' ,  RewardsPointValidity = '${Body.RewardsPointValidity}' , EmailReport = ${Body.EmailReport} , MessageReport = ${Body.MessageReport} , LogoURL = '${Body.LogoURL}' , WatermarkLogoURL = '${Body.WatermarkLogoURL}', WholeSalePrice = '${Body.WholeSalePrice}' , RetailRate = '${Body.RetailRate}',Color1 = '${Body.Color1}',HSNCode = '${Body.HSNCode}',Discount = '${Body.Discount}',GSTNo = '${Body.GSTNo}',Rate = '${Body.Rate}',SubTotal = '${Body.SubTotal}',Total = '${Body.Total}',CGSTSGST = '${Body.CGSTSGST}',Composite = '${Body.Composite}', InvoiceOption = '${Body.InvoiceOption}', Locale = '${Body.Locale}', LoginTimeStart = '${Body.LoginTimeStart}', LoginTimeEnd = '${Body.LoginTimeEnd}',BillFormat = '${Body.BillFormat}', Status = 1 , UpdatedOn = now(), UpdatedBy = '${LoggedOnUser}', WelComeNote = '${Body.WelComeNote}' , SenderID = '${Body.SenderID}' , SmsSetting = '${Body.SmsSetting}',WhatsappSetting = '${Body.WhatsappSetting}', EmailSetting='${Body.EmailSetting ? Body.EmailSetting : []}', year = '${Body.year}', month = '${Body.month}', partycode = '${Body.partycode}', DataFormat = '${Body.DataFormat}', type = '${Body.type}', RewardExpiryDate = '${Body.RewardExpiryDate}', RewardPercentage = '${Body.RewardPercentage}', AppliedReward = '${Body.AppliedReward}' , MobileNo = '${Body.MobileNo}', FontApi = '${Body.FontApi}', FontsStyle = '${Body.FontsStyle}', BarCode = '${Body.BarCode}' , FeedbackDate = '${Body.FeedbackDate}' , ServiceDate = '${Body.ServiceDate}', DeliveryDay = '${Body.DeliveryDay}' , AppliedDiscount = '${Body.AppliedDiscount}', CustomerShopWise = '${Body.CustomerShopWise}', EmployeeShopWise = '${Body.EmployeeShopWise}', FitterShopWise = '${Body.FitterShopWise}', DoctorShopWise = '${Body.DoctorShopWise}', SupplierShopWise = '${Body.SupplierShopWise}', IsReminder='${Body.IsReminder}', BillingFlow=${Body.BillingFlow} where ID = ${Body.ID}`)

            console.log("Company Setting Updated SuccessFUlly !!!");


            response.message = "data update sucessfully"
            const [data] = await connection.query(`select * from companysetting where ID = ${Body.ID}`)
            // data[0].WelComeNote = JSON.parse(data[0].WelComeNote) || []
            // data[0].SmsSetting = JSON.parse(data[0].SmsSetting) || []
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

    searchByFeild: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            // let qry = `select company.*, user.Name as OwnerName, user.PhotoURL AS PhotoURL, user.LoginName, dbconfiguration.DisplayName as AssignDataBaseName from company left join user on user.CompanyID = company.ID left join dbconfiguration on dbconfiguration.DBKey = company.DBKey where  user.UserGroup = 'CompanyAdmin' and user.Status = 1 and  user.Name like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1  and user.MobileNo1 like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1 and company.Name like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1 and company.MobileNo1 like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1  and company.Email like '%${Body.searchQuery}%' OR user.Status = 1 and company.Status = 1 and dbconfiguration.DisplayName like '%${Body.searchQuery}%' ` + `Group by company.ID`
            let qry = `select company.*, user.Name as OwnerName, user.PhotoURL AS PhotoURL, user.LoginName, dbconfiguration.DisplayName as AssignDataBaseName from company left join user on user.CompanyID = company.ID left join dbconfiguration on dbconfiguration.DBKey = company.DBKey where  user.UserGroup = 'CompanyAdmin' and user.Name like '%${Body.searchQuery}%' OR user.MobileNo1 like '%${Body.searchQuery}%' OR company.Name like '%${Body.searchQuery}%' OR company.City like '%${Body.searchQuery}%' OR company.Address like '%${Body.searchQuery}%' OR company.MobileNo1 like '%${Body.searchQuery}%' OR company.Email like '%${Body.searchQuery}%' OR dbconfiguration.DisplayName like '%${Body.searchQuery}%' ` + `Group by company.ID`

            let [data] = await mysql2.pool.query(qry);

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

    searchByFeildAdmin: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (Body.searchQuery.trim() === "") return res.send({ message: "Invalid Query Data" })

            let qry = `select loginhistory.*, user.Name as UserName, company.Name as CompanyName from loginhistory left join user on user.ID = loginhistory.UserID left join company on company.ID  = loginhistory.CompanyID where loginhistory.Status = 1 and user.UserGroup = 'CompanyAdmin' and user.Name like '%${Body.searchQuery}%' OR loginhistory.Status = 1 and user.UserGroup = 'CompanyAdmin' and company.Name like '%${Body.searchQuery}%'`

            let [data] = await mysql2.pool.query(qry);

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
    saveBillFormate: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "", count: 0 }
            const Body = req.body;
            if (_.isEmpty(Body)) return res.send({ message: "Invalid Query Data" })
            if (!Body.CompanyID) return res.send({ message: "Invalid CompanyID Data" })

            // const db = await dbConfig.dbByCompanyID(Body.CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [fetch] = await connection.query(`select ID from billformate where CompanyID = ${Body.CompanyID} and Status = 1`)

            if (fetch.length) {
                // update
                const [update] = await connection.query(`update billformate set BillHeader = '${Body.BillHeader}', HeaderWidth = '${Body.HeaderWidth}', HeaderHeight='${Body.HeaderHeight}', HeaderPadding = '${Body.HeaderPadding}', HeaderMargin = '${Body.HeaderMargin}', ImageWidth = '${Body.ImageWidth}', ImageHeight = '${Body.ImageHeight}', ImageAlign = '${Body.ImageAlign}', ShopNameFont = '${Body.ShopNameFont}', ShopNameBold = '${Body.ShopNameBold}', Color = '${Body.Color}', ShopDetailFont = '${Body.ShopDetailFont}', LineSpace = '${Body.LineSpace}', CustomerFont = '${Body.CustomerFont}', CustomerLineSpace = '${Body.CustomerLineSpace}', TableHeading = '${Body.TableHeading}', TableBody = '${Body.TableBody}', NoteFont = '${Body.NoteFont}', NoteLineSpace = '${Body.NoteLineSpace}', WaterMarkWidth = '${Body.WaterMarkWidth}', WaterMarkHeigh = '${Body.WaterMarkHeigh}', WaterMarkOpecity = '${Body.WaterMarkOpecity}', WaterMarkLeft = '${Body.WaterMarkLeft}', WaterMarkRight = '${Body.WaterMarkRight}' where CompanyID = ${Body.CompanyID}`)
            } else {
                // save
                const [save] = await connection.query(`insert into billformate(CompanyID, BillHeader, HeaderWidth, HeaderHeight, HeaderPadding, HeaderMargin, ImageWidth, ImageHeight, ImageAlign, ShopNameFont, ShopNameBold, Color, ShopDetailFont, LineSpace, CustomerFont, CustomerLineSpace, TableHeading, TableBody,NoteFont,NoteLineSpace,WaterMarkWidth,WaterMarkHeigh,WaterMarkOpecity,WaterMarkLeft,WaterMarkRight, Status, CreatedOn, CreatedBy)values(${Body.CompanyID}, '${Body.BillHeader}', '${Body.HeaderWidth}', '${Body.HeaderHeight}', '${Body.HeaderPadding}', '${Body.HeaderMargin}', '${Body.ImageWidth}', '${Body.ImageHeight}', '${Body.ImageAlign}',  '${Body.ShopNameFont}', '${Body.ShopNameBold}', '${Body.Color}', '${Body.ShopDetailFont}', '${Body.LineSpace}', '${Body.CustomerFont}', '${Body.CustomerLineSpace}', '${Body.TableHeading}','${Body.TableBody}', '${Body.NoteFont}','${Body.NoteLineSpace}','${Body.WaterMarkWidth}','${Body.WaterMarkHeigh}','${Body.WaterMarkOpecity}','${Body.WaterMarkLeft}','${Body.WaterMarkRight}', 1,now(),0)`)
            }

            response.message = "data update successfully"
            return res.send(response);

        } catch (error) {
            console.log(error);
            next(error)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getBillFormateById: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const Body = req.body;
            if (!Body.CompanyID) res.send({ message: "Invalid CompanyID Data" })

            // const db = await dbConfig.dbByCompanyID(Body.CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [fetch] = await connection.query(`select * from billformate where CompanyID = ${Body.CompanyID} and Status = 1`)

            response.message = "data fetch sucessfully"
            response.data = fetch || []
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

    processProduct: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const { productData, newCompanyID } = req.body

            if (!productData || !productData.length || !newCompanyID) return res.send({ message: "Invalid productData Data" })

            // if (productData.length) {
            //     for (const item of productData) {
            //         console.log(item);
            //         if (!item.CompanyID) {
            //             return res.send({ message: "Invalid productData CompanyID Data" })
            //         }
            //         if (!item.Name) {
            //             return res.send({ message: "Invalid productData Name Data" })
            //         }
            //         if (!item.HSNCode) {
            //             return res.send({ message: "Invalid productData HSNCode Data" })
            //         }
            //         if (!item.GSTPercentage) {
            //             return res.send({ message: "Invalid productData GSTPercentage Data" })
            //         }
            //         if (!item.GSTType) {
            //             return res.send({ message: "Invalid productData GSTType Data" })
            //         }
            //     }
            // }

            for (let item of productData) {
                const systemID = `${item.CompanyID}-${item.ID}`
                item.CompanyID = newCompanyID
                console.log(`insert into product(SystemID,CompanyID, Name, HSNCode,GSTPercentage,GSTType,Status,CreatedBy,CreatedOn) values('${systemID}',${item.CompanyID}, '${item.Name}', '${item.HSNCode}',${item.GSTPercentage}, '${item.GSTType}', ${item.Status}, 0, now())`);
                const [saveProduct] = await mysql2.pool.query(`insert into product(SystemID,CompanyID, Name, HSNCode,GSTPercentage,GSTType,Status,CreatedBy,CreatedOn) values('${systemID}',${item.CompanyID}, '${item.Name}', '${item.HSNCode}',${item.GSTPercentage}, '${item.GSTType}', ${item.Status}, 0, now())`)
            }

            response.message = "Product Assign SuccessFully"
            response.data = []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },

    processProductSpec: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const { productDataSpec, newCompanyID } = req.body

            if (!productDataSpec || !productDataSpec.length || !newCompanyID) return res.send({ message: "Invalid productDataSpec Data" })

            if (productDataSpec.length) {
                for (const item of productDataSpec) {
                    if (!item.ProductName) {
                        return res.send({ message: "Invalid productData ProductName Data" })
                    }
                    if (!item.CompanyID) {
                        return res.send({ message: "Invalid productData CompanyID Data" })
                    }
                    if (!item.Name) {
                        return res.send({ message: "Invalid productData Name Data" })
                    }
                    if (!item.Seq) {
                        return res.send({ message: "Invalid productData Seq Data" })
                    }
                    if (!item.Type) {
                        return res.send({ message: "Invalid productData Type Data" })
                    }
                    if (!item.Ref) {
                        return res.send({ message: "Invalid productData Ref Data" })
                    }
                    // if (!item.SptTableName) {
                    //     return res.send({ message: "Invalid productData SptTableName Data" })
                    // }
                }
            }

            for (let item of productDataSpec) {
                item.CompanyID = newCompanyID
                if (item.Type === 'DropDown') {
                    item.SptTableName = item.SptTableName + item.CompanyID + item.CompanyID;
                } else {
                    item.SptTableName = '0'
                }
                if (item.Type === 'DropDown') {
                    console.log(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', ${item.CompanyID}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',${item.Status},0,now())`);
                    const [saveSpec] = await mysql2.pool.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', ${item.CompanyID}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',${item.Status},0,now())`)
                } else if (item.Type !== 'DropDown') {
                    console.log(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', ${item.CompanyID}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',${item.Status},0,now())`);
                    const [saveSpec] = await mysql2.pool.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', ${item.CompanyID}, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',${item.Status},0,now())`)
                }
            }

            response.message = "Product Spec Assign SuccessFully"
            response.data = []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    processSpecSpt: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const { productDataSpecSpt, newCompanyID } = req.body

            if (!productDataSpecSpt || !productDataSpecSpt.length || !newCompanyID) return res.send({ message: "Invalid productDataSpecSpt Data" })

            // if (productDataSpecSpt.length) {
            //     for (const item of productDataSpecSpt) {
            //         if (!item.TableName) {
            //             return res.send({ message: "Invalid productData TableName Data" })
            //         }
            //         if (!item.RefID) {
            //             return res.send({ message: "Invalid productData RefID Data" })
            //         }
            //         if (!item.TableValue) {
            //             return res.send({ message: "Invalid productData TableValue Data" })
            //         }
            //         if (!item.CompanyID) {
            //             return res.send({ message: "Invalid productData CompanyID Data" })
            //         }

            //     }
            // }

            for (const item of productDataSpecSpt) {
                item.CompanyID = newCompanyID
                item.TableName = item.TableName + item.CompanyID + item.CompanyID;
                console.log(`insert into specspttable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${item.TableName}','${item.RefID}','${item.TableValue}',${item.Status},now(),0)`);
                let [saveData] = await mysql2.pool.query(`insert into specspttable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${item.TableName}','${item.RefID}','${item.TableValue}',${item.Status},now(),0)`)
            }

            response.message = "Product Spec Spt Assign SuccessFully"
            response.data = []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    processSupportData: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const { supportData, newCompanyID } = req.body

            if (!supportData || !supportData.length || !newCompanyID) return res.send({ message: "Invalid supportData Data" })

            // if (supportData.length) {
            //     for (const item of supportData) {
            //         if (!item.TableName) {
            //             return res.send({ message: "Invalid productData TableName Data" })
            //         }
            //         if (!item.Name) {
            //             return res.send({ message: "Invalid productData Name Data" })
            //         }
            //         if (!item.Status) {
            //             return res.send({ message: "Invalid productData Status Data" })
            //         }
            //         if (!item.CompanyID) {
            //             return res.send({ message: "Invalid productData CompanyID Data" })
            //         }

            //     }
            // }

            for (const item of supportData) {
                item.CompanyID = newCompanyID
                console.log(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${item.Name}', '${item.TableName}', '${item.CompanyID}', ${item.Status}, '0', now())`);
                let [result] = await mysql2.pool.query(`insert into supportmaster (Name,  TableName,  CompanyID,  Status, UpdatedBy , UpdatedOn ) values ('${item.Name}', '${item.TableName}', ${item.CompanyID}, ${item.Status}, '0', now())`)
            }

            response.message = "Support Data Assign SuccessFully"
            response.data = []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    barcodeDetails: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const { CompanyID } = req.body

            if (!CompanyID) return res.send({ message: "Invalid CompanyID Data" })

            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [data] = await connection.query(`select CompanyID, company.Name as CompanyName, barcode.SB as StockBarCode, barcode.PB as PreOrderBarCode, barcode.MB as ManualBarCode, barcode.CreatedOn, barcode.UpdatedOn from barcode left join company on company.ID = barcode.CompanyID where barcode.CompanyID = ${CompanyID}`)

            response.message = "Data fetch SuccessFully"
            response.data = data || []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },
    invoiceDetails: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, user: null, success: true, message: "" }

            const { CompanyID } = req.body

            if (!CompanyID) return res.send({ message: "Invalid CompanyID Data" })

            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [data] = await connection.query(`select invoice.CompanyID, company.Name as CompanyName, IFNULL(shop.Name, 'CompanyWise') as ShopName, shop.AreaName, invoice.Retail, invoice.WholeSale, invoice.Service, invoice.CreatedOn, invoice.UpdatedOn from invoice left join company on company.ID = invoice.CompanyID left join shop on shop.ID = invoice.ShopID where invoice.CompanyID = ${CompanyID}`)

            response.message = "Data fetch SuccessFully"
            response.data = data || []
            return res.send(response);

        } catch (error) {
            next(error)
        }
    },

    getCompanySettingByCompanyID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })
            if (!Body.CompanyID) res.send({ message: "Invalid CompanyID Data" })

            const db = await dbConfig.dbByCompanyID(Body.CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();
            const [Company] = await connection.query(`SELECT CompanyID, OrderPriceList, SearchOrderPriceList, LensGridView, CustomerWithPower, Doctor, LensOrderModule, FitterOrderModule, DoctorLedgerReport, FitterLedgerReport, EyeTestReport FROM companysetting where CompanyID = ${Body.CompanyID}`)

            response.message = "data fetch sucessfully"
            response.data = Company
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
    updateCompanySettingByCompanyID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }

            const Body = req.body;
            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            const {
                CompanyID,
                OrderPriceList,
                SearchOrderPriceList,
                LensGridView,
                CustomerWithPower,
                Doctor,
                LensOrderModule,
                FitterOrderModule,
                DoctorLedgerReport,
                FitterLedgerReport,
                EyeTestReport
            } = Body

            if (!CompanyID) res.send({ message: "Invalid CompanyID Data" })

            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();

            const [Company] = await connection.query(`SELECT CompanyID, OrderPriceList, SearchOrderPriceList, LensGridView, CustomerWithPower, Doctor, LensOrderModule, FitterOrderModule, DoctorLedgerReport, FitterLedgerReport, EyeTestReport FROM companysetting where CompanyID = ${CompanyID}`)

            if (!Company.length) {
                response.success = false
                response.message = "Invalid CompanyID"
                return res.send(response);
            }

            const [updateCompanySetting] = await connection.query(`update companysetting set OrderPriceList = '${OrderPriceList}', SearchOrderPriceList = '${SearchOrderPriceList}', LensGridView = '${LensGridView}', CustomerWithPower = '${CustomerWithPower}', Doctor = '${Doctor}', LensOrderModule = '${LensOrderModule}', FitterOrderModule = '${FitterOrderModule}', DoctorLedgerReport = '${DoctorLedgerReport}', FitterLedgerReport = '${FitterLedgerReport}', EyeTestReport = '${EyeTestReport}' where CompanyID = ${CompanyID}`)

            response.message = "data update sucessfully"
            response.data = Company
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
    getCompanyExpirylist: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "", sumOfCaAmount: 0, sumNoOfShops: 0 }
            const { Parem } = req.body;
            if (Parem === "" || Parem === undefined || Parem === null) {
                return res.send({ message: "Invalid Query Data" })
            }

            let qry = `select company.*, user.Name as OwnerName, user.PhotoURL AS PhotoURL, user.LoginName, dbconfiguration.DisplayName as AssignDataBaseName  from company left join user on user.CompanyID = company.ID left join dbconfiguration on dbconfiguration.DBKey = company.DBKey where user.UserGroup = 'CompanyAdmin' ${Parem}`

            let [data] = await mysql2.pool.query(qry);

            if (data.length) {
                for (let item of data) {
                    response.sumNoOfShops += Number(item.NoOfShops)
                    if (item.CAmount !== "") {
                        response.sumOfCaAmount += Number(item.CAmount);
                    }
                }
            }

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
    getDbConfig: async (req, res, next) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }

            let qry = `select DBKey, DisplayName from dbconfiguration where Status = 1`

            let [data] = await mysql2.pool.query(qry);

            if (data.length) {
                response.data = data
            } else {
                response.data = [
                    {
                        "DBKey": "9752885711",
                        "DisplayName": "DB_1"
                    },
                    {
                        "DBKey": "9131860873",
                        "DisplayName": "DB_2"
                    }
                ]
            }

            response.message = "db config fetch sucessfully"
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

}