const getConnection = require('../helpers/db')
const pass_init = require('./generate_password')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const init = async () => {
    try {
        const connection = await getConnection.connection();

        const doesExist = await connection.query(`select * from User where UserGroup = 'SuperAdmin' and Status = 1`)

        if (!doesExist.length) {

            const datum = {
                ID: 0,
                CompanyID: 0,
                Name: 'Relinksys software pvt ltd',
                UserGroup: 'SuperAdmin',
                DOB: '17/05/1995',
                Anniversary: '17/05/1995',
                MobileNo1: '9752885711',
                MobileNo2:'9752885711',
                PhoneNo:'9752885711',
                Email:'rahulberchha@gmail.com',
                Address:'3 sunil nagar indore',
                Branch: 'pune',
                PhotoURL:'',
                Document: [],
                LoginName: 'rahul',
                Password: await pass_init.hash_password('9752885711'),
                Status:1,
                CreatedBy: 0,
                UpdatedBy: 0,
                CreatedOn: new Date(),
                UpdatedOn: new Date(),
                CommissionType:0,
                CommissionMode:0,
                CommissionValue:0,
                CommissionValueNB:0
            }

            const savedata = await connection.query(`insert into User(ID,CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${datum.ID},${datum.CompanyID},'${datum.Name}','${datum.UserGroup}','${datum.DOB}','${datum.Anniversary}','${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${datum.Email}','${datum.Address}','${datum.Branch}','${datum.PhotoURL}','${datum.Document}','${datum.LoginName}','${datum.Password}',${datum.Status},${datum.CreatedBy},${datum.UpdatedBy},now(),now(),${datum.CommissionType},${datum.CommissionMode},${datum.CommissionValue},${datum.CommissionValueNB})`)


           console.log(connected("Super Admin Created SuccessFully !!!!"));
           console.log(savedata); 
        }

        // connection.release()

    } catch (error) {
        throw error
    }
}

init()