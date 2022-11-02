const createError = require('http-errors')
const getConnection = require('../helpers/db')
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


module.exports = {


    login: async (req, res, next) => {
        try {
            const response = { data: null,accessToken: null,refreshToken: null, success: true, message: "", loginCode: 0  }
            const connection = await getConnection.connection();

            const Body = req.body;
            const ip = req.headers.ip ? req.headers.ip : '**********';
            console.log(ip);
            if (_.isEmpty(Body)) res.send({success: false, message: "Invalid Query Data" })

            const User = await connection.query(`select * from user where LoginName = '${Body.LoginName}' and Status = 1`)

            if (!User.length) {
              return res.send({success: false,message:"LoginName doesnot matched"})  
            }
            const isValidPassword = await pass_init.is_valid_password(`${Body.Password}`, `${User[0].Password}`)

            if (!isValidPassword) {
                return res.send({success: false,message:"Password doesnot matched"})    
            }

            if (User[0].UserGroup === 'SuperAdmin') {
                
            const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
            const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)

            response.message = "User Login sucessfully"
            response.data = User[0]
            response.accessToken = accessToken
            response.refreshToken = refreshToken
            res.send(response)
        } else {
            let comment = "";
            let loginCode = 0;
            const company = await connection.query(`select * from company where Status = 1 and ID = '${User[0].CompanyID}'`)

            const setting = await connection.query(`select * from companysetting where CompanyID = '${User[0].CompanyID}'`);

            var expDate = new Date(company[0].CancellationDate);
            var todate = new Date()
            console.log(todate);

            // if (todate >= expDate) {
            //   return res.send({message: "Plan Expired"})  
            // }

            if (User[0].UserGroup === "CompanyAdmin") {
                loginCode = 1;
                comment = "login SuccessFully";
                const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)
                const saveHistory = await connection.query(
                    `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '${ip}', '${comment}')`

                );


                const shop = await connection.query(`select * from shop where Status = 1 and CompanyID = '${User[0].CompanyID}'`)

                return res.send({ message: "User Login sucessfully", data: User[0], Company: company[0], CompanySetting: setting[0], shop: shop, success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
            } else {

                var currentTime = moment().tz("Asia/Kolkata").format("HH:mm");
                if (
                    currentTime >= setting[0].LoginTimeStart &&
                    currentTime < setting[0].LoginTimeEnd
                ) {
                    comment = "login SuccessFully";
                    loginCode = 1;
                } else {
                    comment = "User can not login during this time window";
                    loginCode = 0;
                }

                if (loginCode === 1) {
                    const saveHistory = await connection.query(
                        `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '${ip}', '${comment}')`

                    );
                    const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                    const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)
                    return res.send({ message: "User Login sucessfully", data: User[0], Company: company[0], CompanySetting: setting[0], success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
                } else {
                    const saveHistory = await connection.query(
                        `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '${ip}', '${comment}')`

                    );
                    return res.send({ message: comment, success: false, loginCode: loginCode })
                }

            }

        }

            connection.release()
        }   catch (error) {
            return error
        }
    }
    
}