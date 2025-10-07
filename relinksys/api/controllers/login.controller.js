const createError = require('http-errors')
const pass_init = require('../helpers/generate_password')
const {
    signAccessTokenAdmin,
    signRefreshTokenAdmin,
    verifyRefreshTokenAdmin,
} = require('../helpers/jwt_helper')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
var moment = require("moment-timezone");
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');


module.exports = {


    login: async (req, res, next) => {
        let connection;
        let DB;
        try {
            const response = { data: null, accessToken: null, refreshToken: null, success: true, message: "", loginCode: 0 }
            DB = await mysql2.pool.getConnection();

            const Body = req.body;
            const ip = req.headers.ip ? req.headers.ip : '**********';
            if (_.isEmpty(Body)) res.send({ success: false, message: "Invalid Query Data" })

            const [User] = await DB.query(`select * from user where LoginName = '${Body.LoginName}' and Status = 1`)
            // console.log(!User.length, 'User');

            if (!User.length) {
                return res.send({ success: false, message: "LoginName doesnot matched" })
            }
            const isValidPassword = await pass_init.is_valid_password(`${Body.Password}`, `${User[0].Password}`)

            if (!isValidPassword) {
                return res.send({ success: false, message: "Password doesnot matched" })
            }
            User[0].is_direct = false
            if (User.length && User[0].UserGroup === 'SuperAdmin') {

                const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)

                response.message = "User Login sucessfully"
                response.data = User[0]
                response.accessToken = accessToken
                response.refreshToken = refreshToken
                await DB.query("COMMIT");
                return res.send(response);
            } else {
                let comment = "";
                let comment2 = ``;
                let loginCode = 0;
                const db = await dbConfig.dbByCompanyID(User[0].CompanyID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();
                const [company] = await DB.query(`select * from company where Status = 1 and ID = '${User[0].CompanyID}'`)
                if (!company.length) {
                    return res.send({ success: false, message: "Your Server Plan Expired #!" })
                }

                const [setting] = await connection.query(`select * from companysetting where CompanyID = '${User[0].CompanyID}'`);

                var expDate = new Date(company[0].CancellationDate);
                var todate = new Date()
                if (todate >= expDate) {
                    return res.send({ message: "Your Server Plan Expired !" })
                }

                if (User[0].UserGroup === "CompanyAdmin") {
                    // console.log("CompanyAdmin==========================>", User);
                    loginCode = 1;
                    comment = "login SuccessFully";
                    const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                    const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)
                    const [saveHistory] = await DB.query(
                        `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '${ip}', '${comment}')`

                    );
                    const [shop] = await connection.query(`select * from shop where Status = 1 and CompanyID = '${User[0].CompanyID}'`)
                    return res.send({ message: "User Login sucessfully", data: User[0], Company: company[0], CompanySetting: setting[0], shop: shop, success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
                } else {

                    var currentTime = moment().tz("Asia/Kolkata").format("HH:mm");
                    if (
                        // true
                        currentTime >= setting[0].LoginTimeStart &&
                        currentTime < setting[0].LoginTimeEnd
                    ) {
                        comment = "login SuccessFully";
                        loginCode = 1;
                    } else if (User[0].ID === 20) {
                        comment = "login SuccessFully";
                        loginCode = 1;
                    } else {
                        comment2 = `⏰ Shop closed: You attempted to log in outside of business hours. Please try again during working hours.`;
                        comment = "User can not login during this time window";
                        loginCode = 0;
                    }

                    if (loginCode === 1) {
                        const [saveHistory] = await DB.query(
                            `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '${ip}', '${comment}')`

                        );
                        const [shop] = await connection.query(`select usershop.*, shop.ID as ID, role.Name as RoleName, shop.Name as ShopName, shop.Name as Name, shop.AreaName as AreaName, user.Name as UserName, shop.Address, shop.MobileNo1, shop.MobileNo2, shop.PhoneNo, shop.Email, shop.Website, shop.GSTNo, shop.CINNo, shop.BarcodeName, shop.Discount, shop.GSTnumber, shop.LogoURL, shop.ShopTiming, shop.WelcomeNote, shop.HSNCode, shop.CustGSTNo, shop.Rate, shop.Discounts, shop.Tax, shop.SubTotal, shop.Total, shop.BillShopWise, shop.RetailBill, shop.WholesaleBill, shop.ShopStatus, shop.BillName,shop.AdminDiscount,shop.WaterMark,shop.DiscountSetting,shop.Signature, shop.PerOrder,shop.Manual,shop.Optometrist,shop.ShowPower,shop.ProductGST  from usershop left join role on role.ID = usershop.RoleID left join shop on shop.ID = usershop.ShopID left join user on user.ID = usershop.UserID where usershop.Status = 1 and usershop.UserID = ${User[0].ID}`)
                        const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                        const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)
                        return res.send({ message: "User Login sucessfully", data: User[0], Company: company[0], CompanySetting: setting[0], shop: shop, success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
                    } else {
                        const [saveHistory] = await DB.query(
                            `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '${ip}', '${comment}')`

                        );
                        //  console.log("saveHistory ==================>", saveHistory);
                        return res.send({ message: comment2, success: false, loginCode: loginCode })
                    }

                }

            }
        } catch (err) {
            console.log(err);
            next(err)
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

    companylogin: async (req, res, next) => {
        let connection;
        let DB;
        try {

            const Body = req.body;
            const ip = req.headers.ip ? req.headers.ip : '**********';
            if (_.isEmpty(Body)) res.send({ success: false, message: "Invalid Query Data" })
            if (!Body.LoginName) res.send({ success: false, message: "Invalid Query Data" })

            DB = await mysql2.pool.getConnection();


            const [User] = await DB.query(`select * from user where LoginName = '${Body.LoginName}' and Status = 1`)

            if (!User.length) {
                return res.send({ success: false, message: "LoginName doesnot matched" })
            }


            let comment = "";
            let loginCode = 0;

            const db = await dbConfig.dbByCompanyID(User[0].CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            const [company] = await DB.query(`select * from company where ID = '${User[0].CompanyID}'`)

            const [setting] = await connection.query(`select * from companysetting where CompanyID = '${User[0].CompanyID}'`);


            loginCode = 1;
            comment = "login SuccessFully";
            const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
            const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)

            const [shop] = await connection.query(`select * from shop where Status = 1 and CompanyID = '${User[0].CompanyID}'`)

            User[0].is_direct = true
            return res.send({ message: "User Login sucessfully", data: User[0], Company: company[0], CompanySetting: setting[0], shop: shop, success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
        } catch (err) {
            next(err)
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
    }

}