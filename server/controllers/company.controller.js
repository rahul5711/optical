const createError = require('http-errors')
const getConnection = require('../helpers/db')
const pass_init = require('../helpers/generate_password')
const _ = require("lodash")

module.exports = {
    create: async (req, res, next) => { 
        try {
            const response = {data: null, success: true, message: ""}
            const connection = await getConnection.connection();
            
            const Body = req.body;
            const LoggedOnUser = 0;
            
             if(_.isEmpty(Body)) res.send({message : "Invalid Query Data"}) 
             
             const saveCompany = await connection.query(`insert into company (Name,  MobileNo1,  MobileNo2,  PhoneNo,  Address, Country, State, City,  Email,  Website,  GSTNo,  CINNo,  LogoURL,  Remark,  Plan, Version, NoOfShops,  EffectiveDate,  CancellationDate, EmailMsg, WhatsappMsg, WholeSale,RetailPrice,  Status, CreatedBy , CreatedOn ) values ('${Body.CompanyName}', '${Body.MobileNo1}', '${Body.MobileNo2}', '${Body.PhoneNo}', '${Body.Address}', '${Body.Country}', '${Body.State}', '${Body.City}', '${Body.Email}','${Body.Website}','${Body.GSTNo}','${Body.CINNo}','${Body.LogoURL}','${Body.Remark}',${Body.Plan},'${Body.Version}',${Body.NoOfShops}, '${Body.EffectiveDate}', '${Body.CancellationDate}', '${Body.EmailMsg}',  '${Body.WhatsappMsg}','${Body.WholeSale}', '${Body.RetailPrice}', 1 , ${LoggedOnUser}, now())`)

             console.log("Company Added SuccessFUlly !!!");

             const pass = await pass_init.hash_password(Body.Password)

             const saveUser = await connection.query(`insert into User(CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${saveCompany.insertId},'${Body.Name}','CompanyAdmin','${Body.DOB}','${Body.Anniversary}','${Body.MobileNo1}','${Body.MobileNo2}','${Body.PhoneNo}','${Body.Email}','${Body.Address}','${Body.Branch}','${Body.PhotoURL}','${Body.Document}','${Body.LoginName}','${pass}',1,0,0,now(),now(),${Body.CommissionType},${Body.CommissionMode},${Body.CommissionValue},${Body.CommissionValueNB})`)

             console.log("CompanyAdmin User Save SuccessFUlly !!!");


         connection.release() 
         res.send("data save sucessfully")  
        } catch (error) {
            return error
        }
    }
 
}