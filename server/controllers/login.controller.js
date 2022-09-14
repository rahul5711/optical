const createError = require('http-errors')
const getConnection = require('../helpers/db')
const pass_init = require('../helpers/generate_password')
var moment = require("moment-timezone");

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


module.exports = {



    login: async (req, res, next) => {
        try {
            const response = { data: null, accessToken: null, refreshToken: null, success: true, message: "", loginCode: 0 }
            const connection = await getConnection.connection();

            const Body = req.body;

            if (_.isEmpty(Body)) res.send({ message: "Invalid Query Data" })

            const User = await connection.query(`select * from user where LoginName = '${Body.LoginName}' and Status = 1`)

            if (!User.length) {
                return res.send({ message: "LoginName doesnot matched" })
            }
            const isValidPassword = await pass_init.is_valid_password(`${Body.Password}`, `${User[0].Password}`)

            if (!isValidPassword) {
                return res.send({ message: "Password doesnot matched" })
            }

            if (User[0].UserGroup === 'SuperAdmin') {

                const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)

                response.message = "User Login sucessfully"
                response.data = User[0]
                response.accessToken = accessToken
                response.refreshToken = refreshToken
                response.loginCode = 1
                res.send(response)
            } else {
                let comment = "";
                let loginCode = 0;
                const company = await connection.query(`select * from company where Status = 1 and ID = '${User[0].CompanyID}'`)

                const setting = await connection.query(`select * from companysetting where CompanyID = '${User[0].CompanyID}'`);

                var expDate = company[0].CancellationDate;
                var todate = moment(new Date()).format('DD/MM/YYYY')
               

                if (todate > expDate) {
                  return res.send({message: "Plan Expired"})  
                }

                if (User[0].UserGroup === "CompanyAdmin") {
                    loginCode = 1;
                    comment = "login SuccessFully";
                    const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                    const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)
                    const saveHistory = await connection.query(
                        `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '******', '${comment}')`

                    );

                    return res.send({ message: "User Login sucessfully", User: User[0], Company: company[0], CompanySetting: setting[0], success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
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
                            `Insert into loginhistory (CompanyID, UserName, UserID, LoginTime, IpAddress, Comment) values (${User[0].CompanyID}, '${User[0].Name}', ${User[0].ID}, now(), '******', '${comment}')`

                        );
                        const accessToken = await signAccessTokenAdmin(`'${User[0].ID}'`)
                        const refreshToken = await signRefreshTokenAdmin(`'${User[0].ID}'`)
                        return res.send({ message: "User Login sucessfully", User: User[0], Company: company[0], CompanySetting: setting[0], success: true, accessToken: accessToken, refreshToken: refreshToken, loginCode: loginCode })
                    } else {
                        return res.send({ message: comment, success: false, loginCode: loginCode })
                    }

                }

            }

            connection.release()
        } catch (error) {
            console.log(error);
            return error
        }
    }


}