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


module.exports = {


    login: async (req, res, next) => {
        try {
            const response = { data: null,accessToken: null,refreshToken: null, success: true, message: "" }
            const connection = await getConnection.connection();

            const Body = req.body;

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
        }

            connection.release()
        }   catch (error) {
            return error
        }
    }
    
}