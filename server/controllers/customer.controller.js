const createError = require('http-errors')
const getConnection = require('../helpers/db')
const pass_init = require('../helpers/generate_password')
const {Idd} = require('../helpers/helper_function')
const _ = require("lodash")
const bcrypt = require('bcrypt')
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;

module.exports = {
    save: async (req, res, next) => {
        try {
            console.log(req.user);
            const response = { data: null, success: true, message: "" }
            const connection = await getConnection.connection();
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;

            const {Name,Sno,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,Age,Anniversary,ReferenceType,Gender,Other,Remarks,VisitDate,spectacle_rx,contact_lens_rx,other_rx} = req.body

            if (Name.trim() === "" || Name === undefined) {
                return res.send({message: "Invalid Name"})
            }
            const Id = await Idd(req)
            const customer = await connection.query(`insert into customer(Idd,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Status,CreatedBy,CreatedOn,VisitDate) values('${Id}', '${Name}','${Sno}',${CompanyID},'${MobileNo1}','${MobileNo2}','${PhoneNo}','${Address}','${GSTNo}','${Email}','${PhotoURL}','${DOB}','${Age}','${Anniversary}','${ReferenceType}','${Gender}','${Other}','${Remarks}',1,'${LoggedOnUser}',now(),'${VisitDate}')`);

            console.log(connected("Customer Added SuccessFUlly !!!"));


        } catch (error) {
            console.log(error);
            return error
        }
    }
}
